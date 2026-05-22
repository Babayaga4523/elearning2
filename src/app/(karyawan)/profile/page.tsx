import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ProfileClient } from "./_components/ProfileClient";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect("/");
  }

  // Fetch user data with enrollment statistics
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      lokasi: true,
      nip: true,
      image: true,
      roles: true,
      activeRole: true,
      createdAt: true,
      _count: {
        select: {
          enrollments: {
            where: {
              status: { notIn: ["REJECTED", "PENDING"] }
            }
          }
        }
      }
    }
  });

  if (!user) {
    return redirect("/");
  }

  // Get enrollment statistics
  const enrollmentStats = await db.enrollment.groupBy({
    by: ["status"],
    where: {
      userId: session.user.id,
      status: { notIn: ["REJECTED", "PENDING"] }
    },
    _count: {
      status: true
    }
  });

  const stats = {
    total: user._count.enrollments,
    completed: enrollmentStats.find(s => s.status === "COMPLETED")?._count.status ?? 0,
    inProgress: enrollmentStats.find(s => s.status === "IN_PROGRESS")?._count.status ?? 0,
    failed: enrollmentStats.find(s => s.status === "FAILED")?._count.status ?? 0,
  };

  // Get user's enrolled courses for the progress modal list
  const enrolledCourses = await db.enrollment.findMany({
    where: {
      userId: session.user.id,
      status: { notIn: ["REJECTED", "PENDING"] }
    },
    select: {
      id: true,
      courseId: true,
      status: true,
      createdAt: true,
      course: {
        select: {
          title: true,
          category: {
            select: { name: true }
          }
        }
      },
      _count: {
        select: {
          testAttempts: {
            where: { status: "SUBMITTED" }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return <ProfileClient user={user} stats={stats} enrolledCourses={enrolledCourses} />;
}
