"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import { Clock, Calendar, Bell, ShieldAlert, Send } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface EnrollmentHistoryTooltipProps {
  children: React.ReactNode;
  data: {
    enrolledAt: string;
    remindedAt7d: string | null;
    remindedAt3d: string | null;
    remindedAt1d: string | null;
    reportedAt: string | null;
    escalatedAt: string | null;
  };
}

export function EnrollmentHistoryTooltip({ children, data }: EnrollmentHistoryTooltipProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return format(new Date(dateStr), "d MMM yyyy, HH:mm", { locale: id });
  };

  const timelineItems = [
    { label: "Pendaftaran", date: data.enrolledAt, icon: Calendar, color: "text-indigo-500", bgColor: "bg-indigo-50" },
    { label: "Reminder H-7", date: data.remindedAt7d, icon: Bell, color: "text-blue-500", bgColor: "bg-blue-50" },
    { label: "Reminder H-3", date: data.remindedAt3d, icon: Bell, color: "text-amber-500", bgColor: "bg-amber-50" },
    { label: "Reminder H-1", date: data.remindedAt1d, icon: Bell, color: "text-orange-500", bgColor: "bg-orange-50" },
    { label: "Laporan Harian", date: data.reportedAt, icon: Send, color: "text-emerald-500", bgColor: "bg-emerald-50" },
    { label: "Eskalasi Head", date: data.escalatedAt, icon: ShieldAlert, color: "text-rose-500", bgColor: "bg-rose-50" },
  ];

  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div className="cursor-help">{children}</div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="z-[100] w-72 rounded-2xl bg-white border border-slate-200 p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            sideOffset={8}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                <Clock className="h-4 w-4 text-slate-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jejak Histori Notifikasi</p>
              </div>
              
              <div className="space-y-3 pt-1">
                {timelineItems.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start group">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`h-6 w-6 rounded-lg ${item.bgColor} flex items-center justify-center shrink-0`}>
                        <item.icon className={`h-3 w-3 ${item.color}`} />
                      </div>
                      {idx !== timelineItems.length - 1 && (
                        <div className="w-px h-full bg-slate-50 min-h-[12px]" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">
                        {item.label}
                      </p>
                      <p className={`text-[11px] font-bold ${item.date ? 'text-slate-700' : 'text-slate-300 italic'}`}>
                        {formatDate(item.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Tooltip.Arrow className="fill-white" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
