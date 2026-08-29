import React, { useState } from 'react';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  HelpCircle,
  Info,
  Layers,
  Save,
  Sliders,
  Sparkles,
  Star,
} from 'lucide-react';
import { IdeaItem, IdeaUserScoring } from '../../types';
import { toggleFocusIdea } from '../../services/storageService';

interface IdeaScoringPanelProps {
  idea: IdeaItem;
  onSaveScoring: (scoring: IdeaUserScoring) => void;
  onToggleFocus: (isFocus: boolean) => void;
}

export const IdeaScoringPanel: React.FC<IdeaScoringPanelProps> = ({
  idea,
  onSaveScoring,
  onToggleFocus,
}) => {
  const existing = idea.userScoring || {
    problemSeverity: 5,
    frequency: 5,
    potentialValue: 5,
    easeOfTesting: 5,
    personalCapability: 5,
    marketOpportunity: 5,
    totalScore: 30,
  };

  const [problemSeverity, setProblemSeverity] = useState(existing.problemSeverity || 5);
  const [frequency, setFrequency] = useState(existing.frequency || 5);
  const [potentialValue, setPotentialValue] = useState(existing.potentialValue || 5);
  const [easeOfTesting, setEaseOfTesting] = useState(existing.easeOfTesting || 5);
  const [personalCapability, setPersonalCapability] = useState(existing.personalCapability || 5);
  const [marketOpportunity, setMarketOpportunity] = useState(existing.marketOpportunity || 5);
  const [notes, setNotes] = useState(existing.notes || '');

  const [hasSaved, setHasSaved] = useState(false);
  const [focusError, setFocusError] = useState<string | null>(null);

  const totalScore =
    problemSeverity +
    frequency +
    potentialValue +
    easeOfTesting +
    personalCapability +
    marketOpportunity;

  const handleSave = () => {
    const updated: IdeaUserScoring = {
      problemSeverity,
      frequency,
      potentialValue,
      easeOfTesting,
      personalCapability,
      marketOpportunity,
      totalScore,
      scoredAt: new Date().toISOString(),
      notes: notes.trim() || undefined,
    };

    onSaveScoring(updated);
    setHasSaved(true);
    setTimeout(() => setHasSaved(false), 2500);
  };

  const handleFocusClick = () => {
    const res = toggleFocusIdea(idea.id);
    if (!res.success) {
      setFocusError(res.message || 'Could not toggle focus idea');
      setTimeout(() => setFocusError(null), 4000);
    } else {
      setFocusError(null);
      onToggleFocus(Boolean(res.idea?.isFocusIdea));
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Strategic Focus Banner */}
      <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E2D8C3] shadow-2xs flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <Star className={`w-4 h-4 ${idea.isFocusIdea ? 'text-[#D97706] fill-[#F59E0B]' : 'text-[#9C9487]'}`} />
            <h4 className="font-slab font-bold text-xs sm:text-sm text-[#1E2022]">
              Strategic Focus Venture
            </h4>
          </div>
          <p className="text-[11px] text-[#7A746B] mt-0.5">
            Select at most 1–2 ventures for prioritized weekly research and experiment sessions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleFocusClick}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono-code font-bold flex items-center gap-1.5 transition-all shadow-xs ${
            idea.isFocusIdea
              ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] hover:bg-[#FDE68A]'
              : 'bg-[#1E2022] text-[#FFFFFF] hover:bg-[#33373B]'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>{idea.isFocusIdea ? 'Active Focus (Click to Unset)' : 'Promote to Focus Venture'}</span>
        </button>
      </div>

      {focusError && (
        <div className="p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
          <span>{focusError}</span>
        </div>
      )}

      {/* Principle Disclaimer */}
      <div className="p-3 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB] flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#6B7280] shrink-0 mt-0.5" />
        <div className="text-xs text-[#4B5563] leading-relaxed">
          <strong>Subjective Scoring Framework:</strong> These numerical ratings represent your own self-assessed estimates, not guaranteed commercial outcomes. Use this matrix to rank and prioritize what to test next.
        </div>
      </div>

      {hasSaved && (
        <div className="p-2.5 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-mono-code font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          <span>Scoring Matrix saved successfully.</span>
        </div>
      )}

      {/* 6 Criteria Sliders */}
      <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E2D8C3] shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F2ECE1] pb-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#5B21B6]" />
            <h4 className="font-slab font-bold text-xs sm:text-sm text-[#1E2022]">
              6-Dimension Viability Matrix
            </h4>
          </div>
          <div className="flex items-center gap-1.5 bg-[#F3E8FF] px-2.5 py-1 rounded-lg border border-[#DDD6FE]">
            <span className="text-[11px] font-mono-code text-[#6D28D9]">Total:</span>
            <span className="font-mono-code font-bold text-xs text-[#5B21B6]">{totalScore} / 60</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Problem Severity */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#1E2022]">1. Problem Severity</span>
              <span className="font-mono-code font-bold text-[#5B21B6]">{problemSeverity}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={problemSeverity}
              onChange={(e) => setProblemSeverity(Number(e.target.value))}
              className="w-full accent-[#5B21B6] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#7A746B] font-mono-code">
              <span>Minor annoyance (1)</span>
              <span>Severe crisis (10)</span>
            </div>
          </div>

          {/* 2. Frequency */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#1E2022]">2. Problem Frequency</span>
              <span className="font-mono-code font-bold text-[#5B21B6]">{frequency}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              className="w-full accent-[#5B21B6] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#7A746B] font-mono-code">
              <span>Once a year (1)</span>
              <span>Multiple times daily (10)</span>
            </div>
          </div>

          {/* 3. Potential Value */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#1E2022]">3. Potential Economic Value</span>
              <span className="font-mono-code font-bold text-[#5B21B6]">{potentialValue}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={potentialValue}
              onChange={(e) => setPotentialValue(Number(e.target.value))}
              className="w-full accent-[#5B21B6] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#7A746B] font-mono-code">
              <span>Negligible savings (1)</span>
              <span>Massive ROI/Margins (10)</span>
            </div>
          </div>

          {/* 4. Ease of Testing */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#1E2022]">4. Ease of Low-Cost Testing</span>
              <span className="font-mono-code font-bold text-[#5B21B6]">{easeOfTesting}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={easeOfTesting}
              onChange={(e) => setEaseOfTesting(Number(e.target.value))}
              className="w-full accent-[#5B21B6] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#7A746B] font-mono-code">
              <span>Complex clinical trials (1)</span>
              <span>Test in 24 hours (10)</span>
            </div>
          </div>

          {/* 5. Personal Capability */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#1E2022]">5. Personal & Technical Capability</span>
              <span className="font-mono-code font-bold text-[#5B21B6]">{personalCapability}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={personalCapability}
              onChange={(e) => setPersonalCapability(Number(e.target.value))}
              className="w-full accent-[#5B21B6] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#7A746B] font-mono-code">
              <span>No domain skill (1)</span>
              <span>Direct pharma/tech match (10)</span>
            </div>
          </div>

          {/* 6. Market Opportunity */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#1E2022]">6. Market Opportunity Size</span>
              <span className="font-mono-code font-bold text-[#5B21B6]">{marketOpportunity}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={marketOpportunity}
              onChange={(e) => setMarketOpportunity(Number(e.target.value))}
              className="w-full accent-[#5B21B6] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#7A746B] font-mono-code">
              <span>Niche group (1)</span>
              <span>Pan-India scale (10)</span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
            Scoring Rationale / Strategic Notes
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Why this rating? Key constraints or leverage points..."
            className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022]"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-[#FFFFFF] text-xs font-mono-code font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Scoring Matrix</span>
          </button>
        </div>
      </div>
    </div>
  );
};
