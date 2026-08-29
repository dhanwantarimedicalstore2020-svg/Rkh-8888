import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  Filter,
  Globe,
  Layers,
  Lightbulb,
  Link,
  Plus,
  Rocket,
  Search,
  Sparkles,
  Tag,
  TrendingUp,
} from 'lucide-react';
import { WorldScanItem, WorldScanResearchStatus } from '../../types';
import {
  formatReadableDate,
  formatShortDate,
  getISOWeek,
  getTodayDateString,
  getWeekdayFromDate,
  offsetDays,
} from '../../utils/dateUtils';
import {
  loadWorldScans,
  upsertWorldScan,
  createIdeaFromWorldScan,
} from '../../services/storageService';
import { WorldScanEditorModal } from './WorldScanEditorModal';
import { WorldScanDetailModal } from './WorldScanDetailModal';

interface WorldScanViewProps {
  onOpenIdeaVault?: () => void;
  onOpenCreatedIdea?: (ideaId: string) => void;
}

const MONTH_OPTIONS = [
  'All Months',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const STATUS_CONFIGS: Record<WorldScanResearchStatus, { label: string; bg: string; text: string; border: string }> = {
  NOT_STARTED: { label: 'Not Started', bg: 'bg-[#F3F4F6]', text: 'text-[#4B5563]', border: 'border-[#E5E7EB]' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-[#EFF6FF]', text: 'text-[#1D4ED8]', border: 'border-[#BFDBFE]' },
  COMPLETED: { label: 'Completed', bg: 'bg-[#ECFDF5]', text: 'text-[#047857]', border: 'border-[#A7F3D0]' },
  FOLLOW_UP: { label: 'Follow-Up Needed', bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]', border: 'border-[#FDE68A]' },
};

export const WorldScanView: React.FC<WorldScanViewProps> = ({
  onOpenIdeaVault,
  onOpenCreatedIdea,
}) => {
  const [scans, setScans] = useState<WorldScanItem[]>(() => loadWorldScans());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('All Months');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');

  // Modal States
  const [editingScan, setEditingScan] = useState<WorldScanItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorInitialDate, setEditorInitialDate] = useState<string | undefined>(undefined);

  const [inspectingScan, setInspectingScan] = useState<WorldScanItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [activeSubTab, setActiveSubTab] = useState<'archive' | 'followups' | 'sources'>('archive');

  const refreshScans = () => {
    setScans(loadWorldScans());
  };

  const todayStr = getTodayDateString();
  const currentWeek = getISOWeek(todayStr);

  // Compute unique topics across all scans
  const allTopics = useMemo(() => {
    const topicSet = new Set<string>();
    scans.forEach((s) => {
      if (Array.isArray(s.topics)) {
        s.topics.forEach((t) => topicSet.add(t));
      }
    });
    return Array.from(topicSet);
  }, [scans]);

  // Filtered scans
  const filteredScans = useMemo(() => {
    return scans.filter((s) => {
      // Month filter
      if (selectedMonth !== 'All Months' && s.monthName !== selectedMonth) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'ALL' && s.status !== selectedStatus) {
        return false;
      }
      // Topic filter
      if (selectedTopic !== 'ALL' && (!s.topics || !s.topics.includes(selectedTopic))) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inDate = s.date.toLowerCase().includes(query);
        const inBiggest = s.sections?.biggestChange?.toLowerCase().includes(query);
        const inTech = s.sections?.techToWatch?.toLowerCase().includes(query);
        const inIndustry = s.sections?.industryChanging?.toLowerCase().includes(query);
        const inBiz = s.sections?.businessModel?.toLowerCase().includes(query);
        const inHuman = s.sections?.humanBehaviour?.toLowerCase().includes(query);
        const inOpp = s.sections?.opportunity?.toLowerCase().includes(query);
        const inIdea = s.sections?.oneIdea?.toLowerCase().includes(query);
        const inNotes = s.researchNotes?.toLowerCase().includes(query);
        const inTopics = s.topics?.some((t) => t.toLowerCase().includes(query));
        const inSources = s.sources?.some((src) => src.sourceName.toLowerCase().includes(query) || src.keyTakeaway.toLowerCase().includes(query));

        if (!inDate && !inBiggest && !inTech && !inIndustry && !inBiz && !inHuman && !inOpp && !inIdea && !inNotes && !inTopics && !inSources) {
          return false;
        }
      }
      return true;
    });
  }, [scans, selectedMonth, selectedStatus, selectedTopic, searchQuery]);

  // Aggregate all pending follow-ups
  const allFollowUps = useMemo(() => {
    const list: { scanId: string; scanDate: string; followUp: any }[] = [];
    scans.forEach((s) => {
      if (Array.isArray(s.followUps)) {
        s.followUps.forEach((flw) => {
          list.push({
            scanId: s.id,
            scanDate: s.date,
            followUp: flw,
          });
        });
      }
    });
    return list;
  }, [scans]);

  // Aggregate all verified sources
  const allSources = useMemo(() => {
    const list: { scanId: string; scanDate: string; source: any }[] = [];
    scans.forEach((s) => {
      if (Array.isArray(s.sources)) {
        s.sources.forEach((src) => {
          list.push({
            scanId: s.id,
            scanDate: s.date,
            source: src,
          });
        });
      }
    });
    return list;
  }, [scans]);

  const handleOpenNewScan = (targetDate?: string) => {
    setEditingScan(null);
    setEditorInitialDate(targetDate || todayStr);
    setIsEditorOpen(true);
  };

  const handleInspectScan = (scan: WorldScanItem) => {
    setInspectingScan(scan);
    setIsDetailOpen(true);
  };

  const handleEditScan = (scan: WorldScanItem) => {
    setInspectingScan(null);
    setIsDetailOpen(false);
    setEditingScan(scan);
    setEditorInitialDate(scan.date);
    setIsEditorOpen(true);
  };

  const handleToggleFollowUpItem = (scanId: string, flwId: string) => {
    const targetScan = scans.find((s) => s.id === scanId);
    if (!targetScan) return;
    const updated = (targetScan.followUps || []).map((f) =>
      f.id === flwId ? { ...f, completed: !f.completed } : f
    );
    upsertWorldScan({
      ...targetScan,
      followUps: updated,
    });
    refreshScans();
  };

  const handleQuickExtract = (scan: WorldScanItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const newIdea = createIdeaFromWorldScan(
      scan.id,
      scan.sections.oneIdea || scan.sections.opportunity || `Opportunity from Scan (${scan.date})`,
      scan.sections.opportunity || scan.sections.biggestChange,
      scan.sections.oneIdea || scan.sections.techToWatch
    );
    refreshScans();
    if (onOpenCreatedIdea) {
      onOpenCreatedIdea(newIdea.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Sunday Intelligence Timetable Protocol Card */}
      <div className="p-5 rounded-2xl border border-[#D5CAAF] bg-[#F2ECE1] shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-[#1E3A8A] text-[#FBF9F5] text-[10px] font-mono-code font-bold uppercase tracking-wider">
                Sunday Weekly Practice
              </span>
              <span className="text-xs font-mono-code text-[#635E55]">
                10:00–11:30 AM Research • 11:30 AM–12:00 PM Write-Up
              </span>
            </div>
            <h2 className="font-slab font-bold text-lg sm:text-xl text-[#1E2022]">
              World Scan & Research Intelligence
            </h2>
            <p className="text-xs text-[#4A453E] leading-relaxed">
              Structured weekly intelligence practice to discover global shifts, emerging technology, industry restructuring, and new business models — turning observations into verified venture ideas.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenNewScan(todayStr)}
              className="px-4 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#1E40AF] text-[#FBF9F5] text-xs font-mono-code font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4 text-[#93C5FD]" />
              <span>+ New World Scan</span>
            </button>
          </div>
        </div>

        {/* 8 Sections Quick Badge Bar */}
        <div className="mt-4 pt-3.5 border-t border-[#E2D8C3] flex items-center gap-2 overflow-x-auto no-scrollbar text-[11px] font-mono-code text-[#4A453E]">
          <span className="font-bold text-[#1E3A8A] shrink-0">8-Point Intelligence:</span>
          <span className="px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#DDD5C5] shrink-0">1. Biggest Change</span>
          <span className="px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#DDD5C5] shrink-0">2. Tech to Watch</span>
          <span className="px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#DDD5C5] shrink-0">3. Industry Changing</span>
          <span className="px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#DDD5C5] shrink-0">4. Business Model</span>
          <span className="px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#DDD5C5] shrink-0">5. Human Behaviour</span>
          <span className="px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#DDD5C5] shrink-0">6. Opportunity / Problem</span>
          <span className="px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#DDD5C5] shrink-0">7. One to Investigate</span>
          <span className="px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#DDD5C5] shrink-0">8. Actionable Idea</span>
        </div>
      </div>

      {/* Subtabs Bar: Archive vs Follow-ups vs Sources */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-[#E2D8C3] pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveSubTab('archive')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono-code font-bold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'archive'
                ? 'bg-[#1E2022] text-[#FBF9F5]'
                : 'bg-[#F2ECE1] text-[#635E55] hover:bg-[#EAE2D2]'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-[#93C5FD]" />
            <span>World Scan Archive ({scans.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('followups')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono-code font-bold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'followups'
                ? 'bg-[#1E2022] text-[#FBF9F5]'
                : 'bg-[#F2ECE1] text-[#635E55] hover:bg-[#EAE2D2]'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Follow-Up Queue ({allFollowUps.filter((f) => !f.followUp.completed).length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('sources')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono-code font-bold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'sources'
                ? 'bg-[#1E2022] text-[#FBF9F5]'
                : 'bg-[#F2ECE1] text-[#635E55] hover:bg-[#EAE2D2]'
            }`}
          >
            <Link className="w-3.5 h-3.5 text-[#34D399]" />
            <span>Verified Sources ({allSources.length})</span>
          </button>
        </div>

        {onOpenIdeaVault && (
          <button
            type="button"
            onClick={onOpenIdeaVault}
            className="text-xs font-mono-code text-[#6D28D9] hover:underline flex items-center gap-1 font-semibold"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Go to Idea Vault →</span>
          </button>
        )}
      </div>

      {/* SUBTAB 1: ARCHIVE */}
      {activeSubTab === 'archive' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Filter & Search Bar */}
          <div className="p-3.5 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row items-center gap-3">
              {/* Search input */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A746B]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search scans, topics, technologies, opportunities, sources..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#DDD5C5] bg-[#FBF9F5] text-xs font-mono-code text-[#1E2022]"
                />
              </div>

              {/* Month selector */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full md:w-auto px-2.5 py-1.5 rounded-lg border border-[#DDD5C5] bg-[#FBF9F5] text-xs font-mono-code"
                >
                  {MONTH_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>

                {/* Status selector */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full md:w-auto px-2.5 py-1.5 rounded-lg border border-[#DDD5C5] bg-[#FBF9F5] text-xs font-mono-code"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="FOLLOW_UP">Follow-Up Needed</option>
                  <option value="NOT_STARTED">Not Started</option>
                </select>
              </div>
            </div>

            {/* Topic pill filter */}
            {allTopics.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[#F2ECE1] text-[11px] font-mono-code">
                <span className="text-[#7A746B] font-semibold">Filter Topic:</span>
                <button
                  type="button"
                  onClick={() => setSelectedTopic('ALL')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    selectedTopic === 'ALL'
                      ? 'bg-[#1E3A8A] text-[#FBF9F5] font-semibold'
                      : 'bg-[#F2ECE1] text-[#635E55] hover:bg-[#EAE2D2]'
                  }`}
                >
                  All ({scans.length})
                </button>
                {allTopics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => setSelectedTopic(topic)}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      selectedTopic === topic
                        ? 'bg-[#1E3A8A] text-[#FBF9F5] font-semibold'
                        : 'bg-[#F2ECE1] text-[#635E55] hover:bg-[#EAE2D2]'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Scans Grid */}
          {filteredScans.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-[#DDD5C5] bg-[#FFFFFF] space-y-3">
              <Globe className="w-8 h-8 text-[#9CA3AF] mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-slab font-bold text-[#1E2022]">No World Scans Found</h3>
                <p className="text-xs text-[#7A746B] max-w-md mx-auto">
                  {searchQuery || selectedMonth !== 'All Months' || selectedStatus !== 'ALL' || selectedTopic !== 'ALL'
                    ? 'No scans match your current filter settings.'
                    : 'Start your Sunday World Scan practice by creating your first entry.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenNewScan()}
                className="px-4 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#1E40AF] text-[#FBF9F5] text-xs font-mono-code font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Sunday Scan</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredScans.map((scan) => {
                const statusConf = STATUS_CONFIGS[scan.status] || STATUS_CONFIGS.COMPLETED;
                const weekInfo = getISOWeek(scan.date);
                const hasFollowUp = (scan.followUps || []).some((f) => !f.completed);

                return (
                  <div
                    key={scan.id}
                    onClick={() => handleInspectScan(scan)}
                    className="p-4 rounded-2xl border border-[#E2D8C3] bg-[#FFFFFF] hover:border-[#1E3A8A] hover:shadow-md transition-all cursor-pointer space-y-3 group"
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-md border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}>
                            {statusConf.label}
                          </span>
                          <span className="text-[11px] font-mono-code text-[#4A453E] font-semibold flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#2563EB]" />
                            {formatReadableDate(scan.date)}
                          </span>
                          <span className="text-[10px] font-mono-code text-[#7A746B] bg-[#F2ECE1] px-1.5 py-0.5 rounded">
                            Week {weekInfo.weekNumber}, {weekInfo.year}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleQuickExtract(scan, e)}
                        className="px-2.5 py-1 rounded-lg border border-[#DDD6FE] bg-[#F3E8FF] hover:bg-[#EDE9FE] text-[#6D28D9] text-[11px] font-mono-code font-bold flex items-center gap-1 shrink-0 transition-colors"
                        title="Extract into Idea Vault"
                      >
                        <Rocket className="w-3 h-3 text-[#7C3AED]" />
                        <span>Idea</span>
                      </button>
                    </div>

                    {/* Topics */}
                    {scan.topics && scan.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {scan.topics.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded bg-[#F2ECE1] text-[#4A453E] text-[10px] font-mono-code"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Key Highlights */}
                    <div className="space-y-1.5 text-xs">
                      {scan.sections?.biggestChange && (
                        <div>
                          <span className="text-[10px] font-mono-code font-bold text-[#1E3A8A] block">
                            Biggest Change:
                          </span>
                          <p className="text-[#1E2022] line-clamp-2 text-xs leading-snug">
                            {scan.sections.biggestChange}
                          </p>
                        </div>
                      )}
                      {scan.sections?.opportunity && (
                        <div>
                          <span className="text-[10px] font-mono-code font-bold text-[#166534] block">
                            Opportunity:
                          </span>
                          <p className="text-[#166534] line-clamp-2 text-xs leading-snug">
                            {scan.sections.opportunity}
                          </p>
                        </div>
                      )}
                      {scan.sections?.oneIdea && (
                        <div>
                          <span className="text-[10px] font-mono-code font-bold text-[#6D28D9] block">
                            Actionable Idea:
                          </span>
                          <p className="text-[#6D28D9] line-clamp-2 text-xs leading-snug font-medium">
                            {scan.sections.oneIdea}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Card Footer badges */}
                    <div className="pt-2 border-t border-[#F2ECE1] flex items-center justify-between text-[11px] font-mono-code text-[#7A746B]">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Link className="w-3 h-3 text-[#10B981]" />
                          <span>{scan.sources?.length || 0} Sources</span>
                        </span>
                        {hasFollowUp && (
                          <span className="flex items-center gap-1 text-[#B45309]">
                            <Clock className="w-3 h-3 text-[#F59E0B]" />
                            <span>Follow-up</span>
                          </span>
                        )}
                        {scan.extractedIdeaIds && scan.extractedIdeaIds.length > 0 && (
                          <span className="flex items-center gap-1 text-[#7C3AED]">
                            <Lightbulb className="w-3 h-3" />
                            <span>{scan.extractedIdeaIds.length} Idea{scan.extractedIdeaIds.length > 1 ? 's' : ''}</span>
                          </span>
                        )}
                      </div>

                      <span className="text-[#2563EB] group-hover:underline flex items-center gap-0.5">
                        <span>Details →</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: FOLLOW-UP QUEUE */}
      {activeSubTab === 'followups' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] space-y-1">
            <h3 className="font-mono-code font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#B45309]" />
              <span>Next-Week Investigation Queue</span>
            </h3>
            <p className="text-[11px]">
              Review questions, regulatory ambiguities, or market puzzles marked during previous Sunday World Scans.
            </p>
          </div>

          {allFollowUps.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-[#DDD5C5] bg-[#FFFFFF] text-xs text-[#7A746B]">
              No follow-up items logged yet. Mark questions to investigate next week in your World Scan write-ups.
            </div>
          ) : (
            <div className="space-y-2.5">
              {allFollowUps.map(({ scanId, scanDate, followUp }) => (
                <div
                  key={followUp.id}
                  className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 transition-all ${
                    followUp.completed
                      ? 'bg-[#F9FAFB] border-[#E5E7EB] text-[#9CA3AF]'
                      : 'bg-[#FFFFFF] border-[#E2D8C3] text-[#1E2022] shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={followUp.completed}
                      onChange={() => handleToggleFollowUpItem(scanId, followUp.id)}
                      className="w-4 h-4 rounded text-[#1E3A8A] mt-0.5 cursor-pointer"
                    />
                    <div className="space-y-1">
                      <p className={`text-xs ${followUp.completed ? 'line-through' : 'font-semibold'}`}>
                        {followUp.text}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-mono-code text-[#7A746B]">
                        <span>From Scan: {formatReadableDate(scanDate)}</span>
                        {followUp.targetWeek && (
                          <span className="px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                            Target: {followUp.targetWeek}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const targetScan = scans.find((s) => s.id === scanId);
                      if (targetScan) handleInspectScan(targetScan);
                    }}
                    className="text-[11px] font-mono-code text-[#2563EB] hover:underline shrink-0"
                  >
                    View Scan →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: VERIFIED SOURCES DIRECTORY */}
      {activeSubTab === 'sources' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534] space-y-1">
            <h3 className="font-mono-code font-bold flex items-center gap-1.5">
              <Link className="w-4 h-4 text-[#166534]" />
              <span>Verified Sources & Research Repository</span>
            </h3>
            <p className="text-[11px]">
              Every source logged across your Sunday intelligence logs is preserved here for reference and audit integrity.
            </p>
          </div>

          {allSources.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-[#DDD5C5] bg-[#FFFFFF] text-xs text-[#7A746B]">
              No sources logged yet. Add verified citations and URLs in your World Scan entries.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allSources.map(({ scanId, scanDate, source }) => (
                <div
                  key={source.id}
                  className="p-3.5 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-semibold text-[#1E2022] leading-tight">
                      {source.sourceName}
                    </h4>
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono-code text-[#2563EB] hover:underline flex items-center gap-0.5 shrink-0"
                      >
                        <span>Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {source.keyTakeaway && (
                    <p className="text-xs text-[#4A453E] leading-relaxed">
                      {source.keyTakeaway}
                    </p>
                  )}

                  <div className="pt-2 border-t border-[#F2ECE1] flex items-center justify-between text-[10px] font-mono-code text-[#7A746B]">
                    <span>Scan: {formatReadableDate(scanDate)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const targetScan = scans.find((s) => s.id === scanId);
                        if (targetScan) handleInspectScan(targetScan);
                      }}
                      className="text-[#2563EB] hover:underline"
                    >
                      Inspect Scan →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editor Modal */}
      <WorldScanEditorModal
        scan={editingScan}
        isOpen={isEditorOpen}
        initialDate={editorInitialDate}
        onClose={() => setIsEditorOpen(false)}
        onScanSaved={(saved) => {
          setIsEditorOpen(false);
          refreshScans();
        }}
        onOpenCreatedIdea={(ideaId) => {
          setIsEditorOpen(false);
          refreshScans();
          if (onOpenCreatedIdea) {
            onOpenCreatedIdea(ideaId);
          }
        }}
      />

      {/* Detail Modal */}
      <WorldScanDetailModal
        scan={inspectingScan}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEditScan={(scanToEdit) => handleEditScan(scanToEdit)}
        onScanUpdated={() => {
          refreshScans();
          if (inspectingScan) {
            const updated = loadWorldScans().find((s) => s.id === inspectingScan.id);
            setInspectingScan(updated || null);
          }
        }}
        onOpenCreatedIdea={(ideaId) => {
          setIsDetailOpen(false);
          refreshScans();
          if (onOpenCreatedIdea) {
            onOpenCreatedIdea(ideaId);
          }
        }}
      />
    </div>
  );
};
