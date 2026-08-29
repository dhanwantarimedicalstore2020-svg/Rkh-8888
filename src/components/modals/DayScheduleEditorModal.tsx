import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  Clock,
  HelpCircle,
  Plus,
  RotateCcw,
  Save,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import {
  DailyRecord,
  DayOfWeek,
  ItemStatus,
  PillarType,
  ScheduleItemInstance,
  ScheduleItemTemplate,
} from '../../types';
import { PILLARS_CONFIG } from '../../constants/masterSchedule';
import { updateRecurringTemplate } from '../../services/storageService';
import { useRegisterBackDismiss } from '../../hooks/useRegisterBackDismiss';

interface DayScheduleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: DailyRecord;
  onSaveDayRecord: (updatedRecord: DailyRecord) => void;
}

export const DayScheduleEditorModal: React.FC<DayScheduleEditorModalProps> = ({
  isOpen,
  onClose,
  record,
  onSaveDayRecord,
}) => {
  useRegisterBackDismiss(isOpen, onClose);

  const [items, setItems] = useState<ScheduleItemInstance[]>(() => [...record.items]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editScope, setEditScope] = useState<'day_only' | 'recurring_template'>('day_only');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ScheduleItemInstance | null>(null);
  const [showTemplateConfirmDialog, setShowTemplateConfirmDialog] = useState(false);

  // Form states for creating/editing an item
  const [itemTimeRange, setItemTimeRange] = useState('');
  const [itemTitle, setItemTitle] = useState('');
  const [itemSubtitle, setItemSubtitle] = useState('');
  const [itemPillar, setItemPillar] = useState<PillarType>('academics');
  const [itemNotes, setItemNotes] = useState('');
  const [itemEssentialMinDay, setItemEssentialMinDay] = useState(true);

  React.useEffect(() => {
    if (isOpen) {
      setItems([...record.items]);
      setEditingItemId(null);
      setSaveSuccessMsg(null);
      setItemToDelete(null);
      setShowTemplateConfirmDialog(false);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, record.items, onClose]);

  if (!isOpen) return null;

  const handleStartEditItem = (item: ScheduleItemInstance) => {
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
      const newItem: ScheduleItemInstance = {
        id: `custom-task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        startTime: '12:00',
        endTime: '13:00',
        timeRange: itemTimeRange.trim(),
        title: itemTitle.trim(),
        subtitle: itemSubtitle.trim() || undefined,
        pillar: itemPillar,
        notes: itemNotes.trim() || undefined,
        essentialInMinDay: itemEssentialMinDay,
        status: 'pending',
        protocolType: 'general',
      };
      setItems((prev) => [...prev, newItem]);
    } else {
      setItems((prev) =>
        prev.map((it) => {
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
        })
      );
    }

    setEditingItemId(null);
  };

  const confirmDeleteItem = () => {
    if (!itemToDelete) return;
    setItems((prev) => prev.filter((it) => it.id !== itemToDelete.id));
    setItemToDelete(null);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const newItems = [...items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);
    setItems(newItems);
  };

  const handleSortChronologically = () => {
    // Basic sorting based on timeRange or startTime
    const sorted = [...items].sort((a, b) => {
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
      return parseHour(a.timeRange) - parseHour(b.timeRange);
    });
    setItems(sorted);
  };

  const executeSave = () => {
    if (editScope === 'day_only') {
      // Apply ONLY to this specific DailyRecord
      const updatedRecord: DailyRecord = {
        ...record,
        items,
        isCustomized: true,
        updatedAt: new Date().toISOString(),
      };
      onSaveDayRecord(updatedRecord);
      setSaveSuccessMsg(`Schedule updated for ${record.date} only.`);
      setTimeout(() => {
        setSaveSuccessMsg(null);
        onClose();
      }, 800);
    } else {
      // Update Recurring Weekly Template
      const templateItems: ScheduleItemTemplate[] = items.map((it) => ({
        id: it.id,
        startTime: it.startTime,
        endTime: it.endTime,
        timeRange: it.timeRange,
        title: it.title,
        subtitle: it.subtitle,
        pillar: it.pillar,
        isFixed: it.isFixed,
        essentialInMinDay: it.essentialInMinDay,
        protocolType: it.protocolType,
        defaultCategory: it.defaultCategory,
        notes: it.notes,
      }));

      // 1. Update Master Template for this weekday
      updateRecurringTemplate(record.weekday, templateItems);

      // 2. Also update current day record
      const updatedRecord: DailyRecord = {
        ...record,
        items,
        updatedAt: new Date().toISOString(),
      };
      onSaveDayRecord(updatedRecord);

      setSaveSuccessMsg(
        `Master ${record.weekday} template updated! Future ${record.weekday}s will inherit this schedule.`
      );
      setTimeout(() => {
        setSaveSuccessMsg(null);
        onClose();
      }, 1000);
    }
  };

  const handleSaveClick = () => {
    if (editScope === 'recurring_template') {
      setShowTemplateConfirmDialog(true);
    } else {
      executeSave();
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2022]/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-editor-title"
    >
      <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#FBF9F5] border-b border-[#EAE4D6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1E2022] text-[#FBF9F5] flex items-center justify-center font-slab font-bold text-sm">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 id="schedule-editor-title" className="font-slab font-bold text-lg text-[#1E2022]">
                Schedule Editor & Scope Manager
              </h2>
              <p className="text-xs text-[#7A746B]">
                {record.weekday}, {record.date} • {items.length} Time Blocks
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Edit Scope Selector Box (Section 1-5 Explicit Edit Scope & Historical Protection) */}
          <div className="p-4 rounded-xl bg-[#F8F5EE] border border-[#E2D8C3] space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#B45309]" />
              <h3 className="font-bold text-sm text-[#1E2022]">Explicit Edit Scope</h3>
            </div>
            <p className="text-[#635E55] leading-relaxed">
              Choose whether changes apply exclusively to this date’s snapshot or update the recurring master template for future weeks:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                  editScope === 'day_only'
                    ? 'border-[#1E2022] bg-[#FFFFFF] shadow-xs'
                    : 'border-[#E2D8C3] bg-[#FBF9F5] hover:bg-[#FFFFFF]'
                }`}
              >
                <input
                  type="radio"
                  name="editScope"
                  checked={editScope === 'day_only'}
                  onChange={() => setEditScope('day_only')}
                  className="mt-0.5 text-[#1E2022] focus:ring-0"
                />
                <div>
                  <div className="font-bold text-[#1E2022]">Apply to This Date Only</div>
                  <p className="text-[11px] text-[#7A746B] mt-0.5">
                    Isolates modifications to <span className="font-mono-code font-bold">{record.date}</span>. Other days and weekly templates remain completely untouched.
                  </p>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                  editScope === 'recurring_template'
                    ? 'border-[#1E2022] bg-[#FFFFFF] shadow-xs'
                    : 'border-[#E2D8C3] bg-[#FBF9F5] hover:bg-[#FFFFFF]'
                }`}
              >
                <input
                  type="radio"
                  name="editScope"
                  checked={editScope === 'recurring_template'}
                  onChange={() => setEditScope('recurring_template')}
                  className="mt-0.5 text-[#1E2022] focus:ring-0"
                />
                <div>
                  <div className="font-bold text-[#1E2022]">Update Master {record.weekday} Template</div>
                  <p className="text-[11px] text-[#7A746B] mt-0.5">
                    Updates recurring {record.weekday} template for future generation. Historical records with completion data remain protected.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Item Inline Form if open */}
          {editingItemId && (
            <form
              onSubmit={handleSaveItemForm}
              className="p-4 rounded-xl bg-[#F0EBE0]/90 border border-[#DDD5C5] space-y-3 animate-in fade-in"
              id="schedule-item-form"
            >
              <div className="font-bold text-sm text-[#1E2022] flex items-center justify-between">
                <span>{editingItemId === 'new' ? 'Add New Time Block' : 'Edit Time Block'}</span>
                <span className="text-[11px] font-normal text-[#7A746B]">
                  {editingItemId === 'new' ? 'New Task' : `Item ID: ${editingItemId}`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="task-time-input" className="block text-[11px] font-medium text-[#635E55] mb-1">
                    Time Range *
                  </label>
                  <input
                    id="task-time-input"
                    type="text"
                    required
                    value={itemTimeRange}
                    onChange={(e) => setItemTimeRange(e.target.value)}
                    placeholder="e.g. 5:00–5:30 AM"
                    className="w-full px-3 py-1.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-xs focus:outline-hidden focus:border-[#1E2022]"
                  />
                </div>

                <div>
                  <label htmlFor="task-pillar-select" className="block text-[11px] font-medium text-[#635E55] mb-1">
                    Pillar *
                  </label>
                  <select
                    id="task-pillar-select"
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
                <label htmlFor="task-title-input" className="block text-[11px] font-medium text-[#635E55] mb-1">
                  Task Title *
                </label>
                <input
                  id="task-title-input"
                  type="text"
                  required
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  placeholder="e.g. Pharmaceutics Formulation Review"
                  className="w-full px-3 py-1.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-xs focus:outline-hidden focus:border-[#1E2022]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="task-subtitle-input" className="block text-[11px] font-medium text-[#635E55] mb-1">
                    Subtitle / Directive (Optional)
                  </label>
                  <input
                    id="task-subtitle-input"
                    type="text"
                    value={itemSubtitle}
                    onChange={(e) => setItemSubtitle(e.target.value)}
                    placeholder="e.g. Unit Operations & Numerical PYQ analysis"
                    className="w-full px-3 py-1.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-xs focus:outline-hidden focus:border-[#1E2022]"
                  />
                </div>

                <div>
                  <label htmlFor="task-note-input" className="block text-[11px] font-medium text-[#635E55] mb-1">
                    Execution Note (Optional)
                  </label>
                  <input
                    id="task-note-input"
                    type="text"
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    placeholder="e.g. Bring notebook and textbook"
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
                  Confirm Block
                </button>
              </div>
            </form>
          )}

          {/* List of Time Blocks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-[#EAE4D6]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-[#1E2022]">Scheduled Blocks ({items.length})</span>
                <button
                  type="button"
                  onClick={handleSortChronologically}
                  className="px-2 py-0.5 rounded bg-[#F2ECE1] hover:bg-[#E5DEC9] text-[#635E55] text-[10px] font-mono-code flex items-center gap-1"
                  title="Auto-Sort items chronologically by time"
                >
                  <Clock className="w-3 h-3" />
                  <span>Auto-Sort by Time</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleStartAddNew}
                className="px-2.5 py-1 rounded-lg bg-[#EFE9DC] hover:bg-[#E4DAC5] text-[#1E2022] text-[11px] font-semibold flex items-center gap-1 transition-colors"
                id="btn-add-block-modal"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Time Block</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {items.map((item, idx) => {
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
                        aria-label="Move item up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(idx, 'down')}
                        disabled={idx === items.length - 1}
                        className="p-1 rounded text-[#7A746B] hover:text-[#1E2022] hover:bg-[#F2ECE1] disabled:opacity-30 disabled:pointer-events-none"
                        aria-label="Move item down"
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
                        title="Delete block"
                        aria-label={`Delete block ${item.title}`}
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

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#FBF9F5] border-t border-[#EAE4D6] flex items-center justify-between">
          <div className="text-[11px] text-[#7A746B]">
            {editScope === 'day_only'
              ? `Changes isolated to ${record.date} snapshot.`
              : `Will update recurring Master ${record.weekday} template.`}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#635E55] hover:bg-[#EFE9DC] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveClick}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1E2022] text-[#FBF9F5] hover:bg-[#33373B] transition-colors flex items-center gap-1.5 shadow-xs"
              id="btn-save-schedule-modal"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

      </div>

      {/* Delete Item Confirmation Dialog */}
      {itemToDelete && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#1E2022]/70 backdrop-blur-xs animate-in fade-in"
          role="alertdialog"
          aria-labelledby="delete-dialog-title"
        >
          <div className="bg-[#FFFFFF] border border-[#FECACA] rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#FEE2E2] text-[#DC2626] shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 id="delete-dialog-title" className="font-slab font-bold text-base text-[#1E2022]">
                  Confirm Task Deletion
                </h3>
                <p className="text-xs text-[#635E55] mt-1 leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-[#1E2022]">"{itemToDelete.title}"</span> ({itemToDelete.timeRange})?
                </p>
                <p className="text-[11px] text-[#7A746B] mt-1">
                  Historical data integrity is guaranteed; completion statistics will not be corrupted.
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
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Master Template Confirmation Dialog (Section 4 & 5) */}
      {showTemplateConfirmDialog && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#1E2022]/70 backdrop-blur-xs animate-in fade-in"
          role="alertdialog"
          aria-labelledby="template-dialog-title"
        >
          <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#FEF3C7] text-[#B45309] shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 id="template-dialog-title" className="font-slab font-bold text-base text-[#1E2022]">
                  Confirm Master {record.weekday} Template Update
                </h3>
                <p className="text-xs text-[#635E55] mt-1 leading-relaxed">
                  You are about to modify the default recurring master template for <span className="font-bold text-[#1E2022]">{record.weekday}</span>.
                </p>
                <div className="mt-2 p-2.5 rounded-lg bg-[#F8F5EE] border border-[#E2D8C3] text-[11px] text-[#4A453E] space-y-1">
                  <div className="font-semibold text-[#1E2022]">• Affects: Future {record.weekday} schedule generation.</div>
                  <div className="font-semibold text-[#166534]">• Protected: All past historical {record.weekday} records remain 100% untouched.</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAE4D6]">
              <button
                type="button"
                onClick={() => setShowTemplateConfirmDialog(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#635E55] hover:bg-[#EFE9DC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTemplateConfirmDialog(false);
                  executeSave();
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#1E2022] text-[#FBF9F5] hover:bg-[#33373B]"
              >
                Confirm Template Update
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
