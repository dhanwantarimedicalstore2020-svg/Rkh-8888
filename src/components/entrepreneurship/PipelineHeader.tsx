import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronRight,
  Compass,
  FileText,
  Flame,
  FlaskConical,
  Hammer,
  HelpCircle,
  Layers,
  Lightbulb,
  Search,
  Sparkles,
  Star,
  Target,
} from 'lucide-react';
import { IdeaItem, IdeaStatus } from '../../types';
import { formatINR } from '../../services/storageService';

interface PipelineHeaderProps {
  ideas: IdeaItem[];
  currentStageFilter: string;
  onSelectStage: (stage: string) => void;
  onSelectIdea: (idea: IdeaItem) => void;
}

const STAGES: {
  id: IdeaStatus;
  label: string;
  icon: React.ElementType;
  description: string;
  activeBg: string;
  activeText: string;
  activeBorder: string;
  badgeBg: string;
}[] = [
  {
    id: 'OBSERVED',
    label: '1. Observed',
    icon: Lightbulb,
    description: 'Raw friction & problems',
    activeBg: 'bg-[#F3E8FF]',
    activeText: 'text-[#6D28D9]',
    activeBorder: 'border-[#DDD6FE]',
    badgeBg: 'bg-[#DDD6FE]/60 text-[#5B21B6]',
  },
  {
    id: 'RESEARCHING',
    label: '2. Researching',
    icon: Search,
    description: 'Knowns, unknowns & competitors',
    activeBg: 'bg-[#E0F2FE]',
    activeText: 'text-[#0369A1]',
    activeBorder: 'border-[#BAE6FD]',
    badgeBg: 'bg-[#BAE6FD]/60 text-[#075985]',
  },
  {
    id: 'VALIDATING',
    label: '3. Validating',
    icon: Target,
    description: 'Hypothesis & stakeholder evidence',
    activeBg: 'bg-[#FEF3C7]',
    activeText: 'text-[#B45309]',
    activeBorder: 'border-[#FDE68A]',
    badgeBg: 'bg-[#FDE68A]/60 text-[#92400E]',
  },
  {
    id: 'PROTOTYPE',
    label: '4. Prototype',
    icon: Hammer,
    description: 'Low-cost physical/digital build',
    activeBg: 'bg-[#FFEDD5]',
    activeText: 'text-[#C2410C]',
    activeBorder: 'border-[#FED7AA]',
    badgeBg: 'bg-[#FED7AA]/60 text-[#9A3412]',
  },
  {
    id: 'EXPERIMENT',
    label: '5. Experiment',
    icon: FlaskConical,
    description: 'Testing, failure data & iterations',
    activeBg: 'bg-[#ECFDF5]',
    activeText: 'text-[#047857]',
    activeBorder: 'border-[#A7F3D0]',
    badgeBg: 'bg-[#A7F3D0]/60 text-[#065F46]',
  },
  {
    id: 'PROMISING',
    label: '6. Promising',
    icon: Award,
    description: 'Signal & high viability venture',
    activeBg: 'bg-[#FEF9C3]',
    activeText: 'text-[#A16207]',
    activeBorder: 'border-[#FEF08A]',
    badgeBg: 'bg-[#FEF08A]/60 text-[#854D0E]',
  },
  {
    id: 'BUILDING',
    label: '7. Building',
    icon: Flame,
    description: 'Active execution & deployment',
    activeBg: 'bg-[#F0FDFA]',
    activeText: 'text-[#0F766E]',
    activeBorder: 'border-[#99F6E4]',
    badgeBg: 'bg-[#99F6E4]/60 text-[#115E59]',
  },
];

