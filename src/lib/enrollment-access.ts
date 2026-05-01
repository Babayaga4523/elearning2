import { db } from "./db";

export interface EnrollmentAccessResult {
  canAccess: boolean;
  isLocked: boolean;
  isInGracePeriod: boolean;
  daysRemaining: number;
  graceDaysRemaining: number;
  reason?: string;
}

/**
 * Cek apakah enrollment masih bisa diakses user
 * Dengan mempertimbangkan auto-lock dan grace period
 */
export async function checkEnrollmentAccess(
  enrollmentId: string
): Promise<EnrollmentAccessResult> {
  const enrollment = await db.enrollment.findUnique({
    where: { id: enrollmentId },
  });

  if (!enrollment) {
    return {
      canAccess: false,
      isLocked: true,
      isInGracePeriod: false,
      daysRemaining: 0,
      graceDaysRemaining: 0,
      reason: "Enrollment tidak ditemukan",
    };
  }

  // Fetch course settings using Prisma query builder (safer than raw SQL)
  const course = await db.course.findUnique({
    where: { id: enrollment.courseId },
    select: { 
      lockAfterDeadline: true, 
      gracePeriodDays: true 
    }
  });
  
  const lockEnabled = course?.lockAfterDeadline ?? false;
  const graceDays = course?.gracePeriodDays ?? 0;

  // Jika sudah completed, always allow access
  if (enrollment.status === "COMPLETED") {
    return {
      canAccess: true,
      isLocked: false,
      isInGracePeriod: false,
      daysRemaining: 0,
      graceDaysRemaining: 0,
    };
  }

  // Jika tidak ada deadline, allow access
  if (!enrollment.deadline) {
    return {
      canAccess: true,
      isLocked: false,
      isInGracePeriod: false,
      daysRemaining: Infinity,
      graceDaysRemaining: 0,
    };
  }

  const now = new Date();
  const deadline = new Date(enrollment.deadline);

  // Hitung selisih hari
  const diffTime = deadline.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Masih dalam deadline
  if (daysRemaining > 0) {
    return {
      canAccess: true,
      isLocked: false,
      isInGracePeriod: false,
      daysRemaining,
      graceDaysRemaining: 0,
    };
  }

  // Deadline sudah lewat
  const daysPastDeadline = Math.abs(daysRemaining);
  const graceDaysRemaining = Math.max(0, graceDays - daysPastDeadline);
  const isInGracePeriod = graceDaysRemaining > 0;

  // Jika tidak ada lock dan tidak ada grace period, deny access
  if (!lockEnabled && graceDays === 0) {
    return {
      canAccess: true,
      isLocked: false,
      isInGracePeriod: false,
      daysRemaining: 0,
      graceDaysRemaining: 0,
      reason: "Deadline telah lewat",
    };
  }

  // Jika ada lock tapi masih dalam grace period
  if (lockEnabled && isInGracePeriod) {
    return {
      canAccess: true,
      isLocked: false,
      isInGracePeriod: true,
      daysRemaining: 0,
      graceDaysRemaining,
      reason: `Grace period: ${graceDaysRemaining} hari tersisa`,
    };
  }

  // Jika ada lock dan grace period sudah habis
  if (lockEnabled && !isInGracePeriod) {
    return {
      canAccess: false,
      isLocked: true,
      isInGracePeriod: false,
      daysRemaining: 0,
      graceDaysRemaining: 0,
      reason: `Akses dikunci. Grace period ${graceDays} hari telah berakhir`,
    };
  }

  // Default: allow access
  return {
    canAccess: true,
    isLocked: false,
    isInGracePeriod: false,
    daysRemaining: 0,
    graceDaysRemaining: 0,
  };
}

/**
 * Cek apakah enrollment dalam grace period untuk keperluan penalty
 */
export function isInGracePeriodForPenalty(
  deadline: Date,
  graceDays: number | null
): boolean {
  if (!graceDays || graceDays <= 0) return false;
  
  const now = new Date();
  const graceEnd = new Date(deadline);
  graceEnd.setDate(graceEnd.getDate() + graceDays);
  
  return now > new Date(deadline) && now <= graceEnd;
}

/**
 * Hitung penalty jika dalam grace period
 * Formula: (hari terlambat / graceDays) * 10 poin penalty
 */
export function calculateGracePeriodPenalty(
  deadline: Date,
  graceDays: number | null
): number {
  if (!graceDays || graceDays <= 0) return 0;
  
  const now = new Date();
  const daysPastDeadline = Math.ceil(
    (now.getTime() - new Date(deadline).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysPastDeadline <= 0) return 0;
  if (daysPastDeadline > graceDays) return 0; // Sudah terlalu terlambat
  
  // Penalty: 10 poin maksimum, proporsional dengan keterlambatan
  const penalty = Math.round((daysPastDeadline / graceDays) * 10);
  return Math.min(penalty, 10);
}

/**
 * Format status akses untuk ditampilkan ke user
 */
export function formatAccessStatus(result: EnrollmentAccessResult): string {
  if (result.isLocked) {
    return `🔒 ${result.reason}`;
  }
  
  if (result.isInGracePeriod) {
    return `⏰ Grace Period: ${result.graceDaysRemaining} hari tersisa (dapat penalty)`;
  }
  
  if (result.daysRemaining > 0 && result.daysRemaining !== Infinity) {
    return `📅 ${result.daysRemaining} hari tersisa`;
  }
  
  return "✅ Akses normal";
}
