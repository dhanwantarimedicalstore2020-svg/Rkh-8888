import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  FileCheck,
  HelpCircle,
  Info,
  Layers,
  Plus,
  Save,
  Target,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import {
  IdeaItem,
  IdeaValidationRecord,
  ValidationEvidence,
  ValidationMethod,
} from '../../types';
import { getTodayDateString } from '../../utils/dateUtils';

interface ValidationStagePanelProps {
  idea: IdeaItem;
  onSaveValidation: (valRecord: IdeaValidationRecord) => void;
  onAddEvidence: (evidence: Omit<ValidationEvidence, 'id' | 'createdAt'>) => void;
}

const VALIDATION_METHODS: ValidationMethod[] = [
  'Customer interview',
  'Observation',
  'Survey',
  'Competitor research',
  'Prototype feedback',
  'Market research',
  'Desk research',
  'Other',
];

export const ValidationStagePanel: React.FC<ValidationStagePanelProps> = ({
  idea,
  onSaveValidation,
  onAddEvidence,
}) => {
  const existing = idea.validationRecord || {
    hypothesis: `We believe ${idea.targetAudience || '[Target Users]'} has ${idea.problemObserved || '[Problem]'} and will value ${idea.possibleSolution || '[Solution]'} because [Key Reason].`,
    targetUser: idea.targetAudience || '',
    problem: idea.problemObserved || '',
    evidenceNeeded: '',
    validationMethod: 'Customer interview',
    evidenceList: [],
    conclusion: 'Pending',
  };

  const [hypothesis, setHypothesis] = useState(existing.hypothesis || '');
  const [targetUser, setTargetUser] = useState(existing.targetUser || idea.targetAudience || '');
  const [problem, setProblem] = useState(existing.problem || idea.problemObserved || '');
  const [evidenceNeeded, setEvidenceNeeded] = useState(existing.evidenceNeeded || '');
  const [validationMethod, setValidationMethod] = useState<ValidationMethod>(existing.validationMethod || 'Customer interview');
  const [conclusion, setConclusion] = useState<'Validated' | 'Partially Validated' | 'Invalidated' | 'Inconclusive' | 'Pending'>(
    existing.conclusion || 'Pending'
  );
  const [resultSummary, setResultSummary] = useState(existing.resultSummary || '');

  // Add Evidence modal/drawer state
  const [showAddEvidence, setShowAddEvidence] = useState(false);
  const [newEvidenceText, setNewEvidenceText] = useState('');
  const [newSource, setNewSource] = useState('');
  const [newObservation, setNewObservation] = useState('');
  const [newResult, setNewResult] = useState('');
  const [newDate, setNewDate] = useState(getTodayDateString());

  const [hasSaved, setHasSaved] = useState(false);

  const evidenceList = Array.isArray(existing.evidenceList) ? existing.evidenceList : [];
  const hasLoggedEvidence = evidenceList.length > 0;

  const handleSaveHypothesis = () => {
    const updated: IdeaValidationRecord = {
      ...existing,
      hypothesis: hypothesis.trim(),
      targetUser: targetUser.trim(),
      problem: problem.trim(),
      evidenceNeeded: evidenceNeeded.trim(),
      validationMethod,
      conclusion,
      resultSummary: resultSummary.trim() || undefined,
      evidenceList,
      updatedAt: new Date().toISOString(),
    };

    onSaveValidation(updated);
    setHasSaved(true);
    setTimeout(() => setHasSaved(false), 2500);
  };

  const handleLogEvidenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvidenceText.trim() && !newObservation.trim()) return;

    onAddEvidence({
      evidence: newEvidenceText.trim() || newObservation.trim(),
      source: newSource.trim() || 'Direct Stakeholder',
      date: newDate || getTodayDateString(),
      observation: newObservation.trim(),
      result: newResult.trim(),
    });

    // Reset form
    setNewEvidenceText('');
    setNewSource('');
    setNewObservation('');
    setNewResult('');
    setShowAddEvidence(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Principle Banner */}
      <div className="p-3 rounded-xl bg-[#FEF3C7]/60 border border-[#FDE68A] flex items-start gap-2.5">
        <div className="p-1.5 rounded-lg bg-[#B45309] text-[#FFFFFF] shrink-0 mt-0.5">
          <Target className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <div className="font-semibold text-[#78350F]">
            Stage 3: Evidence-Based Validation
          </div>
          <div className="text-[#92400E] mt-0.5 leading-relaxed">
            Validation requires real-world data and stakeholder signals. An idea is never considered validated based on enthusiasm or subjective assumptions alone.
          </div>
        </div>
      </div>

      {hasSaved && (
        <div className="p-2.5 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-mono-code font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          <span>Validation Record saved successfully.</span>
        </div>
      )}

      {/* Hypothesis & Framework */}
      <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E2D8C3] space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <h4 className="font-slab font-bold text-xs sm:text-sm text-[#1E2022] flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-[#B45309]" />
            <span>1. Core Validation Hypothesis</span>
          </h4>
          <span className="text-[10px] font-mono-code text-[#7A746B]">
            Falsifiable Statement
          </span>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
            Standard Format: "We believe [Target User] has [Problem] and will value [Solution] because [Reason]."
          </label>
          <textarea
            rows={3}
            value={hypothesis}
            onChange={(e) => setHypothesis(e.target.value)}
            placeholder="We believe retail pharmacists in Tier 2 cities struggle with inventory expiration tracking and will value a WhatsApp batch-alert tool because they lose ₹8,000+ monthly in expired stock..."
            className="w-full text-xs p-2.5 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022] placeholder:text-[#9C9487] focus:outline-hidden focus:ring-1 focus:ring-[#B45309]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
              Target User Segment
            </label>
            <input
              type="text"
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
              placeholder="e.g. Retail Chemist owners"
              className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
              Primary Validation Method
            </label>
            <select
              value={validationMethod}
              onChange={(e) => setValidationMethod(e.target.value as ValidationMethod)}
              className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022]"
            >
              {VALIDATION_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
              Evidence Needed to Confirm
            </label>
            <input
              type="text"
              value={evidenceNeeded}
              onChange={(e) => setEvidenceNeeded(e.target.value)}
              placeholder="e.g. 5 out of 7 chemists confirm problem"
              className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleSaveHypothesis}
            className="px-3.5 py-1.5 rounded-lg bg-[#B45309] hover:bg-[#92400E] text-[#FFFFFF] text-xs font-mono-code font-bold flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Update Hypothesis</span>
          </button>
        </div>
      </div>

      {/* 2. Evidence Log */}
      <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E2D8C3] space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-slab font-bold text-xs sm:text-sm text-[#1E2022] flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#047857]" />
              <span>2. Stakeholder Evidence Log ({evidenceList.length} Recorded)</span>
            </h4>
            <p className="text-[11px] text-[#7A746B] mt-0.5">
              Document direct conversations, field observations, surveys, or competitor benchmarks.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddEvidence(!showAddEvidence)}
            className="px-3 py-1.5 rounded-lg bg-[#166534] hover:bg-[#14532D] text-[#FFFFFF] text-xs font-mono-code font-semibold flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Evidence</span>
          </button>
        </div>

        {/* Inline Add Evidence Form */}
        {showAddEvidence && (
          <form onSubmit={handleLogEvidenceSubmit} className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#166534]">New Evidence Entry</span>
              <button
                type="button"
                onClick={() => setShowAddEvidence(false)}
                className="text-[#7A746B] hover:text-[#1E2022]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-mono-code font-semibold text-[#166534] mb-0.5">
                  Source / Stakeholder *
                </label>
                <input
                  type="text"
                  required
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  placeholder="e.g. Retail Chemist in College Town (5 yrs exp)"
                  className="w-full text-xs p-2 rounded-lg bg-[#FFFFFF] border border-[#A7F3D0] text-[#1E2022]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono-code font-semibold text-[#166534] mb-0.5">
                  Date Logged
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-[#FFFFFF] border border-[#A7F3D0] text-[#1E2022]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono-code font-semibold text-[#166534] mb-0.5">
                Concrete Observation / Quotation *
              </label>
              <textarea
                rows={2}
                required
                value={newObservation}
                onChange={(e) => setNewObservation(e.target.value)}
                placeholder="What did they say or do? What fact was revealed?"
                className="w-full text-xs p-2 rounded-lg bg-[#FFFFFF] border border-[#A7F3D0] text-[#1E2022]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono-code font-semibold text-[#166534] mb-0.5">
                Evidence Finding / Signal
              </label>
              <input
                type="text"
                value={newResult}
                onChange={(e) => setNewResult(e.target.value)}
                placeholder="e.g. Confirmed: Loses ~₹5,000/mo on near-expiry medicines; currently writes in notebook"
                className="w-full text-xs p-2 rounded-lg bg-[#FFFFFF] border border-[#A7F3D0] text-[#1E2022]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddEvidence(false)}
                className="px-3 py-1.5 rounded-lg border border-[#A7F3D0] bg-[#FFFFFF] text-xs font-mono-code text-[#166534]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-[#166534] text-[#FFFFFF] text-xs font-mono-code font-bold hover:bg-[#14532D]"
              >
                Save Evidence Record
              </button>
            </div>
          </form>
        )}

        {/* Evidence List */}
        {evidenceList.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-dashed border-[#DDD5C5] text-center text-xs text-[#7A746B]">
            No evidence records documented yet. Click <strong>"Log Evidence"</strong> above to record customer interview notes or field observations.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {evidenceList.map((ev, idx) => (
              <div
                key={ev.id || idx}
                className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E8DFC8] space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-code font-bold text-[#166534] text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Evidence #{idx + 1}: {ev.source || 'Stakeholder'}</span>
                  </span>
                  <span className="text-[10px] font-mono-code text-[#7A746B] flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {ev.date}
                  </span>
                </div>
                <p className="text-[#1E2022] leading-relaxed">
                  {ev.observation || ev.evidence}
                </p>
                {ev.result && (
                  <div className="text-[11px] font-mono-code text-[#065F46] bg-[#ECFDF5] px-2 py-1 rounded border border-[#A7F3D0]">
                    Result: {ev.result}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Validation Conclusion & Safeguards */}
      <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E2D8C3] space-y-3 shadow-2xs">
        <h4 className="font-slab font-bold text-xs sm:text-sm text-[#1E2022]">
          3. Overall Validation Conclusion
        </h4>

        {!hasLoggedEvidence && (
          <div className="p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
            <div>
              <strong>Integrity Guard:</strong> You have not logged any concrete evidence records yet. An idea cannot be marked "Validated" until actual stakeholder evidence is recorded.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
              Conclusion State
            </label>
            <select
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value as any)}
              className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022]"
            >
              <option value="Pending">Pending (More evidence needed)</option>
              <option value="Partially Validated">Partially Validated (Some signal, some gaps)</option>
              <option value="Validated" disabled={!hasLoggedEvidence}>
                Validated (Evidence strongly confirms hypothesis) {!hasLoggedEvidence ? '— [Requires Evidence]' : ''}
              </option>
              <option value="Invalidated">Invalidated (Evidence disproved hypothesis — Valuable Learning!)</option>
              <option value="Inconclusive">Inconclusive (Mixed or contradictory data)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
              Summary of Findings
            </label>
            <input
              type="text"
              value={resultSummary}
              onChange={(e) => setResultSummary(e.target.value)}
              placeholder="e.g. 4/5 Chemists showed strong interest; ₹500 price point accepted"
              className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleSaveHypothesis}
            className="px-4 py-2 rounded-xl bg-[#1E2022] hover:bg-[#33373B] text-[#FFFFFF] text-xs font-mono-code font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Validation Record</span>
          </button>
        </div>
      </div>
    </div>
  );
};
