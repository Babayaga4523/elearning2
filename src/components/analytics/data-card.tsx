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
    <Card className="group overflow-hidden border border-[#E4E7EC] bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 rounded-xl font-['DM_Sans']">
      <CardContent className="p-4 md:p-5">
        {/* Icon + Trend */}
        <div className="flex items-start justify-between">
          <div className="rounded-lg bg-[#F8F9FB] border border-[#E4E7EC] p-2 transition-colors group-hover:bg-[#0F1C3F] group-hover:text-white">
            <Icon className="h-4 w-4 text-[#475467] group-hover:text-white transition-colors" />
          </div>
          {trend && (
            <span className="text-[10px] font-bold text-[#027A48] bg-[#ECFDF3] px-2 py-0.5 rounded-md">
              {trend}
            </span>
          )}
        </div>
        
        {/* Value */}
        <div className="mt-4">
          <p className="text-2xl font-bold text-[#101828] font-['Lexend_Deca'] tracking-tight">
            {value}
          </p>
          {/* Label */}
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-[#98A2B3]">
            {label}
          </p>
        </div>
        
        {description && (
          <div className="mt-4 pt-3 border-t border-[#E4E7EC]">
            <p className="text-[11px] font-medium text-[#475467] truncate">
               {description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
