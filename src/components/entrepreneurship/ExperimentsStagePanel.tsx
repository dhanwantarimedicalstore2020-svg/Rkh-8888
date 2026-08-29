import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  FileCheck,
  FlaskConical,
  HelpCircle,
  History,
  Info,
  Lightbulb,
  Plus,
  RotateCcw,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import {
  ExperimentNextAction,
  ExperimentOutcome,
  IdeaExperimentRecord,
  IdeaItem,
} from '../../types';
import { formatINR } from '../../services/storageService';
import { getTodayDateString } from '../../utils/dateUtils';

interface ExperimentsStagePanelProps {
  idea: IdeaItem;
  onAddExperiment: (experiment: Omit<IdeaExperimentRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteExperiment?: (experimentId: string) => void;
}

const OUTCOME_CONFIG: Record<ExperimentOutcome, { label: string; bg: string; text: string; border: string }> = {
  Success: { label: 'Success', bg: 'bg-[#ECFDF5]', text: 'text-[#047857]', border: 'border-[#A7F3D0]' },
  'Partial success': { label: 'Partial Success', bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]', border: 'border-[#FDE68A]' },
  Failure: { label: 'Failure (Valuable Data)', bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]', border: 'border-[#FECACA]' },
  Inconclusive: { label: 'Inconclusive', bg: 'bg-[#F3F4F6]', text: 'text-[#4B5563]', border: 'border-[#E5E7EB]' },
};

const NEXT_ACTION_CONFIG: Record<ExperimentNextAction, { label: string; bg: string; text: string }> = {
  Continue: { label: 'Continue & Scale', bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]' },
  Modify: { label: 'Modify Variable', bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]' },
  Retest: { label: 'Retest Same Condition', bg: 'bg-[#EFF6FF]', text: 'text-[#1D4ED8]' },
  'Research more': { label: 'Research More', bg: 'bg-[#F3E8FF]', text: 'text-[#7E22CE]' },
  Pause: { label: 'Pause / Hold', bg: 'bg-[#F3F4F6]', text: 'text-[#4B5563]' },
  Archive: { label: 'Archive Idea (Failed Hypothesis)', bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]' },
};

export const ExperimentsStagePanel: React.FC<ExperimentsStagePanelProps> = ({
  idea,
  onAddExperiment,
  onDeleteExperiment,
}) => {
  const experiments = Array.isArray(idea.experiments) ? idea.experiments : [];
  const [showAddForm, setShowAddForm] = useState(experiments.length === 0);

  // Form State
  const [objective, setObjective] = useState('');
  const [hypothesis, setHypothesis] = useState(
    idea.validationRecord?.hypothesis ||
    `If we test ${idea.possibleSolution || 'this prototype'}, then target users will achieve positive outcome.`
  );
  const [method, setMethod] = useState('');
  const [costINR, setCostINR] = useState<number | string>(0);
  const [timeRequiredHours, setTimeRequiredHours] = useState<number | string>('1.5');
  const [estimatedTime, setEstimatedTime] = useState('1.5 hours');
  const [actualTime, setActualTime] = useState('');
  const [dateConducted, setDateConducted] = useState(getTodayDateString());
  const [result, setResult] = useState<ExperimentOutcome>('Success');
  const [learning, setLearning] = useState('');
  const [nextAction, setNextAction] = useState<ExperimentNextAction>('Continue');
  const [notes, setNotes] = useState('');

  const [hasSavedBanner, setHasSavedBanner] = useState(false);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!objective.trim() || !learning.trim()) return;

    onAddExperiment({
      objective: objective.trim(),
      hypothesis: hypothesis.trim(),
      method: method.trim() || 'Direct User Test',
      costINR: Number(costINR) || 0,
      timeRequiredHours: Number(timeRequiredHours) || undefined,
      estimatedTime: estimatedTime.trim() || undefined,
      actualTime: actualTime.trim() || undefined,
      dateConducted: dateConducted || getTodayDateString(),
      result,
      learning: learning.trim(),
      nextAction,
      notes: notes.trim() || undefined,
    });

    // Reset
    setObjective('');
    setMethod('');
    setCostINR(0);
    setLearning('');
    setNotes('');
    setShowAddForm(false);
    setHasSavedBanner(true);
    setTimeout(() => setHasSavedBanner(false), 2500);
  };

  const totalCost = experiments.reduce((sum, exp) => sum + (exp.costINR || 0), 0);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Session Context Banner */}
      <div className="p-3 rounded-xl bg-[#ECFDF5]/60 border border-[#A7F3D0] flex items-start gap-2.5">
        <div className="p-1.5 rounded-lg bg-[#047857] text-[#FFFFFF] shrink-0 mt-0.5">
          <FlaskConical className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <div className="font-semibold text-[#065F46]">
            Stage 5: Scientific Experimentation & Historical Integrity
          </div>
          <div className="text-[#047857] mt-0.5 leading-relaxed">
            Every test is preserved permanently. Failure is not defeat — failure is empirical data that prevents wasted capital. Editing ideas never overwrites prior experiment results.
          </div>
        </div>
      </div>

