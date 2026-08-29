import {
  DailyRecord,
  DailyScorecard,
  DayOfWeek,
  OperatingMode,
  PillarType,
} from '../types';
import {
  formatReadableDate,
  formatShortDate,
  getISOWeek,
  getMonthInfo,
  getQuarterInfo,
  getTodayDateString,
  getWeekdayFromDate,
  offsetDays,
  parseLocalISODate,
} from '../utils/dateUtils';
import {
  calculateScorecardMetrics,
  calculateTaskMetrics,
  getDateTemporalState,
  KPI_LABELS,
  SCORECARD_KPI_KEYS,
} from '../utils/metricsUtils';
import { generateDatesInPeriod } from '../utils/periodUtils';

export type KPICategoryKey = keyof Omit<DailyScorecard, 'customReflection'>;

export interface CategoryMetric {
  key: KPICategoryKey;
  label: string;
  completed: number;
  applicable: number;
  percentage: number;
}

export interface DayPerformanceSummary {
  date: string;
  weekday: DayOfWeek;
  temporalState: 'RECORDED' | 'NOT_TRACKED' | 'IN_PROGRESS' | 'FUTURE_PLANNED';
  hasRecord: boolean;
  kpiPercentage: number;
  taskPercentage: number;
  kpisCompleted: number;
  kpisApplicable: number;
  tasksCompleted: number;
  tasksApplicable: number;
  mode: OperatingMode;
  isSuccessful: boolean;
}

export interface DailyAnalyticsResult {
  date: string;
  weekday: DayOfWeek;
  temporalState: 'RECORDED' | 'NOT_TRACKED' | 'IN_PROGRESS' | 'FUTURE_PLANNED';
  hasRecord: boolean;
  mode: OperatingMode;
  kpiScore: number;
  kpisCompleted: number;
  kpisApplicable: number;
  kpisSkipped: number;
  kpisDeferred: number;
  kpisPending: number;
  kpisNA: number;
  scheduleExecutionScore: number;
  tasksCompleted: number;
  tasksApplicable: number;
  tasksSkipped: number;
  tasksDeferred: number;
  tasksPending: number;
  tasksNA: number;
  categories: CategoryMetric[];
  pillarStats: Record<PillarType, { total: number; completed: number; percentage: number }>;
  isSuccessful: boolean;
  record?: DailyRecord;
}

export interface WeeklyAnalyticsResult {
  weekKey: string; // e.g. "2026-W35"
  weekNumber: number;
  year: number;
  startDate: string; // Monday
  endDate: string;   // Sunday
  dateRangeLabel: string;
  totalDays: 7;
  trackedDays: number;
  notTrackedDays: number;
  futureDays: number;
  inProgressDays: number;
  successfulDays: number;
  coveragePercentage: number;
  aggregateKpiPercentage: number; // (completed / applicable) * 100
  averageDailyKpiPercentage: number; // sum(daily %) / trackedDays
  scheduleExecutionPercentage: number;
  totalKpisCompleted: number;
  totalKpisApplicable: number;
  totalTasksCompleted: number;
  totalTasksApplicable: number;
  tasksSkipped: number;
  tasksDeferred: number;
  categories: CategoryMetric[];
  pillarStats: Record<PillarType, { total: number; completed: number; percentage: number }>;
  strongestCategory?: CategoryMetric;
  weakestCategory?: CategoryMetric;
  days: DayPerformanceSummary[];
  currentStreak: number;
  longestStreak: number;
  previousWeekComparison?: {
    prevWeekKey: string;
    prevKpiPercentage: number;
    kpiPercentageDelta: number; // percentage points (e.g. +7.0)
    prevSchedulePercentage: number;
    schedulePercentageDelta: number;
  };
  modeBreakdown: Record<OperatingMode, number>;
}

export interface MonthlyAnalyticsResult {
  monthKey: string; // e.g. "2026-08"
  monthNumber: number; // 1-12
  monthName: string;
  year: number;
  totalDaysInMonth: number;
  trackedDays: number;
  notTrackedDays: number;
  futureDays: number;
  inProgressDays: number;
  successfulDays: number;
  coveragePercentage: number;
  aggregateKpiPercentage: number;
  averageDailyKpiPercentage: number;
  scheduleExecutionPercentage: number;
  totalKpisCompleted: number;
  totalKpisApplicable: number;
  totalTasksCompleted: number;
  totalTasksApplicable: number;
  categories: CategoryMetric[];
  pillarStats: Record<PillarType, { total: number; completed: number; percentage: number }>;
  strongestCategory?: CategoryMetric;
  weakestCategory?: CategoryMetric;
  bestDay?: { date: string; score: number; weekday: DayOfWeek };
  weakestDay?: { date: string; score: number; weekday: DayOfWeek };
  currentStreak: number;
  longestStreak: number;
  weeklyBreakdown: { weekKey: string; weekLabel: string; score: number; trackedDays: number }[];
  days: DayPerformanceSummary[];
  previousMonthComparison?: {
    prevMonthKey: string;
    prevMonthName: string;
    prevKpiPercentage: number;
    kpiPercentageDelta: number; // percentage points
    mostImprovedCategory?: { label: string; delta: number };
    mostDeclinedCategory?: { label: string; delta: number };
  };
  modeBreakdown: Record<OperatingMode, number>;
}

export interface QuarterlyAnalyticsResult {
  quarterKey: string; // e.g. "2026-Q3"
  quarterNumber: number; // 1-4
  year: number;
  label: string;
  monthsRange: string;
  totalDaysInQuarter: number;
  trackedDays: number;
  notTrackedDays: number;
  futureDays: number;
  inProgressDays: number;
  successfulDays: number;
  coveragePercentage: number;
  aggregateKpiPercentage: number;
  averageDailyKpiPercentage: number;
  scheduleExecutionPercentage: number;
  totalKpisCompleted: number;
  totalKpisApplicable: number;
  totalTasksCompleted: number;
  totalTasksApplicable: number;
  categories: CategoryMetric[];
  pillarStats: Record<PillarType, { total: number; completed: number; percentage: number }>;
  strongestCategory?: CategoryMetric;
  weakestCategory?: CategoryMetric;
  bestMonth?: { monthName: string; score: number };
  weakestMonth?: { monthName: string; score: number };
  monthlyProgression: { monthKey: string; monthName: string; score: number; trackedDays: number }[];
  previousQuarterComparison?: {
    prevQuarterKey: string;
    prevKpiPercentage: number;
    kpiPercentageDelta: number;
  };
  modeBreakdown: Record<OperatingMode, number>;
}

export interface AnnualAnalyticsResult {
  year: number;
  yearKey: string; // e.g. "2026"
  totalDaysInYear: number;
  trackedDays: number;
  notTrackedDays: number;
  futureDays: number;
  inProgressDays: number;
  successfulDays: number;
  coveragePercentage: number;
  aggregateKpiPercentage: number;
  averageDailyKpiPercentage: number;
  scheduleExecutionPercentage: number;
  totalKpisCompleted: number;
  totalKpisApplicable: number;
  totalTasksCompleted: number;
  totalTasksApplicable: number;
  tasksDeferred: number;
  tasksSkipped: number;
  categories: CategoryMetric[];
  pillarStats: Record<PillarType, { total: number; completed: number; percentage: number }>;
  strongestCategory?: CategoryMetric;
  weakestCategory?: CategoryMetric;
  bestQuarter?: { quarterLabel: string; score: number };
  weakestQuarter?: { quarterLabel: string; score: number };
  bestMonth?: { monthName: string; score: number };
  weakestMonth?: { monthName: string; score: number };
  currentStreak: number;
  longestStreak: number;
  monthlyProgression: { monthNumber: number; monthKey: string; monthName: string; score: number; trackedDays: number }[];
  quarterlyProgression: { quarterNumber: number; quarterKey: string; label: string; score: number; trackedDays: number }[];
  modeBreakdown: Record<OperatingMode, number>;
  previousYearComparison?: {
    prevYear: number;
    prevKpiPercentage: number;
    kpiPercentageDelta: number;
  };
}

