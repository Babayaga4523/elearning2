import { db } from "@/lib/db";

export async function notifyCourseEnrollment(params: {
  userIds: string[];
  courseId: string;
  courseTitle: string;
}) {
  if (params.userIds.length === 0) return;
  await db.notification.createMany({
    data: params.userIds.map((userId) => ({
      userId,
      type: "ENROLLMENT" as const,
      title: "Pendaftaran kursus",
      body: `Anda terdaftar pada kursus "${params.courseTitle}".`,
      href: `/courses/${params.courseId}`,
    })),
  });
}
