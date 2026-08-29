import React, { useState, useMemo, useEffect } from 'react';
import {
  Archive,
  ArrowRight,
  ArrowUpDown,
  Award,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  FileText,
  Filter,
  Flame,
  FlaskConical,
  Globe,
  Hammer,
  HelpCircle,
  Layers,
  Lightbulb,
  MapPin,
  Plus,
  RefreshCw,
  Rocket,
  RotateCcw,
  Search,
  Sliders,
  Sparkles,
  Star,
  Tag,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { IdeaItem, IdeaPriority, IdeaStatus, WorldScanItem } from '../../types';
import {
  archiveIdea,
  deleteIdeaPermanent,
  formatINR,
  loadIdeas,
  loadWorldScans,
  restoreIdea,
  saveIdeas,
  upsertIdea,
  upsertWorldScan,
} from '../../services/storageService';
import { formatLocalISODate, formatReadableDate, formatShortDate, getISOWeek, getTodayDateString } from '../../utils/dateUtils';
import { IdeaDetailModal } from '../modals/IdeaDetailModal';
import { WorldScanView } from '../worldscan/WorldScanView';
import { PipelineHeader } from '../entrepreneurship/PipelineHeader';
import { QuickExperimentModal } from '../entrepreneurship/QuickExperimentModal';

interface IdeasViewProps {
  onOpenQuickIdea: () => void;
  currentDateStr: string;
}

type VaultViewTab = 
  | 'all' 
  | 'this_week' 
  | 'promising' 
  | 'research_validation' 
  | 'experiments' 
  | 'weekly_review' 
  | 'archived';

const STATUS_CONFIGS: Record<IdeaStatus, { label: string; bg: string; text: string; border: string }> = {
  OBSERVED: { label: 'Observed', bg: 'bg-[#F3E8FF]', text: 'text-[#6D28D9]', border: 'border-[#DDD6FE]' },
  RESEARCHING: { label: 'Researching', bg: 'bg-[#E0F2FE]', text: 'text-[#0369A1]', border: 'border-[#BAE6FD]' },
  VALIDATING: { label: 'Validating', bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]', border: 'border-[#FDE68A]' },
  PROTOTYPE: { label: 'Prototype', bg: 'bg-[#FFEDD5]', text: 'text-[#C2410C]', border: 'border-[#FED7AA]' },
  EXPERIMENT: { label: 'Experiment', bg: 'bg-[#ECFDF5]', text: 'text-[#047857]', border: 'border-[#A7F3D0]' },
  PROMISING: { label: 'Promising', bg: 'bg-[#FEF9C3]', text: 'text-[#A16207]', border: 'border-[#FEF08A]' },
  BUILDING: { label: 'Building', bg: 'bg-[#F0FDFA]', text: 'text-[#0F766E]', border: 'border-[#99F6E4]' },
  ARCHIVED: { label: 'Archived', bg: 'bg-[#F3F4F6]', text: 'text-[#4B5563]', border: 'border-[#E5E7EB]' },
};

const PRESET_TAG_OPTIONS = [
  'All Tags',
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

export const IdeasView: React.FC<IdeasViewProps> = ({ onOpenQuickIdea, currentDateStr }) => {
  const [topMode, setTopMode] = useState<'vault' | 'world_scan'>('vault');
  const [activeVaultTab, setActiveVaultTab] = useState<VaultViewTab>('all');
  
  const [ideas, setIdeas] = useState<IdeaItem[]>(() => loadIdeas());
  const [worldScans, setWorldScans] = useState<WorldScanItem[]>(() => loadWorldScans());

  // Search, Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('All Tags');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority' | 'updated' | 'title' | 'score'>('newest');

  // Detail Modal state
  const [selectedIdeaForDetail, setSelectedIdeaForDetail] = useState<IdeaItem | null>(null);
  const [detailModalInitialTab, setDetailModalInitialTab] = useState<'details' | 'research' | 'validation' | 'prototype' | 'experiment' | 'scoring' | 'quality'>('details');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Quick Experiment Modal state
  const [isQuickExperimentOpen, setIsQuickExperimentOpen] = useState(false);

  const refreshData = () => {
    setIdeas(loadIdeas());
    setWorldScans(loadWorldScans());
  };

  useEffect(() => {
    refreshData();
  }, [currentDateStr]);

  const targetDate = currentDateStr || getTodayDateString();
  const currentWeekInfo = getISOWeek(targetDate);

  // Filtered & Sorted Ideas
  const displayedIdeas = useMemo(() => {
    return ideas.filter((item) => {
      // 1. Vault Tab Filtering
      if (activeVaultTab === 'archived') {
        if (!item.isArchived && item.status !== 'ARCHIVED') return false;
      } else {
        if (item.isArchived || item.status === 'ARCHIVED') return false;

        if (activeVaultTab === 'this_week') {
          const w = getISOWeek(item.dateCaptured);
          if (w.year !== currentWeekInfo.year || w.weekNumber !== currentWeekInfo.weekNumber) {
            return false;
          }
        } else if (activeVaultTab === 'promising') {
          if (item.status !== 'PROMISING' && item.priority !== 'High') return false;
        } else if (activeVaultTab === 'research_validation') {
          if (item.status !== 'RESEARCHING' && item.status !== 'VALIDATING') return false;
        } else if (activeVaultTab === 'experiments') {
          if (item.status !== 'PROTOTYPE' && item.status !== 'EXPERIMENT' && item.status !== 'BUILDING') return false;
        } else if (activeVaultTab === 'weekly_review') {
          // Show both this week's ideas and high-priority / active research ideas
          const w = getISOWeek(item.dateCaptured);
          const isThisWeek = w.year === currentWeekInfo.year && w.weekNumber === currentWeekInfo.weekNumber;
          const isPromisingOrResearch = item.status === 'PROMISING' || item.status === 'RESEARCHING' || item.priority === 'High';
          if (!isThisWeek && !isPromisingOrResearch) return false;
        }
      }

      // 2. Status Dropdown Filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      // 3. Priority Dropdown Filter
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) {
        return false;
      }

      // 4. Tag Filter
      if (tagFilter !== 'All Tags') {
        if (!item.tags || !item.tags.some((t) => t.toLowerCase() === tagFilter.toLowerCase())) {
          return false;
        }
      }

      // 5. Text Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchProblem = (item.problemObserved || '').toLowerCase().includes(q);
        const matchSolution = (item.possibleSolution || item.proposedVenture || '').toLowerCase().includes(q);
        const matchAudience = (item.targetAudience || '').toLowerCase().includes(q);
        const matchNotes = (item.notes || '').toLowerCase().includes(q);
        const matchTags = (item.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchProblem && !matchSolution && !matchAudience && !matchNotes && !matchTags) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return (b.dateCaptured || '').localeCompare(a.dateCaptured || '') || (b.createdAt || '').localeCompare(a.createdAt || '');
      }
      if (sortBy === 'oldest') {
        return (a.dateCaptured || '').localeCompare(b.dateCaptured || '') || (a.createdAt || '').localeCompare(b.createdAt || '');
      }
      if (sortBy === 'priority') {
        const pWeight = { High: 3, Medium: 2, Low: 1 };
        return (pWeight[b.priority] || 2) - (pWeight[a.priority] || 2);
      }
      if (sortBy === 'updated') {
        return (b.updatedAt || '').localeCompare(a.updatedAt || '');
      }
      if (sortBy === 'score') {
        const scoreA = a.userScoring?.totalScore || 0;
        const scoreB = b.userScoring?.totalScore || 0;
        return scoreB - scoreA;
      }
      if (sortBy === 'title') {
        return (a.title || a.problemObserved || '').localeCompare(b.title || b.problemObserved || '');
      }
      return 0;
    });
  }, [ideas, activeVaultTab, statusFilter, priorityFilter, tagFilter, searchQuery, sortBy, currentWeekInfo]);

  // Card Quick Actions
  const handleQuickStatusChange = (e: React.MouseEvent, idea: IdeaItem, newStatus: IdeaStatus) => {
    e.stopPropagation();
    upsertIdea({
      ...idea,
      status: newStatus,
      isArchived: newStatus === 'ARCHIVED',
    });
    refreshData();
  };

  const handleQuickArchive = (e: React.MouseEvent, ideaId: string) => {
    e.stopPropagation();
    archiveIdea(ideaId);
    refreshData();
  };

  const handleQuickRestore = (e: React.MouseEvent, ideaId: string) => {
    e.stopPropagation();
    restoreIdea(ideaId, 'OBSERVED');
    refreshData();
  };

  const handleOpenDetail = (idea: IdeaItem, initialTab: 'details' | 'research' | 'validation' | 'prototype' | 'experiment' | 'scoring' | 'quality' = 'details') => {
    setSelectedIdeaForDetail(idea);
    setDetailModalInitialTab(initialTab);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-200" id="observation-engine-idea-vault">
      
      {/* 1. Top Mode Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FFFFFF] border border-[#E2D8C3] p-3.5 sm:p-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-[#F2ECE1] rounded-xl border border-[#E2D8C3] w-fit">
          <button
            type="button"
            onClick={() => setTopMode('vault')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              topMode === 'vault' ? 'bg-[#1E2022] text-[#FBF9F5] shadow-xs' : 'text-[#635E55] hover:text-[#1E2022]'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-[#FDE68A]" />
            <span>Observation &amp; Idea Vault</span>
          </button>
          <button
            type="button"
            onClick={() => setTopMode('world_scan')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              topMode === 'world_scan' ? 'bg-[#1E2022] text-[#FBF9F5] shadow-xs' : 'text-[#635E55] hover:text-[#1E2022]'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-[#86EFAC]" />
            <span>Sunday World Scan</span>
          </button>
        </div>

        {topMode === 'vault' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsQuickExperimentOpen(true)}
              className="px-3.5 py-2 bg-[#047857] hover:bg-[#065F46] text-[#FFFFFF] rounded-xl text-xs font-mono-code font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
              title="Sunday 3:00–4:30 PM: Log Experiment Results"
            >
              <FlaskConical className="w-3.5 h-3.5 text-[#A7F3D0]" />
              <span>Log Experiment (Sun 3PM)</span>
            </button>
            <button
              type="button"
              onClick={onOpenQuickIdea}
              className="px-4 py-2 bg-[#5B21B6] hover:bg-[#4C1D95] text-[#FBF9F5] rounded-xl text-xs font-mono-code font-bold flex items-center gap-2 shadow-xs transition-colors shrink-0"
              id="btn-vault-top-capture"
            >
              <Plus className="w-4 h-4" />
              <span>+ Capture Idea</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODE A: OBSERVATION ENGINE & IDEA VAULT                                  */}
      {/* ========================================================================= */}
      {topMode === 'vault' && (
        <div className="space-y-4">
          
          {/* Phase 5C: 7-Stage Pipeline & Focus Funnel Header */}
          <PipelineHeader
            ideas={ideas}
            onSelectStage={(stage) => setStatusFilter(stage)}
            onOpenIdea={(idea) => handleOpenDetail(idea)}
            onOpenQuickExperiment={() => setIsQuickExperimentOpen(true)}
            activeStageFilter={statusFilter}
          />

          {/* Search, Filter & Sort Control Bar */}
          <div className="bg-[#FFFFFF] border border-[#E2D8C3] p-3 sm:p-4 rounded-2xl shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              
              {/* Live Search Input */}
              <div className="sm:col-span-4 relative">
                <Search className="w-4 h-4 text-[#7A746B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search problem, audience, tags..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DDD5C5] bg-[#FBF9F5] text-xs text-[#1E2022] focus:outline-hidden focus:ring-2 focus:ring-[#5B21B6] focus:bg-[#FFFFFF] transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A746B] hover:text-[#1E2022]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Dropdown */}
              <div className="sm:col-span-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full py-2 px-2.5 rounded-xl border border-[#DDD5C5] bg-[#FBF9F5] text-xs font-semibold text-[#1E2022] focus:outline-hidden focus:ring-2 focus:ring-[#5B21B6]"
                >
                  <option value="all">All Pipeline Stages</option>
                  <option value="OBSERVED">Observed</option>
                  <option value="RESEARCHING">Researching</option>
                  <option value="VALIDATING">Validating</option>
                  <option value="PROTOTYPE">Prototype</option>
                  <option value="EXPERIMENT">Experiment</option>
                  <option value="PROMISING">Promising</option>
                  <option value="BUILDING">Building</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              {/* Priority Dropdown */}
              <div className="sm:col-span-2">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full py-2 px-2.5 rounded-xl border border-[#DDD5C5] bg-[#FBF9F5] text-xs font-semibold text-[#1E2022] focus:outline-hidden focus:ring-2 focus:ring-[#5B21B6]"
                >
                  <option value="all">All Priorities</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              {/* Tag Dropdown */}
              <div className="sm:col-span-3">
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="w-full py-2 px-2.5 rounded-xl border border-[#DDD5C5] bg-[#FBF9F5] text-xs font-semibold text-[#1E2022] focus:outline-hidden focus:ring-2 focus:ring-[#5B21B6]"
                >
                  {PRESET_TAG_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Sub-bar: Sort & Active Filter Indicators */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-[#EFE9DC] text-xs text-[#7A746B] gap-2">
              <div className="flex items-center gap-2">
                <span>Showing <strong>{displayedIdeas.length}</strong> items</span>
                {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || tagFilter !== 'All Tags') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setPriorityFilter('all');
                      setTagFilter('All Tags');
                    }}
                    className="text-[#991B1B] hover:underline font-mono-code text-[11px]"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 font-mono-code text-[11px]">
                  <ArrowUpDown className="w-3 h-3" />
                  Sort:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="py-1 px-2 rounded-lg border border-[#DDD5C5] bg-[#FBF9F5] text-xs font-mono-code text-[#1E2022]"
                >
                  <option value="newest">Newest Captured</option>
                  <option value="oldest">Oldest Captured</option>
                  <option value="priority">Priority (High → Low)</option>
                  <option value="score">Viability Score (Highest)</option>
                  <option value="updated">Recently Updated</option>
                  <option value="title">Alphabetical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ideas Grid */}
          {displayedIdeas.length === 0 ? (
            <div className="p-12 text-center bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F4EFE6] text-[#5B21B6] flex items-center justify-center mx-auto">
                <Lightbulb className="w-6 h-6" />
              </div>
              <h3 className="font-slab font-bold text-base text-[#1E2022]">
                No ideas found matching current criteria
              </h3>
              <p className="text-xs text-[#7A746B] max-w-md mx-auto">
                Capture your daily friction observations during the 11:00 PM routine or whenever real-world problems occur.
              </p>
              <button
                type="button"
                onClick={onOpenQuickIdea}
                className="px-4 py-2 bg-[#5B21B6] text-[#FBF9F5] rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Capture New Observation</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {displayedIdeas.map((idea) => {
                const statusConf = STATUS_CONFIGS[idea.status] || STATUS_CONFIGS.OBSERVED;
                const weekInfo = getISOWeek(idea.dateCaptured);
                const isHighPriority = idea.priority === 'High';
                const expCount = Array.isArray(idea.experiments) ? idea.experiments.length : 0;
                const protoCount = Array.isArray(idea.prototypes) ? idea.prototypes.length : 0;
                const hasEvidence = Boolean(idea.validationRecord?.evidenceList && idea.validationRecord.evidenceList.length > 0);
                const totalScore = idea.userScoring?.totalScore;

                return (
                  <div
                    key={idea.id}
                    onClick={() => handleOpenDetail(idea, 'details')}
                    className={`bg-[#FFFFFF] border rounded-2xl p-4 transition-all cursor-pointer hover:shadow-md flex flex-col justify-between space-y-3 ${
                      idea.isFocusIdea
                        ? 'border-[#F59E0B] ring-1 ring-[#F59E0B]/30 shadow-xs'
                        : isHighPriority
                        ? 'border-[#FCA5A5] shadow-xs'
                        : 'border-[#EAE4D6] hover:border-[#DDD5C5]'
                    }`}
                  >
                    {/* Top Row: Badges & Date */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-md border uppercase ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}>
                          {statusConf.label}
                        </span>

                        <span className={`text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-md border ${
                          idea.priority === 'High'
                            ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                            : idea.priority === 'Medium'
                            ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                            : 'bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]'
                        }`}>
                          {idea.priority}
                        </span>

                        {idea.isFocusIdea && (
                          <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] flex items-center gap-1">
                            <Star className="w-3 h-3 text-[#D97706] fill-[#F59E0B]" />
                            <span>Top Focus</span>
                          </span>
                        )}

                        {totalScore !== undefined && (
                          <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-md bg-[#F3E8FF] text-[#6D28D9] border border-[#DDD6FE]">
                            Score: {totalScore}/60
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-mono-code text-[#7A746B] flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3 text-[#A8A29E]" />
                        {formatShortDate(idea.dateCaptured)} • W{weekInfo.weekNumber}
                      </span>
                    </div>

                    {/* Source Backlink Badge if derived from World Scan */}
                    {(idea.sourceType === 'world_scan' || idea.sourceWorldScanDate) && (
                      <div className="flex items-center gap-1.5 text-[10px] font-mono-code text-[#1E40AF] bg-[#EFF6FF] px-2 py-0.5 rounded-md border border-[#BFDBFE] self-start font-semibold">
                        <Globe className="w-3 h-3 text-[#2563EB]" />
                        <span>Source: World Scan — {idea.sourceWorldScanDate || formatShortDate(idea.dateCaptured)}</span>
                      </div>
                    )}

                    {/* Title & Problem Snippet */}
                    <div className="space-y-1.5">
                      <h4 className="font-slab font-bold text-sm text-[#1E2022] line-clamp-1">
                        {idea.title || idea.problemObserved.slice(0, 45)}
                      </h4>
                      <p className="text-xs text-[#4A453E] line-clamp-2 leading-relaxed">
                        <strong className="text-[#1E2022]">Problem:</strong> {idea.problemObserved}
                      </p>
                      {idea.possibleSolution && (
                        <p className="text-xs text-[#047857] line-clamp-1">
                          <strong className="text-[#065F46]">Solution:</strong> {idea.possibleSolution}
                        </p>
                      )}
                    </div>

                    {/* Stage Pipeline Micro-Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono-code">
                      {idea.researchRecord && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(idea, 'research');
                          }}
                          className="px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0369A1] hover:bg-[#BAE6FD] flex items-center gap-1"
                        >
                          <Compass className="w-3 h-3" />
                          <span>Researched</span>
                        </button>
                      )}
                      {hasEvidence && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(idea, 'validation');
                          }}
                          className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#B45309] hover:bg-[#FDE68A] flex items-center gap-1"
                        >
                          <Target className="w-3 h-3" />
                          <span>{idea.validationRecord?.evidenceList?.length} Evidence Logs</span>
                        </button>
                      )}
                      {protoCount > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(idea, 'prototype');
                          }}
                          className="px-2 py-0.5 rounded bg-[#FFEDD5] text-[#C2410C] hover:bg-[#FED7AA] flex items-center gap-1"
                        >
                          <Hammer className="w-3 h-3" />
                          <span>{protoCount} Prototypes</span>
                        </button>
                      )}
                      {expCount > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(idea, 'experiment');
                          }}
                          className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#047857] hover:bg-[#A7F3D0] flex items-center gap-1 font-bold"
                        >
                          <FlaskConical className="w-3 h-3" />
                          <span>{expCount} Experiments</span>
                        </button>
                      )}
                    </div>

                    {/* Tags & Context */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F2ECE1] text-[11px]">
                      <div className="flex items-center gap-1 flex-wrap">
                        {idea.tags?.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-md bg-[#F4EFE6] text-[#5B21B6] text-[10px] font-mono-code border border-[#E2D8C3]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Quick Action Progression */}
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(idea, 'details')}
                          className="px-2 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#F2ECE1] text-[#4A453E] text-[10px] font-mono-code font-bold border border-[#DDD5C5]"
                        >
                          Open Canvas →
                        </button>
                        {idea.isArchived ? (
                          <button
                            type="button"
                            onClick={(e) => handleQuickRestore(e, idea.id)}
                            className="p-1 rounded-lg text-[#166534] hover:bg-[#DCFCE7]"
                            title="Restore idea"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleQuickArchive(e, idea.id)}
                            className="p-1 rounded-lg text-[#7A746B] hover:text-[#DC2626] hover:bg-[#FEE2E2]"
                            title="Archive idea"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE B: SUNDAY WORLD SCAN ARCHIVE                                        */}
      {/* ========================================================================= */}
      {topMode === 'world_scan' && (
        <WorldScanView
          onOpenIdeaVault={() => setTopMode('vault')}
          onOpenCreatedIdea={(ideaId) => {
            refreshData();
            setTopMode('vault');
            const created = loadIdeas().find((i) => i.id === ideaId);
            if (created) {
              setSelectedIdeaForDetail(created);
              setDetailModalInitialTab('details');
              setIsDetailModalOpen(true);
            }
          }}
        />
      )}

      {/* Idea Detail Modal with Initial Tab selector */}
      <IdeaDetailModal
        idea={selectedIdeaForDetail}
        isOpen={isDetailModalOpen}
        initialTab={detailModalInitialTab}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedIdeaForDetail(null);
        }}
        onIdeaUpdated={(updated) => {
          refreshData();
          if (updated) {
            setSelectedIdeaForDetail(updated);
          }
        }}
      />

      {/* Quick Experiment Modal */}
      <QuickExperimentModal
        isOpen={isQuickExperimentOpen}
        onClose={() => setIsQuickExperimentOpen(false)}
        onExperimentLogged={(updated) => {
          refreshData();
          setSelectedIdeaForDetail(updated);
          setDetailModalInitialTab('experiment');
          setIsDetailModalOpen(true);
        }}
      />

    </div>
  );
};