/**
 * Calculate Streaks (Current Streak & Longest Streak) across all records.
 * Default success threshold is 70% or above.
 * Respects Minimum Day & Exam Mode where applicable metrics count.
 * Missing days break streaks.
 * Future dates and today in-progress (if pending) do not penalize.
 */
export function calculateStreaks(
  allRecords: Record<string, DailyRecord>,
  targetDateStr: string = getTodayDateString(),
  successThreshold: number = 70
): { currentStreak: number; longestStreak: number; successfulDaysTotal: number } {
  // Sort all existing dates ascending
  const allRecordedDates = Object.keys(allRecords).sort();
  if (allRecordedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, successfulDaysTotal: 0 };
  }

  const todayStr = getTodayDateString();

  // 1. Calculate Longest Streak in full history
  let longestStreak = 0;
  let runningStreak = 0;
  let successfulDaysTotal = 0;

  const minDateStr = allRecordedDates[0];
  const maxDateStr = targetDateStr > todayStr ? todayStr : targetDateStr;

  let iterDateStr = minDateStr;
  while (iterDateStr <= maxDateStr) {
    const rec = allRecords[iterDateStr];
    if (rec) {
      const kpiMetrics = calculateScorecardMetrics(rec.scorecard);
      const isSuccess = kpiMetrics.percentage >= successThreshold;
      if (isSuccess) {
        runningStreak++;
        successfulDaysTotal++;
        if (runningStreak > longestStreak) {
          longestStreak = runningStreak;
        }
      } else {
        runningStreak = 0;
      }
    } else {
      // Untracked day resets streak
      if (iterDateStr !== todayStr) {
        runningStreak = 0;
      }
    }
    iterDateStr = offsetDays(iterDateStr, 1);
  }

  // 2. Calculate Current Streak backwards from targetDateStr
  let currentStreak = 0;
  let checkDateStr = targetDateStr;

  // If targetDateStr is today and today is in-progress with < threshold, check if yesterday was successful
  const todayRec = allRecords[todayStr];
  const todayMetrics = todayRec ? calculateScorecardMetrics(todayRec.scorecard) : null;
  const isTodaySuccessful = todayMetrics ? todayMetrics.percentage >= successThreshold : false;

  if (targetDateStr === todayStr && !isTodaySuccessful) {
    // Today hasn't hit threshold yet (in-progress), so current streak counts back from yesterday
    checkDateStr = offsetDays(todayStr, -1);
  }

  while (true) {
    const rec = allRecords[checkDateStr];
    if (!rec) break;
    const metrics = calculateScorecardMetrics(rec.scorecard);
    if (metrics.percentage >= successThreshold) {
      currentStreak++;
      checkDateStr = offsetDays(checkDateStr, -1);
    } else {
      break;
    }
  }

  // If today is already successful, add 1 to the current streak
  if (targetDateStr === todayStr && isTodaySuccessful && checkDateStr !== todayStr) {
    // Already counted in the loop if checkDateStr started at todayStr
  }

  return { currentStreak, longestStreak, successfulDaysTotal };
}

/**
 * Calculate Daily Analytics
 */
export function getDailyAnalytics(
  allRecords: Record<string, DailyRecord>,
  dateStr: string,
  successThreshold: number = 70
): DailyAnalyticsResult {
  const record = allRecords[dateStr];
  const hasRecord = !!record;
  const temporalState = getDateTemporalState(dateStr, hasRecord);
  const weekday = getWeekdayFromDate(dateStr);
  const mode: OperatingMode = record?.mode || 'normal';

  const kpiMetrics = calculateScorecardMetrics(record?.scorecard);
  const taskMetrics = calculateTaskMetrics(record?.items);
  const isSuccessful = hasRecord && kpiMetrics.percentage >= successThreshold;

  // Calculate 7 categories
  const categories: CategoryMetric[] = SCORECARD_KPI_KEYS.map((key) => {
    const status = record?.scorecard ? record.scorecard[key] : 'pending';
    const isNA = status === 'na';
    const completed = status === 'completed' ? 1 : 0;
    const applicable = isNA ? 0 : 1;
    const percentage = applicable === 0 ? 100 : completed * 100;
    return {
      key,
      label: KPI_LABELS[key],
      completed,
      applicable,
      percentage,
    };
  });

  return {
    date: dateStr,
    weekday,
    temporalState,
    hasRecord,
    mode,
    kpiScore: hasRecord ? kpiMetrics.percentage : 0,
    kpisCompleted: kpiMetrics.completedCount,
    kpisApplicable: kpiMetrics.applicableCount,
    kpisSkipped: kpiMetrics.skippedCount,
    kpisDeferred: kpiMetrics.deferredCount,
    kpisPending: kpiMetrics.pendingCount,
    kpisNA: kpiMetrics.naCount,
    scheduleExecutionScore: hasRecord ? taskMetrics.percentage : 0,
    tasksCompleted: taskMetrics.completedCount,
    tasksApplicable: taskMetrics.applicableCount,
    tasksSkipped: taskMetrics.skippedCount,
    tasksDeferred: taskMetrics.deferredCount,
    tasksPending: taskMetrics.pendingCount,
    tasksNA: taskMetrics.naCount,
    categories,
    pillarStats: taskMetrics.byPillar,
    isSuccessful,
    record,
  };
}

/**
 * Calculate Weekly Analytics
 */
