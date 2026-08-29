import { DailyRecord } from '../types';
import {
  formatLocalISODate,
  getISOWeek,
  getMonthInfo,
  getQuarterInfo,
  parseLocalISODate,
} from './dateUtils';
import { calculateScorecardMetrics, calculateTaskMetrics, getDateTemporalState } from './metricsUtils';

export interface PeriodAnalyticsResult {
  periodType: 'week' | 'month' | 'quarter' | 'year';
  periodLabel: string;
  totalDaysInPeriod: number;
  trackedDaysCount: number;
  notTrackedDaysCount: number;
  futureDaysCount: number;
  inProgressDaysCount: number;
  averageKpiPercentage: number; // Derived strictly from actual tracked DailyRecords
  averageTaskPercentage: number; // Derived strictly from actual tracked DailyRecords
  totalTasksCompleted: number;
  totalTasksApplicable: number;
  totalKpisCompleted: number;
  totalKpisApplicable: number;
  modeBreakdown: {
    normal: number;
    minimum_day: number;
    exam_mode: number;
  };
  records: DailyRecord[];
}

/**
 * Extract ISO Week Key: e.g. "2026-W35"
 */
export function getWeekKey(dateStr: string): string {
  const { weekNumber, year } = getISOWeek(dateStr);
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

/**
 * Extract Month Key: strictly "YYYY-MM"
 */
export function getMonthKey(dateStr: string): string {
  const { label } = getMonthInfo(dateStr);
  return label;
}

/**
 * Extract Quarter Key: strictly "YYYY-Q1" | "YYYY-Q2" | "YYYY-Q3" | "YYYY-Q4"
 */
export function getQuarterKey(dateStr: string): string {
  const { label } = getQuarterInfo(dateStr);
  return label;
}

/**
 * Extract Year Key: strictly "YYYY"
 */
export function getYearKey(dateStr: string): string {
  const d = parseLocalISODate(dateStr);
  return String(d.getFullYear());
}

/**
 * Get all actual DailyRecords belonging to the ISO week of target date.
 * Excludes any synthetic or unmaterialized data.
 */
export function getRecordsForWeek(
  allRecords: Record<string, DailyRecord>,
  targetDateStr: string
): DailyRecord[] {
  const targetWeek = getISOWeek(targetDateStr);
  const matched: DailyRecord[] = [];

  for (const dateStr in allRecords) {
    if (!Object.prototype.hasOwnProperty.call(allRecords, dateStr)) continue;
    const w = getISOWeek(dateStr);
    if (w.year === targetWeek.year && w.weekNumber === targetWeek.weekNumber) {
      matched.push(allRecords[dateStr]);
    }
  }

  return matched.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get all actual DailyRecords belonging strictly to YYYY-MM.
 */
export function getRecordsForMonth(
  allRecords: Record<string, DailyRecord>,
  year: number,
  month: number // 1-12
): DailyRecord[] {
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const matched: DailyRecord[] = [];

  for (const dateStr in allRecords) {
    if (!Object.prototype.hasOwnProperty.call(allRecords, dateStr)) continue;
    if (dateStr.startsWith(monthPrefix)) {
      matched.push(allRecords[dateStr]);
    }
  }

  return matched.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get all actual DailyRecords belonging strictly to YYYY-Q[1-4].
 */
export function getRecordsForQuarter(
  allRecords: Record<string, DailyRecord>,
  year: number,
  quarter: number // 1-4
): DailyRecord[] {
  const matched: DailyRecord[] = [];

  for (const dateStr in allRecords) {
    if (!Object.prototype.hasOwnProperty.call(allRecords, dateStr)) continue;
    const qInfo = getQuarterInfo(dateStr);
    if (qInfo.year === year && qInfo.quarter === quarter) {
      matched.push(allRecords[dateStr]);
    }
  }

  return matched.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get all actual DailyRecords belonging strictly to YYYY.
 */
export function getRecordsForYear(
  allRecords: Record<string, DailyRecord>,
  year: number
): DailyRecord[] {
  const yearPrefix = `${year}-`;
  const matched: DailyRecord[] = [];

  for (const dateStr in allRecords) {
    if (!Object.prototype.hasOwnProperty.call(allRecords, dateStr)) continue;
    if (dateStr.startsWith(yearPrefix)) {
      matched.push(allRecords[dateStr]);
    }
  }

  return matched.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Generate all calendar date strings ('YYYY-MM-DD') for a given period.
 */
export function generateDatesInPeriod(
  periodType: 'week' | 'month' | 'quarter' | 'year',
  anchorDateStr: string
): string[] {
  const dates: string[] = [];
  const d = parseLocalISODate(anchorDateStr);

  if (periodType === 'week') {
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);

    for (let i = 0; i < 7; i++) {
      const curr = new Date(monday);
      curr.setDate(monday.getDate() + i);
      dates.push(formatLocalISODate(curr));
    }
  } else if (periodType === 'month') {
    const year = d.getFullYear();
    const month = d.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= lastDay; day++) {
      dates.push(formatLocalISODate(new Date(year, month, day)));
    }
  } else if (periodType === 'quarter') {
    const qInfo = getQuarterInfo(anchorDateStr);
    const startMonth = (qInfo.quarter - 1) * 3;
    for (let m = 0; m < 3; m++) {
      const currentMonth = startMonth + m;
      const lastDay = new Date(qInfo.year, currentMonth + 1, 0).getDate();
      for (let day = 1; day <= lastDay; day++) {
        dates.push(formatLocalISODate(new Date(qInfo.year, currentMonth, day)));
      }
    }
  } else if (periodType === 'year') {
    const year = d.getFullYear();
    // Check if leap year
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const daysInMonths = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    for (let m = 0; m < 12; m++) {
      for (let day = 1; day <= daysInMonths[m]; day++) {
        dates.push(formatLocalISODate(new Date(year, m, day)));
      }
    }
  }

  return dates;
}

/**
 * Compute aggregate period analytics strictly based on actual historical records.
 * Adheres strictly to:
 * - Missing days are NOT TRACKED (never 0% failures).
 * - Future days are FUTURE PLANNED (never failures).
 * - In progress days are flagged.
 */
export function calculatePeriodAnalytics(
  allRecords: Record<string, DailyRecord>,
  periodType: 'week' | 'month' | 'quarter' | 'year',
  anchorDateStr: string
): PeriodAnalyticsResult {
  const datesInPeriod = generateDatesInPeriod(periodType, anchorDateStr);
  const totalDaysInPeriod = datesInPeriod.length;

  let trackedDaysCount = 0;
  let notTrackedDaysCount = 0;
  let futureDaysCount = 0;
  let inProgressDaysCount = 0;

  let sumKpiPercentages = 0;
  let sumTaskPercentages = 0;

  let totalTasksCompleted = 0;
  let totalTasksApplicable = 0;
  let totalKpisCompleted = 0;
  let totalKpisApplicable = 0;

  const modeBreakdown = {
    normal: 0,
    minimum_day: 0,
    exam_mode: 0,
  };

  const periodRecords: DailyRecord[] = [];

  for (const dateStr of datesInPeriod) {
    const record = allRecords[dateStr];
    const temporal = getDateTemporalState(dateStr, !!record);

    if (temporal === 'FUTURE_PLANNED') {
      futureDaysCount++;
    } else if (temporal === 'IN_PROGRESS') {
      inProgressDaysCount++;
      if (record) {
        trackedDaysCount++;
        periodRecords.push(record);
        const mode = record.mode || 'normal';
        if (modeBreakdown[mode] !== undefined) {
          modeBreakdown[mode]++;
        } else {
          modeBreakdown.normal++;
        }

        const kpi = calculateScorecardMetrics(record.scorecard);
        const task = calculateTaskMetrics(record.items);

        sumKpiPercentages += kpi.percentage;
        sumTaskPercentages += task.percentage;

        totalKpisCompleted += kpi.completedCount;
        totalKpisApplicable += kpi.applicableCount;
        totalTasksCompleted += task.completedCount;
        totalTasksApplicable += task.applicableCount;
      }
    } else if (temporal === 'NOT_TRACKED') {
      notTrackedDaysCount++;
    } else if (temporal === 'RECORDED') {
      trackedDaysCount++;
      if (record) {
        periodRecords.push(record);
        const mode = record.mode || 'normal';
        if (modeBreakdown[mode] !== undefined) {
          modeBreakdown[mode]++;
        } else {
          modeBreakdown.normal++;
        }

        const kpi = calculateScorecardMetrics(record.scorecard);
        const task = calculateTaskMetrics(record.items);

        sumKpiPercentages += kpi.percentage;
        sumTaskPercentages += task.percentage;

        totalKpisCompleted += kpi.completedCount;
        totalKpisApplicable += kpi.applicableCount;
        totalTasksCompleted += task.completedCount;
        totalTasksApplicable += task.applicableCount;
      }
    }
  }

  const averageKpiPercentage =
    trackedDaysCount === 0
      ? 0
      : Math.round((sumKpiPercentages / trackedDaysCount) * 10) / 10;

  const averageTaskPercentage =
    trackedDaysCount === 0
      ? 0
      : Math.round((sumTaskPercentages / trackedDaysCount) * 10) / 10;

  let periodLabel = anchorDateStr;
  if (periodType === 'week') periodLabel = getWeekKey(anchorDateStr);
  else if (periodType === 'month') periodLabel = getMonthKey(anchorDateStr);
  else if (periodType === 'quarter') periodLabel = getQuarterKey(anchorDateStr);
  else if (periodType === 'year') periodLabel = getYearKey(anchorDateStr);

  return {
    periodType,
    periodLabel,
    totalDaysInPeriod,
    trackedDaysCount,
    notTrackedDaysCount,
    futureDaysCount,
    inProgressDaysCount,
    averageKpiPercentage,
    averageTaskPercentage,
    totalTasksCompleted,
    totalTasksApplicable,
    totalKpisCompleted,
    totalKpisApplicable,
    modeBreakdown,
    records: periodRecords,
  };
}
