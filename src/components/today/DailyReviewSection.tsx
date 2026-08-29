import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Edit,
  Flame,
  Lightbulb,
  ListTodo,
  Moon,
  RotateCcw,
  Save,
  Shield,
  Sparkles,
} from 'lucide-react';
import { DailyRecord } from '../../types';
import { calculateScorecardMetrics, calculateTaskMetrics } from '../../utils/metricsUtils';
import { resetDateScorecard } from '../../services/storageService';

interface DailyReviewSectionProps {
  record: DailyRecord;
  onUpdateRecord: (updated: DailyRecord) => void;
  onOpenQuickIdea: () => void;
  onNavigateTab: (tab: any) => void;
}

export const DailyReviewSection: React.FC<DailyReviewSectionProps> = ({
  record,
  onUpdateRecord,
  onOpenQuickIdea,
  onNavigateTab,
}) => {
  const [dailyNotes, setDailyNotes] = useState<string>(record.generalDayNotes || '');
  const [tomorrowPriority, setTomorrowPriority] = useState<string>(record.tomorrowPriority || '');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveNoteSuccess, setSaveNoteSuccess] = useState(false);

  // Synchronize internal state when record date changes
  React.useEffect(() => {
    setDailyNotes(record.generalDayNotes || '');
    setTomorrowPriority(record.tomorrowPriority || '');
  }, [record.date, record.generalDayNotes, record.tomorrowPriority]);

  const taskMetrics = calculateTaskMetrics(record.items || []);
  const kpiMetrics = calculateScorecardMetrics(record.scorecard);

  const handleSaveNotes = () => {
    const updated: DailyRecord = {
      ...record,
      generalDayNotes: dailyNotes.trim() || undefined,
      tomorrowPriority: tomorrowPriority.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };
    onUpdateRecord(updated);
    setSaveNoteSuccess(true);
    setTimeout(() => setSaveNoteSuccess(false), 1500);
  };

  const handleResetThisDateScorecard = () => {
    const updated = resetDateScorecard(record.date);
    onUpdateRecord(updated);
    setShowResetConfirm(false);
  };

  return (
    <div
      id="daily-review-shutdown-experience"
      className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-4 sm:p-6 shadow-xs space-y-5"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#EFE9DC] gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#1E2022] text-[#FBF9F5]">
            <Moon className="w-4 h-4 text-[#FDE68A]" />
          </div>
          <div>
            <h3 className="font-slab font-bold text-base sm:text-lg text-[#1E2022]">
              Daily Review & Shutdown Protocol
            </h3>
            <p className="text-xs text-[#7A746B]">
              Close the day, audit execution metrics, and secure tomorrow's priority
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Reset Scorecard for THIS date only button */}
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-2.5 py-1.5 rounded-xl bg-[#F8F5EE] hover:bg-[#FEE2E2] text-[#991B1B] text-xs font-mono-code font-medium flex items-center gap-1.5 transition-colors border border-[#DDD5C5]"
            title={`Reset scorecard for ${record.date} only`}
            id="btn-reset-date-scorecard"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Scorecard (This Date Only)</span>
          </button>
        </div>
      </div>

      {/* Strict Dual Metric Summary (Never Merged!) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        
        {/* Metric A: Schedule Completion */}
        <div className="p-3.5 rounded-xl bg-[#FBF9F5] border border-[#EAE4D6]">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-mono-code font-bold uppercase text-[#166534] flex items-center gap-1 text-[11px]">
              <ListTodo className="w-3.5 h-3.5" />
              Schedule Execution
            </span>
            <span className="font-mono-code font-bold text-xs text-[#1E2022]">
              {taskMetrics.completedCount} / {taskMetrics.applicableCount} Tasks ({taskMetrics.percentage}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#E5DEC9] overflow-hidden">
            <div
              className="h-full bg-[#166534] transition-all rounded-full"
              style={{ width: `${Math.min(100, taskMetrics.percentage)}%` }}
            />
          </div>
          <div className="mt-2 text-[11px] text-[#7A746B] flex items-center justify-between font-mono-code">
            <span>Completed: {taskMetrics.completedCount}</span>
            <span>Skipped: {taskMetrics.skippedCount}</span>
            <span>Deferred: {taskMetrics.deferredCount}</span>
          </div>
        </div>

        {/* Metric B: 7-Point KPI Completion */}
        <div className="p-3.5 rounded-xl bg-[#FBF9F5] border border-[#EAE4D6]">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-mono-code font-bold uppercase text-[#C2410C] flex items-center gap-1 text-[11px]">
              <Flame className="w-3.5 h-3.5" />
              Tonight's KPI Scorecard
            </span>
            <span className="font-mono-code font-bold text-xs text-[#1E2022]">
              {kpiMetrics.completedCount} / {kpiMetrics.applicableCount} KPIs ({kpiMetrics.percentage}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#E5DEC9] overflow-hidden">
            <div
              className="h-full bg-[#C2410C] transition-all rounded-full"
              style={{ width: `${Math.min(100, kpiMetrics.percentage)}%` }}
            />
          </div>
          <div className="mt-2 text-[11px] text-[#7A746B] flex items-center justify-between font-mono-code">
            <span>Completed: {kpiMetrics.completedCount} / 7</span>
            <span>Pending: {kpiMetrics.pendingCount}</span>
            {kpiMetrics.naCount > 0 && <span>Exempt (N/A): {kpiMetrics.naCount}</span>}
          </div>
        </div>

      </div>

      {/* Daily Notes & Tomorrow's Priority Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        
        {/* Tomorrow's Priority (Section 26) */}
        <div>
          <label
            htmlFor="tomorrow-priority-input"
            className="block font-semibold text-xs text-[#1E2022] mb-1.5 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
            <span>Tomorrow's Core Priority (Shutdown Preparation)</span>
          </label>
          <textarea
            id="tomorrow-priority-input"
            rows={3}
            value={tomorrowPriority}
            onChange={(e) => setTomorrowPriority(e.target.value)}
            placeholder="e.g. 1. Complete Bio-chem practical calculation, 2. Organic Chemistry Unit 3 PYQs, 3. 5k Running."
            className="w-full p-2.5 rounded-xl border border-[#DDD5C5] bg-[#FBF9F5] text-xs text-[#1E2022] focus:outline-hidden focus:border-[#1E2022] focus:bg-[#FFFFFF] transition-all"
          />
          <p className="text-[10px] text-[#7A746B] mt-1 font-mono-code">
            Pre-decide top anchors to eliminate morning friction.
          </p>
        </div>

        {/* Daily Notes & Friction Observations (Section 25) */}
        <div>
          <label
            htmlFor="daily-notes-input"
            className="block font-semibold text-xs text-[#1E2022] mb-1.5 flex items-center gap-1.5"
          >
            <ClipboardList className="w-3.5 h-3.5 text-[#4A453E]" />
            <span>Daily Execution Notes & Friction Logs</span>
          </label>
          <textarea
            id="daily-notes-input"
            rows={3}
            value={dailyNotes}
            onChange={(e) => setDailyNotes(e.target.value)}
            placeholder="e.g. College practical ran 30 min late; shifted revision to flexible window."
            className="w-full p-2.5 rounded-xl border border-[#DDD5C5] bg-[#FBF9F5] text-xs text-[#1E2022] focus:outline-hidden focus:border-[#1E2022] focus:bg-[#FFFFFF] transition-all"
          />
          <p className="text-[10px] text-[#7A746B] mt-1 font-mono-code">
            Notes strictly belong to this date's permanent snapshot.
          </p>
        </div>

      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#EAE4D6]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenQuickIdea}
            className="px-3.5 py-2 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-[#FBF9F5] text-xs font-mono-code font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            id="btn-review-capture-idea"
          >
            <Lightbulb className="w-3.5 h-3.5 text-[#FDE68A]" />
            <span>5-Min Idea Capture</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('reviews')}
            className="px-3 py-2 rounded-xl bg-[#F2ECE1] hover:bg-[#E5DEC9] text-[#1E2022] text-xs font-mono-code font-medium flex items-center gap-1 transition-colors border border-[#DDD5C5]"
          >
            <span>Multi-Tier Reviews</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#7A746B]" />
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {saveNoteSuccess && (
            <span className="text-xs text-[#166534] font-mono-code font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved!
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveNotes}
            className="px-4 py-2 rounded-xl bg-[#1E2022] hover:bg-[#33373B] text-[#FBF9F5] text-xs font-mono-code font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            id="btn-save-daily-notes"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Notes & Priorities</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Resetting This Specific Date's Scorecard */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#1E2022]/70 backdrop-blur-xs animate-in fade-in"
          role="alertdialog"
          aria-labelledby="reset-scorecard-dialog-title"
        >
          <div className="bg-[#FFFFFF] border border-[#FECACA] rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#FEE2E2] text-[#DC2626] shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 id="reset-scorecard-dialog-title" className="font-slab font-bold text-base text-[#1E2022]">
                  Reset Scorecard for {record.date}?
                </h3>
                <p className="text-xs text-[#635E55] mt-1 leading-relaxed">
                  This will reset all 7 KPI items on <strong className="font-semibold text-[#1E2022]">{record.weekday}, {record.date}</strong> back to pending.
                </p>
                <div className="mt-2 p-2.5 rounded-lg bg-[#F8F5EE] border border-[#E2D8C3] text-[11px] text-[#4A453E] space-y-1 font-mono-code">
                  <div className="text-[#166534] font-semibold">✓ ONLY {record.date} will be reset.</div>
                  <div className="text-[#635E55]">✓ All other days and weeks remain untouched.</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAE4D6]">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#635E55] hover:bg-[#EFE9DC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetThisDateScorecard}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#DC2626] text-[#FFFFFF] hover:bg-[#B91C1C]"
                id="btn-confirm-reset-scorecard"
              >
                Reset This Date
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