export function getWeeklyAnalytics(
  allRecords: Record<string, DailyRecord>,
  anchorDateStr: string,
  successThreshold: number = 70
): WeeklyAnalyticsResult {
  const dates = generateDatesInPeriod('week', anchorDateStr);
  const startDate = dates[0];
  const endDate = dates[6];
  const { weekNumber, year } = getISOWeek(anchorDateStr);
  const weekKey = `${year}-W${String(weekNumber).padStart(2, '0')}`;
  const dateRangeLabel = `${formatShortDate(startDate)} – ${formatShortDate(endDate)}, ${year}`;

  let trackedDays = 0;
  let notTrackedDays = 0;
  let futureDays = 0;
  let inProgressDays = 0;
  let successfulDays = 0;

  let totalKpisCompleted = 0;
  let totalKpisApplicable = 0;
  let totalTasksCompleted = 0;
  let totalTasksApplicable = 0;
  let tasksSkipped = 0;
  let tasksDeferred = 0;
  let sumDailyKpiPercentages = 0;

  const categoryTotals: Record<KPICategoryKey, { completed: number; applicable: number }> = {
    academics: { completed: 0, applicable: 0 },
    skills: { completed: 0, applicable: 0 },
    exercise: { completed: 0, applicable: 0 },
    mentalPractice: { completed: 0, applicable: 0 },
    ideaCapture: { completed: 0, applicable: 0 },
    whatsappBoundaries: { completed: 0, applicable: 0 },
    shutdownPrep: { completed: 0, applicable: 0 },
  };

  const pillarTotals: Record<PillarType, { completed: number; total: number }> = {
    academics: { completed: 0, total: 0 },
    health: { completed: 0, total: 0 },
    skills: { completed: 0, total: 0 },
    observation: { completed: 0, total: 0 },
    entrepreneurship: { completed: 0, total: 0 },
    review: { completed: 0, total: 0 },
  };

  const modeBreakdown: Record<OperatingMode, number> = {
    normal: 0,
    minimum_day: 0,
    exam_mode: 0,
  };

  const days: DayPerformanceSummary[] = dates.map((dStr) => {
    const rec = allRecords[dStr];
    const hasRecord = !!rec;
    const temporal = getDateTemporalState(dStr, hasRecord);
    const weekday = getWeekdayFromDate(dStr);
    const mode: OperatingMode = rec?.mode || 'normal';

    let kpiPct = 0;
    let taskPct = 0;
    let kpisComp = 0;
    let kpisApp = 0;
    let tasksComp = 0;
    let tasksApp = 0;
    let isSuccess = false;

    if (temporal === 'FUTURE_PLANNED') {
      futureDays++;
    } else if (temporal === 'NOT_TRACKED') {
      notTrackedDays++;
    } else {
      if (temporal === 'IN_PROGRESS') inProgressDays++;
      if (hasRecord) {
        trackedDays++;
        modeBreakdown[mode] = (modeBreakdown[mode] || 0) + 1;
        const kpi = calculateScorecardMetrics(rec.scorecard);
        const task = calculateTaskMetrics(rec.items);

        kpiPct = kpi.percentage;
        taskPct = task.percentage;
        kpisComp = kpi.completedCount;
        kpisApp = kpi.applicableCount;
        tasksComp = task.completedCount;
        tasksApp = task.applicableCount;

        totalKpisCompleted += kpisComp;
        totalKpisApplicable += kpisApp;
        totalTasksCompleted += tasksComp;
        totalTasksApplicable += tasksApp;
        tasksSkipped += task.skippedCount;
        tasksDeferred += task.deferredCount;
        sumDailyKpiPercentages += kpiPct;

        isSuccess = kpiPct >= successThreshold;
        if (isSuccess) successfulDays++;

        // Category breakdown
        SCORECARD_KPI_KEYS.forEach((key) => {
          const st = rec.scorecard[key];
          if (st !== 'na') {
            categoryTotals[key].applicable++;
            if (st === 'completed') categoryTotals[key].completed++;
          }
        });

        // Pillar breakdown
        Object.keys(task.byPillar).forEach((pKey) => {
          const p = pKey as PillarType;
          pillarTotals[p].total += task.byPillar[p].total;
          pillarTotals[p].completed += task.byPillar[p].completed;
        });
      }
    }

    return {
      date: dStr,
      weekday,
      temporalState: temporal,
      hasRecord,
      kpiPercentage: kpiPct,
      taskPercentage: taskPct,
      kpisCompleted: kpisComp,
      kpisApplicable: kpisApp,
      tasksCompleted: tasksComp,
      tasksApplicable: tasksApp,
      mode,
      isSuccessful: isSuccess,
    };
  });

  const aggregateKpiPercentage =
    totalKpisApplicable === 0
      ? 0
      : Math.round((totalKpisCompleted / totalKpisApplicable) * 1000) / 10;

  const averageDailyKpiPercentage =
    trackedDays === 0
      ? 0
      : Math.round((sumDailyKpiPercentages / trackedDays) * 10) / 10;

  const scheduleExecutionPercentage =
    totalTasksApplicable === 0
      ? 0
      : Math.round((totalTasksCompleted / totalTasksApplicable) * 1000) / 10;

  const coveragePercentage = Math.round((trackedDays / 7) * 100);

  // Build categories with stats
  const categories: CategoryMetric[] = SCORECARD_KPI_KEYS.map((key) => {
    const comp = categoryTotals[key].completed;
    const app = categoryTotals[key].applicable;
    const pct = app === 0 ? 0 : Math.round((comp / app) * 100);
    return {
      key,
      label: KPI_LABELS[key],
      completed: comp,
      applicable: app,
      percentage: pct,
    };
  });

  const applicableCategories = categories.filter((c) => c.applicable > 0);
  applicableCategories.sort((a, b) => b.percentage - a.percentage);
  const strongestCategory = applicableCategories[0];
  const weakestCategory = applicableCategories[applicableCategories.length - 1];

  const pillarStats: Record<PillarType, { total: number; completed: number; percentage: number }> = {
    academics: {
      total: pillarTotals.academics.total,
      completed: pillarTotals.academics.completed,
      percentage: pillarTotals.academics.total === 0 ? 0 : Math.round((pillarTotals.academics.completed / pillarTotals.academics.total) * 100),
    },
    health: {
      total: pillarTotals.health.total,
      completed: pillarTotals.health.completed,
      percentage: pillarTotals.health.total === 0 ? 0 : Math.round((pillarTotals.health.completed / pillarTotals.health.total) * 100),
    },
    skills: {
      total: pillarTotals.skills.total,
      completed: pillarTotals.skills.completed,
      percentage: pillarTotals.skills.total === 0 ? 0 : Math.round((pillarTotals.skills.completed / pillarTotals.skills.total) * 100),
    },
    observation: {
      total: pillarTotals.observation.total,
      completed: pillarTotals.observation.completed,
      percentage: pillarTotals.observation.total === 0 ? 0 : Math.round((pillarTotals.observation.completed / pillarTotals.observation.total) * 100),
    },
    entrepreneurship: {
      total: pillarTotals.entrepreneurship.total,
      completed: pillarTotals.entrepreneurship.completed,
      percentage: pillarTotals.entrepreneurship.total === 0 ? 0 : Math.round((pillarTotals.entrepreneurship.completed / pillarTotals.entrepreneurship.total) * 100),
    },
    review: {
      total: pillarTotals.review.total,
      completed: pillarTotals.review.completed,
      percentage: pillarTotals.review.total === 0 ? 0 : Math.round((pillarTotals.review.completed / pillarTotals.review.total) * 100),
    },
  };

  const { currentStreak, longestStreak } = calculateStreaks(allRecords, anchorDateStr, successThreshold);

  // Previous week comparison
  const prevWeekAnchor = offsetDays(startDate, -7);
  const prevWeekDates = generateDatesInPeriod('week', prevWeekAnchor);
  let prevKpisCompleted = 0;
  let prevKpisApplicable = 0;
  let prevTasksCompleted = 0;
  let prevTasksApplicable = 0;
  let prevTracked = 0;

  prevWeekDates.forEach((dStr) => {
    const rec = allRecords[dStr];
    if (rec) {
      prevTracked++;
      const kpi = calculateScorecardMetrics(rec.scorecard);
      const task = calculateTaskMetrics(rec.items);
      prevKpisCompleted += kpi.completedCount;
      prevKpisApplicable += kpi.applicableCount;
      prevTasksCompleted += task.completedCount;
      prevTasksApplicable += task.applicableCount;
    }
  });

  const prevKpiPercentage =
    prevKpisApplicable === 0 ? 0 : Math.round((prevKpisCompleted / prevKpisApplicable) * 1000) / 10;
  const prevSchedulePercentage =
    prevTasksApplicable === 0 ? 0 : Math.round((prevTasksCompleted / prevTasksApplicable) * 1000) / 10;

  const previousWeekComparison =
    prevTracked > 0
      ? {
          prevWeekKey: `${getISOWeek(prevWeekAnchor).year}-W${String(getISOWeek(prevWeekAnchor).weekNumber).padStart(2, '0')}`,
          prevKpiPercentage,
          kpiPercentageDelta: Math.round((aggregateKpiPercentage - prevKpiPercentage) * 10) / 10,
          prevSchedulePercentage,
          schedulePercentageDelta: Math.round((scheduleExecutionPercentage - prevSchedulePercentage) * 10) / 10,
        }
      : undefined;

  return {
    weekKey,
    weekNumber,
    year,
    startDate,
    endDate,
    dateRangeLabel,
    totalDays: 7,
    trackedDays,
    notTrackedDays,
    futureDays,
    inProgressDays,
    successfulDays,
    coveragePercentage,
    aggregateKpiPercentage,
    averageDailyKpiPercentage,
    scheduleExecutionPercentage,
    totalKpisCompleted,
    totalKpisApplicable,
    totalTasksCompleted,
    totalTasksApplicable,
    tasksSkipped,
    tasksDeferred,
    categories,
    pillarStats,
    strongestCategory,
    weakestCategory,
    days,
    currentStreak,
    longestStreak,
    previousWeekComparison,
    modeBreakdown,
  };
}

