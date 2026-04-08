import { db } from "@/lib/db";
import { UsersClient } from "./_components/UsersClient";

export const metadata = {
  title: "Manajemen Pengguna | Admin BNI Finance E-Learning",
};

export default async function AdminUsersPage() {
  const [users, enrollmentStats] = await Promise.all([
    (db.user as any).findMany({
      where: { role: "KARYAWAN" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        nip: true,
        lokasi: true,
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
  const statsByUser: Record<string, { total: number; completed: number; inProgress: number }> = {};
  for (const stat of enrollmentStats) {
    if (!statsByUser[stat.userId]) {
      statsByUser[stat.userId] = { total: 0, completed: 0, inProgress: 0 };
    }
    statsByUser[stat.userId].total += stat._count.status;
    if (stat.status === "COMPLETED") statsByUser[stat.userId].completed += stat._count.status;
    if (stat.status === "IN_PROGRESS") statsByUser[stat.userId].inProgress += stat._count.status;
  }

  // Map to UserRow format
  const mappedUsers = users.map((u: any) => {
    const stats = statsByUser[u.id] ?? { total: 0, completed: 0, inProgress: 0 };
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      department: u.department,
      nip: u.nip,
      lokasi: u.lokasi,
      totalEnrollments: stats.total,
      completedEnrollments: stats.completed,
      inProgressEnrollments: stats.inProgress,
    };
  });

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u: any) => (statsByUser[u.id]?.inProgress ?? 0) > 0).length,
    graduatedUsers: users.filter((u: any) => (statsByUser[u.id]?.completed ?? 0) > 0).length,
  };

  return <UsersClient users={mappedUsers} stats={stats} />;
}
