import React, { useState, useEffect } from 'react';
import {
  Archive,
  ArrowRight,
  Award,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  FlaskConical,
  Globe,
  Hammer,
  HelpCircle,
  Layers,
  Lightbulb,
  MapPin,
  RefreshCw,
  RotateCcw,
  Sliders,
  Sparkles,
  Star,
  Tag,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import {
  IdeaExperimentRecord,
  IdeaItem,
  IdeaPriority,
  IdeaPrototypeRecord,
  IdeaQualityQuestionnaire,
  IdeaResearchRecord,
  IdeaStatus,
  IdeaUserScoring,
  IdeaValidationRecord,
  ValidationEvidence,
} from '../../types';
import { formatReadableDate, formatShortDate, getISOWeek } from '../../utils/dateUtils';
import {
  addExperimentToIdea,
  addPrototypeToIdea,
  addValidationEvidenceToIdea,
  archiveIdea,
  deleteIdeaPermanent,
  formatINR,
  restoreIdea,
  toggleFocusIdea,
  upsertIdea,
} from '../../services/storageService';
import { ResearchStagePanel } from '../entrepreneurship/ResearchStagePanel';
import { ValidationStagePanel } from '../entrepreneurship/ValidationStagePanel';
import { PrototypesStagePanel } from '../entrepreneurship/PrototypesStagePanel';
import { ExperimentsStagePanel } from '../entrepreneurship/ExperimentsStagePanel';
import { IdeaScoringPanel } from '../entrepreneurship/IdeaScoringPanel';

interface IdeaDetailModalProps {
  idea: IdeaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onIdeaUpdated: (updatedIdea?: IdeaItem) => void;
  initialTab?: 'details' | 'research' | 'validation' | 'prototype' | 'experiment' | 'scoring' | 'quality';
}

const ALL_STATUSES: { id: IdeaStatus; label: string; bg: string; text: string; border: string }[] = [
  { id: 'OBSERVED', label: 'Observed', bg: 'bg-[#F3E8FF]', text: 'text-[#6D28D9]', border: 'border-[#DDD6FE]' },
  { id: 'RESEARCHING', label: 'Researching', bg: 'bg-[#E0F2FE]', text: 'text-[#0369A1]', border: 'border-[#BAE6FD]' },
  { id: 'VALIDATING', label: 'Validating', bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]', border: 'border-[#FDE68A]' },
  { id: 'PROTOTYPE', label: 'Prototype', bg: 'bg-[#FFEDD5]', text: 'text-[#C2410C]', border: 'border-[#FED7AA]' },
  { id: 'EXPERIMENT', label: 'Experiment', bg: 'bg-[#ECFDF5]', text: 'text-[#047857]', border: 'border-[#A7F3D0]' },
  { id: 'PROMISING', label: 'Promising', bg: 'bg-[#FEF9C3]', text: 'text-[#A16207]', border: 'border-[#FEF08A]' },
  { id: 'BUILDING', label: 'Building', bg: 'bg-[#F0FDFA]', text: 'text-[#0F766E]', border: 'border-[#99F6E4]' },
  { id: 'ARCHIVED', label: 'Archived', bg: 'bg-[#F3F4F6]', text: 'text-[#4B5563]', border: 'border-[#E5E7EB]' },
];

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

export const IdeaDetailModal: React.FC<IdeaDetailModalProps> = ({
  idea,
  isOpen,
  onClose,
  onIdeaUpdated,
  initialTab = 'details',
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'research' | 'validation' | 'prototype' | 'experiment' | 'scoring' | 'quality'>('details');
  const [title, setTitle] = useState('');
  const [problemObserved, setProblemObserved] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [currentSolution, setCurrentSolution] = useState('');
  const [imperfection, setImperfection] = useState('');
  const [possibleSolution, setPossibleSolution] = useState('');
  const [locationContext, setLocationContext] = useState('');
  const [priority, setPriority] = useState<IdeaPriority>('Medium');
  const [status, setStatus] = useState<IdeaStatus>('OBSERVED');
  const [isFocusIdea, setIsFocusIdea] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [notes, setNotes] = useState('');

  // Quality Prompt fields
  const [qualityPrompt, setQualityPrompt] = useState<IdeaQualityQuestionnaire>({});

  const [isSavedBanner, setIsSavedBanner] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [focusError, setFocusError] = useState<string | null>(null);

  // Sync state with selected idea
  useEffect(() => {
    if (idea) {
      setTitle(idea.title || '');
      setProblemObserved(idea.problemObserved || '');
      setTargetAudience(idea.targetAudience || '');
      setCurrentSolution(idea.currentSolution || '');
      setImperfection(idea.imperfection || '');
      setPossibleSolution(idea.possibleSolution || idea.proposedVenture || '');
      setLocationContext(idea.locationContext || '');
      setPriority(idea.priority || 'Medium');
      setStatus(idea.status || 'OBSERVED');
      setIsFocusIdea(Boolean(idea.isFocusIdea));
      setTags(Array.isArray(idea.tags) ? idea.tags : ['Observation']);
      setNotes(idea.notes || '');
      setQualityPrompt(idea.qualityPrompt || {
        problemClarity: idea.problemObserved,
        whoExperiences: idea.targetAudience,
        currentWorkaround: idea.currentSolution,
        imperfectionReason: idea.imperfection,
        meaningfullyBetter: idea.possibleSolution || idea.meaningfullyBetter,
        frequency: idea.frequency,
      });
      setShowDeleteConfirm(false);
      setIsSavedBanner(false);
      if (initialTab) {
        setActiveTab(initialTab);
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [idea, initialTab, onClose]);

  if (!isOpen || !idea) return null;

  const currentStatusConfig = ALL_STATUSES.find((s) => s.id === status) || ALL_STATUSES[0];
  const weekInfo = getISOWeek(idea.dateCaptured);

  const toggleTag = (t: string) => {
    if (tags.includes(t)) {
      setTags(tags.filter((item) => item !== t));
    } else {
      setTags([...tags, t]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customTagInput.trim()) {
      e.preventDefault();
      const newTag = customTagInput.trim();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setCustomTagInput('');
    }
  };

  const handleSave = () => {
    if (!idea) return;

    const updated: Partial<IdeaItem> & { problemObserved: string } = {
      ...idea,
      title: title.trim() || idea.title || 'Observation',
      problemObserved: problemObserved.trim() || idea.problemObserved,
      targetAudience: targetAudience.trim(),
      currentSolution: currentSolution.trim(),
      imperfection: imperfection.trim(),
      possibleSolution: possibleSolution.trim(),
      locationContext: locationContext.trim() || undefined,
      priority,
      status,
      isFocusIdea,
      isArchived: status === 'ARCHIVED',
      tags: tags.length > 0 ? tags : ['Observation'],
      notes: notes.trim() || undefined,
      qualityPrompt,
      // HISTORICAL DATE IMMUTABILITY: Keep dateCaptured, createdAt untouched
      dateCaptured: idea.dateCaptured,
      createdAt: idea.createdAt,
      dailyRecordDate: idea.dailyRecordDate || idea.dateCaptured,
      isoWeek: idea.isoWeek || weekInfo.weekNumber,
      isoYear: idea.isoYear || weekInfo.year,
    };

    const saved = upsertIdea(updated);
    setIsSavedBanner(true);
    setTimeout(() => setIsSavedBanner(false), 2000);
    onIdeaUpdated(saved);
  };

  const handleToggleFocus = () => {
    if (!idea) return;
    const res = toggleFocusIdea(idea.id);
    if (!res.success) {
      setFocusError(res.message || 'Could not toggle focus state');
      setTimeout(() => setFocusError(null), 4000);
    } else {
      setFocusError(null);
      setIsFocusIdea(Boolean(res.idea?.isFocusIdea));
      onIdeaUpdated(res.idea);
    }
  };

  const handleToggleArchive = () => {
    if (!idea) return;
    if (idea.isArchived || status === 'ARCHIVED') {
      restoreIdea(idea.id, 'OBSERVED');
      setStatus('OBSERVED');
      onIdeaUpdated({ ...idea, isArchived: false, status: 'OBSERVED' });
    } else {
      archiveIdea(idea.id);
      setStatus('ARCHIVED');
      onIdeaUpdated({ ...idea, isArchived: true, status: 'ARCHIVED' });
    }
  };

  const handleDelete = () => {
    if (!idea) return;
    deleteIdeaPermanent(idea.id);
    onIdeaUpdated(undefined);
    onClose();
  };

  // Stage Panel Handlers
  const handleSaveResearch = (researchRecord: IdeaResearchRecord) => {
    const updated = upsertIdea({
      ...idea,
      researchRecord,
      status: idea.status === 'OBSERVED' ? 'RESEARCHING' : idea.status,
    });
    setStatus(updated.status);
    onIdeaUpdated(updated);
  };

  const handleSaveValidation = (validationRecord: any) => {
    const updated = upsertIdea({
      ...idea,
      validationRecord,
      status: (idea.status === 'OBSERVED' || idea.status === 'RESEARCHING') ? 'VALIDATING' : idea.status,
    });
    setStatus(updated.status);
    onIdeaUpdated(updated);
  };

  const handleAddEvidence = (evidence: Omit<ValidationEvidence, 'id' | 'createdAt'>) => {
    const updated = addValidationEvidenceToIdea(idea.id, evidence);
    if (updated) {
      setStatus(updated.status);
      onIdeaUpdated(updated);
    }
  };

  const handleAddPrototype = (proto: Omit<IdeaPrototypeRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const updated = addPrototypeToIdea(idea.id, proto);
    if (updated) {
      setStatus(updated.status);
      onIdeaUpdated(updated);
    }
  };

  const handleAddExperiment = (exp: Omit<IdeaExperimentRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const updated = addExperimentToIdea(idea.id, exp);
    if (updated) {
      setStatus(updated.status);
      onIdeaUpdated(updated);
    }
  };

  const handleSaveScoring = (userScoring: IdeaUserScoring) => {
    const updated = upsertIdea({
      ...idea,
      userScoring,
    });
    onIdeaUpdated(updated);
  };

  const expCount = Array.isArray(idea.experiments) ? idea.experiments.length : 0;
  const protoCount = Array.isArray(idea.prototypes) ? idea.prototypes.length : 0;
  const hasEvidence = Boolean(idea.validationRecord?.evidenceList && idea.validationRecord.evidenceList.length > 0);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#1E2022]/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        className="bg-[#FBF9F5] border border-[#E2D8C3] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="idea-detail-title"
      >
        {/* Header Bar */}
        <div className="px-5 sm:px-6 py-4 bg-[#F2ECE1] border-b border-[#E2D8C3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#5B21B6] text-[#FBF9F5] shadow-xs">
              <Lightbulb className="w-5 h-5 text-[#FDE68A]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-md border uppercase ${currentStatusConfig.bg} ${currentStatusConfig.text} ${currentStatusConfig.border}`}>
                  {currentStatusConfig.label}
                </span>
                <span className={`text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-md border ${
                  priority === 'High'
                    ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                    : priority === 'Medium'
                    ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                    : 'bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]'
                }`}>
                  {priority} Priority
                </span>
                {isFocusIdea && (
                  <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] flex items-center gap-1">
                    <Star className="w-3 h-3 text-[#D97706] fill-[#F59E0B]" />
                    <span>Top Focus Venture</span>
                  </span>
                )}
                <span className="text-[11px] font-mono-code text-[#7A746B] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatShortDate(idea.dateCaptured)} • Week {weekInfo.weekNumber}
                </span>
                {(idea.sourceType === 'world_scan' || idea.sourceWorldScanDate) && (
                  <span className="text-[10px] font-mono-code font-semibold px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] flex items-center gap-1">
                    <Globe className="w-3 h-3 text-[#2563EB]" />
                    <span>Source: Sunday World Scan ({idea.sourceWorldScanDate || formatShortDate(idea.dateCaptured)})</span>
                  </span>
                )}
              </div>
              <h2 id="idea-detail-title" className="font-slab font-bold text-base sm:text-lg text-[#1E2022] mt-0.5 truncate max-w-lg">
                {title || 'Observation Detail'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={handleToggleFocus}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-mono-code flex items-center gap-1 border transition-all ${
                isFocusIdea
                  ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E] font-bold shadow-2xs'
                  : 'border-[#DDD5C5] bg-[#FFFFFF] hover:bg-[#EFE9DC] text-[#4A453E]'
              }`}
              title="Promote / Unset as Top Focus Venture"
            >
              <Star className={`w-3.5 h-3.5 ${isFocusIdea ? 'text-[#D97706] fill-[#F59E0B]' : 'text-[#7A746B]'}`} />
              <span>{isFocusIdea ? 'Focus Venture' : 'Set Focus'}</span>
            </button>
            <button
              type="button"
              onClick={handleToggleArchive}
              className="px-2.5 py-1.5 rounded-xl text-xs font-mono-code flex items-center gap-1 border border-[#DDD5C5] bg-[#FFFFFF] hover:bg-[#EFE9DC] text-[#4A453E] transition-colors"
              title={idea.isArchived ? 'Restore this idea' : 'Archive this idea'}
            >
              {idea.isArchived || status === 'ARCHIVED' ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 text-[#166534]" />
                  <span>Restore</span>
                </>
              ) : (
                <>
                  <Archive className="w-3.5 h-3.5 text-[#7A746B]" />
                  <span>Archive</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#7A746B] hover:text-[#1E2022] hover:bg-[#E4DAC5] transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {focusError && (
          <div className="px-6 py-2 bg-[#FEF2F2] border-b border-[#FECACA] text-[#991B1B] text-xs font-mono-code">
            {focusError}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-6 bg-[#FFFFFF] border-b border-[#EAE4D6] flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'details'
                ? 'bg-[#1E2022] text-[#FBF9F5]'
                : 'text-[#635E55] hover:bg-[#F2ECE1]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Overview</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('research')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'research'
                ? 'bg-[#0369A1] text-[#FFFFFF]'
                : 'text-[#635E55] hover:bg-[#F2ECE1]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>2. Research Canvas</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('validation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'validation'
                ? 'bg-[#B45309] text-[#FFFFFF]'
                : 'text-[#635E55] hover:bg-[#F2ECE1]'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>3. Validation & Evidence {hasEvidence ? '•' : ''}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('prototype')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'prototype'
                ? 'bg-[#C2410C] text-[#FFFFFF]'
                : 'text-[#635E55] hover:bg-[#F2ECE1]'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>4. Prototypes ({protoCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('experiment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'experiment'
                ? 'bg-[#047857] text-[#FFFFFF]'
                : 'text-[#635E55] hover:bg-[#F2ECE1]'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>5. Experiments ({expCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scoring')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'scoring'
                ? 'bg-[#5B21B6] text-[#FFFFFF]'
                : 'text-[#635E55] hover:bg-[#F2ECE1]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Scoring (60-pt)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quality')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'quality'
                ? 'bg-[#1E2022] text-[#FBF9F5]'
                : 'text-[#635E55] hover:bg-[#F2ECE1]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Quality Sharpening</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm">
          
          {/* TAB 1: OBSERVATION DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              
              {/* Title & Status Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#1E2022] mb-1">
                    Idea Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Short descriptive concept title"
                    className="w-full p-2.5 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] text-xs font-semibold text-[#1E2022] focus:outline-hidden focus:ring-2 focus:ring-[#5B21B6]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1E2022] mb-1">
                    Lifecycle Pipeline Stage
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as IdeaStatus)}
                    className="w-full p-2.5 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] text-xs font-mono-code font-semibold text-[#1E2022] focus:outline-hidden focus:ring-2 focus:ring-[#5B21B6]"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label} ({s.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1E2022] mb-1">
                    Observation Priority
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Low', 'Medium', 'High'] as IdeaPriority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`py-2 rounded-xl text-xs font-mono-code font-semibold transition-all ${
                          priority === p
                            ? p === 'High'
                              ? 'bg-[#DC2626] text-white shadow-2xs'
                              : p === 'Medium'
                              ? 'bg-[#2563EB] text-white shadow-2xs'
                              : 'bg-[#4B5563] text-white shadow-2xs'
                            : 'bg-[#FFFFFF] text-[#635E55] border border-[#DDD5C5] hover:bg-[#F2ECE1]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#1E2022] mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#B45309]" />
                    <span>Location / Context</span>
                  </label>
                  <input
                    type="text"
                    value={locationContext}
                    onChange={(e) => setLocationContext(e.target.value)}
                    placeholder="e.g. Retail pharmacy dispensing counter, hospital ward"
                    className="w-full p-2.5 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] text-xs text-[#1E2022] focus:outline-hidden focus:ring-2 focus:ring-[#5B21B6]"
                  />
                </div>
              </div>

              {/* 1. Problem Observed */}
              <div>
                <label className="block font-semibold text-[#1E2022] mb-1">
                  1. Problem / Friction Observed <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={problemObserved}
                  onChange={(e) => setProblemObserved(e.target.value)}
                  placeholder="What friction, broken workflow, or customer pain did you notice?"
                  className="w-full p-2.5 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] text-xs text-[#1E2022] focus:outline-hidden focus:ring-2 focus:ring-[#5B21B6]"
                />
              </div>

              {/* 2 & 3: Audience and Current Workaround */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1E2022] mb-1">
                    2. Who Experiences It? (Target Audience)
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. Pharmacists, lab techs, students"
                    className="w-full p-2.5 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] text-xs text-[#1E2022] focus:outline-hidden focus:ring-2 focus:ring-[#5B21B6]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1E2022] mb-1">
                    3. Current Workaround
                  </label>
                  <input
                    type="text"
                    value={currentSolution}
                    onChange={(e) => setCurrentSolution(e.target.value)}
                    placeholder="How is it tolerated today?"
                    className="w-full p-2.5 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] text-xs text-[#1E2022] focus:outline-hidden focus:ring-2 focus:ring-[#5B21B6]"
                  />
                </div>
              </div>

              {/* 4. Why is it imperfect? */}
              <div>
                <label className="block font-semibold text-[#1E2022] mb-1">
                  4. Why Is Current Workaround Imperfect?
                </label>
                <textarea
                  rows={2}
                  value={imperfection}
                  onChange={(e) => setImperfection(e.target.value)}
                  placeholder="What makes current options slow, expensive, error-prone, or stressful?"
                  className="w-full p-2.5 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] text-xs text-[#1E2022] focus:outline-hidden focus:ring-2 focus:ring-[#5B21B6]"
                />
              </div>

              {/* 5. Possible Solution / Venture Hypothesis */}
              <div>
                <label className="block font-semibold text-[#1E2022] mb-1">
                  5. Possible Solution / Venture Hypothesis
                </label>
                <textarea
                  rows={2}
                  value={possibleSolution}
                  onChange={(e) => setPossibleSolution(e.target.value)}
                  placeholder="What software tool, specialized service, or operational workflow would resolve this?"
                  className="w-full p-2.5 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] text-xs text-[#1E2022] focus:outline-hidden focus:ring-2 focus:ring-[#5B21B6]"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block font-semibold text-[#1E2022] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-[#5B21B6]" />
                    <span>Category Tags</span>
                  </span>
                  <span className="text-[10px] text-[#7A746B]">Click to toggle</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TAGS.map((tag) => {
                    const isSelected = tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono-code transition-all ${
                          isSelected
                            ? 'bg-[#5B21B6] text-[#FBF9F5] font-semibold'
                            : 'bg-[#F2ECE1] text-[#635E55] hover:bg-[#E5DEC9] border border-[#DDD5C5]'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={handleAddCustomTag}
                    placeholder="Add custom tag (Press Enter)..."
                    className="p-1.5 px-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-xs font-mono-code text-[#1E2022] w-64"
                  />
                  {tags.filter((t) => !PRESET_TAGS.includes(t)).map((t) => (
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

              {/* Notes */}
              <div>
                <label className="block font-semibold text-[#1E2022] mb-1">
                  General Execution Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional context or qualitative observations..."
                  className="w-full p-2.5 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] text-xs text-[#1E2022]"
                />
              </div>

              {/* Immutability & Metadata Box */}
              <div className="p-3 bg-[#F4EFE6] rounded-xl border border-[#E2D8C3] text-[11px] font-mono-code text-[#635E55] space-y-1">
                <div className="flex justify-between">
                  <span>Captured Calendar Date: <strong className="text-[#1E2022]">{idea.dateCaptured}</strong></span>
                  <span>ISO Week: <strong className="text-[#1E2022]">W{weekInfo.weekNumber} ({weekInfo.year})</strong></span>
                </div>
                <div className="flex justify-between">
                  <span>Created: {new Date(idea.createdAt).toLocaleString()}</span>
                  <span>Updated: {new Date(idea.updatedAt).toLocaleString()}</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: STAGE 2 RESEARCH CANVAS */}
          {activeTab === 'research' && (
            <ResearchStagePanel idea={idea} onSaveResearch={handleSaveResearch} />
          )}

          {/* TAB 3: STAGE 3 VALIDATION & EVIDENCE */}
          {activeTab === 'validation' && (
            <ValidationStagePanel
              idea={idea}
              onSaveValidation={handleSaveValidation}
              onAddEvidence={handleAddEvidence}
            />
          )}

          {/* TAB 4: STAGE 4 PROTOTYPES */}
          {activeTab === 'prototype' && (
            <PrototypesStagePanel idea={idea} onAddPrototype={handleAddPrototype} />
          )}

          {/* TAB 5: STAGE 5 EXPERIMENTS */}
          {activeTab === 'experiment' && (
            <ExperimentsStagePanel idea={idea} onAddExperiment={handleAddExperiment} />
          )}

          {/* TAB 6: SCORING MATRIX */}
          {activeTab === 'scoring' && (
            <IdeaScoringPanel
              idea={idea}
              onSaveScoring={handleSaveScoring}
              onToggleFocus={(isFoc) => setIsFocusIdea(isFoc)}
            />
          )}

          {/* TAB 7: QUALITY SHARPENING */}
          {activeTab === 'quality' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#FEF9C3]/60 border border-[#FEF08A] rounded-xl text-xs text-[#A16207]">
                <strong>Observation Sharpening Framework:</strong> High-value ventures arise from crisp clarity around genuine human friction, frequency, and current workaround limitations.
              </div>

              <div>
                <label className="block font-semibold text-[#1E2022] mb-1">
                  1. What EXACTLY is the core problem?
                </label>
                <textarea
                  rows={2}
                  value={qualityPrompt.problemClarity || ''}
                  onChange={(e) => setQualityPrompt({ ...qualityPrompt, problemClarity: e.target.value })}
                  placeholder="Distill the root cause without assuming a solution..."
                  className="w-full p-2.5 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] text-xs text-[#1E2022]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1E2022] mb-1">
                    2. Who experiences it and in what context?
                  </label>
                  <input
                    type="text"
                    value={qualityPrompt.whoExperiences || ''}
                    onChange={(e) => setQualityPrompt({ ...qualityPrompt, whoExperiences: e.target.value })}
                    placeholder="Specific demographic, profession, or role"
                    className="w-full p-2.5 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] text-xs text-[#1E2022]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1E2022] mb-1">
                    3. How frequently does it occur?
                  </label>
                  <input
                    type="text"
                    value={qualityPrompt.frequency || ''}
                    onChange={(e) => setQualityPrompt({ ...qualityPrompt, frequency: e.target.value })}
                    placeholder="e.g. 50 times per day, weekly, during billing cycle"
                    className="w-full p-2.5 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] text-xs text-[#1E2022]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1E2022] mb-1">
                  4. How is it solved or bypassed today?
                </label>
                <textarea
                  rows={2}
                  value={qualityPrompt.currentWorkaround || ''}
                  onChange={(e) => setQualityPrompt({ ...qualityPrompt, currentWorkaround: e.target.value })}
                  placeholder="Manual spreadsheets, paper binders, WhatsApp groups, hiring assistants..."
                  className="w-full p-2.5 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] text-xs text-[#1E2022]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1E2022] mb-1">
                  5. Why is the current workaround imperfect?
                </label>
                <textarea
                  rows={2}
                  value={qualityPrompt.imperfectionReason || ''}
                  onChange={(e) => setQualityPrompt({ ...qualityPrompt, imperfectionReason: e.target.value })}
                  placeholder="Cost, error latency, regulatory danger, cognitive overload..."
                  className="w-full p-2.5 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] text-xs text-[#1E2022]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1E2022] mb-1">
                  6. What would be 10x meaningfully better?
                </label>
                <textarea
                  rows={2}
                  value={qualityPrompt.meaningfullyBetter || ''}
                  onChange={(e) => setQualityPrompt({ ...qualityPrompt, meaningfullyBetter: e.target.value })}
                  placeholder="Instant 2-click resolution, 90% cost drop, zero-error audit..."
                  className="w-full p-2.5 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] text-xs text-[#1E2022]"
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-3.5 bg-[#F2ECE1] border-t border-[#E2D8C3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2 bg-[#FEF2F2] p-1.5 rounded-xl border border-[#FECACA]">
                <span className="text-xs text-[#991B1B] font-medium">Permanently delete?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-2.5 py-1 rounded-lg bg-[#DC2626] text-white text-xs font-bold"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1 text-xs text-[#635E55]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-mono-code text-[#DC2626] hover:bg-[#FEE2E2] transition-colors flex items-center gap-1"
                title="Permanently remove idea"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}

            {isSavedBanner && (
              <span className="text-xs font-mono-code font-bold text-[#166534] flex items-center gap-1">
                <Check className="w-4 h-4" />
                Saved!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono-code text-[#635E55] hover:bg-[#E4DAC5] transition-colors"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-[#FBF9F5] text-xs font-mono-code font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              id="btn-save-idea-detail"
            >
              <Check className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