/**
 * Calculate Monthly Analytics
 */
export function getMonthlyAnalytics(
  allRecords: Record<string, DailyRecord>,
  year: number,
  month: number, // 1-12
  successThreshold: number = 70
): MonthlyAnalyticsResult {
  const monthInfo = getMonthInfo(`${year}-${String(month).padStart(2, '0')}-01`);
  const dates = generateDatesInPeriod('month', `${year}-${String(month).padStart(2, '0')}-01`);
  const totalDaysInMonth = dates.length;
  const monthKey = monthInfo.label; // "YYYY-MM"

  let trackedDays = 0;
  let notTrackedDays = 0;
  let futureDays = 0;
  let inProgressDays = 0;
  let successfulDays = 0;

  let totalKpisCompleted = 0;
  let totalKpisApplicable = 0;
  let totalTasksCompleted = 0;
  let totalTasksApplicable = 0;
  let sumDailyKpiPercentages = 0;

  let bestDay: { date: string; score: number; weekday: DayOfWeek } | undefined;
  let weakestDay: { date: string; score: number; weekday: DayOfWeek } | undefined;

  const categoryTotals: Record<KPICategoryKey, { completed: number; applicable: number }> = {
    academics: { completed: 0, applicable: 0 },
    skills: { completed: 0, applicable: 0 },
    exercise: { completed: 0, applicable: 0 },
    mentalPractice: { completed: 0, applicable: 0 },
    ideaCapture: { completed: 0, applicable: 0 },
    whatsappBoundaries: { completed: 0, applicable: 0 },
    shutdownPrep: { completed: 0, applicable: 0 },
  };

  const pillarTotals: Record<PillarType, { completed: number; total: number }> = {
    academics: { completed: 0, total: 0 },
    health: { completed: 0, total: 0 },
    skills: { completed: 0, total: 0 },
    observation: { completed: 0, total: 0 },
    entrepreneurship: { completed: 0, total: 0 },
    review: { completed: 0, total: 0 },
  };

  const modeBreakdown: Record<OperatingMode, number> = {
    normal: 0,
    minimum_day: 0,
    exam_mode: 0,
  };

  // Group by ISO weeks for breakdown
  const weeksMap: Record<string, { weekLabel: string; completed: number; applicable: number; trackedDays: number }> = {};

  const days: DayPerformanceSummary[] = dates.map((dStr) => {
    const rec = allRecords[dStr];
    const hasRecord = !!rec;
    const temporal = getDateTemporalState(dStr, hasRecord);
    const weekday = getWeekdayFromDate(dStr);
    const mode: OperatingMode = rec?.mode || 'normal';

    let kpiPct = 0;
    let taskPct = 0;
    let kpisComp = 0;
    let kpisApp = 0;
    let tasksComp = 0;
    let tasksApp = 0;
    let isSuccess = false;

    // ISO week tracking
    const { weekNumber, year: wYear } = getISOWeek(dStr);
    const wKey = `${wYear}-W${String(weekNumber).padStart(2, '0')}`;
    if (!weeksMap[wKey]) {
      weeksMap[wKey] = {
        weekLabel: `W${weekNumber}`,
        completed: 0,
        applicable: 0,
        trackedDays: 0,
      };
    }

    if (temporal === 'FUTURE_PLANNED') {
      futureDays++;
    } else if (temporal === 'NOT_TRACKED') {
      notTrackedDays++;
    } else {
      if (temporal === 'IN_PROGRESS') inProgressDays++;
      if (hasRecord) {
        trackedDays++;
        weeksMap[wKey].trackedDays++;
        modeBreakdown[mode] = (modeBreakdown[mode] || 0) + 1;
        const kpi = calculateScorecardMetrics(rec.scorecard);
        const task = calculateTaskMetrics(rec.items);

        kpiPct = kpi.percentage;
        taskPct = task.percentage;
        kpisComp = kpi.completedCount;
        kpisApp = kpi.applicableCount;
        tasksComp = task.completedCount;
        tasksApp = task.applicableCount;

        weeksMap[wKey].completed += kpisComp;
        weeksMap[wKey].applicable += kpisApp;

        totalKpisCompleted += kpisComp;
        totalKpisApplicable += kpisApp;
        totalTasksCompleted += tasksComp;
        totalTasksApplicable += tasksApp;
        sumDailyKpiPercentages += kpiPct;

        isSuccess = kpiPct >= successThreshold;
        if (isSuccess) successfulDays++;

        // Best and weakest recorded day
        if (!bestDay || kpiPct > bestDay.score) {
          bestDay = { date: dStr, score: kpiPct, weekday };
        }
        if (!weakestDay || kpiPct < weakestDay.score) {
          weakestDay = { date: dStr, score: kpiPct, weekday };
        }

        // Category breakdown
        SCORECARD_KPI_KEYS.forEach((key) => {
          const st = rec.scorecard[key];
          if (st !== 'na') {
            categoryTotals[key].applicable++;
            if (st === 'completed') categoryTotals[key].completed++;
          }
        });

        // Pillar breakdown
        Object.keys(task.byPillar).forEach((pKey) => {
          const p = pKey as PillarType;
          pillarTotals[p].total += task.byPillar[p].total;
          pillarTotals[p].completed += task.byPillar[p].completed;
        });
      }
    }

    return {
      date: dStr,
      weekday,
      temporalState: temporal,
      hasRecord,
      kpiPercentage: kpiPct,
      taskPercentage: taskPct,
      kpisCompleted: kpisComp,
      kpisApplicable: kpisApp,
      tasksCompleted: tasksComp,
      tasksApplicable: tasksApp,
      mode,
      isSuccessful: isSuccess,
    };
  });

  const aggregateKpiPercentage =
    totalKpisApplicable === 0
      ? 0
      : Math.round((totalKpisCompleted / totalKpisApplicable) * 1000) / 10;

  const averageDailyKpiPercentage =
    trackedDays === 0
      ? 0
      : Math.round((sumDailyKpiPercentages / trackedDays) * 10) / 10;

  const scheduleExecutionPercentage =
    totalTasksApplicable === 0
      ? 0
      : Math.round((totalTasksCompleted / totalTasksApplicable) * 1000) / 10;

  const coveragePercentage = Math.round((trackedDays / totalDaysInMonth) * 100);

  const categories: CategoryMetric[] = SCORECARD_KPI_KEYS.map((key) => {
    const comp = categoryTotals[key].completed;
    const app = categoryTotals[key].applicable;
    const pct = app === 0 ? 0 : Math.round((comp / app) * 100);
    return {
      key,
      label: KPI_LABELS[key],
      completed: comp,
      applicable: app,
      percentage: pct,
    };
  });

  const applicableCategories = categories.filter((c) => c.applicable > 0);
  applicableCategories.sort((a, b) => b.percentage - a.percentage);
  const strongestCategory = applicableCategories[0];
  const weakestCategory = applicableCategories[applicableCategories.length - 1];

  const pillarStats: Record<PillarType, { total: number; completed: number; percentage: number }> = {
    academics: {
      total: pillarTotals.academics.total,
      completed: pillarTotals.academics.completed,
      percentage: pillarTotals.academics.total === 0 ? 0 : Math.round((pillarTotals.academics.completed / pillarTotals.academics.total) * 100),
    },
    health: {
      total: pillarTotals.health.total,
      completed: pillarTotals.health.completed,
      percentage: pillarTotals.health.total === 0 ? 0 : Math.round((pillarTotals.health.completed / pillarTotals.health.total) * 100),
    },
    skills: {
      total: pillarTotals.skills.total,
      completed: pillarTotals.skills.completed,
      percentage: pillarTotals.skills.total === 0 ? 0 : Math.round((pillarTotals.skills.completed / pillarTotals.skills.total) * 100),
    },
    observation: {
      total: pillarTotals.observation.total,
      completed: pillarTotals.observation.completed,
      percentage: pillarTotals.observation.total === 0 ? 0 : Math.round((pillarTotals.observation.completed / pillarTotals.observation.total) * 100),
    },
    entrepreneurship: {
      total: pillarTotals.entrepreneurship.total,
      completed: pillarTotals.entrepreneurship.completed,
      percentage: pillarTotals.entrepreneurship.total === 0 ? 0 : Math.round((pillarTotals.entrepreneurship.completed / pillarTotals.entrepreneurship.total) * 100),
    },
    review: {
      total: pillarTotals.review.total,
      completed: pillarTotals.review.completed,
      percentage: pillarTotals.review.total === 0 ? 0 : Math.round((pillarTotals.review.completed / pillarTotals.review.total) * 100),
    },
  };

  const weeklyBreakdown = Object.entries(weeksMap).map(([wKey, val]) => ({
    weekKey: wKey,
    weekLabel: val.weekLabel,
    score: val.applicable === 0 ? 0 : Math.round((val.completed / val.applicable) * 100),
    trackedDays: val.trackedDays,
  }));

  const { currentStreak, longestStreak } = calculateStreaks(allRecords, `${year}-${String(month).padStart(2, '0')}-${String(totalDaysInMonth).padStart(2, '0')}`, successThreshold);

  // Previous Month comparison
  const prevMonthNum = month === 1 ? 12 : month - 1;
  const prevYearNum = month === 1 ? year - 1 : year;
  const prevMonthDates = generateDatesInPeriod('month', `${prevYearNum}-${String(prevMonthNum).padStart(2, '0')}-01`);
  const prevMonthInfo = getMonthInfo(`${prevYearNum}-${String(prevMonthNum).padStart(2, '0')}-01`);

  let prevComp = 0;
  let prevApp = 0;
  let prevTracked = 0;
  const prevCategoryTotals: Record<KPICategoryKey, { completed: number; applicable: number }> = {
    academics: { completed: 0, applicable: 0 },
    skills: { completed: 0, applicable: 0 },
    exercise: { completed: 0, applicable: 0 },
    mentalPractice: { completed: 0, applicable: 0 },
    ideaCapture: { completed: 0, applicable: 0 },
    whatsappBoundaries: { completed: 0, applicable: 0 },
    shutdownPrep: { completed: 0, applicable: 0 },
  };

  prevMonthDates.forEach((dStr) => {
    const rec = allRecords[dStr];
    if (rec) {
      prevTracked++;
      const kpi = calculateScorecardMetrics(rec.scorecard);
      prevComp += kpi.completedCount;
      prevApp += kpi.applicableCount;
      SCORECARD_KPI_KEYS.forEach((key) => {
        const st = rec.scorecard[key];
        if (st !== 'na') {
          prevCategoryTotals[key].applicable++;
          if (st === 'completed') prevCategoryTotals[key].completed++;
        }
      });
    }
  });

  const prevKpiPercentage = prevApp === 0 ? 0 : Math.round((prevComp / prevApp) * 1000) / 10;

  // Calculate category changes
  let mostImprovedCategory: { label: string; delta: number } | undefined;
  let mostDeclinedCategory: { label: string; delta: number } | undefined;

  if (prevTracked > 0) {
    SCORECARD_KPI_KEYS.forEach((k) => {
      const curCat = categories.find((c) => c.key === k);
      const prevCompCat = prevCategoryTotals[k].completed;
      const prevAppCat = prevCategoryTotals[k].applicable;
      const prevPct = prevAppCat === 0 ? 0 : Math.round((prevCompCat / prevAppCat) * 100);

      if (curCat && curCat.applicable > 0 && prevAppCat > 0) {
        const delta = curCat.percentage - prevPct;
        if (!mostImprovedCategory || delta > mostImprovedCategory.delta) {
          mostImprovedCategory = { label: curCat.label, delta };
        }
        if (!mostDeclinedCategory || delta < mostDeclinedCategory.delta) {
          mostDeclinedCategory = { label: curCat.label, delta };
        }
      }
    });
  }

  const previousMonthComparison =
    prevTracked > 0
      ? {
          prevMonthKey: prevMonthInfo.label,
          prevMonthName: prevMonthInfo.name,
          prevKpiPercentage,
          kpiPercentageDelta: Math.round((aggregateKpiPercentage - prevKpiPercentage) * 10) / 10,
          mostImprovedCategory: mostImprovedCategory && mostImprovedCategory.delta > 0 ? mostImprovedCategory : undefined,
          mostDeclinedCategory: mostDeclinedCategory && mostDeclinedCategory.delta < 0 ? mostDeclinedCategory : undefined,
        }
      : undefined;

  return {
    monthKey,
    monthNumber: month,
    monthName: monthInfo.name,
    year,
    totalDaysInMonth,
    trackedDays,
    notTrackedDays,
    futureDays,
    inProgressDays,
    successfulDays,
    coveragePercentage,
    aggregateKpiPercentage,
    averageDailyKpiPercentage,
    scheduleExecutionPercentage,
    totalKpisCompleted,
    totalKpisApplicable,
    totalTasksCompleted,
    totalTasksApplicable,
    categories,
    pillarStats,
    strongestCategory,
    weakestCategory,
    bestDay,
    weakestDay,
    currentStreak,
    longestStreak,
    weeklyBreakdown,
    days,
    previousMonthComparison,
    modeBreakdown,
  };
}