export const PipelineHeader: React.FC<PipelineHeaderProps> = ({
  ideas,
  currentStageFilter,
  onSelectStage,
  onSelectIdea,
}) => {
  const activeIdeas = ideas.filter((i) => !i.isArchived && i.status !== 'ARCHIVED');
  const focusIdeas = activeIdeas.filter((i) => i.isFocusIdea);

  // Calculate stage counts
  const stageCounts = STAGES.reduce((acc, stage) => {
    acc[stage.id] = activeIdeas.filter((i) => i.status === stage.id).length;
    return acc;
  }, {} as Record<IdeaStatus, number>);

  return (
    <div className="space-y-3">
      {/* Active Focus Ventures Banner (Top 1-2 Focus Ideas) */}
      {focusIdeas.length > 0 && (
        <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-[#FEF3C7]/40 via-[#FDF8EE] to-[#FEF3C7]/30 border border-[#FDE68A] shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-[#D97706] fill-[#F59E0B]" />
              <h3 className="font-slab font-bold text-xs sm:text-sm text-[#78350F]">
                Active Focus Ventures ({focusIdeas.length}/2 Active)
              </h3>
            </div>
            <span className="text-[10px] font-mono-code text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded-md border border-[#FDE68A]">
              Top Strategic Priority
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {focusIdeas.map((fIdea) => {
              const expCount = Array.isArray(fIdea.experiments) ? fIdea.experiments.length : 0;
              const protoCount = Array.isArray(fIdea.prototypes) ? fIdea.prototypes.length : 0;
              const hasEvidence = Boolean(fIdea.validationRecord?.evidenceList && fIdea.validationRecord.evidenceList.length > 0);

              return (
                <div
                  key={fIdea.id}
                  onClick={() => onSelectIdea(fIdea)}
                  className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E8DFC8] hover:border-[#D97706] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[9px] font-mono-code font-bold px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] uppercase">
                        {fIdea.status}
                      </span>
                      {fIdea.priority === 'High' && (
                        <span className="text-[9px] font-mono-code font-bold px-1.5 py-0.5 rounded bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                          HIGH
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-xs text-[#1E2022] mt-1 line-clamp-1">
                      {fIdea.title}
                    </h4>
                    <p className="text-[11px] text-[#635E55] line-clamp-1 mt-0.5">
                      {fIdea.problemObserved}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#F2ECE1] text-[10px] font-mono-code text-[#7A746B]">
                    <div className="flex items-center gap-2">
                      <span>{protoCount} Prototypes</span>
                      <span>•</span>
                      <span>{expCount} Experiments</span>
                      {hasEvidence && (
                        <>
                          <span>•</span>
                          <span className="text-[#047857] font-semibold">Evidence Logged</span>
                        </>
                      )}
                    </div>
                    <span className="text-[#D97706] font-semibold flex items-center gap-0.5">
                      Open <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pipeline Stages Flow Visualizer */}
      <div className="p-3 sm:p-4 rounded-xl bg-[#FFFFFF] border border-[#E2D8C3] shadow-2xs">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#5B21B6]" />
            <h3 className="font-slab font-bold text-xs sm:text-sm text-[#1E2022]">
              Entrepreneurship Lifecycle Pipeline
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectStage('all')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono-code font-semibold transition-colors ${
                currentStageFilter === 'all'
                  ? 'bg-[#1E2022] text-[#FBF9F5]'
                  : 'bg-[#F2ECE1] text-[#635E55] hover:bg-[#E4DAC5]'
              }`}
            >
              Show All ({activeIdeas.length})
            </button>
          </div>
        </div>

        {/* Stages Progression Grid / Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
          {STAGES.map((stg) => {
            const Icon = stg.icon;
            const count = stageCounts[stg.id] || 0;
            const isSelected = currentStageFilter === stg.id;

            return (
              <button
                key={stg.id}
                type="button"
                onClick={() => onSelectStage(isSelected ? 'all' : stg.id)}
                className={`p-2 rounded-lg text-left transition-all border flex flex-col justify-between ${
                  isSelected
                    ? `${stg.activeBg} ${stg.activeBorder} ring-2 ring-offset-1 ring-[#5B21B6]/30 shadow-xs`
                    : 'bg-[#FAF8F5] border-[#E8DFC8] hover:bg-[#F2ECE1]'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className={`p-1 rounded-md ${isSelected ? 'bg-[#FFFFFF]/80' : 'bg-[#EAE4D6]'}`}>
                    <Icon className={`w-3 h-3 ${isSelected ? stg.activeText : 'text-[#635E55]'}`} />
                  </div>
                  <span className={`text-[10px] font-mono-code font-bold px-1.5 py-0.2 rounded ${
                    count > 0 ? stg.badgeBg : 'bg-[#EAE4D6] text-[#7A746B]'
                  }`}>
                    {count}
                  </span>
                </div>
                <div className="mt-1.5">
                  <div className={`text-[11px] font-bold leading-tight line-clamp-1 ${isSelected ? stg.activeText : 'text-[#1E2022]'}`}>
                    {stg.label}
                  </div>
                  <div className="text-[9px] text-[#7A746B] leading-tight line-clamp-1 mt-0.5">
                    {stg.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Pipeline Guidance Principle */}
        <div className="mt-2.5 pt-2 border-t border-[#F2ECE1] flex items-center justify-between text-[10px] font-mono-code text-[#7A746B]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#166534]"></span>
            <span>Observation → Idea → Research → Validation → Prototype → Experiment → Business</span>
          </span>
          <span className="hidden sm:inline text-[#92400E]">
            *Failure is data. Only progress validated ideas.
          </span>
        </div>
      </div>
    </div>
  );
};
