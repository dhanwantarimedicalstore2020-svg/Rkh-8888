import {
  DailyRecord,
  DailyScorecard,
  DateTemporalState,
  PillarType,
  ScheduleItemInstance,
  ScorecardMetrics,
  TaskMetrics,
} from '../types';
import { getTodayDateString } from './dateUtils';

export const SCORECARD_KPI_KEYS: (keyof Omit<DailyScorecard, 'customReflection'>)[] = [
  'academics',
  'skills',
  'exercise',
  'mentalPractice',
  'ideaCapture',
  'whatsappBoundaries',
  'shutdownPrep',
];

export const KPI_LABELS: Record<keyof Omit<DailyScorecard, 'customReflection'>, string> = {
  academics: '1. Academic Mastery & Deep Work',
  skills: '2. English / Business Skill Acquisition',
  exercise: '3. Physical Conditioning & Movement',
  mentalPractice: '4. Mental Framing & Meditation',
  ideaCapture: '5. Daily 5-Min Idea Capture',
  whatsappBoundaries: '6. Digital & WhatsApp Windows',
  shutdownPrep: '7. Night Shutdown & Sleep Readiness',
};

/**
 * Calculate KPI Scorecard Metrics strictly adhering to the RKH 8888 7-Point Diagnostic Model.
 * NOT_APPLICABLE ('na') is excluded from the denominator so it never penalizes streaks or completion.
 */
export function calculateScorecardMetrics(scorecard?: DailyScorecard | null): ScorecardMetrics {
  if (!scorecard) {
    return {
      totalCount: 7,
      applicableCount: 7,
      completedCount: 0,
      skippedCount: 0,
      deferredCount: 0,
      pendingCount: 7,
      naCount: 0,
      percentage: 0,
    };
  }

  let applicableCount = 0;
  let completedCount = 0;
  let skippedCount = 0;
  let deferredCount = 0;
  let pendingCount = 0;
  let naCount = 0;

  for (const key of SCORECARD_KPI_KEYS) {
    const status = scorecard[key] || 'pending';
    if (status === 'na') {
      naCount++;
    } else {
      applicableCount++;
      if (status === 'completed') completedCount++;
      else if (status === 'skipped') skippedCount++;
      else if (status === 'deferred') deferredCount++;
      else if (status === 'pending') pendingCount++;
    }
  }

  const percentage =
    applicableCount === 0
      ? 100
      : Math.round((completedCount / applicableCount) * 1000) / 10; // e.g. 85.7% or 100.0%

  return {
    totalCount: SCORECARD_KPI_KEYS.length,
    applicableCount,
    completedCount,
    skippedCount,
    deferredCount,
    pendingCount,
    naCount,
    percentage,
  };
}

/**
 * Calculate Task Schedule Metrics strictly separated from KPI metrics.
 */
