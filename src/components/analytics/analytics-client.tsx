"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  Line,
  LineChart,
  CartesianGrid,
  Label,
  LabelList,
  Sector,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
} from "recharts";
import { BarChart3, PieChart as PieChartIcon, TrendingUp, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NAVY = "#0F1C3F";
const GOLD = "#E8A020";
const BLUE_SOFT = "#3B82F6";
const SLATE_LIGHT = "#94A3B8";

interface AnalyticsProps {
  data: any[];
  title: string;
  description?: string;
  height?: number;
}

export const LineChartWidget = ({ data, title, description, height = 300 }: AnalyticsProps) => {
  const chartConfig = {
    total: {
      label: "Enrollment",
      color: NAVY,
    },
  } satisfies ChartConfig;

  return (
    <Card className="border-slate-100/60 shadow-sm transition-all hover:shadow-md h-full overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#0F1C3F]/5 flex items-center justify-center">
                 <TrendingUp className="h-5 w-5 text-[#0F1C3F]" />
              </div>
              <div>
                 <CardTitle className="text-base font-bold text-[#0F1C3F] font-lexend">{title}</CardTitle>
                 {description && <CardDescription className="text-[10px] font-medium">{description}</CardDescription>}
              </div>
           </div>
           <div className="h-8 px-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#E8A020] animate-pulse" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Live</span>
           </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <ChartContainer config={chartConfig} style={{ height: `${height}px` }} className="w-full">
          <LineChart
            data={data}
            margin={{ top: 20, left: 12, right: 12, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 10, fill: SLATE_LIGHT, fontWeight: 700 }}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: SLATE_LIGHT, fontWeight: 700 }}
            />
            <ChartTooltip
              cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }}
              content={<ChartTooltipContent indicator="line" className="rounded-xl border-slate-100 shadow-2xl" />}
            />
            <Line
              dataKey="total"
              type="natural"
              stroke={NAVY}
              strokeWidth={3}
              dot={{
                fill: GOLD,
                stroke: NAVY,
                strokeWidth: 2,
                r: 4,
              }}
              activeDot={{
                r: 6,
                strokeWidth: 0,
                fill: GOLD,
              }}
            >
              <LabelList
                dataKey="total"
                position="top"
                offset={12}
                className="fill-[#0F1C3F] font-bold"
                fontSize={10}
              />
            </Line>
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export const InteractivePieChartWidget = ({ 
  data: allData, 
  title, 
  description,
  height = 300
}: { 
  data: Record<string, any[]>; 
  title: string; 
  description?: string;
  height?: number;
}) => {
  const id = "pie-interactive";
  const months = Object.keys(allData);
  const [activeMonth, setActiveMonth] = React.useState(months[months.length - 1] || "");
  
  const currentMonthData = allData[activeMonth] || [];
  
  // Handle empty data
  if (months.length === 0 || currentMonthData.length === 0) {
    return (
      <Card className="border-slate-100 shadow-sm h-full flex flex-col bg-white rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-0 pt-5 px-6 space-y-0">
          <div className="flex items-center gap-3">
             <div className="h-9 w-9 rounded-xl bg-[#0F1C3F]/5 flex items-center justify-center">
                <PieChartIcon className="h-5 w-5 text-[#0F1C3F]" />
             </div>
             <div className="space-y-0.5">
                <CardTitle className="text-sm font-bold text-[#0F1C3F] font-lexend">{title}</CardTitle>
                {description && <CardDescription className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{description}</CardDescription>}
             </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center py-6 px-6">
          <p className="text-sm text-slate-400">Tidak ada data tersedia</p>
        </CardContent>
      </Card>
    );
  }
  
  const chartConfig = {
    visitors: { label: "Peserta" },
    ...currentMonthData.reduce((acc, curr) => {
      acc[curr.name.toLowerCase()] = { label: curr.name, color: curr.fill };
      return acc;
    }, {} as any)
  } satisfies ChartConfig;

  const renderPieShape = (props: any) => {
     const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
     return (
       <g>
         <Sector
           cx={cx}
           cy={cy}
           innerRadius={innerRadius}
           outerRadius={(outerRadius || 0) + 6}
           startAngle={startAngle}
           endAngle={endAngle}
           fill={fill}
           className="transition-all duration-300"
         />
       </g>
     );
  };

  return (
    <Card data-chart={id} className="border-slate-100 shadow-sm transition-all hover:shadow-md h-full flex flex-col bg-white rounded-2xl overflow-hidden">
      <ChartStyle id={id} config={chartConfig} />
      <CardHeader className="flex flex-row items-center justify-between pb-0 pt-5 px-6 space-y-0">
        <div className="flex items-center gap-3">
           <div className="h-9 w-9 rounded-xl bg-[#0F1C3F]/5 flex items-center justify-center">
              <PieChartIcon className="h-5 w-5 text-[#0F1C3F]" />
           </div>
           <div className="space-y-0.5">
              <CardTitle className="text-sm font-bold text-[#0F1C3F] font-lexend">{title}</CardTitle>
              {description && <CardDescription className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{description}</CardDescription>}
           </div>
        </div>
        <Select value={activeMonth} onValueChange={setActiveMonth}>
          <SelectTrigger className="w-[120px] h-9 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-50/80 border-slate-100/80 hover:bg-white hover:border-[#E8A020]/30 transition-all focus:ring-0 shadow-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-3 w-3 text-slate-400" />
              <SelectValue placeholder="Bulan" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-1.5">
            {months.map((m) => (
              <SelectItem 
                key={m} 
                value={m} 
                hideIndicator
                className={cn(
                  "text-[10px] uppercase py-2.5 px-3 rounded-xl cursor-pointer transition-all duration-200 mb-0.5 last:mb-0",
                  m === activeMonth 
                    ? "bg-[#0F1C3F] text-white font-black" 
                    : "font-bold text-slate-500 hover:bg-slate-50 focus:bg-slate-50 focus:text-[#0F1C3F]"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{m}</span>
                  {m === activeMonth && (
                    <div className="h-1.5 w-1.5 rounded-full bg-[#E8A020] shadow-[0_0_8px_rgba(232,160,32,0.6)] animate-pulse" />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col items-center justify-center py-6 px-6">
        <ChartContainer id={id} config={chartConfig} style={{ height: `${height}px` }} className="mx-auto aspect-square w-full max-w-[240px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel className="rounded-xl border-slate-100 shadow-xl" />} />
            <Pie
              {...({
                data: currentMonthData,
                dataKey: "value",
                nameKey: "name",
                innerRadius: 65,
                outerRadius: 85,
                strokeWidth: 4,
                stroke: "#fff",
                shape: renderPieShape,
                paddingAngle: 2,
              } as any)}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    const total = currentMonthData.reduce((acc, curr) => acc + curr.value, 0);
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="central">
                        <tspan x={viewBox.cx} y={viewBox.cy} dy="-4" className="fill-[#0F1C3F] text-4xl font-black font-lexend tracking-tighter">
                          {total.toLocaleString()}
                        </tspan>
                        <tspan x={viewBox.cx} y={viewBox.cy} dy="24" className="fill-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">
                          TOTAL
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        <div className="grid grid-cols-3 gap-3 w-full mt-8">
           {currentMonthData.map((item) => (
              <div key={item.name} className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-50/50 border border-slate-100/50">
                 <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider truncate">{item.name}</span>
                 </div>
                 <span className="text-[11px] font-black text-[#0F1C3F] font-lexend">{item.value}</span>
              </div>
           ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const BarChartWidget = ({ data, title, description, height = 300 }: AnalyticsProps) => {
  const chartConfig = {
    total: {
      label: "Enrollment",
      color: NAVY,
    },
    completed: {
      label: "Selesai",
      color: GOLD,
    },
  } satisfies ChartConfig;

  return (
    <Card className="border-slate-100 shadow-sm transition-all hover:shadow-md h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
           <div className="h-9 w-9 rounded-xl bg-[#0F1C3F]/5 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-[#0F1C3F]" />
           </div>
           <div>
              <CardTitle className="text-base font-bold text-[#0F1C3F] font-lexend">{title}</CardTitle>
              {description && <CardDescription className="text-[10px] font-medium">{description}</CardDescription>}
           </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} style={{ height: `${height}px` }} className="w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} stroke="#f8fafc" />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fontSize: 10, fill: SLATE_LIGHT, fontWeight: 700 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: SLATE_LIGHT, fontWeight: 700 }}
            />
            <ChartTooltip content={<ChartTooltipContent className="rounded-xl border-slate-100 shadow-xl" />} />
            <ChartLegend content={<ChartLegendContent className="text-[10px] font-bold uppercase pt-4" />} />
            <Bar dataKey="total" fill={NAVY} radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" fill={GOLD} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export const DonutChartWidget = ({ data, title, description, height = 300 }: AnalyticsProps) => {
  const chartConfig = data.reduce((acc, curr, idx) => {
    acc[curr.name] = {
      label: curr.name,
      color: curr.fill || (idx === 0 ? NAVY : idx === 1 ? GOLD : BLUE_SOFT),
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <Card className="border-slate-100 shadow-sm transition-all hover:shadow-md h-full">
      <CardHeader className="pb-2 text-center sm:text-left">
        <div className="flex items-center gap-3">
           <div className="h-9 w-9 rounded-xl bg-[#0F1C3F]/5 flex items-center justify-center">
              <PieChartIcon className="h-5 w-5 text-[#0F1C3F]" />
           </div>
           <div>
              <CardTitle className="text-base font-bold text-[#0F1C3F] font-lexend">{title}</CardTitle>
              {description && <CardDescription className="text-[10px] font-medium">{description}</CardDescription>}
           </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} style={{ height: `${height}px` }} className="w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel className="rounded-xl border-slate-100 shadow-xl" />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={65}
              outerRadius={85}
              strokeWidth={5}
              paddingAngle={5}
            >
               {data.map((entry, index) => (
                  <Cell key={`cell-donut-${index}`} fill={entry.fill || (index === 0 ? NAVY : index === 1 ? GOLD : BLUE_SOFT)} />
               ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent className="flex-wrap text-[10px] font-bold uppercase pt-4" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export const RadarChartWidget = ({ data, title, description, height = 300 }: AnalyticsProps) => {
  const chartConfig = {
    total: {
      label: "Peserta",
      color: NAVY,
    },
  } satisfies ChartConfig;

  return (
    <Card className="border-slate-100 shadow-sm transition-all hover:shadow-md h-full flex flex-col bg-white rounded-2xl overflow-hidden">
      <CardHeader className="items-center pb-0 pt-5 px-6">
        <div className="flex flex-col items-center text-center">
           <CardTitle className="text-sm font-bold text-[#0F1C3F] font-lexend">{title}</CardTitle>
           {description && <CardDescription className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">{description}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent className="pb-4 flex-1 flex items-center justify-center">
        <ChartContainer
          config={chartConfig}
          style={{ height: `${height}px` }}
          className="mx-auto aspect-square w-full max-w-[280px]"
        >
          <RadarChart data={data}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel className="rounded-xl border-slate-100 shadow-xl" />}
            />
            <PolarGrid gridType="circle" stroke="#f1f5f9" />
            <PolarAngleAxis 
              dataKey="month" 
              tick={{ fill: SLATE_LIGHT, fontSize: 10, fontWeight: 700 }}
              tickFormatter={(v: string) => v.slice(0, 3)}
            />
            <Radar
              dataKey="total"
              fill={NAVY}
              fillOpacity={0.4}
              stroke={NAVY}
              strokeWidth={2}
              dot={{
                r: 4,
                fillOpacity: 1,
                fill: GOLD,
                stroke: NAVY,
              }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-t border-slate-50 py-4">
        <div className="flex items-center gap-2 leading-none">
          <TrendingUp className="h-3.5 w-3.5 text-[#E8A020]" />
          Visualisasi Tren Radar
        </div>
      </CardFooter>
    </Card>
  );
};

export const MultipleBarChartWidget = ({ data, title, description, height = 300 }: AnalyticsProps) => {
  const chartConfig = {
    total: {
      label: "Enrollment",
      color: NAVY,
    },
    completed: {
      label: "Selesai",
      color: GOLD,
    },
  } satisfies ChartConfig;

  return (
    <Card className="border-slate-100 shadow-sm transition-all hover:shadow-md h-full flex flex-col bg-white rounded-2xl overflow-hidden">
      <CardHeader className="pb-2 pt-5 px-6">
        <CardTitle className="text-sm font-bold text-[#0F1C3F] font-lexend">{title}</CardTitle>
        {description && <CardDescription className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-2 flex-1">
        <ChartContainer config={chartConfig} style={{ height: `${height}px` }} className="w-full">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} stroke="#f8fafc" />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fontSize: 10, fill: SLATE_LIGHT, fontWeight: 700 }}
              tickFormatter={(value) => value.length > 10 ? `${value.slice(0, 10)}..` : value}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" className="rounded-xl border-slate-100 shadow-xl" />}
            />
            <Bar dataKey="total" fill={NAVY} radius={4} />
            <Bar dataKey="completed" fill={GOLD} radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-t border-slate-50 py-4 px-6">
        <div className="flex gap-2 leading-none">
          Performa Penyelesaian <TrendingUp className="h-3.5 w-3.5 text-[#E8A020]" />
        </div>
        <div className="leading-none text-slate-300">
          Statistik pendaftaran vs kelulusan materi
        </div>
      </CardFooter>
    </Card>
  );
};

export const AnalyticsClient = ({ 
  data, 
  type, 
  title, 
  description,
  height
}: { 
  data: any; 
  type: "bar" | "pie" | "line" | "interactive-pie" | "radar" | "multiple-bar"; 
  title: string; 
  description?: string;
  height?: number;
}) => {
  if (type === "bar") return <BarChartWidget data={data} title={title} description={description} height={height} />;
  if (type === "line") return <LineChartWidget data={data} title={title} description={description} height={height} />;
  if (type === "interactive-pie") return <InteractivePieChartWidget data={data} title={title} description={description} height={height} />;
  if (type === "radar") return <RadarChartWidget data={data} title={title} description={description} height={height} />;
  if (type === "multiple-bar") return <MultipleBarChartWidget data={data} title={title} description={description} height={height} />;
  return <DonutChartWidget data={data} title={title} description={description} height={height} />;
};
