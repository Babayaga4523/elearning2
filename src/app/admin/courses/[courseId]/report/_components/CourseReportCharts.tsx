"use client";

import { TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const NAVY = "#0F1C3F";
const GOLD = "#E8A020";
const EMERALD = "#10B981";
const ROSE = "#EF4444";
const SLATE = "#94a3b8";

interface CourseReportChartsProps {
  avgPre: number;
  avgPost: number;
  reportRows: any[];
  scoreDistribution: { range: string; pre: number; post: number }[];
  moduleCompletion: { name: string; completed: number; total: number }[];
  totalEnrolled: number;
  courseModulesLength: number;
}

// ─── 1. Horizontal Bar Chart — Progres Modul ─────────────────────────────────
function ModuleProgressChart({
  moduleCompletion,
  totalEnrolled,
  courseModulesLength,
}: {
  moduleCompletion: { name: string; completed: number; total: number }[];
  totalEnrolled: number;
  courseModulesLength: number;
}) {
  const config = {
    completed: {
      label: "Peserta Selesai",
      color: NAVY,
    },
  } satisfies ChartConfig;

  const chartHeight = Math.max(280, courseModulesLength * 52);
  const isEmpty = courseModulesLength === 0 || moduleCompletion.every((d) => d.completed === 0);

  return (
    <Card className="border border-[#E4E7EC] shadow-sm bg-white rounded-xl overflow-hidden flex flex-col h-full">
      <CardHeader className="border-b border-[#E4E7EC] bg-[#F8F9FB]/50 pb-4">
        <CardTitle className="text-sm font-bold text-[#101828] font-['Lexend_Deca'] leading-tight">
          Progres Modul
        </CardTitle>
        <CardDescription className="text-[10px] font-medium text-[#475467] uppercase tracking-wider mt-1 font-['DM_Sans']">
          Peserta yang menyelesaikan setiap modul
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pt-6 pr-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-[220px] text-[#98A2B3] gap-3">
            <div className="h-12 w-12 rounded-xl bg-[#F8F9FB] flex items-center justify-center border border-[#E4E7EC]">
              <TrendingUp className="h-5 w-5 text-[#98A2B3]" />
            </div>
            <p className="text-xs font-medium italic">Belum ada modul yang published.</p>
          </div>
        ) : (
          <ChartContainer config={config} style={{ height: `${chartHeight}px` }} className="w-full">
            <BarChart
              accessibilityLayer
              data={moduleCompletion}
              layout="vertical"
              margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                dataKey="completed"
                domain={[0, totalEnrolled || 1]}
                hide
              />
              <YAxis
                dataKey="name"
                type="category"
                width={150}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fontWeight: 600, fill: "#475467", fontFamily: "DM Sans, sans-serif" }}
                tickMargin={10}
                tickFormatter={(value: string) =>
                  value.length > 22 ? `${value.substring(0, 22)}…` : value
                }
              />
              <ChartTooltip
                cursor={{ fill: `${NAVY}08` }}
                content={<ChartTooltipContent hideLabel className="rounded-xl border-[#E4E7EC] shadow-lg bg-white" />}
              />
              <Bar dataKey="completed" fill={NAVY} radius={[0, 4, 4, 0]} maxBarSize={24} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#98A2B3] border-t border-[#E4E7EC] py-4 px-6 font-['DM_Sans']">
        <div className="flex gap-2 leading-none">
          Penyelesaian Materi <TrendingUp className="h-3.5 w-3.5 text-[#E8A020]" />
        </div>
        <div className="leading-none text-[#475467] normal-case tracking-normal font-medium">
          {totalEnrolled} total peserta terdaftar
        </div>
      </CardFooter>
    </Card>
  );
}