/**
 * Calculate Quarterly Analytics
 */
export function getQuarterlyAnalytics(
  allRecords: Record<string, DailyRecord>,
  year: number,
  quarter: number, // 1-4
  successThreshold: number = 70
): QuarterlyAnalyticsResult {
  const qDates = generateDatesInPeriod('quarter', `${year}-${String((quarter - 1) * 3 + 1).padStart(2, '0')}-01`);
  const qInfo = getQuarterInfo(`${year}-${String((quarter - 1) * 3 + 1).padStart(2, '0')}-01`);
  const quarterKey = qInfo.label; // e.g. "2026-Q3"
  const startMonth = (quarter - 1) * 3 + 1;
  const monthNames = ['January–March', 'April–June', 'July–September', 'October–December'];
  const monthsRange = `${monthNames[quarter - 1]} ${year}`;

  let trackedDays = 0;
  let notTrackedDays = 0;
  let futureDays = 0;
  let inProgressDays = 0;
  let successfulDays = 0;

  let totalKpisCompleted = 0;
  let totalKpisApplicable = 0;
  let totalTasksCompleted = 0;
  let totalTasksApplicable = 0;
  let sumDailyKpiPercentages = 0;

  const categoryTotals: Record<KPICategoryKey, { completed: number; applicable: number }> = {
    academics: { completed: 0, applicable: 0 },
    skills: { completed: 0, applicable: 0 },
    exercise: { completed: 0, applicable: 0 },
    mentalPractice: { completed: 0, applicable: 0 },
    ideaCapture: { completed: 0, applicable: 0 },
    whatsappBoundaries: { completed: 0, applicable: 0 },
    shutdownPrep: { completed: 0, applicable: 0 },
  };

  const pillarTotals: Record<PillarType, { completed: number; total: number }> = {
    academics: { completed: 0, total: 0 },
    health: { completed: 0, total: 0 },
    skills: { completed: 0, total: 0 },
    observation: { completed: 0, total: 0 },
    entrepreneurship: { completed: 0, total: 0 },
    review: { completed: 0, total: 0 },
  };

  const modeBreakdown: Record<OperatingMode, number> = {
    normal: 0,
    minimum_day: 0,
    exam_mode: 0,
  };

  // Month tracking inside quarter
  const monthlyProgression: { monthKey: string; monthName: string; score: number; trackedDays: number }[] = [];
  let bestMonth: { monthName: string; score: number } | undefined;
  let weakestMonth: { monthName: string; score: number } | undefined;

  for (let mOffset = 0; mOffset < 3; mOffset++) {
    const mNum = startMonth + mOffset;
    const mResult = getMonthlyAnalytics(allRecords, year, mNum, successThreshold);
    monthlyProgression.push({
      monthKey: mResult.monthKey,
      monthName: mResult.monthName,
      score: mResult.aggregateKpiPercentage,
      trackedDays: mResult.trackedDays,
    });

    if (mResult.trackedDays > 0) {
      if (!bestMonth || mResult.aggregateKpiPercentage > bestMonth.score) {
        bestMonth = { monthName: mResult.monthName, score: mResult.aggregateKpiPercentage };
      }
      if (!weakestMonth || mResult.aggregateKpiPercentage < weakestMonth.score) {
        weakestMonth = { monthName: mResult.monthName, score: mResult.aggregateKpiPercentage };
      }
    }
  }

  qDates.forEach((dStr) => {
    const rec = allRecords[dStr];
    const hasRecord = !rec ? false : true;
    const temporal = getDateTemporalState(dStr, hasRecord);
    const mode: OperatingMode = rec?.mode || 'normal';

    if (temporal === 'FUTURE_PLANNED') {
      futureDays++;
    } else if (temporal === 'NOT_TRACKED') {
      notTrackedDays++;
    } else {
      if (temporal === 'IN_PROGRESS') inProgressDays++;
      if (hasRecord) {
        trackedDays++;
        modeBreakdown[mode] = (modeBreakdown[mode] || 0) + 1;
        const kpi = calculateScorecardMetrics(rec.scorecard);
        const task = calculateTaskMetrics(rec.items);

        totalKpisCompleted += kpi.completedCount;
        totalKpisApplicable += kpi.applicableCount;
        totalTasksCompleted += task.completedCount;
        totalTasksApplicable += task.applicableCount;
        sumDailyKpiPercentages += kpi.percentage;

        if (kpi.percentage >= successThreshold) successfulDays++;

        SCORECARD_KPI_KEYS.forEach((key) => {
          const st = rec.scorecard[key];
          if (st !== 'na') {
            categoryTotals[key].applicable++;
            if (st === 'completed') categoryTotals[key].completed++;
          }
        });

        Object.keys(task.byPillar).forEach((pKey) => {
          const p = pKey as PillarType;
          pillarTotals[p].total += task.byPillar[p].total;
          pillarTotals[p].completed += task.byPillar[p].completed;
        });
      }
    }
  });

  const aggregateKpiPercentage =
    totalKpisApplicable === 0
      ? 0
      : Math.round((totalKpisCompleted / totalKpisApplicable) * 1000) / 10;

  const averageDailyKpiPercentage =
    trackedDays === 0
      ? 0
      : Math.round((sumDailyKpiPercentages / trackedDays) * 10) / 10;

  const scheduleExecutionPercentage =
    totalTasksApplicable === 0
      ? 0
      : Math.round((totalTasksCompleted / totalTasksApplicable) * 1000) / 10;

  const coveragePercentage = Math.round((trackedDays / qDates.length) * 100);

  const categories: CategoryMetric[] = SCORECARD_KPI_KEYS.map((key) => {
    const comp = categoryTotals[key].completed;
    const app = categoryTotals[key].applicable;
    const pct = app === 0 ? 0 : Math.round((comp / app) * 100);
    return {
      key,
      label: KPI_LABELS[key],
      completed: comp,
      applicable: app,
      percentage: pct,
    };
  });

  const applicableCategories = categories.filter((c) => c.applicable > 0);
  applicableCategories.sort((a, b) => b.percentage - a.percentage);
  const strongestCategory = applicableCategories[0];
  const weakestCategory = applicableCategories[applicableCategories.length - 1];

  const pillarStats: Record<PillarType, { total: number; completed: number; percentage: number }> = {
    academics: {
      total: pillarTotals.academics.total,
      completed: pillarTotals.academics.completed,
      percentage: pillarTotals.academics.total === 0 ? 0 : Math.round((pillarTotals.academics.completed / pillarTotals.academics.total) * 100),
    },
    health: {
      total: pillarTotals.health.total,
      completed: pillarTotals.health.completed,
      percentage: pillarTotals.health.total === 0 ? 0 : Math.round((pillarTotals.health.completed / pillarTotals.health.total) * 100),
    },
    skills: {
      total: pillarTotals.skills.total,
      completed: pillarTotals.skills.completed,
      percentage: pillarTotals.skills.total === 0 ? 0 : Math.round((pillarTotals.skills.completed / pillarTotals.skills.total) * 100),
    },
    observation: {
      total: pillarTotals.observation.total,
      completed: pillarTotals.observation.completed,
      percentage: pillarTotals.observation.total === 0 ? 0 : Math.round((pillarTotals.observation.completed / pillarTotals.observation.total) * 100),
    },
    entrepreneurship: {
      total: pillarTotals.entrepreneurship.total,
      completed: pillarTotals.entrepreneurship.completed,
      percentage: pillarTotals.entrepreneurship.total === 0 ? 0 : Math.round((pillarTotals.entrepreneurship.completed / pillarTotals.entrepreneurship.total) * 100),
    },
    review: {
      total: pillarTotals.review.total,
      completed: pillarTotals.review.completed,
      percentage: pillarTotals.review.total === 0 ? 0 : Math.round((pillarTotals.review.completed / pillarTotals.review.total) * 100),
    },
  };

  // Previous quarter comparison
  const prevQNum = quarter === 1 ? 4 : quarter - 1;
  const prevQYear = quarter === 1 ? year - 1 : year;
  const prevQResult = getQuarterlyAnalytics(allRecords, prevQYear, prevQNum, successThreshold);

  const previousQuarterComparison =
    prevQResult.trackedDays > 0
      ? {
          prevQuarterKey: prevQResult.quarterKey,
          prevKpiPercentage: prevQResult.aggregateKpiPercentage,
          kpiPercentageDelta: Math.round((aggregateKpiPercentage - prevQResult.aggregateKpiPercentage) * 10) / 10,
        }
      : undefined;

  return {
    quarterKey,
    quarterNumber: quarter,
    year,
    label: `Q${quarter} ${year}`,
    monthsRange,
    totalDaysInQuarter: qDates.length,
    trackedDays,
    notTrackedDays,
    futureDays,
    inProgressDays,
    successfulDays,
    coveragePercentage,
    aggregateKpiPercentage,
    averageDailyKpiPercentage,
    scheduleExecutionPercentage,
    totalKpisCompleted,
    totalKpisApplicable,
    totalTasksCompleted,
    totalTasksApplicable,
    categories,
    pillarStats,
    strongestCategory,
    weakestCategory,
    bestMonth,
    weakestMonth,
    monthlyProgression,
    previousQuarterComparison,
    modeBreakdown,
  };
}

