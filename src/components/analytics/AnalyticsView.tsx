import React, { useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Flame,
  Layers,
  LineChart,
  PieChart,
  Shield,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { DailyRecord, OperatingMode, PillarType } from '../../types';
import {
  formatReadableDate,
  formatShortDate,
  getISOWeek,
  getMonthInfo,
  getQuarterInfo,
  getTodayDateString,
  offsetDays,
  parseLocalISODate,
} from '../../utils/dateUtils';
import {
  CategoryMetric,
  DayPerformanceSummary,
  generateDiagnosticInsights,
  getAnnualAnalytics,
  getDailyAnalytics,
  getMonthlyAnalytics,
  getQuarterlyAnalytics,
  getWeeklyAnalytics,
} from '../../services/analyticsService';
import { PILLARS_CONFIG } from '../../constants/masterSchedule';

interface AnalyticsViewProps {
  allRecords: Record<string, DailyRecord>;
  currentDateStr: string;
  onSelectDate: (dateStr: string) => void;
  onNavigateTab: (tab: any) => void;
}

type PeriodType = 'day' | 'week' | 'month' | 'quarter' | 'year';

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  allRecords,
  currentDateStr,
  onSelectDate,
  onNavigateTab,
}) => {
  const [periodType, setPeriodType] = useState<PeriodType>('week');
  const [anchorDateStr, setAnchorDateStr] = useState<string>(currentDateStr);
  const [successThreshold, setSuccessThreshold] = useState<number>(70);

  const todayStr = getTodayDateString();

  // Navigation handlers
  const handlePrevPeriod = () => {
    if (periodType === 'day') {
      setAnchorDateStr((prev) => offsetDays(prev, -1));
    } else if (periodType === 'week') {
      setAnchorDateStr((prev) => offsetDays(prev, -7));
    } else if (periodType === 'month') {
      const d = parseLocalISODate(anchorDateStr);
      d.setMonth(d.getMonth() - 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      setAnchorDateStr(`${y}-${m}-01`);
    } else if (periodType === 'quarter') {
      const d = parseLocalISODate(anchorDateStr);
      d.setMonth(d.getMonth() - 3);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      setAnchorDateStr(`${y}-${m}-01`);
    } else if (periodType === 'year') {
      const d = parseLocalISODate(anchorDateStr);
      d.setFullYear(d.getFullYear() - 1);
      setAnchorDateStr(`${d.getFullYear()}-01-01`);
    }
  };

  const handleNextPeriod = () => {
    if (periodType === 'day') {
      setAnchorDateStr((prev) => offsetDays(prev, 1));
    } else if (periodType === 'week') {
      setAnchorDateStr((prev) => offsetDays(prev, 7));
    } else if (periodType === 'month') {
      const d = parseLocalISODate(anchorDateStr);
      d.setMonth(d.getMonth() + 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      setAnchorDateStr(`${y}-${m}-01`);
    } else if (periodType === 'quarter') {
      const d = parseLocalISODate(anchorDateStr);
      d.setMonth(d.getMonth() + 3);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      setAnchorDateStr(`${y}-${m}-01`);
    } else if (periodType === 'year') {
      const d = parseLocalISODate(anchorDateStr);
      d.setFullYear(d.getFullYear() + 1);
      setAnchorDateStr(`${d.getFullYear()}-01-01`);
    }
  };

  const handleJumpToCurrent = () => {
    setAnchorDateStr(todayStr);
  };

  // Compute analytics based on current period
  const dailyData = periodType === 'day' ? getDailyAnalytics(allRecords, anchorDateStr, successThreshold) : null;
  const weeklyData = periodType === 'week' ? getWeeklyAnalytics(allRecords, anchorDateStr, successThreshold) : null;
  const monthlyData = periodType === 'month' ? (() => {
    const d = parseLocalISODate(anchorDateStr);
    return getMonthlyAnalytics(allRecords, d.getFullYear(), d.getMonth() + 1, successThreshold);
  })() : null;
  const quarterlyData = periodType === 'quarter' ? (() => {
    const qInfo = getQuarterInfo(anchorDateStr);
    return getQuarterlyAnalytics(allRecords, qInfo.year, qInfo.quarter, successThreshold);
  })() : null;
  const annualData = periodType === 'year' ? (() => {
    const d = parseLocalISODate(anchorDateStr);
    return getAnnualAnalytics(allRecords, d.getFullYear(), successThreshold);
  })() : null;

  // Diagnostic Insights
  const diagnosticInsights = generateDiagnosticInsights(allRecords, periodType, anchorDateStr);

  // Period formatted header label
  let periodHeaderLabel = '';
  let periodSubLabel = '';
  if (periodType === 'day') {
    periodHeaderLabel = formatReadableDate(anchorDateStr);
    periodSubLabel = anchorDateStr === todayStr ? 'Today (Active Date)' : `Date: ${anchorDateStr}`;
  } else if (periodType === 'week' && weeklyData) {
    periodHeaderLabel = `Week ${weeklyData.weekNumber}, ${weeklyData.year}`;
    periodSubLabel = weeklyData.dateRangeLabel;
  } else if (periodType === 'month' && monthlyData) {
    periodHeaderLabel = `${monthlyData.monthName} ${monthlyData.year}`;
    periodSubLabel = `Total Calendar Days: ${monthlyData.totalDaysInMonth}`;
  } else if (periodType === 'quarter' && quarterlyData) {
    periodHeaderLabel = quarterlyData.label;
    periodSubLabel = quarterlyData.monthsRange;
  } else if (periodType === 'year' && annualData) {
    periodHeaderLabel = `Annual Review ${annualData.year}`;
    periodSubLabel = `Full 365/366 Day System Performance`;
  }

  // Active aggregated values for top metric cards
  const activeKpiScore =
    dailyData ? dailyData.kpiScore :
    weeklyData ? weeklyData.aggregateKpiPercentage :
    monthlyData ? monthlyData.aggregateKpiPercentage :
    quarterlyData ? quarterlyData.aggregateKpiPercentage :
    annualData ? annualData.aggregateKpiPercentage : 0;

  const activeAvgDailyScore =
    dailyData ? dailyData.kpiScore :
    weeklyData ? weeklyData.averageDailyKpiPercentage :
    monthlyData ? monthlyData.averageDailyKpiPercentage :
    quarterlyData ? quarterlyData.averageDailyKpiPercentage :
    annualData ? annualData.averageDailyKpiPercentage : 0;

  const activeScheduleScore =
    dailyData ? dailyData.scheduleExecutionScore :
    weeklyData ? weeklyData.scheduleExecutionPercentage :
    monthlyData ? monthlyData.scheduleExecutionPercentage :
    quarterlyData ? quarterlyData.scheduleExecutionPercentage :
    annualData ? annualData.scheduleExecutionPercentage : 0;

  const activeCategories =
    dailyData?.categories ||
    weeklyData?.categories ||
    monthlyData?.categories ||
    quarterlyData?.categories ||
    annualData?.categories || [];

  const activePillars =
    dailyData?.pillarStats ||
    weeklyData?.pillarStats ||
    monthlyData?.pillarStats ||
    quarterlyData?.pillarStats ||
    annualData?.pillarStats || {};

  const activeCoverage =
    periodType === 'day' ? { tracked: dailyData?.hasRecord ? 1 : 0, total: 1, pct: dailyData?.hasRecord ? 100 : 0 } :
    periodType === 'week' ? { tracked: weeklyData?.trackedDays || 0, total: 7, pct: weeklyData?.coveragePercentage || 0 } :
    periodType === 'month' ? { tracked: monthlyData?.trackedDays || 0, total: monthlyData?.totalDaysInMonth || 30, pct: monthlyData?.coveragePercentage || 0 } :
    periodType === 'quarter' ? { tracked: quarterlyData?.trackedDays || 0, total: quarterlyData?.totalDaysInQuarter || 90, pct: quarterlyData?.coveragePercentage || 0 } :
    { tracked: annualData?.trackedDays || 0, total: annualData?.totalDaysInYear || 365, pct: annualData?.coveragePercentage || 0 };

  const activeStreaks =
    weeklyData ? { current: weeklyData.currentStreak, longest: weeklyData.longestStreak } :
    monthlyData ? { current: monthlyData.currentStreak, longest: monthlyData.longestStreak } :
    quarterlyData ? { current: 0, longest: 0 } :
    annualData ? { current: annualData.currentStreak, longest: annualData.longestStreak } :
    { current: 0, longest: 0 };

  const modeBreakdown =
    weeklyData?.modeBreakdown ||
    monthlyData?.modeBreakdown ||
    quarterlyData?.modeBreakdown ||
    annualData?.modeBreakdown ||
    (dailyData ? { normal: dailyData.mode === 'normal' ? 1 : 0, minimum_day: dailyData.mode === 'minimum_day' ? 1 : 0, exam_mode: dailyData.mode === 'exam_mode' ? 1 : 0 } : { normal: 0, minimum_day: 0, exam_mode: 0 });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header & Time-Level Navigation Bar */}
      <div className="bg-[#FAF6EE] border border-[#E8E2D6] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#1E2022]" />
              <h1 className="text-xl font-bold text-[#1E2022] font-mono-code tracking-tight">
                RKH 8888 Analytics
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#1E2022] text-[#FBF9F5] text-[10px] font-mono-code font-bold uppercase">
                Long-Term System
              </span>
            </div>
            <p className="text-xs text-[#635E55] mt-1">
              Derived diagnostics calculated from actual historical records. Strict data integrity.
            </p>
          </div>

          {/* Time Level Tabs (Day, Week, Month, Quarter, Year) */}
          <div className="flex items-center bg-[#EFE9DC] p-1 rounded-xl gap-1 border border-[#E2DBD0]">
            {(['day', 'week', 'month', 'quarter', 'year'] as PeriodType[]).map((type) => (
              <button
                key={type}
                onClick={() => setPeriodType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-code font-semibold capitalize transition-all ${
                  periodType === type
                    ? 'bg-[#1E2022] text-[#FBF9F5] shadow-xs'
                    : 'text-[#635E55] hover:text-[#1E2022] hover:bg-[#E5DEC7]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

        </div>

        {/* Period Stepper Navigator */}
        <div className="mt-4 pt-4 border-t border-[#E8E2D6] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPeriod}
              className="p-1.5 rounded-lg bg-[#EFE9DC] hover:bg-[#E2DBD0] text-[#1E2022] transition-colors"
              title="Previous Period"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleNextPeriod}
              className="p-1.5 rounded-lg bg-[#EFE9DC] hover:bg-[#E2DBD0] text-[#1E2022] transition-colors"
              title="Next Period"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleJumpToCurrent}
              className="px-2.5 py-1 rounded-lg bg-[#EFE9DC] hover:bg-[#E2DBD0] text-xs font-mono-code font-semibold text-[#1E2022] transition-colors"
            >
              Current / Today
            </button>

            <div className="ml-2">
              <div className="text-sm font-bold text-[#1E2022] font-mono-code">
                {periodHeaderLabel}
              </div>
              <div className="text-[11px] text-[#7A746B]">
                {periodSubLabel}
              </div>
            </div>
          </div>

          {/* Drill-down breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-[#7A746B] font-mono-code">
            <button
              onClick={() => {
                setPeriodType('year');
              }}
              className="hover:text-[#1E2022] underline cursor-pointer"
            >
              {parseLocalISODate(anchorDateStr).getFullYear()}
            </button>
            <span>/</span>
            <button
              onClick={() => {
                setPeriodType('quarter');
              }}
              className="hover:text-[#1E2022] underline cursor-pointer"
            >
              Q{getQuarterInfo(anchorDateStr).quarter}
            </button>
            <span>/</span>
            <button
              onClick={() => {
                setPeriodType('month');
              }}
              className="hover:text-[#1E2022] underline cursor-pointer"
            >
              {getMonthInfo(anchorDateStr).name.slice(0, 3)}
            </button>
            <span>/</span>
            <button
              onClick={() => {
                setPeriodType('week');
              }}
              className="hover:text-[#1E2022] underline cursor-pointer"
            >
              W{getISOWeek(anchorDateStr).weekNumber}
            </button>
            <span>/</span>
            <button
              onClick={() => {
                setPeriodType('day');
              }}
              className="hover:text-[#1E2022] underline cursor-pointer"
            >
              {parseLocalISODate(anchorDateStr).getDate()}
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Score Cards (Dual Metrics Separation) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: 7-Point KPI Diagnostic Score */}
        <div className="bg-[#FAF6EE] border border-[#E8E2D6] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-code text-[#7A746B] uppercase font-bold tracking-wider">
                KPI Diagnostic Score
              </span>
              <Target className="w-4 h-4 text-[#1E2022]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#1E2022] font-mono-code">
                {activeKpiScore}%
              </span>
              {periodType !== 'day' && (
                <span className="text-[11px] text-[#7A746B]">
                  (avg {activeAvgDailyScore}%)
                </span>
              )}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E8E2D6] text-xs text-[#635E55]">
            {periodType === 'day' ? (
              <span>{dailyData?.kpisCompleted || 0} / {dailyData?.kpisApplicable || 0} applicable KPIs</span>
            ) : (
              <span>Aggregated from {activeCoverage.tracked} tracked days</span>
            )}
          </div>
        </div>

        {/* Card 2: Detailed Task Schedule Execution */}
        <div className="bg-[#FAF6EE] border border-[#E8E2D6] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-code text-[#7A746B] uppercase font-bold tracking-wider">
                Schedule Execution
              </span>
              <Activity className="w-4 h-4 text-[#1E2022]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#1E2022] font-mono-code">
                {activeScheduleScore}%
              </span>
              <span className="text-[11px] text-[#7A746B]">
                planned blocks
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E8E2D6] text-xs text-[#635E55]">
            Strictly separated from 7-point KPI score
          </div>
        </div>

        {/* Card 3: Data Coverage & Mode Breakdown */}
        <div className="bg-[#FAF6EE] border border-[#E8E2D6] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-code text-[#7A746B] uppercase font-bold tracking-wider">
                Data Coverage
              </span>
              <Shield className="w-4 h-4 text-[#1E2022]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#1E2022] font-mono-code">
                {activeCoverage.tracked} / {activeCoverage.total}
              </span>
              <span className="text-xs text-[#7A746B]">
                days ({activeCoverage.pct}%)
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E8E2D6] flex items-center gap-2 text-[11px] text-[#635E55]">
            <span className="px-1.5 py-0.5 rounded bg-[#EFE9DC]">Norm: {modeBreakdown.normal}</span>
            <span className="px-1.5 py-0.5 rounded bg-[#EFE9DC]">Min: {modeBreakdown.minimum_day}</span>
            <span className="px-1.5 py-0.5 rounded bg-[#EFE9DC]">Exam: {modeBreakdown.exam_mode}</span>
          </div>
        </div>

        {/* Card 4: Streaks & Consistency */}
        <div className="bg-[#FAF6EE] border border-[#E8E2D6] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-code text-[#7A746B] uppercase font-bold tracking-wider">
                Consistency Streak
              </span>
              <Flame className="w-4 h-4 text-[#1E2022]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#1E2022] font-mono-code">
                {activeStreaks.current}
              </span>
              <span className="text-xs text-[#7A746B]">
                days active (record: {activeStreaks.longest}d)
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E8E2D6] text-xs text-[#635E55]">
            Threshold: &ge;{successThreshold}% (Minimum Days exempt)
          </div>
        </div>

      </div>

      {/* Period Comparison Card (if available) */}
      {weeklyData?.previousWeekComparison && (
        <div className="bg-[#FAF6EE] border border-[#E8E2D6] rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              weeklyData.previousWeekComparison.kpiPercentageDelta >= 0
                ? 'bg-[#E5F2E5] text-[#2D6A4F]'
                : 'bg-[#FBE8E8] text-[#9E2A2B]'
            }`}>
              {weeklyData.previousWeekComparison.kpiPercentageDelta >= 0 ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="text-xs font-mono-code text-[#7A746B]">
                Week-over-Week Comparison vs {weeklyData.previousWeekComparison.prevWeekKey} ({weeklyData.previousWeekComparison.prevKpiPercentage}%)
              </div>
              <div className="text-sm font-bold text-[#1E2022] font-mono-code mt-0.5">
                {weeklyData.previousWeekComparison.kpiPercentageDelta >= 0 ? '+' : ''}
                {weeklyData.previousWeekComparison.kpiPercentageDelta} percentage points KPI score
              </div>
            </div>
          </div>
        </div>
      )}

      {monthlyData?.previousMonthComparison && (
        <div className="bg-[#FAF6EE] border border-[#E8E2D6] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              monthlyData.previousMonthComparison.kpiPercentageDelta >= 0
                ? 'bg-[#E5F2E5] text-[#2D6A4F]'
                : 'bg-[#FBE8E8] text-[#9E2A2B]'
            }`}>
              {monthlyData.previousMonthComparison.kpiPercentageDelta >= 0 ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="text-xs font-mono-code text-[#7A746B]">
                Month-over-Month Comparison vs {monthlyData.previousMonthComparison.prevMonthName} ({monthlyData.previousMonthComparison.prevKpiPercentage}%)
              </div>
              <div className="text-sm font-bold text-[#1E2022] font-mono-code mt-0.5">
                {monthlyData.previousMonthComparison.kpiPercentageDelta >= 0 ? '+' : ''}
                {monthlyData.previousMonthComparison.kpiPercentageDelta} percentage points
              </div>
            </div>
          </div>
          {monthlyData.previousMonthComparison.mostImprovedCategory && (
            <div className="text-xs font-mono-code text-[#2D6A4F] bg-[#E5F2E5] px-3 py-1.5 rounded-lg self-start sm:self-auto">
              Most Improved: {monthlyData.previousMonthComparison.mostImprovedCategory.label.replace(/^\d+\.\s*/, '')} (+{monthlyData.previousMonthComparison.mostImprovedCategory.delta} pts)
            </div>
          )}
        </div>
      )}

      {/* Visual Progression Chart */}
      <div className="bg-[#FAF6EE] border border-[#E8E2D6] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-[#1E2022]" />
            <h2 className="text-sm font-bold text-[#1E2022] font-mono-code uppercase tracking-wider">
              {periodType === 'week' ? 'Weekly 7-Day Performance Progression' :
               periodType === 'month' ? 'Month Timeline & Weekly Segments' :
               periodType === 'quarter' ? 'Quarterly Monthly Progression' :
               periodType === 'year' ? 'Annual 12-Month Progression' : 'Daily Status'}
            </h2>
          </div>
          <span className="text-[11px] text-[#7A746B] font-mono-code">
            Source: Actual Daily Records
          </span>
        </div>

        {/* Weekly 7-Day View */}
        {periodType === 'week' && weeklyData && (
          <div className="grid grid-cols-7 gap-2">
            {weeklyData.days.map((day) => {
              const isSelected = day.date === currentDateStr;
              return (
                <button
                  key={day.date}
                  onClick={() => {
                    onSelectDate(day.date);
                    onNavigateTab('today');
                  }}
                  className={`flex flex-col items-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected ? 'ring-2 ring-[#1E2022] border-[#1E2022]' : 'border-[#E8E2D6] hover:border-[#CDC4B5]'
                  } ${
                    day.temporalState === 'FUTURE_PLANNED' ? 'bg-[#F2ECE1]/40 opacity-50' :
                    day.temporalState === 'NOT_TRACKED' ? 'bg-[#F2ECE1]' :
                    day.isSuccessful ? 'bg-[#E5F2E5]/50' : 'bg-[#FAF6EE]'
                  }`}
                >
                  <span className="text-[11px] font-bold text-[#635E55] font-mono-code uppercase">
                    {day.weekday.slice(0, 3)}
                  </span>
                  <span className="text-xs text-[#7A746B] mt-0.5">
                    {day.date.split('-')[2]}
                  </span>
                  
                  {/* Visual Bar */}
                  <div className="w-full bg-[#E5DEC7] h-12 rounded-lg mt-2 flex flex-col justify-end p-0.5 overflow-hidden">
                    {day.hasRecord ? (
                      <div
                        className={`w-full rounded transition-all ${
                          day.kpiPercentage >= 85 ? 'bg-[#2D6A4F]' :
                          day.kpiPercentage >= 70 ? 'bg-[#40916C]' :
                          day.kpiPercentage >= 50 ? 'bg-[#DDA15E]' : 'bg-[#BC6C25]'
                        }`}
                        style={{ height: `${Math.max(day.kpiPercentage, 10)}%` }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-[#A8A196]">
                        {day.temporalState === 'FUTURE_PLANNED' ? 'Fut' : 'None'}
                      </div>
                    )}
                  </div>

                  <span className="text-xs font-bold font-mono-code text-[#1E2022] mt-1.5">
                    {day.hasRecord ? `${day.kpiPercentage}%` : '—'}
                  </span>

                  {day.mode !== 'normal' && (
                    <span className="text-[9px] font-mono-code px-1 rounded bg-[#1E2022] text-[#FBF9F5] mt-1">
                      {day.mode === 'minimum_day' ? 'MIN' : 'EXAM'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Monthly Breakdown View */}
        {periodType === 'month' && monthlyData && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {monthlyData.weeklyBreakdown.map((w) => (
                <div key={w.weekKey} className="p-3 rounded-xl bg-[#F2ECE1] border border-[#E2DBD0]">
                  <div className="flex items-center justify-between text-xs font-mono-code">
                    <span className="font-bold text-[#1E2022]">{w.weekLabel}</span>
                    <span className="text-[#7A746B]">{w.trackedDays} days</span>
                  </div>
                  <div className="text-xl font-bold font-mono-code text-[#1E2022] mt-1">
                    {w.score}%
                  </div>
                  <div className="w-full bg-[#E2DBD0] h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-[#1E2022] h-full rounded-full" style={{ width: `${w.score}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Best & Weakest Day badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono-code">
              {monthlyData.bestDay && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E5F2E5] text-[#2D6A4F] border border-[#B7E4C7]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Best Day: {monthlyData.bestDay.weekday}, {formatShortDate(monthlyData.bestDay.date)} ({monthlyData.bestDay.score}%)</span>
                </div>
              )}
              {monthlyData.weakestDay && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FBE8E8] text-[#9E2A2B] border border-[#F5C2C7]">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Weakest Day: {monthlyData.weakestDay.weekday}, {formatShortDate(monthlyData.weakestDay.date)} ({monthlyData.weakestDay.score}%)</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quarterly Progression View */}
        {periodType === 'quarter' && quarterlyData && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quarterlyData.monthlyProgression.map((m) => (
              <div key={m.monthKey} className="p-4 rounded-xl bg-[#F2ECE1] border border-[#E2DBD0]">
                <div className="flex items-center justify-between text-xs font-mono-code">
                  <span className="font-bold text-[#1E2022]">{m.monthName}</span>
                  <span className="text-[#7A746B]">{m.trackedDays} days</span>
                </div>
                <div className="text-2xl font-bold font-mono-code text-[#1E2022] mt-1.5">
                  {m.score}%
                </div>
                <div className="w-full bg-[#E2DBD0] h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-[#1E2022] h-full rounded-full" style={{ width: `${m.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Annual Progression View */}
        {periodType === 'year' && annualData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {annualData.quarterlyProgression.map((q) => (
                <div key={q.quarterKey} className="p-3 rounded-xl bg-[#F2ECE1] border border-[#E2DBD0]">
                  <div className="flex items-center justify-between text-xs font-mono-code">
                    <span className="font-bold text-[#1E2022]">{q.label}</span>
                    <span className="text-[#7A746B]">{q.trackedDays}d</span>
                  </div>
                  <div className="text-xl font-bold font-mono-code text-[#1E2022] mt-1">
                    {q.score}%
                  </div>
                  <div className="w-full bg-[#E2DBD0] h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-[#1E2022] h-full rounded-full" style={{ width: `${q.score}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
              {annualData.monthlyProgression.map((m) => (
                <div key={m.monthKey} className="p-2 rounded-lg bg-[#F2ECE1] border border-[#E2DBD0] text-center">
                  <div className="text-[10px] font-mono-code font-bold text-[#635E55]">
                    {m.monthName.slice(0, 3)}
                  </div>
                  <div className="text-xs font-bold font-mono-code text-[#1E2022] mt-1">
                    {m.trackedDays > 0 ? `${m.score}%` : '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Two-Column Section: 7-Point KPI Categories & 6 Schedule Pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: 7-Point Scorecard Diagnostic Categories */}
        <div className="bg-[#FAF6EE] border border-[#E8E2D6] rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#1E2022] font-mono-code uppercase tracking-wider">
              7-Point Scorecard Categories
            </h3>
            <span className="text-xs text-[#7A746B] font-mono-code">
              Diagnostic Breakdown
            </span>
          </div>

          <div className="space-y-3">
            {activeCategories.map((cat) => (
              <div key={cat.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#1E2022]">{cat.label}</span>
                  <div className="flex items-center gap-2 font-mono-code">
                    <span className="text-[#7A746B]">({cat.completed}/{cat.applicable})</span>
                    <span className="font-bold text-[#1E2022] w-10 text-right">{cat.percentage}%</span>
                  </div>
                </div>
                <div className="w-full bg-[#EFE9DC] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      cat.percentage >= 85 ? 'bg-[#2D6A4F]' :
                      cat.percentage >= 70 ? 'bg-[#40916C]' :
                      cat.percentage >= 50 ? 'bg-[#DDA15E]' : 'bg-[#BC6C25]'
                    }`}
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: 6 Schedule Pillars Execution */}
        <div className="bg-[#FAF6EE] border border-[#E8E2D6] rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#1E2022] font-mono-code uppercase tracking-wider">
              6 Schedule Pillars Execution
            </h3>
            <span className="text-xs text-[#7A746B] font-mono-code">
              Task Level
            </span>
          </div>

          <div className="space-y-3">
            {(Object.keys(PILLARS_CONFIG) as PillarType[]).map((pKey) => {
              const pConf = PILLARS_CONFIG[pKey];
              const stat = activePillars[pKey] || { total: 0, completed: 0, percentage: 0 };
              return (
                <div key={pKey} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#1E2022]">{pConf.label}</span>
                    <div className="flex items-center gap-2 font-mono-code">
                      <span className="text-[#7A746B]">({stat.completed}/{stat.total})</span>
                      <span className="font-bold text-[#1E2022] w-10 text-right">{stat.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-[#EFE9DC] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all bg-[#1E2022]"
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Diagnostic Observations Engine (Rule-Based Insights) */}
      <div className="bg-[#FAF6EE] border border-[#E8E2D6] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#1E2022]" />
          <h3 className="text-sm font-bold text-[#1E2022] font-mono-code uppercase tracking-wider">
            Personal Diagnostic Observations
          </h3>
          <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-[#EFE9DC] text-[#635E55]">
            Derived Rule Engine
          </span>
        </div>

        <div className="space-y-2">
          {diagnosticInsights.map((insight, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F5EFE6] border border-[#E8E2D6] text-xs text-[#1E2022] leading-relaxed"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#1E2022] mt-1.5 shrink-0" />
              <span>{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Links to Integrated Reviews */}
      <div className="bg-[#FAF6EE] border border-[#E8E2D6] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-[#635E55]">
          <span className="font-bold text-[#1E2022]">Diagnostic Reflection:</span> Combine metrics with qualitative reviews.
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('reviews')}
            className="px-3.5 py-1.5 rounded-xl bg-[#1E2022] text-[#FBF9F5] text-xs font-mono-code font-semibold hover:bg-[#33373B] transition-colors"
          >
            Open Saturday Reset & Life Audits &rarr;
          </button>
        </div>
      </div>

    </div>
  );
};
