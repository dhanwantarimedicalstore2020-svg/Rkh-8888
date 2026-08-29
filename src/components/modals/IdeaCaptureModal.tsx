import React, { useState, useEffect } from 'react';
import { Lightbulb, Sparkles, X, Check, Tag, MapPin, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { IdeaItem, IdeaPriority, IdeaStatus } from '../../types';
import { formatLocalISODate, formatReadableDate, getISOWeek, getTodayDateString } from '../../utils/dateUtils';
import { upsertIdea } from '../../services/storageService';

interface IdeaCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveIdea?: (idea: IdeaItem) => void;
  currentDateStr: string;
}

const PRESET_TAGS = [
  'Pharma',
  'Healthcare',
  'Technology',
  'Education',
  'Business',
  'Manufacturing',
  'Agriculture',
  'Consumer',
  'Operations',
  'Other',
];

export const IdeaCaptureModal: React.FC<IdeaCaptureModalProps> = ({
  isOpen,
  onClose,
  onSaveIdea,
  currentDateStr,
}) => {
  // Required core observation fields
  const [problem, setProblem] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [currentSolution, setCurrentSolution] = useState('');
  const [imperfection, setImperfection] = useState('');
  const [possibleSolution, setPossibleSolution] = useState('');

  // Optional fields
  const [title, setTitle] = useState('');
  const [locationContext, setLocationContext] = useState('');
  const [priority, setPriority] = useState<IdeaPriority>('Medium');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Observation', 'Pharma']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [notes, setNotes] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset form whenever modal opens & bind Escape key
  useEffect(() => {
    if (isOpen) {
      setProblem('');
      setTargetAudience('');
      setCurrentSolution('');
      setImperfection('');
      setPossibleSolution('');
      setTitle('');
      setLocationContext('');
      setPriority('Medium');
      setSelectedTags(['Observation', 'Pharma']);
      setCustomTagInput('');
      setNotes('');
      setShowOptionalFields(false);
      setErrorMessage('');

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

  const targetDate = currentDateStr || getTodayDateString();
  const weekInfo = getISOWeek(targetDate);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customTagInput.trim()) {
      e.preventDefault();
      const newTag = customTagInput.trim();
      if (!selectedTags.includes(newTag)) {
        setSelectedTags([...selectedTags, newTag]);
      }
      setCustomTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem.trim() && !title.trim()) {
      setErrorMessage('Please describe the problem or friction observed to capture this idea.');
      return;
    }

    try {
      const now = new Date();
      const timeCaptured = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const computedTitle = title.trim() || problem.trim().slice(0, 45) + (problem.trim().length > 45 ? '...' : '');

      const newIdea: Partial<IdeaItem> & { problemObserved: string } = {
        title: computedTitle,
        problemObserved: problem.trim(),
        targetAudience: targetAudience.trim() || 'General demographic / Specific industry actors',
        currentSolution: currentSolution.trim() || 'Manual status quo or informal workaround',
        imperfection: imperfection.trim() || 'High friction, latency, excessive cost, or error-prone',
        possibleSolution: possibleSolution.trim() || 'Targeted solution hypothesis',
        locationContext: locationContext.trim() || undefined,
        priority,
        status: 'OBSERVED' as IdeaStatus,
        tags: selectedTags.length > 0 ? selectedTags : ['Observation'],
        notes: notes.trim() || undefined,
        dateCaptured: targetDate,
        timeCaptured,
        dailyRecordDate: targetDate,
        isoWeek: weekInfo.weekNumber,
        isoYear: weekInfo.year,
        isArchived: false,
      };

      const saved = upsertIdea(newIdea);
      if (onSaveIdea) {
        onSaveIdea(saved);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage('Failed to save idea: ' + (err?.message || 'Storage error'));
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1E2022]/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        className="bg-[#FBF9F5] border border-[#E2D8C3] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="idea-capture-modal-title"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 bg-[#F2ECE1] border-b border-[#E2D8C3] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#5B21B6] text-[#FBF9F5] shadow-xs">
              <Lightbulb className="w-4 h-4 text-[#FDE68A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="idea-capture-modal-title" className="font-slab font-bold text-base sm:text-lg text-[#1E2022]">
                  Quick Idea Capture
                </h2>
                <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-md bg-[#EDE4D3] text-[#5B21B6] border border-[#DDD3BF]">
                  30–60s Protocol
                </span>
              </div>
              <p className="text-xs text-[#7A746B] font-medium">
                Log real-world friction → Preserved for {formatReadableDate(targetDate)} (Week {weekInfo.weekNumber})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7A746B] hover:text-[#1E2022] hover:bg-[#E4DAC5] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner if needed */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          
          {/* 1. Problem Observed (Essential) */}
          <div>
            <label htmlFor="capture-problem" className="block font-semibold text-[#1E2022] mb-1">
              1. Problem / Friction Observed <span className="text-red-500">*</span>
            </label>
            <textarea
              id="capture-problem"
              required
              rows={2}
              value={problem}
              onChange={(e) => {
                setProblem(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="What friction, broken workflow, high expense, or customer pain did you notice today?"
              className="w-full p-2.5 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] text-[#1E2022] focus:outline-hidden focus:ring-2 focus:ring-[#5B21B6] transition-all"
            />
          </div>

          {/* 2. Who has this problem & Current Workaround */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="capture-target-audience" className="block font-semibold text-[#1E2022] mb-1">
                2. Who Has This Problem?
              </label>
              <input
                id="capture-target-audience"
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. Retail pharmacists, students, lab staff, patients"
                className="w-full p-2.5 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] text-[#1E2022] focus:outline-hidden focus:ring-2 focus:ring-[#5B21B6]"
              />
            </div>
            <div>
              <label htmlFor="capture-current-solution" className="block font-semibold text-[#1E2022] mb-1">
                3. Current Workaround
              </label>
              <input
                id="capture-current-solution"
                type="text"
                value={currentSolution}
                onChange={(e) => setCurrentSolution(e.target.value)}
                placeholder="How is it solved or tolerated today?"
                className="w-full p-2.5 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] text-[#1E2022] focus:outline-hidden focus:ring-2 focus:ring-[#5B21B6]"
              />
            </div>
          </div>

          {/* 4. Why is current solution imperfect? */}
          <div>
            <label htmlFor="capture-imperfection" className="block font-semibold text-[#1E2022] mb-1">
              4. Why Is Current Workaround Imperfect?
            </label>
            <input
              id="capture-imperfection"
              type="text"
              value={imperfection}
              onChange={(e) => setImperfection(e.target.value)}
              placeholder="e.g. Slow manual logging, high error rate, 40% margin loss, cumbersome interface"
              className="w-full p-2.5 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] text-[#1E2022] focus:outline-hidden focus:ring-2 focus:ring-[#5B21B6]"
            />
          </div>

          {/* 5. Possible Solution / Venture Hypothesis */}
          <div>
            <label htmlFor="capture-solution" className="block font-semibold text-[#1E2022] mb-1">
              5. Possible Solution / Venture Hypothesis
            </label>
            <textarea
              id="capture-solution"
              rows={2}
              value={possibleSolution}
              onChange={(e) => setPossibleSolution(e.target.value)}
              placeholder="What lightweight software, service, product, or workflow could resolve this?"
              className="w-full p-2.5 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] text-[#1E2022] focus:outline-hidden focus:ring-2 focus:ring-[#5B21B6]"
            />
          </div>

          {/* Tags Preset Selector */}
          <div>
            <label className="block font-semibold text-[#1E2022] mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-[#5B21B6]" />
                <span>Domain / Industry Tags</span>
              </span>
              <span className="text-[10px] text-[#7A746B]">Click to toggle</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono-code transition-all ${
                      isSelected
                        ? 'bg-[#5B21B6] text-[#FBF9F5] font-semibold shadow-xs'
                        : 'bg-[#F2ECE1] text-[#635E55] hover:bg-[#E5DEC9] border border-[#DDD5C5]'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Custom tag input */}
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={handleAddCustomTag}
                placeholder="Add custom tag (Press Enter)..."
                className="p-1.5 px-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-xs font-mono-code text-[#1E2022] w-64"
              />
              {selectedTags.filter((t) => !PRESET_TAGS.includes(t)).map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-md bg-[#EDE4D3] text-[#5B21B6] text-xs font-mono-code flex items-center gap-1 border border-[#DDD3BF]"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => toggleTag(t)}
                    className="hover:text-red-600 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Collapsible Optional Section (Title, Priority, Context, Notes) */}
          <div className="pt-2 border-t border-[#EFE9DC]">
            <button
              type="button"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className="text-xs font-semibold text-[#5B21B6] hover:text-[#4C1D95] flex items-center gap-1 py-1"
            >
              <span>{showOptionalFields ? 'Hide Optional Details' : '+ Add Title, Priority, Context & Notes'}</span>
              {showOptionalFields ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showOptionalFields && (
              <div className="mt-3 space-y-3 p-3.5 bg-[#F4EFE6]/60 rounded-xl border border-[#E2D8C3] animate-in fade-in">
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label htmlFor="capture-title" className="block font-semibold text-[#1E2022] mb-1">
                      Idea Title (Optional)
                    </label>
                    <input
                      id="capture-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Real-Time Pharmacy Stock Scanner"
                      className="w-full p-2 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-xs text-[#1E2022]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1E2022] mb-1">
                      Initial Priority
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['Low', 'Medium', 'High'] as IdeaPriority[]).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`py-1.5 rounded-lg text-xs font-mono-code font-semibold transition-all ${
                            priority === p
                              ? p === 'High'
                                ? 'bg-[#DC2626] text-white'
                                : p === 'Medium'
                                ? 'bg-[#2563EB] text-white'
                                : 'bg-[#4B5563] text-white'
                              : 'bg-[#FFFFFF] text-[#635E55] border border-[#DDD5C5]'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="capture-location" className="block font-semibold text-[#1E2022] mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#B45309]" />
                    <span>Location / Context</span>
                  </label>
                  <input
                    id="capture-location"
                    type="text"
                    value={locationContext}
                    onChange={(e) => setLocationContext(e.target.value)}
                    placeholder="e.g. Retail pharmacy counter, college chemistry lab, commute train"
                    className="w-full p-2 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-xs text-[#1E2022]"
                  />
                </div>

                <div>
                  <label htmlFor="capture-notes" className="block font-semibold text-[#1E2022] mb-1">
                    Additional Context / Observations
                  </label>
                  <textarea
                    id="capture-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any specific numbers, quotes, or initial impressions..."
                    className="w-full p-2 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-xs text-[#1E2022]"
                  />
                </div>

              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-between border-t border-[#E2D8C3]">
            <div className="text-[11px] font-mono-code text-[#7A746B]">
              Date: <span className="font-bold text-[#1E2022]">{targetDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-[#635E55] hover:bg-[#EAE4D6] transition-colors text-xs font-mono-code"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-[#FBF9F5] text-xs font-mono-code font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                id="btn-save-idea-vault"
              >
                <Check className="w-4 h-4" />
                <span>Save to Idea Vault</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
