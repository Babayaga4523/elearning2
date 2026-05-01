import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { KaryawanCalendarClient } from "./_components/KaryawanCalendarClient";

export const metadata = {
  title: "Kalender Belajar | BNI Finance E-Learning",
};

// Helper to format enrollment status to Indonesian
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: "Menunggu Approval",
    IN_PROGRESS: "Sedang Dipelajari",
    COMPLETED: "Selesai",
    REJECTED: "Ditolak",
    FAILED: "Gagal",
    CHEATING: "Tercurigai Curang",
  };
  return statusMap[status] || status;
}

export default async function KaryawanCalendarPage() {
  const session = await auth();
  if (!session?.user?.id) return redirect("/");
  const userId = session.user.id;

  const now = new Date();
  const startRange = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endRange = new Date(now.getFullYear(), now.getMonth() + 3, 0);

  // Fetch user's enrollments with deadlines
  const enrollments = await db.enrollment.findMany({
    where: {
      userId,
      status: { notIn: ["REJECTED", "PENDING", "CHEATING", "FAILED"] },
      deadline: { gte: startRange, lte: endRange },
    },
    include: {
      course: {
        include: {
          modules: { where: { isPublished: true } },
        },
      },
    },
    orderBy: { deadline: "asc" },
  });

  // Fetch completed modules with dates for activity tracking
  const completedProgress = await db.userProgress.findMany({
    where: {
      userId,
      isCompleted: true,
      updatedAt: { gte: startRange },
    },
    include: {
      module: { select: { title: true, courseId: true, course: { select: { title: true, id: true } } } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Fetch passed test attempts
  const passedTests = await db.testAttempt.findMany({
    where: {
      userId,
      passed: true,
      createdAt: { gte: startRange },
    },
    include: {
      test: { select: { title: true, type: true, courseId: true, course: { select: { title: true, id: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Build events
  const events = [
    // Deadline events
    ...enrollments
      .filter(e => e.deadline)
      .map(e => {
        const totalModules = e.course.modules.length;
        return {
          id: `deadline-${e.id}`,
          type: "DEADLINE" as const,
          title: `⏰ Deadline: ${e.course.title}`,
          date: e.deadline!.toISOString(),
          meta: `Status: ${formatStatus(e.status)}`,
          href: `/courses/${e.courseId}`,
          color: (new Date(e.deadline!) < now ? "rose" : "amber") as "rose" | "amber",
        };
      }),

    // Module completion events
    ...completedProgress.map(p => ({
      id: `progress-${p.id}`,
      type: "COMPLETION" as const,
      title: `✅ Selesai: ${p.module.title}`,
      date: p.updatedAt.toISOString(),
      meta: p.module.course.title,
      href: `/courses/${p.module.courseId}`,
      color: "emerald" as const,
    })),

    // Test passed events
    ...passedTests.map(t => ({
      id: `test-${t.id}`,
      type: "TEST" as const,
      title: `🏆 Lulus: ${t.test.title}`,
      date: t.createdAt.toISOString(),
      meta: t.test.course.title,
      href: `/courses/${t.test.courseId}`,
      color: "blue" as const,
    })),
  ];

  // Stats
  const upcomingDeadlines = enrollments.filter(e => e.deadline && new Date(e.deadline) > now).length;
  const modulesCompletedThisMonth = completedProgress.filter(p => {
    const d = new Date(p.updatedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const activeCourses = enrollments.filter(e => e.status === "IN_PROGRESS").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
      <KaryawanCalendarClient
        events={events}
        stats={{
          upcomingDeadlines,
          modulesCompletedThisMonth,
          activeCourses,
        }}
        userName={session.user.name ?? "Karyawan"}
      />
    </div>
  );
}
