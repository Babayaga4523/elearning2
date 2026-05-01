"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { BookOpen, Users, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Dynamically load the calendar core to avoid SSR errors
const FullCalendarWrapper = dynamic(
  () => import("@/components/admin/FullCalendarWrapper"),
  { ssr: false, loading: () => <div className="h-[600px] w-full animate-pulse bg-slate-50 rounded-xl" /> }
);

export type EventColor = "rose" | "emerald" | "amber" | "blue" | "indigo";

export interface CalendarEvent {
  id: string;
  type: "DEADLINE" | "ENROLLMENT" | "SYSTEM" | "COMPLETION" | "TEST";
  title: string;
  date: string;
  meta: string;
  href: string;
  color: EventColor;
}

interface AdminCalendarClientProps {
  events: CalendarEvent[];
  statsThisMonth: {
    deadlines: number;
    enrollments: number;
    courses: number;
  };
}

const COLOR_MAP: Record<EventColor, { base: string; border: string }> = {
  rose:    { base: "#E11D48", border: "#BE123C" }, // Red
  emerald: { base: "#10B981", border: "#059669" }, // Green
  amber:   { base: "#F59E0B", border: "#D97706" }, // Yellow/Gold
  blue:    { base: "#3B82F6", border: "#2563EB" }, // Blue
  indigo:  { base: "#6366F1", border: "#4F46E5" }, // Indigo
};

export function AdminCalendarClient({ events, statsThisMonth }: AdminCalendarClientProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Map backend events to FullCalendar format
  const fcEvents = events.map(ev => ({
    id: ev.id,
    title: ev.title,
    start: ev.date,
    allDay: true, // Assuming module deadlines and enrollments are all day
    backgroundColor: COLOR_MAP[ev.color].base,
    borderColor: COLOR_MAP[ev.color].border,
    extendedProps: {
      meta: ev.meta,
      href: ev.href,
      type: ev.type
    }
  }));

  const handleEventClick = useCallback((info: any) => {
    // Prevent default URL navigation if we use standard URLs
    info.jsEvent.preventDefault();
    
    // Find the original event
    const eventId = info.event.id;
    const found = events.find(e => e.id === eventId);
    if (found) {
      setSelectedEvent(found);
    }
  }, [events]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Admin Console</p>
        <h1 className="text-3xl font-black tracking-tight text-[#0F1C3F]" style={{ fontFamily: "'Lexend Deca', sans-serif" }}>
          Kalender Pelatihan
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Pantau deadline kursus dan aktivitas enrollment secara responsif.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Deadline Bulan Ini", value: statsThisMonth.deadlines, icon: Clock, color: "rose" },
          { label: "Enrollment Bulan Ini", value: statsThisMonth.enrollments, icon: Users, color: "emerald" },
          { label: "Kursus Aktif", value: statsThisMonth.courses, icon: BookOpen, color: "blue" },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
            <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
              stat.color === "rose" ? "bg-rose-50" : stat.color === "emerald" ? "bg-emerald-50" : "bg-blue-50"
            )}>
              <stat.icon className={cn("h-5 w-5",
                stat.color === "rose" ? "text-rose-600" : stat.color === "emerald" ? "text-emerald-600" : "text-blue-600"
              )} />
            </div>
            <div>
              <p className="text-2xl font-black text-[#0F1C3F] leading-none">{stat.value}</p>
              <p className="text-xs font-bold text-slate-400 mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid - FullCalendar */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 md:p-6 overflow-hidden">
        <FullCalendarWrapper
          events={fcEvents}
          onEventClick={handleEventClick}
        />
      </div>

      {/* Event Click Preview Dialog (Opsi B) */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl" aria-describedby="dialog-description">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-[#0F1C3F]">Detail Aktivitas</DialogTitle>
            <DialogDescription className="sr-only">
              Informasi detail tentang event yang dipilih di kalender
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tipe</p>
              <span className={cn("text-xs font-black px-2 py-1 rounded-md", 
                  selectedEvent?.type === "DEADLINE" ? "bg-rose-100 text-rose-700" :
                  selectedEvent?.type === "ENROLLMENT" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
              )}>
                {selectedEvent?.type}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Deskripsi Event</p>
              <p className="text-sm font-bold text-slate-800">{selectedEvent?.title}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tanggal</p>
              <p className="text-sm font-semibold text-slate-600">
                {selectedEvent?.date ? new Date(selectedEvent.date).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' }) : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Keterangan Tambahan</p>
              <p className="text-sm font-medium text-slate-600">{selectedEvent?.meta}</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-2 border-t pt-4">
             <Button variant="outline" onClick={() => setSelectedEvent(null)} className="rounded-xl border-slate-200 text-slate-500 font-bold">
               Tutup
             </Button>
             {selectedEvent?.href && (
               <Link href={selectedEvent.href} onClick={() => setSelectedEvent(null)}>
                 <Button className="rounded-xl font-bold gap-2">
                   Lihat Detail
                   <ExternalLink className="h-4 w-4" />
                 </Button>
               </Link>
             )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
