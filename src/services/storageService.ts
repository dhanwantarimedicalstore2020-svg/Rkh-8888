import {
  DailyRecord,
  DailyScorecard,
  DayOfWeek,
  IdeaExperimentRecord,
  IdeaItem,
  IdeaPriority,
  IdeaPrototypeRecord,
  IdeaQualityQuestionnaire,
  IdeaResearchRecord,
  IdeaStatus,
  IdeaUserScoring,
  IdeaValidationRecord,
  ItemStatus,
  MasterWeeklyTemplate,
  MonthlyAuditRecord,
  OperatingMode,
  OperatingModeRange,
  PillarType,
  QuarterlyCheckRecord,
  ScheduleItemInstance,
  ScheduleItemTemplate,
  SystemBackupPayload,
  ValidationEvidence,
  WeeklyResetRecord,
  WorldScanItem,
} from '../types';
import { INITIAL_MASTER_TEMPLATES } from '../constants/masterSchedule';
import {
  formatLocalISODate,
  getISOWeek,
  getMonthInfo,
  getQuarterInfo,
  getTodayDateString,
  getWeekdayFromDate,
  offsetDays,
  parseLocalISODate,
} from '../utils/dateUtils';
import { calculateScorecardMetrics, SCORECARD_KPI_KEYS } from '../utils/metricsUtils';
import {
  applyExamModeToRecord,
  applyMinimumDayToRecord,
  getActiveModeForDate,
  loadModeRanges,
  saveModeRanges,
} from './operatingModeService';

export const CURRENT_SCHEMA_VERSION = '2.2.0';

const STORAGE_KEYS = {
  TEMPLATES: 'rkh8888_templates_v1',
  DAILY_RECORDS: 'rkh8888_daily_records_v1',
  IDEAS: 'rkh8888_ideas_v1',
  WORLD_SCANS: 'rkh8888_world_scans_v1',
  WEEKLY_RESETS: 'rkh8888_weekly_resets_v1',
  MONTHLY_AUDITS: 'rkh8888_monthly_audits_v1',
  QUARTERLY_CHECKS: 'rkh8888_quarterly_checks_v1',
  GLOBAL_MODE: 'rkh8888_global_mode_v1',
  SETTINGS: 'rkh8888_settings_v1',
};

const VALID_STATUSES: Set<ItemStatus> = new Set(['pending', 'completed', 'skipped', 'deferred', 'na']);
const VALID_PILLARS: Set<PillarType> = new Set([
  'academics',
  'health',
  'skills',
  'observation',
  'entrepreneurship',
  'review',
]);
const VALID_WEEKDAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/**
 * Get initial empty scorecard
 */
export function getInitialScorecard(mode: OperatingMode = 'normal'): DailyScorecard {
  if (mode === 'minimum_day') {
    return {
      academics: 'pending',
      skills: 'na', // Skills reduced in Minimum Day
      exercise: 'pending',
      mentalPractice: 'pending',
      ideaCapture: 'na', // Not mandatory in Minimum Day emergency
      whatsappBoundaries: 'pending',
      shutdownPrep: 'pending',
    };
  }

  return {
    academics: 'pending',
    skills: 'pending',
    exercise: 'pending',
    mentalPractice: 'pending',
    ideaCapture: 'pending',
    whatsappBoundaries: 'pending',
    shutdownPrep: 'pending',
  };
}

/**
 * Load Master Weekly Templates
 */
export function loadTemplates(): MasterWeeklyTemplate {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate that it has all 7 weekdays
      let hasAll = true;
      for (const day of VALID_WEEKDAYS) {
        if (!Array.isArray(parsed[day])) {
          hasAll = false;
          break;
        }
      }
      if (hasAll) return parsed;
    }
  } catch (err) {
    console.error('Failed to load templates from localStorage:', err);
  }
  return INITIAL_MASTER_TEMPLATES;
}

/**
 * Save Master Templates
 */
export function saveTemplates(templates: MasterWeeklyTemplate): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  } catch (err) {
    console.error('Failed to save templates:', err);
  }
}

/**
 * Update recurring weekly template for a single weekday.
 * HISTORICAL INTEGRITY RULE: This updates ONLY the future base template.
 * Existing historical DailyRecords are NEVER overwritten.
 */
export function updateRecurringTemplate(
  weekday: DayOfWeek,
  newItems: ScheduleItemTemplate[]
): void {
  const currentTemplates = loadTemplates();
  const updatedTemplates: MasterWeeklyTemplate = {
    ...currentTemplates,
    [weekday]: newItems,
  };
  saveTemplates(updatedTemplates);
}

/**
 * Sanitize and defensively hydrate any loaded DailyRecord
 */
export function sanitizeDailyRecord(rec: any, fallbackDateStr: string): DailyRecord {
  const date = rec?.date || fallbackDateStr;
  const weekday: DayOfWeek = rec?.weekday || getWeekdayFromDate(date);
  const mode: OperatingMode = rec?.mode || 'normal';
  const scorecard: DailyScorecard = rec?.scorecard || getInitialScorecard(mode);
  const items: ScheduleItemInstance[] = Array.isArray(rec?.items) ? rec.items : [];
  const scorePercentage: number =
    typeof rec?.scorePercentage === 'number'
      ? rec.scorePercentage
      : calculateScorecardMetrics(scorecard).percentage;

  return {
    ...rec,
    date,
    weekday,
    mode,
    scorecard,
    items,
    scorePercentage,
    createdAt: rec?.createdAt || new Date().toISOString(),
    updatedAt: rec?.updatedAt || new Date().toISOString(),
  };
}

/**
 * Load all Daily Records map
 */
export function loadAllRecords(): Record<string, DailyRecord> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DAILY_RECORDS);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        const sanitized: Record<string, DailyRecord> = {};
        for (const [dateStr, rec] of Object.entries(parsed)) {
          if (rec && typeof rec === 'object') {
            sanitized[dateStr] = sanitizeDailyRecord(rec, dateStr);
          }
        }
        return sanitized;
      }
    }
  } catch (err) {
    console.error('Failed to load daily records:', err);
  }
  return {};
}

/**
 * Save a single daily record.
 * Calculates fresh derived metrics dynamically and stamps updatedAt.
 */
