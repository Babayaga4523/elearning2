import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, History as HistoryIcon, AlertCircle, ArrowRight, LogOut } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user?.id) {
    return redirect("/");
  }

  const isAdmin = session?.user?.role === "ADMIN";
  const userId = session.user.id;

  const enrollments = await db.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          modules: {
            where: { isPublished: true }
          },
          category: true,
        },
      },
    },
  });

  // Batch fetch all completed modules for this user in one query (eliminates N+1 problem)
  const completedModuleIds = await db.userProgress.findMany({
    where: {
      userId,
      isCompleted: true,
    },
    select: {
      moduleId: true,
      module: { select: { courseId: true } },
    },
  });

  // Build a lookup map: courseId -> count of completed modules
  const completedByCourse: Record<string, number> = {};
  for (const progress of completedModuleIds) {
    const courseId = progress.module.courseId;
    completedByCourse[courseId] = (completedByCourse[courseId] || 0) + 1;
  }

  // Calculate progress for each enrolled course from in-memory data (no extra DB calls)
  const coursesWithProgress = enrollments.map((en) => {
    const publishedModulesCount = en.course.modules.length;
    const completedModulesCount = completedByCourse[en.course.id] || 0;

    const progressPercentage = publishedModulesCount > 0
      ? Math.round((completedModulesCount / publishedModulesCount) * 100)
      : 0;

    return {
      ...en.course,
      progress: progressPercentage,
      completedModules: completedModulesCount,
      totalModules: publishedModulesCount,
    };
  });

  return (
    <div className="p-6 space-y-8 animate-fade-in-up">
      {isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-x-3 text-amber-800">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold text-sm">Administrator Session Active</p>
              <p className="text-xs opacity-90">You are currently viewing the employee dashboard. Use the Admin Console to manage system content.</p>
            </div>
          </div>
          <Link href="/admin">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white border-none text-xs flex items-center gap-1 font-bold whitespace-nowrap">
              Switch to Admin Console <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-y-2">
          <h1 className="text-3xl font-bold text-slate-800">Welcome Back, {session.user.name}!</h1>
          <p className="text-slate-500">Pick up where you left off and keep learning.</p>
        </div>
        <div className="flex items-center gap-x-3">
          <Link href="/dashboard/history">
            <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 transition-all font-bold shadow-sm">
              <HistoryIcon className="h-4 w-4 mr-2" />
              Learning History & Transcript
            </Button>
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coursesWithProgress.length === 0 ? (
          <div className="col-span-full h-40 flex items-center justify-center text-slate-400 border-2 border-dashed rounded-lg">
            You are not enrolled in any courses yet.
          </div>
        ) : (
          coursesWithProgress.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`}>
              <Card className="group hover:shadow-lg transition overflow-hidden">
                <div className="h-40 bg-slate-100 relative">
                  {course.imageUrl ? (
                    <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-slate-200 text-slate-400">
                      <BookOpen className="h-10 w-10" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-white/80 backdrop-blur-sm text-slate-700">
                      {course.category?.name || "LMS"}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg font-bold truncate group-hover:text-primary transition">
                    {course.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                      <span>{course.progress}% Completed</span>
                      <span>{course.completedModules}/{course.totalModules} modules</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center text-slate-500 text-xs gap-x-2">
                    <Clock className="h-3 w-3" />
                    <span>Next: {course.totalModules - course.completedModules} modules to go</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Explore Available Courses</h2>
        <div className="text-sm text-slate-500 italic bg-slate-50 p-4 rounded-md border text-center">
          Course exploration feature coming soon. Enroll in courses to see them on your dashboard.
        </div>
      </div>
    </div>
  );
}
