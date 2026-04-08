"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CourseReportChartsProps {
  avgPre: number;
  avgPost: number;
  reportRows: any[];
  scoreDistribution: { range: string; pre: number; post: number }[];
  moduleCompletion: { name: string; completed: number; total: number }[];
  totalEnrolled: number;
  courseModulesLength: number;
}

export default function CourseReportCharts({
  avgPre,
  avgPost,
  reportRows,
  scoreDistribution,
  moduleCompletion,
  totalEnrolled,
  courseModulesLength,
}: CourseReportChartsProps) {
  const comparisonData = [
    {
      name: "Rata-rata",
      "Pre-Test": avgPre,
      "Post-Test": avgPost,
      "Passing Score": reportRows[0]?.prePassing ?? 70,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pre vs Post Comparison */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="border-b border-slate-50 pb-4">
          <CardTitle className="text-base font-black text-slate-800">
            Perbandingan Rata-rata Nilai
          </CardTitle>
          <p className="text-xs text-slate-400 font-medium">Pre-Test vs Post-Test (nilai rata-rata)</p>
        </CardHeader>
        <CardContent className="pt-6">
          {avgPre === 0 && avgPost === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-300 text-sm italic">
              Belum ada data nilai tes.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={comparisonData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700, fill: "#94a3b8" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,.08)" }}
                />
                <Legend wrapperStyle={{ fontWeight: 700, fontSize: 12 }} />
                <Bar dataKey="Pre-Test" fill="#818cf8" radius={[6, 6, 0, 0]} maxBarSize={60} />
                <Bar dataKey="Post-Test" fill="#34d399" radius={[6, 6, 0, 0]} maxBarSize={60} />
                <Bar dataKey="Passing Score" fill="#fbbf24" radius={[6, 6, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Score Distribution */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="border-b border-slate-50 pb-4">
          <CardTitle className="text-base font-black text-slate-800">
            Distribusi Nilai Pre &amp; Post Test
          </CardTitle>
          <p className="text-xs text-slate-400 font-medium">Sebaran nilai per rentang (semua percobaan)</p>
        </CardHeader>
        <CardContent className="pt-6">
          {scoreDistribution.every((d) => d.pre === 0 && d.post === 0) ? (
            <div className="h-48 flex items-center justify-center text-slate-300 text-sm italic">
              Belum ada data nilai.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,.08)" }}
                />
                <Legend wrapperStyle={{ fontWeight: 700, fontSize: 12 }} />
                <Bar dataKey="pre" name="Pre-Test" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="post" name="Post-Test" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Module Completion */}
      <Card className="border-slate-200 shadow-sm bg-white lg:col-span-2">
        <CardHeader className="border-b border-slate-50 pb-4">
          <CardTitle className="text-base font-black text-slate-800">Progress Modul</CardTitle>
          <p className="text-xs text-slate-400 font-medium">
            Jumlah peserta yang menyelesaikan setiap modul
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          {courseModulesLength === 0 ? (
            <div className="h-32 flex items-center justify-center text-slate-300 text-sm italic">
              Belum ada modul published.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={moduleCompletion} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" domain={[0, totalEnrolled || 1]} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={140}
                  tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,.08)" }}
                  formatter={(v) => [v, "Peserta Selesai"]}
                />
                <Bar dataKey="completed" name="Selesai" fill="#6366f1" radius={[0, 6, 6, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
