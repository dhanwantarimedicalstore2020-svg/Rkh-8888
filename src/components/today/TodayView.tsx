import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Dumbbell,
  Edit3,
  ExternalLink,
  Flame,
  Globe,
  Info,
  Layers,
  Lightbulb,
  MessageSquareOff,
  Minus,
  Moon,
  Plus,
  RotateCcw,
  Shield,
  Sparkles,
  Timer,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  DailyRecord,
  DailyScorecard,
  ItemStatus,
  OperatingMode,
  ScheduleItemInstance,
} from '../../types';
import { ScorecardWidget } from './ScorecardWidget';
import { WeekDaySelector } from './WeekDaySelector';
import { FlexibleWindowCard } from './FlexibleWindowCard';
import { DailyReviewSection } from './DailyReviewSection';
import {
  DAY_FOCUS_CONFIG,
  FITNESS_SCHEDULE,
  PILLARS_CONFIG,
  SKILL_ROTATION,
  SUBJECT_ROTATION,
} from '../../constants/masterSchedule';
import {
  formatReadableDate,
  formatShortDate,
  getTodayDateString,
  getWeekdayFromDate,
  offsetDays,
} from '../../utils/dateUtils';
import { calculateScorecardMetrics, calculateTaskMetrics } from '../../utils/metricsUtils';
import { getActiveOrUpcomingBlock, isBlockActiveNow } from '../../utils/timeUtils';
import { getIdeasForDate } from '../../services/storageService';
import { DayScheduleEditorModal } from '../modals/DayScheduleEditorModal';
import { MasterTemplateManagerModal } from '../modals/MasterTemplateManagerModal';
import { ActiveTab } from '../Navigation';

interface TodayViewProps {
  record: DailyRecord;
  onUpdateRecord: (updated: DailyRecord) => void;
  onSelectDate: (dateStr: string) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenQuickIdea: () => void;
  onOpenFlexibleModal: () => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  record,
  onUpdateRecord,
  onSelectDate,
  onNavigateTab,
  onOpenQuickIdea,
  onOpenFlexibleModal,
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [currentTimeTick, setCurrentTimeTick] = useState<string>('');

  const todayStr = getTodayDateString();
  const isToday = record.date === todayStr;
  const isFuture = record.date > todayStr;
  const isPast = record.date < todayStr;

  const weekday = record?.weekday || (record?.date ? getWeekdayFromDate(record.date) : 'Monday');

