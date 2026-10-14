import React, { useState } from 'react';
import {
  Flame,
  Mic,
  Play,
  CheckCircle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Award,
  BookOpen,
  Volume2,
  RefreshCw,
  GitCompare,
} from 'lucide-react';

interface PracticeDrillsViewProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  currentWpm: number;
  clarityScore: number;
  fluencyScore: number;
  onLoadPromptDemo: (promptText: string) => void;
}

interface DrillScenario {
  id: string;
  title: string;
  scenarioType: 'Tech Interview' | 'Visa & Study Abroad' | 'Executive Briefing' | 'Incident Postmortem';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  targetWpm: string;
  maxPauses: number;
  promptText: string;
  commonPitfalls: string[];
  executiveModelAnswer: string;
  whyItWins: string;
}

const DRILL_SCENARIOS: DrillScenario[] = [
  {
    id: 'drill-1',
    title: 'High-Stakes Candidate Self-Introduction',
    scenarioType: 'Tech Interview',
    difficulty: 'Beginner',
    targetWpm: '125–140 WPM',
    maxPauses: 2,
    promptText:
      'Hello everyone, my name is Rahul. Today, I would like to provide an executive overview of my engineering background and our core architectural milestones.',
    commonPitfalls: [
      'Saying "Myself Rahul..." instead of "My name is Rahul"',
      'Rushing above 165 WPM without strategic breath pauses',
      'Overusing "basically" and "like" in opening sentences',
    ],
    executiveModelAnswer:
      'Hello everyone, my name is Rahul Sharma. I have spent the last five years architecting distributed backend pipelines and leading cloud infrastructure modernization.',
    whyItWins:
      'Eliminates colloquial greetings and immediately establishes technical authority with calm stress-timed cadence.',
  },
  {
    id: 'drill-2',
    title: 'Explaining System Latency & Architecture',
    scenarioType: 'Tech Interview',
    difficulty: 'Intermediate',
    targetWpm: '130–145 WPM',
    maxPauses: 3,
    promptText:
      'Our distributed messaging pipeline processes twenty thousand events per second with sub-twenty millisecond latency. We conducted extensive load benchmarks prior to production deployment.',
    commonPitfalls: [
      'Stuttering on repetitions ("we we will do one thing")',
      'Using Indianism "prepone" instead of "expedite / move up"',
      'Uncontrolled silence stalls exceeding 1.2s when retrieving technical terms',
    ],
    executiveModelAnswer:
      'Our distributed messaging pipeline sustains twenty thousand events per second at sub-twenty millisecond latency. Prior to production, we ran rigorous stress tests to validate resilience.',
    whyItWins:
      'Clear, active verbs replace meandering explanations, allowing international interviewers to follow system architecture effortlessly.',
  },
  {
    id: 'drill-3',
    title: 'Production Incident & Blocker Management',
    scenarioType: 'Incident Postmortem',
    difficulty: 'Advanced',
    targetWpm: '120–135 WPM',
    maxPauses: 2,
    promptText:
      'We encountered a database connection pool exhaustion during peak traffic. Rather than applying a temporary hotfix, we instituted exponential backoff retry policies and eliminated duplicate queries.',
    commonPitfalls: [
      'Grammar slip: "We did not got any alert" instead of "We did not get / encounter"',
      'Saying "revert back" instead of "reply" or "follow up"',
      'Monotone or frantic vocal inflection during pressure scenarios',
    ],
    executiveModelAnswer:
      'During peak throughput, connection pool saturation triggered service throttling. We resolved the bottleneck by introducing exponential backoff and optimizing query execution plans.',
    whyItWins:
      'Conveys deep engineering composure and root-cause ownership without defensive filler words.',
  },
  {
    id: 'drill-4',
    title: 'Study Abroad & Visa Statement of Purpose',
    scenarioType: 'Visa & Study Abroad',
    difficulty: 'Intermediate',
    targetWpm: '125–135 WPM',
    maxPauses: 2,
    promptText:
      'I am applying for the Master of Science in Computer Science to specialize in distributed systems and natural language processing. Upon graduating, I plan to return to lead infrastructure initiatives.',
    commonPitfalls: [
      'Speaking too fast (syllable-timed cadence) causing consular officer to ask you to repeat',
      'Dropping terminal consonants on words like "graduating" and "initiatives"',
      'Hesitation stalls over 1.5 seconds indicating rehearsed uncertainty',
    ],
    executiveModelAnswer:
      'I am pursuing graduate studies in Computer Science to advance my research in distributed consensus. Following graduation, I will leverage this expertise in leading enterprise cloud systems.',
    whyItWins:
      'Projects absolute clarity, decisive future goals, and flawless stress-timed rhythm for visa officers.',
  },
];