export function saveDailyRecord(record: DailyRecord): void {
  try {
    const all = loadAllRecords();
    const metrics = calculateScorecardMetrics(record.scorecard);
    record.scorePercentage = metrics.percentage;
    record.updatedAt = new Date().toISOString();
    all[record.date] = record;
    localStorage.setItem(STORAGE_KEYS.DAILY_RECORDS, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to save daily record:', err);
  }
}

/**
 * Reset scorecard for a single specific date ONLY.
 * CRITICAL ISOLATION RULE:
 * Resets this date's 7 KPIs to default pending state without affecting any other date or week.
 */
export function resetDateScorecard(dateStr: string): DailyRecord {
  const record = getOrCreateDailyRecord(dateStr);
  const resetScorecard = getInitialScorecard(record.mode);
  const metrics = calculateScorecardMetrics(resetScorecard);
  
  const updatedRecord: DailyRecord = {
    ...record,
    scorecard: resetScorecard,
    scorePercentage: metrics.percentage,
    updatedAt: new Date().toISOString(),
  };
  
  saveDailyRecord(updatedRecord);
  return updatedRecord;
}

/**
 * Add a new task to a specific day record.
 */
export function addTaskToRecord(dateStr: string, newTask: ScheduleItemInstance): DailyRecord {
  const record = getOrCreateDailyRecord(dateStr);
  const updatedRecord: DailyRecord = {
    ...record,
    items: [...record.items, newTask],
    isCustomized: true,
    updatedAt: new Date().toISOString(),
  };
  saveDailyRecord(updatedRecord);
  return updatedRecord;
}

/**
 * Update an existing task in a specific day record.
 * Preserves status and execution states unless explicitly modified.
 */
export function updateTaskInRecord(dateStr: string, updatedTask: ScheduleItemInstance): DailyRecord {
  const record = getOrCreateDailyRecord(dateStr);
  const updatedItems = record.items.map((it) => (it.id === updatedTask.id ? updatedTask : it));
  const updatedRecord: DailyRecord = {
    ...record,
    items: updatedItems,
    isCustomized: true,
    updatedAt: new Date().toISOString(),
  };
  saveDailyRecord(updatedRecord);
  return updatedRecord;
}

/**
 * Delete a task from a specific day record with metrics preservation.
 */
export function deleteTaskFromRecord(dateStr: string, taskId: string): DailyRecord {
  const record = getOrCreateDailyRecord(dateStr);
  const updatedItems = record.items.filter((it) => it.id !== taskId);
  const updatedRecord: DailyRecord = {
    ...record,
    items: updatedItems,
    isCustomized: true,
    updatedAt: new Date().toISOString(),
  };
  saveDailyRecord(updatedRecord);
  return updatedRecord;
}

/**
 * Delete a daily record (e.g. for testing / reset)
 */
export function deleteDailyRecord(dateStr: string): void {
  try {
    const all = loadAllRecords();
    if (all[dateStr]) {
      delete all[dateStr];
      localStorage.setItem(STORAGE_KEYS.DAILY_RECORDS, JSON.stringify(all));
    }
  } catch (err) {
    console.error('Failed to delete daily record:', err);
  }
}

/**
 * Materialize or retrieve a DailyRecord for a specific date string.
 * HISTORICAL SNAPSHOT PRINCIPLE:
 * If a record already exists in storage for dateStr, returns it untouched.
 * If creating new, checks active OperatingModeRange, loads Master Template,
 * and saves a persistent snapshot for that specific date.
 */
export function getOrCreateDailyRecord(dateStr: string, requestedMode?: OperatingMode): DailyRecord {
  const all = loadAllRecords();
  if (all[dateStr]) {
    // If record exists, return it directly to guarantee HISTORICAL IMMUTABILITY
    return all[dateStr];
  }

  // Determine mode: requestedMode > active range > normal
  const activeRangeInfo = getActiveModeForDate(dateStr);
  const mode: OperatingMode = requestedMode || activeRangeInfo.mode || 'normal';

  const weekday: DayOfWeek = getWeekdayFromDate(dateStr);
  const templates = loadTemplates();
  const templateItems = templates[weekday] || INITIAL_MASTER_TEMPLATES[weekday];

  const items: ScheduleItemInstance[] = templateItems.map((tmpl) => ({
    ...tmpl,
    status: 'pending',
  }));

  const scorecard = getInitialScorecard(mode);
  let newRecord: DailyRecord = {
    date: dateStr,
    weekday,
    mode,
    modeRangeId: activeRangeInfo.range?.id,
    items,
    originalItemsSnapshot: templateItems,
    scorecard,
    scorePercentage: calculateScorecardMetrics(scorecard).percentage,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Apply mode specific transformation if not normal
  if (mode === 'minimum_day') {
    newRecord = applyMinimumDayToRecord(newRecord);
  } else if (mode === 'exam_mode') {
    newRecord = applyExamModeToRecord(newRecord, activeRangeInfo.range?.id);
  }

  // Save materialized record snapshot
  saveDailyRecord(newRecord);
  return newRecord;
}

/**
 * Map legacy or varied stage string to standard Phase 5A IdeaStatus
 */
export function normalizeIdeaStatus(statusOrStage?: string): IdeaStatus {
  if (!statusOrStage) return 'OBSERVED';
  const upper = statusOrStage.toUpperCase();
  if (
    upper === 'OBSERVED' ||
    upper === 'RESEARCHING' ||
    upper === 'VALIDATING' ||
    upper === 'PROTOTYPE' ||
    upper === 'EXPERIMENT' ||
    upper === 'PROMISING' ||
    upper === 'BUILDING' ||
    upper === 'ARCHIVED'
  ) {
    return upper as IdeaStatus;
  }
  // Legacy stage mappings
  const lower = statusOrStage.toLowerCase();
  if (lower === 'captured') return 'OBSERVED';
  if (lower === 'elevated') return 'PROMISING';
  if (lower === 'research') return 'RESEARCHING';
  if (lower === 'validation') return 'VALIDATING';
  if (lower === 'prototype') return 'PROTOTYPE';
  if (lower === 'experiment') return 'EXPERIMENT';
  if (lower === 'active_business') return 'BUILDING';
  if (lower === 'archived') return 'ARCHIVED';
  return 'OBSERVED';
}

/**
 * Defensive sanitizer for IdeaItem
 */
export function sanitizeIdeaItem(raw: any): IdeaItem {
  const dateCaptured = raw?.dateCaptured || raw?.date || getTodayDateString();
  const weekInfo = getISOWeek(dateCaptured);
  const status = normalizeIdeaStatus(raw?.status || raw?.stage);
  const isArchived = Boolean(raw?.isArchived || status === 'ARCHIVED');
  const priority: IdeaPriority = (raw?.priority === 'High' || raw?.priority === 'Low' || raw?.priority === 'Medium') ? raw.priority : 'Medium';
  const problemObserved = (raw?.problemObserved || raw?.problem || '').trim();
  const title = (raw?.title || '').trim() || (problemObserved.slice(0, 40) + (problemObserved.length > 40 ? '...' : '')) || 'Observation';
  const possibleSolution = (raw?.possibleSolution || raw?.proposedVenture || '').trim();
  const targetAudience = (raw?.targetAudience || '').trim();
  const currentSolution = (raw?.currentSolution || '').trim();
  const imperfection = (raw?.imperfection || '').trim();
  const tags: string[] = Array.isArray(raw?.tags) && raw.tags.length > 0 ? raw.tags : ['Observation'];
  
  // Phase 5C Prototypes sanitization
  const prototypes: IdeaPrototypeRecord[] = Array.isArray(raw?.prototypes)
    ? raw.prototypes.map((p: any, idx: number) => ({
        id: p.id || `proto-${Date.now()}-${idx}`,
        version: p.version || `v0.${idx + 1}`,
        description: p.description || '',
        materials: p.materials || '',
        estimatedCostINR: typeof p.estimatedCostINR === 'number' ? p.estimatedCostINR : Number(p.estimatedCostINR || 0),
        actualCostINR: p.actualCostINR !== undefined ? Number(p.actualCostINR) : undefined,
        buildDate: p.buildDate || dateCaptured,
        whatChanged: p.whatChanged || '',
        whatWasLearned: p.whatWasLearned || '',
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: p.updatedAt || new Date().toISOString(),
      }))
    : [];

  // Phase 5C Experiments sanitization (Full historical integrity)
  const experiments: IdeaExperimentRecord[] = Array.isArray(raw?.experiments)
    ? raw.experiments.map((exp: any, idx: number) => ({
        id: exp.id || `exp-${Date.now()}-${idx}`,
        objective: exp.objective || '',
        hypothesis: exp.hypothesis || '',
        method: exp.method || 'Desk research',
        costINR: typeof exp.costINR === 'number' ? exp.costINR : Number(exp.costINR || 0),
        timeRequiredHours: exp.timeRequiredHours !== undefined ? Number(exp.timeRequiredHours) : undefined,
        estimatedTime: exp.estimatedTime || undefined,
        actualTime: exp.actualTime || undefined,
        dateConducted: exp.dateConducted || dateCaptured,
        result: (exp.result === 'Success' || exp.result === 'Partial success' || exp.result === 'Failure' || exp.result === 'Inconclusive')
          ? exp.result
          : 'Inconclusive',
        learning: exp.learning || '',
        nextAction: (exp.nextAction === 'Continue' || exp.nextAction === 'Modify' || exp.nextAction === 'Retest' || exp.nextAction === 'Research more' || exp.nextAction === 'Pause' || exp.nextAction === 'Archive')
          ? exp.nextAction
          : 'Continue',
        notes: exp.notes || undefined,
        createdAt: exp.createdAt || new Date().toISOString(),
        updatedAt: exp.updatedAt || new Date().toISOString(),
      }))
    : [];

  // Validation Record sanitization
  let validationRecord: IdeaValidationRecord | undefined = undefined;
  if (raw?.validationRecord) {
    const v = raw.validationRecord;
    validationRecord = {
      hypothesis: v.hypothesis || '',
      targetUser: v.targetUser || targetAudience,
      problem: v.problem || problemObserved,
      evidenceNeeded: v.evidenceNeeded || '',
      validationMethod: v.validationMethod || 'Customer interview',
      evidenceList: Array.isArray(v.evidenceList)
        ? v.evidenceList.map((ev: any, idx: number) => ({
            id: ev.id || `ev-${Date.now()}-${idx}`,
            evidence: ev.evidence || '',
            source: ev.source || '',
            date: ev.date || dateCaptured,
            observation: ev.observation || '',
            result: ev.result || '',
            createdAt: ev.createdAt || new Date().toISOString(),
          }))
        : [],
      resultSummary: v.resultSummary || undefined,
      conclusion: v.conclusion || 'Pending',
      concludedAt: v.concludedAt || undefined,
      updatedAt: v.updatedAt || new Date().toISOString(),
    };
  }

  // Research Record sanitization
  let researchRecord: IdeaResearchRecord | undefined = undefined;
  if (raw?.researchRecord) {
    const r = raw.researchRecord;
    researchRecord = {
      whatIsKnown: r.whatIsKnown || '',
      whatIsUnknown: r.whatIsUnknown || '',
      competitors: r.competitors || '',
      existingSolutions: r.existingSolutions || currentSolution,
      evidenceExists: r.evidenceExists || '',
      assumptionsMade: r.assumptionsMade || '',
      marketSizeSignals: r.marketSizeSignals || undefined,
      updatedAt: r.updatedAt || new Date().toISOString(),
    };
  }

  // User Scoring
  let userScoring: IdeaUserScoring | undefined = undefined;
  if (raw?.userScoring) {
    const sc = raw.userScoring;
    const pSev = Math.min(10, Math.max(1, Number(sc.problemSeverity || 5)));
    const freq = Math.min(10, Math.max(1, Number(sc.frequency || 5)));
    const pVal = Math.min(10, Math.max(1, Number(sc.potentialValue || 5)));
    const eTest = Math.min(10, Math.max(1, Number(sc.easeOfTesting || 5)));
    const pCap = Math.min(10, Math.max(1, Number(sc.personalCapability || 5)));
    const mOpp = Math.min(10, Math.max(1, Number(sc.marketOpportunity || 5)));
    userScoring = {
      problemSeverity: pSev,
      frequency: freq,
      potentialValue: pVal,
      easeOfTesting: eTest,
      personalCapability: pCap,
      marketOpportunity: mOpp,
      totalScore: pSev + freq + pVal + eTest + pCap + mOpp,
      scoredAt: sc.scoredAt || new Date().toISOString(),
      notes: sc.notes || undefined,
    };
  }

  return {
    id: raw?.id || `idea-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title,
    problemObserved,
    targetAudience,
    currentSolution,
    imperfection,
    possibleSolution,
    locationContext: raw?.locationContext || undefined,
    tags,
    priority,
    status: isArchived ? 'ARCHIVED' : status,
    notes: raw?.notes || undefined,
    qualityPrompt: raw?.qualityPrompt || undefined,
    frequency: raw?.frequency || undefined,
    meaningfullyBetter: raw?.meaningfullyBetter || undefined,

    // Phase 5C Focus & Scoring
    isFocusIdea: Boolean(raw?.isFocusIdea),
    userScoring,

    // Phase 5C Pipeline Stages
    researchRecord,
    validationRecord,
    prototypes,
    experiments,

    dateCaptured,
    timeCaptured: raw?.timeCaptured || undefined,
    dailyRecordDate: raw?.dailyRecordDate || dateCaptured,
    isoWeek: raw?.isoWeek || weekInfo.weekNumber,
    isoYear: raw?.isoYear || weekInfo.year,
    isArchived,
    createdAt: raw?.createdAt || new Date().toISOString(),
    updatedAt: raw?.updatedAt || new Date().toISOString(),

    // Phase 5B World Scan Attribution
    sourceType: raw?.sourceType || undefined,
    sourceWorldScanId: raw?.sourceWorldScanId || undefined,
    sourceWorldScanDate: raw?.sourceWorldScanDate || undefined,
    sourceWorldScanTitle: raw?.sourceWorldScanTitle || undefined,

    researchNotes: raw?.researchNotes || undefined,
    validationNotes: raw?.validationNotes || undefined,
    experimentPlan: raw?.experimentPlan || undefined,
    outcomeNotes: raw?.outcomeNotes || undefined,
    // Backward compat
    stage: raw?.stage || status.toLowerCase(),
    proposedVenture: possibleSolution,
    weeklyReviewWeek: raw?.weeklyReviewWeek || weekInfo.weekNumber,
    weeklyReviewYear: raw?.weeklyReviewYear || weekInfo.year,
  };
}

/**
 * Load Ideas with auto-sanitization
 */
export function loadIdeas(): IdeaItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.IDEAS);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.map(sanitizeIdeaItem);
      }
    }
  } catch (err) {
    console.error('Failed to load ideas:', err);
  }
  return [];
}

/**
 * Save Ideas
 */
export function saveIdeas(ideas: IdeaItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.IDEAS, JSON.stringify(ideas));
  } catch (err) {
    console.error('Failed to save ideas:', err);
  }
}

/**
 * Add or update an Idea with historical date preservation and updatedAt timestamp
 */
export function upsertIdea(idea: Partial<IdeaItem> & { problemObserved: string }): IdeaItem {
  const ideas = loadIdeas();
  const nowIso = new Date().toISOString();
  
  if (idea.id) {
    const existingIndex = ideas.findIndex((i) => i.id === idea.id);
    if (existingIndex >= 0) {
      const existing = ideas[existingIndex];
      const updatedItem = sanitizeIdeaItem({
        ...existing,
        ...idea,
        // HISTORICAL INTEGRITY: Preserve original creation date & dateCaptured
        id: existing.id,
        createdAt: existing.createdAt,
        dateCaptured: existing.dateCaptured,
        dailyRecordDate: existing.dailyRecordDate || existing.dateCaptured,
        isoWeek: existing.isoWeek,
        isoYear: existing.isoYear,
        updatedAt: nowIso,
      });
      ideas[existingIndex] = updatedItem;
      saveIdeas(ideas);
      return updatedItem;
    }
  }

  // Brand new idea creation
  const now = new Date();
  const dateCaptured = idea.dateCaptured || getTodayDateString();
  const timeCaptured = idea.timeCaptured || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const weekInfo = getISOWeek(dateCaptured);

  const newItem = sanitizeIdeaItem({
    ...idea,
    id: idea.id || `idea-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    dateCaptured,
    timeCaptured,
    dailyRecordDate: idea.dailyRecordDate || dateCaptured,
    isoWeek: weekInfo.weekNumber,
    isoYear: weekInfo.year,
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  ideas.unshift(newItem);
  saveIdeas(ideas);
  return newItem;
}

/**
 * Soft Archive an Idea
 */
export function archiveIdea(id: string): void {
  const ideas = loadIdeas();
  const updated = ideas.map((i) => {
    if (i.id === id) {
      return {
        ...i,
        status: 'ARCHIVED' as IdeaStatus,
        isArchived: true,
        updatedAt: new Date().toISOString(),
      };
    }
    return i;
  });
  saveIdeas(updated);
}

/**
 * Restore an Archived Idea (restores to OBSERVED or previous status, preserving creation date)
 */
export function restoreIdea(id: string, targetStatus: IdeaStatus = 'OBSERVED'): void {
  const ideas = loadIdeas();
  const updated = ideas.map((i) => {
    if (i.id === id) {
      return {
        ...i,
        status: targetStatus === 'ARCHIVED' ? 'OBSERVED' : targetStatus,
        isArchived: false,
        updatedAt: new Date().toISOString(),
      };
    }
    return i;
  });
  saveIdeas(updated);
}

/**
 * Permanent Delete an Idea
 */
export function deleteIdeaPermanent(id: string): void {
  const ideas = loadIdeas();
  const filtered = ideas.filter((i) => i.id !== id);
  saveIdeas(filtered);
}

/**
 * Get Idea by ID
 */
export function getIdeaById(id: string): IdeaItem | undefined {
  const ideas = loadIdeas();
  return ideas.find((i) => i.id === id);
}

/**
 * Get Ideas associated with a specific DailyRecord calendar date
 */
export function getIdeasForDate(dateStr: string): IdeaItem[] {
  const ideas = loadIdeas();
  return ideas.filter((i) => i.dateCaptured === dateStr || i.dailyRecordDate === dateStr);
}

/**
 * Get Ideas created in a specific ISO week
 */
export function getIdeasForWeek(year: number, weekNumber: number): IdeaItem[] {
  const ideas = loadIdeas();
  return ideas.filter((i) => {
    if (i.isoYear === year && i.isoWeek === weekNumber) return true;
    const derived = getISOWeek(i.dateCaptured);
    return derived.year === year && derived.weekNumber === weekNumber;
  });
}

/**
 * Format currency in Indian Rupees (INR ₹)
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

/**
 * Toggle Focus State for an Idea (Max 2 focus ideas active at a time)
 */
export function toggleFocusIdea(ideaId: string): { success: boolean; idea?: IdeaItem; message?: string } {
  const ideas = loadIdeas();
  const targetIndex = ideas.findIndex((i) => i.id === ideaId);
  if (targetIndex < 0) return { success: false, message: 'Idea not found' };

  const currentFocusCount = ideas.filter((i) => i.isFocusIdea && i.id !== ideaId && !i.isArchived && i.status !== 'ARCHIVED').length;
  const isCurrentlyFocus = Boolean(ideas[targetIndex].isFocusIdea);

  if (!isCurrentlyFocus && currentFocusCount >= 2) {
    return {
      success: false,
      message: 'Focus discipline: Maximum 2 active ventures can be prioritized simultaneously. Unselect an existing focus venture first.',
    };
  }

  const updatedIdea: IdeaItem = {
    ...ideas[targetIndex],
    isFocusIdea: !isCurrentlyFocus,
    updatedAt: new Date().toISOString(),
  };

  ideas[targetIndex] = updatedIdea;
  saveIdeas(ideas);
  return { success: true, idea: updatedIdea };
}

/**
 * Append an Experiment to an Idea while maintaining historical immutability of prior experiments
 */
export function addExperimentToIdea(
  ideaId: string,
  expData: Omit<IdeaExperimentRecord, 'id' | 'createdAt' | 'updatedAt'>
): IdeaItem | undefined {
  const ideas = loadIdeas();
  const targetIndex = ideas.findIndex((i) => i.id === ideaId);
  if (targetIndex < 0) return undefined;

  const nowIso = new Date().toISOString();
  const newExperiment: IdeaExperimentRecord = {
    ...expData,
    id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    costINR: typeof expData.costINR === 'number' ? expData.costINR : Number(expData.costINR || 0),
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const existingExperiments = Array.isArray(ideas[targetIndex].experiments) ? ideas[targetIndex].experiments : [];
  const updatedExperiments = [...existingExperiments, newExperiment];

  // Also auto-progress status to EXPERIMENT if currently in lower stage
  let nextStatus = ideas[targetIndex].status;
  if (nextStatus === 'OBSERVED' || nextStatus === 'RESEARCHING' || nextStatus === 'VALIDATING' || nextStatus === 'PROTOTYPE') {
    nextStatus = 'EXPERIMENT';
  }

  const updatedIdea: IdeaItem = {
    ...ideas[targetIndex],
    status: nextStatus,
    experiments: updatedExperiments,
    updatedAt: nowIso,
  };

  ideas[targetIndex] = updatedIdea;
  saveIdeas(ideas);
  return updatedIdea;
}

/**
 * Update an existing Experiment record
 */
export function updateExperimentInIdea(
  ideaId: string,
  experiment: IdeaExperimentRecord
): IdeaItem | undefined {
  const ideas = loadIdeas();
  const targetIndex = ideas.findIndex((i) => i.id === ideaId);
  if (targetIndex < 0) return undefined;

  const existingExperiments = Array.isArray(ideas[targetIndex].experiments) ? ideas[targetIndex].experiments : [];
  const expIndex = existingExperiments.findIndex((e) => e.id === experiment.id);
  if (expIndex < 0) return undefined;

  const nowIso = new Date().toISOString();
  const updatedExp: IdeaExperimentRecord = {
    ...existingExperiments[expIndex],
    ...experiment,
    costINR: typeof experiment.costINR === 'number' ? experiment.costINR : Number(experiment.costINR || 0),
    createdAt: existingExperiments[expIndex].createdAt, // Immutable original creation
    updatedAt: nowIso,
  };

  const updatedExperiments = [...existingExperiments];
  updatedExperiments[expIndex] = updatedExp;

  const updatedIdea: IdeaItem = {
    ...ideas[targetIndex],
    experiments: updatedExperiments,
    updatedAt: nowIso,
  };

  ideas[targetIndex] = updatedIdea;
  saveIdeas(ideas);
  return updatedIdea;
}

/**
 * Delete an experiment record (Preserves other experiment history)
 */
export function deleteExperimentFromIdea(ideaId: string, experimentId: string): IdeaItem | undefined {
  const ideas = loadIdeas();
  const targetIndex = ideas.findIndex((i) => i.id === ideaId);
  if (targetIndex < 0) return undefined;

  const existingExperiments = Array.isArray(ideas[targetIndex].experiments) ? ideas[targetIndex].experiments : [];
  const updatedExperiments = existingExperiments.filter((e) => e.id !== experimentId);

  const updatedIdea: IdeaItem = {
    ...ideas[targetIndex],
    experiments: updatedExperiments,
    updatedAt: new Date().toISOString(),
  };

  ideas[targetIndex] = updatedIdea;
  saveIdeas(ideas);
  return updatedIdea;
}

/**
 * Add a Prototype version to an Idea
 */
export function addPrototypeToIdea(
  ideaId: string,
  protoData: Omit<IdeaPrototypeRecord, 'id' | 'createdAt' | 'updatedAt'>
): IdeaItem | undefined {
  const ideas = loadIdeas();
  const targetIndex = ideas.findIndex((i) => i.id === ideaId);
  if (targetIndex < 0) return undefined;

  const nowIso = new Date().toISOString();
  const newPrototype: IdeaPrototypeRecord = {
    ...protoData,
    id: `proto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    estimatedCostINR: typeof protoData.estimatedCostINR === 'number' ? protoData.estimatedCostINR : Number(protoData.estimatedCostINR || 0),
    actualCostINR: protoData.actualCostINR !== undefined ? Number(protoData.actualCostINR) : undefined,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const existingPrototypes = Array.isArray(ideas[targetIndex].prototypes) ? ideas[targetIndex].prototypes : [];
  const updatedPrototypes = [...existingPrototypes, newPrototype];

  // Auto-progress status to PROTOTYPE if in earlier stage
  let nextStatus = ideas[targetIndex].status;
  if (nextStatus === 'OBSERVED' || nextStatus === 'RESEARCHING' || nextStatus === 'VALIDATING') {
    nextStatus = 'PROTOTYPE';
  }

  const updatedIdea: IdeaItem = {
    ...ideas[targetIndex],
    status: nextStatus,
    prototypes: updatedPrototypes,
    updatedAt: nowIso,
  };

  ideas[targetIndex] = updatedIdea;
  saveIdeas(ideas);
  return updatedIdea;
}

/**
 * Add concrete validation evidence to an Idea
 */
export function addValidationEvidenceToIdea(
  ideaId: string,
  evidenceData: Omit<ValidationEvidence, 'id' | 'createdAt'>
): IdeaItem | undefined {
  const ideas = loadIdeas();
  const targetIndex = ideas.findIndex((i) => i.id === ideaId);
  if (targetIndex < 0) return undefined;

  const nowIso = new Date().toISOString();
  const targetIdea = ideas[targetIndex];
  const existingVal = targetIdea.validationRecord || {
    hypothesis: `We believe ${targetIdea.targetAudience || 'users'} has ${targetIdea.problemObserved || 'this problem'} and will value ${targetIdea.possibleSolution || 'this solution'}.`,
    targetUser: targetIdea.targetAudience || '',
    problem: targetIdea.problemObserved || '',
    evidenceNeeded: '',
    validationMethod: 'Customer interview',
    evidenceList: [],
    conclusion: 'Pending',
  };

  const newEvidence: ValidationEvidence = {
    ...evidenceData,
    id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: nowIso,
  };

  const updatedEvidenceList = [...(existingVal.evidenceList || []), newEvidence];

  const updatedValRecord: IdeaValidationRecord = {
    ...existingVal,
    evidenceList: updatedEvidenceList,
    updatedAt: nowIso,
  };

  let nextStatus = targetIdea.status;
  if (nextStatus === 'OBSERVED' || nextStatus === 'RESEARCHING') {
    nextStatus = 'VALIDATING';
  }

  const updatedIdea: IdeaItem = {
    ...targetIdea,
    status: nextStatus,
    validationRecord: updatedValRecord,
    updatedAt: nowIso,
  };

  ideas[targetIndex] = updatedIdea;
  saveIdeas(ideas);
  return updatedIdea;
}

/**
 * Calculate multi-horizon Entrepreneurship Diagnostics
 */
export function getEntrepreneurshipSummary(input?: IdeaItem[] | {
  weekNumber?: number;
  year?: number;
  month?: number;
  quarter?: number;
}) {
  const ideas = Array.isArray(input) ? input : loadIdeas();
  const options = !Array.isArray(input) ? input : undefined;
  const activeIdeas = ideas.filter((i) => !i.isArchived && i.status !== 'ARCHIVED');
  
  // Filter by timeframe if provided
  let filteredIdeas = activeIdeas;
  if (options?.year && options?.weekNumber) {
    filteredIdeas = ideas.filter((i) => {
      const w = getISOWeek(i.dateCaptured);
      return w.year === options.year && w.weekNumber === options.weekNumber;
    });
  } else if (options?.year && options?.month) {
    filteredIdeas = ideas.filter((i) => {
      const m = getMonthInfo(i.dateCaptured);
      return m.year === options.year && m.month === options.month;
    });
  } else if (options?.year && options?.quarter) {
    filteredIdeas = ideas.filter((i) => {
      const q = getQuarterInfo(i.dateCaptured);
      return q.year === options.year && q.quarter === options.quarter;
    });
  }

  // Calculate stats across all active ideas or period
  const totalIdeas = activeIdeas.length;
  const totalCaptured = filteredIdeas.length;
  const observedCount = activeIdeas.filter((i) => i.status === 'OBSERVED').length;
  const inResearchCount = activeIdeas.filter((i) => i.status === 'RESEARCHING').length;
  const inValidationCount = activeIdeas.filter((i) => i.status === 'VALIDATING').length;
  const researchedCount = activeIdeas.filter((i) => Boolean(i.researchRecord?.whatIsKnown || i.researchNotes || i.status === 'RESEARCHING' || i.status === 'VALIDATING' || i.status === 'PROTOTYPE' || i.status === 'EXPERIMENT' || i.status === 'PROMISING' || i.status === 'BUILDING')).length;
  const validatedCount = activeIdeas.filter((i) => Boolean((i.validationRecord?.evidenceList && i.validationRecord.evidenceList.length > 0) || i.validationRecord?.conclusion === 'Validated')).length;
  const scoredIdeasCount = activeIdeas.filter((i) => Boolean(i.userScoring && i.userScoring.totalScore > 0)).length;
  
  // Experiments stats across all non-archived ideas
  let totalExperiments = 0;
  let successExperiments = 0;
  let partialSuccessExperiments = 0;
  let failedExperiments = 0;
  let totalCostINR = 0;
  let prototypesCount = 0;
  let totalPrototypes = 0;

  activeIdeas.forEach((idea) => {
    if (Array.isArray(idea.prototypes)) {
      prototypesCount += idea.prototypes.length;
      totalPrototypes += idea.prototypes.length;
      idea.prototypes.forEach((p) => {
        totalCostINR += (p.actualCostINR || p.estimatedCostINR || 0);
      });
    }
    if (Array.isArray(idea.experiments)) {
      idea.experiments.forEach((exp) => {
        totalExperiments++;
        totalCostINR += (exp.costINR || 0);
        if (exp.result === 'Success') successExperiments++;
        else if (exp.result === 'Partial success') partialSuccessExperiments++;
        else if (exp.result === 'Failure') failedExperiments++;
      });
    }
  });

  const activeFocusIdeas = activeIdeas.filter((i) => i.isFocusIdea);
  const focusVenturesCount = activeFocusIdeas.length;
  const topActiveIdea = activeFocusIdeas[0] || activeIdeas.find((i) => i.status === 'PROMISING' || i.status === 'EXPERIMENT' || i.status === 'BUILDING') || activeIdeas[0];

  return {
    totalIdeas,
    totalCaptured,
    observedCount,
    inResearchCount,
    inValidationCount,
    researchedCount,
    validatedCount,
    prototypesCount,
    totalPrototypes,
    totalExperiments,
    successExperiments,
    partialSuccessExperiments,
    failedExperiments,
    totalCostINR,
    totalCapitalInvested: totalCostINR,
    focusVenturesCount,
    scoredIdeasCount,
    activeFocusIdeas,
    topActiveIdea,
  };
}

/**
 * Sanitize and validate WorldScanItem
 * Guaranteeing automatic temporal association (ISO week, year, month, quarter) and structured sections
 */
export function sanitizeWorldScanItem(raw: any): WorldScanItem {
  const now = new Date();
  const nowIso = now.toISOString();
  const dateStr = raw.date || getTodayDateString();
  const weekInfo = getISOWeek(dateStr);
  const monthInfo = getMonthInfo(dateStr);
  const quarterInfo = getQuarterInfo(dateStr);

  const rawSections = raw.sections || raw.keySynthesis || {};

  const sections = {
    biggestChange: rawSections.biggestChange || raw.biggestChange || '',
    techToWatch: rawSections.techToWatch || raw.techToWatch || '',
    industryChanging: rawSections.industryChanging || raw.industryChanging || '',
    businessModel: rawSections.businessModel || raw.businessModel || '',
    humanBehaviour: rawSections.humanBehaviour || raw.humanBehaviour || '',
    opportunity: rawSections.opportunity || raw.opportunity || '',
    oneToInvestigate: rawSections.oneToInvestigate || raw.oneToInvestigate || '',
    oneIdea: rawSections.oneIdea || raw.oneIdea || '',
  };

  const sources = Array.isArray(raw.sources)
    ? raw.sources.map((s: any, idx: number) => ({
        id: s.id || `src-${Date.now()}-${idx}`,
        sourceName: s.sourceName || 'Source',
        url: s.url || '',
        dateAccessed: s.dateAccessed || dateStr,
        keyTakeaway: s.keyTakeaway || '',
      }))
    : [];

  const followUps = Array.isArray(raw.followUps)
    ? raw.followUps.map((f: any, idx: number) => ({
        id: f.id || `flw-${Date.now()}-${idx}`,
        text: f.text || '',
        completed: Boolean(f.completed),
        targetWeek: f.targetWeek || `W${weekInfo.weekNumber + 1}`,
        createdAt: f.createdAt || nowIso,
      }))
    : [];

  const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FOLLOW_UP'];
  const status = validStatuses.includes(raw.status) ? raw.status : 'COMPLETED';

  return {
    id: raw.id || `scan-${dateStr}-${Math.random().toString(36).substring(2, 6)}`,
    date: dateStr,
    isoWeek: raw.isoWeek || weekInfo.weekNumber,
    isoYear: raw.isoYear || weekInfo.year,
    month: raw.month || monthInfo.month,
    monthName: raw.monthName || monthInfo.name,
    quarter: raw.quarter || quarterInfo.quarter,
    year: raw.year || weekInfo.year,
    status,
    topics: Array.isArray(raw.topics) ? raw.topics : ['Global Tech', 'Pharma', 'Business'],
    sections,
    globalDevelopments: raw.globalDevelopments || '',
    techInnovation: raw.techInnovation || '',
    industryAnalysis: raw.industryAnalysis || '',
    linkedinTrends: raw.linkedinTrends || '',
    researchNotes: raw.researchNotes || raw.notes || '',
    sources,
    followUps,
    investigateNextWeek: raw.investigateNextWeek !== undefined ? raw.investigateNextWeek : followUps.length > 0,
    extractedIdeaIds: Array.isArray(raw.extractedIdeaIds) ? raw.extractedIdeaIds : [],
    createdAt: raw.createdAt || nowIso,
    updatedAt: raw.updatedAt || nowIso,
    keySynthesis: sections, // Backward compatibility
  };
}

/**
 * Load World Scans
 */
export function loadWorldScans(): WorldScanItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WORLD_SCANS);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => sanitizeWorldScanItem(item));
      }
    }
  } catch (err) {
    console.error('Failed to load world scans:', err);
  }
  return [];
}

/**
 * Save World Scans
 */
export function saveWorldScans(scans: WorldScanItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WORLD_SCANS, JSON.stringify(scans));
  } catch (err) {
    console.error('Failed to save world scans:', err);
  }
}

/**
 * Upsert World Scan
 * Preserves original date, week, and createdAt unless date is explicitly changed.
 */
export function upsertWorldScan(scan: Partial<WorldScanItem> & { date: string }): WorldScanItem {
  const scans = loadWorldScans();
  const dateStr = scan.date;
  const nowIso = new Date().toISOString();

  // Find existing by ID or by exact date
  const existingIdx = scan.id
    ? scans.findIndex((s) => s.id === scan.id)
    : scans.findIndex((s) => s.date === dateStr);

  let targetItem: WorldScanItem;

  if (existingIdx >= 0) {
    const existing = scans[existingIdx];
    const isDateChanged = scan.date && scan.date !== existing.date;
    const weekInfo = isDateChanged ? getISOWeek(scan.date) : { weekNumber: existing.isoWeek, year: existing.isoYear };
    const monthInfo = isDateChanged ? getMonthInfo(scan.date) : { month: existing.month, name: existing.monthName };
    const quarterInfo = isDateChanged ? getQuarterInfo(scan.date) : { quarter: existing.quarter };

    targetItem = sanitizeWorldScanItem({
      ...existing,
      ...scan,
      date: isDateChanged ? scan.date : existing.date,
      isoWeek: weekInfo.weekNumber,
      isoYear: weekInfo.year,
      month: monthInfo.month,
      monthName: monthInfo.name,
      quarter: quarterInfo.quarter,
      year: weekInfo.year,
      createdAt: existing.createdAt,
      updatedAt: nowIso,
    });
    scans[existingIdx] = targetItem;
  } else {
    targetItem = sanitizeWorldScanItem({
      ...scan,
      id: scan.id || `scan-${dateStr}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
    scans.unshift(targetItem);
  }

  saveWorldScans(scans);
  return targetItem;
}

/**
 * Get World Scan by ID
 */
export function getWorldScanById(id: string): WorldScanItem | undefined {
  const scans = loadWorldScans();
  return scans.find((s) => s.id === id);
}

/**
 * Get World Scan for a specific calendar date
 */
export function getWorldScanForDate(dateStr: string): WorldScanItem | undefined {
  const scans = loadWorldScans();
  return scans.find((s) => s.date === dateStr);
}

/**
 * Get World Scans for an ISO Week
 */
export function getWorldScansForWeek(year: number, weekNumber: number): WorldScanItem[] {
  const scans = loadWorldScans();
  return scans.filter((s) => {
    if (s.isoYear === year && s.isoWeek === weekNumber) return true;
    const derived = getISOWeek(s.date);
    return derived.year === year && derived.weekNumber === weekNumber;
  });
}

/**
 * Delete World Scan
 */
export function deleteWorldScan(id: string): void {
  const scans = loadWorldScans();
  const filtered = scans.filter((s) => s.id !== id);
  saveWorldScans(filtered);
}

/**
 * Create an Idea in the Idea Vault directly from a World Scan (Preserves relationship)
 */
export function createIdeaFromWorldScan(
  scanId: string,
  customTitle?: string,
  customProblem?: string,
  customSolution?: string
): IdeaItem {
  const scan = getWorldScanById(scanId);
  if (!scan) {
    throw new Error(`World Scan with ID ${scanId} not found`);
  }

  const title = customTitle || scan.sections.oneIdea || scan.sections.opportunity || `Opportunity from World Scan (${scan.date})`;
  const problemObserved = customProblem || scan.sections.opportunity || scan.sections.biggestChange || 'Opportunity identified during weekly World Scan intelligence review.';
  const possibleSolution = customSolution || scan.sections.oneIdea || scan.sections.techToWatch || 'Venture model explored in research write-up.';

  const newIdea = upsertIdea({
    title,
    problemObserved,
    possibleSolution,
    targetAudience: scan.sections.industryChanging || 'Target market in shifting industry',
    currentSolution: scan.sections.businessModel || 'Existing traditional approach',
    imperfection: scan.sections.humanBehaviour || 'Friction identified in weekly scan',
    sourceType: 'world_scan',
    sourceWorldScanId: scan.id,
    sourceWorldScanDate: scan.date,
    sourceWorldScanTitle: scan.sections.biggestChange || `World Scan — ${scan.date}`,
    status: 'OBSERVED',
    priority: 'Medium',
    tags: ['World Scan', ...scan.topics.slice(0, 3)],
    notes: `Derived from World Scan on ${scan.date} (Week ${scan.isoWeek}, ${scan.year}).\nBiggest Change: ${scan.sections.biggestChange}`,
  });

  // Link Idea ID in scan without altering original date or sections
  const extractedIds = Array.isArray(scan.extractedIdeaIds) ? [...scan.extractedIdeaIds] : [];
  if (!extractedIds.includes(newIdea.id)) {
    extractedIds.push(newIdea.id);
    upsertWorldScan({
      ...scan,
      extractedIdeaIds: extractedIds,
    });
  }

  return newIdea;
}

/**
 * Load Weekly Resets
 */
export function loadWeeklyResets(): WeeklyResetRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WEEKLY_RESETS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error('Failed to load weekly resets:', err);
  }
  return [];
}

/**
 * Save Weekly Resets
 */
export function saveWeeklyResets(resets: WeeklyResetRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WEEKLY_RESETS, JSON.stringify(resets));
  } catch (err) {
    console.error('Failed to save weekly resets:', err);
  }
}

