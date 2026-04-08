"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

type DonutData = { lulus: number; gagal: number; proses: number };

const COLORS = ["#10b981", "#ef4444", "#f59e0b"];
const LABELS = ["Lulus", "Gagal", "In Progress"];

export function DonutChartClient({ data }: { data: DonutData }) {
  const chartData = [
    { name: "Lulus", value: data.lulus },
    { name: "Gagal", value: data.gagal },
    { name: "In Progress", value: data.proses },
  ].filter(d => d.value > 0);

  const total = data.lulus + data.gagal + data.proses;

  return (
    <div className="w-full h-[300px] flex flex-col items-center justify-center">
      {total === 0 ? (
        <p className="text-sm text-gray-500 italic">Belum ada data enrollment.</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.name === "Lulus" ? COLORS[0] : entry.name === "Gagal" ? COLORS[1] : COLORS[2]} 
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) =>
                  [`${value} orang (${total > 0 ? Math.round((Number(value) / total) * 100) : 0}%)`, "Jumlah"]
                }
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 flex-wrap justify-center">
            {["Lulus", "Gagal", "In Progress"].map((label, i) => (
                <span key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ background: COLORS[i] }}
                  />
                  {label}
                </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
