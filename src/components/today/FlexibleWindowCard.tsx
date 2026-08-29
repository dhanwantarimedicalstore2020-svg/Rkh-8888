import React from 'react';
import {
  BookOpen,
  Brain,
  Briefcase,
  CheckCircle2,
  Clock,
  Compass,
  Edit3,
  HeartHandshake,
  Plus,
  Sparkles,
} from 'lucide-react';
import { FlexibleWindowCategory, FlexibleWindowLog } from '../../types';

interface FlexibleWindowCardProps {
  log?: FlexibleWindowLog;
  onOpenModal: () => void;
  dateStr: string;
}

export const FlexibleWindowCard: React.FC<FlexibleWindowCardProps> = ({
  log,
  onOpenModal,
  dateStr,
}) => {
  const getCategoryBadge = (cat: FlexibleWindowCategory) => {
    switch (cat) {
      case 'Academics':
        return { bg: 'bg-[#DBEAFE]', text: 'text-[#1E40AF]', border: 'border-[#BFDBFE]', icon: BookOpen };
      case 'Skill':
        return { bg: 'bg-[#F3E8FF]', text: 'text-[#6B21A8]', border: 'border-[#E9D5FF]', icon: Sparkles };
      case 'Revision/PYQ':
        return { bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]', border: 'border-[#FDE68A]', icon: Brain };
      case 'Business research':
        return { bg: 'bg-[#ECFDF5]', text: 'text-[#065F46]', border: 'border-[#A7F3D0]', icon: Briefcase };
      case 'Recovery':
        return { bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]', border: 'border-[#FECACA]', icon: HeartHandshake };
      default:
        return { bg: 'bg-[#F4EFE6]', text: 'text-[#4A453E]', border: 'border-[#DDD5C5]', icon: Compass };
    }
  };

  const badge = log ? getCategoryBadge(log.category) : null;
  const CategoryIcon = badge ? badge.icon : Compass;

  return (
    <div
      id="flexible-high-value-window-card"
      className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-[#EFE9DC] gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-slab font-bold text-sm sm:text-base text-[#1E2022]">
                8:30–10:00 AM Flexible High-Value Window
              </h3>
              <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] font-semibold">
                90 MIN
              </span>
            </div>
            <p className="text-[11px] text-[#7A746B]">
              Adaptive capacity buffer strictly prioritized by necessity
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenModal}
          className="px-3 py-1.5 rounded-xl bg-[#F0EBE0] hover:bg-[#E5DEC9] text-[#1E2022] text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#DDD5C5] self-start sm:self-center"
          id="btn-log-flexible-window"
        >
          {log ? <Edit3 className="w-3.5 h-3.5 text-[#B45309]" /> : <Plus className="w-3.5 h-3.5 text-[#B45309]" />}
          <span>{log ? 'Edit Log' : 'Log Capacity Used'}</span>
        </button>
      </div>

      {log ? (
        <div className="p-3.5 rounded-xl bg-[#FBF9F5] border border-[#EAE4D6] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-mono-code px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 ${badge?.bg} ${badge?.text} ${badge?.border}`}
              >
                <CategoryIcon className="w-3 h-3" />
                <span>{log.category}</span>
              </span>
              <span className="text-xs font-mono-code font-semibold text-[#635E55]">
                {log.minutesSpent} minutes allocated
              </span>
            </div>
            <span className="text-[10px] font-mono-code text-[#166534] flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Logged for {dateStr}
            </span>
          </div>

          {log.details && (
            <p className="text-xs text-[#1E2022] bg-[#FFFFFF] p-2.5 rounded-lg border border-[#EAE4D6] leading-relaxed">
              {log.details}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="p-3 rounded-xl bg-[#F8F5EE] border border-[#EAE4D6] text-xs space-y-1">
            <span className="font-semibold text-[#1E2022] block text-[11px] uppercase tracking-wider font-mono-code">
              Standard Priority Order:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5 text-[11px] pt-1">
              <div className="p-1.5 rounded-lg bg-[#FFFFFF] border border-[#E2D8C3] text-center">
                <span className="font-bold text-[#1E40AF] block text-[10px]">1. Academics</span>
                <span className="text-[9px] text-[#7A746B]">Pending syllabus</span>
              </div>
              <div className="p-1.5 rounded-lg bg-[#FFFFFF] border border-[#E2D8C3] text-center">
                <span className="font-bold text-[#6B21A8] block text-[10px]">2. Extra Skill</span>
                <span className="text-[9px] text-[#7A746B]">Communication/Tech</span>
              </div>
              <div className="p-1.5 rounded-lg bg-[#FFFFFF] border border-[#E2D8C3] text-center">
                <span className="font-bold text-[#92400E] block text-[10px]">3. Revision</span>
                <span className="text-[9px] text-[#7A746B]">PYQs & recall</span>
              </div>
              <div className="p-1.5 rounded-lg bg-[#FFFFFF] border border-[#E2D8C3] text-center">
                <span className="font-bold text-[#065F46] block text-[10px]">4. Business</span>
                <span className="text-[9px] text-[#7A746B]">Pharma research</span>
              </div>
              <div className="p-1.5 rounded-lg bg-[#FFFFFF] border border-[#E2D8C3] text-center">
                <span className="font-bold text-[#991B1B] block text-[10px]">5. Recovery</span>
                <span className="text-[9px] text-[#7A746B]">Protect evening</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-0.5">
            <span className="text-[11px] text-[#7A746B]">
              No usage recorded yet for {dateStr}.
            </span>
            <button
              type="button"
              onClick={onOpenModal}
              className="text-[11px] font-mono-code text-[#B45309] hover:underline font-semibold"
            >
              + Record today's capacity
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
