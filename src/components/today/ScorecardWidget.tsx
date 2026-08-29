import React from 'react';
import {
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  HeartHandshake,
  Lightbulb,
  MessageSquareOff,
  MinusCircle,
  Moon,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';
import { DailyScorecard, ItemStatus } from '../../types';
import { calculateScorecardMetrics } from '../../utils/metricsUtils';
import { formatShortDate, getWeekdayFromDate } from '../../utils/dateUtils';

interface ScorecardWidgetProps {
  scorecard: DailyScorecard;
  onUpdateScorecard: (newScorecard: DailyScorecard) => void;
  dateStr: string;
  isToday: boolean;
}

interface KPIConfig {
  key: keyof Omit<DailyScorecard, 'customReflection'>;
  label: string;
  sublabel: string;
  icon: any;
  pillarColor: string;
}

const KPIS: KPIConfig[] = [
  {
    key: 'academics',
    label: '1. Academics',
    sublabel: 'Morning revision + Primary night deep work',
    icon: BookOpen,
    pillarColor: 'text-[#1E3A8A]',
  },
  {
    key: 'skills',
    label: '2. Skills',
    sublabel: 'English fluency or Business 1-1-1 execution',
    icon: Sparkles,
    pillarColor: 'text-[#B45309]',
  },
  {
    key: 'exercise',
    label: '3. Exercise',
    sublabel: 'Morning running / strength conditioning',
    icon: Dumbbell,
    pillarColor: 'text-[#166534]',
  },
  {
    key: 'mentalPractice',
    label: '4. Mental Practice',
    sublabel: 'Meditation, diaphragmatic breathing & reset',
    icon: HeartHandshake,
    pillarColor: 'text-[#166534]',
  },
  {
    key: 'ideaCapture',
    label: '5. Idea Capture',
    sublabel: '5-min friction observation & venture logging',
    icon: Lightbulb,
    pillarColor: 'text-[#6D28D9]',
  },
  {
    key: 'whatsappBoundaries',
    label: '6. WhatsApp Boundaries',
    sublabel: 'Strict adherence to 3 designated windows',
    icon: MessageSquareOff,
    pillarColor: 'text-[#0F766E]',
  },
  {
    key: 'shutdownPrep',
    label: '7. Shutdown & Sleep Preparation',
    sublabel: 'Scorecard audit, phone quarantine & 11:30 PM sleep',
    icon: Moon,
    pillarColor: 'text-[#C2410C]',
  },
];

export const ScorecardWidget: React.FC<ScorecardWidgetProps> = ({
  scorecard,
  onUpdateScorecard,
  dateStr,
  isToday,
}) => {
  const metrics = calculateScorecardMetrics(scorecard);
  const weekday = getWeekdayFromDate(dateStr);

  const handleToggleComplete = (key: keyof Omit<DailyScorecard, 'customReflection'>) => {
    const current = scorecard[key];
    const nextStatus: ItemStatus = current === 'completed' ? 'pending' : 'completed';
    onUpdateScorecard({
      ...scorecard,
      [key]: nextStatus,
    });
  };

  const handleSetStatus = (
    key: keyof Omit<DailyScorecard, 'customReflection'>,
    status: ItemStatus,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    onUpdateScorecard({
      ...scorecard,
      [key]: status,
    });
  };

  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-[#ECFDF5] border-[#BBF7D0] text-[#166534]',
          icon: CheckCircle2,
          text: 'COMPLETED',
        };
      case 'skipped':
        return {
          bg: 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]',
          icon: XCircle,
          text: 'SKIPPED',
        };
      case 'deferred':
        return {
          bg: 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]',
          icon: Clock,
          text: 'DEFERRED',
        };
      case 'na':
        return {
          bg: 'bg-[#F3F4F6] border-[#E5E7EB] text-[#6B7280]',
          icon: MinusCircle,
          text: 'N / A',
        };
      default:
        return {
          bg: 'bg-[#FFFFFF] border-[#E2D8C3] text-[#7A746B]',
          icon: Clock,
          text: 'PENDING',
        };
    }
  };

  const titleText = isToday
    ? "Tonight's Scorecard"
    : `${weekday}'s Scorecard (${formatShortDate(dateStr)})`;

  return (
    <div
      id="daily-scorecard-widget"
      className="bg-[#FFFFFF] rounded-2xl border border-[#E2D8C3] p-4 sm:p-5 shadow-xs"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-[#EFE9DC] gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#F2ECE1] text-[#1E2022] shrink-0">
            <Flame className="w-4 h-4 text-[#C2410C]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-slab font-bold text-base sm:text-lg text-[#1E2022]">
                {titleText}
              </h3>
              <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-[#F4EFE6] text-[#635E55] border border-[#E5DEC9]">
                7 KPIs
              </span>
            </div>
            <p className="text-[11px] text-[#7A746B]">
              Independent daily diagnostic audit • Scored strictly for {dateStr}
            </p>
          </div>
        </div>

        {/* Dynamic Percentage Badge */}
        <div className="flex items-center sm:flex-col sm:items-end justify-between bg-[#FBF9F5] sm:bg-transparent p-2 sm:p-0 rounded-xl border sm:border-0 border-[#EAE4D6]">
          <div className="text-xl sm:text-2xl font-mono-code font-extrabold text-[#1E2022]">
            {metrics.percentage}%
          </div>
          <span className="text-[11px] font-mono-code text-[#7A746B]">
            {metrics.completedCount} / {metrics.applicableCount} Completed{' '}
            {metrics.naCount > 0 && <span className="text-[10px]">({metrics.naCount} N/A)</span>}
          </span>
        </div>
      </div>

      {/* KPI Interactive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {KPIS.map((kpi) => {
          const status = scorecard[kpi.key] || 'pending';
          const badge = getStatusBadge(status);
          const Icon = kpi.icon;
          const isCompleted = status === 'completed';

          return (
            <div
              key={kpi.key}
              id={`kpi-card-${kpi.key}`}
              onClick={() => handleToggleComplete(kpi.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleToggleComplete(kpi.key);
                }
              }}
              aria-label={`Toggle ${kpi.label}. Current status: ${badge.text}`}
              className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 cursor-pointer hover:shadow-xs ${
                isCompleted
                  ? 'border-[#BBF7D0] bg-[#F7FDF9]'
                  : status === 'skipped'
                  ? 'border-[#FECACA] bg-[#FEF8F8]'
                  : status === 'deferred'
                  ? 'border-[#FDE68A] bg-[#FFFDF5]'
                  : status === 'na'
                  ? 'border-[#E5E7EB] bg-[#F9FAFB] opacity-60'
                  : 'border-[#EAE4D6] bg-[#FFFFFF] hover:border-[#DDD5C5]'
              }`}
            >
              {/* Top Row: Icon + Label + Current Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className={`mt-0.5 p-1.5 rounded-lg bg-[#F2ECE1] ${kpi.pillarColor} shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs sm:text-sm text-[#1E2022] leading-snug">
                      {kpi.label}
                    </div>
                    <div className="text-[11px] text-[#7A746B] leading-tight mt-0.5">
                      {kpi.sublabel}
                    </div>
                  </div>
                </div>

                {/* Status pill badge */}
                <div
                  className={`px-2 py-0.5 rounded-md text-[9px] font-mono-code font-bold border flex items-center gap-1 shrink-0 ${badge.bg}`}
                >
                  <span>{badge.text}</span>
                </div>
              </div>

              {/* Bottom Row: Quick Status Controls with 44px touch targets */}
              <div className="flex items-center justify-between pt-2 border-t border-[#F2ECE1]">
                <button
                  type="button"
                  onClick={(e) => handleSetStatus(kpi.key, isCompleted ? 'pending' : 'completed', e)}
                  className={`min-h-[44px] px-3.5 rounded-xl text-xs font-mono-code font-semibold flex items-center justify-center gap-1.5 transition-all focus:outline-hidden focus:ring-2 focus:ring-[#1E2022] ${
                    isCompleted
                      ? 'bg-[#166534] text-[#FFFFFF] shadow-2xs'
                      : 'bg-[#F2ECE1] text-[#4A453E] hover:bg-[#E5DEC9]'
                  }`}
                  aria-label={`Mark ${kpi.label} as ${isCompleted ? 'Pending' : 'Completed'}`}
                  id={`btn-scorecard-toggle-${kpi.key}`}
                >
                  <Check className="w-4 h-4" />
                  <span>{isCompleted ? 'Completed' : 'Mark Done'}</span>
                </button>

                {/* Other states */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => handleSetStatus(kpi.key, status === 'skipped' ? 'pending' : 'skipped', e)}
                    className={`min-h-[44px] min-w-[44px] px-2 rounded-xl text-[10px] font-mono-code flex items-center justify-center transition-all focus:outline-hidden focus:ring-2 focus:ring-[#991B1B] ${
                      status === 'skipped'
                        ? 'bg-[#991B1B] text-[#FFFFFF] font-bold shadow-2xs'
                        : 'bg-[#F9F7F2] text-[#7A746B] hover:bg-[#EFE9DC]'
                    }`}
                    title="Mark Skipped"
                    aria-label={`Mark ${kpi.label} as skipped`}
                    id={`btn-scorecard-skip-${kpi.key}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleSetStatus(kpi.key, status === 'na' ? 'pending' : 'na', e)}
                    className={`min-h-[44px] min-w-[44px] px-2 rounded-xl text-[11px] font-mono-code flex items-center justify-center transition-all focus:outline-hidden focus:ring-2 focus:ring-[#4B5563] ${
                      status === 'na'
                        ? 'bg-[#4B5563] text-[#FFFFFF] font-bold shadow-2xs'
                        : 'bg-[#F9F7F2] text-[#7A746B] hover:bg-[#EFE9DC]'
                    }`}
                    title="Not Applicable (Exempt from score)"
                    aria-label={`Mark ${kpi.label} as not applicable`}
                    id={`btn-scorecard-na-${kpi.key}`}
                  >
                    N/A
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Optional Daily Reflection / Micro-audit */}
      <div className="mt-3.5 pt-3 border-t border-[#EFE9DC]">
        <label htmlFor="kpi-reflection-input" className="block text-[10px] font-mono-code uppercase tracking-wider text-[#7A746B] mb-1">
          Daily Audit & Reflection Note
        </label>
        <input
          id="kpi-reflection-input"
          type="text"
          value={scorecard.customReflection || ''}
          onChange={(e) =>
            onUpdateScorecard({
              ...scorecard,
              customReflection: e.target.value,
            })
          }
          placeholder="Daily closure note: What worked? What friction or distraction occurred?"
          className="w-full text-xs p-2.5 rounded-xl border border-[#DDD5C5] bg-[#FBF9F5] text-[#1E2022] placeholder:text-[#9C9488] focus:outline-none focus:ring-1 focus:ring-[#1E2022]"
        />
      </div>
    </div>
  );
};
