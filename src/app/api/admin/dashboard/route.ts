/**
 * API Route: Admin Dashboard Stats
 * GET /api/admin/dashboard
 * Returns aggregated dashboard statistics from real database
 */
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(session)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // ─── Parallel DB queries for performance ───
    const [
      totalUsers,
      activeCoursesResult,
      allCoursesResult,
      enrollmentStats,
      avgScoreResult,
      strugglingUsersCount,
      monthlyEnrollments,
      statusDistribution,
      recentActivity,
      prevMonthEnrollments,
    ] = await Promise.all([
      // Total users
      db.user.count(),

      // Active courses count
      db.course.count({ where: { isPublished: true, isVisible: true } }),

      // Total courses count
      db.course.count(),

      // Enrollment stats (grouped by status)
      db.enrollment.groupBy({
        by: ["status"],
        _count: { id: true },
      }),

      // Average score from completed test attempts
      db.testAttempt.aggregate({
        where: { status: "SUBMITTED" },
        _avg: { score: true },
      }),

      // Struggling users count (progress < 50% after 7+ days)
      db.enrollment.count({
        where: {
          status: "IN_PROGRESS",
          createdAt: { lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),

      // Monthly enrollments (last 6 months)
      db.$queryRaw<
        Array<{ month: string; enrollments: bigint; completed: bigint }>
      >`
        SELECT
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') AS month,
          COUNT(*)::bigint AS enrollments,
          COUNT(*) FILTER (WHERE status = 'COMPLETED')::bigint AS completed
        FROM "Enrollment"
        WHERE "createdAt" >= ${startOfPrevMonth}
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY DATE_TRUNC('month', "createdAt") ASC
        LIMIT 6
      `,

      // Status distribution
      db.enrollment.groupBy({
        by: ["status"],
        _count: { id: true },
      }),

      // Recent activity (enrollment status changes in last 24h)
      db.enrollment.findMany({
        where: {
          updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: {
          user: { select: { name: true, email: true } },
          course: { select: { title: true } },
        },
      }),

      // Previous month enrollment count (for trend calculation)
      db.enrollment.count({
        where: {
          createdAt: {
            gte: startOfPrevMonth,
            lte: endOfPrevMonth,
          },
        },
      }),
    ]);

    // ─── Parse enrollment stats ───
    const enrollmentCountMap = Object.fromEntries(
      enrollmentStats.map((e) => [e.status, e._count.id])
    );

    const totalEnrollments = Object.values(enrollmentCountMap).reduce(
      (sum, count) => sum + count,
      0
    );
    const completedEnrollments = Number(enrollmentCountMap["COMPLETED"] ?? 0);
    const inProgressEnrollments = Number(enrollmentCountMap["IN_PROGRESS"] ?? 0);
    const failedEnrollments = Number(enrollmentCountMap["FAILED"] ?? 0);
    const pendingEnrollments = Number(enrollmentCountMap["PENDING"] ?? 0);
    const rejectedEnrollments = Number(enrollmentCountMap["REJECTED"] ?? 0);

    const completionRate =
      totalEnrollments > 0
        ? Math.round((completedEnrollments / totalEnrollments) * 100)
        : 0;

    const avgScore = Math.round(avgScoreResult._avg.score ?? 0);

    // ─── Parse monthly enrollments ───
    const monthlyData = (monthlyEnrollments as unknown as Array<{
      month: string;
      enrollments: bigint;
      completed: bigint;
    }>).map((m) => ({
      month: m.month,
      enrollments: Number(m.enrollments),
      completed: Number(m.completed),
    }));

    // ─── Parse status distribution ───
    const statusColors: Record<string, string> = {
      COMPLETED: "#12B76A",
      IN_PROGRESS: "#2E90FA",
      PENDING: "#F79009",
      REJECTED: "#F04438",
      FAILED: "#F04438",
    };
    const statusLabels: Record<string, string> = {
      COMPLETED: "Selesai",
      IN_PROGRESS: "Dikerjakan",
      PENDING: "Menunggu",
      REJECTED: "Ditolak",
      FAILED: "Gagal",
    };

    const statusDistributionData = (statusDistribution as Array<{
      status: string;
      _count: { id: number };
    }>).map((s) => ({
      label: statusLabels[s.status] ?? s.status,
      value: s._count.id,
      color: statusColors[s.status] ?? "#98A2B3",
    }));

    // ─── Calculate trend (vs previous month) ───
    const thisMonthEnrollments = monthlyData.reduce(
      (sum, m) => sum + m.enrollments,
      0
    );
    const prevMonthTotal = Number(prevMonthEnrollments);
    const enrollmentTrend =
      prevMonthTotal > 0
        ? Math.round(
            ((thisMonthEnrollments - prevMonthTotal) / prevMonthTotal) * 100
          )
        : 0;

    // ─── Parse recent activity ───
    const activityMap: Record<string, { count: number; latest: Date; firstStatus: string }> = {};
    for (const e of recentActivity as Array<{
      user: { name: string; email: string };
      course: { title: string };
      status: string;
      updatedAt: Date;
    }>) {
      const key = `${e.user.email}:${e.course.title}`;
      if (!activityMap[key]) {
        activityMap[key] = { count: 0, latest: e.updatedAt, firstStatus: e.status };
      }
      activityMap[key].count++;
      if (e.updatedAt > activityMap[key].latest) {
        activityMap[key].latest = e.updatedAt;
      }
    }

    const recentActivityData = Object.entries(activityMap).map(([key, data], i) => {
      const [email, courseName] = key.split(":");
      const userName = (recentActivity as Array<{
        user: { name: string; email: string };
        course: { title: string };
        status: string;
        updatedAt: Date;
      }>).find((e) => e.user.email === email && e.course.title === courseName)?.user.name ?? email;

      const statusMap: Record<string, "completed" | "in_progress" | "failed" | "pending"> = {
        COMPLETED: "completed",
        IN_PROGRESS: "in_progress",
        FAILED: "failed",
        REJECTED: "failed",
        PENDING: "pending",
      };

      return {
        id: String(i + 1),
        user: { name: userName, email },
        action: data.count > 1 ? "Update enrollment" : "Update status",
        target: courseName,
        status: statusMap[data.firstStatus] ?? "pending",
        timestamp: data.latest.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        activeCourses: activeCoursesResult,
        totalCourses: allCoursesResult,
        totalEnrollments,
        completedEnrollments,
        inProgressEnrollments,
        failedEnrollments: failedEnrollments + rejectedEnrollments,
        pendingEnrollments,
        completionRate,
        avgScore,
        strugglingUsers: strugglingUsersCount,
        enrollmentTrend,
        monthlyEnrollments: monthlyData.length > 0 ? monthlyData : getDefaultMonthlyData(),
        statusDistribution: statusDistributionData,
        recentActivity: recentActivityData,
      },
    });
  } catch (error) {
    console.error("[Dashboard API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}

function getDefaultMonthlyData() {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: d.toLocaleString("id-ID", { month: "short" }),
      enrollments: 0,
      completed: 0,
    });
  }
  return months;
}