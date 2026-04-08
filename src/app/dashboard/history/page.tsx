import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { 
  ClipboardCheck, 
  History, 
  CheckCircle2, 
  XCircle, 
  Clock,
  BookOpen
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function HistoryPage() {
  const session = await auth();

  if (!session || !session.user?.id) {
    return redirect("/");
  }

  const userId = session.user.id;

  // Run both queries in parallel — eliminates sequential DB waterfall
  const [testAttempts, moduleProgress] = await Promise.all([
    db.testAttempt.findMany({
      where: { userId },
      select: {
        id: true,
        score: true,
        passed: true,
        createdAt: true,
        test: {
          select: {
            title: true,
            course: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.userProgress.findMany({
      where: { userId, isCompleted: true },
      select: {
        id: true,
        updatedAt: true,
        module: {
          select: {
            title: true,
            course: { select: { title: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="p-6 md:p-10 space-y-10 bg-slate-50/30 min-h-full animate-in fade-in duration-700">
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <History className="h-8 w-8 text-indigo-600" />
          Learning History & Transcript
        </h1>
        <p className="text-slate-500 font-medium ml-11">
          Detailed record of your assessments and module completions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Test History Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <ClipboardCheck className="h-5 w-5 text-indigo-500" />
            <h2 className="text-xl font-bold text-slate-800">Assessment Records</h2>
          </div>
          
          <div className="space-y-4">
            {testAttempts.length === 0 ? (
              <Card className="border-dashed border-2 bg-slate-50/50">
                <CardContent className="flex flex-col items-center justify-center p-12 text-slate-400">
                  <Clock className="h-10 w-10 mb-4 opacity-20" />
                  <p className="font-medium italic">No test attempts recorded yet.</p>
                </CardContent>
              </Card>
            ) : (
              testAttempts.map((attempt) => (
                <Card key={attempt.id} className="glass-morphism border-slate-200/60 hover:shadow-lg transition-all group overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{attempt.test.course.title}</p>
                        <h3 className="text-lg font-bold text-slate-800 truncate">{attempt.test.title}</h3>
                        <p className="text-sm text-slate-400 flex items-center gap-1">
                          Taken on {attempt.createdAt.toLocaleDateString()} at {attempt.createdAt.toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="text-2xl font-black text-slate-900">
                          {attempt.score}%
                        </div>
                        <Badge 
                          className={cn(
                            "px-3 py-0.5 font-bold border-none",
                            attempt.passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                          )}
                        >
                          {attempt.passed ? (
                            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> PASS</span>
                          ) : (
                            <span className="flex items-center gap-1"><XCircle className="h-3 w-3" /> FAIL</span>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Module Completion Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <BookOpen className="h-5 w-5 text-emerald-500" />
            <h2 className="text-xl font-bold text-slate-800">Module Completions</h2>
          </div>

          <div className="space-y-4">
            {moduleProgress.length === 0 ? (
               <Card className="border-dashed border-2 bg-slate-50/50">
                <CardContent className="flex flex-col items-center justify-center p-12 text-slate-400">
                  <Clock className="h-10 w-10 mb-4 opacity-20" />
                  <p className="font-medium italic">No modules completed yet.</p>
                </CardContent>
              </Card>
            ) : (
              moduleProgress.map((progress) => (
                <Card key={progress.id} className="glass-morphism border-slate-200/60 hover:shadow-lg transition-all group overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                   <CardContent className="p-5 pl-7">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">{progress.module.course.title}</p>
                      <h4 className="font-bold text-slate-700">{progress.module.title}</h4>
                      <p className="text-xs text-slate-400">
                        Marked as completed on {progress.updatedAt.toLocaleDateString()}
                      </p>
                    </div>
                   </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
