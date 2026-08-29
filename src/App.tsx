import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ActiveTab, Navigation } from './components/Navigation';
import { TodayView } from './components/today/TodayView';
import { TimelineView } from './components/timeline/TimelineView';
import { ProtocolsView } from './components/protocols/ProtocolsView';
import { IdeasView } from './components/ideas/IdeasView';
import { ReviewsView } from './components/reviews/ReviewsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { HistoryView } from './components/history/HistoryView';
import { SettingsView } from './components/settings/SettingsView';
import { IdeaCaptureModal } from './components/modals/IdeaCaptureModal';
import { FlexibleWindowModal } from './components/modals/FlexibleWindowModal';
import { DailyRecord, FlexibleWindowLog, IdeaItem, OperatingMode } from './types';
import { getTodayDateString, offsetDays } from './utils/dateUtils';
import {
  getOrCreateDailyRecord,
  loadAllRecords,
  saveDailyRecord,
  upsertIdea,
} from './services/storageService';
import {
  applyExamModeToRecord,
  applyMinimumDayToRecord,
  restoreNormalModeRecord,
} from './services/operatingModeService';
import { initializeNativeStatusBar } from './services/nativeStatusBarService';
import { initializeNativeBackButton, setRootBackHandler } from './services/nativeBackService';
import { useRegisterBackDismiss } from './hooks/useRegisterBackDismiss';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [currentDateStr, setCurrentDateStr] = useState<string>(getTodayDateString());
  const [currentRecord, setCurrentRecord] = useState<DailyRecord>(() =>
    getOrCreateDailyRecord(getTodayDateString())
  );
  const [allRecords, setAllRecords] = useState<Record<string, DailyRecord>>(() => loadAllRecords());

  // Modal visibility states
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [isFlexibleModalOpen, setIsFlexibleModalOpen] = useState(false);

  // Android hardware back button registration for root modals
  useRegisterBackDismiss(isIdeaModalOpen, () => setIsIdeaModalOpen(false));
  useRegisterBackDismiss(isFlexibleModalOpen, () => setIsFlexibleModalOpen(false));

  // Initialize Native Android Status Bar & Back Button
  useEffect(() => {
    initializeNativeStatusBar();
    initializeNativeBackButton();
  }, []);

  // Configure Root Back Handler: if user is on a sub-tab, hardware back returns to 'today'
  useEffect(() => {
    setRootBackHandler(() => {
      if (activeTab !== 'today') {
        setActiveTab('today');
        return true;
      }
      return false;
    });
  }, [activeTab]);

  // Midnight Auto-Refresh Listener: Handles day boundary transitions seamlessly
  React.useEffect(() => {
    let lastKnownToday = getTodayDateString();

    const interval = setInterval(() => {
      const actualToday = getTodayDateString();
      if (actualToday !== lastKnownToday) {
        lastKnownToday = actualToday;
        // If the user was viewing "Today", advance them to the new today
        setCurrentDateStr((prev) => {
          if (prev === offsetDays(actualToday, -1)) {
            const newRec = getOrCreateDailyRecord(actualToday);
            setCurrentRecord(newRec);
            return actualToday;
          }
          return prev;
        });
        setAllRecords(loadAllRecords());
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, []);

  // When date changes, load or materialize the record for that specific date
  const handleDateChange = (newDateStr: string) => {
    setCurrentDateStr(newDateStr);
    const rec = getOrCreateDailyRecord(newDateStr);
    setCurrentRecord(rec);
    setAllRecords(loadAllRecords());
  };

  const handleUpdateRecord = (updated: DailyRecord) => {
    setCurrentRecord(updated);
    saveDailyRecord(updated);
    setAllRecords(loadAllRecords());
  };

  // Safe, non-destructive Operating Mode transformation
  const handleModeChange = (newMode: OperatingMode) => {
    let updated: DailyRecord;
    if (newMode === 'minimum_day') {
      updated = applyMinimumDayToRecord(currentRecord);
    } else if (newMode === 'exam_mode') {
      updated = applyExamModeToRecord(currentRecord);
    } else {
      updated = restoreNormalModeRecord(currentRecord);
    }
    handleUpdateRecord(updated);
  };

  const handleSaveIdea = (idea: IdeaItem) => {
    upsertIdea(idea);
    // Also mark the idea capture in daily scorecard
    const updatedScorecard = { ...currentRecord.scorecard, ideaCapture: 'completed' as const };
    handleUpdateRecord({ ...currentRecord, scorecard: updatedScorecard });
  };

  const handleSaveFlexibleLog = (log: FlexibleWindowLog) => {
    const updated = {
      ...currentRecord,
      flexibleLog: log,
    };
    handleUpdateRecord(updated);
  };

  const handleDataReset = () => {
    setAllRecords(loadAllRecords());
    setCurrentRecord(getOrCreateDailyRecord(currentDateStr));
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1E2022] font-sans selection:bg-[#F2ECE1] selection:text-[#1E2022] flex flex-col justify-between">
      
      {/* Top Application Header */}
      <Header
        currentRecord={currentRecord}
        onDateChange={handleDateChange}
        onModeChange={handleModeChange}
        onOpenQuickIdea={() => setIsIdeaModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5 pb-24">
        {activeTab === 'today' && (
          <TodayView
            record={currentRecord}
            onUpdateRecord={handleUpdateRecord}
            onSelectDate={handleDateChange}
            onNavigateTab={setActiveTab}
            onOpenQuickIdea={() => setIsIdeaModalOpen(true)}
            onOpenFlexibleModal={() => setIsFlexibleModalOpen(true)}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineView
            selectedDateStr={currentDateStr}
            onSelectDate={handleDateChange}
            allRecords={allRecords}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            allRecords={allRecords}
            currentDateStr={currentDateStr}
            onSelectDate={handleDateChange}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            allRecords={allRecords}
            currentDateStr={currentDateStr}
            onSelectDate={handleDateChange}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'protocols' && (
          <ProtocolsView
            currentRecord={currentRecord}
            onUpdateRecord={handleUpdateRecord}
          />
        )}

        {activeTab === 'ideas' && (
          <IdeasView
            onOpenQuickIdea={() => setIsIdeaModalOpen(true)}
            currentDateStr={currentDateStr}
          />
        )}

        {activeTab === 'reviews' && (
          <ReviewsView currentDateStr={currentDateStr} />
        )}

        {activeTab === 'settings' && (
          <SettingsView onDataReset={handleDataReset} />
        )}
      </main>

      {/* Persistent Bottom Tab Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 5-Min Idea Capture Modal */}
      <IdeaCaptureModal
        isOpen={isIdeaModalOpen}
        onClose={() => setIsIdeaModalOpen(false)}
        onSaveIdea={handleSaveIdea}
        currentDateStr={currentDateStr}
      />

      {/* 8:30–10:00 Flexible Window Modal */}
      <FlexibleWindowModal
        isOpen={isFlexibleModalOpen}
        onClose={() => setIsFlexibleModalOpen(false)}
        onSaveLog={handleSaveFlexibleLog}
        existingLog={currentRecord.flexibleLog}
      />

    </div>
  );
}
