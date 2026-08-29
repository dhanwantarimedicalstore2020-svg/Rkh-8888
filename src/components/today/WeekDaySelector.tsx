import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { DayOfWeek } from '../../types';
import { getTodayDateString, getWeekDaysForDate, offsetDays } from '../../utils/dateUtils';

interface WeekDaySelectorProps {
  selectedDate?: string;
  currentSelectedDate?: string;
  onSelectDate: (dateStr: string) => void;
  dailyStatusMap?: Record<string, { completedTasks: number; totalTasks: number; kpiPercentage: number }>;
}

const SHORT_WEEKDAY_NAMES: Record<DayOfWeek, string> = {
  Monday: 'Mo',
  Tuesday: 'Tu',
  Wednesday: 'We',
  Thursday: 'Th',
  Friday: 'Fr',
  Saturday: 'Sa',
  Sunday: 'Su',
};

export const WeekDaySelector: React.FC<WeekDaySelectorProps> = ({
  selectedDate,
  currentSelectedDate,
  onSelectDate,
  dailyStatusMap = {},
}) => {
  const activeDate = selectedDate || currentSelectedDate || getTodayDateString();
  const todayStr = getTodayDateString();
  const weekDays = getWeekDaysForDate(activeDate);

  const handlePrevWeek = () => {
    onSelectDate(offsetDays(activeDate, -7));
  };

  const handleNextWeek = () => {
    onSelectDate(offsetDays(activeDate, 7));
  };

  const handleJumpToday = () => {
    onSelectDate(todayStr);
  };

  return (
    <div id="week-day-selector" className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-3 sm:p-4 shadow-xs">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-[#7A746B]" />
          <span className="font-mono-code text-[11px] uppercase tracking-wider text-[#7A746B] font-semibold">
            Week Navigation
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevWeek}
            className="p-1 rounded-md hover:bg-[#F2ECE1] text-[#635E55] transition-colors"
            title="Previous Week"
            aria-label="Previous Week"
            id="btn-prev-week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {selectedDate !== todayStr && (
            <button
              onClick={handleJumpToday}
              className="px-2 py-0.5 rounded-md text-[10px] font-mono-code font-bold bg-[#1E2022] text-[#FBF9F5] hover:bg-[#33373B] transition-colors"
              id="btn-jump-today"
            >
              Today
            </button>
          )}

          <button
            onClick={handleNextWeek}
            className="p-1 rounded-md hover:bg-[#F2ECE1] text-[#635E55] transition-colors"
            title="Next Week"
            aria-label="Next Week"
            id="btn-next-week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7-Day Buttons Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map((day) => {
          const isSelected = day.dateStr === selectedDate;
          const isToday = day.dateStr === todayStr;
          const isFuture = day.dateStr > todayStr;
          const dayNumber = day?.dateStr ? (day.dateStr.split('-')[2] || '') : '';
          const shortName = day?.weekday ? (SHORT_WEEKDAY_NAMES[day.weekday] || day.weekday.slice(0, 2)) : '';
          const status = day?.dateStr ? dailyStatusMap[day.dateStr] : undefined;

          return (
            <button
              key={day.dateStr}
              onClick={() => onSelectDate(day.dateStr)}
              id={`btn-day-nav-${day.dateStr}`}
              aria-label={`Select ${day.weekday} ${day.dateStr}`}
              className={`flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 rounded-xl transition-all relative ${
                isSelected
                  ? 'bg-[#1E2022] text-[#FBF9F5] shadow-sm ring-2 ring-[#1E2022]/20 font-bold scale-[1.02]'
                  : isToday
                  ? 'bg-[#F4EFE6] text-[#1E2022] border-2 border-[#1E2022]/40 font-semibold hover:bg-[#EAE4D6]'
                  : isFuture
                  ? 'bg-[#FBF9F5] text-[#8C8275] border border-[#EAE4D6] hover:bg-[#F4EFE6]'
                  : 'bg-[#FBF9F5] text-[#4A453E] border border-[#EAE4D6] hover:bg-[#F4EFE6]'
              }`}
            >
              {/* Today indicator pip */}
              {isToday && !isSelected && (
                <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-[#C2410C]" />
              )}

              <span className={`text-[10px] font-mono-code ${isSelected ? 'text-[#DDD5C5]' : 'text-[#7A746B]'}`}>
                {shortName}
              </span>
              <span className="text-xs sm:text-sm font-mono-code font-bold mt-0.5">
                {dayNumber}
              </span>

              {/* Status dot */}
              <div className="mt-1 flex items-center gap-0.5">
                {status && status.completedTasks > 0 ? (
                  <span
                    className={`w-1 h-1 rounded-full ${
                      isSelected ? 'bg-[#34D399]' : 'bg-[#166534]'
                    }`}
                  />
                ) : (
                  <span className="w-1 h-1" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
