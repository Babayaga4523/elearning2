"use client";

import { Pie, PieChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

type DonutData = { lulus: number; gagal: number; proses: number };

export function DonutChartClient({ data }: { data: DonutData }) {
  const chartData = [
    { status: "lulus", value: data.lulus, fill: "var(--color-lulus)" },
    { status: "gagal", value: data.gagal, fill: "var(--color-gagal)" },
    { status: "proses", value: data.proses, fill: "var(--color-proses)" },
  ].filter((d) => d.value > 0);

  const total = data.lulus + data.gagal + data.proses;

  const chartConfig = {
    value: {
      label: "Jumlah",
    },
    lulus: {
      label: "Lulus",
      color: "hsl(var(--chart-4))", // Success Emerald
    },
    gagal: {
      label: "Gagal",
      color: "hsl(var(--destructive))", // Destructive Rose
    },
    proses: {
      label: "In Progress",
      color: "hsl(var(--chart-2))", // BNI Gold
    },
  } satisfies ChartConfig;

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[300px]">
      {total === 0 ? (
        <p className="text-sm text-gray-400 italic font-medium">Belum ada data enrollment.</p>
      ) : (
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[280px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="status"
              innerRadius={65}
              outerRadius={90}
              strokeWidth={8}
              stroke="white"
            />
            <ChartLegend
              content={<ChartLegendContent nameKey="status" />}
              className="-translate-y-2 flex-wrap gap-2 [&>div]:text-[10px] [&>div]:font-bold"
            />
          </PieChart>
        </ChartContainer>
      )}
    </div>
  );
}
