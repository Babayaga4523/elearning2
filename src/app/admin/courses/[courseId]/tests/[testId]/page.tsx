import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, GraduationCap, ClipboardEdit, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TestForm } from "../../_components/TestForm";

// Define test type for proper TypeScript typing
type TestType = "PRE_TEST" | "POST_TEST";

export default async function TestIdPage({
  params,
  searchParams,
}: {
  params: { courseId: string; testId: string };
  searchParams: { type?: string };
}) {
  const session = await auth();
  const activeRole = session?.user?.activeRole;
  if (!session || (activeRole !== "ADMIN" && activeRole !== "SUPER_ADMIN")) {
    return redirect("/");
  }

  const [test, course] = await Promise.all([
    params.testId !== "new"
      ? db.test.findUnique({
          where: { id: params.testId },
          include: { questions: { include: { options: true } } },
        })
      : null,
    db.course.findUnique({
      where: { id: params.courseId },
      select: { id: true, title: true, isPublished: true },
    }),
  ]);

  const isPost = test ? test.type === "POST" : searchParams.type === "POST";
  const testType: TestType = isPost ? "POST_TEST" : "PRE_TEST";

  if (params.testId !== "new" && !test) return notFound();
  if (!course) return redirect("/admin/courses");

  const isNew = params.testId === "new";

  return (
    <div className="min-h-full w-full min-w-0 bg-[#F8F9FB]">
      {/* ─── Page Header ─────────────────────────────── */}
      <div className="border-b border-[#E4E7EC] bg-white">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Left: icon + breadcrumb + title */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div
                className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center shadow-sm border ${
                  isPost
                    ? "bg-[#FEF3DC] border-[#F5C05A]"
                    : "bg-[#E8EDF7] border-[#CBD2E0]"
                }`}
              >
                {isPost ? (
                  <ClipboardCheck className="h-5 w-5 text-[#E8A020]" />
                ) : (
                  <ClipboardEdit className="h-5 w-5 text-[#0F1C3F]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">
                    Test
                  </span>
                  <span className="text-[10px] text-[#CBD2E0]">/</span>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-widest text-[#0F1C3F] truncate max-w-[160px]"
                  >
                    {course.title}
                  </span>
                  <span className="text-[10px] text-[#CBD2E0]">/</span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#0F1C3F]">
                    {isPost ? "Post-Test" : "Pre-Test"}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-lg font-bold text-[#0F1C3F] font-['Lexend_Deca'] leading-tight">
                    {isNew ? "Buat" : "Edit"} {isPost ? "Post-Test" : "Pre-Test"}
                  </h1>
                  <Badge
                    className={`font-semibold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-lg border gap-1.5 ${
                      isPost
                        ? "bg-[#FEF3DC] text-[#C4861A] border-[#F5C05A]"
                        : "bg-[#E8EDF7] text-[#0F1C3F] border-[#CBD2E0]"
                    }`}
                  >
                    {isPost ? (
                      <GraduationCap className="h-3 w-3" />
                    ) : (
                      <ClipboardEdit className="h-3 w-3" />
                    )}
                    {isPost ? "Post-Test" : "Pre-Test"}
                  </Badge>
                </div>
                <p className="text-xs text-[#475467] mt-0.5">
                  Atur durasi, passing score, percobaan, pengacakan, dan soal tes.
                </p>
              </div>
            </div>

            {/* Right: back button */}
            <div className="shrink-0">
              <Link
                href={`/admin/courses/${params.courseId}?step=2`}
                className="group flex items-center gap-2 h-9 px-4 rounded-xl border border-[#E4E7EC] bg-white text-sm font-semibold text-[#475467] hover:border-[#0F1C3F]/30 hover:bg-[#F8F9FB] transition-all active:scale-[0.97]"
              >
                <ArrowLeft
                  size={14}
                  className="group-hover:-translate-x-0.5 transition-transform"
                />
                Kembali
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Form Content ────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-6 py-8">
        <TestForm
          courseId={params.courseId}
          initialData={test}
          type={testType}
          isCoursePublished={course.isPublished}
        />
      </div>
    </div>
  );
}