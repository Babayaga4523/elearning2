import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, GraduationCap } from "lucide-react";
import Link from "next/link";
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

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">

      <div className="flex items-center gap-4 border-b border-slate-100 pb-8">
        <div className="p-4 bg-primary/10 rounded-2xl text-primary shadow-inner">
          <GraduationCap className="h-10 w-10" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            {params.testId === "new" ? "Setup" : "Edit"} {testType === "PRE_TEST" ? "Pre-Test" : "Post-Test"}
          </h1>
          <p className="text-slate-500 font-medium">Konfigurasi pertanyaan dan kriteria kelulusan peserta.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-2">
        <TestForm 
          courseId={params.courseId} 
          initialData={test} 
          type={testType as any} 
        />
      </div>
    </div>
  );
}
