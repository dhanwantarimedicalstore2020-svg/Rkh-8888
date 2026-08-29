import React, { useState } from 'react';
import {
  BookOpen,
  Brain,
  Briefcase,
  Check,
  Compass,
  HeartHandshake,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import { FlexibleWindowCategory, FlexibleWindowLog } from '../../types';

interface FlexibleWindowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLog: (log: FlexibleWindowLog) => void;
  existingLog?: FlexibleWindowLog;
  dateStr?: string;
}

const CATEGORIES: { cat: FlexibleWindowCategory; icon: any; title: string; hierarchyRule: string; priority: number }[] = [
  {
    cat: 'Academics',
    icon: BookOpen,
    title: '1. Academics (Highest Priority)',
    hierarchyRule: 'Mandatory first priority: If syllabus, backlog, or lab assignments are pending',
    priority: 1,
  },
  {
    cat: 'Skill',
    icon: Sparkles,
    title: '2. Extra Skill Development',
    hierarchyRule: 'Second priority: English fluency, technical skills, or tool mastery',
    priority: 2,
  },
  {
    cat: 'Revision/PYQ',
    icon: Brain,
    title: '3. Revision / PYQs',
    hierarchyRule: 'Third priority: Active recall testing and university past-year questions',
    priority: 3,
  },
  {
    cat: 'Business research',
    icon: Briefcase,
    title: '4. Business & Venture Thinking',
    hierarchyRule: 'Fourth priority: Pharma industry dynamics, margin analysis, and supply chains',
    priority: 4,
  },
  {
    cat: 'Career development',
    icon: Compass,
    title: 'Career & Network Exploration',
    hierarchyRule: 'Long-term positioning, industry mentors, and portfolio building',
    priority: 5,
  },
  {
    cat: 'Recovery',
    icon: HeartHandshake,
    title: '5. Deliberate Recovery',
    hierarchyRule: 'Fifth priority: Rest & recharge to protect evening 8–11 PM deep work',
    priority: 6,
  },
  {
    cat: 'Other',
    icon: Tag,
    title: 'Other Essential Focus',
    hierarchyRule: 'Any urgent or unique priority requiring adaptive focus',
    priority: 7,
  },
];

export const FlexibleWindowModal: React.FC<FlexibleWindowModalProps> = ({
  isOpen,
  onClose,
  onSaveLog,
  existingLog,
  dateStr,
}) => {
  const [selectedCat, setSelectedCat] = useState<FlexibleWindowCategory>(
    existingLog?.category || 'Academics'
  );
  const [minutes, setMinutes] = useState<number>(existingLog?.minutesSpent || 90);
  const [details, setDetails] = useState<string>(existingLog?.details || '');

  React.useEffect(() => {
    if (isOpen) {
      setSelectedCat(existingLog?.category || 'Academics');
      setMinutes(existingLog?.minutesSpent || 90);
      setDetails(existingLog?.details || '');

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, existingLog, onClose]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveLog({
      category: selectedCat,
      minutesSpent: Number(minutes),
      details: details.trim(),
      timestamp: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2022]/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="flexible-modal-title"
    >
      <div className="bg-[#FBF9F5] border border-[#E2D8C3] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#F2ECE1] border-b border-[#E2D8C3] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#B45309] text-[#FBF9F5]">
              <Compass className="w-5 h-5 text-[#FDE68A]" />
            </div>
            <div>
              <h2 id="flexible-modal-title" className="font-slab font-bold text-lg text-[#1E2022]">
                8:30–10:00 AM Flexible Window Logger
              </h2>
              <p className="text-xs text-[#7A746B] font-medium">
                {dateStr ? `Actual capacity usage for ${dateStr}` : 'Adaptive capacity allocation & decision hierarchy'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7A746B] hover:text-[#1E2022] hover:bg-[#E4DAC5] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          
          {/* Decision Hierarchy Banner (Section 9) */}
          <div className="p-3 bg-[#FEF3C7]/80 border border-[#FDE68A] rounded-xl text-xs text-[#92400E] space-y-1">
            <p className="font-bold">Decision Priority Order:</p>
            <p className="text-[11px] leading-relaxed">
              1. Pending academics → 2. Extra skill development → 3. Revision/PYQs → 4. Business research/thinking → 5. Recovery
            </p>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block font-semibold text-[#1E2022] mb-2 text-xs">
              Select Actual Usage Category:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORIES.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedCat === item.cat;
                return (
                  <button
                    key={item.cat}
                    type="button"
                    onClick={() => setSelectedCat(item.cat)}
                    className={`text-left p-2.5 rounded-xl border transition-all flex flex-col ${
                      isSelected
                        ? 'border-[#B45309] bg-[#FFFBEB] shadow-xs'
                        : 'border-[#DDD5C5] bg-[#FFFFFF] hover:bg-[#F9F7F2]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-[#B45309]' : 'text-[#7A746B]'}`} />
                      <span className={`font-semibold text-xs ${isSelected ? 'text-[#92400E]' : 'text-[#1E2022]'}`}>
                        {item.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#7A746B] mt-1 leading-tight">
                      {item.hierarchyRule}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="duration-input" className="block font-semibold text-[#1E2022] mb-1 text-xs">
                Duration (Minutes)
              </label>
              <input
                id="duration-input"
                type="number"
                min={10}
                max={180}
                step={5}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-[#1E2022] text-xs focus:outline-none focus:ring-2 focus:ring-[#B45309]"
              />
            </div>
          </div>

          {/* Details / Notes */}
          <div>
            <label htmlFor="details-input" className="block font-semibold text-[#1E2022] mb-1 text-xs">
              What was accomplished or explored?
            </label>
            <textarea
              id="details-input"
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. Cleared pending Microbiology assignment questions and revised Gram staining mechanisms."
              className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-[#1E2022] text-xs focus:outline-none focus:ring-2 focus:ring-[#B45309]"
            />
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E2D8C3]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs text-[#635E55] hover:bg-[#EAE4D6] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#B45309] hover:bg-[#92400E] text-[#FBF9F5] text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
              id="btn-confirm-flexible-log"
            >
              <Check className="w-4 h-4" />
              <span>Save Record for This Date</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
