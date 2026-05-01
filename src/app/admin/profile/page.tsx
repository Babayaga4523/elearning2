import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AdminProfileClient } from "./_components/AdminProfileClient";

export default async function AdminProfilePage() {
  const session = await auth();

  if (!session?.user) {
    return redirect("/auth/login");
  }

  // Admin layout already handles authorization, but double-check
  const activeRole = session.user.activeRole;
  if (activeRole !== "ADMIN" && activeRole !== "SUPER_ADMIN") {
    return redirect("/");
  }

  // Get system stats
  const [totalUsers, totalCourses, totalEnrollments, completedEnrollments] = await Promise.all([
    db.user.count({ where: { roles: { has: "KARYAWAN" } } }),
    db.course.count(),
    db.enrollment.count(),
    db.enrollment.count({ where: { status: "COMPLETED" } }),
  ]);

  const user = {
    id: session.user.id!,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    role: activeRole, // Use activeRole instead of legacy role
    createdAt: new Date(), // You might want to fetch this from database
  };

  const stats = {
    totalUsers,
    totalCourses,
    totalEnrollments,
    completedEnrollments,
  };

  return <AdminProfileClient user={user} stats={stats} />;
}
