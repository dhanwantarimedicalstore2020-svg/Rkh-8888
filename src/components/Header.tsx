import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Flame,
  Lightbulb,
  Shield,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { DailyRecord, OperatingMode } from '../types';
import { formatReadableDate, formatShortDate, getTodayDateString, offsetDays } from '../utils/dateUtils';

interface HeaderProps {
  currentRecord: DailyRecord;
  onDateChange: (dateStr: string) => void;
  onModeChange: (mode: OperatingMode) => void;
  onOpenQuickIdea: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRecord,
  onDateChange,
  onModeChange,
  onOpenQuickIdea,
}) => {
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const todayStr = getTodayDateString();
  const isToday = currentRecord.date === todayStr;

  const scorePct = currentRecord.scorePercentage;
  const getScoreColor = (pct: number) => {
    if (pct >= 85) return 'text-[#166534] bg-[#ECFDF5] border-[#BBF7D0]';
    if (pct >= 70) return 'text-[#B45309] bg-[#FEF3C7] border-[#FDE68A]';
    return 'text-[#9A3412] bg-[#FFF7ED] border-[#FFEDD5]';
  };

  const getModeLabel = (mode: OperatingMode) => {
    switch (mode) {
      case 'minimum_day':
        return { label: 'MINIMUM DAY', color: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]' };
      case 'exam_mode':
        return { label: 'EXAM MODE', color: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]' };
      default:
        return { label: 'STANDARD', color: 'bg-[#F4EFE6] text-[#4A453E] border-[#E5DEC9]' };
    }
  };

  const modeInfo = getModeLabel(currentRecord.mode);

  return (
    <header className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-[#E8E2D6] px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        
        {/* Brand & Mode Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1E2022] text-[#FBF9F5] flex items-center justify-center font-slab font-bold text-sm tracking-wider shadow-sm">
              88
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-slab font-extrabold text-lg text-[#1E2022] tracking-tight">RKH 8888</span>
                <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-[#EFE9DC] text-[#635E55] border border-[#DDD5C5]">
                  OS v1.0
                </span>
              </div>
              <p className="text-[11px] text-[#7A746B] font-medium hidden sm:block">
                Daily Execution • Academic Mastery • Venture Incubation
              </p>
            </div>
          </div>

          {/* Quick Idea Trigger on Mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onOpenQuickIdea}
              className="p-2 rounded-lg bg-[#F0EBE0] hover:bg-[#E5DEC9] text-[#1E2022] transition-colors border border-[#DDD5C5]"
              title="5-Min Idea Capture"
              aria-label="Capture Idea"
            >
              <Lightbulb className="w-4 h-4 text-[#6D28D9]" />
            </button>
            
            {/* Score pill mobile */}
            <div className={`px-2.5 py-1 rounded-full text-xs font-mono-code font-semibold border ${getScoreColor(scorePct)}`}>
              {scorePct}%
            </div>
          </div>
        </div>

        {/* Date Navigator Bar */}
        <div className="flex items-center justify-between md:justify-center gap-1.5 bg-[#F2ECE1] p-1.5 rounded-xl border border-[#E2D8C3] shadow-xs">
          <button
            onClick={() => onDateChange(offsetDays(currentRecord.date, -1))}
            className="p-1.5 rounded-lg hover:bg-[#E4DAC5] text-[#4A453E] transition-colors"
            title="Previous Day"
            aria-label="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-2">
            <span className="font-slab font-bold text-sm text-[#1E2022]">
              {currentRecord.weekday}
            </span>
            <span className="text-xs text-[#635E55] font-mono-code">
              {formatShortDate(currentRecord.date)}
            </span>
            
            <input
              type="date"
              value={currentRecord.date}
              onChange={(e) => {
                if (e.target.value) onDateChange(e.target.value);
              }}
              className="w-5 h-5 opacity-0 absolute cursor-pointer"
              title="Select specific calendar date"
              id="calendar-native-picker"
            />
            <label htmlFor="calendar-native-picker" className="cursor-pointer text-[#7A746B] hover:text-[#1E2022]">
              <CalendarIcon className="w-3.5 h-3.5" />
            </label>
          </div>

          <button
            onClick={() => onDateChange(offsetDays(currentRecord.date, 1))}
            className="p-1.5 rounded-lg hover:bg-[#E4DAC5] text-[#4A453E] transition-colors"
            title="Next Day"
            aria-label="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isToday && (
            <button
              onClick={() => onDateChange(todayStr)}
              className="ml-1 px-2 py-1 text-[11px] font-mono-code font-semibold bg-[#1E2022] text-[#FBF9F5] rounded-md hover:bg-[#33373B] transition-colors shadow-2xs"
            >
              Today
            </button>
          )}
        </div>

        {/* Operating Mode & Quick Actions (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {/* Operating Mode Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowModeDropdown(!showModeDropdown)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono-code font-semibold border flex items-center gap-2 transition-all ${modeInfo.color}`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{modeInfo.label}</span>
              <SlidersHorizontal className="w-3 h-3 opacity-60" />
            </button>

            {showModeDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-[#FFFFFF] rounded-xl shadow-lg border border-[#E2D8C3] p-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1 text-[10px] font-mono-code uppercase tracking-wider text-[#8C8275]">
                  System Operating Mode
                </div>
                <button
                  onClick={() => {
                    onModeChange('normal');
                    setShowModeDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex flex-col ${
                    currentRecord.mode === 'normal' ? 'bg-[#F4EFE6] font-semibold text-[#1E2022]' : 'text-[#4A453E] hover:bg-[#F9F7F2]'
                  }`}
                >
                  <span className="font-medium">Standard Execution</span>
                  <span className="text-[10px] text-[#7A746B]">Full 6-pillar standard cadence</span>
                </button>
                <button
                  onClick={() => {
                    onModeChange('minimum_day');
                    setShowModeDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex flex-col ${
                    currentRecord.mode === 'minimum_day' ? 'bg-[#FEF3C7] font-semibold text-[#92400E]' : 'text-[#4A453E] hover:bg-[#F9F7F2]'
                  }`}
                >
                  <span className="font-medium">Minimum Day (Disrupted)</span>
                  <span className="text-[10px] text-[#7A746B]">Shrinks system; prevents broken streak</span>
                </button>
                <button
                  onClick={() => {
                    onModeChange('exam_mode');
                    setShowModeDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex flex-col ${
                    currentRecord.mode === 'exam_mode' ? 'bg-[#FEE2E2] font-semibold text-[#991B1B]' : 'text-[#4A453E] hover:bg-[#F9F7F2]'
                  }`}
                >
                  <span className="font-medium">Exam Mode (Academic Focus)</span>
                  <span className="text-[10px] text-[#7A746B]">Academics dominate; preserves sleep</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Idea Capture Button */}
          <button
            onClick={onOpenQuickIdea}
            className="px-3 py-1.5 rounded-lg bg-[#5B21B6] hover:bg-[#4C1D95] text-[#FBF9F5] text-xs font-mono-code font-medium flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Lightbulb className="w-3.5 h-3.5 text-[#FDE68A]" />
            <span>Idea Capture</span>
          </button>

          {/* Diagnostic Scorecard Pill */}
          <div className={`px-3 py-1.5 rounded-lg text-xs font-mono-code font-semibold border flex items-center gap-1.5 ${getScoreColor(scorePct)}`}>
            <Flame className="w-3.5 h-3.5" />
            <span>{scorePct}%</span>
          </div>
        </div>

      </div>
    </header>
  );
};
