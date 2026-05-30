"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  CheckCircle,
  GraduationCap,
  ExternalLink,
  CalendarDays,
  Clock,
  Tag,
  Info,
  AlertCircle,
  TrendingUp,
  Calendar,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const FullCalendarWrapper = dynamic<{
  events: any[];
  onEventClick: (info: any) => void;
  primaryColor?: string;
  accentColor?: string;
  textColor?: string;
}>(
  () => import("@/components/admin/FullCalendarWrapper"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[520px] w-full rounded-2xl bg-white border border-[#E4E7EC] shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative flex items-center justify-center w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-[#E8A020]/20 border-t-[#E8A020] animate-spin"></div>
            <CalendarDays className="h-5 w-5 text-[#0F1C3F] animate-pulse" />
          </div>
          <p className="text-sm text-[#475467] font-semibold font-['DM_Sans']">Memuat kalender pintar…</p>
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
  rose:    { base: "#F43F5E", border: "#E11D48" },
  emerald: { base: "#10B981", border: "#059669" },
  amber:   { base: "#E8A020", border: "#C68215" },
  blue:    { base: "#3B82F6", border: "#2563EB" },
  indigo:  { base: "#6366F1", border: "#4F46E5" },
};

const EVENT_TYPE_CONFIG = {
  DEADLINE: {
    label:     "Batas Waktu",
    badge:     "bg-[#FFF1F2] text-[#E11D48] border-[#FFE4E6] font-semibold",
    iconBg:    "bg-[#FFF1F2]",
    iconColor: "text-[#E11D48]",
    dot:       "bg-[#F43F5E]",
  },
  COMPLETION: {
    label:     "Modul Selesai",
    badge:     "bg-[#ECFDF5] text-[#059669] border-[#D1FAE5] font-semibold",
    iconBg:    "bg-[#ECFDF5]",
    iconColor: "text-[#10B981]",
    dot:       "bg-[#10B981]",
  },
  TEST: {
    label:     "Ujian Selesai",
    badge:     "bg-[#FFFBEB] text-[#B45309] border-[#FEF3C7] font-semibold",
    iconBg:    "bg-[#FFFBEB]",
    iconColor: "text-[#E8A020]",
    dot:       "bg-[#E8A020]",
  },
};

const STATS_CONFIG = [
  {
    key:        "upcomingDeadlines",
    label:      "Deadline Mendatang",
    sublabel:   "30 hari ke depan",
    icon:       AlertCircle,
    accent:     "text-[#E11D48]",
    accentBg:   "bg-[#FFF1F2]",
    border:     "border-[#FFE4E6]",
    hoverBorder: "hover:border-[#F43F5E]/30",
  },
  {
    key:        "modulesCompletedThisMonth",
    label:      "Modul Selesai",
    sublabel:   "Bulan ini",
    icon:       CheckCircle,
    accent:     "text-[#059669]",
    accentBg:   "bg-[#ECFDF5]",
    border:     "border-[#D1FAE5]",
    hoverBorder: "hover:border-[#10B981]/30",
  },
  {
    key:        "activeCourses",
    label:      "Kursus Aktif",
    sublabel:   "Sedang berjalan",
    icon:       TrendingUp,
    accent:     "text-[#E8A020]",
    accentBg:   "bg-[#FFFBEB]",
    border:     "border-[#FEF3C7]",
    hoverBorder: "hover:border-[#E8A020]/30",
  },
] as const;

export function KaryawanCalendarClient({
  events,
  stats,
  userName,
}: KaryawanCalendarClientProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const fcEvents = useMemo(
    () =>
      events.map((ev) => {
        const colorConfig = COLOR_MAP[ev.color] || COLOR_MAP.indigo;
        return {
          id:              ev.id,
          title:           ev.title,
          start:           ev.date,
          allDay:          true,
          backgroundColor: colorConfig.base,
          borderColor:     colorConfig.border,
          textColor:       "#fff",
          extendedProps:   { meta: ev.meta, href: ev.href, type: ev.type },
        };
      }),
    [events]
  );

  const handleEventClick = useCallback(
    (info: any) => {
      info.jsEvent.preventDefault();
      const found = events.find((e) => e.id === info.event.id);
      if (found) setSelectedEvent(found);
    },
    [events]
  );

  const firstName = userName.split(" ")[0];

  const PRIMARY = "#0F1C3F";   // BNI Corporate Navy
  const ACCENT  = "#E8A020";   // BNI Corporate Gold

  return (
    <div className="min-h-screen pb-24 bg-[#F8F9FC]">

      {/* ── Page Header Immersif ────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0F1C3F] via-[#152554] to-[#0A1430] border-b border-[#E8A020]/20 py-10 md:py-12 px-6 md:px-8 text-white">
        {/* Mesh grid backdrop */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        {/* Glowing orbs */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#E8A020] opacity-[0.08] blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#3B82F6] opacity-[0.06] blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#E8A020]">
                <span className="text-[#E8A020] animate-pulse">✦</span>
                <span className="text-xs font-semibold tracking-wider uppercase font-['Lexend_Deca']">
                  BNI FINANCE E-LEARNING
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-['Lexend_Deca'] text-white">
                Kalender Belajarku
              </h1>
              <p className="text-sm md:text-base text-slate-300 font-['DM_Sans'] max-w-xl">
                Pantau jadwal pembelajaran, tenggat waktu pengerjaan modul, dan jadwal ujian sertifikasi Anda dengan presisi, {firstName}.
              </p>
            </div>

            {/* Quick meta */}
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-300 bg-white/5 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 shadow-inner font-['DM_Sans']">
              <div className="flex items-center gap-1.5 border-r border-white/10 pr-4">
                <CalendarDays className="h-4 w-4 text-[#E8A020]" />
                <span>{events.length} Aktivitas</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-400">
                <Clock className="h-4 w-4" />
                <span>{stats.upcomingDeadlines} Deadline</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Stat Cards ──────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {STATS_CONFIG.map(({ key, label, sublabel, icon: Icon, accent, accentBg, border, hoverBorder }) => (
            <Card
              key={key}
              className={cn(
                "border bg-white shadow-[0_4px_20px_rgb(0,0,0,0.01)] transition-all duration-300 rounded-2xl active:scale-[0.98]",
                border,
                hoverBorder
              )}
            >
              <CardContent className="p-6 flex items-center gap-5">
                <div
                  className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                    accentBg
                  )}
                >
                  <Icon className={cn("h-5 w-5", accent)} />
                </div>
                <div className="min-w-0">
                  <p className="text-3xl font-extrabold text-[#0F1C3F] font-['Lexend_Deca'] tabular-nums leading-none">
                    {stats[key as keyof typeof stats]}
                  </p>
                  <p className="text-xs text-[#475467] font-semibold font-['DM_Sans'] mt-1.5 leading-tight">
                    {label}
                    <span className="text-[#98A2B3] font-medium font-['DM_Sans']"> — {sublabel}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Legend ─────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 bg-white px-6 py-4 rounded-xl border border-[#E4E7EC] shadow-[0_2px_8px_rgb(0,0,0,0.01)]">
          <span className="text-xs font-bold text-[#0F1C3F] font-['Lexend_Deca'] tracking-wide uppercase">Keterangan:</span>
          <div className="flex flex-wrap items-center gap-4">
            {Object.entries(EVENT_TYPE_CONFIG).map(([type, cfg]) => (
              <div key={type} className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full ring-2 ring-white shadow-sm", cfg.dot)} />
                <Badge className={cn("text-xs font-semibold px-2.5 py-1 rounded-lg border font-['DM_Sans'] shadow-none", cfg.badge)}>
                  {cfg.label}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* ── Calendar ────────────────────────────────── */}
        <Card className="border border-[#E4E7EC] shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-[#E4E7EC] bg-slate-50/50 px-6 py-5">
            <div className="flex items-center gap-3.5">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
                style={{ backgroundColor: `${PRIMARY}0F` }}
              >
                <CalendarDays className="h-5 w-5" style={{ color: PRIMARY }} />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-[#0F1C3F] font-['Lexend_Deca']">
                  Aktivitas Pembelajaran Anda
                </CardTitle>
                <p className="text-xs text-[#475467] font-semibold font-['DM_Sans'] mt-0.5">
                  Klik agenda untuk melihat rincian instruksi pembelajaran
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            {/* Custom FullCalendar overrides with corporate premium design */}
            <style>{`
              .fc .fc-toolbar.fc-header {
                margin-bottom: 1.5rem;
              }
              .fc .fc-button-primary {
                background-color: #ffffff !important;
                border: 1px solid #E4E7EC !important;
                color: #344054 !important;
                font-family: 'DM Sans', sans-serif;
                font-size: 0.8125rem;
                font-weight: 700;
                padding: 0.45rem 0.9rem;
                border-radius: 0.625rem;
                text-transform: capitalize;
                transition: all 200ms ease;
                box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
              }
              .fc .fc-button-primary:hover {
                background-color: #F8F9FC !important;
                border-color: #D0D5DD !important;
                color: #0F1C3F !important;
              }
              .fc .fc-button-primary:active {
                transform: scale(0.97);
              }
              .fc .fc-button-primary:disabled {
                background-color: #ffffff !important;
                border-color: #F2F4F7 !important;
                color: #D0D5DD !important;
                opacity: 0.5;
              }
              .fc .fc-button-primary:not(:disabled).fc-button-active,
              .fc .fc-button-primary.fc-button-active {
                background-color: ${PRIMARY} !important;
                border-color: ${PRIMARY} !important;
                color: #ffffff !important;
                box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
              }
              .fc .fc-toolbar-title {
                font-family: 'Lexend Deca', sans-serif;
                font-size: 1.125rem;
                font-weight: 800;
                color: ${PRIMARY};
              }
              .fc .fc-col-header-cell {
                background-color: #F8F9FC;
                font-family: 'Lexend Deca', sans-serif;
                font-weight: 700;
                font-size: 0.725rem;
                text-transform: uppercase;
                letter-spacing: 0.07em;
                color: #475467;
                padding: 0.75rem 0;
                border-bottom: 2px solid #E4E7EC !important;
              }
              .fc .fc-daygrid-day-number {
                font-family: 'DM Sans', sans-serif;
                font-weight: 600;
                font-size: 0.8125rem;
                color: #344054;
                padding: 0.25rem;
                width: 2rem;
                height: 2rem;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                margin: 4px;
                transition: all 150ms ease;
              }
              .fc .fc-daygrid-day.fc-day-today {
                background-color: rgba(15, 28, 63, 0.02) !important;
              }
              .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
                background-color: ${PRIMARY} !important;
                color: #ffffff !important;
                font-weight: 750;
                box-shadow: 0 4px 10px rgba(15, 28, 63, 0.15);
              }
              .fc .fc-daygrid-day:not(.fc-day-today):hover .fc-daygrid-day-number {
                background-color: #F2F4F7;
                color: ${PRIMARY};
              }
              .fc .fc-daygrid-day.fc-day-past .fc-daygrid-day-number {
                color: #98A2B3;
              }
              .fc .fc-daygrid-event {
                border-radius: 0.5rem !important;
                border: none !important;
                padding: 3px 6px !important;
                margin: 2px 5px !important;
                font-size: 0.725rem !important;
                font-family: 'DM Sans', sans-serif;
                font-weight: 600;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
                transition: all 200ms ease !important;
                overflow: hidden;
              }
              .fc .fc-daygrid-event:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(15, 28, 63, 0.12);
                opacity: 0.95 !important;
              }
              .fc .fc-daygrid-event-dot {
                display: none;
              }
              .fc .fc-event .fc-event-main {
                padding: 1px 4px;
              }
              .fc .fc-list-event:hover td {
                background-color: #F8F9FC;
              }
              .fc .fc-list-event td {
                transition: background-color 150ms ease;
                border-color: #E4E7EC !important;
              }
              .fc .fc-list-day-cushion {
                background-color: #F8F9FC;
                font-family: 'Lexend Deca', sans-serif;
                font-weight: 700;
                color: ${PRIMARY};
              }
              .fc td.fc-highlight,
              .fc .fc-daygrid-day.fc-day-highlight {
                background-color: ${PRIMARY}0A;
              }
              .fc-theme-standard td, .fc-theme-standard th {
                border-color: #E4E7EC !important;
              }
              @media (prefers-reduced-motion: reduce) {
                .fc *,
                .fc .fc-button * {
                  transition-duration: 0ms !important;
                  animation-duration: 0ms !important;
                }
              }
            `}</style>

            <FullCalendarWrapper
              events={fcEvents}
              onEventClick={handleEventClick}
              primaryColor={PRIMARY}
              accentColor={ACCENT}
              textColor="#344054"
            />
          </CardContent>
        </Card>

      </div>

      {/* ── Event Detail Dialog ──────────────────────── */}
      <Dialog open={!!selectedEvent} onOpenChange={(o) => !o && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl border border-[#E4E7EC] shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-0 overflow-hidden bg-white">

          {/* Gold top indicator bar */}
          {selectedEvent && (
            <div
              className="h-1.5 w-full"
              style={{
                backgroundColor: COLOR_MAP[selectedEvent.color]?.base || COLOR_MAP.indigo.base,
              }}
            />
          )}

          <DialogHeader className="px-6 pt-6 pb-0 gap-1.5">
            <div className="flex items-start gap-4">
              {selectedEvent && (
                <div
                  className={cn(
                    "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                    EVENT_TYPE_CONFIG[selectedEvent.type].iconBg
                  )}
                >
                  {(() => {
                    const Icon =
                      selectedEvent.type === "DEADLINE"
                        ? AlertCircle
                        : selectedEvent.type === "COMPLETION"
                        ? CheckCircle
                        : GraduationCap;
                    return (
                      <Icon
                        className={cn(
                          "h-5.5 w-5.5",
                          EVENT_TYPE_CONFIG[selectedEvent.type].iconColor
                        )}
                      />
                    );
                  })()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-bold text-[#0F1C3F] font-['Lexend_Deca'] leading-snug">
                  {selectedEvent?.title}
                </DialogTitle>
                {selectedEvent && (
                  <Badge
                    className={cn(
                      "mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-lg border shadow-none",
                      EVENT_TYPE_CONFIG[selectedEvent.type].badge
                    )}
                  >
                    {EVENT_TYPE_CONFIG[selectedEvent.type].label}
                  </Badge>
                )}
              </div>
            </div>
            <DialogDescription className="text-sm font-medium text-[#475467] font-['DM_Sans'] mt-3.5 leading-relaxed bg-[#F8F9FC] border border-[#E4E7EC] p-3.5 rounded-xl">
              {selectedEvent?.meta}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="px-6 py-5 space-y-4">
              <DetailField
                icon={<CalendarDays className="h-4 w-4 text-[#E8A020]" />}
                label="Tanggal Pelaksanaan"
                value={new Date(selectedEvent.date).toLocaleDateString("id-ID", {
                  day:   "numeric",
                  month: "long",
                  year:  "numeric",
                })}
              />
            </div>
          )}

          <DialogFooter className="px-6 pb-6 pt-3 gap-3 border-t border-[#E4E7EC] bg-slate-50/40">
            <Button
              variant="outline"
              onClick={() => setSelectedEvent(null)}
              className="flex-1 rounded-xl border-[#D0D5DD] text-[#344054] hover:bg-[#F8F9FC] hover:text-[#0F1C3F] font-semibold font-['DM_Sans'] transition-all duration-200 active:scale-[0.98]"
            >
              Tutup Dialog
            </Button>
            {selectedEvent?.href && (
              <Button
                asChild
                className="flex-1 gap-2 rounded-xl font-semibold shadow-md shadow-[#0F1C3F]/10 bg-[#0F1C3F] hover:bg-[#1A2E63] text-white font-['DM_Sans'] transition-all duration-200 active:scale-[0.98]"
              >
                <Link
                  href={selectedEvent.href}
                  onClick={() => setSelectedEvent(null)}
                >
                  Buka Kursus
                  <ChevronRight className="h-4 w-4 text-[#E8A020] animate-pulse" />
                </Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── DetailField ────────────────────────────────────────────────────────────────

function DetailField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white border border-[#E4E7EC] transition-all duration-200 hover:border-[#0F1C3F]/10 shadow-[0_2px_8px_rgb(0,0,0,0.01)]">
      <div className="text-[#E8A020] shrink-0 bg-[#FFFBEB] p-2.5 rounded-lg border border-[#FEF3C7] shadow-inner">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-[#98A2B3] uppercase tracking-wider font-['DM_Sans']">
          {label}
        </p>
        <p className="text-sm font-bold text-[#0F1C3F] leading-snug font-['DM_Sans'] mt-0.5">
          {value}
        </p>
      </div>
    </div>
  );
}