      {hasSavedBanner && (
        <div className="p-2.5 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-mono-code font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          <span>New Experiment record saved and appended to permanent history.</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono-code text-[#4A453E] bg-[#FFFFFF] px-3 py-1.5 rounded-lg border border-[#E2D8C3]">
            <strong>{experiments.length}</strong> Experiments Logged
          </span>
          <span className="text-xs font-mono-code text-[#047857] bg-[#ECFDF5] px-3 py-1.5 rounded-lg border border-[#A7F3D0] font-bold">
            Total Testing Cost: {formatINR(totalCost)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3.5 py-1.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-[#FFFFFF] text-xs font-mono-code font-bold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? 'Close Logger' : 'Log New Experiment'}</span>
        </button>
      </div>

      {/* Add New Experiment Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="p-4 rounded-xl bg-[#FFFFFF] border border-[#A7F3D0] shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#F2ECE1] pb-2">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-[#047857]" />
              <h4 className="font-slab font-bold text-xs sm:text-sm text-[#1E2022]">
                Log Experiment #{experiments.length + 1}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-[#7A746B] hover:text-[#1E2022]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
                Experiment Objective *
              </label>
              <input
                type="text"
                required
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="e.g. Test if 3 pharmacists will use paper barcode sheet for 48 hours"
                className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
                Date Conducted
              </label>
              <input
                type="date"
                value={dateConducted}
                onChange={(e) => setDateConducted(e.target.value)}
                className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
              Hypothesis Tested *
            </label>
            <textarea
              rows={2}
              required
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              placeholder="What specifically did you expect would happen?"
              className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
                Testing Method
              </label>
              <input
                type="text"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                placeholder="e.g. Physical pilot, WhatsApp survey"
                className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
                Testing Cost in INR (₹)
              </label>
              <input
                type="number"
                min="0"
                value={costINR}
                onChange={(e) => setCostINR(e.target.value)}
                className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
                Time Spent (Hours)
              </label>
              <input
                type="text"
                value={actualTime || timeRequiredHours}
                onChange={(e) => setActualTime(e.target.value)}
                placeholder="e.g. 2.5 hours"
                className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
                Empirical Result *
              </label>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value as ExperimentOutcome)}
                className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022]"
              >
                <option value="Success">Success (Hypothesis confirmed)</option>
                <option value="Partial success">Partial Success (Mixed signals)</option>
                <option value="Failure">Failure (Hypothesis disproved — Good data!)</option>
                <option value="Inconclusive">Inconclusive</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
                Decided Next Action *
              </label>
              <select
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value as ExperimentNextAction)}
                className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022]"
              >
                <option value="Continue">Continue & Scale to Next Test</option>
                <option value="Modify">Modify Single Variable & Retest</option>
                <option value="Retest">Retest under same conditions</option>
                <option value="Research more">Research More Context</option>
                <option value="Pause">Pause / Hold</option>
                <option value="Archive">Archive Idea (Hypothesis decisively failed)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
              Key Learning & Insight (The True Yield) *
            </label>
            <textarea
              rows={2}
              required
              value={learning}
              onChange={(e) => setLearning(e.target.value)}
              placeholder="What fundamental truth or user behavior was learned from this test?"
              className="w-full text-xs p-2.5 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3.5 py-1.5 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] text-xs font-mono-code text-[#4A453E]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-[#FFFFFF] text-xs font-mono-code font-bold shadow-2xs"
            >
              Save Experiment Record
            </button>
          </div>
        </form>
      )}

      {/* Historical Experiments Log */}
      {experiments.length === 0 ? (
        <div className="p-6 rounded-xl bg-[#FFFFFF] border border-dashed border-[#DDD5C5] text-center text-xs text-[#7A746B] space-y-1">
          <FlaskConical className="w-6 h-6 text-[#9C9487] mx-auto mb-1" />
          <p className="font-semibold text-[#1E2022]">No Experiments Conducted Yet</p>
          <p>Click "Log New Experiment" above to record your first scientific market or product test.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {experiments.map((exp, idx) => {
            const outConf = OUTCOME_CONFIG[exp.result] || OUTCOME_CONFIG.Inconclusive;
            const nextConf = NEXT_ACTION_CONFIG[exp.nextAction] || NEXT_ACTION_CONFIG.Continue;

            return (
              <div
                key={exp.id || idx}
                className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E2D8C3] shadow-2xs space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#F2ECE1] pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono-code font-bold text-xs px-2 py-0.5 rounded bg-[#1E2022] text-[#FFFFFF]">
                      Experiment #{idx + 1}
                    </span>
                    <span className={`text-[10px] font-mono-code font-bold px-2 py-0.5 rounded border ${outConf.bg} ${outConf.text} ${outConf.border}`}>
                      {outConf.label}
                    </span>
                    <span className={`text-[10px] font-mono-code font-semibold px-2 py-0.5 rounded ${nextConf.bg}`}>
                      Next: {nextConf.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-mono-code text-[#7A746B]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {exp.dateConducted}
                    </span>
                    <span className="flex items-center gap-1">
                      <Coins className="w-3 h-3 text-[#047857]" />
                      {formatINR(exp.costINR)}
                    </span>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-[#1E2022] text-xs">
                    Objective: {exp.objective}
                  </h5>
                  <p className="text-[11px] text-[#635E55] mt-0.5">
                    <strong>Hypothesis:</strong> {exp.hypothesis}
                  </p>
                </div>

                {exp.method && (
                  <div className="text-[11px] font-mono-code text-[#7A746B]">
                    Method: {exp.method} {exp.actualTime ? `• Time spent: ${exp.actualTime}` : ''}
                  </div>
                )}

                {/* Explicit Learning Highlight */}
                <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E8DFC8] space-y-1">
                  <div className="text-[10px] font-mono-code font-bold text-[#92400E] flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-[#D97706]" />
                    <span>KEY LEARNING & DATA INSIGHT</span>
                  </div>
                  <p className="text-xs text-[#1E2022] leading-relaxed">
                    {exp.learning}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
