"use client";

/**
 * FullCalendar Wrapper
 * Custom styled calendar component matching admin design system
 */

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { Clock, Users } from "lucide-react";

interface FullCalendarWrapperProps {
  events: any[];
  onEventClick: (info: any) => void;
}

export default function FullCalendarWrapper({ events, onEventClick }: FullCalendarWrapperProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="[&_.fc]:font-['DM_Sans']">
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

        // Event display settings
        eventDisplay="block"
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }}
        nowIndicator={true}

        // Custom event content renderer
        eventContent={(arg) => {
          const isDeadline = arg.event.extendedProps?.type === "DEADLINE";
          const isEnrollment = arg.event.extendedProps?.type === "ENROLLMENT";

          return (
            <div className={`
              flex items-center gap-1 px-1.5 py-0.5 rounded-md
              ${isDeadline ? "bg-white/20 border-l-2 border-white/50" : ""}
              ${isEnrollment ? "bg-white/15 border-l-2 border-white/40" : ""}
              hover:bg-white/25 transition-colors
            `}>
              <span className="text-[10px] font-semibold leading-tight truncate">
                {arg.event.title}
              </span>
            </div>
          );
        }}

        // More link content
        moreLinkContent={(arg) => {
          return (
            <span className="
              inline-flex items-center justify-center
              px-2 py-0.5 rounded-full
              bg-[#E8A020]/20 text-[#C4861A]
              text-[10px] font-bold
              hover:bg-[#E8A020]/30 transition-colors
              cursor-pointer
            ">
              +{arg.num}
            </span>
          );
        }}

        // Day cell content
        dayCellContent={(arg) => {
          const hasEvents = arg.dayEl?.querySelector(".fc-event");
          return (
            <div className="relative">
              <span className={`
                inline-flex items-center justify-center
                w-7 h-7 rounded-full
                ${arg.isToday ? "bg-[#0F1C3F] text-white font-bold" : "text-[#344054] font-medium"}
                hover:bg-[#F8F9FB] transition-colors cursor-pointer
              `}>
                {arg.dayNumberText}
              </span>
            </div>
          );
        }}
      />
    </div>
  );
}