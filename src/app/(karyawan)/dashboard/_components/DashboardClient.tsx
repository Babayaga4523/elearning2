"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  AlertTriangle, Clock, PlayCircle, CheckCircle2, Award, 
  ChevronRight, Play, TrendingUp, Shield, Brain
} from "lucide-react";
import ActivityChart from "@/app/(karyawan)/dashboard/_components/ActivityChart";
import Leaderboard from "@/app/(karyawan)/dashboard/_components/Leaderboard";
import { LearningProgressChart } from "@/app/(karyawan)/dashboard/_components/LearningProgressChart";

interface DashboardClientProps {
  user: {
    name: string;
    email: string;
    department: string;
    avatar: string;
  };
  kpis: {
    activeCourses: number;
    modulesDone: number;
    testsPassed: number;
  };
  urgentAlerts: Array<{
    title: string;
    deadline: string;
    daysRemaining: number;
    courseId: string;
  }>;
  activeCourses: Array<any>;
  activityData: Array<{day: string, count: number}>;
  learningProgressData: Array<any>;
  leaderboard: Array<{
    rank: number;
    name: string;
    department: string;
    score: number;
    isCurrentUser: boolean;
  }>;
  exploreCourses: Array<any>;
  resumeData: { title?: string; href: string } | null;
  avgScore: number;
  isAdmin: boolean;
}

