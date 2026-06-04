import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { CourseSetupClient } from "./_components/CourseSetupClient";

// Next.js 15: params and searchParams are now Promises
interface PageProps {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ step?: string }>;
}

export const metadata: Metadata = { title: "Edit Kursus | Admin HCMS" };

export default async function CourseIdPage({ params, searchParams }: PageProps) {
  const { courseId } = await params;
  const { step: stepParam } = await searchParams;
  const step = Math.max(1, Number(stepParam ?? 2));
  const session = await auth();
  if (!session?.user?.id) return redirect("/auth/login");
  const role = session.user.activeRole;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") return redirect("/dashboard");

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      modules: { orderBy: { position: "asc" } },
      tests: { include: { questions: { include: { options: true } } } },
    },
  });

  if (!course) return redirect("/admin/courses");

  const preTest = course.tests.find((t) => t.type === "PRE") ?? null;
  const postTest = course.tests.find((t) => t.type === "POST") ?? null;

  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <CourseSetupClient
      courseId={course.id}
      activeStep={step}
      courseTitle={course.title}
      isPublished={course.isPublished}
      modules={course.modules}
      preTest={preTest}
      postTest={postTest}
      initialData={course}
      categories={categories.map(c => ({ label: c.name, value: c.id }))}
    />
  );
}
