import { ScheduleItemInstance } from '../types';

/**
 * Get current local time as 'HH:mm' (24-hour format)
 */
export function getCurrentLocalTimeString(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Check if the given time (defaulting to now) falls within startTime and endTime.
 * Handles blocks spanning midnight (e.g. 23:30 to 05:00).
 */
export function isBlockActiveNow(startTime: string, endTime: string, nowStr?: string): boolean {
  const current = nowStr || getCurrentLocalTimeString();
  
  if (!startTime || !endTime) return false;

  // Case 1: Standard block during the same day (e.g. 06:15 to 07:00, 20:00 to 23:00)
  if (startTime <= endTime) {
    return current >= startTime && current < endTime;
  }

  // Case 2: Overnight block spanning midnight (e.g. 23:30 to 05:00)
  return current >= startTime || current < endTime;
}

/**
 * Format 24-hour time to friendly 12-hour AM/PM string
 */
export function formatTime12h(time24?: string | null): string {
  if (!time24 || typeof time24 !== 'string') return '';
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return time24;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes === 0 ? '' : `:${String(minutes).padStart(2, '0')}`;
  return `${displayHours}${displayMinutes} ${ampm}`;
}

/**
 * Find the currently active block or the closest upcoming block in a day's schedule
 */
export function getActiveOrUpcomingBlock(
  items: ScheduleItemInstance[],
  nowStr?: string
): {
  active?: ScheduleItemInstance;
  upcoming?: ScheduleItemInstance;
  activeIndex: number;
} {
  const current = nowStr || getCurrentLocalTimeString();
  if (!items || items.length === 0) {
    return { activeIndex: -1 };
  }

  // Check for active block
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (isBlockActiveNow(item.startTime, item.endTime, current)) {
      return {
        active: item,
        upcoming: items[i + 1],
        activeIndex: i,
      };
    }
  }

  // If no active block, find the next upcoming block
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.startTime > current) {
      return {
        upcoming: item,
        activeIndex: -1,
      };
    }
  }

  // If all blocks for the day have passed
  return {
    upcoming: undefined,
    activeIndex: -1,
  };
}