/**
 * Upsert Weekly Reset
 */
export function upsertWeeklyReset(reset: WeeklyResetRecord): void {
  const resets = loadWeeklyResets();
  const idx = resets.findIndex((r) => r.id === reset.id);
  if (idx >= 0) {
    resets[idx] = reset;
  } else {
    resets.unshift(reset);
  }
  saveWeeklyResets(resets);
}

/**
 * Load Monthly Audits
 */
export function loadMonthlyAudits(): MonthlyAuditRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MONTHLY_AUDITS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error('Failed to load monthly audits:', err);
  }
  return [];
}

/**
 * Save Monthly Audits
 */
export function saveMonthlyAudits(audits: MonthlyAuditRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MONTHLY_AUDITS, JSON.stringify(audits));
  } catch (err) {
    console.error('Failed to save monthly audits:', err);
  }
}

/**
 * Upsert Monthly Audit
 */
export function upsertMonthlyAudit(audit: MonthlyAuditRecord): void {
  const audits = loadMonthlyAudits();
  const idx = audits.findIndex((a) => a.id === audit.id);
  if (idx >= 0) {
    audits[idx] = audit;
  } else {
    audits.unshift(audit);
  }
  saveMonthlyAudits(audits);
}

/**
 * Load Quarterly Checks
 */