export default function DashboardClient({ 
  user, 
  kpis, 
  urgentAlerts, 
  activeCourses, 
  activityData,
  learningProgressData,
  leaderboard,
  exploreCourses,
  resumeData,
  avgScore,
  isAdmin
}: DashboardClientProps) {
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
    <div className="bg-[#f8f9ff] text-[#0b1c30] font-sans min-h-[calc(100vh-4rem)] flex flex-col w-full p-4 md:p-8">
      <main className="flex-1 w-full space-y-8 max-w-[1440px] mx-auto">
        
        {/* Urgent Alerts */}
        {urgentAlerts.length > 0 && (
          <div className="flex flex-col gap-3">
            {urgentAlerts.map((alert, idx) => {
              const isExpired = alert.daysRemaining < 0;
              const isToday = alert.daysRemaining === 0;

              // Smart UI Mapping based on deadline state
              const style = isExpired
                ? {
                    bg: "bg-rose-50/50",
                    border: "border-rose-200/60",
                    iconContainer: "bg-rose-100",
                    icon: "text-rose-600",
                    badgeText: "text-rose-700",
                    btn: "bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 hover:border-rose-300",
                    label: "Telah lewat deadline",
                    btnText: "Lihat Detail",
                    Icon: AlertTriangle,
                  }
                : isToday
                ? {
                    bg: "bg-amber-50/50",
                    border: "border-amber-200/60",
                    iconContainer: "bg-amber-100",
                    icon: "text-amber-600",
                    badgeText: "text-amber-800",
                    btn: "bg-amber-500 text-white border border-transparent hover:bg-amber-600",
                    label: "Tenggat Waktu Hari Ini",
                    btnText: "Selesaikan Segera",
                    Icon: Clock,
                  }
                : {
                    bg: "bg-blue-50/50",
                    border: "border-blue-200/60",
                    iconContainer: "bg-blue-100",
                    icon: "text-blue-600",
                    badgeText: "text-blue-800",
                    btn: "bg-blue-600 text-white border border-transparent hover:bg-blue-700",
                    label: `${alert.daysRemaining} Hari Lagi`,
                    btnText: "Lanjutkan Belajar",
                    Icon: Clock,
                  };

              return (
                <div
                  key={idx}
                  className={`group relative overflow-hidden rounded-xl border ${style.border} ${style.bg} p-4 sm:p-5 transition-all duration-300 hover:shadow-sm`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Icon Section */}
                    <div className={`flex items-center justify-center h-10 w-10 rounded-full shrink-0 ${style.iconContainer}`}>
                      <style.Icon className={`h-5 w-5 ${style.icon}`} />
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold uppercase tracking-wider ${style.badgeText}`}>
                          {style.label}
                        </span>
                        {isToday && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-slate-800 truncate">
                        {alert.title}
                      </h4>
                    </div>

                    {/* Action Button */}
                    <Link href={`/courses/${alert.courseId}`} className="shrink-0 mt-3 sm:mt-0">
                      <button className={`w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm active:scale-95 flex items-center justify-center gap-2 ${style.btn}`}>
                        {style.btnText}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Hero Section */}
        <div className="bg-slate-900 rounded-xl overflow-hidden relative shadow-md">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 z-0"></div>
          <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-white max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{greeting}, {user.name}</h1>
              <p className="text-lg text-slate-300">{user.department || "Karyawan BNI Finance"}</p>
              <div className="pt-4 flex flex-wrap gap-4">
                {resumeData ? (
                  <Link href={resumeData.href}>
                    <button className="bg-[#f7941d] text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-opacity-90 transition shadow-sm">
                      Lanjutkan Belajar
                    </button>
                  </Link>
                ) : (
                  <Link href="/courses">
                    <button className="bg-[#f7941d] text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-opacity-90 transition shadow-sm">
                      Mulai Belajar
                    </button>
                  </Link>
                )}
                <Link href="/performance">
                  <button className="bg-transparent border border-[#7df4ff] text-[#7df4ff] px-6 py-3 rounded-lg text-sm font-semibold hover:bg-white/10 transition shadow-sm">
                    Lihat Progres
                  </button>
                </Link>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 flex items-center gap-6 shrink-0">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-white/20" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"></path>
                  <path className="text-[#7df4ff]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${avgScore}, 100`} strokeWidth="4"></path>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xl text-white font-bold">{avgScore}%</div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-300">Performa</h3>
                <p className="text-lg text-white font-semibold">Rata-rata Skor</p>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#ffffff] border border-[#dac2af] border-t-4 border-t-[#006970] rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-[#544435] uppercase tracking-wider">Kursus Aktif</p>
                <h2 className="text-3xl font-semibold text-[#0b1c30] mt-1">{kpis.activeCourses}</h2>
              </div>
              <PlayCircle className="text-[#006970] w-8 h-8" />
            </div>
          </div>
          <div className="bg-[#ffffff] border border-[#dac2af] border-t-4 border-t-[#22c55e] rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-[#544435] uppercase tracking-wider">Modul Selesai</p>
                <h2 className="text-3xl font-semibold text-[#0b1c30] mt-1">{kpis.modulesDone}</h2>
              </div>
              <CheckCircle2 className="text-[#22c55e] w-8 h-8" />
            </div>
          </div>
          <div className="bg-[#ffffff] border border-[#dac2af] border-t-4 border-t-[#f7941d] rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-[#544435] uppercase tracking-wider">Ujian Lulus</p>
                <h2 className="text-3xl font-semibold text-[#0b1c30] mt-1">{kpis.testsPassed}</h2>
              </div>
              <Award className="text-[#f7941d] w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="space-y-6">
          {/* Learning Progress Full Width */}
          <div className="bg-[#ffffff] border border-[#dac2af] rounded-xl shadow-sm p-6 flex flex-col min-h-[300px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-[#0b1c30]">Learning Progress (6 Bulan Terakhir)</h3>
              <Link href="/performance" className="text-[#166874] text-sm font-semibold flex items-center hover:underline">
                Lihat Detail <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="flex-1 w-full relative -ml-4">
              <LearningProgressChart data={learningProgressData} />
            </div>
          </div>

          {/* Activity & Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#ffffff] border border-[#dac2af] rounded-xl shadow-sm p-6 flex flex-col">
              <h3 className="text-xl font-semibold text-[#0b1c30] mb-6">Aktivitas Mingguan (Jam)</h3>
              <div className="flex-1 min-h-[200px]">
                <ActivityChart data={activityData} />
              </div>
            </div>
            
            <div className="bg-[#ffffff] border border-[#dac2af] rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-[#0b1c30]">Leaderboard (Top 5)</h3>
              </div>
              <div className="mt-[-1rem]">
                <Leaderboard data={leaderboard} />
              </div>
            </div>
          </div>
        </div>

        {/* Bento Grid Layout for Pelajaran Aktif & Rekomendasi */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pelajaran Aktif */}
          <div className="lg:col-span-2 bg-[#ffffff] border border-[#dac2af] rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-[#0b1c30]">Pelajaran Aktif</h3>
              <Link href="/courses" className="text-[#166874] text-sm font-semibold flex items-center hover:underline">
                Lihat Semua <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            {activeCourses.length === 0 ? (
               <p className="text-sm text-[#544435] text-center py-8">Tidak ada kursus aktif saat ini.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeCourses.slice(0, 3).map((course, idx) => {
                  const progressPercentage = course.totalModules > 0 
                    ? Math.round((course.completedModules / course.totalModules) * 100) 
                    : 0;
                  
                  return (
                    <div key={course.id} className={`border border-[#dac2af] rounded-lg p-4 hover:shadow-md transition-shadow ${idx === 2 ? "md:col-span-2" : ""}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="bg-[#3abcc6]/20 text-[#006970] text-xs font-semibold inline-block px-2 py-1 rounded-full mb-2">
                            {course.category || "General"}
                          </div>
                          <h4 className="text-sm font-semibold text-[#0b1c30] mb-1 line-clamp-2">
                            {course.title}
                          </h4>
                          <p className="text-sm text-[#544435] mb-4">
                            {course.completedModules} dari {course.totalModules} Modul Selesai
                          </p>
                          <div className="w-full bg-[#dce9ff] rounded-full h-2 mb-1">
                            <div className="bg-[#f7941d] h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                          </div>
                          <div className="flex justify-between text-xs font-semibold text-[#544435]">
                            <span>{progressPercentage}%</span>
                            <span>Estimasi: {Math.max(15, (course.totalModules - course.completedModules) * 15)} Menit</span>
                          </div>
                        </div>
                        {idx === 2 && (
                          <Link href={`/courses/${course.id}`}>
                            <button className="shrink-0 bg-[#f7941d] text-white p-2 rounded-lg hover:bg-opacity-90 transition">
                              <Play className="w-5 h-5" />
                            </button>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rekomendasi */}
          <div className="bg-[#ffffff] border border-[#dac2af] rounded-xl shadow-sm p-6 flex flex-col">
            <h3 className="text-xl font-semibold text-[#0b1c30] mb-6">Rekomendasi Untuk Anda</h3>
            
            {exploreCourses.length === 0 ? (
               <p className="text-sm text-[#544435] text-center py-8">Tidak ada rekomendasi saat ini.</p>
            ) : (
              <div className="space-y-4 flex-1">
                {exploreCourses.slice(0, 3).map((rec, idx) => (
                  <Link href={`/courses/${rec.id}`} key={rec.id}>
                    <div className="flex items-start gap-3 group cursor-pointer mt-4">
                      <div className="bg-[#eff4ff] rounded-lg p-2 text-[#166874] group-hover:bg-[#166874] group-hover:text-white transition-colors">
                        {idx === 0 ? <TrendingUp className="w-5 h-5" /> : idx === 1 ? <Shield className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#0b1c30] group-hover:text-[#166874] transition-colors line-clamp-2">
                          {rec.title}
                        </h4>
                        <p className="text-sm text-[#544435]">
                          {rec.category || "General"} • {rec.modules?.length || 0} Modul
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            
            <Link href="/courses">
              <button className="mt-6 w-full py-2 border border-[#dac2af] rounded-lg text-[#166874] text-sm font-semibold hover:bg-[#eff4ff] transition-colors">
                Jelajahi Library
              </button>
            </Link>
          </div>
        </div>
        
      </main>
    </div>
  );
}