import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  FlaskConical,
  HelpCircle,
  Lightbulb,
  Plus,
  Save,
  Sparkles,
  X,
} from 'lucide-react';
import {
  ExperimentNextAction,
  ExperimentOutcome,
  IdeaExperimentRecord,
  IdeaItem,
} from '../../types';
import { addExperimentToIdea, formatINR, loadIdeas } from '../../services/storageService';
import { getTodayDateString } from '../../utils/dateUtils';

interface QuickExperimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExperimentLogged: (updatedIdea: IdeaItem) => void;
  defaultIdeaId?: string;
}

export const QuickExperimentModal: React.FC<QuickExperimentModalProps> = ({
  isOpen,
  onClose,
  onExperimentLogged,
  defaultIdeaId,
}) => {
  const [ideas] = useState<IdeaItem[]>(() => {
    const all = loadIdeas();
    return all.filter((i) => !i.isArchived && i.status !== 'ARCHIVED');
  });

  const [selectedIdeaId, setSelectedIdeaId] = useState<string>(
    defaultIdeaId || (ideas.find((i) => i.isFocusIdea)?.id || ideas[0]?.id || '')
  );

  const [objective, setObjective] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [method, setMethod] = useState('');
  const [costINR, setCostINR] = useState<number | string>(0);
  const [actualTime, setActualTime] = useState('1.5 hours');
  const [dateConducted, setDateConducted] = useState(getTodayDateString());
  const [result, setResult] = useState<ExperimentOutcome>('Success');
  const [learning, setLearning] = useState('');
  const [nextAction, setNextAction] = useState<ExperimentNextAction>('Continue');

  React.useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeIdea = ideas.find((i) => i.id === selectedIdeaId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIdeaId || !objective.trim() || !learning.trim()) return;

    const updated = addExperimentToIdea(selectedIdeaId, {
      objective: objective.trim(),
      hypothesis: hypothesis.trim() || activeIdea?.possibleSolution || 'Hypothesis test',
      method: method.trim() || 'Sunday Build Session',
      costINR: Number(costINR) || 0,
      actualTime: actualTime.trim() || undefined,
      dateConducted: dateConducted || getTodayDateString(),
      result,
      learning: learning.trim(),
      nextAction,
    });

    if (updated) {
      onExperimentLogged(updated);
      onClose();
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#1E2022]/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        className="bg-[#FBF9F5] border border-[#E2D8C3] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#ECFDF5] border-b border-[#A7F3D0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#047857] text-[#FFFFFF] shadow-xs">
              <FlaskConical className="w-5 h-5 text-[#A7F3D0]" />
            </div>
            <div>
              <span className="text-[10px] font-mono-code font-bold uppercase bg-[#A7F3D0]/60 text-[#065F46] px-2 py-0.5 rounded-md border border-[#6EE7B7]">
                Sunday 3:00–4:30 PM Protocol
              </span>
              <h3 className="font-slab font-bold text-sm sm:text-base text-[#1E2022] mt-0.5">
                Log Experiment & Empirical Result
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7A746B] hover:text-[#1E2022] hover:bg-[#E4DAC5]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto">
          {ideas.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#7A746B]">
              No ideas available in the Idea Vault. Please log an observation first.
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#1E2022] mb-1">
                  Target Idea / Venture *
                </label>
                <select
                  value={selectedIdeaId}
                  onChange={(e) => setSelectedIdeaId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-[#FFFFFF] border border-[#DDD5C5] text-[#1E2022]"
                >
                  {ideas.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.isFocusIdea ? '⭐️ [FOCUS] ' : ''}
                      {i.title} ({i.status})
                    </option>
                  ))}
                </select>
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
                    placeholder="e.g. Test paper formulation order sheet with 2 clerks"
                    className="w-full text-xs p-2 rounded-lg bg-[#FFFFFF] border border-[#DDD5C5] text-[#1E2022]"
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
                    className="w-full text-xs p-2 rounded-lg bg-[#FFFFFF] border border-[#DDD5C5] text-[#1E2022]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
                    Method
                  </label>
                  <input
                    type="text"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    placeholder="e.g. Field trial, mock script"
                    className="w-full text-xs p-2 rounded-lg bg-[#FFFFFF] border border-[#DDD5C5] text-[#1E2022]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
                    Cost in INR (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={costINR}
                    onChange={(e) => setCostINR(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-[#FFFFFF] border border-[#DDD5C5] text-[#1E2022]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
                    Time Spent
                  </label>
                  <input
                    type="text"
                    value={actualTime}
                    onChange={(e) => setActualTime(e.target.value)}
                    placeholder="e.g. 1.5 hours"
                    className="w-full text-xs p-2 rounded-lg bg-[#FFFFFF] border border-[#DDD5C5] text-[#1E2022]"
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
                    className="w-full text-xs p-2 rounded-lg bg-[#FFFFFF] border border-[#DDD5C5] text-[#1E2022]"
                  >
                    <option value="Success">Success (Hypothesis confirmed)</option>
                    <option value="Partial success">Partial Success (Mixed signals)</option>
                    <option value="Failure">Failure (Valuable disproving data!)</option>
                    <option value="Inconclusive">Inconclusive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
                    Next Action *
                  </label>
                  <select
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value as ExperimentNextAction)}
                    className="w-full text-xs p-2 rounded-lg bg-[#FFFFFF] border border-[#DDD5C5] text-[#1E2022]"
                  >
                    <option value="Continue">Continue & Scale</option>
                    <option value="Modify">Modify Single Variable & Retest</option>
                    <option value="Retest">Retest</option>
                    <option value="Research more">Research More</option>
                    <option value="Pause">Pause</option>
                    <option value="Archive">Archive Idea</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
                  Key Learning / Insight *
                </label>
                <textarea
                  rows={2}
                  required
                  value={learning}
                  onChange={(e) => setLearning(e.target.value)}
                  placeholder="What did you learn? Remember: failure is data."
                  className="w-full text-xs p-2.5 rounded-lg bg-[#FFFFFF] border border-[#DDD5C5] text-[#1E2022]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#F2ECE1]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] text-xs font-mono-code text-[#4A453E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-[#FFFFFF] text-xs font-mono-code font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Experiment</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
