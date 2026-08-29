export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type PillarType = 
  | 'academics' 
  | 'health' 
  | 'skills' 
  | 'observation' 
  | 'entrepreneurship' 
  | 'review';

export type ItemStatus = 'pending' | 'completed' | 'skipped' | 'deferred' | 'na';

export type OperatingMode = 'normal' | 'minimum_day' | 'exam_mode';

export type DateTemporalState = 'RECORDED' | 'NOT_TRACKED' | 'IN_PROGRESS' | 'FUTURE_PLANNED';

export interface OperatingModeRange {
  id: string;
  mode: OperatingMode;
  startDate: string; // ISO 'YYYY-MM-DD'
  endDate: string;   // ISO 'YYYY-MM-DD'
  title?: string;
  label?: string;
  reason?: string;
  createdAt: string;
}

export interface ScorecardMetrics {
  totalCount: number; // 7
  applicableCount: number; // excluding 'na'
  completedCount: number;
  skippedCount: number;
  deferredCount: number;
  pendingCount: number;
  naCount: number;
  percentage: number; // (completed / applicable) * 100
}

export interface TaskMetrics {
  totalCount: number;
  applicableCount: number; // excluding 'na'
  completedCount: number;
  skippedCount: number;
  deferredCount: number;
  pendingCount: number;
  naCount: number;
  percentage: number; // (completed / applicable) * 100
  byPillar: Record<PillarType, { total: number; completed: number; percentage: number }>;
}

export type FlexibleWindowCategory = 
  | 'Academics'
  | 'Skill'
  | 'Revision/PYQ'
  | 'Business research'
  | 'Career development'
  | 'Recovery'
  | 'Other';

export interface ScheduleItemTemplate {
  id: string;
  startTime: string; // e.g. "05:00"
  endTime: string;   // e.g. "05:15"
  timeRange: string; // e.g. "5:00–5:15 AM"
  title: string;
  subtitle?: string;
  pillar: PillarType;
  isFixed?: boolean;
  essentialInMinDay?: boolean;
  protocolType?: 'fitness' | 'revision' | 'flexible' | 'college' | 'library' | 'skill' | 'night_study' | 'idea_capture' | 'shutdown' | 'practical_knowledge' | 'world_scan' | 'weekly_reset' | 'general';
  defaultCategory?: string;
  notes?: string;
}

export interface ScheduleItemInstance extends ScheduleItemTemplate {
  status: ItemStatus;
  userNotes?: string;
  actualDurationMinutes?: number;
  actualCategoryUsed?: FlexibleWindowCategory;
  loggedAt?: string;
}

export interface DailyScorecard {
  academics: ItemStatus; // 1. Academics
  skills: ItemStatus;    // 2. Skills
  exercise: ItemStatus;  // 3. Exercise
  mentalPractice: ItemStatus; // 4. Mental practice
  ideaCapture: ItemStatus;    // 5. Idea capture
  whatsappBoundaries: ItemStatus; // 6. WhatsApp boundaries
  shutdownPrep: ItemStatus;   // 7. Shutdown / sleep preparation
  customReflection?: string;
}

export interface FlexibleWindowLog {
  category: FlexibleWindowCategory;
  minutesSpent: number;
  details: string;
  timestamp: string;
}

export interface PracticalSessionRecord {
  principle: string;
  whyEachStep: string;
  calculation: string;
  observation: string;
  errors: string;
  application: string;
  subject: string;
}

export interface SkillSessionRecord {
  type: 'english' | 'business' | 'general';
  englishVocabNotes?: string;
  englishSpeakingNotes?: string;
  businessIdeaLearned?: string;
  businessQuestioned?: string;
  businessApplicable?: string;
  generalNotes?: string;
}

export interface NightStudyRecord {
  subject: string;
  deepLearningTopic: string;
  notesSummary: string;
  activeRecallQuestions: string;
  pyqsAttempted: string;
  completedStages: number[]; // [0, 1, 2, 3]
}

export interface DailyRecord {
  date: string; // ISO date 'YYYY-MM-DD'
  weekday: DayOfWeek;
  mode: OperatingMode;
  modeRangeId?: string;
  items: ScheduleItemInstance[];
  originalItemsSnapshot?: ScheduleItemTemplate[]; // Snapshot of original standard items for Minimum Day/Exam recovery
  scorecard: DailyScorecard;
  scorePercentage: number;
  flexibleLog?: FlexibleWindowLog;
  practicalSession?: PracticalSessionRecord;
  skillRecord?: SkillSessionRecord;
  nightStudyRecord?: NightStudyRecord;
  generalDayNotes?: string;
  tomorrowPriority?: string;
  isCustomized?: boolean; // Flag if individual day schedule was customized independently of template
  createdAt: string;
  updatedAt: string;
}

export type IdeaStatus = 
  | 'OBSERVED' 
  | 'RESEARCHING' 
  | 'VALIDATING' 
  | 'PROTOTYPE' 
  | 'EXPERIMENT' 
  | 'PROMISING' 
  | 'BUILDING' 
  | 'ARCHIVED';

export type IdeaPriority = 'Low' | 'Medium' | 'High';

