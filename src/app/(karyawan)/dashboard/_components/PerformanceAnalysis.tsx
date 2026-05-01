import React from "react";
import ActivityChart from "@/app/(karyawan)/dashboard/_components/ActivityChart";
import Leaderboard from "@/app/(karyawan)/dashboard/_components/Leaderboard";
import { TrendingUp, Award } from "lucide-react";

interface PerformanceAnalysisProps {
  activityData: { day: string; count: number }[];
  leaderboard: {
    rank: number;
    name: string;
    department: string;
    score: number;
    isCurrentUser: boolean;
  }[];
}

export default function PerformanceAnalysis({
  activityData,
  leaderboard,
}: PerformanceAnalysisProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Activity Chart - 2/3 Width on Large Screens */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-2xl shadow-inner">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
              Progres Mingguan
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              Statistik penyelesaian modul 7 hari terakhir.
            </p>
          </div>
        </div>
        <ActivityChart data={activityData} />
      </div>

      {/* Leaderboard - 1/3 Width on Large Screens */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-2xl shadow-inner">
            <Award className="h-6 w-6 text-amber-600" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
              Top Performers
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              Karyawan dengan kursus terbanyak.
            </p>
          </div>
        </div>
        <Leaderboard data={leaderboard} />
      </div>
    </div>
  );
}
// Trigger re-scan
