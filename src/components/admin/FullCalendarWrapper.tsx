"use client";

/**
 * FullCalendar Wrapper
 * Custom styled calendar component — accepts theme-aware color props
 */

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { cn } from "@/lib/utils";

interface FullCalendarWrapperProps {
  events: any[];
  onEventClick: (info: any) => void;
  /** Primary brand color used for today indicator and active elements (default: blue-600) */
  primaryColor?: string;
  /** Accent color for "more" links (default: amber-500) */
  accentColor?: string;
  /** Text color for day numbers (default: slate-800) */
  textColor?: string;
}

const DEFAULTS = {
  primaryColor: "#2563EB",
  accentColor: "#F59E0B",
  textColor: "#1E293B",
};

export default function FullCalendarWrapper({
  events,
  onEventClick,
  primaryColor = DEFAULTS.primaryColor,
  accentColor = DEFAULTS.accentColor,
  textColor = DEFAULTS.textColor,
}: FullCalendarWrapperProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="[&_.fc]:font-['DM_Sans'] [&_.fc-theme-standard]:dark:bg-transparent">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView={isMobile ? "listMonth" : "dayGridMonth"}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: isMobile ? "" : "dayGridMonth,timeGridWeek,listMonth",
        }}
        events={events}
        eventClick={onEventClick}
        dayMaxEvents={3}
        moreLinkClick="popover"
        height="auto"
        firstDay={1}
        buttonText={{
          today: "Hari Ini",
          month: "Bulan",
          week: "Minggu",
          list: "Agenda",
        }}
        locale="id"
        eventDisplay="block"
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }}
        nowIndicator={true}

        // Toolbar button styling via CSS
        eventContent={(arg) => {
          const type = arg.event.extendedProps?.type;
          return (
            <div className={cn(
              "flex items-center gap-1.5 px-1.5 py-0.5 rounded text-white/90",
              "hover:bg-white/20 transition-colors duration-150"
            )}>
              <span className="text-[11px] font-semibold leading-tight truncate">
                {arg.event.title}
              </span>
            </div>
          );
        }}

        moreLinkContent={(arg) => (
          <span
            className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer"
            style={{
              backgroundColor: `${accentColor}20`,
              color: accentColor,
            }}
          >
            +{arg.num}
          </span>
        )}

        dayCellContent={(arg) => (
          <span
            className={cn(
              "inline-flex items-center justify-center w-7 h-7 rounded-full font-medium cursor-pointer",
              "hover:ring-2 hover:ring-slate-200 transition-all duration-150"
            )}
            style={{
              color: arg.isToday ? "#fff" : textColor,
              backgroundColor: arg.isToday ? primaryColor : "transparent",
              fontWeight: arg.isToday ? 700 : 500,
            }}
          >
            {arg.dayNumberText}
          </span>
        )}
      />
    </div>
  );
}