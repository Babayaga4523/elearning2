import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { AdminCalendarClient } from "./_components/AdminCalendarClient";

export const metadata = {
  title: "Kalender | Admin BNI Finance E-Learning",
};

export default async function AdminCalendarPage() {
  const session = await auth();
  // Admin layout already handles authorization, but double-check
  if (session?.user?.activeRole !== "ADMIN" && session?.user?.activeRole !== "SUPER_ADMIN") return redirect("/");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfRange = new Date(now.getFullYear(), now.getMonth() + 3, 0);

  // Fetch courses with deadlines
  const coursesWithDeadline = await db.course.findMany({
    where: {
      isPublished: true,
      deadlineDate: { gte: startOfMonth, lte: endOfRange },
    },
    select: {
      id: true,
      title: true,
      deadlineDate: true,
      _count: { select: { enrollments: { where: { status: { notIn: ["REJECTED", "PENDING"] } } } } },
    },
    orderBy: { deadlineDate: "asc" },
  });

  // Fetch recent enrollments (last 60 days + next 30 days)
  const enrollmentsRange = new Date();
  enrollmentsRange.setDate(enrollmentsRange.getDate() - 60);

  const recentEnrollments = await db.enrollment.findMany({
    where: {
      createdAt: { gte: enrollmentsRange },
    },
    include: {
      user: { select: { name: true, department: true } },
      course: { select: { title: true, id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Build calendar events
  const events = [
    ...coursesWithDeadline.map((c) => ({
      id: `deadline-${c.id}`,
      type: "DEADLINE" as const,
      title: `⏰ Deadline: ${c.title}`,
      date: c.deadlineDate!.toISOString(),
      meta: `${c._count.enrollments} Peserta`,
      href: `/admin/courses/${c.id}`,
      color: "rose" as const,
    })),
    ...recentEnrollments.map((e) => ({
      id: `enroll-${e.id}`,
      type: "ENROLLMENT" as const,
      title: `📋 Enroll: ${e.course.title}`,
      date: e.createdAt.toISOString(),
      meta: e.user.name ?? "Karyawan",
      href: `/admin/enrollments`,
      color: "emerald" as const,
    })),
  ];

  // Stats 
  const totalDeadlinesThisMonth = coursesWithDeadline.filter(c => {
    const d = new Date(c.deadlineDate!);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const enrollmentsThisMonth = recentEnrollments.filter(e => {
    const d = new Date(e.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <AdminCalendarClient
      events={events}
      statsThisMonth={{
        deadlines: totalDeadlinesThisMonth,
        enrollments: enrollmentsThisMonth,
        courses: coursesWithDeadline.length,
      }}
    />
  );
}
