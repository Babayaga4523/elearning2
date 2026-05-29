/**
 * Script to update Indonesian holidays from API
 * Run: npx ts-node scripts/update-holidays.ts
 */

import fs from "fs";
import path from "path";

const API_URL = "https://api-harilibur.vercel.app";

interface ApiHoliday {
  holiday_date: string;
  holiday_name: string;
  is_national_holiday: boolean;
}

async function fetchHolidays(year: number): Promise<ApiHoliday[]> {
  try {
    const response = await fetch(`${API_URL}/?year=${year}&n=1`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${year}:`, error);
    return [];
  }
}

async function run() {
  console.log("📅 Updating Indonesian holidays...\n");

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1, currentYear + 2, currentYear + 3];

  const allHolidays: Record<string, { date: string; name: string }[]> = {};

  for (const year of years) {
    console.log(`Fetching ${year}...`);
    const holidays = await fetchHolidays(year);

    allHolidays[String(year)] = holidays
      .filter((h) => h.is_national_holiday)
      .map((h) => ({
        date: h.holiday_date,
        name: h.holiday_name,
      }));

    // Rate limit to avoid API throttling
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Generate TypeScript file
  const content = `/**
 * Indonesian Public Holidays
 * Auto-generated on ${new Date().toISOString()}
 * Source: ${API_URL}
 */

export interface Holiday {
  date: string;
  name: string;
}

export const HOLIDAYS: Record<string, Holiday[]> = ${JSON.stringify(allHolidays, null, 2)};

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
`;

  const filePath = path.join(process.cwd(), "src/lib/holidays.ts");
  fs.writeFileSync(filePath, content);

  console.log("\n✅ Holidays updated successfully!");
  console.log(`   Updated ${Object.keys(allHolidays).length} years`);
  console.log(`   File: ${filePath}`);
}

// Run if executed directly
run().catch(console.error);