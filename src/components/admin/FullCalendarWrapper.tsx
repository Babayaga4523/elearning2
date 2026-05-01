"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";

interface FullCalendarWrapperProps {
  events: any[];
  onEventClick: (info: any) => void;
}

export default function FullCalendarWrapper({ events, onEventClick }: FullCalendarWrapperProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); // init
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
      initialView={isMobile ? "listWeek" : "dayGridMonth"}
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: isMobile ? "" : "dayGridMonth,timeGridWeek,listWeek",
      }}
      events={events}
      eventClick={onEventClick}
      dayMaxEvents={3}
      moreLinkClick="popover"
      height="auto" // Adjusts to fit contents
      firstDay={1} // Monday first
      buttonText={{
        today: "Hari Ini",
        month: "Bulan",
        week: "Minggu",
        list: "Agenda",
      }}
      locale="id"
    />
  );
}
