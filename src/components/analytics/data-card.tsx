import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
  { iconBg: string; iconColor: string; ring: string }
> = {
  blue: { iconBg: "#EEF2FF", iconColor: "#0F1C3F", ring: "border-[#E2E6F0]" },
  emerald: { iconBg: "#F0FDF4", iconColor: "#059669", ring: "border-emerald-100" },
  amber: { iconBg: "#FFF8E7", iconColor: "#C28700", ring: "border-amber-100" },
  indigo: { iconBg: "#F1F5F9", iconColor: "#0F1C3F", ring: "border-slate-200" },
  rose: { iconBg: "#FFF1F2", iconColor: "#E11D48", ring: "border-rose-100" },
};

const cardSurface = {
  background: "white",
  border: "1px solid #E2E6F0",
  boxShadow: "0 1px 4px rgba(15,28,63,0.06)",
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
    <div
      className={cn(
        "group flex flex-col rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md",
        c.ring
      )}
      style={cardSurface}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <p
          className="text-[10px] font-black uppercase tracking-[0.14em]"
          style={{ color: "#9AAABF" }}
        >
          {label}
        </p>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
          style={{ background: c.iconBg, color: c.iconColor }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div
        className="text-2xl font-black leading-none tracking-tight md:text-3xl"
        style={{ color: "#0F1C3F", fontFamily: "'Lexend Deca', sans-serif" }}
      >
        {value}
      </div>
      {description && (
        <p className="mt-1.5 text-xs font-medium" style={{ color: "#7A8599" }}>
          {description}
        </p>
      )}
      {trend && (
        <p
          className="mt-3 border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-500"
        >
          {trend}
        </p>
      )}
    </div>
  );
};
