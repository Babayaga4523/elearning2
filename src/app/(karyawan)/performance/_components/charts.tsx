"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  Tooltip,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";

/* ─── Consistent axis tick style ─── */
const axisTickStyle = {
  fontSize: 12 as const,
  fontWeight: 600 as const,
  fontFamily: "'DM Sans', sans-serif",
};

export function TrendAreaChart({
  trendData,
  config,
}: {
  trendData: any[];
  config: any;
}) {
  if (!trendData || trendData.length < 2) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <TrendingUp className="h-10 w-10 text-[#E4E7EC]" />
        <p className="text-sm text-[#98A2B3] font-['DM_Sans'] font-medium">
          Butuh minimal 2 data untuk menampilkan tren
        </p>
      </div>
    );
  }

  return (
    <ChartContainer config={config} className="w-full h-full">
      <AreaChart
        data={trendData}
        margin={{ top: 12, right: 12, left: -8, bottom: 8 }}
      >
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#E8A020" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#E8A020" stopOpacity={0.02} />
          </linearGradient>
        </defs>

        <CartesianGrid
          vertical={false}
          strokeDasharray="3 3"
          stroke="#E4E7EC"
          opacity={0.7}
        />

        <XAxis
          dataKey="title"
          tickLine={false}
          axisLine={false}
          tick={{ ...axisTickStyle, fill: "#98A2B3" }}
          tickFormatter={(v) =>
            v.length > 10 ? v.slice(0, 10) + "…" : v
          }
          dy={8}
        />

        <YAxis
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          tick={{ ...axisTickStyle, fill: "#98A2B3" }}
          tickFormatter={(v) => `${v}%`}
        />

        <ChartTooltip
          cursor={{ stroke: "#E8A020", strokeWidth: 1, strokeDasharray: "4 4" }}
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(label) => `${label}`}
              formatter={(value) => [
                <span
                  key="val"
                  className="font-semibold text-[#101828] text-sm font-['DM_Sans']"
                >
                  {value}%
                </span>,
              ]}
            />
          }
        />

        <Area
          type="monotone"
          dataKey="score"
          stroke="#E8A020"
          strokeWidth={2.5}
          fill="url(#scoreGrad)"
          dot={{ r: 4, fill: "#E8A020", strokeWidth: 0 }}
          activeDot={{
            r: 6,
            fill: "#fff",
            stroke: "#E8A020",
            strokeWidth: 2.5,
          }}
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function CompareBarChart({
  barData,
  config,
}: {
  barData: any[];
  config: any;
}) {
  if (!barData || barData.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <TrendingUp className="h-10 w-10 text-[#E4E7EC]" />
        <p className="text-sm text-[#98A2B3] font-['DM_Sans'] font-medium">
          Belum ada data perbandingan
        </p>
      </div>
    );
  }

  return (
    <ChartContainer config={config} className="w-full h-full">
      <BarChart
        data={barData}
        margin={{ top: 12, right: 12, left: -8, bottom: 8 }}
        barGap={6}
      >
        <CartesianGrid
          vertical={false}
          strokeDasharray="3 3"
          stroke="#E4E7EC"
          opacity={0.7}
        />

        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tick={{ ...axisTickStyle, fill: "#98A2B3" }}
          tickFormatter={(v) =>
            v.length > 10 ? v.slice(0, 10) + "…" : v
          }
          dy={8}
        />

        <YAxis
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          tick={{ ...axisTickStyle, fill: "#98A2B3" }}
          tickFormatter={(v) => `${v}`}
        />

        <ChartTooltip
          cursor={{ fill: "rgba(232,160,32,0.06)" }}
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={(label) => `${label}`}
            />
          }
        />

        {/* Pre-Test bars */}
        <Bar
          dataKey="preScore"
          fill="#CBD2E0"
          radius={[6, 6, 0, 0]}
          maxBarSize={32}
        >
          <LabelList
            dataKey="preScore"
            position="top"
            style={{
              fontSize: "11px",
              fontWeight: 700,
              fill: "#475467",
              fontFamily: "'DM Sans', sans-serif",
            }}
            formatter={(v: number) => (v > 0 ? `${v}` : "")}
          />
        </Bar>

        {/* Post-Test bars */}
        <Bar
          dataKey="postScore"
          fill="#0F1C3F"
          radius={[6, 6, 0, 0]}
          maxBarSize={32}
        >
          <LabelList
            dataKey="postScore"
            position="top"
            style={{
              fontSize: "11px",
              fontWeight: 700,
              fill: "#0F1C3F",
              fontFamily: "'DM Sans', sans-serif",
            }}
            formatter={(v: number) => (v > 0 ? `${v}` : "")}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}