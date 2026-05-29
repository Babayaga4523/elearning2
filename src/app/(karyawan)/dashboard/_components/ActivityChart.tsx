"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";
import type { ChartConfig } from "@/components/ui/chart";

interface ActivityChartProps {
  data: { day: string; count: number }[];
}

const chartConfig = {
  count: {
    label: "Modul Selesai",
    color: "#E8A020",
  },
} satisfies ChartConfig;

/* ─── Chart axis tick styled to match design system ─── */
const axisTickStyle = {
  fontSize: 12 as const,
  fontWeight: 600 as const,
  fontFamily: "'DM Sans', sans-serif",
};

export default function ActivityChart({ data }: ActivityChartProps) {
  const totalModules = data.reduce((sum, item) => sum + item.count, 0);
  const avgPerDay = data.length > 0 ? (totalModules / data.length).toFixed(1) : "0";
  const maxDay = data.reduce(
    (max, item) => (item.count > (max?.count ?? 0) ? item : max),
    data[0]
  );

  return (
    <div className="w-full h-full flex flex-col">
      {/* Stats row */}
      <div className="flex items-center justify-between mb-4 px-1">
        {totalModules > 0 ? (
          <>
            <div>
              <p className="text-3xl font-bold text-[#101828] font-['Lexend_Deca'] leading-none tabular-nums">
                {totalModules}
              </p>
              <p className="text-sm text-[#475467] font-['DM_Sans'] mt-1">
                modul diselesaikan
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ECFDF3] border border-[#6CE9A6]">
              <TrendingUp size={14} className="text-[#027A48]" />
              <span className="text-sm font-semibold text-[#027A48] font-['DM_Sans']">
                {avgPerDay}/hari
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-[#98A2B3] font-['DM_Sans']">
            Belum ada aktivitas minggu ini
          </p>
        )}
      </div>

      {/* Chart */}
      <div className="flex-1 w-full min-h-[200px]">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <BarChart
            data={data}
            margin={{ top: 8, right: 12, left: -8, bottom: 8 }}
            barCategoryGap="35%"
          >
            <defs>
              <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E8A020" stopOpacity={1} />
                <stop offset="100%" stopColor="#C4861A" stopOpacity={0.75} />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="#E4E7EC"
              opacity={0.7}
            />

            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ ...axisTickStyle, fill: "#98A2B3" }}
              dy={8}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ ...axisTickStyle, fill: "#98A2B3" }}
              tickFormatter={(value) => `${value}`}
              allowDecimals={false}
            />

            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(value) => `${value}`}
                  formatter={(value) => [
                    <span key="val" className="font-semibold text-[#101828] text-sm font-['DM_Sans']">
                      {value} modul
                    </span>,
                  ]}
                />
              }
              cursor={{ fill: "rgba(232,160,32,0.07)" }}
            />

            <Bar
              dataKey="count"
              fill="url(#activityGradient)"
              radius={[8, 8, 0, 0]}
              maxBarSize={52}
            />
          </BarChart>
        </ChartContainer>
      </div>

      {/* Footer */}
      {totalModules > 0 && maxDay && (
        <div className="mt-4 pt-3 border-t border-[#E4E7EC] flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#E8A020] to-[#F5C05A]" />
            <span className="text-sm text-[#475467] font-['DM_Sans']">
              Paling produktif:
            </span>
          </div>
          <span className="text-sm font-semibold text-[#101828] font-['DM_Sans']">
            {maxDay.day} ({maxDay.count} modul)
          </span>
        </div>
      )}
    </div>
  );
}