/**
 * Calculate Annual Analytics
 */
export function getAnnualAnalytics(
  allRecords: Record<string, DailyRecord>,
  year: number,
  successThreshold: number = 70
): AnnualAnalyticsResult {
  const yDates = generateDatesInPeriod('year', `${year}-01-01`);
  const yearKey = String(year);

  let trackedDays = 0;
  let notTrackedDays = 0;
  let futureDays = 0;
  let inProgressDays = 0;
  let successfulDays = 0;

  let totalKpisCompleted = 0;
  let totalKpisApplicable = 0;
  let totalTasksCompleted = 0;
  let totalTasksApplicable = 0;
  let tasksDeferred = 0;
  let tasksSkipped = 0;
  let sumDailyKpiPercentages = 0;

  const categoryTotals: Record<KPICategoryKey, { completed: number; applicable: number }> = {
    academics: { completed: 0, applicable: 0 },
    skills: { completed: 0, applicable: 0 },
    exercise: { completed: 0, applicable: 0 },
    mentalPractice: { completed: 0, applicable: 0 },
    ideaCapture: { completed: 0, applicable: 0 },
    whatsappBoundaries: { completed: 0, applicable: 0 },
    shutdownPrep: { completed: 0, applicable: 0 },
  };

  const pillarTotals: Record<PillarType, { completed: number; total: number }> = {
    academics: { completed: 0, total: 0 },
    health: { completed: 0, total: 0 },
    skills: { completed: 0, total: 0 },
    observation: { completed: 0, total: 0 },
    entrepreneurship: { completed: 0, total: 0 },
    review: { completed: 0, total: 0 },
  };

  const modeBreakdown: Record<OperatingMode, number> = {
    normal: 0,
    minimum_day: 0,
    exam_mode: 0,
  };

  // Monthly progression (1-12)
  const monthlyProgression: { monthNumber: number; monthKey: string; monthName: string; score: number; trackedDays: number }[] = [];
  let bestMonth: { monthName: string; score: number } | undefined;
  let weakestMonth: { monthName: string; score: number } | undefined;

  for (let m = 1; m <= 12; m++) {
    const mRes = getMonthlyAnalytics(allRecords, year, m, successThreshold);
    monthlyProgression.push({
      monthNumber: m,
      monthKey: mRes.monthKey,
      monthName: mRes.monthName,
      score: mRes.aggregateKpiPercentage,
      trackedDays: mRes.trackedDays,
    });
    if (mRes.trackedDays > 0) {
      if (!bestMonth || mRes.aggregateKpiPercentage > bestMonth.score) {
        bestMonth = { monthName: mRes.monthName, score: mRes.aggregateKpiPercentage };
      }
      if (!weakestMonth || mRes.aggregateKpiPercentage < weakestMonth.score) {
        weakestMonth = { monthName: mRes.monthName, score: mRes.aggregateKpiPercentage };
      }
    }
  }

  // Quarterly progression (1-4)
  const quarterlyProgression: { quarterNumber: number; quarterKey: string; label: string; score: number; trackedDays: number }[] = [];
  let bestQuarter: { quarterLabel: string; score: number } | undefined;
  let weakestQuarter: { quarterLabel: string; score: number } | undefined;

  for (let q = 1; q <= 4; q++) {
    const qRes = getQuarterlyAnalytics(allRecords, year, q, successThreshold);
    quarterlyProgression.push({
      quarterNumber: q,
      quarterKey: qRes.quarterKey,
      label: qRes.label,
      score: qRes.aggregateKpiPercentage,
      trackedDays: qRes.trackedDays,
    });
    if (qRes.trackedDays > 0) {
      if (!bestQuarter || qRes.aggregateKpiPercentage > bestQuarter.score) {
        bestQuarter = { quarterLabel: qRes.label, score: qRes.aggregateKpiPercentage };
      }
      if (!weakestQuarter || qRes.aggregateKpiPercentage < weakestQuarter.score) {
        weakestQuarter = { quarterLabel: qRes.label, score: qRes.aggregateKpiPercentage };
      }
    }
  }

  yDates.forEach((dStr) => {
    const rec = allRecords[dStr];
    const hasRecord = !!rec;
    const temporal = getDateTemporalState(dStr, hasRecord);
    const mode: OperatingMode = rec?.mode || 'normal';

    if (temporal === 'FUTURE_PLANNED') {
      futureDays++;
    } else if (temporal === 'NOT_TRACKED') {
      notTrackedDays++;
    } else {
      if (temporal === 'IN_PROGRESS') inProgressDays++;
      if (hasRecord) {
        trackedDays++;
        modeBreakdown[mode] = (modeBreakdown[mode] || 0) + 1;
        const kpi = calculateScorecardMetrics(rec.scorecard);
        const task = calculateTaskMetrics(rec.items);

        totalKpisCompleted += kpi.completedCount;
        totalKpisApplicable += kpi.applicableCount;
        totalTasksCompleted += task.completedCount;
        totalTasksApplicable += task.applicableCount;
        tasksDeferred += task.deferredCount;
        tasksSkipped += task.skippedCount;
        sumDailyKpiPercentages += kpi.percentage;

        if (kpi.percentage >= successThreshold) successfulDays++;

        SCORECARD_KPI_KEYS.forEach((key) => {
          const st = rec.scorecard[key];
          if (st !== 'na') {
            categoryTotals[key].applicable++;
            if (st === 'completed') categoryTotals[key].completed++;
          }
        });

        Object.keys(task.byPillar).forEach((pKey) => {
          const p = pKey as PillarType;
          pillarTotals[p].total += task.byPillar[p].total;
          pillarTotals[p].completed += task.byPillar[p].completed;
        });
      }
    }
  });

  const aggregateKpiPercentage =
    totalKpisApplicable === 0
      ? 0
      : Math.round((totalKpisCompleted / totalKpisApplicable) * 1000) / 10;

  const averageDailyKpiPercentage =
    trackedDays === 0
      ? 0
      : Math.round((sumDailyKpiPercentages / trackedDays) * 10) / 10;

  const scheduleExecutionPercentage =
    totalTasksApplicable === 0
      ? 0
      : Math.round((totalTasksCompleted / totalTasksApplicable) * 1000) / 10;

  const coveragePercentage = Math.round((trackedDays / yDates.length) * 100);

  const categories: CategoryMetric[] = SCORECARD_KPI_KEYS.map((key) => {
    const comp = categoryTotals[key].completed;
    const app = categoryTotals[key].applicable;
    const pct = app === 0 ? 0 : Math.round((comp / app) * 100);
    return {
      key,
      label: KPI_LABELS[key],
      completed: comp,
      applicable: app,
      percentage: pct,
    };
  });

  const applicableCategories = categories.filter((c) => c.applicable > 0);
  applicableCategories.sort((a, b) => b.percentage - a.percentage);
  const strongestCategory = applicableCategories[0];
  const weakestCategory = applicableCategories[applicableCategories.length - 1];

  const pillarStats: Record<PillarType, { total: number; completed: number; percentage: number }> = {
    academics: {
      total: pillarTotals.academics.total,
      completed: pillarTotals.academics.completed,
      percentage: pillarTotals.academics.total === 0 ? 0 : Math.round((pillarTotals.academics.completed / pillarTotals.academics.total) * 100),
    },
    health: {
      total: pillarTotals.health.total,
      completed: pillarTotals.health.completed,
      percentage: pillarTotals.health.total === 0 ? 0 : Math.round((pillarTotals.health.completed / pillarTotals.health.total) * 100),
    },
    skills: {
      total: pillarTotals.skills.total,
      completed: pillarTotals.skills.completed,
      percentage: pillarTotals.skills.total === 0 ? 0 : Math.round((pillarTotals.skills.completed / pillarTotals.skills.total) * 100),
    },
    observation: {
      total: pillarTotals.observation.total,
      completed: pillarTotals.observation.completed,
      percentage: pillarTotals.observation.total === 0 ? 0 : Math.round((pillarTotals.observation.completed / pillarTotals.observation.total) * 100),
    },
    entrepreneurship: {
      total: pillarTotals.entrepreneurship.total,
      completed: pillarTotals.entrepreneurship.completed,
      percentage: pillarTotals.entrepreneurship.total === 0 ? 0 : Math.round((pillarTotals.entrepreneurship.completed / pillarTotals.entrepreneurship.total) * 100),
    },
    review: {
      total: pillarTotals.review.total,
      completed: pillarTotals.review.completed,
      percentage: pillarTotals.review.total === 0 ? 0 : Math.round((pillarTotals.review.completed / pillarTotals.review.total) * 100),
    },
  };

  const { currentStreak, longestStreak } = calculateStreaks(allRecords, `${year}-12-31`, successThreshold);

  // Previous year comparison
  const prevYearRes = getAnnualAnalytics(allRecords, year - 1, successThreshold);
  const previousYearComparison =
    prevYearRes.trackedDays > 0
      ? {
          prevYear: year - 1,
          prevKpiPercentage: prevYearRes.aggregateKpiPercentage,
          kpiPercentageDelta: Math.round((aggregateKpiPercentage - prevYearRes.aggregateKpiPercentage) * 10) / 10,
        }
      : undefined;

  return {
    year,
    yearKey,
    totalDaysInYear: yDates.length,
    trackedDays,
    notTrackedDays,
    futureDays,
    inProgressDays,
    successfulDays,
    coveragePercentage,
    aggregateKpiPercentage,
    averageDailyKpiPercentage,
    scheduleExecutionPercentage,
    totalKpisCompleted,
    totalKpisApplicable,
    totalTasksCompleted,
    totalTasksApplicable,
    tasksDeferred,
    tasksSkipped,
    categories,
    pillarStats,
    strongestCategory,
    weakestCategory,
    bestQuarter,
    weakestQuarter,
    bestMonth,
    weakestMonth,
    currentStreak,
    longestStreak,
    monthlyProgression,
    quarterlyProgression,
    modeBreakdown,
    previousYearComparison,
  };
}

