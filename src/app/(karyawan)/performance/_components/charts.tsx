"use client";

import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { TrendingUp, BarChart3 } from "lucide-react";

export function TrendAreaChart({ trendData, config }: { trendData: any[], config: any }) {
  if (!trendData || trendData.length < 2) {
    return (
      <div className="h-[220px] flex flex-col items-center justify-center text-slate-400 gap-3">
        <TrendingUp className="h-10 w-10 opacity-20" />
        <p className="text-xs font-bold uppercase tracking-wider opacity-60">Butuh minimal 2 data untuk menampilkan tren</p>
      </div>
    );
  }

  return (
    <ChartContainer config={config} className="h-[220px] w-full">
      <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#E8A020" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#E8A020" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
        <XAxis
          dataKey="title"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }}
          tickFormatter={(v) => v.length > 8 ? v.slice(0, 8) + "…" : v}
        />
        <YAxis
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }}
          tickFormatter={(v) => `${v}%`}
        />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Area
          type="monotone"
          dataKey="score"
          stroke="#E8A020"
          strokeWidth={3}
          fill="url(#scoreGrad)"
          dot={{ r: 4, fill: "#E8A020", strokeWidth: 0 }}
          activeDot={{ r: 6, fill: "#0F1C3F", stroke: "#E8A020", strokeWidth: 2 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function CompareBarChart({ barData, config }: { barData: any[], config: any }) {
  if (!barData || barData.length === 0) {
    return (
      <div className="h-[220px] flex flex-col items-center justify-center text-slate-400 gap-3">
        <BarChart3 className="h-10 w-10 opacity-20" />
        <p className="text-xs font-bold uppercase tracking-wider opacity-60">Belum ada data perbandingan</p>
      </div>
    );
  }

  return (
    <ChartContainer config={config} className="h-[220px] w-full">
      <BarChart data={barData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }} barGap={4}>
        <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 9, fill: "#64748b", fontWeight: 600 }}
        />
        <YAxis
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 9, fill: "#64748b", fontWeight: 600 }}
          tickFormatter={(v) => `${v}`}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="preScore" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={20} />
        <Bar dataKey="postScore" fill="#0F1C3F" radius={[4, 4, 0, 0]} maxBarSize={20} />
      </BarChart>
    </ChartContainer>
  );
}
