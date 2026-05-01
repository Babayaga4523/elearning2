"use client";

import { useState, useEffect } from "react";
import {
  BookOpen, ArrowRight, Clock
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import ActivityChart from "@/app/(karyawan)/dashboard/_components/ActivityChart";
import Leaderboard from "@/app/(karyawan)/dashboard/_components/Leaderboard";
import { LearningProgressChart } from "@/app/(karyawan)/dashboard/_components/LearningProgressChart";
import { SupportContact } from "@/components/support/support-contact";

// ─── Category colors with modern palette ──────────────────────────────────────
const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  Finance:    { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
  Legal:      { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200" },
  Leadership: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Technology: { bg: "bg-cyan-50",    text: "text-cyan-700",    border: "border-cyan-200" },
  Service:    { bg: "bg-pink-50",    text: "text-pink-700",    border: "border-pink-200" },
  Marketing:  { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200" },
  Ethics:     { bg: "bg-green-50",   text: "text-green-700",   border: "border-green-200" },
};

const getCategoryStyle = (category: string) =>
  categoryColors[category] || { 
    bg: "bg-gray-50", 
    text: "text-gray-700", 
    border: "border-gray-200" 
  };

// ─── Modern Hero Section ──────────────────────────────────────────────────────
function ModernHeroSection({ user, resumeData, avgScore }: { 
  user: any; 
  resumeData: any; 
  avgScore: number 
}) {
  const [greeting, setGreeting] = useState("Halo");
  
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting("Selamat Pagi");
      else if (hour < 17) setGreeting("Selamat Siang");
      else setGreeting("Selamat Malam");
    };
    
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-8 lg:p-12">
      {/* Subtle Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-blue-400 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-cyan-400 blur-2xl" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        {/* Left Content */}
        <div className="flex-1 space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-400">
              {greeting}
            </p>
            
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
              {user.name}
            </h1>
            
            <p className="text-base text-slate-300">
              {user.department}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {resumeData ? (
              <Button 
                asChild 
                size="lg" 
                className="bg-white hover:bg-slate-100 text-slate-900 font-semibold"
              >
                <Link href={resumeData.href}>
                  Lanjutkan Belajar
                </Link>
              </Button>
            ) : (
              <Button 
                asChild 
                size="lg" 
                className="bg-white hover:bg-slate-100 text-slate-900 font-semibold"
              >
                <Link href="/courses">
                  Mulai Belajar
                </Link>
              </Button>
            )}
            
            <Button 
              asChild 
              variant="outline" 
              size="lg"
              className="border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent"
            >
              <Link href="/performance">
                Lihat Progres
              </Link>
            </Button>
          </div>
        </div>

        {/* Right Performance Badge */}
        {avgScore > 0 && (
          <div className="shrink-0 rounded-xl border border-white/10 p-6 text-center min-w-[140px] bg-white/5 backdrop-blur-sm">
            <div className="text-3xl font-bold text-white mb-1">
              {avgScore}%
            </div>
            <p className="text-xs font-medium text-slate-400">
              Rata-rata Skor
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modern Alert Component ───────────────────────────────────────────────────
function ModernUrgentAlerts({ alerts }: { alerts: any[] }) {
  if (!alerts.length) return null;
  
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-red-600">
        {alerts.length} Deadline Mendesak
      </p>
      
      {alerts.map((alert, index) => (
        <Link key={index} href={`/courses/${alert.courseId}`}>
          <Card className="border-l-4 border-l-red-500 bg-red-50 hover:shadow-md transition-all duration-200 cursor-pointer group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {alert.title}
                  </h3>
                  <p className="text-sm text-red-600 font-medium">
                    Deadline: {alert.deadline}
                  </p>
                </div>
                
                <Button 
                  size="sm" 
                  className="bg-red-600 hover:bg-red-700 text-white font-medium shrink-0"
                >
                  Kerjakan
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

// ─── Modern KPI Grid ──────────────────────────────────────────────────────────
function ModernKPIGrid({ kpis }: { kpis: any }) {
  const kpiItems = [
    { 
      label: "Kursus Aktif", 
      value: kpis.activeCourses, 
      color: "blue"
    },
    { 
      label: "Modul Selesai", 
      value: kpis.modulesDone, 
      color: "green"
    },
    { 
      label: "Ujian Lulus", 
      value: kpis.testsPassed, 
      color: "yellow"
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "border-l-blue-500",
      green: "border-l-green-500",
      yellow: "border-l-yellow-500"
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {kpiItems.map((item) => {
        const borderColor = getColorClasses(item.color);
        
        return (
          <Card 
            key={item.label} 
            className={cn(
              "border-l-4 bg-white hover:shadow-md transition-all duration-200",
              borderColor
            )}
          >
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-600">
                  {item.label}
                </p>
                <p className="text-4xl font-bold text-slate-900">
                  {item.value.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Modern Leaderboard ───────────────────────────────────────────────────────
function ModernLeaderboard({ leaderboard }: { leaderboard: any[] }) {
  const topUsers = leaderboard.slice(0, 5);

  return (
    <Card className="bg-white">
      <CardHeader className="pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Papan Peringkat
          </CardTitle>
          <p className="text-sm text-slate-600">
            Top performer bulan ini
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2 space-y-2">
        {topUsers.map((user) => {
          return (
            <div
              key={user.rank}
              className={cn(
                "flex items-center gap-4 p-3 rounded-lg transition-all duration-200",
                user.isCurrentUser 
                  ? "bg-blue-50 border border-blue-200" 
                  : "hover:bg-slate-50"
              )}
            >
              <div className="w-8 text-center">
                <span className="text-sm font-semibold text-slate-600">
                  {user.rank}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900 truncate">
                    {user.name}
                  </p>
                  {user.isCurrentUser && (
                    <Badge className="bg-blue-600 text-white text-xs font-medium border-0">
                      Anda
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  {user.department}
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-base font-semibold text-slate-900">
                  {user.score.toLocaleString()}
                </div>
                <div className="text-xs text-slate-600">
                  poin
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── Modern Course Card ───────────────────────────────────────────────────────
function ModernCourseCard({ course, isUrgent }: { course: any; isUrgent: boolean }) {
  const progress = course.progress;
  const categoryStyle = getCategoryStyle(course.category);
  
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 50) return "bg-blue-500";
    return "bg-slate-400";
  };

  return (
    <Link href={`/courses/${course.id}`} className="group block">
      <Card className={cn(
        "bg-white hover:shadow-md transition-all duration-200 h-full",
        isUrgent && "border-l-4 border-l-red-500"
      )}>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <Badge className={cn(
                "text-xs font-medium mb-3",
                categoryStyle.bg,
                categoryStyle.text
              )}>
                {course.category}
              </Badge>
              
              <h3 className="font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                {course.title}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {course.completedModules} dari {course.totalModules} modul
              </p>
            </div>
            
            {isUrgent && (
              <Badge className="bg-red-600 text-white text-xs font-medium">
                Urgent
              </Badge>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-600">Progress</span>
              <span className="font-semibold text-slate-900">{progress}%</span>
            </div>
            
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  getProgressColor(progress)
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full justify-center text-slate-700 hover:text-blue-600 hover:bg-blue-50 font-medium"
          >
            Lanjutkan belajar
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Modern Explore Card ──────────────────────────────────────────────────────
function ModernExploreCard({ course }: { course: any }) {
  const categoryStyle = getCategoryStyle(course.category);
  
  return (
    <Link href={`/courses/${course.id}`} className="group block">
      <div className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-300 transition-all duration-200">
        <div className="flex-1 min-w-0 space-y-1">
          <h4 className="font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">
            {course.title}
          </h4>
          
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span className={cn("text-xs font-medium", categoryStyle.text)}>
              {course.category}
            </span>
            <span>•</span>
            <span>{course.modules} modul</span>
          </div>
        </div>
        
        <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
      </div>
    </Link>
  );
}

// ─── Modern Section Header ────────────────────────────────────────────────────
function ModernSectionHeader({ 
  title, 
  subtitle, 
  count, 
  countLabel
}: { 
  title: string; 
  subtitle?: string; 
  count?: number; 
  countLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-slate-600 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      
      {count !== undefined && (
        <span className="text-sm font-medium text-slate-600">
          {count} {countLabel}
        </span>
      )}
    </div>
  );
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────
export default function DashboardClient({
  user, kpis, urgentAlerts, activeCourses, activityData, learningProgressData, leaderboard,
  exploreCourses, resumeData, avgScore, isAdmin,
}: {
  user: any; kpis: any; urgentAlerts: any[]; activeCourses: any[];
  activityData: any[]; learningProgressData: any[]; leaderboard: any[]; exploreCourses: any[];
  resumeData: any; avgScore: number; isAdmin: boolean;
}) {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Admin Banner */}
        {isAdmin && (
          <Card className="border-l-4 border-l-amber-500 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-amber-900">Administrator Session</h3>
                  <p className="text-sm text-amber-700">Anda sedang melihat tampilan dashboard karyawan</p>
                </div>
                <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white font-medium">
                  <Link href="/admin">
                    Admin Console
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Urgent Alerts */}
        {urgentAlerts.length > 0 && (
          <div>
            <ModernUrgentAlerts alerts={urgentAlerts} />
          </div>
        )}

        {/* Hero Section */}
        <ModernHeroSection user={user} resumeData={resumeData} avgScore={avgScore} />

        {/* KPI Grid */}
        <ModernKPIGrid kpis={kpis} />

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6">
          {/* Learning Progress Chart - Full Width */}
          <div className="w-full">
            <LearningProgressChart data={learningProgressData} />
          </div>
          
          {/* Activity Chart & Leaderboard - Side by Side */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="w-full">
              <ActivityChart data={activityData} />
            </div>
            <div className="w-full">
              <Leaderboard data={leaderboard} />
            </div>
          </div>
        </div>

        {/* Active Courses */}
        <div>
          <ModernSectionHeader 
            title="Pelajaran Aktif" 
            subtitle="Lanjutkan progres belajar Anda"
            count={activeCourses.length} 
            countLabel="Kursus"
          />
          
          {activeCourses.length === 0 ? (
            <Card className="bg-white">
              <CardContent className="py-16 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Belum ada kursus aktif</h3>
                    <p className="text-sm text-slate-600">Mulai perjalanan belajar Anda dengan memilih kursus yang tersedia</p>
                  </div>
                  <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Link href="/courses">Jelajahi Kursus</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {activeCourses.map(course => (
                <ModernCourseCard 
                  key={course.id} 
                  course={course} 
                  isUrgent={urgentAlerts.some(alert => alert.courseId === course.id)} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Explore Courses */}
        <Card className="bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Rekomendasi untuk Anda
                </CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Kursus yang mungkin menarik bagi Anda
                </p>
              </div>
              
              <Button asChild variant="outline" size="sm">
                <Link href="/courses">
                  Lihat Semua
                </Link>
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {exploreCourses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-600">
                  Tidak ada kursus baru untuk dieksplorasi saat ini
                </p>
              </div>
            ) : (
              exploreCourses.map(course => (
                <ModernExploreCard key={course.id} course={course} />
              ))
            )}
          </CardContent>
        </Card>

        {/* Support Contact */}
        <SupportContact 
          userName={user.name}
          userEmail={user.email}
          userDepartment={user.department}
        />

      </div>
    </div>
  );
}