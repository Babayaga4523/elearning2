import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { TestForm } from "../../_components/TestForm";

export default async function TestIdPage({
  params,
  searchParams
}: {
  params: { courseId: string; testId: string };
  searchParams: { type?: string };
}) {
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
    return redirect("/");
  }

  const testType = searchParams.type === "POST" ? "POST_TEST" : "PRE_TEST";

  const test = params.testId !== "new" 
    ? await db.test.findUnique({
        where: { id: params.testId },
        include: {
          questions: {
            include: { options: true }
          }
        }
      })
    : null;

  if (params.testId !== "new" && !test) {
    return notFound();
  }

  const course = await db.course.findUnique({
    where: { id: params.courseId }
  });

  return (
    <div className="w-full min-w-0 max-w-none space-y-4 pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-xs font-medium text-slate-500">Editor tes</p>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
            {params.testId === "new" ? "Setup" : "Edit"}{" "}
            {testType === "PRE_TEST" ? "Pre-Test" : "Post-Test"}
          </h1>
          <p className="text-sm text-slate-600">
            Durasi, percobaan, pengacakan, lalu daftar soal dan kunci jawaban.
          </p>
        </div>
      </div>

      <TestForm
        courseId={params.courseId}
        initialData={test}
        type={testType as any}
        isCoursePublished={course?.isPublished}
      />
    </div>
  );
}
