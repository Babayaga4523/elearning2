"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

type CourseStats = {
  title: string;
  lulus: number;
  gagal: number;
  proses: number;
};

export function BarChartClient({ data }: { data: CourseStats[] }) {
  // Format titles to be shorter for the axis
  const formattedData = data.map((d) => ({
    ...d,
    displayName: d.title.length > 20 ? d.title.substring(0, 17) + "..." : d.title,
  }));

  const chartConfig = {
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
    <div className="w-full">
      <ChartContainer config={chartConfig} className="h-[350px] w-full">
        <BarChart
          data={formattedData}
          margin={{
            top: 20,
            right: 10,
            left: 10,
            bottom: 60,
          }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="displayName" 
            angle={-45} 
            textAnchor="end" 
            interval={0}
            height={80}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: "#64748b" }} 
            axisLine={false} 
            tickLine={false} 
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} className="pt-4" />
          <Bar 
            dataKey="lulus" 
            fill="var(--color-lulus)" 
            radius={[2, 2, 0, 0]} 
            stackId="a" 
            maxBarSize={40}
          />
          <Bar 
            dataKey="gagal" 
            fill="var(--color-gagal)" 
            stackId="a" 
            maxBarSize={40}
          />
          <Bar 
            dataKey="proses" 
            fill="var(--color-proses)" 
            radius={[4, 4, 0, 0]} 
            stackId="a" 
            maxBarSize={40}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
