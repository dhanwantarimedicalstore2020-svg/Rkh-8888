import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Hammer,
  History,
  Info,
  Layers,
  Package,
  Plus,
  Save,
  Sparkles,
  Tag,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { IdeaItem, IdeaPrototypeRecord } from '../../types';
import { formatINR } from '../../services/storageService';
import { getTodayDateString } from '../../utils/dateUtils';

interface PrototypesStagePanelProps {
  idea: IdeaItem;
  onAddPrototype: (proto: Omit<IdeaPrototypeRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const PrototypesStagePanel: React.FC<PrototypesStagePanelProps> = ({
  idea,
  onAddPrototype,
}) => {
  const prototypes = Array.isArray(idea.prototypes) ? idea.prototypes : [];
  const [showAddForm, setShowAddForm] = useState(prototypes.length === 0);

  const nextVersionNumber = `v0.${prototypes.length + 1}`;
  const [version, setVersion] = useState(nextVersionNumber);
  const [description, setDescription] = useState('');
  const [materials, setMaterials] = useState('');
  const [estimatedCostINR, setEstimatedCostINR] = useState<number | string>(0);
  const [actualCostINR, setActualCostINR] = useState<number | string>('');
  const [buildDate, setBuildDate] = useState(getTodayDateString());
  const [whatChanged, setWhatChanged] = useState('');
  const [whatWasLearned, setWhatWasLearned] = useState('');

  const [hasSavedBanner, setHasSavedBanner] = useState(false);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    onAddPrototype({
      version: version.trim() || nextVersionNumber,
      description: description.trim(),
      materials: materials.trim(),
      estimatedCostINR: Number(estimatedCostINR) || 0,
      actualCostINR: actualCostINR !== '' ? Number(actualCostINR) : undefined,
      buildDate: buildDate || getTodayDateString(),
      whatChanged: whatChanged.trim(),
      whatWasLearned: whatWasLearned.trim(),
    });

    // Reset Form
    setDescription('');
    setMaterials('');
    setEstimatedCostINR(0);
    setActualCostINR('');
    setWhatChanged('');
    setWhatWasLearned('');
    setVersion(`v0.${prototypes.length + 2}`);
    setShowAddForm(false);
    setHasSavedBanner(true);
    setTimeout(() => setHasSavedBanner(false), 2500);
  };

  const totalPrototypeCost = prototypes.reduce(
    (sum, p) => sum + (p.actualCostINR !== undefined ? p.actualCostINR : p.estimatedCostINR),
    0
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Session Context Banner */}
      <div className="p-3 rounded-xl bg-[#FFEDD5]/60 border border-[#FED7AA] flex items-start gap-2.5">
        <div className="p-1.5 rounded-lg bg-[#C2410C] text-[#FFFFFF] shrink-0 mt-0.5">
          <Hammer className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <div className="font-semibold text-[#9A3412]">
            Stage 4: Low-Cost Prototyping
          </div>
          <div className="text-[#C2410C] mt-0.5 leading-relaxed">
            Sunday 3:00–4:30 PM build focus. Build minimum viable artifacts (paper, Excel, low-cost sensor/microcontroller, WhatsApp workflow, physical jigs) to make the concept tangible before large investments.
          </div>
        </div>
      </div>

      {hasSavedBanner && (
        <div className="p-2.5 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-mono-code font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          <span>New Prototype version added and saved to history.</span>
        </div>
      )}

      {/* Top Prototype Controls & Metrics */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono-code text-[#4A453E] bg-[#FFFFFF] px-3 py-1.5 rounded-lg border border-[#E2D8C3]">
            <strong>{prototypes.length}</strong> Prototype Iterations
          </span>
          <span className="text-xs font-mono-code text-[#C2410C] bg-[#FFF7ED] px-3 py-1.5 rounded-lg border border-[#FED7AA] font-bold">
            Total Build Cost: {formatINR(totalPrototypeCost)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3.5 py-1.5 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-[#FFFFFF] text-xs font-mono-code font-bold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? 'Close Builder' : 'Build New Version'}</span>
        </button>
      </div>

      {/* Add New Prototype Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="p-4 rounded-xl bg-[#FFFFFF] border border-[#FED7AA] shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#F2ECE1] pb-2">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#C2410C]" />
              <h4 className="font-slab font-bold text-xs sm:text-sm text-[#1E2022]">
                Log Prototype Version
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-[#7A746B] hover:text-[#1E2022]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
                Version Identifier *
              </label>
              <input
                type="text"
                required
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. v0.1 Paper Mockup"
                className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
                Build Date
              </label>
              <input
                type="date"
                value={buildDate}
                onChange={(e) => setBuildDate(e.target.value)}
                className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
                Cost in INR (₹)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Est. ₹"
                  value={estimatedCostINR}
                  onChange={(e) => setEstimatedCostINR(e.target.value)}
                  className="w-1/2 text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022]"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Actual ₹"
                  value={actualCostINR}
                  onChange={(e) => setActualCostINR(e.target.value)}
                  className="w-1/2 text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
              Prototype Description & Mechanism *
            </label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what was built and how it demonstrates the value proposition..."
              className="w-full text-xs p-2.5 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
              Materials / Tools Used
            </label>
            <input
              type="text"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              placeholder="e.g. Cardboard, Google Sheets script, Node.js bot, acrylic sheet, 3D print"
              className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
                What Changed vs Prior Version?
              </label>
              <input
                type="text"
                value={whatChanged}
                onChange={(e) => setWhatChanged(e.target.value)}
                placeholder="e.g. Added color-coded expiry badges to eliminate scanning fatigue"
                className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#4A453E] mb-1">
                What Was Learned from this Build?
              </label>
              <input
                type="text"
                value={whatWasLearned}
                onChange={(e) => setWhatWasLearned(e.target.value)}
                placeholder="e.g. Barcode scanners fail on crumpled blister packs; must support manual batch keying"
                className="w-full text-xs p-2 rounded-lg bg-[#FBF9F5] border border-[#DDD5C5] text-[#1E2022]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3.5 py-1.5 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] text-xs font-mono-code text-[#4A453E]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-[#FFFFFF] text-xs font-mono-code font-bold shadow-2xs"
            >
              Save Prototype Version
            </button>
          </div>
        </form>
      )}

      {/* Historical Prototypes Timeline */}
      {prototypes.length === 0 ? (
        <div className="p-6 rounded-xl bg-[#FFFFFF] border border-dashed border-[#DDD5C5] text-center text-xs text-[#7A746B] space-y-1">
          <Package className="w-6 h-6 text-[#9C9487] mx-auto mb-1" />
          <p className="font-semibold text-[#1E2022]">No Prototype Versions Documented Yet</p>
          <p>Click "Build New Version" above to record your first physical or digital prototype iteration.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prototypes.map((proto, idx) => (
            <div
              key={proto.id || idx}
              className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E2D8C3] shadow-2xs space-y-2 text-xs"
            >
              <div className="flex items-center justify-between flex-wrap gap-1.5 border-b border-[#F2ECE1] pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono-code font-bold text-xs px-2 py-0.5 rounded bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
                    {proto.version}
                  </span>
                  <span className="font-mono-code text-[11px] text-[#7A746B] flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {proto.buildDate}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono-code text-[#4A453E] bg-[#FBF9F5] px-2 py-0.5 rounded border border-[#DDD5C5]">
                    Est: {formatINR(proto.estimatedCostINR)}
                  </span>
                  {proto.actualCostINR !== undefined && (
                    <span className="text-[11px] font-mono-code text-[#C2410C] bg-[#FFF7ED] px-2 py-0.5 rounded border border-[#FED7AA] font-bold">
                      Actual: {formatINR(proto.actualCostINR)}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-[#1E2022] leading-relaxed font-medium">
                {proto.description}
              </p>

              {proto.materials && (
                <div className="text-[11px] font-mono-code text-[#635E55] flex items-center gap-1.5">
                  <span className="text-[#7A746B]">Materials:</span>
                  <span>{proto.materials}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[#F2ECE1] text-[11px]">
                {proto.whatChanged && (
                  <div className="text-[#0369A1] bg-[#F0F9FF] p-2 rounded-lg border border-[#BAE6FD]">
                    <strong>Iteration Delta:</strong> {proto.whatChanged}
                  </div>
                )}
                {proto.whatWasLearned && (
                  <div className="text-[#92400E] bg-[#FFFBEB] p-2 rounded-lg border border-[#FDE68A]">
                    <strong>Key Learning:</strong> {proto.whatWasLearned}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
