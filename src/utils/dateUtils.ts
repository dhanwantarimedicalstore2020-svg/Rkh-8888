import { DayOfWeek } from '../types';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * Format a Date object as 'YYYY-MM-DD' using local year, month, date
 * to avoid UTC timezone day-shifting errors.
 */
export function formatLocalISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse 'YYYY-MM-DD' into a local Date object safely.
 */
export function parseLocalISODate(dateStr?: string | null): Date {
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date();
  }
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    return new Date();
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return new Date();
  }
  return new Date(year, month, day, 12, 0, 0); // Midday to prevent any DST jump
}

/**
 * Deterministically resolve the DayOfWeek from an ISO date string
 */
export function getWeekdayFromDate(dateStr?: string | null): DayOfWeek {
  if (!dateStr) return DAYS_OF_WEEK[new Date().getDay()];
  const d = parseLocalISODate(dateStr);
  return DAYS_OF_WEEK[d.getDay()];
}

/**
 * Get human-readable formatted string (e.g. "Thursday, August 27, 2026")
 */
export function formatReadableDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = parseLocalISODate(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get short human-readable formatted string (e.g. "Thu, Aug 27")
 */
export function formatShortDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = parseLocalISODate(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Add or subtract days safely
 */
export function offsetDays(dateStr?: string | null, amount: number = 0): string {
  const d = parseLocalISODate(dateStr || getTodayDateString());
  d.setDate(d.getDate() + amount);
  return formatLocalISODate(d);
}

/**
 * Get today's local date string
 */
export function getTodayDateString(): string {
  return formatLocalISODate(new Date());
}

/**
 * ISO 8601 Week Number calculation
 */
export function getISOWeek(dateStr?: string | null): { weekNumber: number; year: number } {
  const date = parseLocalISODate(dateStr || getTodayDateString());
  // Copy date so don't modify original
  const target = new Date(date.valueOf());
  // ISO week date weeks start on Monday, so correct the day number
  const dayNr = (date.getDay() + 6) % 7;
  // Set target to nearest Thursday: current date + 4 - current day number
  target.setDate(target.getDate() - dayNr + 3);
  // ISO 8601 year starts with the week containing the first Thursday
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  // 604800000 = 7 * 24 * 3600 * 1000
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return { weekNumber, year: target.getFullYear() };
}

/**
 * Get Quarter info (1-4)
 */
export function getQuarterInfo(dateStr?: string | null): { quarter: number; year: number; label: string } {
  const d = parseLocalISODate(dateStr || getTodayDateString());
  const month = d.getMonth(); // 0-11
  const quarter = Math.floor(month / 3) + 1;
  const year = d.getFullYear();
  return { quarter, year, label: `${year}-Q${quarter}` };
}

/**
 * Get Month info
 */
export function getMonthInfo(dateStr?: string | null): { month: number; year: number; label: string; name: string } {
  const d = parseLocalISODate(dateStr || getTodayDateString());
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const name = d.toLocaleDateString('en-US', { month: 'long' });
  const label = `${year}-${String(month).padStart(2, '0')}`;
  return { month, year, label, name };
}

/**
 * Get all 7 days of the week containing dateStr (Monday to Sunday)
 */
export function getWeekDaysForDate(dateStr?: string | null): { dateStr: string; weekday: DayOfWeek; isCurrent: boolean }[] {
  const targetStr = dateStr || getTodayDateString();
  const d = parseLocalISODate(targetStr);
  // Get distance to Monday (0=Sun, 1=Mon, ..., 6=Sat)
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day; // If Sunday, go back 6 days
  
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const result = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    const currStr = formatLocalISODate(current);
    result.push({
      dateStr: currStr,
      weekday: getWeekdayFromDate(currStr),
      isCurrent: currStr === targetStr,
    });
  }
  return result;
}

/**
 * Generate calendar grid cells for a month view
 */
export interface MonthGridCell {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  weekday: DayOfWeek;
}

export function getMonthGrid(year: number, month: number): MonthGridCell[] {
  // month is 1-12
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  const totalDaysInMonth = lastDayOfMonth.getDate();
  const todayStr = getTodayDateString();

  const cells: MonthGridCell[] = [];
  
  // Starting day of week (Monday=1, ..., Sunday=0)
  const startDay = firstDayOfMonth.getDay();
  // We want Monday as index 0, Sunday as index 6
  const leadingDays = startDay === 0 ? 6 : startDay - 1;

  // Previous month trailing days
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
  for (let i = leadingDays - 1; i >= 0; i--) {
    const prevDate = new Date(year, month - 2, prevMonthLastDay - i);
    const dateStr = formatLocalISODate(prevDate);
    cells.push({
      dateStr,
      dayNumber: prevDate.getDate(),
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      weekday: getWeekdayFromDate(dateStr),
    });
  }

  // Current month days
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const currDate = new Date(year, month - 1, day);
    const dateStr = formatLocalISODate(currDate);
    cells.push({
      dateStr,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      weekday: getWeekdayFromDate(dateStr),
    });
  }

  // Trailing days to fill the final 7-day row
  const remainingDays = (7 - (cells.length % 7)) % 7;
  for (let day = 1; day <= remainingDays; day++) {
    const nextDate = new Date(year, month, day);
    const dateStr = formatLocalISODate(nextDate);
    cells.push({
      dateStr,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      weekday: getWeekdayFromDate(dateStr),
    });
  }

  return cells;
}