export function calculateTaskMetrics(items?: ScheduleItemInstance[] | null): TaskMetrics {
  const initialByPillar: Record<PillarType, { total: number; completed: number; percentage: number }> = {
    academics: { total: 0, completed: 0, percentage: 0 },
    health: { total: 0, completed: 0, percentage: 0 },
    skills: { total: 0, completed: 0, percentage: 0 },
    observation: { total: 0, completed: 0, percentage: 0 },
    entrepreneurship: { total: 0, completed: 0, percentage: 0 },
    review: { total: 0, completed: 0, percentage: 0 },
  };

  if (!items || items.length === 0) {
    return {
      totalCount: 0,
      applicableCount: 0,
      completedCount: 0,
      skippedCount: 0,
      deferredCount: 0,
      pendingCount: 0,
      naCount: 0,
      percentage: 0,
      byPillar: initialByPillar,
    };
  }

  let applicableCount = 0;
  let completedCount = 0;
  let skippedCount = 0;
  let deferredCount = 0;
  let pendingCount = 0;
  let naCount = 0;

  const pillarCounts: Record<PillarType, { applicable: number; completed: number }> = {
    academics: { applicable: 0, completed: 0 },
    health: { applicable: 0, completed: 0 },
    skills: { applicable: 0, completed: 0 },
    observation: { applicable: 0, completed: 0 },
    entrepreneurship: { applicable: 0, completed: 0 },
    review: { applicable: 0, completed: 0 },
  };

  for (const item of items) {
    const status = item.status || 'pending';
    const pillar = item.pillar;

    if (status === 'na') {
      naCount++;
    } else {
      applicableCount++;
      if (pillarCounts[pillar]) {
        pillarCounts[pillar].applicable++;
      }

      if (status === 'completed') {
        completedCount++;
        if (pillarCounts[pillar]) {
          pillarCounts[pillar].completed++;
        }
      } else if (status === 'skipped') {
        skippedCount++;
      } else if (status === 'deferred') {
        deferredCount++;
      } else if (status === 'pending') {
        pendingCount++;
      }
    }
  }

  const percentage =
    applicableCount === 0
      ? 100
      : Math.round((completedCount / applicableCount) * 1000) / 10;

  const byPillar: Record<PillarType, { total: number; completed: number; percentage: number }> = {
    academics: {
      total: pillarCounts.academics.applicable,
      completed: pillarCounts.academics.completed,
      percentage:
        pillarCounts.academics.applicable === 0
          ? 100
          : Math.round((pillarCounts.academics.completed / pillarCounts.academics.applicable) * 100),
    },
    health: {
      total: pillarCounts.health.applicable,
      completed: pillarCounts.health.completed,
      percentage:
        pillarCounts.health.applicable === 0
          ? 100
          : Math.round((pillarCounts.health.completed / pillarCounts.health.applicable) * 100),
    },
    skills: {
      total: pillarCounts.skills.applicable,
      completed: pillarCounts.skills.completed,
      percentage:
        pillarCounts.skills.applicable === 0
          ? 100
          : Math.round((pillarCounts.skills.completed / pillarCounts.skills.applicable) * 100),
    },
    observation: {
      total: pillarCounts.observation.applicable,
      completed: pillarCounts.observation.completed,
      percentage:
        pillarCounts.observation.applicable === 0
          ? 100
          : Math.round((pillarCounts.observation.completed / pillarCounts.observation.applicable) * 100),
    },
    entrepreneurship: {
      total: pillarCounts.entrepreneurship.applicable,
      completed: pillarCounts.entrepreneurship.completed,
      percentage:
        pillarCounts.entrepreneurship.applicable === 0
          ? 100
          : Math.round(
              (pillarCounts.entrepreneurship.completed / pillarCounts.entrepreneurship.applicable) * 100
            ),
    },
    review: {
      total: pillarCounts.review.applicable,
      completed: pillarCounts.review.completed,
      percentage:
        pillarCounts.review.applicable === 0
          ? 100
          : Math.round((pillarCounts.review.completed / pillarCounts.review.applicable) * 100),
    },
  };

  return {
    totalCount: items.length,
    applicableCount,
    completedCount,
    skippedCount,
    deferredCount,
    pendingCount,
    naCount,
    percentage,
    byPillar,
  };
}

/**
 * Determine temporal state of a date strictly obeying:
 * - Missing past record = NOT_TRACKED (never 0% failure)
 * - Future date = FUTURE_PLANNED (never failure)
 * - Today = IN_PROGRESS (never force failure prematurely)
 * - Tracked past date = RECORDED
 */
export function getDateTemporalState(
  dateStr: string,
  hasRecord: boolean,
  currentTodayStr: string = getTodayDateString()
): DateTemporalState {
  if (dateStr > currentTodayStr) {
    return 'FUTURE_PLANNED';
  }
  if (dateStr === currentTodayStr) {
    return 'IN_PROGRESS';
  }
  if (!hasRecord) {
    return 'NOT_TRACKED';
  }
  return 'RECORDED';
}

/**
 * Derive full daily record metrics synchronously without persisting stale derived values
 */
export function deriveDailyRecordMetrics(record: DailyRecord) {
  const scorecardMetrics = calculateScorecardMetrics(record.scorecard);
  const taskMetrics = calculateTaskMetrics(record.items);
  const temporalState = getDateTemporalState(record.date, true);

  return {
    scorecardMetrics,
    taskMetrics,
    temporalState,
    kpiPercentage: scorecardMetrics.percentage,
    taskPercentage: taskMetrics.percentage,
  };
}