// ─── 2. Multiple Bar Chart — Perbandingan Rata-rata Nilai ─────────────────────
function ScoreComparisonChart({
  avgPre,
  avgPost,
  passingScore,
}: {
  avgPre: number;
  avgPost: number;
  passingScore: number;
}) {
  const config = {
    pre: {
      label: "Pre-Test",
      color: NAVY,
    },
    post: {
      label: "Post-Test",
      color: GOLD,
    },
  } satisfies ChartConfig;

  const data = [
    {
      name: "Rata-rata Nilai",
      pre: avgPre,
      post: avgPost,
    },
  ];

  const noData = avgPre === 0 && avgPost === 0;

  return (
    <Card className="border border-[#E4E7EC] shadow-sm bg-white rounded-xl overflow-hidden flex flex-col h-full">
      <CardHeader className="border-b border-[#E4E7EC] bg-[#F8F9FB]/50 pb-4">
        <CardTitle className="text-sm font-bold text-[#101828] font-['Lexend_Deca'] leading-tight">
          Perbandingan Rata-rata Nilai
        </CardTitle>
        <CardDescription className="text-[10px] font-medium text-[#475467] uppercase tracking-wider mt-1 font-['DM_Sans']">
          Pre-Test vs Post-Test (skor akhir tertinggi)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pt-6">
        {noData ? (
          <div className="flex flex-col items-center justify-center h-[220px] text-[#98A2B3] gap-3">
            <div className="h-12 w-12 rounded-xl bg-[#F8F9FB] flex items-center justify-center border border-[#E4E7EC]">
              <TrendingUp className="h-5 w-5 text-[#98A2B3]" />
            </div>
            <p className="text-xs font-medium italic">Belum ada peserta yang mengerjakan tes.</p>
          </div>
        ) : (
          <ChartContainer config={config} className="h-[260px] w-full">
            <BarChart accessibilityLayer data={data} barCategoryGap="40%">
              <CartesianGrid vertical={false} stroke="#F8F9FB" />
              <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tick={{ fontSize: 11, fontWeight: 700, fill: "#98A2B3", fontFamily: "DM Sans, sans-serif" }}
              />
              <YAxis
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#98A2B3" }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dashed"
                    className="rounded-xl border-[#E4E7EC] shadow-lg bg-white"
                    formatter={(value, name) => [
                      <span key={name} className="font-bold">
                        {value === 0 ? "Belum ada data" : `${value} / 100`}
                      </span>,
                      name === "pre" ? "Pre-Test" : "Post-Test",
                    ]}
                  />
                }
              />
              <Bar dataKey="pre" fill={NAVY} radius={4} maxBarSize={60} />
              <Bar dataKey="post" fill={GOLD} radius={4} maxBarSize={60} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#98A2B3] border-t border-[#E4E7EC] py-4 px-6 font-['DM_Sans']">
        <div className="flex gap-2 leading-none items-center">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: NAVY }}
          />
          Pre-Test &nbsp;
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: GOLD }}
          />
          Post-Test
        </div>
        <div className="leading-none text-[#475467] normal-case tracking-normal font-medium">
          Passing score: {passingScore} poin
        </div>
      </CardFooter>
    </Card>
  );
}

