import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface DataCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: string;
  color?: "blue" | "emerald" | "amber" | "indigo" | "rose";
}

const colorMap: Record<
  NonNullable<DataCardProps["color"]>,
  { iconBg: string; iconColor: string; bg: string }
> = {
  blue: { iconBg: "bg-blue-100", iconColor: "text-blue-700", bg: "bg-blue-50/10" },
  emerald: { iconBg: "bg-emerald-100", iconColor: "text-emerald-700", bg: "bg-emerald-50/10" },
  amber: { iconBg: "bg-amber-100", iconColor: "text-amber-700", bg: "bg-amber-50/10" },
  indigo: { iconBg: "bg-indigo-100", iconColor: "text-indigo-700", bg: "bg-indigo-50/10" },
  rose: { iconBg: "bg-rose-100", iconColor: "text-rose-700", bg: "bg-rose-50/10" },
};

export const DataCard = ({
  label,
  value,
  icon: Icon,
  description,
  trend,
  color = "blue",
}: DataCardProps) => {
  const c = colorMap[color];

  return (
    <Card className="group overflow-hidden border-slate-100 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <CardContent className="p-3 md:p-4">
        {/* Icon + Trend */}
        <div className="flex items-start justify-between">
          <div className="rounded-lg bg-[#0F1C3F]/5 p-1.5 transition-colors group-hover:bg-[#0F1C3F]/10">
            <Icon className="h-3.5 w-3.5 text-[#E8A020]" />
          </div>
          {trend && (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
              {trend}
            </span>
          )}
        </div>
        
        {/* Value */}
        <div className="mt-3">
          <p className="text-xl font-black text-[#0F1C3F] font-lexend tracking-tight">
            {value}
          </p>
          {/* Label */}
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
            {label}
          </p>
        </div>
        
        {description && (
          <div className="mt-3 pt-3 border-t border-slate-50">
            <p className="text-[10px] font-medium text-slate-400 truncate">
               {description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
