"use client";

/**
 * Admin Calendar Client
 * Beautiful calendar page for monitoring course deadlines and enrollment activity
 * Uses consistent admin UI design system (BNI Finance color scheme)
 */

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { CalendarDays, Users, Clock, BookOpen, ExternalLink, ChevronRight, AlertCircle, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const FullCalendarWrapper = dynamic(
  () => import("@/components/admin/FullCalendarWrapper"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-t-[#E8A020] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <p className="text-sm text-[#98A2B3] font-medium">Memuat kalender...</p>
        </div>
      </div>
    ),
  }
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

const EVENT_TYPE_CONFIG: Record<CalendarEvent["type"], { label: string; icon: React.ReactNode; badgeClass: string }> = {
  DEADLINE:   { label: "Deadline", icon: <Clock size={12} />, badgeClass: "bg-[#FEF3F2] text-[#B42318] border-[#FDA29B]" },
  ENROLLMENT: { label: "Enrollment", icon: <UserCheck size={12} />, badgeClass: "bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6]" },
  SYSTEM:     { label: "System", icon: <AlertCircle size={12} />, badgeClass: "bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]" },
  COMPLETION: { label: "Completion", icon: <BookOpen size={12} />, badgeClass: "bg-[#FEF3DC] text-[#C4861A] border-[#F5C05A]" },
  TEST:       { label: "Test", icon: <CalendarDays size={12} />, badgeClass: "bg-[#E8EDF7] text-[#0F1C3F] border-[#CBD2E0]" },
};

const COLOR_MAP: Record<EventColor, { base: string; border: string; badge: string; badgeText: string }> = {
  rose:    { base: "#F04438", border: "#E11D48", badge: "bg-[#FEF3F2]", badgeText: "text-[#B42318]" },
  emerald: { base: "#12B76A", border: "#059669", badge: "bg-[#ECFDF3]", badgeText: "text-[#027A48]" },
  amber:   { base: "#F79009", border: "#D97706", badge: "bg-[#FFFAEB]", badgeText: "text-[#B54708]" },
  blue:    { base: "#2E90FA", border: "#2563EB", badge: "bg-[#EFF8FF]", badgeText: "text-[#175CD3]" },
  indigo:  { base: "#6366F1", border: "#4F46E5", badge: "bg-[#E8EDF7]", badgeText: "text-[#0F1C3F]" },
};

const STATS_CONFIG = [
  {
    label: "Deadline Bulan Ini",
    statKey: "deadlines" as const,
    icon: Clock,
    colorBg: "bg-[#FEF3F2]",
    colorText: "text-[#F04438]",
    badge: "Deadline",
    badgeClass: "bg-[#FEF3F2] text-[#B42318]"
  },
  {
    label: "Enrollment Baru",
    statKey: "enrollments" as const,
    icon: Users,
    colorBg: "bg-[#ECFDF3]",
    colorText: "text-[#12B76A]",
    badge: "Enrollment",
    badgeClass: "bg-[#ECFDF3] text-[#027A48]"
  },
  {
    label: "Total Kursus Aktif",
    statKey: "courses" as const,
    icon: BookOpen,
    colorBg: "bg-[#EFF8FF]",
    colorText: "text-[#2E90FA]",
    badge: "Kursus",
    badgeClass: "bg-[#EFF8FF] text-[#175CD3]"
  },
];

export function AdminCalendarClient({ events, statsThisMonth }: AdminCalendarClientProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const fcEvents = useMemo(() => {
    return events.map((ev) => ({
      id: ev.id,
      title: ev.title.replace(/^[^\s]+\s/, ""), // Remove emoji prefix
      start: ev.date,
      allDay: true,
      backgroundColor: COLOR_MAP[ev.color].base,
      borderColor: COLOR_MAP[ev.color].border,
      textColor: "#FFFFFF",
      classNames: [`event-${ev.type.toLowerCase()}`],
      extendedProps: {
        meta: ev.meta,
        href: ev.href,
        type: ev.type,
        eventType: ev.type, // For CSS data attribute
      },
    }));
  }, [events]);

  const handleEventClick = useCallback((info: any) => {
    info.jsEvent.preventDefault();
    const found = events.find((e) => e.id === info.event.id);
    if (found) setSelectedEvent(found);
  }, [events]);

  // Group events by type for badge display
  const deadlineEvents = events.filter(e => e.type === "DEADLINE").length;
  const enrollmentEvents = events.filter(e => e.type === "ENROLLMENT").length;

  return (
    <div className="space-y-6 font-['DM_Sans']">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#0F1C3F] flex items-center justify-center shadow-md">
            <CalendarDays size={24} className="text-[#E8A020]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#101828] font-['Lexend_Deca'] tracking-tight">Kalender Pelatihan</h1>
            <p className="text-sm text-[#475467]">Pantau deadline kursus dan aktivitas enrollment</p>
          </div>
        </div>

        {/* Event Type Badges in Header */}
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border", EVENT_TYPE_CONFIG["DEADLINE"].badgeClass)}>
            <Clock size={11} />
            {deadlineEvents} Deadline
          </span>
          <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border", EVENT_TYPE_CONFIG["ENROLLMENT"].badgeClass)}>
            <Users size={11} />
            {enrollmentEvents} Enrollment
          </span>
        </div>
      </div>

      {/* Stats Cards with Event Type Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {STATS_CONFIG.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-[#E4E7EC] p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden">
            {/* Color accent bar */}
            <div className={cn("absolute top-0 left-0 w-full h-1", stat.colorBg.replace("bg-", "bg-").replace("[", "").replace("]", ""))} style={{ backgroundColor: stat.colorText.replace("text-", "") }} />

            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-[#475467]">{stat.label}</p>
                {/* Inline badge */}
                <span className={cn("inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold", stat.badgeClass)}>
                  <span className="w-1 h-1 rounded-full bg-current opacity-60" />
                  {stat.badge}
                </span>
              </div>
              <div className={cn("p-2.5 rounded-lg", stat.colorBg)}>
                <stat.icon size={18} className={stat.colorText} />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#101828] font-['Lexend_Deca'] leading-none">{statsThisMonth[stat.statKey]}</p>
          </div>
        ))}
      </div>

      {/* Event Legend with Badges */}
      <div className="bg-white rounded-xl border border-[#E4E7EC] p-4">
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider">Tipe Event:</p>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FEF3F2] text-[#B42318] text-xs font-semibold border border-[#FDA29B]">
              <Clock size={12} />
              Deadline
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ECFDF3] text-[#027A48] text-xs font-semibold border border-[#6CE9A6]">
              <Users size={12} />
              Enrollment
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EFF8FF] text-[#175CD3] text-xs font-semibold border border-[#B2DDFF]">
              <CalendarDays size={12} />
              Lainnya
            </span>
          </div>
        </div>
      </div>

      {/* Main Calendar */}
      <div className="bg-white rounded-xl border border-[#E4E7EC] overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-[#E4E7EC] bg-[#F8F9FB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#E8A020]" />
            <h3 className="text-sm font-semibold text-[#101828]">Calendar Overview</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#98A2B3]">{events.length} events</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F04438]" />
              <span className="w-2 h-2 rounded-full bg-[#12B76A]" />
            </div>
          </div>
        </div>
        <div className="p-4 md:p-6">
          <FullCalendarWrapper events={fcEvents} onEventClick={handleEventClick} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { href: "/admin/courses", icon: BookOpen, label: "Manajemen Kursus", desc: "Lihat dan kelola semua kursus", iconBg: "bg-[#E8EDF7]", iconHover: "group-hover:bg-[#0F1C3F]", iconColor: "text-[#0F1C3F]", iconHoverColor: "group-hover:text-[#E8A020]" },
          { href: "/admin/enrollments", icon: Users, label: "Manajemen Enrollment", desc: "Kelola enrollment karyawan", iconBg: "bg-[#ECFDF3]", iconHover: "group-hover:bg-[#027A48]", iconColor: "text-[#027A48]", iconHoverColor: "group-hover:text-white" },
        ].map((action) => (
          <Link key={action.href} href={action.href} className="block">
            <div className="bg-white rounded-xl border border-[#E4E7EC] p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors", action.iconBg, action.iconHover)}>
                <action.icon size={18} className={cn(action.iconColor, "transition-colors", action.iconHoverColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#101828]">{action.label}</p>
                <p className="text-xs text-[#98A2B3] mt-0.5">{action.desc}</p>
              </div>
              <ChevronRight size={16} className="text-[#98A2B3] shrink-0" />
            </div>
          </Link>
        ))}
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden font-['DM_Sans'] border-0 shadow-2xl rounded-2xl">
          {selectedEvent && <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EventDetailModal({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  const config = EVENT_TYPE_CONFIG[event.type];
  const colorConfig = COLOR_MAP[event.color];

  return (
    <div className="flex flex-col">
      {/* Header with event type color */}
      <div className="relative px-5 pt-5 pb-4 bg-gradient-to-br from-[#0F1C3F] via-[#1A2D5A] to-[#0F1C3F]">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1L11 11M11 1L1 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <div className="w-12 h-12 rounded-xl bg-[#E8A020] flex items-center justify-center mb-3">
          <IconByType type={event.type} size={22} />
        </div>

        {/* Event Type Badge */}
        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border", config.badgeClass)}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {config.label}
        </span>
      </div>

      {/* Content */}
      <div className="px-5 py-5">
        <h2 className="text-base font-bold text-[#101828] font-['Lexend_Deca'] mb-4 leading-snug">
          {event.title.replace(/^[^\s]+\s/, "")}
        </h2>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F8F9FB]">
            <div className="w-8 h-8 rounded-lg bg-[#E8EDF7] flex items-center justify-center">
              <CalendarDays size={15} className="text-[#0F1C3F]" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#98A2B3] uppercase tracking-wider">Tanggal</p>
              <p className="text-sm font-semibold text-[#101828]">{formatDate(event.date)}</p>
            </div>
          </div>

          {event.meta && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F8F9FB]">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colorConfig.badge)}>
                <IconByType type={event.type} size={15} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#98A2B3] uppercase tracking-wider">Keterangan</p>
                <p className="text-sm font-semibold text-[#101828]">{event.meta}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-5">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-10 text-sm font-medium rounded-xl border-[#E4E7EC] text-[#475467] hover:bg-[#F8F9FB]"
          >
            Tutup
          </Button>
          {event.href && (
            <Link href={event.href} onClick={onClose} className="flex-1">
              <Button className="w-full h-10 text-sm font-semibold rounded-xl bg-[#E8A020] hover:bg-[#C4861A] text-white shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                Lihat Detail
                <ExternalLink size={14} />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function IconByType({ type, size }: { type: CalendarEvent["type"]; size: number }) {
  switch (type) {
    case "DEADLINE":
      return <Clock size={size} className="text-white" />;
    case "ENROLLMENT":
      return <Users size={size} className="text-white" />;
    default:
      return <CalendarDays size={size} className="text-white" />;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}