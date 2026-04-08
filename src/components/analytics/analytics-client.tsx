"use client";

import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsClientProps {
  data: any[];
  type: "bar" | "pie";
  title: string;
}

export const AnalyticsClient = ({ data, type, title }: AnalyticsClientProps) => {
  return (
    <Card className="glass-morphism border-slate-200/60 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
      <CardHeader className="bg-white/50 backdrop-blur-sm border-b border-slate-100">
        <CardTitle className="text-lg font-bold text-slate-800">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={350}>
          {type === "bar" ? (
            <BarChart data={data}>
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `${value}`} 
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  padding: '12px'
                }}
              />
              <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              <Bar dataKey="total" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
                }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
