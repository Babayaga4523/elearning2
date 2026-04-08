"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formattedData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="displayName" 
            angle={-45} 
            textAnchor="end" 
            interval={0}
            height={80}
            tick={{ fontSize: 11, fill: "#64748b" }}
          />
          <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <Tooltip 
            cursor={{ fill: "#f1f5f9" }}
            contentStyle={{ 
              borderRadius: "8px", 
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
            }}
          />
          <Legend wrapperStyle={{ paddingTop: "20px" }} />
          <Bar dataKey="lulus" name="Lulus" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
          <Bar dataKey="gagal" name="Gagal" fill="#ef4444" radius={[0, 0, 0, 0]} stackId="a" />
          <Bar dataKey="proses" name="In Progress" fill="#f59e0b" radius={[4, 4, 0, 0]} stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