export const PracticeDrillsView: React.FC<PracticeDrillsViewProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  currentWpm,
  clarityScore,
  fluencyScore,
  onLoadPromptDemo,
}) => {
  const [selectedDrill, setSelectedDrill] = useState<DrillScenario>(DRILL_SCENARIOS[0]);
  const [showExecutiveModel, setShowExecutiveModel] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Flame className="w-4 h-4" />
            <span>Interactive Interview Drills</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Cross-Cultural High-Stakes Speech Studio
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Practice real international interview prompts. Master the 125&ndash;145 WPM stress-timed cadence, eliminate Indianisms, and build your clarity score from 0.
          </p>
        </div>

        {/* Live Metrics Meter */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-center font-mono">
            <div className="text-[10px] text-slate-400 uppercase">Current WPM</div>
            <div className="text-base font-bold text-cyan-300">{currentWpm}</div>
          </div>
          <div className="px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-center font-mono">
            <div className="text-[10px] text-slate-400 uppercase">Clarity</div>
            <div className="text-base font-bold text-emerald-400">{clarityScore}%</div>
          </div>
          <div className="px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-center font-mono">
            <div className="text-[10px] text-slate-400 uppercase">Fluency</div>
            <div className="text-base font-bold text-purple-400">{fluencyScore}%</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Drills Selector on Left, Practice Deck on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario List */}
        <div className="lg:col-span-1 space-y-2.5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Choose Drill Scenario ({DRILL_SCENARIOS.length})
          </div>

          <div className="space-y-2">
            {DRILL_SCENARIOS.map((drill) => {
              const isSelected = selectedDrill.id === drill.id;
              return (
                <button
                  key={drill.id}
                  onClick={() => {
                    setSelectedDrill(drill);
                    setShowExecutiveModel(false);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500/50 shadow-md shadow-cyan-950/20'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-mono text-cyan-400 font-semibold">{drill.scenarioType}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                      {drill.difficulty}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-white">{drill.title}</div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                    <span>Target: {drill.targetWpm}</span>
                    <span>&bull;</span>
                    <span>Pauses &le; {drill.maxPauses}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Drill Interactive Card */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                  {selectedDrill.scenarioType}
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">{selectedDrill.title}</h3>
              </div>

              {/* In-drill Recording Action */}
              <div className="flex items-center gap-2 shrink-0">
                {!isRecording ? (
                  <button
                    onClick={onStartRecording}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-md shadow-rose-900/30"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Record My Practice</span>
                  </button>
                ) : (
                  <button
                    onClick={onStopRecording}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-600/50 font-semibold text-xs rounded-lg transition-colors animate-pulse"
                  >
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm" />
                    <span>Stop &amp; Grade Audio</span>
                  </button>
                )}

                <button
                  onClick={() => onLoadPromptDemo(selectedDrill.promptText)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
                  title="Load sample audio matching this prompt"
                >
                  Load Sample
                </button>
              </div>
            </div>

            {/* Prompt Card */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Practice Utterance (Read aloud into your microphone):</span>
                <span className="text-slate-400 text-[11px]">Aim for steady 130 WPM</span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm sm:text-base font-medium text-slate-100 leading-relaxed font-sans select-all">
                &ldquo;{selectedDrill.promptText}&rdquo;
              </div>
            </div>

            {/* Common Pitfalls & Mistakes */}
            <div className="p-3.5 bg-rose-950/20 border border-rose-900/40 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-rose-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Critical Pitfalls to Avoid in International Interviews</span>
              </div>
              <ul className="space-y-1.5 text-slate-300">
                {selectedDrill.commonPitfalls.map((pit, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">&bull;</span>
                    <span>{pit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Executive Model Answer Toggle */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => setShowExecutiveModel(!showExecutiveModel)}
                className="flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>
                  {showExecutiveModel ? 'Hide Executive Reference Answer' : 'Reveal Executive Reference Answer'}
                </span>
              </button>

              {showExecutiveModel && (
                <div className="p-4 bg-indigo-950/30 border border-indigo-800/60 rounded-xl space-y-2 text-xs animate-in fade-in duration-150">
                  <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-indigo-400" />
                    <span>Executive Polish Reference</span>
                  </div>
                  <div className="text-sm font-medium text-slate-100 italic">
                    &ldquo;{selectedDrill.executiveModelAnswer}&rdquo;
                  </div>
                  <div className="text-slate-300 text-[11px] pt-1">
                    <strong>Why this works:</strong> {selectedDrill.whyItWins}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
