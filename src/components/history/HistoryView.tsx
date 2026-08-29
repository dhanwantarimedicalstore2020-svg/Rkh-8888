import React, { useState } from 'react';
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Flame,
  Layers,
  Search,
  Shield,
  Sparkles,
  Target,
} from 'lucide-react';
import { DailyRecord, OperatingMode } from '../../types';
import {
  formatReadableDate,
  formatShortDate,
  getMonthInfo,
  getQuarterInfo,
  getTodayDateString,
  getWeekdayFromDate,
  offsetDays,
  parseLocalISODate,
} from '../../utils/dateUtils';
import { calculateScorecardMetrics, calculateTaskMetrics, getDateTemporalState } from '../../utils/metricsUtils';
import { generateDatesInPeriod } from '../../utils/periodUtils';
import { getDailyAnalytics } from '../../services/analyticsService';

interface HistoryViewProps {
  allRecords: Record<string, DailyRecord>;
  currentDateStr: string;
  onSelectDate: (dateStr: string) => void;
  onNavigateTab: (tab: any) => void;
}

type HistoryViewMode = 'calendar' | 'list';

export const HistoryView: React.FC<HistoryViewProps> = ({
  allRecords,
  currentDateStr,
  onSelectDate,
  onNavigateTab,
}) => {
  const todayStr = getTodayDateString();
  const [viewMode, setViewMode] = useState<HistoryViewMode>('calendar');
  const [currentMonthAnchor, setCurrentMonthAnchor] = useState<string>(currentDateStr);
  const [selectedRecordDate, setSelectedRecordDate] = useState<string>(currentDateStr);
  const [filterMode, setFilterMode] = useState<'all' | 'high' | 'minimum_day' | 'exam_mode'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const monthInfo = getMonthInfo(currentMonthAnchor);
  const monthDates = generateDatesInPeriod('month', currentMonthAnchor);

  const handlePrevMonth = () => {
    const d = parseLocalISODate(currentMonthAnchor);
    d.setMonth(d.getMonth() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    setCurrentMonthAnchor(`${y}-${m}-01`);
  };

  const handleNextMonth = () => {
    const d = parseLocalISODate(currentMonthAnchor);
    d.setMonth(d.getMonth() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    setCurrentMonthAnchor(`${y}-${m}-01`);
  };

  // Inspect selected date
  const selectedDaily = getDailyAnalytics(allRecords, selectedRecordDate);

  // Filtered records for list view
  const allRecordList: DailyRecord[] = (Object.values(allRecords) as DailyRecord[]).sort((a, b) => b.date.localeCompare(a.date));
  const filteredList = allRecordList.filter((rec: DailyRecord) => {
    const kpi = calculateScorecardMetrics(rec.scorecard);
    if (filterMode === 'high' && kpi.percentage < 85) return false;
    if (filterMode === 'minimum_day' && rec.mode !== 'minimum_day') return false;
    if (filterMode === 'exam_mode' && rec.mode !== 'exam_mode') return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchDate = rec.date.includes(q);
      const matchNotes = rec.generalDayNotes?.toLowerCase().includes(q);
      const matchReflection = rec.scorecard?.customReflection?.toLowerCase().includes(q);
      if (!matchDate && !matchNotes && !matchReflection) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header & Quick Navigation */}
      <div className="bg-[#FAF6EE] border border-[#E8E2D6] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#1E2022]" />
              <h1 className="text-xl font-bold text-[#1E2022] font-mono-code tracking-tight">
                Historical Records & Calendar
              </h1>
            </div>
            <p className="text-xs text-[#635E55] mt-1">
              Inspect historical execution, calendar patterns, and operating mode records.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#EFE9DC] p-1 rounded-xl gap-1 border border-[#E2DBD0]">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-code font-semibold transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-[#1E2022] text-[#FBF9F5] shadow-xs'
                    : 'text-[#635E55] hover:text-[#1E2022]'
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-code font-semibold transition-all ${
                  viewMode === 'list'
                    ? 'bg-[#1E2022] text-[#FBF9F5] shadow-xs'
                    : 'text-[#635E55] hover:text-[#1E2022]'
                }`}
              >
                History List ({allRecordList.length})
              </button>
            </div>

            <button
              onClick={() => {
                setCurrentMonthAnchor(todayStr);
                setSelectedRecordDate(todayStr);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#EFE9DC] hover:bg-[#E2DBD0] text-xs font-mono-code font-semibold text-[#1E2022] border border-[#E2DBD0] transition-colors"
            >
              Today
            </button>
          </div>

        </div>
      </div>

      {/* Calendar View Mode */}
      {viewMode === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Monthly Calendar Grid */}
          <div className="lg:col-span-2 bg-[#FAF6EE] border border-[#E8E2D6] rounded-2xl p-4 sm:p-5 shadow-xs">
            
            {/* Calendar Stepper */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg bg-[#EFE9DC] hover:bg-[#E2DBD0] text-[#1E2022] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg bg-[#EFE9DC] hover:bg-[#E2DBD0] text-[#1E2022] transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-base font-bold text-[#1E2022] font-mono-code ml-2">
                  {monthInfo.name} {monthInfo.year}
                </span>
              </div>

              {/* Legend */}
              <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono-code text-[#7A746B]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" /> &ge;85%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#40916C]" /> 70-84%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#DDA15E]" /> &lt;70%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#E5DEC7]" /> Untracked
                </span>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-xs font-mono-code font-bold text-[#7A746B]">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Offset for starting weekday */}
              {(() => {
                const firstDate = monthDates[0];
                const d = parseLocalISODate(firstDate);
                const dayIndex = d.getDay(); // 0 is Sun, 1 is Mon
                const offset = dayIndex === 0 ? 6 : dayIndex - 1;
                const placeholders = [];
                for (let i = 0; i < offset; i++) {
                  placeholders.push(
                    <div key={`empty-${i}`} className="p-2 rounded-xl bg-transparent opacity-20" />
                  );
                }
                return placeholders;
              })()}

              {monthDates.map((dStr) => {
                const rec = allRecords[dStr];
                const hasRecord = !!rec;
                const temporal = getDateTemporalState(dStr, hasRecord);
                const kpi = calculateScorecardMetrics(rec?.scorecard);
                const isSelected = selectedRecordDate === dStr;
                const isToday = dStr === todayStr;

                return (
                  <button
                    key={dStr}
                    onClick={() => setSelectedRecordDate(dStr)}
                    className={`min-h-[64px] sm:min-h-[72px] p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'ring-2 ring-[#1E2022] border-[#1E2022] bg-[#FAF6EE]'
                        : isToday
                        ? 'border-[#1E2022] bg-[#FAF6EE]'
                        : 'border-[#E8E2D6] hover:border-[#CDC4B5] bg-[#FAF6EE]'
                    } ${
                      temporal === 'FUTURE_PLANNED' ? 'opacity-40 bg-[#F2ECE1]/40' :
                      temporal === 'NOT_TRACKED' ? 'bg-[#F2ECE1]/60' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs font-mono-code font-bold ${
                        isToday ? 'px-1.5 py-0.5 rounded bg-[#1E2022] text-[#FBF9F5]' : 'text-[#1E2022]'
                      }`}>
                        {dStr.split('-')[2]}
                      </span>

                      {rec?.mode && rec.mode !== 'normal' && (
                        <span className="text-[8px] font-mono-code px-1 rounded bg-[#1E2022] text-[#FBF9F5]">
                          {rec.mode === 'minimum_day' ? 'MIN' : 'EXM'}
                        </span>
                      )}
                    </div>

                    <div className="mt-1">
                      {hasRecord ? (
                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-bold font-mono-code ${
                            kpi.percentage >= 85 ? 'text-[#2D6A4F]' :
                            kpi.percentage >= 70 ? 'text-[#40916C]' :
                            kpi.percentage >= 50 ? 'text-[#DDA15E]' : 'text-[#BC6C25]'
                          }`}>
                            {kpi.percentage}%
                          </span>
                          <span className="text-[9px] font-mono-code text-[#7A746B]">
                            {kpi.completedCount}/{kpi.applicableCount}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#A8A196] font-mono-code">
                          {temporal === 'FUTURE_PLANNED' ? 'Future' : 'None'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

          </div>

          {/* Right 1 Col: Selected Date Inspector */}
          <div className="bg-[#FAF6EE] border border-[#E8E2D6] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D6]">
                <div>
                  <h3 className="text-sm font-bold text-[#1E2022] font-mono-code">
                    {formatReadableDate(selectedRecordDate)}
                  </h3>
                  <span className="text-xs text-[#7A746B]">
                    {selectedDaily.temporalState}
                  </span>
                </div>
                {selectedDaily.mode !== 'normal' && (
                  <span className="px-2 py-0.5 rounded-full bg-[#1E2022] text-[#FBF9F5] text-[10px] font-mono-code font-bold uppercase">
                    {selectedDaily.mode === 'minimum_day' ? 'Minimum Day' : 'Exam Mode'}
                  </span>
                )}
              </div>

              {selectedDaily.hasRecord ? (
                <div className="mt-4 space-y-4">
                  
                  {/* Scores */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-[#F2ECE1] border border-[#E2DBD0]">
                      <span className="text-[10px] font-mono-code text-[#7A746B] uppercase">KPI Score</span>
                      <div className="text-2xl font-bold font-mono-code text-[#1E2022] mt-0.5">
                        {selectedDaily.kpiScore}%
                      </div>
                      <span className="text-[11px] text-[#635E55]">
                        {selectedDaily.kpisCompleted}/{selectedDaily.kpisApplicable} KPIs
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F2ECE1] border border-[#E2DBD0]">
                      <span className="text-[10px] font-mono-code text-[#7A746B] uppercase">Schedule</span>
                      <div className="text-2xl font-bold font-mono-code text-[#1E2022] mt-0.5">
                        {selectedDaily.scheduleExecutionScore}%
                      </div>
                      <span className="text-[11px] text-[#635E55]">
                        {selectedDaily.tasksCompleted}/{selectedDaily.tasksApplicable} blocks
                      </span>
                    </div>
                  </div>

                  {/* 7 KPI status list */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-[#1E2022] font-mono-code uppercase tracking-wider">
                      KPI Breakdown
                    </span>
                    {selectedDaily.categories.map((cat) => (
                      <div key={cat.key} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[#F5EFE6]">
                        <span className="text-[#1E2022] truncate max-w-[180px]">{cat.label}</span>
                        <span className={`font-mono-code font-bold ${
                          cat.applicable === 0 ? 'text-[#7A746B]' :
                          cat.completed === 1 ? 'text-[#2D6A4F]' : 'text-[#9E2A2B]'
                        }`}>
                          {cat.applicable === 0 ? 'N/A' : cat.completed === 1 ? 'DONE' : 'MISS'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Notes / Custom Reflection */}
                  {selectedDaily.record?.scorecard?.customReflection && (
                    <div className="p-3 rounded-xl bg-[#F5EFE6] border border-[#E8E2D6] text-xs text-[#1E2022]">
                      <span className="font-bold block mb-1">Reflection:</span>
                      <p className="italic">{selectedDaily.record.scorecard.customReflection}</p>
                    </div>
                  )}

                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[#7A746B]">
                  No record logged for this date.
                </div>
              )}
            </div>

            {/* Jump to Today button */}
            <div className="mt-6 pt-4 border-t border-[#E8E2D6]">
              <button
                onClick={() => {
                  onSelectDate(selectedRecordDate);
                  onNavigateTab('today');
                }}
                className="w-full py-2.5 rounded-xl bg-[#1E2022] text-[#FBF9F5] text-xs font-mono-code font-semibold hover:bg-[#33373B] transition-colors flex items-center justify-center gap-2"
              >
                <span>View & Edit in Today View</span>
                <span className="text-[10px]">&rarr;</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* History List View Mode */}
      {viewMode === 'list' && (
        <div className="bg-[#FAF6EE] border border-[#E8E2D6] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-[#7A746B] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search date or reflections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[#F2ECE1] border border-[#E2DBD0] rounded-xl text-xs text-[#1E2022] placeholder-[#A8A196] focus:outline-none focus:ring-1 focus:ring-[#1E2022]"
                />
              </div>
            </div>

            <div className="flex items-center bg-[#EFE9DC] p-1 rounded-xl gap-1 border border-[#E2DBD0] w-full sm:w-auto justify-around">
              {(['all', 'high', 'minimum_day', 'exam_mode'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono-code font-semibold capitalize transition-all ${
                    filterMode === mode
                      ? 'bg-[#1E2022] text-[#FBF9F5] shadow-xs'
                      : 'text-[#635E55] hover:text-[#1E2022]'
                  }`}
                >
                  {mode.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* List of records */}
          <div className="space-y-2">
            {filteredList.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#7A746B]">
                No historical records match your filter criteria.
              </div>
            ) : (
              filteredList.map((rec) => {
                const kpi = calculateScorecardMetrics(rec.scorecard);
                const task = calculateTaskMetrics(rec.items);
                const isSelected = selectedRecordDate === rec.date;

                return (
                  <div
                    key={rec.date}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected ? 'border-[#1E2022] bg-[#F5EFE6]' : 'border-[#E8E2D6] bg-[#FAF6EE] hover:bg-[#F8F3EA]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 text-center font-mono-code">
                        <span className="block text-xs font-bold text-[#635E55] uppercase">
                          {getWeekdayFromDate(rec.date).slice(0, 3)}
                        </span>
                        <span className="text-sm font-bold text-[#1E2022]">
                          {rec.date.split('-')[2]}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#1E2022] font-mono-code">
                            {formatReadableDate(rec.date)}
                          </span>
                          {rec.mode !== 'normal' && (
                            <span className="px-2 py-0.5 rounded bg-[#1E2022] text-[#FBF9F5] text-[10px] font-mono-code font-bold">
                              {rec.mode === 'minimum_day' ? 'MINIMUM DAY' : 'EXAM MODE'}
                            </span>
                          )}
                        </div>

                        {rec.scorecard?.customReflection && (
                          <p className="text-xs text-[#635E55] italic mt-0.5 truncate max-w-md">
                            "{rec.scorecard.customReflection}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <div className="text-right font-mono-code">
                        <div className="text-sm font-bold text-[#1E2022]">
                          KPI: {kpi.percentage}%
                        </div>
                        <div className="text-[11px] text-[#7A746B]">
                          Tasks: {task.percentage}% ({task.completedCount}/{task.applicableCount})
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onSelectDate(rec.date);
                          onNavigateTab('today');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#1E2022] text-[#FBF9F5] text-xs font-mono-code hover:bg-[#33373B] transition-colors"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

    </div>
  );
};
