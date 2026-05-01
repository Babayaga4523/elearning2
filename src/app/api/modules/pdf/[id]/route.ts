import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { readFileFromDisk } from '@/lib/utils/file.utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Cek autentikasi
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Ambil data modul
    const moduleData = await db.module.findUnique({
      where: { id: params.id },
    });

    if (!moduleData || moduleData.type !== 'PDF' || !moduleData.url) {
      return new NextResponse("File tidak ditemukan", { status: 404 });
    }

    // 3. Cek apakah user enrolled di course ini (atau admin)
    const isAdminUser = session.user.activeRole === 'ADMIN' || session.user.activeRole === 'SUPER_ADMIN';

    if (!isAdminUser) {
      const enrollment = await db.enrollment.findUnique({
        where: {
          userId_courseId: {
            courseId: moduleData.courseId,
            userId: session.user.id,
          },
        },
        include: {
          course: { 
            select: { 
              deadlineDate: true,
              lockAfterDeadline: true,
              gracePeriodDays: true
            } 
          }
        }
      });

      if (!enrollment) {
        return new NextResponse("Akses ditolak: Anda tidak terdaftar di kursus ini", { status: 403 });
      }

      // Security: Check enrollment status (CRITICAL FIX)
      const validStatuses = ["IN_PROGRESS", "COMPLETED"];
      if (!validStatuses.includes(enrollment.status)) {
        return new NextResponse(`Akses ditolak: Status enrollment ${enrollment.status}`, { status: 403 });
      }

      // Security: Check deadline with grace period (CRITICAL FIX)
      const effectiveDeadline = enrollment.deadline || enrollment.course.deadlineDate;
      
      if (effectiveDeadline && enrollment.course.lockAfterDeadline) {
        const now = new Date();
        let finalDeadline = new Date(effectiveDeadline);
        
        // Add grace period if configured
        if (enrollment.course.gracePeriodDays) {
          finalDeadline = new Date(finalDeadline.getTime() + enrollment.course.gracePeriodDays * 24 * 60 * 60 * 1000);
        }
        
        if (now > finalDeadline) {
          return new NextResponse("Akses ditolak: Deadline kursus telah lewat", { status: 403 });
        }
      }
    }

    // 4. Baca file dari disk
    const fileBuffer = await readFileFromDisk(moduleData.url);

    // 5. Return file dengan header yang aman
    return new NextResponse(fileBuffer as any, {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `inline; filename="${moduleData.originalFilename ?? 'document.pdf'}"`,
        'Content-Length':      fileBuffer.length.toString(),
        'X-Frame-Options':     'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control':       'private, no-cache, no-store, must-revalidate',
        'Pragma':              'no-cache',
        'Expires':             '0',
      },
    });
  } catch (error) {
    console.error('[PDF_ROUTE_ERROR]', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
