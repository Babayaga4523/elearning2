/**
 * Indonesian Public Holidays
 * Auto-generated on 2026-05-28T19:51:52.842Z
 * Source: https://api-harilibur.vercel.app
 */

export interface Holiday {
  date: string;
  name: string;
}

export const HOLIDAYS: Record<string, Holiday[]> = {
  "2026": [],
  "2027": [],
  "2028": [],
  "2029": []
};

// Auto-generated functions
export function getHolidaysForYear(year: number): Holiday[] {
  return HOLIDAYS[String(year)] || [];
}

export function getHolidaysInRange(startDate: Date, endDate: Date): Holiday[] {
  const result: Holiday[] = [];
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  for (let year = startYear; year <= endYear; year++) {
    result.push(...getHolidaysForYear(year));
  }

  return result.filter((h) => {
    const d = new Date(h.date);
    return d >= startDate && d <= endDate;
  });
}

export function isHoliday(date: Date): Holiday | null {
  const year = String(date.getFullYear());
  const holidays = HOLIDAYS[year] || [];
  const dateStr = date.toISOString().split("T")[0];
  return holidays.find((h) => h.date === dateStr) || null;
}

export function getNextHoliday(): Holiday | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentYear = today.getFullYear();
  const nextYear = currentYear + 1;

  const holidays = [...getHolidaysForYear(currentYear), ...getHolidaysForYear(nextYear)];

  for (const holiday of holidays) {
    const d = new Date(holiday.date);
    if (d >= today) return holiday;
  }

  return null;
}

export function getDaysUntilNextHoliday(): number | null {
  const next = getNextHoliday();
  if (!next) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = new Date(next.date).getTime() - today.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
