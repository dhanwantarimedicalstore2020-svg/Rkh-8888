import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Flame,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { DailyRecord } from '../../types';
import {
  formatReadableDate,
  formatShortDate,
  getMonthGrid,
  getMonthInfo,
  getTodayDateString,
  parseLocalISODate,
} from '../../utils/dateUtils';
import { loadAllRecords } from '../../services/storageService';

interface TimelineViewProps {
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
  allRecords: Record<string, DailyRecord>;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  selectedDateStr,
  onSelectDate,
  allRecords,
}) => {
  const currentDate = parseLocalISODate(selectedDateStr);
  const [viewYear, setViewYear] = useState<number>(currentDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(currentDate.getMonth() + 1); // 1-12
  const todayStr = getTodayDateString();

  const monthGrid = getMonthGrid(viewYear, viewMonth);
  const monthInfo = getMonthInfo(`${viewYear}-${String(viewMonth).padStart(2, '0')}-01`);

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear(viewYear - 1);
      setViewMonth(12);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear(viewYear + 1);
      setViewMonth(1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const getHeatmapClass = (dateStr: string, isCurrentMonth: boolean) => {
    const record = allRecords[dateStr];
    if (!record) {
      return isCurrentMonth ? 'bg-[#FFFFFF] text-[#4A453E] border-[#EAE4D6]' : 'bg-[#F7F4EE] text-[#A8A196] border-transparent';
    }

    const pct = record.scorePercentage;
    if (pct >= 85) return 'bg-[#ECFDF5] text-[#166534] border-[#86EFAC] font-bold';
    if (pct >= 70) return 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] font-bold';
    return 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA] font-bold';
  };

  const selectedRecord = allRecords[selectedDateStr];

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-200">
      
      {/* 1. Month Calendar Header & Grid */}
      <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-4 sm:p-6 shadow-xs">
        
        {/* Month Navigation Controls */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#EFE9DC]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#1E2022] text-[#FBF9F5]">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-slab font-bold text-lg text-[#1E2022]">
                {monthInfo.name} {viewYear}
              </h2>
              <p className="text-xs text-[#7A746B]">
                Deterministic date ledger • Independent daily states
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const now = new Date();
                setViewYear(now.getFullYear());
                setViewMonth(now.getMonth() + 1);
                onSelectDate(todayStr);
              }}
              className="px-2.5 py-1 text-xs font-mono-code bg-[#F2ECE1] hover:bg-[#E5DEC9] text-[#1E2022] rounded-lg transition-colors border border-[#DDD5C5]"
            >
              Current Month
            </button>
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-[#F2ECE1] text-[#4A453E] transition-colors border border-[#EAE4D6]"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-[#F2ECE1] text-[#4A453E] transition-colors border border-[#EAE4D6]"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday column headers */}
        <div className="grid grid-cols-7 gap-1 text-center font-mono-code text-[11px] font-bold text-[#7A746B] mb-2">
          <div>MON</div>
          <div>TUE</div>
          <div>WED</div>
          <div>THU</div>
          <div>FRI</div>
          <div>SAT</div>
          <div>SUN</div>
        </div>

        {/* 7-column Calendar Matrix */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {monthGrid.map((cell) => {
            const isSelected = cell.dateStr === selectedDateStr;
            const record = allRecords[cell.dateStr];
            const heatmapClass = getHeatmapClass(cell.dateStr, cell.isCurrentMonth);

            return (
              <button
                key={cell.dateStr}
                onClick={() => onSelectDate(cell.dateStr)}
                className={`relative min-h-[56px] sm:min-h-[72px] p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all ${heatmapClass} ${
                  isSelected ? 'ring-2 ring-[#1E2022] shadow-sm scale-102 z-10' : 'hover:border-[#C5BCAB]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xs font-mono-code ${cell.isToday ? 'px-1.5 py-0.5 rounded bg-[#1E2022] text-[#FBF9F5] font-bold' : ''}`}>
                    {cell.dayNumber}
                  </span>
                  {record && (
                    <span className="text-[10px] font-mono-code font-bold hidden sm:inline">
                      {record.scorePercentage}%
                    </span>
                  )}
                </div>

                {record && (
                  <div className="flex items-center gap-0.5 mt-1">
                    {/* Mini dot indicators */}
                    <div className={`w-2 h-2 rounded-full ${
                      record.scorePercentage >= 85 ? 'bg-[#166534]' : record.scorePercentage >= 70 ? 'bg-[#B45309]' : 'bg-[#C2410C]'
                    }`} />
                    <span className="text-[9px] font-mono-code text-[#4A453E] truncate sm:hidden">
                      {record.scorePercentage}%
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between flex-wrap gap-3 mt-4 pt-3 border-t border-[#EFE9DC] text-xs font-mono-code text-[#7A746B]">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#ECFDF5] border border-[#86EFAC]" />
              <span>High Mastery (≥85%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#FEF3C7] border border-[#FDE68A]" />
              <span>Moderate (70-84%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#FFF7ED] border border-[#FED7AA]" />
              <span>Disrupted (&lt;70%)</span>
            </div>
          </div>
          <div>
            Leap Year &amp; Feb 29 Supported
          </div>
        </div>

      </div>

      {/* 2. Historical Date Record Inspector */}
      <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#EFE9DC]">
          <div>
            <span className="text-[11px] font-mono-code uppercase text-[#7A746B]">Selected Historical Ledger</span>
            <h3 className="font-slab font-bold text-lg text-[#1E2022]">
              {formatReadableDate(selectedDateStr)}
            </h3>
          </div>

          {selectedRecord && (
            <div className="text-right">
              <span className="text-xs font-mono-code text-[#7A746B]">Scorecard</span>
              <div className="text-base font-mono-code font-bold text-[#1E2022]">
                {selectedRecord.scorePercentage}%
              </div>
            </div>
          )}
        </div>

        {selectedRecord ? (
          <div className="space-y-3">
            {/* Scorecard quick pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {Object.entries(selectedRecord.scorecard)
                .filter(([k]) => k !== 'customReflection')
                .map(([key, val]) => (
                  <div
                    key={key}
                    className={`p-2 rounded-lg border text-xs font-mono-code flex flex-col items-center justify-center ${
                      val === 'completed'
                        ? 'bg-[#ECFDF5] border-[#BBF7D0] text-[#166534]'
                        : val === 'skipped'
                        ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                        : val === 'deferred'
                        ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                        : val === 'na'
                        ? 'bg-[#F3F4F6] border-[#E5E7EB] text-[#6B7280]'
                        : 'bg-[#FBF9F5] border-[#E2D8C3] text-[#7A746B]'
                    }`}
                  >
                    <span className="capitalize text-[10px] text-[#4A453E] font-semibold">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-bold uppercase text-[9px] mt-0.5">{String(val)}</span>
                  </div>
                ))}
            </div>

            {selectedRecord.scorecard.customReflection && (
              <div className="p-3 bg-[#FBF9F5] border border-[#E2D8C3] rounded-xl text-xs text-[#4A453E]">
                <span className="font-semibold text-[#1E2022]">Evening Reflection: </span>
                {selectedRecord.scorecard.customReflection}
              </div>
            )}

            {/* Task summary */}
            <div className="mt-4 pt-3 border-t border-[#EFE9DC]">
              <h4 className="text-xs font-semibold text-[#1E2022] mb-2">Executed Blocks:</h4>
              <div className="space-y-1.5">
                {selectedRecord.items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#FAF8F5] border border-[#EFE9DC] text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono-code text-[11px] text-[#7A746B] w-24 shrink-0">
                        {it.timeRange}
                      </span>
                      <span className="font-medium text-[#1E2022]">{it.title}</span>
                    </div>
                    <span
                      className={`text-[9px] font-mono-code px-2 py-0.5 rounded font-bold uppercase ${
                        it.status === 'completed'
                          ? 'bg-[#ECFDF5] text-[#166534]'
                          : it.status === 'skipped'
                          ? 'bg-[#FEF2F2] text-[#991B1B]'
                          : it.status === 'deferred'
                          ? 'bg-[#FFFBEB] text-[#92400E]'
                          : it.status === 'na'
                          ? 'bg-[#F3F4F6] text-[#6B7280]'
                          : 'bg-[#E5DEC9] text-[#4A453E]'
                      }`}
                    >
                      {it.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-[#7A746B]">
            No recorded entry instantiated for this date yet. Selecting this date in the header will instantiate an isolated record.
          </div>
        )}

      </div>

    </div>
  );
};
