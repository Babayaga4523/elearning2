"use client";

import { TrendingUp } from "lucide-react";
import { CartesianGrid, LabelList, Line, LineChart, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  modules: {
    label: "Modul Selesai",
    color: "hsl(var(--chart-1))",
  },
  tests: {
    label: "Test Lulus",
    color: "hsl(var(--chart-2))",
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
  // Calculate trend
  const currentMonth = data[data.length - 1];
  const previousMonth = data[data.length - 2];
  
  const currentTotal = currentMonth ? currentMonth.modules + currentMonth.tests : 0;
  const previousTotal = previousMonth ? previousMonth.modules + previousMonth.tests : 0;
  
  const trendPercentage = previousTotal > 0 
    ? ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1)
    : "0";
  
  const isPositiveTrend = parseFloat(trendPercentage) >= 0;

  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-slate-900">
              Progress Pembelajaran
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Aktivitas belajar dalam 6 bulan terakhir
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2 text-sm shrink-0">
            {isPositiveTrend ? (
              <>
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-600">
                  +{Math.abs(parseFloat(trendPercentage))}%
                </span>
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                <span className="font-medium text-red-600">
                  {Math.abs(parseFloat(trendPercentage))}%
                </span>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 pb-4">
        <ChartContainer config={chartConfig} className="w-full h-[280px]">
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              top: 20,
              left: 12,
              right: 12,
              bottom: 5,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.5} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12, fontWeight: 600 }}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Line
              dataKey="modules"
              type="natural"
              stroke="var(--color-modules)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-modules)",
              }}
              activeDot={{
                r: 6,
              }}
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Line>
            <Line
              dataKey="tests"
              type="natural"
              stroke="var(--color-tests)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-tests)",
              }}
              activeDot={{
                r: 6,
              }}
            />
          </LineChart>
        </ChartContainer>
        
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "var(--color-modules)" }} />
              <span className="text-slate-600">Modul Selesai</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "var(--color-tests)" }} />
              <span className="text-slate-600">Test Lulus</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}