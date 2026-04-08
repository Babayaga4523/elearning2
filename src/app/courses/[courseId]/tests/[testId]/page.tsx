import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { 
  ArrowLeft, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TestClient } from "@/components/courses/test-client";

export default async function TestIdPage({
  params
}: {
  params: { courseId: string; testId: string }
}) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return redirect("/");
  }

  const userId = session.user.id;

  const test = await db.test.findUnique({
    where: {
      id: params.testId,
      courseId: params.courseId,
    },
    include: {
      questions: {
        include: {
          options: true,
        },
      },
      course: true,
    },
  });

  if (!test) {
    return redirect(`/courses/${params.courseId}`);
  }

  const existingAttempt = await db.testAttempt.findFirst({
    where: {
      userId,
      testId: params.testId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-full bg-slate-50 p-6 md:p-10 animate-fade-in-up">
      <Link href={`/courses/${params.courseId}`} className="flex items-center text-sm font-medium mb-10 hover:opacity-75 transition">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Course Curriculum
      </Link>

      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b pb-6">
           <div className="space-y-1">
             <h1 className="text-3xl font-extrabold text-slate-800">{test.title}</h1>
             <p className="text-slate-500 font-medium">Testing: {test.course.title}</p>
           </div>
           <Badge className="text-sm px-4 py-1" variant={test.type === "PRE" ? "secondary" : "default"}>
              {test.type} TEST
           </Badge>
        </div>

        {existingAttempt ? (
          <div className="bg-white p-12 rounded-3xl border shadow-xl text-center space-y-6">
            <div className={cn(
              "h-24 w-24 rounded-full mx-auto flex items-center justify-center",
              existingAttempt.passed ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
            )}>
              {existingAttempt.passed ? <CheckCircle2 className="h-12 w-12" /> : <AlertCircle className="h-12 w-12" />}
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Your Score: {existingAttempt.score}%</h2>
              <p className={cn("font-bold text-lg", existingAttempt.passed ? "text-emerald-500" : "text-red-500")}>
                {existingAttempt.passed ? "CONGRATULATIONS! YOU PASSED." : "FAILED. PLEASE STUDY MORE."}
              </p>
            </div>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              You have completed this test on {existingAttempt.createdAt.toLocaleDateString()}. 
              Check your course dashboard for progress updates.
            </p>
            <Link href={`/courses/${params.courseId}`}>
               <Button className="w-full h-12 bg-primary text-white font-bold">Continue Learning</Button>
            </Link>
          </div>
        ) : (
          <TestClient test={test} courseId={params.courseId} />
        )}
      </div>
    </div>
  );
}
