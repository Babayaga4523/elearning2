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
    const module = await db.module.findUnique({
      where: { id: params.id },
    }) as any;

    if (!module || module.type !== 'PDF' || !module.url) {
      return new NextResponse("File tidak ditemukan", { status: 404 });
    }

    // 3. Cek apakah user enrolled di course ini (atau admin)
    const isAdmin = session.user.role === 'ADMIN';

    if (!isAdmin) {
      const enrollment = await db.enrollment.findUnique({
        where: {
          userId_courseId: {
            courseId: module.courseId,
            userId:   session.user.id,
          },
        },
      });

      if (!enrollment) {
        return new NextResponse("Akses ditolak", { status: 403 });
      }
    }

    // 4. Baca file dari disk
    const fileBuffer = await readFileFromDisk(module.url);

    // 5. Return file dengan header yang aman
    return new NextResponse(fileBuffer as unknown as any, {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `inline; filename="${module.originalFilename ?? 'document.pdf'}"`,
        'Content-Length':      fileBuffer.length.toString(),
        'X-Frame-Options':     'SAMEORIGIN',
        'Cache-Control':       'private, no-cache',
      },
    });
  } catch (error) {
    console.error('[PDF_ROUTE_ERROR]', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