export function loadQuarterlyChecks(): QuarterlyCheckRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.QUARTERLY_CHECKS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error('Failed to load quarterly checks:', err);
  }
  return [];
}

/**
 * Save Quarterly Checks
 */
export function saveQuarterlyChecks(checks: QuarterlyCheckRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.QUARTERLY_CHECKS, JSON.stringify(checks));
  } catch (err) {
    console.error('Failed to save quarterly checks:', err);
  }
}

/**
 * Upsert Quarterly Check
 */
export function upsertQuarterlyCheck(check: QuarterlyCheckRecord): void {
  const checks = loadQuarterlyChecks();
  const idx = checks.findIndex((c) => c.id === check.id);
  if (idx >= 0) {
    checks[idx] = check;
  } else {
    checks.unshift(check);
  }
  saveQuarterlyChecks(checks);
}

/**
 * Export full system payload to JSON adhering to Phase 2B Schema
 */
export function exportSystemData(): string {
  const payload: SystemBackupPayload = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportTimestamp: new Date().toISOString(),
    templates: loadTemplates(),
    dailyRecords: loadAllRecords(),
    operatingModeRanges: loadModeRanges(),
    ideas: loadIdeas(),
    worldScans: loadWorldScans(),
    weeklyResets: loadWeeklyResets(),
    monthlyAudits: loadMonthlyAudits(),
    quarterlyChecks: loadQuarterlyChecks(),
    settings: {
      theme: 'warm_executive',
      notifications: true,
      appVersion: '2.2.0',
    },
  };
  return JSON.stringify(payload, null, 2);
}

