"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { CheckCircle, GraduationCap, ExternalLink, CalendarDays, Clock, Tag, Info, AlertCircle, TrendingUp, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/admin/Pagination";

const FullCalendarWrapper = dynamic(
  () => import("@/components/admin/FullCalendarWrapper"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 animate-pulse flex items-center justify-center border border-slate-200">
        <div className="text-center space-y-3">
          <CalendarDays className="h-12 w-12 text-slate-300 mx-auto" />
          <p className="text-sm text-slate-400 font-medium">Memuat kalender...</p>
        </div>
      </div>
    ),
  }
);

export type EventColor = "rose" | "emerald" | "amber" | "blue" | "indigo";

export interface CalendarEvent {
  id: string;
  type: "DEADLINE" | "COMPLETION" | "TEST";
  title: string;
  date: string;
  meta: string;
  href: string;
  color: EventColor;
}

interface KaryawanCalendarClientProps {
  events: CalendarEvent[];
  stats: {
    upcomingDeadlines: number;
    modulesCompletedThisMonth: number;
    activeCourses: number;
  };
  userName: string;
}

const COLOR_MAP: Record<EventColor, { base: string; border: string }> = {
  rose:    { base: "#E11D48", border: "#BE123C" },
  emerald: { base: "#10B981", border: "#059669" },
  amber:   { base: "#F59E0B", border: "#D97706" },
  blue:    { base: "#3B82F6", border: "#2563EB" },
  indigo:  { base: "#6366F1", border: "#4F46E5" },
};

const EVENT_TYPE_CONFIG = {
  DEADLINE:   { 
    label: "Batas Waktu",   
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    icon: AlertCircle,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600"
  },
  COMPLETION: { 
    label: "Modul Selesai", 
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600"
  },
  TEST:       { 
    label: "Ujian Selesai", 
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    icon: GraduationCap,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600"
  },
};

const STATS = [
  {
    key: "upcomingDeadlines",
    label: "Deadline Mendatang",
    icon: Clock,
    iconClass: "bg-gradient-to-br from-rose-500 to-rose-600",
    bgClass: "bg-gradient-to-br from-rose-50 to-rose-100/50",
    borderClass: "border-rose-200/50",
  },
  {
    key: "modulesCompletedThisMonth",
    label: "Modul Selesai Bulan Ini",
    icon: CheckCircle,
    iconClass: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    bgClass: "bg-gradient-to-br from-emerald-50 to-emerald-100/50",
    borderClass: "border-emerald-200/50",
  },
  {
    key: "activeCourses",
    label: "Kursus Aktif",
    icon: TrendingUp,
    iconClass: "bg-gradient-to-br from-blue-500 to-blue-600",
    bgClass: "bg-gradient-to-br from-blue-50 to-blue-100/50",
    borderClass: "border-blue-200/50",
  },
] as const;

