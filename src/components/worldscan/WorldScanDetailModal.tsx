import React, { useState } from 'react';
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Edit3,
  ExternalLink,
  FileText,
  Globe,
  Layers,
  Lightbulb,
  Link,
  Plus,
  Rocket,
  RotateCcw,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { WorldScanItem, WorldScanResearchStatus } from '../../types';
import { formatReadableDate, formatShortDate, getISOWeek, getWeekdayFromDate } from '../../utils/dateUtils';
import {
  createIdeaFromWorldScan,
  deleteWorldScan,
  upsertWorldScan,
} from '../../services/storageService';

interface WorldScanDetailModalProps {
  scan: WorldScanItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEditScan: (scan: WorldScanItem) => void;
  onScanUpdated: () => void;
  onOpenCreatedIdea?: (ideaId: string) => void;
}

const STATUS_CONFIGS: Record<WorldScanResearchStatus, { label: string; bg: string; text: string; border: string }> = {
  NOT_STARTED: { label: 'Not Started', bg: 'bg-[#F3F4F6]', text: 'text-[#4B5563]', border: 'border-[#E5E7EB]' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-[#EFF6FF]', text: 'text-[#1D4ED8]', border: 'border-[#BFDBFE]' },
  COMPLETED: { label: 'Completed', bg: 'bg-[#ECFDF5]', text: 'text-[#047857]', border: 'border-[#A7F3D0]' },
  FOLLOW_UP: { label: 'Follow-Up Needed', bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]', border: 'border-[#FDE68A]' },
};

export const WorldScanDetailModal: React.FC<WorldScanDetailModalProps> = ({
  scan,
  isOpen,
  onClose,
  onEditScan,
  onScanUpdated,
  onOpenCreatedIdea,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [extractedBanner, setExtractedBanner] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setShowDeleteConfirm(false);
      setExtractedBanner(null);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !scan) return null;

  const statusConfig = STATUS_CONFIGS[scan.status] || STATUS_CONFIGS.COMPLETED;
  const weekday = getWeekdayFromDate(scan.date);
  const weekInfo = getISOWeek(scan.date);

  const handleToggleFollowUp = (flwId: string) => {
    const updatedFollowUps = (scan.followUps || []).map((f) =>
      f.id === flwId ? { ...f, completed: !f.completed } : f
    );
    upsertWorldScan({
      ...scan,
      followUps: updatedFollowUps,
    });
    onScanUpdated();
  };

  const handleDelete = () => {
    deleteWorldScan(scan.id);
    onScanUpdated();
    onClose();
  };

  const handleExtractIdea = () => {
    const newIdea = createIdeaFromWorldScan(
      scan.id,
      scan.sections.oneIdea || scan.sections.opportunity || `Opportunity (${scan.date})`,
      scan.sections.opportunity || scan.sections.biggestChange,
      scan.sections.oneIdea || scan.sections.techToWatch
    );
    onScanUpdated();
    setExtractedBanner(`Created Idea in Vault: "${newIdea.title}"`);
    setTimeout(() => {
      setExtractedBanner(null);
      if (onOpenCreatedIdea) {
        onOpenCreatedIdea(newIdea.id);
      }
    }, 1000);
  };

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
        aria-labelledby="world-scan-detail-title"
      >
        {/* Header Bar */}
        <div className="px-5 sm:px-6 py-4 bg-[#F2ECE1] border-b border-[#E2D8C3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1E3A8A] text-[#FBF9F5] shadow-xs">
              <Globe className="w-5 h-5 text-[#93C5FD]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-md border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                  {statusConfig.label}
                </span>
                <span className="text-[11px] font-mono-code text-[#4A453E] bg-[#FFFFFF] px-2 py-0.5 rounded-md border border-[#DDD5C5] flex items-center gap-1 font-semibold">
                  <Calendar className="w-3 h-3 text-[#2563EB]" />
                  {formatReadableDate(scan.date)} • Week {weekInfo.weekNumber}, {weekInfo.year}
                </span>
                <span className="text-[10px] font-mono-code text-[#7A746B]">
                  Q{scan.quarter} • {scan.monthName}
                </span>
              </div>
              <h2 id="world-scan-detail-title" className="font-slab font-bold text-base sm:text-lg text-[#1E2022] mt-0.5">
                Sunday World Scan Synthesis & Research Intelligence
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => onEditScan(scan)}
              className="px-3 py-1.5 rounded-xl text-xs font-mono-code font-semibold flex items-center gap-1.5 border border-[#DDD5C5] bg-[#FFFFFF] hover:bg-[#EFE9DC] text-[#1E2022] shadow-2xs transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Edit Scan</span>
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

        {/* Banner */}
        {extractedBanner && (
          <div className="px-6 py-2.5 bg-[#F3E8FF] border-b border-[#DDD6FE] text-[#6D28D9] text-xs font-mono-code flex items-center gap-2 animate-in fade-in">
            <Lightbulb className="w-4 h-4 text-[#7C3AED]" />
            <span>{extractedBanner}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Topic Tags */}
          {scan.topics && scan.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {scan.topics.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] text-[11px] font-mono-code font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Compact Synthesis Review Highlights Card */}
          <div className="p-4 rounded-xl border border-[#DDD5C5] bg-[#F4EFE6] space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-mono-code font-bold text-[#1E2022] flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Executive Synthesis</span>
              </h3>
              <button
                type="button"
                onClick={handleExtractIdea}
                className="px-3 py-1 rounded-lg bg-[#5B21B6] hover:bg-[#4C1D95] text-[#FBF9F5] text-xs font-mono-code font-bold flex items-center gap-1 shadow-2xs transition-colors"
              >
                <Rocket className="w-3 h-3 text-[#FDE68A]" />
                <span>Extract Idea to Vault →</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#E2D8C3]">
                <span className="text-[10px] font-mono-code text-[#1E3A8A] uppercase font-bold block">1. Biggest Change</span>
                <p className="text-[#1E2022] font-semibold mt-1">{scan.sections?.biggestChange || '—'}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#E2D8C3]">
                <span className="text-[10px] font-mono-code text-[#166534] uppercase font-bold block">6. Opportunity / Problem</span>
                <p className="text-[#166534] font-semibold mt-1">{scan.sections?.opportunity || '—'}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#E2D8C3]">
                <span className="text-[10px] font-mono-code text-[#6D28D9] uppercase font-bold block">8. Actionable Idea</span>
                <p className="text-[#6D28D9] font-semibold mt-1">{scan.sections?.oneIdea || '—'}</p>
              </div>
            </div>
          </div>

          {/* 8 Structured Sections Grid */}
          <div>
            <h3 className="text-xs font-mono-code font-bold text-[#4A453E] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#2563EB]" />
              <span>Complete 8-Section Intelligence Write-up</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
              {/* 1 */}
              <div className="p-3.5 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] space-y-1 shadow-2xs">
                <span className="text-[11px] font-mono-code font-bold text-[#1E3A8A] flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-[#DBEAFE] text-[#1E40AF] flex items-center justify-center text-[10px]">1</span>
                  Biggest Change
                </span>
                <p className="text-[#1E2022] font-sans leading-relaxed">{scan.sections?.biggestChange || 'No notes logged.'}</p>
              </div>

              {/* 2 */}
              <div className="p-3.5 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] space-y-1 shadow-2xs">
                <span className="text-[11px] font-mono-code font-bold text-[#0D9488] flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center text-[10px]">2</span>
                  Technology to Watch
                </span>
                <p className="text-[#1E2022] font-sans leading-relaxed">{scan.sections?.techToWatch || 'No notes logged.'}</p>
              </div>

              {/* 3 */}
              <div className="p-3.5 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] space-y-1 shadow-2xs">
                <span className="text-[11px] font-mono-code font-bold text-[#6D28D9] flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-[#EDE9FE] text-[#6D28D9] flex items-center justify-center text-[10px]">3</span>
                  Industry Changing
                </span>
                <p className="text-[#1E2022] font-sans leading-relaxed">{scan.sections?.industryChanging || 'No notes logged.'}</p>
              </div>

              {/* 4 */}
              <div className="p-3.5 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] space-y-1 shadow-2xs">
                <span className="text-[11px] font-mono-code font-bold text-[#B45309] flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-[#FEF3C7] text-[#B45309] flex items-center justify-center text-[10px]">4</span>
                  Business Model Noticed
                </span>
                <p className="text-[#1E2022] font-sans leading-relaxed">{scan.sections?.businessModel || 'No notes logged.'}</p>
              </div>

              {/* 5 */}
              <div className="p-3.5 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] space-y-1 shadow-2xs">
                <span className="text-[11px] font-mono-code font-bold text-[#C2410C] flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-[#FFEDD5] text-[#C2410C] flex items-center justify-center text-[10px]">5</span>
                  Human Behaviour Changing
                </span>
                <p className="text-[#1E2022] font-sans leading-relaxed">{scan.sections?.humanBehaviour || 'No notes logged.'}</p>
              </div>

              {/* 6 */}
              <div className="p-3.5 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] space-y-1 shadow-2xs">
                <span className="text-[11px] font-mono-code font-bold text-[#166534] flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-[#DCFCE7] text-[#166534] flex items-center justify-center text-[10px]">6</span>
                  Opportunity / Problem
                </span>
                <p className="text-[#1E2022] font-sans leading-relaxed">{scan.sections?.opportunity || 'No notes logged.'}</p>
              </div>

              {/* 7 */}
              <div className="p-3.5 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] space-y-1 shadow-2xs">
                <span className="text-[11px] font-mono-code font-bold text-[#9333EA] flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center text-[10px]">7</span>
                  One Thing to Investigate
                </span>
                <p className="text-[#1E2022] font-sans leading-relaxed">{scan.sections?.oneToInvestigate || 'No notes logged.'}</p>
              </div>

              {/* 8 */}
              <div className="p-3.5 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] space-y-1 shadow-2xs">
                <span className="text-[11px] font-mono-code font-bold text-[#B91C1C] flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-[#FEE2E2] text-[#B91C1C] flex items-center justify-center text-[10px]">8</span>
                  Actionable Idea
                </span>
                <p className="text-[#1E2022] font-sans leading-relaxed">{scan.sections?.oneIdea || 'No notes logged.'}</p>
              </div>
            </div>
          </div>

          {/* Exploratory Domains Breakdown */}
          {(scan.globalDevelopments || scan.techInnovation || scan.industryAnalysis || scan.linkedinTrends || scan.researchNotes) && (
            <div className="p-4 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] space-y-3 shadow-2xs text-xs">
              <h3 className="text-xs font-mono-code font-bold text-[#1E2022] uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#2563EB]" />
                <span>Exploratory Domain Notes (10:00–11:30 AM Research)</span>
              </h3>

              <div className="space-y-2.5">
                {scan.globalDevelopments && (
                  <div>
                    <span className="font-mono-code text-[11px] text-[#2563EB] font-bold block">Global Developments:</span>
                    <p className="text-[#4A453E] font-sans mt-0.5">{scan.globalDevelopments}</p>
                  </div>
                )}
                {scan.techInnovation && (
                  <div>
                    <span className="font-mono-code text-[11px] text-[#0D9488] font-bold block">Tech & Innovation:</span>
                    <p className="text-[#4A453E] font-sans mt-0.5">{scan.techInnovation}</p>
                  </div>
                )}
                {scan.industryAnalysis && (
                  <div>
                    <span className="font-mono-code text-[11px] text-[#7C3AED] font-bold block">Industry & Market:</span>
                    <p className="text-[#4A453E] font-sans mt-0.5">{scan.industryAnalysis}</p>
                  </div>
                )}
                {scan.linkedinTrends && (
                  <div>
                    <span className="font-mono-code text-[11px] text-[#B45309] font-bold block">LinkedIn / Career Trends:</span>
                    <p className="text-[#4A453E] font-sans mt-0.5">{scan.linkedinTrends}</p>
                  </div>
                )}
                {scan.researchNotes && (
                  <div className="pt-2 border-t border-[#F2ECE1]">
                    <span className="font-mono-code text-[11px] text-[#7A746B] font-bold block">Additional Research Notes:</span>
                    <p className="text-[#1E2022] font-mono-code text-[11px] whitespace-pre-wrap mt-1 p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5]">
                      {scan.researchNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verified Sources */}
          {scan.sources && scan.sources.length > 0 && (
            <div className="p-4 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] space-y-3 shadow-2xs text-xs">
              <h3 className="text-xs font-mono-code font-bold text-[#1E2022] uppercase tracking-wider flex items-center gap-1.5">
                <Link className="w-4 h-4 text-[#166534]" />
                <span>Verified Sources ({scan.sources.length})</span>
              </h3>
              <div className="space-y-2">
                {scan.sources.map((src) => (
                  <div key={src.id} className="p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FBF9F5] space-y-0.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-semibold text-xs text-[#1E2022]">{src.sourceName}</span>
                      {src.url && (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-mono-code text-[#2563EB] hover:underline flex items-center gap-0.5"
                        >
                          <span>Open Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    {src.keyTakeaway && (
                      <p className="text-xs text-[#4A453E]">{src.keyTakeaway}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Follow-ups ("Investigate this next week") */}
          {scan.followUps && scan.followUps.length > 0 && (
            <div className="p-4 rounded-xl border border-[#E2D8C3] bg-[#FFFFFF] space-y-3 shadow-2xs text-xs">
              <h3 className="text-xs font-mono-code font-bold text-[#1E2022] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#B45309]" />
                <span>Action Items & Next-Week Follow-ups ({scan.followUps.length})</span>
              </h3>
              <div className="space-y-2">
                {scan.followUps.map((flw) => (
                  <div
                    key={flw.id}
                    className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 ${
                      flw.completed
                        ? 'bg-[#F9FAFB] border-[#E5E7EB] text-[#9CA3AF]'
                        : 'bg-[#FBF9F5] border-[#DDD5C5] text-[#1E2022]'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="checkbox"
                        checked={flw.completed}
                        onChange={() => handleToggleFollowUp(flw.id)}
                        className="w-4 h-4 rounded text-[#1E3A8A] cursor-pointer"
                      />
                      <span className={`text-xs ${flw.completed ? 'line-through' : 'font-medium'}`}>
                        {flw.text}
                      </span>
                    </div>
                    {flw.targetWeek && (
                      <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                        {flw.targetWeek}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-3.5 bg-[#F2ECE1] border-t border-[#E2D8C3] flex items-center justify-between gap-3 flex-wrap">
          <div>
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 rounded-xl border border-transparent text-[#9CA3AF] hover:text-[#DC2626] text-xs font-mono-code flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 animate-in fade-in">
                <span className="text-xs text-[#DC2626] font-mono-code font-bold">Confirm delete?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-2.5 py-1 rounded-lg bg-[#DC2626] text-[#FFFFFF] text-xs font-mono-code font-bold"
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-xs font-mono-code"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExtractIdea}
              className="px-3.5 py-1.5 rounded-xl border border-[#DDD6FE] bg-[#F3E8FF] hover:bg-[#EDE9FE] text-[#6D28D9] text-xs font-mono-code font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Rocket className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Create Idea in Vault</span>
            </button>
            <button
              type="button"
              onClick={() => onEditScan(scan)}
              className="px-4 py-1.5 rounded-xl bg-[#1E3A8A] hover:bg-[#1E40AF] text-[#FBF9F5] text-xs font-mono-code font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Scan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
