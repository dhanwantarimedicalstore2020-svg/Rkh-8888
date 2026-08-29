import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  FileText,
  Globe,
  Layers,
  Lightbulb,
  Link,
  Plus,
  Rocket,
  RotateCcw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import {
  WorldScanFollowUp,
  WorldScanItem,
  WorldScanResearchStatus,
  WorldScanSource,
  WorldScanStructuredSections,
} from '../../types';
import {
  formatLocalISODate,
  formatReadableDate,
  formatShortDate,
  getISOWeek,
  getMonthInfo,
  getQuarterInfo,
  getTodayDateString,
  getWeekdayFromDate,
  offsetDays,
} from '../../utils/dateUtils';
import { upsertWorldScan, createIdeaFromWorldScan } from '../../services/storageService';

interface WorldScanEditorModalProps {
  scan: WorldScanItem | null;
  isOpen: boolean;
  onClose: () => void;
  onScanSaved: (savedScan: WorldScanItem) => void;
  onOpenCreatedIdea?: (ideaId: string) => void;
  initialDate?: string;
}

const PRESET_TOPICS = [
  'Pharma Manufacturing',
  'Healthcare Systems',
  'AI & Automation',
  'Supply Chain & Logistics',
  'Biotech & Formulations',
  'B2B SaaS',
  'Regulatory Compliance',
  'Consumer Behavior',
  'Hardware & Devices',
  'EdTech & Career',
];

