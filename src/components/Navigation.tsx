import React from 'react';
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  Flame,
  LayoutDashboard,
  Lightbulb,
  LineChart,
  Settings,
  Sparkles,
} from 'lucide-react';

export type ActiveTab = 'today' | 'timeline' | 'analytics' | 'history' | 'protocols' | 'ideas' | 'reviews' | 'settings';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'today' as ActiveTab,
      label: 'Today',
      icon: CheckCircle2,
      tag: 'Execution',
    },
    {
      id: 'timeline' as ActiveTab,
      label: 'Timeline',
      icon: CalendarDays,
      tag: 'Calendar',
    },
    {
      id: 'analytics' as ActiveTab,
      label: 'Analytics',
      icon: LineChart,
      tag: 'Stats',
    },
    {
      id: 'history' as ActiveTab,
      label: 'History',
      icon: Calendar,
      tag: 'Past Days',
    },
    {
      id: 'protocols' as ActiveTab,
      label: 'Protocols',
      icon: Clock,
      tag: 'Night & Skills',
    },
    {
      id: 'ideas' as ActiveTab,
      label: 'Ideas',
      icon: Lightbulb,
      tag: 'Ventures',
    },
    {
      id: 'reviews' as ActiveTab,
      label: 'Reviews',
      icon: Sparkles,
      tag: 'Audits',
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Settings',
      icon: Settings,
      tag: 'OS',
    },
  ];

  return (
    <nav
      id="main-bottom-navigation"
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#FBF9F5]/98 backdrop-blur-lg border-t border-[#E8E2D6] py-1 px-1 sm:px-4 shadow-lg"
    >
      <div
        role="tablist"
        aria-orientation="horizontal"
        className="max-w-6xl mx-auto flex items-center justify-around overflow-x-auto no-scrollbar gap-1"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-label={`${tab.label} View`}
              onClick={() => onTabChange(tab.id)}
              className={`min-h-[48px] flex flex-col items-center justify-center py-1 px-2.5 sm:px-3.5 rounded-xl transition-all duration-150 shrink-0 focus:outline-hidden focus:ring-2 focus:ring-[#1E2022] ${
                isActive
                  ? 'bg-[#1E2022] text-[#FBF9F5] shadow-xs'
                  : 'text-[#635E55] hover:text-[#1E2022] hover:bg-[#F2ECE1]'
              }`}
            >
              <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isActive ? 'text-[#FBF9F5]' : 'text-[#7A746B]'}`} />
              <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 tracking-tight whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
