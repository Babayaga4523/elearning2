import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, GraduationCap, ClipboardEdit, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TestForm } from "../../_components/TestForm";

export default async function TestIdPage({
  params,
  searchParams,
}: {
  params: { courseId: string; testId: string };
  searchParams: { type?: string };
}) {
  const session = await auth();

  // Admin layout already handles authorization, but double-check
  const activeRole = session?.user?.activeRole;
  if (!session || (activeRole !== "ADMIN" && activeRole !== "SUPER_ADMIN")) {
    return redirect("/");
  }

  // Determine test type from searchParams or existing test data
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

  // If editing existing test, use its type; otherwise use searchParams
  const isPost = test ? test.type === "POST" : searchParams.type === "POST";
  const testType = isPost ? "POST_TEST" : "PRE_TEST";

  if (params.testId !== "new" && !test) return notFound();
  if (!course) return redirect("/admin/courses");

  const isNew = params.testId === "new";

  return (
    <div className="w-full min-w-0 max-w-none space-y-6 pb-8 animate-in fade-in duration-500">
      {/* Premium Header */}
      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
        {/* Top accent */}
        <div className={`h-1 w-full ${isPost ? "bg-gradient-to-r from-[#E8A020] to-[#F59E0B]" : "bg-gradient-to-r from-[#0F1C3F] to-[#1A3060]"}`} />
        
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Back nav + Icon */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className={`h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center shadow-sm ${isPost ? "bg-[#FFF8E7] border border-[#E8A020]/20" : "bg-[#0F1C3F]/5 border border-[#0F1C3F]/10"}`}>
                {isPost
                  ? <ClipboardCheck className="h-6 w-6 text-[#E8A020]" />
                  : <ClipboardEdit className="h-6 w-6 text-[#0F1C3F]" />
                }
              </div>

              <div className="min-w-0">
                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <Link
                    href="/admin/courses"
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-[#0F1C3F] transition-colors"
                  >
                    Katalog
                  </Link>
                  <span className="text-slate-200 text-[10px]">/</span>
                  <Link
                    href={`/admin/courses/${params.courseId}?step=2`}
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-[#0F1C3F] transition-colors max-w-[160px] truncate"
                  >
                    {course.title}
                  </Link>
                  <span className="text-slate-200 text-[10px]">/</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#0F1C3F]">
                    {isPost ? "Post-Test" : "Pre-Test"}
                  </span>
                </div>

                <CardTitle className="text-lg font-bold text-[#0F1C3F] font-lexend leading-tight">
                  {isNew ? "Buat" : "Edit"} {isPost ? "Post-Test" : "Pre-Test"}
                </CardTitle>
                <CardDescription className="text-[11px] font-medium text-slate-400 mt-0.5">
                  Atur durasi, percobaan, pengacakan, soal, dan kunci jawaban.
                </CardDescription>
              </div>
            </div>

            {/* Type Badge */}
            <div className="flex items-center gap-2 shrink-0">
              {isPost ? (
                <Badge className="bg-[#E8A020] text-[#0F1C3F] hover:bg-[#E8A020] font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg gap-1.5">
                  <GraduationCap className="h-3 w-3" />
                  Post-Test
                </Badge>
              ) : (
                <Badge className="bg-[#0F1C3F] text-[#E8A020] hover:bg-[#0F1C3F] font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg gap-1.5">
                  <ClipboardEdit className="h-3 w-3" />
                  Pre-Test
                </Badge>
              )}

              <Link
                href={`/admin/courses/${params.courseId}?step=2`}
                className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#0F1C3F] transition-colors group"
              >
                <span className="flex items-center justify-center h-7 w-7 rounded-lg border border-slate-200 group-hover:border-[#0F1C3F] group-hover:bg-[#0F1C3F] transition-all">
                  <ArrowLeft className="h-3 w-3 group-hover:text-white transition-colors" />
                </span>
                Kembali
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Form */}
      <TestForm
        courseId={params.courseId}
        initialData={test}
        type={testType as any}
        isCoursePublished={course.isPublished}
      />
    </div>
  );
}
