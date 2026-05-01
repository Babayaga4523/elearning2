import { db } from "@/lib/db";
import { UsersClient } from "./_components/UsersClient";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manajemen Pengguna | Admin BNI Finance E-Learning",
};

export default async function AdminUsersPage() {
  const [users, enrollmentStats] = await Promise.all([
    db.user.findMany({
      where: { roles: { has: "KARYAWAN" } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        nip: true,
        lokasi: true,
        role: true,
        roles: true,
        enrollments: {
          select: {
            status: true,
          },
        },
      },
    }),
    db.enrollment.groupBy({
      by: ["userId", "status"],
      _count: { status: true },
    }),
  ]);

  // Pre-process stats per user
  const statsByUser: Record<string, { total: number; completed: number; inProgress: number; active: number }> = {};
  for (const stat of enrollmentStats) {
    if (!statsByUser[stat.userId]) {
      statsByUser[stat.userId] = { total: 0, completed: 0, inProgress: 0, active: 0 };
    }
    
    // Total = ALL enrollments (including PENDING and REJECTED for transparency)
    statsByUser[stat.userId].total += stat._count.status;
    
    // Completed enrollments
    if (stat.status === "COMPLETED") {
      statsByUser[stat.userId].completed += stat._count.status;
    }
    
    // In Progress enrollments
    if (stat.status === "IN_PROGRESS") {
      statsByUser[stat.userId].inProgress += stat._count.status;
    }
    
    // Active = exclude PENDING, REJECTED, COMPLETED, FAILED (only ongoing)
    if (!["PENDING", "REJECTED", "COMPLETED", "FAILED", "CHEATING"].includes(stat.status)) {
      statsByUser[stat.userId].active += stat._count.status;
    }
  }

  // Map to UserRow format
  const mappedUsers = users.map((u) => {
    const stats = statsByUser[u.id] ?? { total: 0, completed: 0, inProgress: 0, active: 0 };
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      department: u.department,
      nip: u.nip,
      lokasi: u.lokasi,
      role: u.role,
      roles: u.roles,
      totalEnrollments: stats.total,
      completedEnrollments: stats.completed,
      inProgressEnrollments: stats.inProgress,
      activeEnrollments: stats.active,
      hasCheated: u.enrollments.some((en) => en.status === "CHEATING"),
    };
  });

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => (statsByUser[u.id]?.active ?? 0) > 0).length,
    graduatedUsers: users.filter((u) => (statsByUser[u.id]?.completed ?? 0) > 0).length,
  };

  return <UsersClient users={mappedUsers} stats={stats} />;
}
