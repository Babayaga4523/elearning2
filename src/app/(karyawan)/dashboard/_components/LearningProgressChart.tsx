"use client";

import { TrendingUp } from "lucide-react";
import { CartesianGrid, LabelList, Line, LineChart, XAxis, Tooltip } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

/* ─── Chart axis tick — consistent design system ─── */
const axisTickStyle = {
  fontSize: 12 as const,
  fontWeight: 600 as const,
  fontFamily: "'DM Sans', sans-serif",
};

const chartConfig = {
  modules: {
    label: "Modul Selesai",
    color: "#E8A020",
  },
  tests: {
    label: "Test Lulus",
    color: "#175CD3",
  },
} satisfies ChartConfig;

interface LearningProgressChartProps {
  data: Array<{
    month: string;
    modules: number;
    tests: number;
  }>;
}

export function LearningProgressChart({ data }: LearningProgressChartProps) {
  const currentMonth = data[data.length - 1];
  const previousMonth = data[data.length - 2];

  const currentTotal = currentMonth
    ? currentMonth.modules + currentMonth.tests
    : 0;
  const previousTotal = previousMonth
    ? previousMonth.modules + previousMonth.tests
    : 0;

  const trendPct =
    previousTotal > 0
      ? ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1)
      : "0";
  const isPositive = parseFloat(trendPct) >= 0;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Stats row */}
      <div className="flex items-center justify-between mb-4 px-1">
        {currentTotal > 0 ? (
          <>
            <div>
              <p className="text-3xl font-bold text-[#101828] font-['Lexend_Deca'] leading-none tabular-nums">
                {currentTotal}
              </p>
              <p className="text-sm text-[#475467] font-['DM_Sans'] mt-1">
                aktivitas bulan ini
              </p>
            </div>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                isPositive
                  ? "bg-[#ECFDF3] border-[#6CE9A6] text-[#027A48]"
                  : "bg-[#FEF3F2] border-[#FDA29B] text-[#B42318]"
              }`}
            >
              <TrendingUp
                size={14}
                className={isPositive ? "" : "rotate-180"}
              />
              <span className="text-sm font-semibold font-['DM_Sans']">
                {isPositive ? "+" : ""}
                {trendPct}% vs kemarin
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-[#98A2B3] font-['DM_Sans']">
            Belum ada aktivitas 6 bulan terakhir
          </p>
        )}
      </div>

      {/* Chart */}
      <div className="flex-1 w-full min-h-[200px]">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <LineChart
            accessibilityLayer
            data={data}
            margin={{ top: 12, left: 4, right: 12, bottom: 8 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="#E4E7EC"
              opacity={0.7}
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ ...axisTickStyle, fill: "#98A2B3" }}
              tickMargin={10}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(label) => `${label}`}
                  formatter={(value, name) => [
                    <span
                      key={name as string}
                      className="font-semibold text-[#101828] text-sm font-['DM_Sans']"
                    >
                      {value}{" "}
                      {(name as string) === "modules" ? "modul" : "ujian"}
                    </span>,
                  ]}
                />
              }
            />
            <Line
              dataKey="modules"
              type="natural"
              stroke="#E8A020"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#E8A020", strokeWidth: 0 }}
              activeDot={{
                r: 6,
                fill: "#0F1C3F",
                stroke: "#E8A020",
                strokeWidth: 2,
              }}
            >
              <LabelList
                position="top"
                offset={14}
                className="fill-[#475467]"
                fontSize={11}
                fontWeight={600}
                fontFamily="'DM Sans', sans-serif"
              />
            </Line>
            <Line
              dataKey="tests"
              type="natural"
              stroke="#175CD3"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#175CD3", strokeWidth: 0 }}
              activeDot={{
                r: 6,
                fill: "#0F1C3F",
                stroke: "#175CD3",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ChartContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-[#E4E7EC] flex items-center justify-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#E8A020]" />
          <span className="text-sm text-[#475467] font-['DM_Sans']">
            Modul Selesai
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#175CD3]" />
          <span className="text-sm text-[#475467] font-['DM_Sans']">
            Test Lulus
          </span>
        </div>
      </div>
    </div>
  );
}