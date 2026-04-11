"use client";

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Pie,
  PieChart,
} from "recharts";
import { BarChart3 } from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

interface AnalyticsProps {
  data: any[];
  title: string;
}

export const BarChartWidget = ({ data, title }: AnalyticsProps) => {
  const chartConfig = {
    total: {
      label: "Enrollment",
      color: "hsl(var(--chart-1))",
    },
    completed: {
      label: "Selesai",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E6F0] bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F1C3F] shadow-sm">
          <BarChart3 className="h-4 w-4 text-[#E8A020]" />
        </div>
        <h3 className="text-base font-black tracking-tight text-[#0F1C3F]">
          {title}
        </h3>
      </div>
      <div className="p-6">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data}>
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="total" fill="var(--color-total)" radius={4} />
            <Bar dataKey="completed" fill="var(--color-completed)" radius={4} />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
};

export const DonutChartWidget = ({ data, title }: AnalyticsProps) => {
  // Pie chart expects data with innerRadius for donut effect
  const chartConfig = data.reduce((acc, curr, idx) => {
    acc[curr.name] = {
      label: curr.name,
      color: curr.fill || `hsl(var(--chart-${(idx % 5) + 1}))`,
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E6F0] bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F1C3F] shadow-sm">
          <BarChart3 className="h-4 w-4 text-[#E8A020]" />
        </div>
        <h3 className="text-base font-black tracking-tight text-[#0F1C3F]">
          {title}
        </h3>
      </div>
      <div className="p-6">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={80}
              strokeWidth={5}
            />
            <ChartLegend content={<ChartLegendContent />} className="flex-wrap" />
          </PieChart>
        </ChartContainer>
      </div>
    </div>
  );
};

// Legacy support for general component
export const AnalyticsClient = ({ data, type, title }: { data: any[]; type: "bar" | "pie"; title: string }) => {
  if (type === "bar") return <BarChartWidget data={data} title={title} />;
  return <DonutChartWidget data={data} title={title} />;
};
