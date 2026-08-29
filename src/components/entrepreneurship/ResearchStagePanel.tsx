import React, { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  ExternalLink,
  FileText,
  HelpCircle,
  Info,
  Layers,
  Save,
  Search,
  Sparkles,
} from 'lucide-react';
import { IdeaItem, IdeaResearchRecord } from '../../types';

interface ResearchStagePanelProps {
  idea: IdeaItem;
  onSaveResearch: (research: IdeaResearchRecord) => void;
}

export const ResearchStagePanel: React.FC<ResearchStagePanelProps> = ({ idea, onSaveResearch }) => {
  const initial = idea.researchRecord || {
    whatIsKnown: '',
    whatIsUnknown: '',
    competitors: '',
    existingSolutions: idea.currentSolution || '',
    evidenceExists: '',
    assumptionsMade: '',
    marketSizeSignals: '',
  };

  const [whatIsKnown, setWhatIsKnown] = useState(initial.whatIsKnown || '');
  const [whatIsUnknown, setWhatIsUnknown] = useState(initial.whatIsUnknown || '');
  const [competitors, setCompetitors] = useState(initial.competitors || '');
  const [existingSolutions, setExistingSolutions] = useState(initial.existingSolutions || idea.currentSolution || '');
  const [evidenceExists, setEvidenceExists] = useState(initial.evidenceExists || '');
  const [assumptionsMade, setAssumptionsMade] = useState(initial.assumptionsMade || '');
  const [marketSizeSignals, setMarketSizeSignals] = useState(initial.marketSizeSignals || '');

  const [hasSaved, setHasSaved] = useState(false);

  const handleSave = () => {
    const updatedRecord: IdeaResearchRecord = {
      whatIsKnown: whatIsKnown.trim(),
      whatIsUnknown: whatIsUnknown.trim(),
      competitors: competitors.trim(),
      existingSolutions: existingSolutions.trim(),
      evidenceExists: evidenceExists.trim(),
      assumptionsMade: assumptionsMade.trim(),
      marketSizeSignals: marketSizeSignals.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    onSaveResearch(updatedRecord);
    setHasSaved(true);
    setTimeout(() => setHasSaved(false), 2500);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Session Context Banner */}
      <div className="p-3 rounded-xl bg-[#E0F2FE]/50 border border-[#BAE6FD] flex items-start gap-2.5">
        <div className="p-1.5 rounded-lg bg-[#0369A1] text-[#FFFFFF] shrink-0 mt-0.5">
          <Search className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <div className="font-semibold text-[#075985]">
            Stage 2: Structured Research Canvas
          </div>
          <div className="text-[#0369A1] mt-0.5 leading-relaxed">
            Aligned with Saturday 1:00–2:30 PM & 2:45–4:00 PM Entrepreneurship blocks. Separate verified facts from assumptions before building prototypes or spending capital.
          </div>
        </div>
      </div>

      {hasSaved && (
        <div className="p-2.5 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-mono-code font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          <span>Research Canvas saved successfully. Stage updated to RESEARCHING.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* 1. What is Known */}
        <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E2D8C3] space-y-1.5">
          <label className="block text-xs font-bold text-[#1E2022] flex items-center justify-between">
            <span>1. What is Known? (Facts & Data)</span>
            <span className="text-[10px] font-mono-code text-[#0369A1] font-normal">Verified truth</span>
          </label>
          <textarea
            rows={3}
            value={whatIsKnown}
            onChange={(e) => setWhatIsKnown(e.target.value)}
            placeholder="Verified facts, market statistics, regulatory constraints, technical realities..."
            className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022] placeholder:text-[#9C9487] focus:outline-hidden focus:ring-1 focus:ring-[#0369A1]"
          />
        </div>

        {/* 2. What is Unknown */}
        <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E2D8C3] space-y-1.5">
          <label className="block text-xs font-bold text-[#1E2022] flex items-center justify-between">
            <span>2. What is Unknown? (Gaps & Questions)</span>
            <span className="text-[10px] font-mono-code text-[#B45309] font-normal">Open mysteries</span>
          </label>
          <textarea
            rows={3}
            value={whatIsUnknown}
            onChange={(e) => setWhatIsUnknown(e.target.value)}
            placeholder="Willingness to pay, user friction depth, supplier dependencies, customer adoption rate..."
            className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022] placeholder:text-[#9C9487] focus:outline-hidden focus:ring-1 focus:ring-[#0369A1]"
          />
        </div>

        {/* 3. Competitors & Substitutes */}
        <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E2D8C3] space-y-1.5">
          <label className="block text-xs font-bold text-[#1E2022] flex items-center justify-between">
            <span>3. Who are the Competitors?</span>
            <span className="text-[10px] font-mono-code text-[#7A746B] font-normal">Direct & indirect</span>
          </label>
          <textarea
            rows={3}
            value={competitors}
            onChange={(e) => setCompetitors(e.target.value)}
            placeholder="Existing brands, incumbent vendors, Excel sheets, manual labor, indirect alternatives..."
            className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022] placeholder:text-[#9C9487] focus:outline-hidden focus:ring-1 focus:ring-[#0369A1]"
          />
        </div>

        {/* 4. Existing Solutions & Workarounds */}
        <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E2D8C3] space-y-1.5">
          <label className="block text-xs font-bold text-[#1E2022] flex items-center justify-between">
            <span>4. Existing Solutions & Workarounds</span>
            <span className="text-[10px] font-mono-code text-[#7A746B] font-normal">What they do today</span>
          </label>
          <textarea
            rows={3}
            value={existingSolutions}
            onChange={(e) => setExistingSolutions(e.target.value)}
            placeholder="How users currently solve or tolerate this problem today..."
            className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022] placeholder:text-[#9C9487] focus:outline-hidden focus:ring-1 focus:ring-[#0369A1]"
          />
        </div>

        {/* 5. What Evidence Exists */}
        <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E2D8C3] space-y-1.5">
          <label className="block text-xs font-bold text-[#1E2022] flex items-center justify-between">
            <span>5. What Evidence Already Exists?</span>
            <span className="text-[10px] font-mono-code text-[#047857] font-normal">Published signals</span>
          </label>
          <textarea
            rows={3}
            value={evidenceExists}
            onChange={(e) => setEvidenceExists(e.target.value)}
            placeholder="Articles, government reports, FDA/CDSCO notifications, forum discussions, field notes..."
            className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022] placeholder:text-[#9C9487] focus:outline-hidden focus:ring-1 focus:ring-[#0369A1]"
          />
        </div>

        {/* 6. Assumptions Made */}
        <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E2D8C3] space-y-1.5">
          <label className="block text-xs font-bold text-[#1E2022] flex items-center justify-between">
            <span>6. Critical Assumptions Made (Risks)</span>
            <span className="text-[10px] font-mono-code text-[#DC2626] font-normal">Must be tested</span>
          </label>
          <textarea
            rows={3}
            value={assumptionsMade}
            onChange={(e) => setAssumptionsMade(e.target.value)}
            placeholder="Key leaps of faith: 'Pharmacists have 10 mins spare', 'Patients will trust digital dosage'..."
            className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022] placeholder:text-[#9C9487] focus:outline-hidden focus:ring-1 focus:ring-[#0369A1]"
          />
        </div>
      </div>

      {/* Market Size & Unit Economics Signal */}
      <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E2D8C3] space-y-1.5">
        <label className="block text-xs font-bold text-[#1E2022] flex items-center justify-between">
          <span>Market Opportunity & Size Signal (Optional)</span>
          <span className="text-[10px] font-mono-code text-[#7A746B]">Macro context</span>
        </label>
        <input
          type="text"
          value={marketSizeSignals}
          onChange={(e) => setMarketSizeSignals(e.target.value)}
          placeholder="e.g. Estimated 800,000 retail chemist shops in India; ₹1,200/month addressable willingness"
          className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022] placeholder:text-[#9C9487] focus:outline-hidden focus:ring-1 focus:ring-[#0369A1]"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-[11px] font-mono-code text-[#7A746B]">
          {idea.researchRecord?.updatedAt ? `Last updated: ${new Date(idea.researchRecord.updatedAt).toLocaleDateString()}` : 'Not yet saved'}
        </span>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 rounded-xl bg-[#0369A1] hover:bg-[#075985] text-[#FFFFFF] text-xs font-mono-code font-bold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Research Record</span>
        </button>
      </div>
    </div>
  );
};
