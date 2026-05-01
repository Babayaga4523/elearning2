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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import type { ChartConfig } from "@/components/ui/chart";

interface ActivityChartProps {
  data: { day: string; count: number }[];
}

const chartConfig = {
  count: {
    label: "Modul Selesai",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function ActivityChart({ data }: ActivityChartProps) {
  // Calculate statistics
  const totalModules = data.reduce((sum, item) => sum + item.count, 0);
  const avgPerDay = (totalModules / data.length).toFixed(1);
  const maxDay = data.reduce((max, item) => item.count > max.count ? item : max, data[0]);
  
  return (
    <Card className="bg-white shadow-sm border-slate-200 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-slate-900">
              Aktivitas 7 Hari Terakhir
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">
              {totalModules} modul diselesaikan minggu ini
            </CardDescription>
          </div>
          
          {totalModules > 0 && (
            <div className="flex items-center gap-2 text-sm shrink-0">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="font-medium text-slate-700">
                {avgPerDay} modul/hari
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col pt-0 pb-4">
        <ChartContainer config={chartConfig} className="flex-1 w-full min-h-0">
          <BarChart 
            data={data} 
            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              vertical={false} 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              opacity={0.5}
            />
            
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ 
                fill: "hsl(var(--muted-foreground))", 
                fontSize: 12, 
                fontWeight: 600 
              }}
              dy={5}
            />
            
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ 
                fill: "hsl(var(--muted-foreground))", 
                fontSize: 12, 
                fontWeight: 600 
              }}
              tickFormatter={(value) => `${value}`}
            />
            
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  indicator="dot"
                  labelFormatter={(value) => `${value}`}
                  formatter={(value, name) => (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {value} modul
                        </span>
                      </div>
                    </>
                  )}
                />
              }
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.15 }}
            />
            
            <Bar 
              dataKey="count" 
              fill="url(#activityGradient)"
              radius={[8, 8, 0, 0]} 
              maxBarSize={48}
            />
          </BarChart>
        </ChartContainer>
        
        {/* Summary Footer */}
        {totalModules > 0 && maxDay && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-slate-600">
                  Hari paling produktif:
                </span>
              </div>
              <span className="font-semibold text-slate-900">
                {maxDay.day} ({maxDay.count} modul)
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
