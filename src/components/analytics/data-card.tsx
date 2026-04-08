import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DataCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: string;
  color?: "blue" | "emerald" | "amber" | "indigo" | "rose";
}

const colorMap = {
  blue: "text-blue-600 bg-blue-100/50 border-blue-200",
  emerald: "text-emerald-600 bg-emerald-100/50 border-emerald-200",
  amber: "text-amber-600 bg-amber-100/50 border-amber-200",
  indigo: "text-indigo-600 bg-indigo-100/50 border-indigo-200",
  rose: "text-rose-600 bg-rose-100/50 border-rose-200",
};

export const DataCard = ({
  label,
  value,
  icon: Icon,
  description,
  trend,
  color = "blue"
}: DataCardProps) => {
  return (
    <Card className="glass-morphism border-slate-200/60 shadow-lg hover:shadow-2xl transition-all duration-500 group overflow-hidden">
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-30",
        color === "blue" && "bg-blue-400",
        color === "emerald" && "bg-emerald-400",
        color === "amber" && "bg-amber-400",
        color === "indigo" && "bg-indigo-400",
        color === "rose" && "bg-rose-400",
      )} />
      
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </CardTitle>
        <div className={cn("p-2 rounded-xl border transition-transform duration-500 group-hover:scale-110", colorMap[color])}>
           <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black text-slate-800 tracking-tighter">
          {value}
        </div>
        {description && (
          <p className="text-xs text-slate-400 font-medium mt-1">
            {description}
          </p>
        )}
        {trend && (
           <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <span className="flex items-center justify-center h-4 w-4 rounded-full bg-emerald-100">↑</span>
              {trend}
           </div>
        )}
      </CardContent>
    </Card>
  );
};