export interface BackupValidationResult {
  isValid: boolean;
  errors: string[];
  validatedPayload?: SystemBackupPayload;
  recordsCount?: number;
}

/**
 * Strict Pre-Import Validation Engine
 * Validates JSON structure, schema version, date formats, task states, KPI states,
 * and handles duplicate date keys deterministically.
 */
export function validateBackupPayload(parsed: unknown): BackupValidationResult {
  const errors: string[] = [];

  if (!parsed || typeof parsed !== 'object') {
    return { isValid: false, errors: ['Backup payload must be a non-null JSON object.'] };
  }

  const raw = parsed as Record<string, unknown>;

  // 1. Schema version check
  const version = (raw.schemaVersion || raw.version) as string | undefined;
  if (!version || typeof version !== 'string') {
    errors.push('Missing or invalid schemaVersion header (e.g. "2.2.0").');
  }

  // 2. Templates check
  if (!raw.templates || typeof raw.templates !== 'object') {
    errors.push('Missing templates object in backup payload.');
  } else {
    const tmpls = raw.templates as Record<string, unknown>;
    for (const day of VALID_WEEKDAYS) {
      if (!Array.isArray(tmpls[day])) {
        errors.push(`Templates missing schedule array for ${day}.`);
      }
    }
  }

  // 3. DailyRecords check (supports dailyRecords or legacy records key)
  const rawRecords = (raw.dailyRecords || raw.records) as Record<string, unknown> | undefined;
  const validatedRecords: Record<string, DailyRecord> = {};

  if (rawRecords && typeof rawRecords === 'object') {
    for (const dateKey in rawRecords) {
      if (!Object.prototype.hasOwnProperty.call(rawRecords, dateKey)) continue;

      // Validate ISO date format YYYY-MM-DD
      const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
      if (!dateRegex.test(dateKey)) {
        errors.push(`Invalid date key format: "${dateKey}". Expected YYYY-MM-DD.`);
        continue;
      }

      const rec = rawRecords[dateKey] as Record<string, unknown>;
      if (!rec || typeof rec !== 'object') {
        errors.push(`Malformed daily record object for date "${dateKey}".`);
        continue;
      }

      // Validate weekday consistency
      const expectedWeekday = getWeekdayFromDate(dateKey);
      if (rec.weekday && rec.weekday !== expectedWeekday) {
        // Correct weekday deterministically if slightly mismatched
        rec.weekday = expectedWeekday;
      }

      // Validate items array
      if (!Array.isArray(rec.items)) {
        errors.push(`Daily record "${dateKey}" items must be an array.`);
      } else {
        for (let i = 0; i < rec.items.length; i++) {
          const it = rec.items[i];
          if (!it || typeof it !== 'object') {
            errors.push(`Daily record "${dateKey}" item at index ${i} is malformed.`);
            continue;
          }
          if (it.status && !VALID_STATUSES.has(it.status)) {
            errors.push(
              `Daily record "${dateKey}" item "${it.title || i}" has invalid status "${it.status}".`
            );
          }
          if (it.pillar && !VALID_PILLARS.has(it.pillar)) {
            errors.push(
              `Daily record "${dateKey}" item "${it.title || i}" has invalid pillar "${it.pillar}".`
            );
          }
        }
      }

      // Validate scorecard
      if (!rec.scorecard || typeof rec.scorecard !== 'object') {
        errors.push(`Daily record "${dateKey}" missing scorecard object.`);
      } else {
        const sc = rec.scorecard as Record<string, unknown>;
        for (const kpiKey of SCORECARD_KPI_KEYS) {
          if (sc[kpiKey] && !VALID_STATUSES.has(sc[kpiKey] as ItemStatus)) {
            errors.push(
              `Daily record "${dateKey}" scorecard KPI "${kpiKey}" has invalid status "${sc[kpiKey]}".`
            );
          }
        }
      }

      // Deduplication & safe assignment
      validatedRecords[dateKey] = rec as unknown as DailyRecord;
    }
  } else {
    errors.push('Missing or invalid dailyRecords object.');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const validatedPayload: SystemBackupPayload = {
    schemaVersion: version || CURRENT_SCHEMA_VERSION,
    exportTimestamp: (raw.exportTimestamp as string) || new Date().toISOString(),
    templates: raw.templates as MasterWeeklyTemplate,
    dailyRecords: validatedRecords,
    operatingModeRanges: Array.isArray(raw.operatingModeRanges)
      ? (raw.operatingModeRanges as OperatingModeRange[])
      : [],
    ideas: Array.isArray(raw.ideas) ? (raw.ideas as IdeaItem[]) : [],
    worldScans: Array.isArray(raw.worldScans) ? (raw.worldScans as WorldScanItem[]) : [],
    weeklyResets: Array.isArray(raw.weeklyResets) ? (raw.weeklyResets as WeeklyResetRecord[]) : [],
    monthlyAudits: Array.isArray(raw.monthlyAudits) ? (raw.monthlyAudits as MonthlyAuditRecord[]) : [],
    quarterlyChecks: Array.isArray(raw.quarterlyChecks)
      ? (raw.quarterlyChecks as QuarterlyCheckRecord[])
      : [],
  };

  return {
    isValid: true,
    errors: [],
    validatedPayload,
    recordsCount: Object.keys(validatedRecords).length,
  };
}

/**
 * Import system payload with 100% Non-Destructive Failure Protection.
 * If validation fails, existing user data in localStorage remains 100% untouched.
 */
export function importSystemData(jsonStr: string): {
  success: boolean;
  message: string;
  details?: string[];
  recordsCount?: number;
} {
  try {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      return {
        success: false,
        message: 'Invalid JSON format. Please verify the backup file syntax.',
        details: [parseErr instanceof Error ? parseErr.message : 'JSON parse error'],
      };
    }

    const validation = validateBackupPayload(parsed);
    if (!validation.isValid || !validation.validatedPayload) {
      return {
        success: false,
        message: 'Backup validation failed. Existing user data was preserved without changes.',
        details: validation.errors,
      };
    }

    const data = validation.validatedPayload;

    // Perform atomic state replacement only after full validation passed
    saveTemplates(data.templates);
    localStorage.setItem(STORAGE_KEYS.DAILY_RECORDS, JSON.stringify(data.dailyRecords));
    if (data.operatingModeRanges) saveModeRanges(data.operatingModeRanges);
    if (data.ideas) saveIdeas(data.ideas);
    if (data.worldScans) saveWorldScans(data.worldScans);
    if (data.weeklyResets) saveWeeklyResets(data.weeklyResets);
    if (data.monthlyAudits) saveMonthlyAudits(data.monthlyAudits);
    if (data.quarterlyChecks) saveQuarterlyChecks(data.quarterlyChecks);

    return {
      success: true,
      message: `System state successfully restored (${validation.recordsCount} daily records, v${data.schemaVersion}).`,
      recordsCount: validation.recordsCount,
    };
  } catch (err) {
    return {
      success: false,
      message: `Fatal error during import: ${err instanceof Error ? err.message : 'Unknown error'}. Existing data preserved.`,
    };
  }
}

