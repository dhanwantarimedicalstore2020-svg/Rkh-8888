import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Compass,
  Flame,
  FlaskConical,
  Hammer,
  LineChart,
  PieChart,
  Plus,
  Rocket,
  RotateCcw,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  DailyRecord,
  MonthlyAuditRecord,
  PillarType,
  QuarterlyCheckRecord,
  WeeklyResetRecord,
} from '../../types';
import {
  formatINR,
  getEntrepreneurshipSummary,
  loadAllRecords,
  loadIdeas,
  loadMonthlyAudits,
  loadQuarterlyChecks,
  loadWeeklyResets,
  upsertIdea,
  upsertMonthlyAudit,
  upsertQuarterlyCheck,
  upsertWeeklyReset,
} from '../../services/storageService';
import {
  formatReadableDate,
  getISOWeek,
  getMonthInfo,
  getQuarterInfo,
} from '../../utils/dateUtils';
import { PILLARS_CONFIG } from '../../constants/masterSchedule';

interface ReviewsViewProps {
  currentDateStr: string;
}

export const ReviewsView: React.FC<ReviewsViewProps> = ({ currentDateStr }) => {
  const [activeReviewTab, setActiveReviewTab] = useState<'weekly' | 'monthly' | 'quarterly' | 'analytics'>('weekly');
  
  const allRecords = loadAllRecords();
  const weeklyResets = loadWeeklyResets();
  const monthlyAudits = loadMonthlyAudits();
  const quarterlyChecks = loadQuarterlyChecks();
  const ideas = loadIdeas();

  const isoInfo = getISOWeek(currentDateStr);
  const monthInfo = getMonthInfo(currentDateStr);
  const quarterInfo = getQuarterInfo(currentDateStr);

  const entreSummary = getEntrepreneurshipSummary(ideas);

  // Weekly Reset Form
  const [isFormWeekly, setIsFormWeekly] = useState(false);
  const [worked, setWorked] = useState('');
  const [drained, setDrained] = useState('');
  const [pillarsAudit, setPillarsAudit] = useState('');
  const [accomplished, setAccomplished] = useState('');
  const [unfinished, setUnfinished] = useState('');
  const [oneImprovement, setOneImprovement] = useState('');
  const [selectedIdeaToElevate, setSelectedIdeaToElevate] = useState<string>('');

  // Monthly Audit Form
  const [isFormMonthly, setIsFormMonthly] = useState(false);
  const [ratings, setRatings] = useState({
    academics: 8,
    health: 8,
    english: 7,
    business: 7,
    entrepreneurship: 6,
    relationships: 8,
    financialAwareness: 7,
    mentalState: 8,
  });
  const [monthlyStrategy, setMonthlyStrategy] = useState('');

  // Quarterly Check Form
  const [isFormQuarterly, setIsFormQuarterly] = useState(false);
  const [qChanged, setQChanged] = useState('');
  const [qStable, setQStable] = useState('');
  const [qAdaptable, setQAdaptable] = useState('');
  const [qRunning, setQRunning] = useState('');
  const [qSkill, setQSkill] = useState('');
  const [qBiz, setQBiz] = useState('');

  // Calculate Overall Analytics Metrics
  const recordValues = Object.values(allRecords);
  const totalDaysLogged = recordValues.length;
  const avgScore = totalDaysLogged > 0
    ? Math.round(recordValues.reduce((acc, r) => acc + r.scorePercentage, 0) / totalDaysLogged)
    : 0;

  const highConsistencyDays = recordValues.filter((r) => r.scorePercentage >= 85).length;
  const highConsistencyPct = totalDaysLogged > 0 ? Math.round((highConsistencyDays / totalDaysLogged) * 100) : 0;

  // Pillar Aggregations
  const pillarStats: Record<PillarType, { completed: number; total: number }> = {
    academics: { completed: 0, total: 0 },
    health: { completed: 0, total: 0 },
    skills: { completed: 0, total: 0 },
    observation: { completed: 0, total: 0 },
    entrepreneurship: { completed: 0, total: 0 },
    review: { completed: 0, total: 0 },
  };

  recordValues.forEach((rec) => {
    rec.items.forEach((it) => {
      if (it.status !== 'na') {
        pillarStats[it.pillar].total++;
        if (it.status === 'completed') {
          pillarStats[it.pillar].completed++;
        }
      }
    });
  });

  const handleSaveWeekly = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Elevate selected idea to RESEARCHING status if chosen
    if (selectedIdeaToElevate) {
      const targetIdea = ideas.find((i) => i.id === selectedIdeaToElevate);
      if (targetIdea) {
        upsertIdea({
          ...targetIdea,
          status: targetIdea.status === 'OBSERVED' ? 'RESEARCHING' : targetIdea.status,
        });
      }
    }

    const newReset: WeeklyResetRecord = {
      id: `reset-${isoInfo.year}-W${isoInfo.weekNumber}`,
      year: isoInfo.year,
      weekNumber: isoInfo.weekNumber,
      dateRange: `Week ${isoInfo.weekNumber}, ${isoInfo.year}`,
      whatWorked: worked,
      whatDrained: drained,
      pillarAuditNotes: pillarsAudit,
      completedTasksNotes: accomplished,
      unfinishedCauses: unfinished,
      elevatedIdeaIds: selectedIdeaToElevate ? [selectedIdeaToElevate] : [],
      singleImprovement: oneImprovement,
      consistencyScore: avgScore,
      createdAt: new Date().toISOString(),
    };

    upsertWeeklyReset(newReset);
    setIsFormWeekly(false);
    alert('Saturday Weekly Reset diagnostic saved!');
  };

  const handleSaveMonthly = (e: React.FormEvent) => {
    e.preventDefault();
    const newAudit: MonthlyAuditRecord = {
      id: `audit-${monthInfo.label}`,
      year: monthInfo.year,
      month: monthInfo.month,
      monthName: monthInfo.name,
      ratings,
      dimensionNotes: {},
      nextMonthStrategy: monthlyStrategy,
      createdAt: new Date().toISOString(),
    };

    upsertMonthlyAudit(newAudit);
    setIsFormMonthly(false);
    alert('Monthly Life Audit saved!');
  };

  const handleSaveQuarterly = (e: React.FormEvent) => {
    e.preventDefault();
    const newCheck: QuarterlyCheckRecord = {
      id: `quarterly-${quarterInfo.label}`,
      year: quarterInfo.year,
      quarter: quarterInfo.quarter,
      whatHasChanged: qChanged,
      stableElements70: qStable,
      adaptableElements30: qAdaptable,
      adjustments: {
        runningPhase: qRunning,
        skillEmphasis: qSkill,
        businessFocus: qBiz,
      },
      createdAt: new Date().toISOString(),
    };

    upsertQuarterlyCheck(newCheck);
    setIsFormQuarterly(false);
    alert('Quarterly Direction Check saved!');
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-200">
      
      {/* Top Nav Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-[#F2ECE1] rounded-2xl border border-[#E2D8C3] overflow-x-auto">
        <button
          onClick={() => setActiveReviewTab('weekly')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 flex items-center gap-2 ${
            activeReviewTab === 'weekly' ? 'bg-[#1E2022] text-[#FBF9F5] shadow-xs' : 'text-[#635E55] hover:text-[#1E2022]'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Saturday Weekly Reset</span>
        </button>

        <button
          onClick={() => setActiveReviewTab('monthly')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 flex items-center gap-2 ${
            activeReviewTab === 'monthly' ? 'bg-[#1E2022] text-[#FBF9F5] shadow-xs' : 'text-[#635E55] hover:text-[#1E2022]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Monthly Life Audit</span>
        </button>

        <button
          onClick={() => setActiveReviewTab('quarterly')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 flex items-center gap-2 ${
            activeReviewTab === 'quarterly' ? 'bg-[#1E2022] text-[#FBF9F5] shadow-xs' : 'text-[#635E55] hover:text-[#1E2022]'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Quarterly Direction (70/30)</span>
        </button>

        <button
          onClick={() => setActiveReviewTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 flex items-center gap-2 ${
            activeReviewTab === 'analytics' ? 'bg-[#1E2022] text-[#FBF9F5] shadow-xs' : 'text-[#635E55] hover:text-[#1E2022]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Multi-Horizon Analytics</span>
        </button>
      </div>

      {/* 1. SATURDAY WEEKLY RESET */}
      {activeReviewTab === 'weekly' && (
        <div className="space-y-6">
          <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-mono-code text-[#C2410C] font-bold uppercase tracking-wider">
                Saturday 9:30–10:30 PM Protocol (30–45 min)
              </span>
              <h2 className="font-slab font-bold text-xl text-[#1E2022] mt-0.5">
                Saturday Weekly Reset — Week {isoInfo.weekNumber}, {isoInfo.year}
              </h2>
              <p className="text-xs text-[#7A746B]">
                The score is a diagnostic, not a judgment. Extract truth → Define ONE adjustment.
              </p>
            </div>

            {!isFormWeekly && (
              <button
                onClick={() => setIsFormWeekly(true)}
                className="px-4 py-2 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-[#FBF9F5] text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Execute Week {isoInfo.weekNumber} Reset</span>
              </button>
            )}
          </div>

          {/* Entrepreneurship Funnel Health Snapshot */}
          <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-[#047857]" />
                <h3 className="font-slab font-bold text-sm text-[#1E2022]">
                  Entrepreneurship Funnel Weekly Snapshot
                </h3>
              </div>
              <span className="text-[11px] font-mono-code text-[#7A746B]">
                Max 2 Focus Ventures Rule
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE4D6]">
                <span className="text-[10px] font-mono-code text-[#7A746B] uppercase font-bold">Total Active Ideas</span>
                <div className="text-lg font-bold font-mono-code text-[#1E2022] mt-0.5">{entreSummary.totalIdeas}</div>
              </div>
              <div className="p-3 bg-[#FEF3C7] rounded-xl border border-[#FDE68A]">
                <span className="text-[10px] font-mono-code text-[#92400E] uppercase font-bold">Focus Ventures</span>
                <div className="text-lg font-bold font-mono-code text-[#B45309] mt-0.5">{entreSummary.focusVenturesCount} / 2</div>
              </div>
              <div className="p-3 bg-[#E0F2FE] rounded-xl border border-[#BAE6FD]">
                <span className="text-[10px] font-mono-code text-[#0369A1] uppercase font-bold">In Research/Validation</span>
                <div className="text-lg font-bold font-mono-code text-[#0369A1] mt-0.5">{entreSummary.inResearchCount + entreSummary.inValidationCount}</div>
              </div>
              <div className="p-3 bg-[#ECFDF5] rounded-xl border border-[#A7F3D0]">
                <span className="text-[10px] font-mono-code text-[#047857] uppercase font-bold">Total Experiments</span>
                <div className="text-lg font-bold font-mono-code text-[#047857] mt-0.5">{entreSummary.totalExperiments}</div>
              </div>
            </div>
          </div>

          {isFormWeekly && (
            <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
              <h3 className="font-slab font-bold text-base text-[#1E2022]">7 Diagnostic Reflection Prompts</h3>

              <form onSubmit={handleSaveWeekly} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-semibold text-[#1E2022] mb-1">1. What worked exceptionally well?</label>
                  <textarea
                    rows={2}
                    required
                    value={worked}
                    onChange={(e) => setWorked(e.target.value)}
                    placeholder="Highlight solid routines, breakthrough study sessions, or good energy blocks..."
                    className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1E2022] mb-1">2. What drained physical or cognitive energy?</label>
                  <textarea
                    rows={2}
                    required
                    value={drained}
                    onChange={(e) => setDrained(e.target.value)}
                    placeholder="Identify late night WhatsApp breaches, procrastination triggers, or friction points..."
                    className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1E2022] mb-1">3. Are all 6 life pillars receiving balanced attention?</label>
                  <textarea
                    rows={2}
                    value={pillarsAudit}
                    onChange={(e) => setPillarsAudit(e.target.value)}
                    placeholder="Academics, Health, Skills, Observation, Entrepreneurship, Review balance..."
                    className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1E2022] mb-1">4. What was actually accomplished?</label>
                    <textarea
                      rows={2}
                      value={accomplished}
                      onChange={(e) => setAccomplished(e.target.value)}
                      placeholder="Chapters completed, PYQs solved, workouts hit..."
                      className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1E2022] mb-1">5. What remained unfinished &amp; why?</label>
                    <textarea
                      rows={2}
                      value={unfinished}
                      onChange={(e) => setUnfinished(e.target.value)}
                      placeholder="Backlogs and their root causes..."
                      className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#1E2022] mb-1">
                    6. Elevate 1–2 Captured Ideas to Research Funnel:
                  </label>
                  <select
                    value={selectedIdeaToElevate}
                    onChange={(e) => setSelectedIdeaToElevate(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-xs font-mono-code"
                  >
                    <option value="">-- Select an idea to elevate this week --</option>
                    {ideas.filter((i) => !i.isArchived && i.status !== 'ARCHIVED').map((idItem) => (
                      <option key={idItem.id} value={idItem.id}>
                        [{idItem.status}] {(idItem.title || idItem.problemObserved).slice(0, 60)}... ({idItem.dateCaptured}) {idItem.userScoring ? `[Score: ${idItem.userScoring.totalScore}/60]` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl">
                  <label className="block font-bold text-[#C2410C] mb-1">
                    7. What is the ONE non-negotiable improvement for next week?
                  </label>
                  <input
                    type="text"
                    required
                    value={oneImprovement}
                    onChange={(e) => setOneImprovement(e.target.value)}
                    placeholder="e.g. Strict 11:00 PM phone shutdown; active recall notes directly after lecture"
                    className="w-full p-2 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] font-medium text-[#1E2022]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormWeekly(false)}
                    className="px-4 py-2 rounded-lg text-[#635E55]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#C2410C] hover:bg-[#9A3412] text-[#FBF9F5] rounded-xl font-semibold shadow-xs"
                  >
                    Save Weekly Reset
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* Past Weekly Resets List */}
          <div className="space-y-4">
            <h3 className="font-slab font-bold text-base text-[#1E2022]">Historical Weekly Resets</h3>
            {weeklyResets.length === 0 ? (
              <div className="p-6 text-center bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl text-xs text-[#7A746B]">
                No weekly resets recorded yet. Complete your first reset this Saturday at 9:30 PM!
              </div>
            ) : (
              weeklyResets.map((wr) => (
                <div key={wr.id} className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#EFE9DC]">
                    <span className="font-slab font-bold text-sm text-[#1E2022]">{wr.dateRange}</span>
                    <span className="text-xs font-mono-code text-[#7A746B]">Consistency: {wr.consistencyScore}%</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-semibold text-[#166534]">What Worked: </span>
                      <p className="text-[#33373B] mt-0.5">{wr.whatWorked}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-[#991B1B]">What Drained: </span>
                      <p className="text-[#33373B] mt-0.5">{wr.whatDrained}</p>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#FFF7ED] border border-[#FFEDD5] text-xs">
                    <span className="font-bold text-[#C2410C]">Core Improvement Target: </span>
                    <span className="text-[#1E2022] font-medium">{wr.singleImprovement}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. MONTHLY LIFE AUDIT */}
      {activeReviewTab === 'monthly' && (
        <div className="space-y-6">
          <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-mono-code text-[#1E3A8A] font-bold uppercase tracking-wider">
                End of Month Strategy (30–45 min)
              </span>
              <h2 className="font-slab font-bold text-xl text-[#1E2022] mt-0.5">
                Monthly Life Audit — {monthInfo.name} {monthInfo.year}
              </h2>
              <p className="text-xs text-[#7A746B]">
                8-dimension evaluation • Deep diagnostic audit • Next month pivot
              </p>
            </div>

            {!isFormMonthly && (
              <button
                onClick={() => setIsFormMonthly(true)}
                className="px-4 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-[#FBF9F5] text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Audit {monthInfo.name}</span>
              </button>
            )}
          </div>

          {/* Monthly Entrepreneurship Pipeline Audit Summary */}
          <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-slab font-bold text-sm text-[#1E2022]">
                Monthly Entrepreneurship Pipeline State
              </span>
              <span className="text-[11px] font-mono-code text-[#7A746B]">
                Capital Invested: {formatINR(entreSummary.totalCapitalInvested)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-[#F4EFE6] border border-[#E2D8C3]">
                <div className="text-[10px] text-[#7A746B] font-mono-code uppercase font-bold">Observed</div>
                <div className="font-mono-code font-bold text-base text-[#1E2022]">{entreSummary.observedCount}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD]">
                <div className="text-[10px] text-[#0369A1] font-mono-code uppercase font-bold">Researching</div>
                <div className="font-mono-code font-bold text-base text-[#0369A1]">{entreSummary.inResearchCount}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FFEDD5] border border-[#FED7AA]">
                <div className="text-[10px] text-[#C2410C] font-mono-code uppercase font-bold">Prototypes</div>
                <div className="font-mono-code font-bold text-base text-[#C2410C]">{entreSummary.totalPrototypes}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0]">
                <div className="text-[10px] text-[#047857] font-mono-code uppercase font-bold">Validated Ideas</div>
                <div className="font-mono-code font-bold text-base text-[#047857]">{entreSummary.validatedCount}</div>
              </div>
            </div>
          </div>

          {isFormMonthly && (
            <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
              <h3 className="font-slab font-bold text-base text-[#1E2022]">Rate 8 Core Dimensions (1 to 10)</h3>

              <form onSubmit={handleSaveMonthly} className="space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(ratings).map(([dim, val]) => (
                    <div key={dim} className="p-3 bg-[#FBF9F5] border border-[#E2D8C3] rounded-xl flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="capitalize font-semibold text-[#1E2022] text-xs">{dim.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-mono-code font-bold text-sm text-[#1E3A8A]">{val}/10</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={val}
                        onChange={(e) => setRatings({ ...ratings, [dim]: Number(e.target.value) })}
                        className="w-full cursor-pointer accent-[#1E3A8A]"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block font-semibold text-[#1E2022] mb-1">
                    What concrete strategy must change next month?
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={monthlyStrategy}
                    onChange={(e) => setMonthlyStrategy(e.target.value)}
                    placeholder="Define adjustments to study blocks, running phases, business podcasts, and sleep discipline..."
                    className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormMonthly(false)}
                    className="px-4 py-2 rounded-lg text-[#635E55]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#1E3A8A] hover:bg-[#172554] text-[#FBF9F5] rounded-xl font-semibold shadow-xs"
                  >
                    Save Monthly Audit
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Past Audits List */}
          <div className="space-y-4">
            <h3 className="font-slab font-bold text-base text-[#1E2022]">Historical Monthly Audits</h3>
            {monthlyAudits.map((ma) => (
              <div key={ma.id} className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#EFE9DC]">
                  <span className="font-slab font-bold text-sm text-[#1E2022]">{ma.monthName} {ma.year}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono-code">
                  {Object.entries(ma.ratings).map(([k, v]) => (
                    <div key={k} className="p-2 rounded-lg bg-[#FAF8F5] border border-[#EFE9DC] flex justify-between">
                      <span className="capitalize text-[10px] text-[#7A746B]">{k}</span>
                      <span className="font-bold text-[#1E2022]">{v}/10</span>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-[#EBF1F8] rounded-xl border border-[#BFDBFE] text-xs">
                  <span className="font-bold text-[#1E3A8A]">Next Month Strategic Pivot: </span>
                  <p className="text-[#1E2022] mt-0.5">{ma.nextMonthStrategy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. QUARTERLY DIRECTION CHECK (70/30) */}
      {activeReviewTab === 'quarterly' && (
        <div className="space-y-6">
          <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-mono-code text-[#0F766E] font-bold uppercase tracking-wider">
                90-Day Strategic Steering (70% Stable / 30% Adaptable)
              </span>
              <h2 className="font-slab font-bold text-xl text-[#1E2022] mt-0.5">
                Quarterly Direction Check — {quarterInfo.label}
              </h2>
              <p className="text-xs text-[#7A746B]">
                Lock the 70% foundation • Adjust the 30% strategic dials
              </p>
            </div>

            {!isFormQuarterly && (
              <button
                onClick={() => setIsFormQuarterly(true)}
                className="px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-[#FBF9F5] text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Execute {quarterInfo.label} Review</span>
              </button>
            )}
          </div>

          {isFormQuarterly && (
            <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
              <form onSubmit={handleSaveQuarterly} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-semibold text-[#1E2022] mb-1">
                    What macro circumstances or goals have shifted this quarter?
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={qChanged}
                    onChange={(e) => setQChanged(e.target.value)}
                    placeholder="New semester syllabus, upcoming competitive exams, new business opportunities..."
                    className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#BBF7D0]">
                    <label className="block font-bold text-[#166534] mb-1">
                      70% Stable Elements (Locked Non-Negotiables):
                    </label>
                    <textarea
                      rows={3}
                      value={qStable}
                      onChange={(e) => setQStable(e.target.value)}
                      placeholder="e.g. 5:00 AM wake up, morning runs, 8:00–11:00 PM deep work, Sunday family block."
                      className="w-full p-2 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF]"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A]">
                    <label className="block font-bold text-[#92400E] mb-1">
                      30% Adaptable Elements (Strategic Dials):
                    </label>
                    <textarea
                      rows={3}
                      value={qAdaptable}
                      onChange={(e) => setQAdaptable(e.target.value)}
                      placeholder="e.g. Shifting running from base to intervals; shifting business podcasts to financial modeling; focusing on venture validation."
                      className="w-full p-2 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormQuarterly(false)}
                    className="px-4 py-2 rounded-lg text-[#635E55]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-[#FBF9F5] rounded-xl font-semibold shadow-xs"
                  >
                    Save Quarterly Check
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Past Quarterly Checks */}
          <div className="space-y-4">
            <h3 className="font-slab font-bold text-base text-[#1E2022]">Historical Quarterly Checks</h3>
            {quarterlyChecks.map((qc) => (
              <div key={qc.id} className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#EFE9DC]">
                  <span className="font-slab font-bold text-sm text-[#1E2022]">{qc.id}</span>
                </div>
                <div className="text-xs space-y-2">
                  <div>
                    <span className="font-bold text-[#1E2022]">What Changed: </span>
                    <span className="text-[#4A453E]">{qc.whatHasChanged}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-2.5 bg-[#ECFDF5] rounded-lg text-[#166534]">
                      <span className="font-bold">70% Stable: </span>
                      {qc.stableElements70}
                    </div>
                    <div className="p-2.5 bg-[#FEF3C7] rounded-lg text-[#92400E]">
                      <span className="font-bold">30% Adaptable: </span>
                      {qc.adaptableElements30}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MULTI-HORIZON ANALYTICS */}
      {activeReviewTab === 'analytics' && (
        <div className="space-y-6">
          
          {/* Executive Metrics Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-mono-code text-[#7A746B]">Total Days Tracked</span>
              <div className="text-2xl font-mono-code font-bold text-[#1E2022] mt-1">
                {totalDaysLogged}
              </div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-mono-code text-[#7A746B]">Avg Consistency</span>
              <div className="text-2xl font-mono-code font-bold text-[#166534] mt-1">
                {avgScore}%
              </div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-mono-code text-[#7A746B]">Mastery Days (≥85%)</span>
              <div className="text-2xl font-mono-code font-bold text-[#1E3A8A] mt-1">
                {highConsistencyDays}
              </div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-mono-code text-[#7A746B]">Active Idea Pipeline</span>
              <div className="text-2xl font-mono-code font-bold text-[#6D28D9] mt-1">
                {entreSummary.totalIdeas}
              </div>
            </div>
          </div>

          {/* Phase 5C Entrepreneurship Pipeline Metrics */}
          <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="pb-3 border-b border-[#EFE9DC] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-slab font-bold text-base text-[#1E2022]">
                  Entrepreneurship Lifecycle Metrics
                </h3>
                <p className="text-xs text-[#7A746B]">
                  Observation → Idea → Research → Validation → Prototype → Experiment → Business
                </p>
              </div>
              <span className="text-xs font-mono-code font-bold text-[#047857] bg-[#ECFDF5] px-3 py-1 rounded-lg border border-[#A7F3D0]">
                Capital Invested: {formatINR(entreSummary.totalCapitalInvested)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-[#FAF8F5] border border-[#EAE4D6] rounded-xl">
                <span className="text-[10px] font-mono-code text-[#7A746B] uppercase font-bold">Focus Ventures</span>
                <div className="text-xl font-mono-code font-bold text-[#D97706] mt-0.5">
                  {entreSummary.focusVenturesCount} / 2
                </div>
              </div>
              <div className="p-3 bg-[#FAF8F5] border border-[#EAE4D6] rounded-xl">
                <span className="text-[10px] font-mono-code text-[#7A746B] uppercase font-bold">Prototypes Built</span>
                <div className="text-xl font-mono-code font-bold text-[#C2410C] mt-0.5">
                  {entreSummary.totalPrototypes}
                </div>
              </div>
              <div className="p-3 bg-[#FAF8F5] border border-[#EAE4D6] rounded-xl">
                <span className="text-[10px] font-mono-code text-[#7A746B] uppercase font-bold">Experiments Logged</span>
                <div className="text-xl font-mono-code font-bold text-[#047857] mt-0.5">
                  {entreSummary.totalExperiments}
                </div>
              </div>
              <div className="p-3 bg-[#FAF8F5] border border-[#EAE4D6] rounded-xl">
                <span className="text-[10px] font-mono-code text-[#7A746B] uppercase font-bold">Scored Ventures</span>
                <div className="text-xl font-mono-code font-bold text-[#6D28D9] mt-0.5">
                  {entreSummary.scoredIdeasCount}
                </div>
              </div>
            </div>
          </div>

          {/* 6-Pillar Adherence Breakdown */}
          <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="pb-3 border-b border-[#EFE9DC]">
              <h3 className="font-slab font-bold text-base text-[#1E2022]">
                6-Pillar Cumulative Execution Balance
              </h3>
              <p className="text-xs text-[#7A746B]">
                Pillar adherence rates derived strictly from underlying task completions
              </p>
            </div>

            <div className="space-y-3">
              {(Object.keys(pillarStats) as PillarType[]).map((pKey) => {
                const pInfo = PILLARS_CONFIG[pKey];
                const stats = pillarStats[pKey];
                const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 100;

                return (
                  <div key={pKey} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono-code">
                      <span className="font-bold text-[#1E2022]">{pInfo.label}</span>
                      <span className="text-[#635E55]">
                        {stats.completed}/{stats.total} blocks ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-[#EFE9DC] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: pInfo.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

