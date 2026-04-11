"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

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
  // Config data for average comparison
  const comparisonData = [
    {
      name: "Rata-rata",
      pre: avgPre,
      post: avgPost,
      passing: reportRows[0]?.prePassing ?? 70,
    },
  ];

  const comparisonConfig = {
    pre: {
      label: "Pre-Test",
      color: "hsl(var(--chart-1))", // BNI Navy
    },
    post: {
      label: "Post-Test",
      color: "hsl(var(--chart-2))", // BNI Gold
    },
    passing: {
      label: "Passing Score",
      color: "#94a3b8",
    },
  } satisfies ChartConfig;

  const distributionConfig = {
    pre: {
      label: "Pre-Test",
      color: "hsl(var(--chart-1))",
    },
    post: {
      label: "Post-Test",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  const progressConfig = {
    completed: {
      label: "Peserta Selesai",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pre vs Post Comparison */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50 pb-4 bg-slate-50/30">
          <CardTitle className="text-base font-black text-[#0F1C3F]">
            Perbandingan Rata-rata Nilai
          </CardTitle>
          <p className="text-xs text-slate-400 font-medium">Pre-Test vs Post-Test (Hasil Akhir)</p>
        </CardHeader>
        <CardContent className="pt-6">
          {avgPre === 0 && avgPost === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-300 text-sm italic">
              Belum ada data nilai tes.
            </div>
          ) : (
            <ChartContainer config={comparisonConfig} className="h-[220px] w-full">
              <BarChart data={comparisonData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tick={{ fontSize: 12, fontWeight: 700 }}
                />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="pre" fill="var(--color-pre)" radius={4} maxBarSize={50} />
                <Bar dataKey="post" fill="var(--color-post)" radius={4} maxBarSize={50} />
                <Bar dataKey="passing" fill="var(--color-passing)" radius={4} maxBarSize={15} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Score Distribution */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50 pb-4 bg-slate-50/30">
          <CardTitle className="text-base font-black text-[#0F1C3F]">
            Distribusi Nilai
          </CardTitle>
          <p className="text-xs text-slate-400 font-medium">Rentang nilai Pre & Post Test</p>
        </CardHeader>
        <CardContent className="pt-6">
          {scoreDistribution.every((d) => d.pre === 0 && d.post === 0) ? (
            <div className="h-48 flex items-center justify-center text-slate-300 text-sm italic">
              Belum ada data nilai.
            </div>
          ) : (
            <ChartContainer config={distributionConfig} className="h-[220px] w-full">
              <BarChart data={scoreDistribution}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="range"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="pre" fill="var(--color-pre)" radius={4} />
                <Bar dataKey="post" fill="var(--color-post)" radius={4} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Module Completion */}
      <Card className="border-slate-200 shadow-sm bg-white lg:col-span-2 overflow-hidden">
        <CardHeader className="border-b border-slate-50 pb-4 bg-slate-50/30">
          <CardTitle className="text-base font-black text-[#0F1C3F]">Progress Modul</CardTitle>
          <p className="text-xs text-slate-400 font-medium">
            Peserta yang menyelesaikan setiap modul
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          {courseModulesLength === 0 ? (
            <div className="h-32 flex items-center justify-center text-slate-300 text-sm italic">
              Belum ada modul published.
            </div>
          ) : (
            <ChartContainer config={progressConfig} className="h-[250px] w-full">
              <BarChart data={moduleCompletion} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, totalEnrolled || 1]} hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={140}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fontWeight: 600, fill: "#1e293b" }}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="completed" fill="var(--color-completed)" radius={[0, 4, 4, 0]} maxBarSize={30} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
