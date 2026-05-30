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

const FullCalendarWrapper = dynamic(
  () => import("@/components/admin/FullCalendarWrapper"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[520px] w-full rounded-2xl bg-slate-50 border border-slate-200 animate-pulse flex items-center justify-center">
        <div className="text-center space-y-3">
          <CalendarDays className="h-10 w-10 text-slate-300 mx-auto" />
          <p className="text-sm text-slate-400 font-medium">Memuat kalender…</p>
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
  DEADLINE: {
    label:     "Batas Waktu",
    badge:     "bg-rose-50 text-rose-700 border-rose-200",
    iconBg:    "bg-rose-100",
    iconColor: "text-rose-600",
    dot:       "bg-rose-500",
  },
  COMPLETION: {
    label:     "Modul Selesai",
    badge:     "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconBg:    "bg-emerald-100",
    iconColor: "text-emerald-600",
    dot:       "bg-emerald-500",
  },
  TEST: {
    label:     "Ujian Selesai",
    badge:     "bg-blue-50 text-blue-700 border-blue-200",
    iconBg:    "bg-blue-100",
    iconColor: "text-blue-600",
    dot:       "bg-blue-500",
  },
};

const STATS_CONFIG = [
  {
    key:        "upcomingDeadlines",
    label:      "Deadline Mendatang",
    sublabel:   "dalam 30 hari ke depan",
    icon:       AlertCircle,
    accent:     "text-rose-600",
    accentBg:   "bg-rose-50",
    border:     "border-rose-100",
  },
  {
    key:        "modulesCompletedThisMonth",
    label:      "Modul Selesai",
    sublabel:   "bulan ini",
    icon:       CheckCircle,
    accent:     "text-emerald-600",
    accentBg:   "bg-emerald-50",
    border:     "border-emerald-100",
  },
  {
    key:        "activeCourses",
    label:      "Kursus Aktif",
    sublabel:   "sedang berjalan",
    icon:       TrendingUp,
    accent:     "text-blue-600",
    accentBg:   "bg-blue-50",
    border:     "border-blue-100",
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
      events.map((ev) => ({
        id:              ev.id,
        title:           ev.title,
        start:           ev.date,
        allDay:          true,
        backgroundColor: COLOR_MAP[ev.color].base,
        borderColor:     COLOR_MAP[ev.color].border,
        textColor:       "#fff",
        extendedProps:   { meta: ev.meta, href: ev.href, type: ev.type },
      })),
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

  // Tailward-blue palette for calendar chrome
  const PRIMARY = "#2563EB";   // blue-600
  const ACCENT  = "#F59E0B";    // amber in "more" link


  return (
    <div className="min-h-screen pb-24 bg-slate-50">

      {/* ── Page Header ────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-600">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-semibold tracking-wide uppercase text-blue-500">
                  Kalender Pembelajaran
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Kalender Belajarku
              </h1>
              <p className="text-sm text-slate-500">
                Pantau jadwal dan aktivitas pelatihanmu, {firstName}.
              </p>
            </div>

            {/* Quick meta */}
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                <span>{events.length} aktivitas</span>
              </div>
              <span className="text-slate-300">·</span>
              <div className="flex items-center gap-1.5 text-rose-600">
                <Clock className="h-4 w-4" />
                <span>{stats.upcomingDeadlines} deadline</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Stat Cards ──────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STATS_CONFIG.map(({ key, label, sublabel, icon: Icon, accent, accentBg, border }) => (
            <Card
              key={key}
              className={cn(
                "border bg-white hover:shadow-md transition-shadow duration-200",
                border
              )}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div
                  className={cn(
                    "h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
                    accentBg
                  )}
                >
                  <Icon className={cn("h-5 w-5", accent)} />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none">
                    {stats[key as keyof typeof stats]}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 leading-tight">
                    {label}
                    <span className="text-slate-400"> — {sublabel}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Legend ─────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
          <span className="text-xs font-medium text-slate-500">Keterangan:</span>
          {Object.entries(EVENT_TYPE_CONFIG).map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
              <Badge className={cn("text-xs font-medium px-2.5 py-1", cfg.badge)}>
                {cfg.label}
              </Badge>
            </div>
          ))}
        </div>

        {/* ── Calendar ────────────────────────────────── */}
        <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${PRIMARY}15` }}
              >
                <CalendarDays className="h-4.5 w-4.5" style={{ color: PRIMARY }} />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Aktivitas Pembelajaran
                </CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  Klik event untuk melihat detail
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            {/* Inline FullCalendar CSS overrides — injected once via style tag */}
            <style>{`
              .fc .fc-toolbar.fc-header {
                margin-bottom: 1rem;
              }
              .fc .fc-button-primary {
                background-color: ${PRIMARY} !important;
                border-color: ${PRIMARY} !important;
                font-size: 0.75rem;
                font-weight: 600;
                padding: 0.35rem 0.75rem;
                border-radius: 0.5rem;
                text-transform: capitalize;
                transition: background-color 150ms ease, transform 100ms ease;
              }
              .fc .fc-button-primary:hover {
                background-color: #1d4ed8 !important;
                border-color: #1d4ed8 !important;
              }
              .fc .fc-button-primary:active {
                transform: scale(0.97);
              }
              .fc .fc-button-primary:disabled {
                background-color: ${PRIMARY}80 !important;
                border-color: ${PRIMARY}80 !important;
              }
              .fc .fc-button-primary:not(:disabled).fc-button-active,
              .fc .fc-button-primary.fc-button-active {
                background-color: #1e3a5f !important;
                border-color: #1e3a5f !important;
              }
              .fc .fc-toolbar-title {
                font-size: 1rem;
                font-weight: 700;
                color: #0f172a;
              }
              .fc .fc-col-header-cell {
                background-color: #f8fafc;
                font-weight: 600;
                font-size: 0.7rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #64748b;
                padding: 0.5rem 0;
              }
              .fc .fc-daygrid-day-number {
                font-size: 0.8rem;
                color: #334155;
                padding: 0.25rem;
                width: 2rem;
                height: 2rem;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 150ms ease, color 150ms ease;
              }
              .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
                background-color: ${PRIMARY};
                color: #fff;
                font-weight: 700;
              }
              .fc .fc-daygrid-day:not(.fc-day-today):hover .fc-daygrid-day-number {
                background-color: #f1f5f9;
              }
              .fc .fc-daygrid-day.fc-day-past .fc-daygrid-day-number {
                color: #94a3b8;
              }
              .fc .fc-daygrid-event {
                border-radius: 0.375rem;
                border-left-width: 3px;
                padding: 0;
                margin: 1px 3px;
                font-size: 0.7rem;
                overflow: hidden;
              }
              .fc .fc-daygrid-event:hover {
                opacity: 0.88;
              }
              .fc .fc-daygrid-event-dot {
                display: none;
              }
              .fc .fc-event .fc-event-main {
                padding: 2px 6px;
              }
              .fc .fc-list-event:hover td {
                background-color: #f8fafc;
              }
              .fc .fc-list-event td {
                transition: background-color 150ms ease;
              }
              .fc .fc-list-day-cushion {
                background-color: #f8fafc;
                font-weight: 600;
                color: #334155;
              }
              .fc td.fc-highlight,
              .fc .fc-daygrid-day.fc-day-highlight {
                background-color: ${PRIMARY}0d;
              }
              .fc-timegrid-slot {
                height: 2.5rem;
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
            />
          </CardContent>
        </Card>

      </div>

      {/* ── Event Detail Dialog ──────────────────────── */}
      <Dialog open={!!selectedEvent} onOpenChange={(o) => !o && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl border border-slate-200 shadow-xl p-0 overflow-hidden">

          {/* Colored top bar */}
          {selectedEvent && (
            <div
              className="h-1.5 w-full"
              style={{
                backgroundColor: COLOR_MAP[selectedEvent.color].base,
              }}
            />
          )}

          <DialogHeader className="px-6 pt-5 pb-0 gap-1">
            <div className="flex items-start gap-3">
              {selectedEvent && (
                <div
                  className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
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
                          "h-5 w-5",
                          EVENT_TYPE_CONFIG[selectedEvent.type].iconColor
                        )}
                      />
                    );
                  })()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-bold text-slate-900 leading-snug">
                  {selectedEvent?.title}
                </DialogTitle>
                {selectedEvent && (
                  <Badge
                    className={cn(
                      "mt-1.5 text-xs font-medium px-2 py-0.5",
                      EVENT_TYPE_CONFIG[selectedEvent.type].badge
                    )}
                  >
                    {EVENT_TYPE_CONFIG[selectedEvent.type].label}
                  </Badge>
                )}
              </div>
            </div>
            <DialogDescription className="text-sm text-slate-500 mt-2">
              {selectedEvent?.meta}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="px-6 py-4 space-y-3">
              <DetailField
                icon={<CalendarDays className="h-4 w-4" />}
                label="Tanggal"
                value={new Date(selectedEvent.date).toLocaleDateString("id-ID", {
                  day:   "numeric",
                  month: "long",
                  year:  "numeric",
                })}
              />
            </div>
          )}

          <DialogFooter className="px-6 pb-5 pt-2 gap-2 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setSelectedEvent(null)}
              className="flex-1 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              Tutup
            </Button>
            {selectedEvent?.href && (
              <Button
                asChild
                className="flex-1 gap-2 rounded-xl font-medium shadow-sm"
                style={{
                  backgroundColor: PRIMARY,
                  transition: "background-color 150ms ease, transform 100ms ease",
                }}
              >
                <Link
                  href={selectedEvent.href}
                  onClick={() => setSelectedEvent(null)}
                >
                  Buka Kursus
                  <ChevronRight className="h-4 w-4" />
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
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
      <div className="text-slate-400 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-semibold text-slate-800 leading-snug">
          {value}
        </p>
      </div>
    </div>
  );
}
