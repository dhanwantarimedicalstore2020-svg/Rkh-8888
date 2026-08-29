import {
  DailyRecord,
  DailyScorecard,
  ItemStatus,
  OperatingMode,
  OperatingModeRange,
  ScheduleItemInstance,
  ScheduleItemTemplate,
} from '../types';
import { calculateScorecardMetrics } from '../utils/metricsUtils';

const STORAGE_KEYS = {
  MODE_RANGES: 'rkh8888_mode_ranges_v1',
};

/**
 * Load all stored operating mode ranges (e.g. Exam Mode windows)
 */
export function loadModeRanges(): OperatingModeRange[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MODE_RANGES);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load operating mode ranges:', e);
  }
  return [];
}

/**
 * Save operating mode ranges
 */
export function saveModeRanges(ranges: OperatingModeRange[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MODE_RANGES, JSON.stringify(ranges));
  } catch (e) {
    console.error('Failed to save operating mode ranges:', e);
  }
}

/**
 * Add or update an operating mode range (e.g. Exam Mode)
 */
export function setModeRange(
  rangeData: Omit<OperatingModeRange, 'id' | 'createdAt'> & { id?: string }
): OperatingModeRange {
  const ranges = loadModeRanges();
  const id = rangeData.id || `mode-range-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const fullRange: OperatingModeRange = {
    ...rangeData,
    id,
    createdAt: new Date().toISOString(),
  };

  const existingIdx = ranges.findIndex((r) => r.id === id);
  if (existingIdx >= 0) {
    ranges[existingIdx] = fullRange;
  } else {
    ranges.push(fullRange);
  }

  saveModeRanges(ranges);
  return fullRange;
}

/**
 * Delete a mode range
 */
export function deleteModeRange(id: string): void {
  const ranges = loadModeRanges().filter((r) => r.id !== id);
  saveModeRanges(ranges);
}

/**
 * Check if a date string falls inside any active OperatingModeRange
 */
export function getActiveModeForDate(dateStr: string): { mode: OperatingMode; range?: OperatingModeRange } {
  const ranges = loadModeRanges();
  for (const range of ranges) {
    if (dateStr >= range.startDate && dateStr <= range.endDate) {
      return { mode: range.mode, range };
    }
  }
  return { mode: 'normal' };
}

/**
 * Transform a DailyRecord into MINIMUM_DAY mode safely and non-destructively:
 * - Preserves full original task schedule in `originalItemsSnapshot` so it can be completely recovered.
 * - Non-essential items are set to 'na' (not applicable) so they don't penalize execution.
 * - Minimum day essentials (Academic Revision 10-20m, Essential Academic Work 20-30m, Movement 10-20m, Mental Reset 5m) remain active.
 * - Scorecard: Skills and IdeaCapture are exempt ('na').
 */
export function applyMinimumDayToRecord(record: DailyRecord): DailyRecord {
  // Capture snapshot of original standard items if not already saved
  const originalSnapshot: ScheduleItemTemplate[] =
    record.originalItemsSnapshot ||
    record.items.map((item) => ({
      id: item.id,
      startTime: item.startTime,
      endTime: item.endTime,
      timeRange: item.timeRange,
      title: item.title,
      subtitle: item.subtitle,
      pillar: item.pillar,
      isFixed: item.isFixed,
      essentialInMinDay: item.essentialInMinDay,
      protocolType: item.protocolType,
      defaultCategory: item.defaultCategory,
      notes: item.notes,
    }));

  // Adapt items for Minimum Day
  const adaptedItems: ScheduleItemInstance[] = record.items.map((item) => {
    // If not marked essential for Minimum Day, set to 'na' unless already completed
    if (!item.essentialInMinDay && item.status !== 'completed') {
      return { ...item, status: 'na' as ItemStatus };
    }
    return item;
  });

  // Adapt scorecard for Minimum Day (exempt non-essential pillars from denominator)
  const adaptedScorecard: DailyScorecard = {
    ...record.scorecard,
    skills: record.scorecard.skills === 'completed' ? 'completed' : 'na',
    ideaCapture: record.scorecard.ideaCapture === 'completed' ? 'completed' : 'na',
  };

  const metrics = calculateScorecardMetrics(adaptedScorecard);

  return {
    ...record,
    mode: 'minimum_day',
    items: adaptedItems,
    originalItemsSnapshot: originalSnapshot,
    scorecard: adaptedScorecard,
    scorePercentage: metrics.percentage,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Transform a DailyRecord into EXAM_MODE mode safely:
 * - Amplifies and isolates academic blocks and deep revision.
 * - Reduces business research and extra skills to 'na' or optional.
 * - Preserves sleep, nutrition, and basic conditioning.
 * - Preserves original schedule snapshot for recovery.
 */
export function applyExamModeToRecord(record: DailyRecord, rangeId?: string): DailyRecord {
  const originalSnapshot: ScheduleItemTemplate[] =
    record.originalItemsSnapshot ||
    record.items.map((item) => ({
      id: item.id,
      startTime: item.startTime,
      endTime: item.endTime,
      timeRange: item.timeRange,
      title: item.title,
      subtitle: item.subtitle,
      pillar: item.pillar,
      isFixed: item.isFixed,
      essentialInMinDay: item.essentialInMinDay,
      protocolType: item.protocolType,
      defaultCategory: item.defaultCategory,
      notes: item.notes,
    }));

  const adaptedItems: ScheduleItemInstance[] = record.items.map((item) => {
    // In Exam Mode, non-academic and non-health discretionary items are made optional / na
    if (
      (item.pillar === 'entrepreneurship' || item.pillar === 'observation') &&
      item.status !== 'completed'
    ) {
      return { ...item, status: 'na' as ItemStatus };
    }
    return item;
  });

  const adaptedScorecard: DailyScorecard = {
    ...record.scorecard,
    ideaCapture: record.scorecard.ideaCapture === 'completed' ? 'completed' : 'na',
  };

  const metrics = calculateScorecardMetrics(adaptedScorecard);

  return {
    ...record,
    mode: 'exam_mode',
    modeRangeId: rangeId,
    items: adaptedItems,
    originalItemsSnapshot: originalSnapshot,
    scorecard: adaptedScorecard,
    scorePercentage: metrics.percentage,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Restore a DailyRecord back to STANDARD / NORMAL mode cleanly from snapshot:
 * - Restores original items without losing any completed logs or user notes.
 */
export function restoreNormalModeRecord(record: DailyRecord): DailyRecord {
  const snapshot = record.originalItemsSnapshot;

  let restoredItems: ScheduleItemInstance[] = record.items;
  if (snapshot && snapshot.length > 0) {
    restoredItems = snapshot.map((orig) => {
      // Find existing item state if available
      const existing = record.items.find((it) => it.id === orig.id);
      if (existing) {
        // If it was 'na' only due to mode, restore to pending (unless user completed it)
        const status = existing.status === 'na' ? 'pending' : existing.status;
        return {
          ...orig,
          status,
          userNotes: existing.userNotes,
          actualDurationMinutes: existing.actualDurationMinutes,
          actualCategoryUsed: existing.actualCategoryUsed,
          loggedAt: existing.loggedAt,
        };
      }
      return {
        ...orig,
        status: 'pending' as ItemStatus,
      };
    });
  } else {
    // If no snapshot, convert any 'na' items back to pending
    restoredItems = record.items.map((it) => ({
      ...it,
      status: it.status === 'na' ? 'pending' : it.status,
    }));
  }

  // Restore scorecard
  const restoredScorecard: DailyScorecard = {
    academics: record.scorecard.academics === 'na' ? 'pending' : record.scorecard.academics,
    skills: record.scorecard.skills === 'na' ? 'pending' : record.scorecard.skills,
    exercise: record.scorecard.exercise === 'na' ? 'pending' : record.scorecard.exercise,
    mentalPractice: record.scorecard.mentalPractice === 'na' ? 'pending' : record.scorecard.mentalPractice,
    ideaCapture: record.scorecard.ideaCapture === 'na' ? 'pending' : record.scorecard.ideaCapture,
    whatsappBoundaries:
      record.scorecard.whatsappBoundaries === 'na' ? 'pending' : record.scorecard.whatsappBoundaries,
    shutdownPrep: record.scorecard.shutdownPrep === 'na' ? 'pending' : record.scorecard.shutdownPrep,
    customReflection: record.scorecard.customReflection,
  };

  const metrics = calculateScorecardMetrics(restoredScorecard);

  return {
    ...record,
    mode: 'normal',
    modeRangeId: undefined,
    items: restoredItems,
    scorecard: restoredScorecard,
    scorePercentage: metrics.percentage,
    updatedAt: new Date().toISOString(),
  };
}