export function KaryawanCalendarClient({
  events,
  stats,
  userName,
}: KaryawanCalendarClientProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const fcEvents = events.map((ev) => ({
    id: ev.id,
    title: ev.title,
    start: ev.date,
    allDay: true,
    backgroundColor: COLOR_MAP[ev.color].base,
    borderColor: COLOR_MAP[ev.color].border,
    extendedProps: { meta: ev.meta, href: ev.href, type: ev.type },
  }));

  const totalPages = Math.ceil(events.length / itemsPerPage);
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return fcEvents.slice(startIndex, startIndex + itemsPerPage);
  }, [fcEvents, currentPage, itemsPerPage]);

  const handleEventClick = useCallback(
    (info: any) => {
      info.jsEvent.preventDefault();
      const found = events.find((e) => e.id === info.event.id);
      if (found) setSelectedEvent(found);
    },
    [events]
  );

  const firstName = userName.split(" ")[0];

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      {/* ── Hero Header ─────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 border-b border-slate-700/50">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }} />
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-500/10 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            {/* Left: Title & Description */}
            <div className="space-y-4 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 backdrop-blur-sm">
                <Calendar className="h-4 w-4 text-blue-300" />
                <span className="text-xs font-semibold text-blue-200 tracking-wide">KALENDER PEMBELAJARAN</span>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                  Kalender Belajarku
                </h1>
                <p className="text-base md:text-lg text-slate-300 max-w-2xl">
                  Halo <span className="font-semibold text-white">{firstName}</span>, pantau jadwal dan aktivitas pelatihanmu di sini.
                </p>
              </div>
            </div>

            {/* Right: Quick Stats Summary */}
            <div className="flex flex-col gap-3 md:items-end">
              <div className="flex items-center gap-2 text-white/90">
                <CalendarDays className="h-5 w-5 text-blue-300" />
                <span className="text-sm font-medium">Total {events.length} Aktivitas</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-white/10 text-white border-white/20 backdrop-blur-sm">
                  {stats.upcomingDeadlines} Deadline
                </Badge>
                <Badge variant="secondary" className="bg-white/10 text-white border-white/20 backdrop-blur-sm">
                  {stats.activeCourses} Kursus Aktif
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Stat Cards ─────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {STATS.map(({ key, label, icon: Icon, iconClass, bgClass, borderClass }) => (
            <Card 
              key={key} 
              className={cn(
                "border-2 shadow-sm hover:shadow-lg transition-all duration-300 group cursor-default overflow-hidden relative",
                bgClass,
                borderClass
              )}
            >
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <CardContent className="p-6 relative">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-14 w-14 rounded-xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform",
                    iconClass
                  )}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-3xl md:text-4xl font-bold tabular-nums leading-none text-slate-900 mb-2">
                      {stats[key as keyof typeof stats]}
                    </p>
                    <p className="text-xs md:text-sm text-slate-600 font-medium leading-tight">
                      {label}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Legend ─────────────────────────────────── */}
        <Card className="border-2 border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 md:p-5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">Keterangan:</span>
              </div>
              {Object.entries(EVENT_TYPE_CONFIG).map(([key, { label, badgeClass }]) => (
                <div key={key} className="flex items-center gap-2">
                  <Badge className={cn("text-xs font-medium px-3 py-1", badgeClass)}>
                    {label}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Calendar ───────────────────────────────── */}
        <Card className="border-2 border-slate-200 shadow-lg bg-white overflow-hidden">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                <CalendarDays className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">Kalender Aktivitas</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Klik pada event untuk melihat detail</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <FullCalendarWrapper
              events={paginatedEvents}
              onEventClick={handleEventClick}
            />
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={events.length}
              itemsPerPage={itemsPerPage}
              itemLabel="event"
            />
          </div>
        )}

      </div>

      {/* ── Event Detail Dialog ────────────────────── */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      >
        <DialogContent className="sm:max-w-lg rounded-xl border-2 shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="flex items-start gap-3">
              {selectedEvent && (
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-md",
                  EVENT_TYPE_CONFIG[selectedEvent.type].iconBg
                )}>
                  {(() => {
                    const Icon = EVENT_TYPE_CONFIG[selectedEvent.type].icon;
                    return <Icon className={cn("h-6 w-6", EVENT_TYPE_CONFIG[selectedEvent.type].iconColor)} />;
                  })()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-bold text-slate-900 leading-tight">
                  Detail Aktivitas
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500 mt-1">
                  Informasi lengkap tentang event yang dipilih
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-5 py-2">
              {/* Type badge */}
              <Badge
                className={cn(
                  "text-xs font-semibold px-3 py-1.5",
                  EVENT_TYPE_CONFIG[selectedEvent.type].badgeClass
                )}
              >
                {EVENT_TYPE_CONFIG[selectedEvent.type].label}
              </Badge>

              <Separator className="bg-slate-200" />

              {/* Fields */}
              <div className="space-y-4">
                <DetailRow
                  icon={<Info className="h-5 w-5" />}
                  label="Deskripsi"
                  value={selectedEvent.title}
                  iconBg="bg-blue-50"
                  iconColor="text-blue-600"
                />
                <DetailRow
                  icon={<CalendarDays className="h-5 w-5" />}
                  label="Tanggal"
                  value={new Date(selectedEvent.date).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                  iconBg="bg-purple-50"
                  iconColor="text-purple-600"
                />
                {selectedEvent.meta && (
                  <DetailRow
                    icon={<Tag className="h-5 w-5" />}
                    label="Keterangan"
                    value={selectedEvent.meta}
                    iconBg="bg-amber-50"
                    iconColor="text-amber-600"
                  />
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-3 sm:gap-3 pt-4 mt-2 border-t">
            <Button
              variant="outline"
              onClick={() => setSelectedEvent(null)}
              className="flex-1 sm:flex-none rounded-lg border-2 hover:bg-slate-50"
            >
              Tutup
            </Button>
            {selectedEvent?.href && (
              <Button 
                asChild 
                className="flex-1 sm:flex-none gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md"
              >
                <Link href={selectedEvent.href} onClick={() => setSelectedEvent(null)}>
                  Buka Kursus
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── DetailRow ────────────────────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  value,
  iconBg,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors">
      <div className={cn(
        "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm",
        iconBg
      )}>
        <div className={iconColor}>
          {icon}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className="text-sm font-medium text-slate-900 leading-relaxed break-words">{value}</p>
      </div>
    </div>
  );
}