/**
 * Generate personal rule-based diagnostic observations from real data.
 */
export function generateDiagnosticInsights(
  allRecords: Record<string, DailyRecord>,
  periodType: 'day' | 'week' | 'month' | 'quarter' | 'year',
  anchorDateStr: string
): string[] {
  const insights: string[] = [];
  const recordsCount = Object.keys(allRecords).length;

  if (recordsCount === 0) {
    return ['No recorded data available yet. Complete your daily scorecard to begin personal trend analysis.'];
  }

  if (periodType === 'day') {
    const daily = getDailyAnalytics(allRecords, anchorDateStr);
    if (!daily.hasRecord) {
      return ['No record exists for this date.'];
    }
    if (daily.temporalState === 'IN_PROGRESS') {
      insights.push(`Today is currently in progress with ${daily.kpisCompleted} of ${daily.kpisApplicable} applicable KPIs complete (${daily.kpiScore}%).`);
    } else {
      insights.push(`Recorded completion for ${formatReadableDate(anchorDateStr)} is ${daily.kpiScore}% (${daily.kpisCompleted}/${daily.kpisApplicable} KPIs).`);
    }
    if (daily.mode !== 'normal') {
      insights.push(`Operating under ${daily.mode === 'minimum_day' ? 'Minimum Day Protocol' : 'Exam Mode'}. Non-applicable items were exempted from score.`);
    }
    if (daily.scheduleExecutionScore > 0) {
      insights.push(`Detailed task schedule execution was ${daily.scheduleExecutionScore}% (${daily.tasksCompleted}/${daily.tasksApplicable} blocks).`);
    }
    return insights;
  }

  if (periodType === 'week') {
    const weekly = getWeeklyAnalytics(allRecords, anchorDateStr);
    if (weekly.trackedDays === 0) {
      return ['No records logged for this calendar week.'];
    }

    insights.push(`You completed ${weekly.aggregateKpiPercentage}% of applicable KPIs (${weekly.totalKpisCompleted}/${weekly.totalKpisApplicable}) across ${weekly.trackedDays} tracked days.`);

    if (weekly.strongestCategory && weekly.strongestCategory.percentage > 0) {
      insights.push(`Strongest focus area was ${weekly.strongestCategory.label.replace(/^\d+\.\s*/, '')} at ${weekly.strongestCategory.percentage}%.`);
    }

    if (weekly.weakestCategory && weekly.weakestCategory.percentage < 80) {
      insights.push(`Lowest completion area was ${weekly.weakestCategory.label.replace(/^\d+\.\s*/, '')} at ${weekly.weakestCategory.percentage}%.`);
    }

    if (weekly.previousWeekComparison) {
      const delta = weekly.previousWeekComparison.kpiPercentageDelta;
      const sign = delta > 0 ? '+' : '';
      insights.push(`Performance is ${sign}${delta} percentage points compared with the previous week (${weekly.previousWeekComparison.prevKpiPercentage}%).`);
    }

    if (weekly.currentStreak >= 3) {
      insights.push(`Active consistency streak is currently at ${weekly.currentStreak} days.`);
    }

    return insights;
  }

  if (periodType === 'month') {
    const d = parseLocalISODate(anchorDateStr);
    const monthly = getMonthlyAnalytics(allRecords, d.getFullYear(), d.getMonth() + 1);

    if (monthly.trackedDays === 0) {
      return ['No records logged for this calendar month.'];
    }

    insights.push(`Tracked ${monthly.trackedDays} of ${monthly.totalDaysInMonth} days (${monthly.coveragePercentage}% coverage) with ${monthly.aggregateKpiPercentage}% overall completion.`);

    if (monthly.bestDay) {
      insights.push(`Strongest day was ${monthly.bestDay.weekday}, ${formatShortDate(monthly.bestDay.date)} with ${monthly.bestDay.score}% completion.`);
    }

    if (monthly.previousMonthComparison) {
      const delta = monthly.previousMonthComparison.kpiPercentageDelta;
      const sign = delta > 0 ? '+' : '';
      insights.push(`Month-over-month trend changed by ${sign}${delta} percentage points vs ${monthly.previousMonthComparison.prevMonthName}.`);
      if (monthly.previousMonthComparison.mostImprovedCategory) {
        insights.push(`Most improved category: ${monthly.previousMonthComparison.mostImprovedCategory.label.replace(/^\d+\.\s*/, '')} (+${monthly.previousMonthComparison.mostImprovedCategory.delta} pts).`);
      }
    }

    return insights;
  }

  if (periodType === 'quarter') {
    const qInfo = getQuarterInfo(anchorDateStr);
    const quarterly = getQuarterlyAnalytics(allRecords, qInfo.year, qInfo.quarter);

    if (quarterly.trackedDays === 0) {
      return ['No records logged for this quarter.'];
    }

    insights.push(`Quarterly execution rate is ${quarterly.aggregateKpiPercentage}% across ${quarterly.trackedDays} logged days.`);
    if (quarterly.bestMonth) {
      insights.push(`Highest performing month in Q${quarterly.quarterNumber} was ${quarterly.bestMonth.monthName} (${quarterly.bestMonth.score}%).`);
    }
    return insights;
  }

  if (periodType === 'year') {
    const d = parseLocalISODate(anchorDateStr);
    const annual = getAnnualAnalytics(allRecords, d.getFullYear());

    if (annual.trackedDays === 0) {
      return ['No records logged for this calendar year.'];
    }

    insights.push(`Annual aggregate completion is ${annual.aggregateKpiPercentage}% with ${annual.trackedDays} total days tracked.`);
    if (annual.bestQuarter) {
      insights.push(`Strongest quarter was ${annual.bestQuarter.quarterLabel} with ${annual.bestQuarter.score}% completion.`);
    }
    if (annual.longestStreak > 0) {
      insights.push(`Longest sustained consistency streak reached ${annual.longestStreak} consecutive days.`);
    }
    return insights;
  }

  return insights;
}
