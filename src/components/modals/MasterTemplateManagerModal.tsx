import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  Clock,
  Layers,
  Plus,
  RotateCcw,
  Save,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import {
  DayOfWeek,
  MasterWeeklyTemplate,
  PillarType,
  ScheduleItemTemplate,
} from '../../types';
import { INITIAL_MASTER_TEMPLATES, PILLARS_CONFIG } from '../../constants/masterSchedule';
import { loadTemplates, saveTemplates, updateRecurringTemplate } from '../../services/storageService';
import { useRegisterBackDismiss } from '../../hooks/useRegisterBackDismiss';

interface MasterTemplateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplatesUpdated?: () => void;
}

const WEEKDAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const MasterTemplateManagerModal: React.FC<MasterTemplateManagerModalProps> = ({
  isOpen,
  onClose,
  onTemplatesUpdated,
}) => {
  useRegisterBackDismiss(isOpen, onClose);

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [templates, setTemplates] = useState<MasterWeeklyTemplate>(() => loadTemplates());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ScheduleItemTemplate | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Form states
  const [itemTimeRange, setItemTimeRange] = useState('');
  const [itemTitle, setItemTitle] = useState('');
  const [itemSubtitle, setItemSubtitle] = useState('');
  const [itemPillar, setItemPillar] = useState<PillarType>('academics');
  const [itemNotes, setItemNotes] = useState('');
  const [itemEssentialMinDay, setItemEssentialMinDay] = useState(true);

  React.useEffect(() => {
    if (isOpen) {
      setTemplates(loadTemplates());
      setEditingItemId(null);
      setItemToDelete(null);
      setShowConfirmReset(false);
      setSaveSuccessMsg(null);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentDayItems = templates[selectedDay] || [];

  const handleStartEditItem = (item: ScheduleItemTemplate) => {
    setEditingItemId(item.id);
    setItemTimeRange(item.timeRange);
    setItemTitle(item.title);
    setItemSubtitle(item.subtitle || '');
    setItemPillar(item.pillar);
    setItemNotes(item.notes || '');
    setItemEssentialMinDay(!!item.essentialInMinDay);
  };

  const handleStartAddNew = () => {
    setEditingItemId('new');
    setItemTimeRange('12:00–1:00 PM');
    setItemTitle('');
    setItemSubtitle('');
    setItemPillar('academics');
    setItemNotes('');
    setItemEssentialMinDay(false);
  };

  const handleSaveItemForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim() || !itemTimeRange.trim()) return;

    if (editingItemId === 'new') {
      const newItem: ScheduleItemTemplate = {
        id: `tmpl-${selectedDay.toLowerCase().slice(0, 3)}-${Date.now()}`,
        startTime: '12:00',
        endTime: '13:00',
        timeRange: itemTimeRange.trim(),
        title: itemTitle.trim(),
        subtitle: itemSubtitle.trim() || undefined,
        pillar: itemPillar,
        notes: itemNotes.trim() || undefined,
        essentialInMinDay: itemEssentialMinDay,
        protocolType: 'general',
      };
      setTemplates((prev) => ({
        ...prev,
        [selectedDay]: [...prev[selectedDay], newItem],
      }));
    } else {
      setTemplates((prev) => ({
        ...prev,
        [selectedDay]: prev[selectedDay].map((it) => {
          if (it.id === editingItemId) {
            return {
              ...it,
              timeRange: itemTimeRange.trim(),
              title: itemTitle.trim(),
              subtitle: itemSubtitle.trim() || undefined,
              pillar: itemPillar,
              notes: itemNotes.trim() || undefined,
              essentialInMinDay: itemEssentialMinDay,
            };
          }
          return it;
        }),
      }));
    }

    setEditingItemId(null);
  };

  const confirmDeleteItem = () => {
    if (!itemToDelete) return;
    setTemplates((prev) => ({
      ...prev,
      [selectedDay]: prev[selectedDay].filter((it) => it.id !== itemToDelete.id),
    }));
    setItemToDelete(null);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const dayItems = [...currentDayItems];
    if (targetIndex < 0 || targetIndex >= dayItems.length) return;
    const [moved] = dayItems.splice(index, 1);
    dayItems.splice(targetIndex, 0, moved);
    setTemplates((prev) => ({
      ...prev,
      [selectedDay]: dayItems,
    }));
  };

  const handleSortChronologically = () => {
    const parseHour = (tr: string) => {
      const match = tr.match(/(\d+):?(\d+)?\s*(AM|PM)?/i);
      if (!match) return 0;
      let h = parseInt(match[1], 10);
      const m = match[2] ? parseInt(match[2], 10) : 0;
      const ampm = match[3] ? match[3].toUpperCase() : '';
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };

    const sorted = [...currentDayItems].sort((a, b) => parseHour(a.timeRange) - parseHour(b.timeRange));
    setTemplates((prev) => ({
      ...prev,
      [selectedDay]: sorted,
    }));
  };

  const handleResetToDefault = () => {
    setTemplates((prev) => ({
      ...prev,
      [selectedDay]: INITIAL_MASTER_TEMPLATES[selectedDay],
    }));
    setShowConfirmReset(false);
  };

  const handleSaveAll = () => {
    saveTemplates(templates);
    setSaveSuccessMsg('Master weekly templates saved! Future schedule generations will use updated templates.');
    if (onTemplatesUpdated) onTemplatesUpdated();
    setTimeout(() => {
      setSaveSuccessMsg(null);
      onClose();
    }, 1000);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2022]/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-manager-title"
    >
      <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#FBF9F5] border-b border-[#EAE4D6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1E2022] text-[#FBF9F5] flex items-center justify-center font-slab font-bold text-sm">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 id="template-manager-title" className="font-slab font-bold text-lg text-[#1E2022]">
                Recurring Weekly Template Manager
              </h2>
              <p className="text-xs text-[#7A746B]">
                Configure baseline timetables for Monday through Sunday (Historical records stay protected)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#EFE9DC] text-[#7A746B] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Weekday Switcher Tabs */}
        <div className="px-6 py-2.5 bg-[#F8F5EE] border-b border-[#EAE4D6] flex items-center gap-1.5 overflow-x-auto">
          {WEEKDAYS.map((day) => {
            const isSelected = selectedDay === day;
            const count = templates[day]?.length || 0;
            return (
              <button
                key={day}
                onClick={() => {
                  setSelectedDay(day);
                  setEditingItemId(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono-code font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#1E2022] text-[#FBF9F5] shadow-xs'
                    : 'bg-[#FFFFFF] text-[#635E55] border border-[#DDD5C5] hover:bg-[#F2ECE1]'
                }`}
              >
                <span>{day}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-[#FFFFFF]/20 text-[#FFFFFF]' : 'bg-[#F2ECE1] text-[#7A746B]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* Historical Safety Notice */}
          <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] flex items-start gap-2.5">
            <Shield className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong className="font-bold">Historical Immutability Protected:</strong> Modifications to the recurring <strong className="font-bold">{selectedDay}</strong> template will only affect future dates that have not yet been materialized or customized. Any previous completed days retain their exact historical snapshots.
            </p>
          </div>

          {/* Form for Adding / Editing an Item */}
          {editingItemId && (
            <form
              onSubmit={handleSaveItemForm}
              className="p-4 rounded-xl bg-[#F0EBE0]/90 border border-[#DDD5C5] space-y-3 animate-in fade-in"
            >
              <div className="font-bold text-sm text-[#1E2022] flex items-center justify-between">
                <span>{editingItemId === 'new' ? `Add Block to ${selectedDay}` : 'Edit Template Block'}</span>
                <span className="text-[11px] font-normal text-[#7A746B]">
                  {editingItemId === 'new' ? 'New Template Item' : `Item ID: ${editingItemId}`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#635E55] mb-1">Time Range *</label>
                  <input
                    type="text"
                    required
                    value={itemTimeRange}
                    onChange={(e) => setItemTimeRange(e.target.value)}
                    placeholder="e.g. 6:00–7:00 AM"
                    className="w-full px-3 py-1.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-xs focus:outline-hidden focus:border-[#1E2022]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#635E55] mb-1">Pillar *</label>
                  <select
                    value={itemPillar}
                    onChange={(e) => setItemPillar(e.target.value as PillarType)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-xs focus:outline-hidden focus:border-[#1E2022]"
                  >
                    <option value="academics">Academics</option>
                    <option value="health">Health & Conditioning</option>
                    <option value="skills">Skills & English</option>
                    <option value="observation">Observation & Friction</option>
                    <option value="entrepreneurship">Entrepreneurship & Venture</option>
                    <option value="review">Review & Audit</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemEssentialMinDay}
                      onChange={(e) => setItemEssentialMinDay(e.target.checked)}
                      className="rounded text-[#1E2022] focus:ring-0"
                    />
                    <span className="text-[11px] font-medium text-[#4A453E]">
                      Essential in Minimum Day
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#635E55] mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  placeholder="e.g. Organic & Medicinal Chemistry Revision"
                  className="w-full px-3 py-1.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-xs focus:outline-hidden focus:border-[#1E2022]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#635E55] mb-1">Subtitle / Directive</label>
                  <input
                    type="text"
                    value={itemSubtitle}
                    onChange={(e) => setItemSubtitle(e.target.value)}
                    placeholder="e.g. Active recall, reaction mechanisms & SAR notes"
                    className="w-full px-3 py-1.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-xs focus:outline-hidden focus:border-[#1E2022]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#635E55] mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    placeholder="e.g. LIBRARY DAY or SPECIAL PROTOCOL"
                    className="w-full px-3 py-1.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-xs focus:outline-hidden focus:border-[#1E2022]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItemId(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#635E55] hover:bg-[#E4DAC5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#1E2022] text-[#FBF9F5] hover:bg-[#33373B]"
                >
                  Confirm Template Block
                </button>
              </div>
            </form>
          )}

          {/* List of Time Blocks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-[#EAE4D6]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-[#1E2022]">
                  {selectedDay} Master Schedule ({currentDayItems.length} Blocks)
                </span>
                <button
                  type="button"
                  onClick={handleSortChronologically}
                  className="px-2 py-0.5 rounded bg-[#F2ECE1] hover:bg-[#E5DEC9] text-[#635E55] text-[10px] font-mono-code flex items-center gap-1"
                >
                  <Clock className="w-3 h-3" />
                  <span>Auto-Sort by Time</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(true)}
                  className="px-2 py-1 rounded-lg text-[#991B1B] hover:bg-[#FEE2E2] text-[11px] font-medium flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset {selectedDay} to Default</span>
                </button>
                <button
                  type="button"
                  onClick={handleStartAddNew}
                  className="px-2.5 py-1 rounded-lg bg-[#EFE9DC] hover:bg-[#E4DAC5] text-[#1E2022] text-[11px] font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Time Block</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {currentDayItems.map((item, idx) => {
                const pillar = PILLARS_CONFIG[item.pillar] || PILLARS_CONFIG.academics;
                return (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border border-[#EAE4D6] bg-[#FFFFFF] hover:border-[#DDD5C5] flex items-center justify-between gap-2"
                  >
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveItem(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded text-[#7A746B] hover:text-[#1E2022] hover:bg-[#F2ECE1] disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(idx, 'down')}
                        disabled={idx === currentDayItems.length - 1}
                        className="p-1 rounded text-[#7A746B] hover:text-[#1E2022] hover:bg-[#F2ECE1] disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                      <span className="font-mono-code text-[11px] font-semibold text-[#7A746B] w-24 shrink-0">
                        {item.timeRange}
                      </span>
                      <div className="truncate">
                        <div className="font-medium text-xs text-[#1E2022] truncate flex items-center gap-1.5">
                          <span>{item.title}</span>
                          {item.essentialInMinDay && (
                            <span className="text-[9px] font-mono-code px-1 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                              MIN-DAY
                            </span>
                          )}
                        </div>
                        {item.subtitle && (
                          <div className="text-[10px] text-[#7A746B] truncate">{item.subtitle}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[9px] font-mono-code px-1.5 py-0.5 rounded-full border ${pillar.bgBadge} ${pillar.textBadge} ${pillar.border}`}
                      >
                        {pillar.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStartEditItem(item)}
                        className="px-2 py-1 rounded hover:bg-[#F2ECE1] text-[#4A453E] text-[11px] font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
                        className="p-1 rounded hover:bg-[#FEE2E2] text-[#DC2626]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {saveSuccessMsg && (
            <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] text-[#166534] flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#FBF9F5] border-t border-[#EAE4D6] flex items-center justify-between">
          <div className="text-[11px] text-[#7A746B]">
            All 7 weekday templates saved into local system storage.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#635E55] hover:bg-[#EFE9DC] transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1E2022] text-[#FBF9F5] hover:bg-[#33373B] transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Master Templates</span>
            </button>
          </div>
        </div>

      </div>

      {/* Delete Item Confirmation Dialog */}
      {itemToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#1E2022]/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FFFFFF] border border-[#FECACA] rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#FEE2E2] text-[#DC2626] shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-slab font-bold text-base text-[#1E2022]">
                  Delete from {selectedDay} Template?
                </h3>
                <p className="text-xs text-[#635E55] mt-1 leading-relaxed">
                  Are you sure you want to remove <strong className="font-semibold text-[#1E2022]">"{itemToDelete.title}"</strong> from the recurring master template?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAE4D6]">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#635E55] hover:bg-[#EFE9DC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteItem}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#DC2626] text-[#FFFFFF] hover:bg-[#B91C1C]"
              >
                Delete from Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#1E2022]/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#FEF3C7] text-[#B45309] shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-slab font-bold text-base text-[#1E2022]">
                  Reset {selectedDay} Template to Default?
                </h3>
                <p className="text-xs text-[#635E55] mt-1 leading-relaxed">
                  This will reload the initial gold-standard Master Schedule for <strong className="font-semibold">{selectedDay}</strong>. Future {selectedDay}s will use the standard default.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAE4D6]">
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#635E55] hover:bg-[#EFE9DC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#B45309] text-[#FFFFFF] hover:bg-[#92400E]"
              >
                Reset to Default
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
