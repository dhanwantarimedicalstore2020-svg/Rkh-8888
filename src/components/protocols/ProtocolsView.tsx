import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Compass,
  FileSpreadsheet,
  Flame,
  Lightbulb,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { DailyRecord, NightStudyRecord, PracticalSessionRecord, SkillSessionRecord } from '../../types';
import { SUBJECT_ROTATION } from '../../constants/masterSchedule';

interface ProtocolsViewProps {
  currentRecord: DailyRecord;
  onUpdateRecord: (record: DailyRecord) => void;
}

export const ProtocolsView: React.FC<ProtocolsViewProps> = ({
  currentRecord,
  onUpdateRecord,
}) => {
  const [activeProtocolTab, setActiveProtocolTab] = useState<'night_study' | 'practical' | 'english' | 'business'>('night_study');

  // Night Study Timer State
  const nightStages = [
    { name: 'Stage 1: Deep Learning', durationMin: 80, timeRange: '8:00–9:20 PM', desc: 'Uninterrupted conceptual acquisition and lecture synthesis' },
    { name: 'Stage 2: Short Rest & Hydration', durationMin: 10, timeRange: '9:20–9:30 PM', desc: 'Step away from screens, hydrate, and reset posture' },
    { name: 'Stage 3: Deep Study + Notes Synthesis', durationMin: 60, timeRange: '9:30–10:30 PM', desc: 'Structural note-taking, reaction mechanisms & formulation maps' },
    { name: 'Stage 4: Active Recall & PYQs', durationMin: 30, timeRange: '10:30–11:00 PM', desc: 'Testing memory without notes, solving past exam questions' },
  ];

  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(nightStages[0].durationMin * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  // Subject for today
  const tonightSubject = SUBJECT_ROTATION[currentRecord.weekday]?.nightDeepWork || 'Primary Academic Block';

  // Night study notes form state
  const [topicStudied, setTopicStudied] = useState(currentRecord.nightStudyRecord?.deepLearningTopic || '');
  const [recallQuestions, setRecallQuestions] = useState(currentRecord.nightStudyRecord?.activeRecallQuestions || '');
  const [pyqsCompleted, setPyqsCompleted] = useState(currentRecord.nightStudyRecord?.pyqsAttempted || '');

  // Practical Knowledge State
  const [practicalSubject, setPracticalSubject] = useState(currentRecord.practicalSession?.subject || 'Pharmaceutical Practical');
  const [practicalPrinciple, setPracticalPrinciple] = useState(currentRecord.practicalSession?.principle || '');
  const [practicalWhy, setPracticalWhy] = useState(currentRecord.practicalSession?.whyEachStep || '');
  const [practicalCalc, setPracticalCalc] = useState(currentRecord.practicalSession?.calculation || '');
  const [practicalObs, setPracticalObs] = useState(currentRecord.practicalSession?.observation || '');
  const [practicalErr, setPracticalErr] = useState(currentRecord.practicalSession?.errors || '');
  const [practicalApp, setPracticalApp] = useState(currentRecord.practicalSession?.application || '');

  // Business 1-1-1 State
  const [bizIdea, setBizIdea] = useState(currentRecord.skillRecord?.businessIdeaLearned || '');
  const [bizQuestion, setBizQuestion] = useState(currentRecord.skillRecord?.businessQuestioned || '');
  const [bizApp, setBizApp] = useState(currentRecord.skillRecord?.businessApplicable || '');

  // English state
  const [vocabNotes, setVocabNotes] = useState(currentRecord.skillRecord?.englishVocabNotes || '');
  const [speechNotes, setSpeechNotes] = useState(currentRecord.skillRecord?.englishSpeakingNotes || '');

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && timerRunning) {
      setTimerRunning(false);
      // Play web audio chime if available
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);
      } catch (e) {
        // audio context fallback
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, secondsRemaining]);

  const handleSelectStage = (idx: number) => {
    setCurrentStageIdx(idx);
    setSecondsRemaining(nightStages[idx].durationMin * 60);
    setTimerRunning(false);
  };

  const handleSaveNightStudy = () => {
    const updatedRecord: NightStudyRecord = {
      subject: tonightSubject,
      deepLearningTopic: topicStudied,
      notesSummary: '',
      activeRecallQuestions: recallQuestions,
      pyqsAttempted: pyqsCompleted,
      completedStages: [currentStageIdx],
    };

    onUpdateRecord({
      ...currentRecord,
      nightStudyRecord: updatedRecord,
    });
    alert('Night study progress and recall questions saved!');
  };

  const handleSavePractical = () => {
    const pRecord: PracticalSessionRecord = {
      subject: practicalSubject,
      principle: practicalPrinciple,
      whyEachStep: practicalWhy,
      calculation: practicalCalc,
      observation: practicalObs,
      errors: practicalErr,
      application: practicalApp,
    };
    onUpdateRecord({
      ...currentRecord,
      practicalSession: pRecord,
    });
    alert('Practical knowledge session logged!');
  };

  const handleSaveBusiness = () => {
    const bRecord: SkillSessionRecord = {
      ...currentRecord.skillRecord,
      type: 'business',
      businessIdeaLearned: bizIdea,
      businessQuestioned: bizQuestion,
      businessApplicable: bizApp,
    };
    onUpdateRecord({
      ...currentRecord,
      skillRecord: bRecord,
    });
    alert('Business 1-1-1 takeaway saved!');
  };

  const handleSaveEnglish = () => {
    const eRecord: SkillSessionRecord = {
      ...currentRecord.skillRecord,
      type: 'english',
      englishVocabNotes: vocabNotes,
      englishSpeakingNotes: speechNotes,
    };
    onUpdateRecord({
      ...currentRecord,
      skillRecord: eRecord,
    });
    alert('English session logged!');
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-200">
      
      {/* Tab Selector */}
      <div className="flex items-center gap-2 p-1.5 bg-[#F2ECE1] rounded-2xl border border-[#E2D8C3] overflow-x-auto">
        <button
          onClick={() => setActiveProtocolTab('night_study')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 flex items-center gap-2 ${
            activeProtocolTab === 'night_study'
              ? 'bg-[#1E2022] text-[#FBF9F5] shadow-xs'
              : 'text-[#635E55] hover:text-[#1E2022]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Night Study Protocol (8–11 PM)</span>
        </button>

        <button
          onClick={() => setActiveProtocolTab('practical')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 flex items-center gap-2 ${
            activeProtocolTab === 'practical'
              ? 'bg-[#1E2022] text-[#FBF9F5] shadow-xs'
              : 'text-[#635E55] hover:text-[#1E2022]'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Practical Knowledge (6-Step)</span>
        </button>

        <button
          onClick={() => setActiveProtocolTab('english')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 flex items-center gap-2 ${
            activeProtocolTab === 'english'
              ? 'bg-[#1E2022] text-[#FBF9F5] shadow-xs'
              : 'text-[#635E55] hover:text-[#1E2022]'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>English Fluency Trainer</span>
        </button>

        <button
          onClick={() => setActiveProtocolTab('business')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 flex items-center gap-2 ${
            activeProtocolTab === 'business'
              ? 'bg-[#1E2022] text-[#FBF9F5] shadow-xs'
              : 'text-[#635E55] hover:text-[#1E2022]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Business 1-1-1 Rule</span>
        </button>
      </div>

      {/* 1. Night Study Protocol Suite */}
      {activeProtocolTab === 'night_study' && (
        <div className="space-y-6">
          <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-4 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EFE9DC]">
              <div>
                <span className="text-[11px] font-mono-code text-[#1E3A8A] font-bold uppercase tracking-wider">
                  8:00–11:00 PM Primary Academic Deep Block
                </span>
                <h2 className="font-slab font-bold text-xl text-[#1E2022] mt-0.5">
                  {tonightSubject}
                </h2>
                <p className="text-xs text-[#7A746B]">
                  Study → Understand → Notes → Active Recall / PYQs (Not passive watching)
                </p>
              </div>
            </div>

            {/* Stages Navigator */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 my-5">
              {nightStages.map((stg, i) => (
                <button
                  key={stg.name}
                  onClick={() => handleSelectStage(i)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    currentStageIdx === i
                      ? 'border-[#1E3A8A] bg-[#EBF1F8] ring-1 ring-[#1E3A8A]'
                      : 'border-[#EAE4D6] bg-[#FAFAF8] hover:bg-[#F2ECE1]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono-code font-bold mb-1">
                    <span className={currentStageIdx === i ? 'text-[#1E3A8A]' : 'text-[#635E55]'}>
                      {stg.timeRange}
                    </span>
                    <span className="text-[10px] text-[#7A746B]">{stg.durationMin}m</span>
                  </div>
                  <div className="text-xs font-semibold text-[#1E2022]">{stg.name}</div>
                </button>
              ))}
            </div>

            {/* Live Interactive Timer Display */}
            <div className="p-6 rounded-2xl bg-[#FBF9F5] border border-[#E2D8C3] text-center my-4 flex flex-col items-center justify-center">
              <div className="text-xs font-mono-code uppercase tracking-wider text-[#7A746B] mb-1">
                {nightStages[currentStageIdx].name} ({nightStages[currentStageIdx].timeRange})
              </div>
              <div className="font-mono-code font-bold text-4xl sm:text-6xl text-[#1E2022] my-2">
                {formatTimer(secondsRemaining)}
              </div>
              <p className="text-xs text-[#635E55] max-w-md mx-auto mb-4">
                {nightStages[currentStageIdx].desc}
              </p>

              {/* Timer Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setTimerRunning(!timerRunning)}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm font-mono-code flex items-center gap-2 shadow-xs transition-colors ${
                    timerRunning
                      ? 'bg-[#B45309] hover:bg-[#92400E] text-[#FFFFFF]'
                      : 'bg-[#1E2022] hover:bg-[#33373B] text-[#FBF9F5]'
                  }`}
                >
                  {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{timerRunning ? 'Pause Interval' : 'Start Interval'}</span>
                </button>
                <button
                  onClick={() => {
                    setTimerRunning(false);
                    setSecondsRemaining(nightStages[currentStageIdx].durationMin * 60);
                  }}
                  className="p-2.5 rounded-xl border border-[#DDD5C5] bg-[#FFFFFF] hover:bg-[#EAE4D6] text-[#635E55] transition-colors"
                  title="Reset Interval"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Active Recall & PYQ Capture Form */}
            <div className="mt-6 pt-5 border-t border-[#EFE9DC] space-y-4">
              <h3 className="font-slab font-bold text-sm text-[#1E2022]">
                Active Recall &amp; PYQ Notes Logging
              </h3>

              <div className="space-y-3 text-xs sm:text-sm">
                <div>
                  <label className="block font-semibold text-[#1E2022] mb-1">
                    Primary Topic / Chapter Covered Tonight:
                  </label>
                  <input
                    type="text"
                    value={topicStudied}
                    onChange={(e) => setTopicStudied(e.target.value)}
                    placeholder="e.g. Rheology & Non-Newtonian Flow behavior in Suspensions"
                    className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-[#1E2022]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1E2022] mb-1">
                    Active Recall Questions (Questions to test tomorrow morning):
                  </label>
                  <textarea
                    rows={2}
                    value={recallQuestions}
                    onChange={(e) => setRecallQuestions(e.target.value)}
                    placeholder="1. What is the difference between thixotropy and rheopexy? 2. Write the equation for plastic viscosity."
                    className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-[#1E2022]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1E2022] mb-1">
                    PYQs (Previous Year Questions) Solved:
                  </label>
                  <textarea
                    rows={2}
                    value={pyqsCompleted}
                    onChange={(e) => setPyqsCompleted(e.target.value)}
                    placeholder="e.g. 2022 Question 3 (10 marks) on Ostwald viscometer derivations."
                    className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-[#1E2022]"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveNightStudy}
                    className="px-4 py-2 rounded-lg bg-[#1E3A8A] hover:bg-[#172554] text-[#FBF9F5] font-semibold text-xs transition-colors shadow-xs"
                  >
                    Save Study Log
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. Practical Knowledge 6-Step Protocol */}
      {activeProtocolTab === 'practical' && (
        <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="pb-4 border-b border-[#EFE9DC]">
            <span className="text-[11px] font-mono-code text-[#0F766E] font-bold uppercase tracking-wider">
              Weekly Practical Knowledge Protocol (20–30 min)
            </span>
            <h2 className="font-slab font-bold text-xl text-[#1E2022] mt-0.5">
              6-Step Laboratory &amp; Experimental Mastery
            </h2>
            <p className="text-xs text-[#7A746B]">
              Principle → Why each step? → Calculation → Observation → Errors → Application
            </p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-[#1E2022] mb-1">
                Practical / Experiment Subject &amp; Title:
              </label>
              <input
                type="text"
                value={practicalSubject}
                onChange={(e) => setPracticalSubject(e.target.value)}
                placeholder="e.g. Determination of Partition Coefficient of Benzoic Acid"
                className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-[#1E2022]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#1E2022] mb-1">
                  1. Fundamental Principle
                </label>
                <textarea
                  rows={3}
                  value={practicalPrinciple}
                  onChange={(e) => setPracticalPrinciple(e.target.value)}
                  placeholder="What thermodynamic or physical principle governs this experiment?"
                  className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-[#1E2022]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1E2022] mb-1">
                  2. Why Each Step? (Rationale of Reagents/Apparatus)
                </label>
                <textarea
                  rows={3}
                  value={practicalWhy}
                  onChange={(e) => setPracticalWhy(e.target.value)}
                  placeholder="Why add shaking? Why separate organic vs aqueous phase? Why indicator?"
                  className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-[#1E2022]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1E2022] mb-1">
                  3. Key Calculations &amp; Formulas
                </label>
                <textarea
                  rows={3}
                  value={practicalCalc}
                  onChange={(e) => setPracticalCalc(e.target.value)}
                  placeholder="Formula: K = C1 / C2. Units, factor multipliers and normality checks."
                  className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-[#1E2022]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1E2022] mb-1">
                  4. Exact Observations Recorded
                </label>
                <textarea
                  rows={3}
                  value={practicalObs}
                  onChange={(e) => setPracticalObs(e.target.value)}
                  placeholder="Color changes, meniscus readings, precipitations and temperatures."
                  className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-[#1E2022]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1E2022] mb-1">
                  5. Error Analysis &amp; Experimental Limitations
                </label>
                <textarea
                  rows={3}
                  value={practicalErr}
                  onChange={(e) => setPracticalErr(e.target.value)}
                  placeholder="Where can laboratory error occur? (Emulsification, parallax, temperature shift)"
                  className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-[#1E2022]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1E2022] mb-1">
                  6. Real-World Commercial / Clinical Application
                </label>
                <textarea
                  rows={3}
                  value={practicalApp}
                  onChange={(e) => setPracticalApp(e.target.value)}
                  placeholder="How does this relate to drug absorption across gut membrane and bioavailability?"
                  className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-[#1E2022]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={handleSavePractical}
                className="px-5 py-2 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-[#FBF9F5] font-semibold text-xs transition-colors shadow-xs"
              >
                Save Practical Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. English Skill Trainer */}
      {activeProtocolTab === 'english' && (
        <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="pb-4 border-b border-[#EFE9DC]">
            <span className="text-[11px] font-mono-code text-[#B45309] font-bold uppercase tracking-wider">
              Monday / Wednesday / Friday Skill Block (6:00–7:00 PM)
            </span>
            <h2 className="font-slab font-bold text-xl text-[#1E2022] mt-0.5">
              English Fluency &amp; Articulation Engine
            </h2>
            <p className="text-xs text-[#7A746B]">
              15m Vocab/Grammar → 20m Speaking aloud → 15m AI Dialogue → 10m Sentence repetition
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono-code">
            <div className="p-2.5 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E]">
              <div className="font-bold">15m Vocab</div>
              <div className="text-[10px] text-[#78350F]">Contextual words</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E]">
              <div className="font-bold">20m Speaking</div>
              <div className="text-[10px] text-[#78350F]">Verbal flow aloud</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E]">
              <div className="font-bold">15m AI Chat</div>
              <div className="text-[10px] text-[#78350F]">Interactive corrections</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E]">
              <div className="font-bold">10m Repetition</div>
              <div className="text-[10px] text-[#78350F]">Drill corrected phrases</div>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-[#1E2022] mb-1">
                New Vocabulary &amp; Phrasal Constructs:
              </label>
              <textarea
                rows={3}
                value={vocabNotes}
                onChange={(e) => setVocabNotes(e.target.value)}
                placeholder="e.g. 'Nuance', 'Concomitant', 'Catalyze', 'Preponderance of evidence' with sample sentence usage."
                className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-[#1E2022]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1E2022] mb-1">
                Speaking Topic &amp; Corrected Sentences:
              </label>
              <textarea
                rows={3}
                value={speechNotes}
                onChange={(e) => setSpeechNotes(e.target.value)}
                placeholder="Topic spoken: Explaining why drug solubility determines formulation choice. Corrected: 'It depends on' instead of 'It depends of'."
                className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-[#1E2022]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveEnglish}
                className="px-5 py-2 rounded-xl bg-[#B45309] hover:bg-[#92400E] text-[#FBF9F5] font-semibold text-xs transition-colors shadow-xs"
              >
                Save English Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Business Intelligence (1-1-1 Rule) */}
      {activeProtocolTab === 'business' && (
        <div className="bg-[#FFFFFF] border border-[#E2D8C3] rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="pb-4 border-b border-[#EFE9DC]">
            <span className="text-[11px] font-mono-code text-[#6D28D9] font-bold uppercase tracking-wider">
              Tuesday / Thursday / Saturday Skill Block (6:00–7:00 PM)
            </span>
            <h2 className="font-slab font-bold text-xl text-[#1E2022] mt-0.5">
              Business Intelligence — The 1–1–1 Framework
            </h2>
            <p className="text-xs text-[#7A746B]">
              1 Idea Learned → 1 Thing Questioned → 1 Thing Applicable
            </p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-[#1E2022] mb-1">
                1. One Core Idea / Business Model Learned:
              </label>
              <textarea
                rows={2}
                value={bizIdea}
                onChange={(e) => setBizIdea(e.target.value)}
                placeholder="e.g. Contract Development & Manufacturing Organization (CDMO) economics and gross margin structure."
                className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-[#1E2022]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1E2022] mb-1">
                2. One Thing Questioned / Friction Challenged:
              </label>
              <textarea
                rows={2}
                value={bizQuestion}
                onChange={(e) => setBizQuestion(e.target.value)}
                placeholder="e.g. Why do pharmaceutical distributors still rely on phone ordering rather than automated ERP ordering?"
                className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-[#1E2022]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1E2022] mb-1">
                3. One Concrete Application to Our Future Venture:
              </label>
              <textarea
                rows={2}
                value={bizApp}
                onChange={(e) => setBizApp(e.target.value)}
                placeholder="e.g. Build an API webhook that integrates local retail chemist billing into wholesaler stock visibility."
                className="w-full p-2.5 rounded-lg border border-[#DDD5C5] bg-[#FFFFFF] text-[#1E2022]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveBusiness}
                className="px-5 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-[#FBF9F5] font-semibold text-xs transition-colors shadow-xs"
              >
                Save 1-1-1 Strategy Log
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