/**
 * Initialize sample seed data if first time
 */
export function seedInitialDataIfEmpty(): void {
  try {
    const records = loadAllRecords();
    if (Object.keys(records).length === 0) {
      const today = formatLocalISODate(new Date());
      const yesterday = offsetDays(today, -1);
      const twoDaysAgo = offsetDays(today, -2);

      // Seed 2 days ago completed sample
      const rec2 = getOrCreateDailyRecord(twoDaysAgo);
      rec2.scorecard = {
        academics: 'completed',
        skills: 'completed',
        exercise: 'completed',
        mentalPractice: 'completed',
        ideaCapture: 'completed',
        whatsappBoundaries: 'completed',
        shutdownPrep: 'completed',
        customReflection: 'Disciplined execution. Night recall session on Pharmaceutics was solid.',
      };
      rec2.items.forEach((it) => (it.status = 'completed'));
      saveDailyRecord(rec2);

      // Seed yesterday sample
      const rec1 = getOrCreateDailyRecord(yesterday);
      rec1.scorecard = {
        academics: 'completed',
        skills: 'completed',
        exercise: 'completed',
        mentalPractice: 'completed',
        ideaCapture: 'completed',
        whatsappBoundaries: 'skipped',
        shutdownPrep: 'completed',
        customReflection: 'Stayed on WhatsApp 20 min too late. Realigning focus today.',
      };
      rec1.items.forEach((it, i) => (it.status = i === 14 ? 'skipped' : 'completed'));
      saveDailyRecord(rec1);

      // Ensure today exists
      getOrCreateDailyRecord(today);

      // Seed initial sample idea
      const initialIdeas: IdeaItem[] = [
        sanitizeIdeaItem({
          id: 'idea-seed-1',
          title: 'Pharmacy Batch Expiry Alert System',
          dateCaptured: yesterday,
          problemObserved:
            'Independent pharmacies struggle with real-time inventory expiry tracking, leading to high expired medication write-offs.',
          targetAudience: 'Community retail chemists and small pharmacy distributors',
          currentSolution:
            'Manual ledger audits or rudimentary desktop billing software without predictive alerts',
          imperfection: 'Staff forgets to rotate batch stocks; high wastage and dead capital',
          possibleSolution:
            'Lightweight barcode batch-tracking app with automated WhatsApp discount triggers 60 days before expiry',
          status: 'PROMISING',
          priority: 'High',
          tags: ['Pharma', 'Healthcare', 'Technology', 'Business'],
          notes: 'Discuss with local pharmacy network this weekend.',
          isArchived: false,
        }),
      ];
      saveIdeas(initialIdeas);

      // Seed initial World Scan
      const initialScans: WorldScanItem[] = [
        sanitizeWorldScanItem({
          id: 'scan-seed-1',
          date: offsetDays(today, -4),
          status: 'COMPLETED',
          topics: ['Pharma Manufacturing', 'AI Automation', 'Supply Chain', 'API Regulation'],
          sections: {
            biggestChange:
              'Shift from batch chemical processing to continuous automated synthesis in drug formulation.',
            techToWatch: 'Real-time spectroscopic monitoring and PAT tools in tablet compression.',
            industryChanging: 'Decentralized clinical trial software and continuous API synthesis micro-reactors.',
            businessModel: 'API-as-a-Service and compliance verification for compounding pharmacy networks.',
            humanBehaviour:
              'Healthcare buyers demanding verified batch stability certificates and origin QR tags.',
            opportunity:
              'Quality-assurance batch validation software tailored for small-to-midscale generic formulation units.',
            oneToInvestigate: 'How local Indian formulation plants currently record stability testing deviations.',
            oneIdea: 'Digital batch log mobile audit app for pharmaceutical quality control managers.',
          },
          globalDevelopments:
            'Regulatory authorities harmonizing digital batch record guidelines for generic drug exports.',
          techInnovation:
            'Continuous flow micro-reactors cutting hazardous chemical waste in active ingredient synthesis by 40%.',
          industryAnalysis:
            'Active Pharmaceutical Ingredient (API) supply chain diversification favoring regional manufacturing clusters.',
          linkedinTrends:
            'Increasing industry postings for validation engineers experienced in automated compliance workflows.',
          researchNotes:
            'Focus on process analytical technology (PAT). Key bottleneck remains regulatory validation costs for small units.',
          sources: [
            {
              id: 'src-seed-1',
              sourceName: 'FDA Guidance on Continuous Manufacturing',
              url: 'https://www.fda.gov/drugs/guidances-drugs',
              dateAccessed: offsetDays(today, -4),
              keyTakeaway: 'Regulatory framework encourages continuous quality verification over end-product testing.',
            },
            {
              id: 'src-seed-2',
              sourceName: 'PharmaTech Industry Report',
              url: 'https://pharmtech.example.com',
              dateAccessed: offsetDays(today, -4),
              keyTakeaway: 'Micro-reactors reduce solvent footprint and improve reaction yield consistency.',
            },
          ],
          followUps: [
            {
              id: 'flw-seed-1',
              text: 'Investigate stability testing software workflows in next week revision block',
              completed: false,
              targetWeek: `W${getISOWeek(today).weekNumber + 1}`,
              createdAt: new Date().toISOString(),
            },
          ],
          investigateNextWeek: true,
        }),
      ];
      saveWorldScans(initialScans);
    }
  } catch (e) {
    console.error('Seeding error:', e);
  }
}