  // Real-time clock tick for active block detection
  useEffect(() => {
    const updateTick = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setCurrentTimeTick(`${hours}:${mins}`);
    };
    updateTick();
    const timer = setInterval(updateTick, 30000); // 30s tick
    return () => clearInterval(timer);
  }, []);

  // Timetable Configurations
  const dayFocus = DAY_FOCUS_CONFIG[weekday] || DAY_FOCUS_CONFIG['Monday'];
  const fitness = (FITNESS_SCHEDULE && FITNESS_SCHEDULE[weekday]) || FITNESS_SCHEDULE['Monday'];
  const skill = (SKILL_ROTATION && SKILL_ROTATION[weekday]) || SKILL_ROTATION['Monday'];
  const academicSubjects = (SUBJECT_ROTATION && SUBJECT_ROTATION[weekday]) || SUBJECT_ROTATION['Monday'];

  // Metrics with strict separation
  const taskMetrics = calculateTaskMetrics(record?.items || []);
  const kpiMetrics = calculateScorecardMetrics(record?.scorecard);
  const remainingPendingTasks = taskMetrics.applicableCount - taskMetrics.completedCount - taskMetrics.skippedCount;

  // Active or upcoming block
  const { active: activeBlock, upcoming: upcomingBlock } = isToday
    ? getActiveOrUpcomingBlock(record.items || [], currentTimeTick)
    : { active: undefined, upcoming: undefined };

  // Task state mutation
  const handleUpdateItemStatus = (itemId: string, newStatus: ItemStatus) => {
    const updatedItems = record.items.map((item) => {
      if (item.id === itemId) {
        return { ...item, status: newStatus, loggedAt: new Date().toISOString() };
      }
      return item;
    });

    onUpdateRecord({
      ...record,
      items: updatedItems,
    });
  };

  const handleToggleItemDone = (itemId: string, currentStatus: ItemStatus) => {
    const nextStatus: ItemStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    handleUpdateItemStatus(itemId, nextStatus);
  };

  const handleUpdateScorecard = (newScorecard: DailyScorecard) => {
    onUpdateRecord({
      ...record,
      scorecard: newScorecard,
    });
  };

  // Determine Daily Status Label
  const getDailyStatus = () => {
    if (isFuture) {
      return { label: 'FUTURE PLANNED', color: 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]' };
    }
    if (isToday) {
      if (taskMetrics.completedCount === taskMetrics.applicableCount && taskMetrics.applicableCount > 0) {
        return { label: 'ALL SCHEDULE COMPLETED', color: 'bg-[#ECFDF5] text-[#166534] border-[#BBF7D0]' };
      }
      return { label: 'IN PROGRESS', color: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]' };
    }
    // Past date
    if (taskMetrics.completedCount > 0 || kpiMetrics.completedCount > 0) {
      return { label: 'HISTORICAL RECORD', color: 'bg-[#F4EFE6] text-[#4A453E] border-[#E5DEC9]' };
    }
    return { label: 'NO RECORD LOGGED', color: 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]' };
  };

  const dailyStatus = getDailyStatus();

  return (
    <div id="daily-execution-engine" className="space-y-4 sm:space-y-5 pb-24 animate-in fade-in duration-200">
      
      {/* 1. Weekday Navigation Bar & Date Horizon Selector */}
      <WeekDaySelector
        currentSelectedDate={record.date}
        onSelectDate={onSelectDate}
      />

      {/* 2. Top Status Bar & Temporal Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-4 sm:p-5 shadow-xs">
        
        {/* Date Title & Mode Indicators */}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-slab font-bold text-xl sm:text-2xl text-[#1E2022]">
              {weekday}, {formatShortDate(record.date)}
            </h1>

            {/* Daily Status Badge */}
            <span
              className={`text-[10px] font-mono-code uppercase font-bold px-2 py-0.5 rounded-full border ${dailyStatus.color}`}
            >
              {dailyStatus.label}
            </span>

            {/* Customized Day Badge if edited independently */}
            {record.isCustomized && (
              <span className="text-[10px] font-mono-code uppercase font-bold px-2 py-0.5 rounded-full border bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE]">
                Customized Day
              </span>
            )}
          </div>

          <p className="text-xs text-[#7A746B] mt-0.5 flex items-center gap-2 flex-wrap">
            <span>{formatReadableDate(record.date)}</span>
            <span>•</span>
            <span className="font-mono-code text-[#4A453E] font-medium">{dayFocus.theme}</span>
            {isPast && <span className="text-[#B45309] font-medium">(Historical View)</span>}
            {isFuture && <span className="text-[#2563EB] font-medium">(Future Schedule)</span>}
          </p>
        </div>

        {/* Quick Date Horizon Switchers */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <button
            type="button"
            onClick={() => onSelectDate(offsetDays(record.date, -1))}
            className="min-h-[40px] px-3 rounded-xl border border-[#DDD5C5] bg-[#FBF9F5] hover:bg-[#F2ECE1] text-[#4A453E] text-xs font-mono-code font-semibold flex items-center gap-1 transition-colors"
            title="Previous Day"
            aria-label="Previous Day"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          {!isToday && (
            <button
              type="button"
              onClick={() => onSelectDate(todayStr)}
              className="min-h-[40px] px-3.5 rounded-xl bg-[#1E2022] hover:bg-[#33373B] text-[#FBF9F5] text-xs font-mono-code font-bold transition-colors shadow-xs"
              id="btn-return-today"
            >
              Jump to Today
            </button>
          )}

          <button
            type="button"
            onClick={() => onSelectDate(offsetDays(record.date, 1))}
            className="min-h-[40px] px-3 rounded-xl border border-[#DDD5C5] bg-[#FBF9F5] hover:bg-[#F2ECE1] text-[#4A453E] text-xs font-mono-code font-semibold flex items-center gap-1 transition-colors"
            title="Next Day"
            aria-label="Next Day"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mode Specific Banners */}
      {record.mode === 'minimum_day' && (
        <div
          id="minimum-day-banner"
          className="p-4 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] flex items-start gap-3 shadow-xs"
        >
          <Shield className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
          <div className="text-xs">
            <h2 className="font-bold text-sm font-slab text-[#78350F]">
              MINIMUM DAY ACTIVE: Continuity Protocol
            </h2>
            <p className="mt-0.5 leading-relaxed">
              Discretionary work is exempted (<span className="font-mono-code font-bold">N/A</span>). Maintain the essential baseline: 10–20 min Academic Revision, 20–30 min Essential Work, Light Movement, and 5-min Mental Reset.
            </p>
          </div>
        </div>
      )}

      {record.mode === 'exam_mode' && (
        <div
          id="exam-mode-banner"
          className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] flex items-start gap-3 shadow-xs"
        >
          <BookOpen className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
          <div className="text-xs">
            <h2 className="font-bold text-sm font-slab text-[#1E3A8A]">
              EXAM MODE ACTIVE: Academic Primacy Protocol
            </h2>
            <p className="mt-0.5 leading-relaxed">
              Timetable transformed for exam preparation. Full sleep and essential health preserved; business/discretionary tasks set to optional.
            </p>
          </div>
        </div>
      )}

      {/* 3. Today's Context & Rotational Anchors Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        
        {/* Card 1: Academic Focus & Subjects */}
        <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <BookOpen className="w-4 h-4 text-[#1E40AF]" />
            <span className="font-slab font-bold text-xs text-[#1E2022] uppercase tracking-wider">
              Academic Rotation
            </span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-start gap-1">
              <span className="text-[10px] font-mono-code font-bold text-[#7A746B] w-12 shrink-0">
                Morning:
              </span>
              <span className="font-semibold text-[#1E2022] truncate">
                {academicSubjects.morningRevision}
              </span>
            </div>
            <div className="flex items-start gap-1">
              <span className="text-[10px] font-mono-code font-bold text-[#7A746B] w-12 shrink-0">
                Evening:
              </span>
              <span className="font-semibold text-[#1E2022] truncate">
                {academicSubjects.eveningDeepWork}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Skill Rotation */}
        <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-[#6B21A8]" />
            <span className="font-slab font-bold text-xs text-[#1E2022] uppercase tracking-wider">
              Skill & English Focus
            </span>
          </div>
          <div className="text-xs space-y-0.5">
            <p className="font-semibold text-[#1E2022] truncate">{skill.domain}</p>
            <p className="text-[11px] text-[#7A746B] leading-tight truncate">{skill.activity}</p>
          </div>
        </div>

        {/* Card 3: Conditioning & Exercise */}
        <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <Dumbbell className="w-4 h-4 text-[#166534]" />
            <span className="font-slab font-bold text-xs text-[#1E2022] uppercase tracking-wider">
              Conditioning & Training
            </span>
          </div>
          <div className="text-xs space-y-0.5">
            <p className="font-semibold text-[#1E2022] truncate">{fitness.focus}</p>
            <p className="text-[11px] text-[#7A746B] leading-tight truncate">{fitness.workout}</p>
          </div>
        </div>

      </div>

      {/* 4. Flexible High-Value Window Component (8:30–10:00 AM) */}
      <FlexibleWindowCard
        log={record.flexibleLog}
        onOpenModal={onOpenFlexibleModal}
        dateStr={record.date}
      />

      {/* 5. Live Execution Banner (if Today) */}
      {isToday && (
        <div className="p-3.5 rounded-2xl bg-[#1E2022] text-[#FBF9F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#33373B] text-[#FDE68A] shrink-0">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono-code font-bold px-1.5 py-0.2 rounded bg-[#FDE68A] text-[#1E2022]">
                  CURRENT TIME {currentTimeTick}
                </span>
                <span className="text-xs text-[#DDD5C5]">
                  {activeBlock ? 'Active Time Block' : upcomingBlock ? 'Next Upcoming Block' : 'Day Complete'}
                </span>
              </div>
              <p className="font-slab font-bold text-sm text-[#FBF9F5] mt-0.5">
                {activeBlock
                  ? `${activeBlock.timeRange} — ${activeBlock.title}`
                  : upcomingBlock
                  ? `${upcomingBlock.timeRange} — ${upcomingBlock.title}`
                  : 'All scheduled blocks for today are in the past.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <div className="text-right">
              <span className="block text-[10px] font-mono-code text-[#DDD5C5]">Remaining Tasks</span>
              <span className="font-mono-code font-bold text-sm text-[#FDE68A]">
                {remainingPendingTasks > 0 ? `${remainingPendingTasks} Pending` : 'All Done!'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 6. Main Daily Timetable / Schedule Timeline */}
      <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        
        {/* Timetable Header with Scope Editor & Template Manager Triggers */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#EFE9DC] gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-slab font-bold text-base sm:text-lg text-[#1E2022]">
                Daily Schedule Timeline
              </h2>
              <span className="text-xs font-mono-code px-2 py-0.5 rounded-md bg-[#F4EFE6] text-[#635E55] font-semibold">
                {taskMetrics.completedCount} / {taskMetrics.applicableCount} Completed ({taskMetrics.percentage}%)
              </span>
            </div>
            <p className="text-xs text-[#7A746B] mt-0.5">
              Individual block execution with 4-state lifecycle (Complete, Defer, Skip, N/A)
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {/* Master Template Manager Trigger */}
            <button
              type="button"
              onClick={() => setIsTemplateManagerOpen(true)}
              className="min-h-[40px] px-3 rounded-xl bg-[#F8F5EE] hover:bg-[#EFE9DC] text-[#4A453E] text-xs font-mono-code font-semibold flex items-center gap-1.5 transition-colors border border-[#DDD5C5]"
              id="btn-open-template-manager"
              title="Edit recurring weekly master templates"
            >
              <Layers className="w-3.5 h-3.5 text-[#7A746B]" />
              <span className="hidden sm:inline">Master Templates</span>
            </button>

            {/* Edit Today's Schedule Trigger */}
            <button
              type="button"
              onClick={() => setIsEditorOpen(true)}
              className="min-h-[40px] px-3.5 rounded-xl bg-[#F0EBE0] hover:bg-[#E5DEC9] text-[#1E2022] text-xs font-mono-code font-semibold flex items-center gap-1.5 transition-colors border border-[#DDD5C5]"
              id="btn-edit-day-schedule"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#B45309]" />
              <span>Edit Schedule</span>
            </button>
          </div>
        </div>

        {/* Schedule Items List */}
        <div className="space-y-2.5">
          {record.items.map((item) => {
            const pillar = PILLARS_CONFIG[item.pillar] || PILLARS_CONFIG.academics;
            const isCompleted = item.status === 'completed';
            const isSkipped = item.status === 'skipped';
            const isDeferred = item.status === 'deferred';
            const isNA = item.status === 'na';
            const isActiveNow = isToday && isBlockActiveNow(item.startTime, item.endTime, currentTimeTick);
            const isFlexibleWindowItem = item.timeRange.includes('8:30') && item.timeRange.includes('10:00');

            return (
              <div
                key={item.id}
                id={`schedule-item-${item.id}`}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isActiveNow
                    ? 'ring-2 ring-[#1E2022] border-[#1E2022] bg-[#FBF9F5] shadow-xs'
                    : isCompleted
                    ? 'border-[#BBF7D0] bg-[#F9FDFB]'
                    : isSkipped
                    ? 'border-[#FECACA] bg-[#FEF8F8]'
                    : isDeferred
                    ? 'border-[#FDE68A] bg-[#FFFDF5]'
                    : isNA
                    ? 'border-[#E5E7EB] bg-[#F9FAFB] opacity-60'
                    : 'border-[#EAE4D6] bg-[#FFFFFF] hover:border-[#DDD5C5]'
                }`}
              >
                {/* Left: Time, Pillar Badge, Title, Notes */}
                <div className="flex items-start gap-3">
                  <div className="w-24 shrink-0 font-mono-code text-xs font-bold text-[#635E55] pt-0.5">
                    {item.timeRange}
                    {isActiveNow && (
                      <span className="block text-[9px] font-bold text-[#DC2626] uppercase">
                        NOW
                      </span>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-semibold text-xs sm:text-sm text-[#1E2022] ${
                          isCompleted ? 'line-through text-[#635E55]' : ''
                        }`}
                      >
                        {item.title}
                      </span>
                      
                      {/* Pillar Visible Label */}
                      <span
                        className={`text-[9px] font-mono-code px-1.5 py-0.5 rounded-full border font-semibold ${pillar.bgBadge} ${pillar.textBadge} ${pillar.border}`}
                      >
                        {pillar.label}
                      </span>

                      {/* Minimum Day essential badge */}
                      {item.essentialInMinDay && (
                        <span className="text-[9px] font-mono-code px-1 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                          MIN-DAY
                        </span>
                      )}

                      {/* Special Timetable Badges */}
                      {item.notes && item.notes.includes('LIBRARY') && (
                        <span className="text-[9px] font-mono-code px-1.5 py-0.5 rounded bg-[#E0E7FF] text-[#3730A3] border border-[#C7D2FE] font-bold">
                          LIBRARY DAY
                        </span>
                      )}

                      {item.protocolType === 'practical_knowledge' && (
                        <span className="text-[9px] font-mono-code px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] font-bold">
                          WEEKLY PRACTICAL
                        </span>
                      )}

                      {/* Idea Capture Block Direct Badge */}
                      {(item.protocolType === 'idea_capture' || item.title.toLowerCase().includes('idea')) && (
                        <span className="text-[9px] font-mono-code px-1.5 py-0.5 rounded bg-[#F3E8FF] text-[#6D28D9] border border-[#DDD6FE] font-bold flex items-center gap-1">
                          <Lightbulb className="w-2.5 h-2.5 text-[#F59E0B]" />
                          {getIdeasForDate(record.date).length > 0
                            ? `${getIdeasForDate(record.date).length} Logged Today`
                            : '11:00 PM Protocol'}
                        </span>
                      )}

                      {/* World Scan Block Direct Badge */}
                      {(item.protocolType === 'world_scan' || item.title.toLowerCase().includes('world scan')) && (
                        <span className="text-[9px] font-mono-code px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] font-bold flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5 text-[#059669]" />
                          Sunday World Scan Protocol
                        </span>
                      )}

                      {/* Flexible Window Tag if logged */}
                      {isFlexibleWindowItem && record.flexibleLog && (
                        <span className="text-[9px] font-mono-code px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Logged: {record.flexibleLog.category} ({record.flexibleLog.minutesSpent}m)
                        </span>
                      )}
                    </div>

                    {item.subtitle && (
                      <p className="text-[11px] text-[#7A746B] mt-0.5 leading-snug">
                        {item.subtitle}
                      </p>
                    )}

                    {/* Direct Quick Launch for Idea Capture Block */}
                    {(item.protocolType === 'idea_capture' || item.title.toLowerCase().includes('idea')) && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenQuickIdea();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#5B21B6] hover:bg-[#4C1D95] text-[#FBF9F5] text-[11px] font-mono-code font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Capture Friction Observation</span>
                        </button>
                      </div>
                    )}

                    {/* Direct Quick Launch for World Scan Block */}
                    {(item.protocolType === 'world_scan' || item.title.toLowerCase().includes('world scan')) && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateTab('ideas');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#166534] hover:bg-[#14532D] text-[#FBF9F5] text-[11px] font-mono-code font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          <Globe className="w-3 h-3 text-[#A7F3D0]" />
                          <span>Open Sunday World Scan & Intelligence Archive</span>
                        </button>
                      </div>
                    )}

                    {/* Execution Notes */}
                    {item.notes && !item.notes.includes('LIBRARY') && (
                      <div className="mt-1 text-[10px] font-mono-code text-[#B45309] bg-[#FEF3C7]/40 px-2 py-0.5 rounded-md inline-block">
                        Note: {item.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Touch-Friendly 4-State Controller */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  
                  {/* Primary 1-Tap Toggle (Completed / Undo) */}
                  <button
                    type="button"
                    onClick={() => handleToggleItemDone(item.id, item.status)}
                    className={`min-h-[44px] min-w-[72px] px-3.5 rounded-xl text-xs font-mono-code font-bold flex items-center justify-center gap-1.5 transition-all focus:outline-hidden focus:ring-2 focus:ring-[#1E2022] ${
                      isCompleted
                        ? 'bg-[#166534] text-[#FFFFFF] shadow-2xs'
                        : 'bg-[#F2ECE1] text-[#4A453E] hover:bg-[#E5DEC9]'
                    }`}
                    title={isCompleted ? 'Completed (Tap to Undo)' : 'Mark Completed'}
                    aria-label={`Toggle completion for ${item.title}`}
                    id={`btn-toggle-task-${item.id}`}
                  >
                    <Check className="w-4 h-4" />
                    <span>{isCompleted ? 'Done' : 'Complete'}</span>
                  </button>

                  {/* Defer Action */}
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateItemStatus(
                        item.id,
                        item.status === 'deferred' ? 'pending' : 'deferred'
                      )
                    }
                    className={`min-h-[44px] min-w-[44px] px-2.5 rounded-xl text-xs font-mono-code flex items-center justify-center gap-1 transition-all focus:outline-hidden focus:ring-2 focus:ring-[#B45309] ${
                      isDeferred
                        ? 'bg-[#B45309] text-[#FFFFFF] shadow-2xs font-semibold'
                        : 'bg-[#F2ECE1] text-[#4A453E] hover:bg-[#E5DEC9]'
                    }`}
                    title="Defer block to flexible window"
                    aria-label={`Defer ${item.title}`}
                    id={`btn-defer-task-${item.id}`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Defer</span>
                  </button>

                  {/* Skip Action */}
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateItemStatus(
                        item.id,
                        item.status === 'skipped' ? 'pending' : 'skipped'
                      )
                    }
                    className={`min-h-[44px] min-w-[44px] px-2.5 rounded-xl text-xs font-mono-code flex items-center justify-center gap-1 transition-all focus:outline-hidden focus:ring-2 focus:ring-[#991B1B] ${
                      isSkipped
                        ? 'bg-[#991B1B] text-[#FFFFFF] shadow-2xs font-semibold'
                        : 'bg-[#F2ECE1] text-[#4A453E] hover:bg-[#E5DEC9]'
                    }`}
                    title="Mark Skipped"
                    aria-label={`Skip ${item.title}`}
                    id={`btn-skip-task-${item.id}`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Skip</span>
                  </button>

                  {/* N/A Action */}
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateItemStatus(
                        item.id,
                        item.status === 'na' ? 'pending' : 'na'
                      )
                    }
                    className={`min-h-[44px] min-w-[44px] px-2.5 rounded-xl text-[11px] font-mono-code flex items-center justify-center transition-all focus:outline-hidden focus:ring-2 focus:ring-[#4B5563] ${
                      isNA
                        ? 'bg-[#4B5563] text-[#FFFFFF] font-bold'
                        : 'bg-[#F2ECE1] text-[#7A746B] hover:bg-[#E5DEC9]'
                    }`}
                    title="Not Applicable (Exempt from denominator)"
                    aria-label={`Set ${item.title} as Not Applicable`}
                    id={`btn-na-task-${item.id}`}
                  >
                    N/A
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. 7-Point Daily Scorecard Widget (Tonight's Scorecard) */}
      <ScorecardWidget
        scorecard={record.scorecard}
        onUpdateScorecard={handleUpdateScorecard}
        dateStr={record.date}
        isToday={isToday}
      />

      {/* 8. Daily Review & Shutdown Protocol Section */}
      <DailyReviewSection
        record={record}
        onUpdateRecord={onUpdateRecord}
        onOpenQuickIdea={onOpenQuickIdea}
        onNavigateTab={onNavigateTab}
      />

      {/* Day Schedule Editor Modal */}
      <DayScheduleEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        record={record}
        onSaveDayRecord={onUpdateRecord}
      />

      {/* Recurring Master Template Manager Modal */}
      <MasterTemplateManagerModal
        isOpen={isTemplateManagerOpen}
        onClose={() => setIsTemplateManagerOpen(false)}
        onTemplatesUpdated={() => {
          // Re-trigger refresh if needed
        }}
      />

    </div>
  );
};