export type IdeaFunnelStage = 
  | 'captured' 
  | 'elevated' 
  | 'research' 
  | 'validation' 
  | 'prototype' 
  | 'experiment' 
  | 'active_business' 
  | 'archived';

export interface IdeaQualityQuestionnaire {
  problemClarity?: string;
  whoExperiences?: string;
  frequency?: string;
  currentWorkaround?: string;
  imperfectionReason?: string;
  meaningfullyBetter?: string;
}

// ----------------------------------------------------
// Phase 5C — Entrepreneurship Pipeline Stage Models
// ----------------------------------------------------

export type ValidationMethod =
  | 'Customer interview'
  | 'Observation'
  | 'Survey'
  | 'Competitor research'
  | 'Prototype feedback'
  | 'Market research'
  | 'Desk research'
  | 'Other';

export interface ValidationEvidence {
  id: string;
  evidence: string;
  source: string;
  date: string; // 'YYYY-MM-DD'
  observation: string;
  result: string;
  createdAt: string;
}

export interface IdeaValidationRecord {
  hypothesis: string; // "We believe [user] has [problem] and will value [solution] because [reason]."
  targetUser: string;
  problem: string;
  evidenceNeeded: string;
  validationMethod: ValidationMethod;
  evidenceList: ValidationEvidence[];
  resultSummary?: string;
  conclusion?: 'Validated' | 'Partially Validated' | 'Invalidated' | 'Inconclusive' | 'Pending';
  concludedAt?: string;
  updatedAt?: string;
}

export interface IdeaResearchRecord {
  whatIsKnown: string;
  whatIsUnknown: string;
  competitors: string;
  existingSolutions: string;
  evidenceExists: string;
  assumptionsMade: string;
  marketSizeSignals?: string;
  updatedAt?: string;
}

export interface IdeaPrototypeRecord {
  id: string;
  version: string;
  description: string;
  materials: string;
  estimatedCostINR: number;
  actualCostINR?: number;
  buildDate: string; // 'YYYY-MM-DD'
  whatChanged: string;
  whatWasLearned: string;
  createdAt: string;
  updatedAt: string;
}

export type ExperimentOutcome = 'Success' | 'Partial success' | 'Failure' | 'Inconclusive';

export type ExperimentNextAction = 
  | 'Continue'
  | 'Modify'
  | 'Retest'
  | 'Research more'
  | 'Pause'
  | 'Archive';

export interface IdeaExperimentRecord {
  id: string;
  objective: string;
  hypothesis: string;
  method: string;
  costINR: number; // Stored in INR ₹
  timeRequiredHours?: number;
  estimatedTime?: string;
  actualTime?: string;
  dateConducted: string; // 'YYYY-MM-DD'
  result: ExperimentOutcome;
  learning: string; // Failure is data & learning
  nextAction: ExperimentNextAction;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IdeaUserScoring {
  problemSeverity: number; // 1-10
  frequency: number; // 1-10
  potentialValue: number; // 1-10
  easeOfTesting: number; // 1-10
  personalCapability: number; // 1-10
  marketOpportunity: number; // 1-10
  totalScore?: number; // Calculated sum (out of 60)
  scoredAt?: string;
  notes?: string;
}

export interface IdeaItem {
  id: string;
  title: string;
  problemObserved: string;
  targetAudience: string;
  currentSolution: string;
  imperfection: string;
  possibleSolution: string;
  locationContext?: string;
  tags: string[];
  priority: IdeaPriority;
  status: IdeaStatus;
  notes?: string;
  
  // Quality prompt details
  qualityPrompt?: IdeaQualityQuestionnaire;
  frequency?: string;
  meaningfullyBetter?: string;

  // Phase 5C Focus & Scoring
  isFocusIdea?: boolean; // Select top 1-2 ideas for active focus
  userScoring?: IdeaUserScoring;

  // Phase 5C Structured Pipeline Stages
  researchRecord?: IdeaResearchRecord;
  validationRecord?: IdeaValidationRecord;
  prototypes?: IdeaPrototypeRecord[];
  experiments: IdeaExperimentRecord[]; // Full historical experiment sequence

  // Automatic metadata (Preserves calendar date & integrity)
  dateCaptured: string; // ISO 'YYYY-MM-DD' calendar date
  timeCaptured?: string; // 'HH:mm' e.g. "23:04"
  dailyRecordDate?: string; // Associated DailyRecord 'YYYY-MM-DD'
  isoWeek?: number; // ISO Week 1-53
  isoYear?: number; // ISO Year e.g. 2026
  
  isArchived?: boolean; // Soft archive state
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp

  // Phase 5B World Scan & Source Attribution
  sourceType?: 'observation' | 'world_scan' | 'library' | 'manual';
  sourceWorldScanId?: string;
  sourceWorldScanDate?: string;
  sourceWorldScanTitle?: string;

