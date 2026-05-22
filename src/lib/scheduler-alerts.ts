import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { sendEmailWithAttachment } from "@/lib/email";

/**
 * ─── SCHEDULER ALERTING SYSTEM ──────────────────────────────────────────────
 * Sends alerts to admin when scheduler jobs fail
 */

interface AlertConfig {
  jobName: string;
  threshold: number; // Number of consecutive failures before alerting
  cooldown: number; // Minutes to wait before sending another alert
}

const ALERT_CONFIGS: AlertConfig[] = [
  { jobName: "proactive-reminders", threshold: 2, cooldown: 60 },
  { jobName: "deadline-monitoring", threshold: 2, cooldown: 60 },
  { jobName: "AUTO_ENROLL", threshold: 3, cooldown: 120 },
  { jobName: "departmental-reports", threshold: 1, cooldown: 240 },
];

/**
 * Check for failed jobs and send alerts if thresholds are met
 */
export async function checkAndSendAlerts() {
  const start = Date.now();
  const results = {
    alertsSent: 0,
    errors: [] as string[],
  };

  try {
    for (const config of ALERT_CONFIGS) {
      try {
        // Get recent logs for this job
        const recentLogs = await db.schedulerLog.findMany({
          where: { jobName: config.jobName },
          orderBy: { createdAt: "desc" },
          take: config.threshold,
        });

        // Check if all recent runs failed
        const allFailed = recentLogs.length === config.threshold &&
          recentLogs.every(log => log.status === "FAILED" || log.status === "PARTIAL_FAILURE");

        if (!allFailed) continue;

        // Check if we already sent an alert recently (cooldown)
        const lastAlert = await db.schedulerLog.findFirst({
          where: {
            jobName: "scheduler-alert",
            message: { contains: config.jobName },
          },
          orderBy: { createdAt: "desc" },
        });

        if (lastAlert) {
          const minutesSinceLastAlert = (Date.now() - lastAlert.createdAt.getTime()) / 1000 / 60;
          if (minutesSinceLastAlert < config.cooldown) {
            continue; // Still in cooldown period
          }
        }

        // Send alert email
        await sendAlert(config.jobName, recentLogs);
        results.alertsSent++;

        // Log the alert
        await db.schedulerLog.create({
          data: {
            jobName: "scheduler-alert",
            status: "SUCCESS",
            message: `Alert sent for ${config.jobName} (${config.threshold} consecutive failures)`,
            metadata: {
              jobName: config.jobName,
              failureCount: config.threshold,
              recentLogs: recentLogs.map(log => ({
                id: log.id,
                status: log.status,
                message: log.message,
                createdAt: log.createdAt,
              })),
            },
          },
        });
      } catch (err: any) {
        results.errors.push(`Error checking ${config.jobName}: ${err.message}`);
      }
    }
  } catch (err: any) {
    results.errors.push(`General error: ${err.message}`);
  }

  // Log the alert check run
  await db.schedulerLog.create({
    data: {
      jobName: "scheduler-alert-check",
      status: results.errors.length === 0 ? "SUCCESS" : "FAILED",
      message: `${results.alertsSent} alerts sent. ${results.errors.length} errors.`,
      duration: Date.now() - start,
    },
  });

  return results;
}

/**
 * Send alert email to admin
 */
async function sendAlert(jobName: string, failedLogs: any[]) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    log.error("Cannot send scheduler alert: ADMIN_EMAIL not configured", { context: "scheduler-alerts" });
    return;
  }

  const failureDetails = failedLogs.map((log, idx) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${idx + 1}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${log.status}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${log.message || "—"}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${new Date(log.createdAt).toLocaleString("id-ID")}</td>
    </tr>
  `).join("");

  await sendEmailWithAttachment({
    to: adminEmail,
    subject: `🚨 [ALERT] Scheduler Job Failed: ${jobName}`,
    html: `
      <div style="font-family: sans-serif; color: #0F1C3F;">
        <div style="background-color: #dc2626; padding: 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">⚠️ Scheduler Alert</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e2e8f0;">
          <p>Halo Admin,</p>
          <p>Scheduler job <b>"${jobName}"</b> telah gagal <b>${failedLogs.length} kali berturut-turut</b>.</p>
          
          <h3 style="color: #dc2626;">Detail Kegagalan:</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f8fafc;">
                <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">#</th>
                <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Status</th>
                <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Message</th>
                <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              ${failureDetails}
            </tbody>
          </table>

          <div style="padding: 15px; background-color: #fef2f2; border-left: 4px solid #dc2626; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">⚠️ Action Required</p>
            <p style="margin: 5px 0 0 0;">Silakan periksa scheduler logs dan perbaiki masalah segera.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/admin/scheduler" style="background-color: #0F1C3F; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Scheduler Dashboard</a>
          </div>

          <hr />
          <p style="font-size: 12px; color: #64748b;">Pesan ini dikirim secara otomatis oleh E-Learning BNI Finance Scheduler Alert System.</p>
        </div>
      </div>
    `,
  });
}

/**
 * Check retry queue and send alert if too many pending
 */
export async function checkRetryQueueHealth() {
  try {
    const pendingRetries = await db.schedulerLog.count({
      where: {
        jobName: "email-retry-queue",
        status: "PENDING",
      },
    });

    // Alert if more than 50 pending retries
    if (pendingRetries > 50) {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail) return;

      await sendEmailWithAttachment({
        to: adminEmail,
        subject: `⚠️ [WARNING] High Retry Queue Count: ${pendingRetries}`,
        html: `
          <div style="font-family: sans-serif; color: #0F1C3F;">
            <div style="background-color: #f59e0b; padding: 20px; text-align: center;">
              <h1 style="color: #fff; margin: 0;">⚠️ Retry Queue Warning</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #e2e8f0;">
              <p>Halo Admin,</p>
              <p>Retry queue memiliki <b>${pendingRetries} pending emails</b> yang perlu diproses.</p>
              
              <div style="padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold;">⚠️ Possible Issues</p>
                <ul style="margin: 10px 0 0 0;">
                  <li>SMTP server down atau lambat</li>
                  <li>Email addresses invalid</li>
                  <li>Rate limiting dari email provider</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL}/admin/scheduler" style="background-color: #0F1C3F; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Retry Queue</a>
              </div>

              <hr />
              <p style="font-size: 12px; color: #64748b;">Pesan ini dikirim secara otomatis oleh E-Learning BNI Finance Scheduler Alert System.</p>
            </div>
          </div>
        `,
      });

      // Log the alert
      await db.schedulerLog.create({
        data: {
          jobName: "retry-queue-alert",
          status: "SUCCESS",
          message: `Alert sent: ${pendingRetries} pending retries`,
          metadata: { pendingCount: pendingRetries },
        },
      });
    }
  } catch (error: any) {
    log.error("Failed to check retry queue health", { context: "scheduler-alerts", error });
  }
}