// ─── 3. Radial Stacked Chart — Distribusi Nilai (Opsi B) ─────────────────────
function ScoreDistributionChart({
  scoreDistribution,
}: {
  scoreDistribution: { range: string; pre: number; post: number }[];
}) {
  // Aggregate into 3 meaningful buckets using all test attempts (pre + post combined)
  const below60 = scoreDistribution
    .filter((_, i) => i <= 5) // ranges: 0-9 .. 50-59
    .reduce((s, d) => s + d.pre + d.post, 0);

  const mid = scoreDistribution
    .filter((_, i) => i >= 6 && i <= 7) // 60-69, 70-79
    .reduce((s, d) => s + d.pre + d.post, 0);

  const above80 = scoreDistribution
    .filter((_, i) => i >= 8) // 80-89, 90-99
    .reduce((s, d) => s + d.pre + d.post, 0);

  const totalAttempts = below60 + mid + above80;

  const radialData = [
    { name: "0–59 (Gagal)", value: below60, fill: ROSE },
    { name: "60–79 (Cukup)", value: mid, fill: GOLD },
    { name: "80–100 (Lulus)", value: above80, fill: EMERALD },
  ];

  const config = {
    value: {
      label: "Pengerjaan",
    },
  } satisfies ChartConfig;

  const isEmpty = totalAttempts === 0;

  return (
    <Card className="border border-[#E4E7EC] shadow-sm bg-white rounded-xl overflow-hidden flex flex-col h-full">
      <CardHeader className="border-b border-[#E4E7EC] bg-[#F8F9FB]/50 pb-4 items-center text-center">
        <CardTitle className="text-sm font-bold text-[#101828] font-['Lexend_Deca'] leading-tight">
          Distribusi Nilai
        </CardTitle>
        <CardDescription className="text-[10px] font-medium text-[#475467] uppercase tracking-wider mt-1 font-['DM_Sans']">
          Sebaran hasil pengerjaan tes (Pre + Post)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center pb-2">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-[220px] text-[#98A2B3] gap-3">
            <div className="h-12 w-12 rounded-xl bg-[#F8F9FB] flex items-center justify-center border border-[#E4E7EC]">
              <TrendingUp className="h-5 w-5 text-[#98A2B3]" />
            </div>
            <p className="text-xs font-medium italic">Belum ada data pengerjaan tes.</p>
          </div>
        ) : (
          <ChartContainer
            config={config}
            className="mx-auto aspect-square w-full max-w-[260px]"
          >
            <RadialBarChart
              data={radialData}
              endAngle={180}
              innerRadius={80}
              outerRadius={115}
            >
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    className="rounded-xl border-[#E4E7EC] shadow-lg bg-white"
                    formatter={(value, name) => [
                      <span key={name} className="font-bold">
                        {value} pengerjaan ({totalAttempts > 0 ? Math.round((Number(value) / totalAttempts) * 100) : 0}%)
                      </span>,
                      name,
                    ]}
                  />
                }
              />
              <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 14}
                            className="fill-foreground text-2xl font-bold"
                            style={{ fontSize: "22px", fontWeight: 900, fill: NAVY, fontFamily: "Lexend Deca" }}
                          >
                            {totalAttempts}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 6}
                            style={{ fontSize: "10px", fill: "#98A2B3", fontWeight: 700 }}
                          >
                            Total Tes
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </PolarRadiusAxis>
              <PolarGrid />
              <RadialBar dataKey="value" cornerRadius={5} className="stroke-transparent stroke-2" />
            </RadialBarChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col items-center gap-3 border-t border-[#E4E7EC] py-4 px-6 font-['DM_Sans']">
        <div className="flex items-center gap-5 text-[10px] font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: ROSE }} />
            <span className="text-[#98A2B3]">0–59</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: GOLD }} />
            <span className="text-[#98A2B3]">60–79</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: EMERALD }} />
            <span className="text-[#98A2B3]">80–100</span>
          </span>
        </div>
        <div className="text-[10px] font-medium text-[#475467]">
          Total {totalAttempts} pengerjaan tes (pre + post)
        </div>
      </CardFooter>
    </Card>
  );
}

// ─── Main Exported Component ──────────────────────────────────────────────────
export default function CourseReportCharts({
  avgPre,
  avgPost,
  reportRows,
  scoreDistribution,
  moduleCompletion,
  totalEnrolled,
  courseModulesLength,
}: CourseReportChartsProps) {
  const passingScore = reportRows[0]?.prePassing ?? 70;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Horizontal Bar — Progres Modul */}
      <div className="lg:col-span-2">
        <ModuleProgressChart
          moduleCompletion={moduleCompletion}
          totalEnrolled={totalEnrolled}
          courseModulesLength={courseModulesLength}
        />
      </div>

      {/* Multiple Bar — Perbandingan Nilai */}
      <div>
        <ScoreComparisonChart
          avgPre={avgPre}
          avgPost={avgPost}
          passingScore={passingScore}
        />
      </div>

      {/* Radial Stacked — Distribusi Nilai */}
      <div>
        <ScoreDistributionChart scoreDistribution={scoreDistribution} />
      </div>
    </div>
  );
}