  // Architecture ready for later stages & backward compatibility
  researchNotes?: string;
  validationNotes?: string;
  experimentPlan?: string;
  outcomeNotes?: string;
  stage?: IdeaFunnelStage | string;
  proposedVenture?: string;
  weeklyReviewWeek?: number;
  weeklyReviewYear?: number;
}

export type WorldScanResearchStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FOLLOW_UP';

export interface WorldScanSource {
  id: string;
  sourceName: string;
  url?: string;
  dateAccessed: string; // ISO date 'YYYY-MM-DD'
  keyTakeaway: string;
}

export interface WorldScanFollowUp {
  id: string;
  text: string;
  completed: boolean;
  targetWeek?: string; // e.g. "2026-W36"
  createdAt: string;
}

export interface WorldScanStructuredSections {
  biggestChange: string;       // 1. Biggest change
  techToWatch: string;         // 2. Technology to watch
  industryChanging: string;    // 3. Industry changing
  businessModel: string;       // 4. Business model noticed
  humanBehaviour: string;      // 5. Human behaviour changing
  opportunity: string;         // 6. Opportunity/problem
  oneToInvestigate: string;    // 7. One thing to investigate
  oneIdea: string;             // 8. One idea
}

export interface WorldScanItem {
  id: string;
  date: string; // ISO 'YYYY-MM-DD' calendar date
  isoWeek: number; // ISO Week 1-53
  isoYear: number; // ISO Year e.g. 2026
  month: number; // 1-12
  monthName: string; // e.g. "August"
  quarter: number; // 1-4
  year: number; // e.g. 2026
  
  status: WorldScanResearchStatus;
  topics: string[];

  // 8 Structured Synthesis Sections
  sections: WorldScanStructuredSections;

  // Exploratory Research Notes & Domains
  globalDevelopments?: string;
  techInnovation?: string;
  industryAnalysis?: string;
  linkedinTrends?: string;
  researchNotes?: string; // Plain text / bullets / safe links

  // Verified Sources & Next-Week Follow-ups
  sources: WorldScanSource[];
  followUps: WorldScanFollowUp[];
  investigateNextWeek?: boolean;

  // Extracted Ideas linked to this scan
  extractedIdeaIds?: string[];

  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp

  // Backward compatibility with Phase 1-4 keySynthesis object
  keySynthesis?: {
    biggestChange: string;
    techToWatch: string;
    industryChanging: string;
    businessModel: string;
    humanBehaviour: string;
    opportunity: string;
    oneToInvestigate: string;
    oneIdea: string;
  };
}

export interface WeeklyResetRecord {
  id: string;
  year: number;
  weekNumber: number; // ISO Week 1-53
  dateRange: string;  // e.g. "Aug 24 - Aug 30, 2026"
  whatWorked: string;
  whatDrained: string;
  pillarAuditNotes: string;
  completedTasksNotes: string;
  unfinishedCauses: string;
  elevatedIdeaIds: string[];
  singleImprovement: string;
  consistencyScore: number;
  createdAt: string;
}

export interface MonthlyAuditRecord {
  id: string; // e.g. "2026-08"
  year: number;
  month: number; // 1-12
  monthName: string;
  ratings: {
    academics: number;      // 1-10
    health: number;         // 1-10
    english: number;        // 1-10
    business: number;       // 1-10
    entrepreneurship: number; // 1-10
    relationships: number;  // 1-10
    financialAwareness: number; // 1-10
    mentalState: number;    // 1-10
  };
  dimensionNotes: {
    academics?: string;
    health?: string;
    english?: string;
    business?: string;
    entrepreneurship?: string;
    relationships?: string;
    financialAwareness?: string;
    mentalState?: string;
  };
  nextMonthStrategy: string;
  createdAt: string;
}

export interface QuarterlyCheckRecord {
  id: string; // e.g. "2026-Q3"
  year: number;
  quarter: number; // 1-4
  whatHasChanged: string;
  stableElements70: string;
  adaptableElements30: string;
  adjustments: {
    skillEmphasis?: string;
    runningPhase?: string;
    academicStrategy?: string;
    businessFocus?: string;
    projectVenture?: string;
    readingNetworking?: string;
  };
  createdAt: string;
}

export interface MasterWeeklyTemplate {
  Monday: ScheduleItemTemplate[];
  Tuesday: ScheduleItemTemplate[];
  Wednesday: ScheduleItemTemplate[];
  Thursday: ScheduleItemTemplate[];
  Friday: ScheduleItemTemplate[];
  Saturday: ScheduleItemTemplate[];
  Sunday: ScheduleItemTemplate[];
}

export interface SystemBackupPayload {
  schemaVersion: string; // e.g. "2.2.0"
  exportTimestamp: string;
  templates: MasterWeeklyTemplate;
  dailyRecords: Record<string, DailyRecord>; // Key is 'YYYY-MM-DD'
  records?: Record<string, DailyRecord>; // Backwards-compatible alias for v1
  operatingModeRanges?: OperatingModeRange[];
  ideas: IdeaItem[];
  worldScans: WorldScanItem[];
  weeklyResets: WeeklyResetRecord[];
  monthlyAudits: MonthlyAuditRecord[];
  quarterlyChecks: QuarterlyCheckRecord[];
  settings?: {
    theme?: string;
    notifications?: boolean;
    appVersion?: string;
  };
}
