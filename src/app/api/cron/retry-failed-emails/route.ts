import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { sendEmailWithAttachment } from "@/lib/email";

/**
 * Cron Job: Retry Failed Emails
 * Schedule: Every 6 hours
 * Vercel Cron: 0 *\/6 * * *
 * Security: Bearer token CRON_SECRET required
 *
 * CRITICAL FIX #6: Retry mechanism with exponential backoff
 */
export async function GET(req: Request) {
  try {
    // Security: Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    log.info("Retry failed emails cron job started", { context: "cron" });
    const start = Date.now();

    // Get pending retries (max 3 attempts per email)
    const pendingRetries = await db.schedulerLog.findMany({
      where: {
        jobName: "email-retry-queue",
        status: "PENDING",
      },
      orderBy: { createdAt: "asc" },
      take: 100, // Process max 100 at a time
    });

    if (pendingRetries.length === 0) {
      await db.schedulerLog.create({
        data: {
          jobName: "retry-failed-emails",
          status: "SUCCESS",
          message: "No pending retries found.",
          duration: Date.now() - start,
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: "No pending retries",
        timestamp: new Date().toISOString()
      });
    }

    let successCount = 0;
    let failedCount = 0;
    const permanentFailures: string[] = [];

    for (const retry of pendingRetries) {
      try {
        const metadata = retry.metadata as any;
        const attemptCount = (metadata.attemptCount || 0) + 1;
        const MAX_ATTEMPTS = 3;

        // Check if max attempts reached
        if (attemptCount > MAX_ATTEMPTS) {
          // Mark as permanent failure
          await db.schedulerLog.update({
            where: { id: retry.id },
            data: { 
              status: "FAILED",
              message: `Max retry attempts (${MAX_ATTEMPTS}) reached`,
              metadata: {
                ...metadata,
                attemptCount,
                permanentFailure: true,
                failedAt: new Date().toISOString()
              }
            }
          });
          permanentFailures.push(metadata.userEmail || metadata.enrollmentId);
          continue;
        }

        // Exponential backoff: wait longer between retries
        const hoursSinceCreated = (Date.now() - new Date(retry.createdAt).getTime()) / (1000 * 60 * 60);
        const backoffHours = Math.pow(2, attemptCount - 1); // 1h, 2h, 4h
        
        if (hoursSinceCreated < backoffHours) {
          // Too soon to retry
          continue;
        }

        // Retry sending email
        const reminderType = metadata.reminderType || "remindedAt1d";
        const reminderDays = metadata.reminderDays || 1;
        const courseTitle = metadata.courseTitle || "Pelatihan";
        const userName = metadata.userName || "Karyawan";
        const userEmail = metadata.userEmail;

        if (!userEmail) {
          throw new Error("No email address in metadata");
        }

        // Get enrollment to check if still needs reminder
        const enrollment = await db.enrollment.findUnique({
          where: { id: metadata.enrollmentId },
          select: { 
            [reminderType]: true,
            status: true,
            deadline: true
          }
        });

        // Skip if already reminded or no longer IN_PROGRESS
        if (!enrollment || enrollment[reminderType] || enrollment.status !== "IN_PROGRESS") {
          await db.schedulerLog.update({
            where: { id: retry.id },
            data: { 
              status: "SKIPPED",
              message: "Enrollment state changed, reminder no longer needed"
            }
          });
          continue;
        }

        // Retry email send
        await sendEmailWithAttachment({
          to: userEmail,
          subject: `[Reminder - Retry] Pelatihan: ${courseTitle}`,
          html: `
            <div style="font-family: sans-serif; color: #0F1C3F;">
              <div style="background-color: #0F1C3F; padding: 20px; text-align: center;">
                <h1 style="color: #E8A020; margin: 0;">Peringatan Tenggat Waktu</h1>
              </div>
              <div style="padding: 20px; border: 1px solid #e2e8f0;">
                <p>Halo <b>${userName}</b>,</p>
                <p>Kami mengingatkan bahwa pelatihan <b>"${courseTitle}"</b> harus segera diselesaikan dalam <b>${reminderDays} hari</b> lagi.</p>
                <div style="padding: 15px; background-color: #f8fafc; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><b>Tenggat Waktu:</b> ${enrollment.deadline ? new Date(enrollment.deadline).toLocaleDateString("id-ID", { dateStyle: "long" }) : "—"}</p>
                </div>
                <p>Segera selesaikan materi dan ujian untuk menghindari eskalasi ke Department Head.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXTAUTH_URL}/courses" style="background-color: #0F1C3F; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ke Dashboard Pelatihan</a>
                </div>
                <hr />
                <p style="font-size: 12px; color: #64748b;">Pesan ini dikirim secara otomatis oleh E-Learning BNI Finance System.</p>
              </div>
            </div>
          `,
        });

        // Mark enrollment as reminded
        await db.enrollment.update({
          where: { id: metadata.enrollmentId },
          data: { [reminderType]: new Date() }
        });

        // Mark retry as successful
        await db.schedulerLog.update({
          where: { id: retry.id },
          data: { 
            status: "SUCCESS",
            message: `Email sent successfully on attempt ${attemptCount}`,
            metadata: {
              ...metadata,
              attemptCount,
              succeededAt: new Date().toISOString()
            }
          }
        });

        successCount++;
        
        // Small delay to avoid overwhelming SMTP
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err: any) {
        log.error(`Retry failed for ${retry.id}`, {
          context: "cron",
          retryId: retry.id,
          error: err
        });
        
        // Update metadata with attempt count
        const metadata = retry.metadata as any;
        const attemptCount = (metadata.attemptCount || 0) + 1;
        
        await db.schedulerLog.update({
          where: { id: retry.id },
          data: {
            metadata: {
              ...metadata,
              attemptCount,
              lastAttemptAt: new Date().toISOString(),
              lastError: err.message
            }
          }
        }).catch(updateErr => {
          log.error(`Failed to update retry metadata for ${retry.id}`, {
            context: "cron",
            retryId: retry.id,
            error: updateErr
          });
        });

        failedCount++;
      }
    }

    // Log summary
    await db.schedulerLog.create({
      data: {
        jobName: "retry-failed-emails",
        status: failedCount === 0 ? "SUCCESS" : "PARTIAL_SUCCESS",
        message: `Processed ${pendingRetries.length} retries. ${successCount} succeeded, ${failedCount} failed, ${permanentFailures.length} permanent failures.`,
        duration: Date.now() - start,
        metadata: {
          processed: pendingRetries.length,
          succeeded: successCount,
          failed: failedCount,
          permanentFailures
        }
      }
    });

    log.info("Retry failed emails cron job completed", {
      context: "cron",
      processed: pendingRetries.length,
      succeeded: successCount,
      failed: failedCount,
      permanentFailures: permanentFailures.length
    });

    return NextResponse.json({ 
      success: true, 
      result: {
        processed: pendingRetries.length,
        succeeded: successCount,
        failed: failedCount,
        permanentFailures: permanentFailures.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    log.error("Retry failed emails cron job failed", { context: "cron", error });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Allow POST as well for manual triggers
export async function POST(req: Request) {
  return GET(req);
}