const STATUS_OPTIONS: { id: WorldScanResearchStatus; label: string; bg: string; text: string; border: string }[] = [
  { id: 'NOT_STARTED', label: 'Not Started', bg: 'bg-[#F3F4F6]', text: 'text-[#4B5563]', border: 'border-[#E5E7EB]' },
  { id: 'IN_PROGRESS', label: 'In Progress', bg: 'bg-[#EFF6FF]', text: 'text-[#1D4ED8]', border: 'border-[#BFDBFE]' },
  { id: 'COMPLETED', label: 'Completed', bg: 'bg-[#ECFDF5]', text: 'text-[#047857]', border: 'border-[#A7F3D0]' },
  { id: 'FOLLOW_UP', label: 'Follow-Up Needed', bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]', border: 'border-[#FDE68A]' },
];

export const WorldScanEditorModal: React.FC<WorldScanEditorModalProps> = ({
  scan,
  isOpen,
  onClose,
  onScanSaved,
  onOpenCreatedIdea,
  initialDate,
}) => {
  const [activeTab, setActiveTab] = useState<'synthesis' | 'domains' | 'sources' | 'followup'>('synthesis');
  
  // Date & Automatic metadata
  const defaultDate = scan?.date || initialDate || getTodayDateString();
  const [date, setDate] = useState(defaultDate);
  const [status, setStatus] = useState<WorldScanResearchStatus>('COMPLETED');
  const [topics, setTopics] = useState<string[]>(['Pharma Manufacturing', 'AI & Automation']);
  const [customTopicInput, setCustomTopicInput] = useState('');

  // 8 Structured Sections
  const [sections, setSections] = useState<WorldScanStructuredSections>({
    biggestChange: '',
    techToWatch: '',
    industryChanging: '',
    businessModel: '',
    humanBehaviour: '',
    opportunity: '',
    oneToInvestigate: '',
    oneIdea: '',
  });

  // Exploratory Research Notes & Domains
  const [globalDevelopments, setGlobalDevelopments] = useState('');
  const [techInnovation, setTechInnovation] = useState('');
  const [industryAnalysis, setIndustryAnalysis] = useState('');
  const [linkedinTrends, setLinkedinTrends] = useState('');
  const [researchNotes, setResearchNotes] = useState('');

  // Sources & Follow-ups
  const [sources, setSources] = useState<WorldScanSource[]>([]);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceTakeaway, setNewSourceTakeaway] = useState('');

  const [followUps, setFollowUps] = useState<WorldScanFollowUp[]>([]);
  const [newFollowUpText, setNewFollowUpText] = useState('');

  // Collapsible accordion states for mobile UX
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const [isSavedBanner, setIsSavedBanner] = useState(false);
  const [extractedIdeaBanner, setExtractedIdeaBanner] = useState<string | null>(null);

  // Sync state with scan prop
  useEffect(() => {
    if (scan) {
      setDate(scan.date);
      setStatus(scan.status || 'COMPLETED');
      setTopics(Array.isArray(scan.topics) ? scan.topics : ['Global Tech']);
      setSections({
        biggestChange: scan.sections?.biggestChange || '',
        techToWatch: scan.sections?.techToWatch || '',
        industryChanging: scan.sections?.industryChanging || '',
        businessModel: scan.sections?.businessModel || '',
        humanBehaviour: scan.sections?.humanBehaviour || '',
        opportunity: scan.sections?.opportunity || '',
        oneToInvestigate: scan.sections?.oneToInvestigate || '',
        oneIdea: scan.sections?.oneIdea || '',
      });
      setGlobalDevelopments(scan.globalDevelopments || '');
      setTechInnovation(scan.techInnovation || '');
      setIndustryAnalysis(scan.industryAnalysis || '');
      setLinkedinTrends(scan.linkedinTrends || '');
      setResearchNotes(scan.researchNotes || '');
      setSources(Array.isArray(scan.sources) ? scan.sources : []);
      setFollowUps(Array.isArray(scan.followUps) ? scan.followUps : []);
    } else {
      const initDate = initialDate || getTodayDateString();
      setDate(initDate);
      setStatus('IN_PROGRESS');
      setTopics(['Pharma Manufacturing', 'Healthcare Systems']);
      setSections({
        biggestChange: '',
        techToWatch: '',
        industryChanging: '',
        businessModel: '',
        humanBehaviour: '',
        opportunity: '',
        oneToInvestigate: '',
        oneIdea: '',
      });
      setGlobalDevelopments('');
      setTechInnovation('');
      setIndustryAnalysis('');
      setLinkedinTrends('');
      setResearchNotes('');
      setSources([]);
      setFollowUps([]);
    }
    setIsSavedBanner(false);
    setExtractedIdeaBanner(null);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [scan, initialDate, isOpen, onClose]);

  if (!isOpen) return null;

  // Derived automatic temporal attributes
  const derivedWeek = getISOWeek(date);
  const derivedMonth = getMonthInfo(date);
  const derivedQuarter = getQuarterInfo(date);
  const derivedWeekday = getWeekdayFromDate(date);
  const isSunday = derivedWeekday === 'Sunday';

  const toggleTopic = (t: string) => {
    if (topics.includes(t)) {
      setTopics(topics.filter((item) => item !== t));
    } else {
      setTopics([...topics, t]);
    }
  };

  const handleAddCustomTopic = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customTopicInput.trim()) {
      e.preventDefault();
      const newT = customTopicInput.trim();
      if (!topics.includes(newT)) {
        setTopics([...topics, newT]);
      }
      setCustomTopicInput('');
    }
  };

  const handleSectionChange = (field: keyof WorldScanStructuredSections, value: string) => {
    setSections((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName.trim()) return;
    const newSrc: WorldScanSource = {
      id: `src-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      sourceName: newSourceName.trim(),
      url: newSourceUrl.trim() || undefined,
      dateAccessed: date,
      keyTakeaway: newSourceTakeaway.trim(),
    };
    setSources([...sources, newSrc]);
    setNewSourceName('');
    setNewSourceUrl('');
    setNewSourceTakeaway('');
  };

  const handleDeleteSource = (srcId: string) => {
    setSources(sources.filter((s) => s.id !== srcId));
  };

  const handleAddFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFollowUpText.trim()) return;
    const newFlw: WorldScanFollowUp = {
      id: `flw-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      text: newFollowUpText.trim(),
      completed: false,
      targetWeek: `W${derivedWeek.weekNumber + 1}`,
      createdAt: new Date().toISOString(),
    };
    setFollowUps([...followUps, newFlw]);
    setNewFollowUpText('');
  };

  const handleToggleFollowUp = (flwId: string) => {
    setFollowUps(
      followUps.map((f) => (f.id === flwId ? { ...f, completed: !f.completed } : f))
    );
  };

  const handleDeleteFollowUp = (flwId: string) => {
    setFollowUps(followUps.filter((f) => f.id !== flwId));
  };

  const toggleCollapse = (secKey: string) => {
    setCollapsedSections((prev) => ({ ...prev, [secKey]: !prev[secKey] }));
  };

  const handleSave = () => {
    const saved = upsertWorldScan({
      id: scan?.id,
      date,
      status,
      topics,
      sections,
      globalDevelopments,
      techInnovation,
      industryAnalysis,
      linkedinTrends,
      researchNotes,
      sources,
      followUps,
      investigateNextWeek: followUps.length > 0 || Boolean(sections.oneToInvestigate.trim()),
    });

    setIsSavedBanner(true);
    setTimeout(() => {
      setIsSavedBanner(false);
      onScanSaved(saved);
    }, 900);
  };

  const handleCreateIdea = () => {
    // Ensure scan is saved first
    const savedScan = upsertWorldScan({
      id: scan?.id,
      date,
      status,
      topics,
      sections,
      globalDevelopments,
      techInnovation,
      industryAnalysis,
      linkedinTrends,
      researchNotes,
      sources,
      followUps,
      investigateNextWeek: followUps.length > 0 || Boolean(sections.oneToInvestigate.trim()),
    });

    const newIdea = createIdeaFromWorldScan(
      savedScan.id,
      sections.oneIdea.trim() || sections.opportunity.trim() || `World Scan Idea (${date})`,
      sections.opportunity.trim() || sections.biggestChange.trim(),
      sections.oneIdea.trim() || sections.techToWatch.trim()
    );

    setExtractedIdeaBanner(`Extracted into Idea Vault: "${newIdea.title}"`);
    setTimeout(() => {
      setExtractedIdeaBanner(null);
      if (onOpenCreatedIdea) {
        onOpenCreatedIdea(newIdea.id);
      }
    }, 1200);
  };

  const currentStatusConfig = STATUS_OPTIONS.find((s) => s.id === status) || STATUS_OPTIONS[2];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#1E2022]/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        className="bg-[#FBF9F5] border border-[#E2D8C3] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="world-scan-title"
      >
        {/* Header Bar */}
        <div className="px-5 sm:px-6 py-4 bg-[#F2ECE1] border-b border-[#E2D8C3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1E3A8A] text-[#FBF9F5] shadow-xs">
              <Globe className="w-5 h-5 text-[#93C5FD]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-md border ${currentStatusConfig.bg} ${currentStatusConfig.text} ${currentStatusConfig.border}`}>
                  {currentStatusConfig.label}
                </span>
                <span className="text-[11px] font-mono-code text-[#4A453E] bg-[#FFFFFF] px-2 py-0.5 rounded-md border border-[#DDD5C5] flex items-center gap-1 font-semibold">
                  <Calendar className="w-3 h-3 text-[#2563EB]" />
                  {formatReadableDate(date)} • Week {derivedWeek.weekNumber}, {derivedWeek.year}
                </span>
                {!isSunday && (
                  <span className="text-[10px] font-mono-code text-[#B45309] bg-[#FEF3C7] px-1.5 py-0.5 rounded border border-[#FDE68A]">
                    {derivedWeekday} (Schedule: 10:00 AM–12:00 PM Sunday)
                  </span>
                )}
              </div>
              <h2 id="world-scan-title" className="font-slab font-bold text-base sm:text-lg text-[#1E2022] mt-0.5">
                {scan ? 'Edit Sunday World Scan & Research Intelligence' : 'New Sunday World Scan Intelligence Log'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={handleSave}
              className="px-3.5 py-1.5 rounded-xl text-xs font-mono-code font-bold flex items-center gap-1.5 bg-[#1E3A8A] hover:bg-[#1E40AF] text-[#FBF9F5] shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Scan</span>
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

        {/* Date Selector & Meta Bar */}
        <div className="px-5 sm:px-6 py-2.5 bg-[#FFFFFF] border-b border-[#EAE4D6] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <label className="text-[#635E55] font-mono-code font-medium">Calendar Date:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-2 py-1 rounded-lg border border-[#DDD5C5] bg-[#FBF9F5] text-xs font-mono-code text-[#1E2022] font-semibold"
              />
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono-code text-[#7A746B]">
              <span>Quarter: <strong>Q{derivedQuarter.quarter}</strong></span>
              <span>•</span>
              <span>Month: <strong>{derivedMonth.name}</strong></span>
              <span>•</span>
              <span>ISO Week: <strong>W{derivedWeek.weekNumber}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[#635E55] font-mono-code font-medium">Research Status:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as WorldScanResearchStatus)}
              className="px-2 py-1 rounded-lg border border-[#DDD5C5] bg-[#FBF9F5] text-xs font-mono-code"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 sm:px-6 bg-[#FBF9F5] border-b border-[#EAE4D6] flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
          <button
            type="button"
            onClick={() => setActiveTab('synthesis')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'synthesis'
                ? 'bg-[#1E2022] text-[#FBF9F5]'
                : 'text-[#635E55] hover:bg-[#F2ECE1]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FDE68A]" />
            <span>8 Structured Sections</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('domains')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'domains'
                ? 'bg-[#1E2022] text-[#FBF9F5]'
                : 'text-[#635E55] hover:bg-[#F2ECE1]'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span>Exploratory Domains</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sources')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'sources'
                ? 'bg-[#1E2022] text-[#FBF9F5]'
                : 'text-[#635E55] hover:bg-[#F2ECE1]'
            }`}
          >
            <Link className="w-3.5 h-3.5 text-[#34D399]" />
            <span>Verified Sources ({sources.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('followup')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'followup'
                ? 'bg-[#1E2022] text-[#FBF9F5]'
                : 'text-[#635E55] hover:bg-[#F2ECE1]'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Follow-Ups ({followUps.length})</span>
          </button>
        </div>

        {/* Banner alerts */}
        {isSavedBanner && (
          <div className="px-6 py-2 bg-[#ECFDF5] border-b border-[#A7F3D0] text-[#065F46] text-xs font-mono-code flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
            <span>World Scan saved successfully with verified calendar integrity.</span>
          </div>
        )}
        {extractedIdeaBanner && (
          <div className="px-6 py-2 bg-[#F3E8FF] border-b border-[#DDD6FE] text-[#6D28D9] text-xs font-mono-code flex items-center gap-2 animate-in fade-in">
            <Lightbulb className="w-4 h-4 text-[#7C3AED]" />
            <span>{extractedIdeaBanner}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: 8 STRUCTURED SECTIONS */}
          {activeTab === 'synthesis' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Topic tags pill selector */}
              <div>
                <label className="text-xs font-mono-code text-[#4A453E] font-semibold mb-1.5 block">
                  Industry & Technology Domains:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_TOPICS.map((topic) => {
                    const isSelected = topics.includes(topic);
                    return (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => toggleTopic(topic)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono-code transition-all ${
                          isSelected
                            ? 'bg-[#1E3A8A] text-[#FBF9F5] font-semibold shadow-2xs'
                            : 'bg-[#F2ECE1] text-[#635E55] hover:bg-[#EAE2D2]'
                        }`}
                      >
                        {topic}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 max-w-sm">
                  <input
                    type="text"
                    value={customTopicInput}
                    onChange={(e) => setCustomTopicInput(e.target.value)}
                    onKeyDown={handleAddCustomTopic}
                    placeholder="Type custom topic & press Enter..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-xs font-mono-code text-[#1E2022]"
                  />
                </div>
              </div>

              {/* 8 Structured Sections Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Biggest change */}
                <div className="p-4 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono-code font-bold text-[#1E3A8A] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-[#DBEAFE] text-[#1E40AF] flex items-center justify-center text-[11px] font-bold">1</span>
                      <span>Biggest Change Observed</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-[#7A746B] leading-tight">
                    What macro shift, regulation change, or major transition occurred this week?
                  </p>
                  <textarea
                    rows={2}
                    value={sections.biggestChange}
                    onChange={(e) => handleSectionChange('biggestChange', e.target.value)}
                    placeholder="e.g. Shift from batch processing to continuous micro-reactor synthesis in active ingredient manufacturing..."
                    className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FBF9F5] text-xs text-[#1E2022] font-sans focus:bg-[#FFFFFF] transition-colors"
                  />
                </div>

                {/* 2. Technology to watch */}
                <div className="p-4 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono-code font-bold text-[#0D9488] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center text-[11px] font-bold">2</span>
                      <span>Technology to Watch</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-[#7A746B] leading-tight">
                    Emerging software, automation tool, hardware, or lab innovation.
                  </p>
                  <textarea
                    rows={2}
                    value={sections.techToWatch}
                    onChange={(e) => handleSectionChange('techToWatch', e.target.value)}
                    placeholder="e.g. In-line NIR spectroscopy sensors for continuous drug blend uniformity..."
                    className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FBF9F5] text-xs text-[#1E2022] font-sans focus:bg-[#FFFFFF] transition-colors"
                  />
                </div>

                {/* 3. Industry changing */}
                <div className="p-4 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono-code font-bold text-[#6D28D9] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-[#EDE9FE] text-[#6D28D9] flex items-center justify-center text-[11px] font-bold">3</span>
                      <span>Industry Changing</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-[#7A746B] leading-tight">
                    Which sector is being restructured, disrupted, or consolidated?
                  </p>
                  <textarea
                    rows={2}
                    value={sections.industryChanging}
                    onChange={(e) => handleSectionChange('industryChanging', e.target.value)}
                    placeholder="e.g. Decentralized clinical trials and contract testing laboratories..."
                    className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FBF9F5] text-xs text-[#1E2022] font-sans focus:bg-[#FFFFFF] transition-colors"
                  />
                </div>

                {/* 4. Business model noticed */}
                <div className="p-4 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono-code font-bold text-[#B45309] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-[#FEF3C7] text-[#B45309] flex items-center justify-center text-[11px] font-bold">4</span>
                      <span>Business Model Noticed</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-[#7A746B] leading-tight">
                    How are innovative operators monetizing, distributing, or pricing?
                  </p>
                  <textarea
                    rows={2}
                    value={sections.businessModel}
                    onChange={(e) => handleSectionChange('businessModel', e.target.value)}
                    placeholder="e.g. Compliance-as-a-Service monthly subscription for pharmacy ledger audits..."
                    className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FBF9F5] text-xs text-[#1E2022] font-sans focus:bg-[#FFFFFF] transition-colors"
                  />
                </div>

                {/* 5. Human behaviour changing */}
                <div className="p-4 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono-code font-bold text-[#C2410C] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-[#FFEDD5] text-[#C2410C] flex items-center justify-center text-[11px] font-bold">5</span>
                      <span>Human Behaviour Changing</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-[#7A746B] leading-tight">
                    Shifts in customer trust, buyer habits, patient preferences, or user friction.
                  </p>
                  <textarea
                    rows={2}
                    value={sections.humanBehaviour}
                    onChange={(e) => handleSectionChange('humanBehaviour', e.target.value)}
                    placeholder="e.g. Buyers scanning authenticity QR codes before accepting pharmaceutical packages..."
                    className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FBF9F5] text-xs text-[#1E2022] font-sans focus:bg-[#FFFFFF] transition-colors"
                  />
                </div>

                {/* 6. Opportunity/problem */}
                <div className="p-4 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono-code font-bold text-[#166534] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-[#DCFCE7] text-[#166534] flex items-center justify-center text-[11px] font-bold">6</span>
                      <span>Opportunity / Problem</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-[#7A746B] leading-tight">
                    Where is the painful bottleneck that someone could build a business to fix?
                  </p>
                  <textarea
                    rows={2}
                    value={sections.opportunity}
                    onChange={(e) => handleSectionChange('opportunity', e.target.value)}
                    placeholder="e.g. High validation complexity for small formulation units transitioning to digital logs..."
                    className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FBF9F5] text-xs text-[#1E2022] font-sans focus:bg-[#FFFFFF] transition-colors"
                  />
                </div>

                {/* 7. One thing to investigate */}
                <div className="p-4 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono-code font-bold text-[#9333EA] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center text-[11px] font-bold">7</span>
                      <span>One Thing to Investigate</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-[#7A746B] leading-tight">
                    What specific question will you research during the upcoming week?
                  </p>
                  <textarea
                    rows={2}
                    value={sections.oneToInvestigate}
                    onChange={(e) => handleSectionChange('oneToInvestigate', e.target.value)}
                    placeholder="e.g. How Indian GMP guidelines regulate digital audit trails in small production batches..."
                    className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FBF9F5] text-xs text-[#1E2022] font-sans focus:bg-[#FFFFFF] transition-colors"
                  />
                </div>

                {/* 8. One idea */}
                <div className="p-4 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono-code font-bold text-[#B91C1C] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-[#FEE2E2] text-[#B91C1C] flex items-center justify-center text-[11px] font-bold">8</span>
                      <span>One Actionable Venture Idea</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-[#7A746B] leading-tight">
                    Concrete product or venture concept derived from this scan.
                  </p>
                  <textarea
                    rows={2}
                    value={sections.oneIdea}
                    onChange={(e) => handleSectionChange('oneIdea', e.target.value)}
                    placeholder="e.g. Digital Batch Record verification mobile app for manufacturing floor supervisors..."
                    className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FBF9F5] text-xs text-[#1E2022] font-sans focus:bg-[#FFFFFF] transition-colors"
                  />
                </div>
              </div>

              {/* Compact Synthesis Review Card */}
              <div className="p-4 rounded-xl border border-[#DDD5C5] bg-[#F4EFE6] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-mono-code font-bold text-[#1E2022] flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>Live Synthesis Summary</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleCreateIdea}
                    className="px-3 py-1 rounded-lg bg-[#5B21B6] hover:bg-[#4C1D95] text-[#FBF9F5] text-xs font-mono-code font-bold flex items-center gap-1 shadow-2xs transition-colors"
                  >
                    <Rocket className="w-3 h-3 text-[#FDE68A]" />
                    <span>Extract into Idea Vault →</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-[#FFFFFF] border border-[#E2D8C3]">
                    <span className="text-[10px] font-mono-code text-[#7A746B] uppercase font-bold block">Biggest Change</span>
                    <p className="text-[#1E2022] font-medium mt-0.5 truncate">{sections.biggestChange || '—'}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#FFFFFF] border border-[#E2D8C3]">
                    <span className="text-[10px] font-mono-code text-[#7A746B] uppercase font-bold block">Opportunity</span>
                    <p className="text-[#166534] font-medium mt-0.5 truncate">{sections.opportunity || '—'}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#FFFFFF] border border-[#E2D8C3]">
                    <span className="text-[10px] font-mono-code text-[#7A746B] uppercase font-bold block">Actionable Idea</span>
                    <p className="text-[#6D28D9] font-medium mt-0.5 truncate">{sections.oneIdea || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXPLORATORY RESEARCH DOMAINS */}
          {activeTab === 'domains' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-xs text-[#1E40AF]">
                <p className="font-semibold font-mono-code">Sunday Research Timetable (10:00–11:30 AM Research → 11:30 AM–12:00 PM Write-up)</p>
                <p className="text-[11px] text-[#3B82F6] mt-0.5">
                  Record domain findings across global geopolitics, technical breakthroughs, industry analysis, and professional trends.
                </p>
              </div>

              {/* Global Developments */}
              <div className="p-4 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] space-y-1.5">
                <label className="text-xs font-mono-code font-bold text-[#1E2022] flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#2563EB]" />
                  <span>1. Global Developments & Macro Trends (15 min)</span>
                </label>
                <textarea
                  rows={3}
                  value={globalDevelopments}
                  onChange={(e) => setGlobalDevelopments(e.target.value)}
                  placeholder="Macroeconomic shifts, national health policies, cross-border supply changes, trade regulations..."
                  className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FBF9F5] text-xs font-sans text-[#1E2022]"
                />
              </div>

              {/* Tech & Innovation */}
              <div className="p-4 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] space-y-1.5">
                <label className="text-xs font-mono-code font-bold text-[#1E2022] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#0D9488]" />
                  <span>2. Technology & Innovation Frontiers (20 min)</span>
                </label>
                <textarea
                  rows={3}
                  value={techInnovation}
                  onChange={(e) => setTechInnovation(e.target.value)}
                  placeholder="AI tools, micro-reactors, API software, lab equipment, robotics, formulation science..."
                  className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FBF9F5] text-xs font-sans text-[#1E2022]"
                />
              </div>

              {/* Industry Analysis */}
              <div className="p-4 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] space-y-1.5">
                <label className="text-xs font-mono-code font-bold text-[#1E2022] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#7C3AED]" />
                  <span>3. Industry & Market Dynamics (20 min)</span>
                </label>
                <textarea
                  rows={3}
                  value={industryAnalysis}
                  onChange={(e) => setIndustryAnalysis(e.target.value)}
                  placeholder="Competitor moves, pharmaceutical mergers, supply chain bottlenecks, pricing pressures..."
                  className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FBF9F5] text-xs font-sans text-[#1E2022]"
                />
              </div>

              {/* Professional & LinkedIn Trends */}
              <div className="p-4 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] space-y-1.5">
                <label className="text-xs font-mono-code font-bold text-[#1E2022] flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-[#B45309]" />
                  <span>4. Professional & Talent Trends (15 min)</span>
                </label>
                <textarea
                  rows={3}
                  value={linkedinTrends}
                  onChange={(e) => setLinkedinTrends(e.target.value)}
                  placeholder="Hiring surges, required skills, executive shifts, professional conversations..."
                  className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FBF9F5] text-xs font-sans text-[#1E2022]"
                />
              </div>

              {/* Free-form research notes */}
              <div className="p-4 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] space-y-1.5">
                <label className="text-xs font-mono-code font-bold text-[#1E2022] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#4A453E]" />
                  <span>Additional Research Notes & Observations</span>
                </label>
                <textarea
                  rows={4}
                  value={researchNotes}
                  onChange={(e) => setResearchNotes(e.target.value)}
                  placeholder="Bullet points, exploratory calculations, quotes, or synthesis points..."
                  className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FBF9F5] text-xs font-mono-code text-[#1E2022]"
                />
              </div>
            </div>
          )}

          {/* TAB 3: VERIFIED SOURCES CAPTURE */}
          {activeTab === 'sources' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534]">
                <p className="font-semibold font-mono-code">Verified Source Integrity</p>
                <p className="text-[11px] text-[#15803D] mt-0.5">
                  Capture verified reports, regulatory documents, whitepapers, and industry journals. No fake or fabricated citations.
                </p>
              </div>

              {/* Add Source Form */}
              <form onSubmit={handleAddSource} className="p-4 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] space-y-3 shadow-2xs">
                <h4 className="text-xs font-mono-code font-bold text-[#1E2022] uppercase tracking-wider">
                  + Record Verified Source
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono-code text-[#635E55] mb-1 block">Source Name / Publisher *</label>
                    <input
                      type="text"
                      required
                      value={newSourceName}
                      onChange={(e) => setNewSourceName(e.target.value)}
                      placeholder="e.g. FDA Guidance on Continuous Flow Manufacturing"
                      className="w-full p-2 rounded-lg border border-[#DDD5C5] bg-[#FBF9F5] text-xs text-[#1E2022]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono-code text-[#635E55] mb-1 block">Source URL (Safe Link)</label>
                    <input
                      type="url"
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full p-2 rounded-lg border border-[#DDD5C5] bg-[#FBF9F5] text-xs text-[#1E2022]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-mono-code text-[#635E55] mb-1 block">Key Takeaway / Excerpt</label>
                  <input
                    type="text"
                    value={newSourceTakeaway}
                    onChange={(e) => setNewSourceTakeaway(e.target.value)}
                    placeholder="e.g. Regulatory validation framework streamlined for micro-reactors..."
                    className="w-full p-2 rounded-lg border border-[#DDD5C5] bg-[#FBF9F5] text-xs text-[#1E2022]"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-[#1E3A8A] hover:bg-[#1E40AF] text-[#FBF9F5] text-xs font-mono-code font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Source</span>
                  </button>
                </div>
              </form>

              {/* Sources List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-mono-code font-bold text-[#4A453E] uppercase tracking-wider">
                  Logged Sources ({sources.length})
                </h4>
                {sources.length === 0 ? (
                  <div className="p-6 text-center rounded-xl border border-dashed border-[#DDD5C5] bg-[#FBF9F5] text-xs text-[#7A746B]">
                    No sources recorded yet for this scan. Add credible industry publications or official filings above.
                  </div>
                ) : (
                  sources.map((src) => (
                    <div
                      key={src.id}
                      className="p-3 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] flex items-start justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-xs text-[#1E2022]">{src.sourceName}</span>
                          {src.url && (
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-mono-code text-[#2563EB] hover:underline flex items-center gap-0.5"
                            >
                              <span>Visit Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <span className="text-[10px] font-mono-code text-[#7A746B]">
                            Accessed: {src.dateAccessed}
                          </span>
                        </div>
                        {src.keyTakeaway && (
                          <p className="text-xs text-[#4A453E] font-sans">
                            {src.keyTakeaway}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSource(src.id)}
                        className="p-1 text-[#9CA3AF] hover:text-[#DC2626] rounded-md transition-colors"
                        title="Delete source"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: FOLLOW-UP TRACKER */}
          {activeTab === 'followup' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E]">
                <p className="font-semibold font-mono-code">"Investigate This Next Week" Action Queue</p>
                <p className="text-[11px] text-[#B45309] mt-0.5">
                  Items marked for follow-up are preserved in your action queue rather than disappearing inside notes.
                </p>
              </div>

              {/* Add Follow-Up Form */}
              <form onSubmit={handleAddFollowUp} className="p-4 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] space-y-3 shadow-2xs">
                <h4 className="text-xs font-mono-code font-bold text-[#1E2022] uppercase tracking-wider">
                  + Add Next-Week Investigation Item
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newFollowUpText}
                    onChange={(e) => setNewFollowUpText(e.target.value)}
                    placeholder="e.g. Audit stability testing protocol differences between US FDA and Indian CDSCO..."
                    className="flex-1 p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FBF9F5] text-xs text-[#1E2022]"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-lg bg-[#B45309] hover:bg-[#92400E] text-[#FBF9F5] text-xs font-mono-code font-bold flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Queue</span>
                  </button>
                </div>
              </form>

              {/* Follow-ups List */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono-code font-bold text-[#4A453E] uppercase tracking-wider">
                  Action Items ({followUps.length})
                </h4>
                {followUps.length === 0 ? (
                  <div className="p-6 text-center rounded-xl border border-dashed border-[#DDD5C5] bg-[#FBF9F5] text-xs text-[#7A746B]">
                    No follow-up research queued. Mark questions to explore in your next revision or skill block.
                  </div>
                ) : (
                  followUps.map((flw) => (
                    <div
                      key={flw.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        flw.completed
                          ? 'bg-[#F9FAFB] border-[#E5E7EB] text-[#6B7280]'
                          : 'bg-[#FFFFFF] border-[#E2D8C3] text-[#1E2022]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-1">
                        <input
                          type="checkbox"
                          checked={flw.completed}
                          onChange={() => handleToggleFollowUp(flw.id)}
                          className="w-4 h-4 rounded text-[#1E3A8A] focus:ring-0 cursor-pointer"
                        />
                        <span className={`text-xs ${flw.completed ? 'line-through text-[#9CA3AF]' : 'font-medium'}`}>
                          {flw.text}
                        </span>
                        {flw.targetWeek && (
                          <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                            Target: {flw.targetWeek}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteFollowUp(flw.id)}
                        className="p-1 text-[#9CA3AF] hover:text-[#DC2626] rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="px-5 sm:px-6 py-3.5 bg-[#F2ECE1] border-t border-[#E2D8C3] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateIdea}
              className="px-3 py-1.5 rounded-xl border border-[#DDD6FE] bg-[#F3E8FF] hover:bg-[#EDE9FE] text-[#6D28D9] text-xs font-mono-code font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Rocket className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Create Idea in Vault</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] hover:bg-[#EFE9DC] text-[#4A453E] text-xs font-mono-code transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-[#1E3A8A] hover:bg-[#1E40AF] text-[#FBF9F5] text-xs font-mono-code font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save World Scan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
