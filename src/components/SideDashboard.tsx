import React from 'react';
import {
  Activity,
  Mic,
  Square,
  Upload,
  PlayCircle,
  FileText,
  ShieldCheck,
  BookOpen,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Database,
  GitCompare,
  Flame,
  Volume2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  Terminal,
  Github,
  Sparkles,
  Layers,
  Radio,
  FileDown,
} from 'lucide-react';

import { InterviewScenario, SupportedLanguage } from '../types/audio';
import { RealtimeAudioStats } from '../utils/audioAnalyzer';

export type DashboardViewType =
  | 'dashboard'
  | 'comparison'
  | 'timeline'
  | 'issues'
  | 'dataset'
  | 'drills'
  | 'guidelines';

interface SideDashboardProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeView: DashboardViewType;
  onSelectView: (view: DashboardViewType) => void;
  isRecording: boolean;
  recordingDuration: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  wpm: number;
  clarityScore: number;
  fluencyScore: number;
  paceCategory: string;
  audioStats: RealtimeAudioStats | null;
  interviewScenario: InterviewScenario;
  onSelectScenario: (scenario: InterviewScenario) => void;
  selectedLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  onLoadDemo: () => void;
  onOpenFileUpload: () => void;
  onOpenVSCodeModal: () => void;
  onOpenGitHubModal: () => void;
  onOpenValidatorModal: () => void;
  onOpenGuidelinesModal: () => void;
  counts: {
    wrongWords: number;
    fillerWords: number;
    comparisons: number;
    datasetSamples?: number;
    awkwardPauses: number;
  };
}

export const SideDashboard: React.FC<SideDashboardProps> = ({
  isCollapsed,
  onToggleCollapse,
  activeView,
  onSelectView,
  isRecording,
  recordingDuration,
  onStartRecording,
  onStopRecording,
  wpm,
  clarityScore,
  fluencyScore,
  paceCategory,
  audioStats,
  interviewScenario,
  onSelectScenario,
  selectedLanguage,
  onSelectLanguage,
  onLoadDemo,
  onOpenFileUpload,
  onOpenVSCodeModal,
  onOpenGitHubModal,
  onOpenValidatorModal,
  onOpenGuidelinesModal,
  counts,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentVolume = audioStats ? Math.min(100, Math.round(audioStats.rms * 700)) : 0;

  return (
    <aside
      className={`relative z-30 flex flex-col bg-slate-950 border-r border-slate-800 transition-all duration-300 ease-in-out shrink-0 select-none ${
        isCollapsed ? 'w-18' : 'w-72 lg:w-80'
      }`}
      aria-label="Side Dashboard Navigation"
    >
      {/* 1. Header & Collapse Control */}
      <div className="flex items-center justify-between px-3.5 py-4 border-b border-slate-800/80">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold tracking-tight text-white truncate flex items-center gap-1.5">
                AudioPulse
                <span className="text-[9px] uppercase tracking-wider font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-1 py-0.2 rounded">
                  v2.4
                </span>
              </span>
              <span className="text-[11px] text-slate-400 truncate">
                Global Speech &amp; Dataset Studio
              </span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="mx-auto">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors"
          title={isCollapsed ? 'Expand side dashboard' : 'Collapse side dashboard'}
          aria-label={isCollapsed ? 'Expand side dashboard' : 'Collapse side dashboard'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* 2. Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Live Audio Telemetry Cockpit (Sidebar Interactive Widget) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Radio className={`w-3.5 h-3.5 ${isRecording ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
              {!isCollapsed && 'Live Cockpit'}
            </span>
            <span className="text-[11px] font-mono text-cyan-400">
              {isRecording ? formatTime(recordingDuration) : '00:00'}
            </span>
          </div>

          {/* Primary Record Button in Sidebar */}
          {!isRecording ? (
            <button
              onClick={onStartRecording}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-semibold text-xs text-white bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-md shadow-rose-900/30 transition-all active:scale-[0.98] ${
                isCollapsed ? 'p-2' : ''
              }`}
              title="Start Live Speech Recording"
            >
              <Mic className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Start Recording</span>}
            </button>
          ) : (
            <button
              onClick={onStopRecording}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-semibold text-xs text-white bg-slate-800 hover:bg-slate-700 border border-rose-600/60 shadow-md transition-all active:scale-[0.98] animate-pulse ${
                isCollapsed ? 'p-2' : ''
              }`}
              title="Stop Recording"
            >
              <Square className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0" />
              {!isCollapsed && <span>Stop Live Recording</span>}
            </button>
          )}

          {/* Real-time Level Meter & Speech Activity */}
          {!isCollapsed && (
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-slate-400" /> Mic Input
                </span>
                <span className="font-mono text-slate-300">{currentVolume}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-75 rounded-full ${
                    currentVolume > 80
                      ? 'bg-rose-500'
                      : currentVolume > 40
                      ? 'bg-cyan-400'
                      : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.max(4, currentVolume)}%` }}
                />
              </div>

              {/* Live Metric Badges in Sidebar */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 text-center font-mono">
                <div className="p-1.5 bg-slate-950/70 border border-slate-800/80 rounded">
                  <div className="text-[10px] text-slate-400 uppercase">WPM</div>
                  <div className={`text-xs font-bold ${wpm > 165 ? 'text-amber-400' : 'text-cyan-300'}`}>
                    {wpm}
                  </div>
                </div>
                <div className="p-1.5 bg-slate-950/70 border border-slate-800/80 rounded">
                  <div className="text-[10px] text-slate-400 uppercase">Clarity</div>
                  <div className="text-xs font-bold text-emerald-400">{clarityScore}%</div>
                </div>
                <div className="p-1.5 bg-slate-950/70 border border-slate-800/80 rounded">
                  <div className="text-[10px] text-slate-400 uppercase">Fluency</div>
                  <div className="text-xs font-bold text-purple-400">{fluencyScore}%</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Navigation Views Section */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-1 pb-1 text-[10px] font-semibold tracking-wider uppercase text-slate-400">
              Core Modules
            </div>
          )}

          <nav className="space-y-1">
            <button
              onClick={() => onSelectView('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeView === 'dashboard'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
              title="Speech Telemetry & Live Telemetry Cockpit"
            >
              <Activity className="w-4 h-4 shrink-0 text-cyan-400" />
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between text-left">
                  <span>Speech Telemetry</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                    Live
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => onSelectView('comparison')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeView === 'comparison'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
              title="Right Sentence Diff & Polish Studio"
            >
              <GitCompare className="w-4 h-4 shrink-0 text-indigo-400" />
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between text-left">
                  <span>Right Sentence Diff</span>
                  {counts.comparisons > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/60 text-indigo-300">
                      {counts.comparisons}
                    </span>
                  )}
                </div>
              )}
            </button>

            <button
              onClick={() => onSelectView('timeline')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeView === 'timeline'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
              title="Waveform & Pause Dynamics Analysis"
            >
              <Volume2 className="w-4 h-4 shrink-0 text-emerald-400" />
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between text-left">
                  <span>Waveform &amp; Pauses</span>
                  {counts.awkwardPauses > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/50 border border-rose-800/60 text-rose-300">
                      {counts.awkwardPauses} stalls
                    </span>
                  )}
                </div>
              )}
            </button>

            <button
              onClick={() => onSelectView('issues')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeView === 'issues'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
              title="Wrong Words, Stutters & 13-Category Taxonomy"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between text-left">
                  <span>Wrong Words &amp; Coaching</span>
                  {(counts.wrongWords > 0 || counts.fillerWords > 0) && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300">
                      {counts.wrongWords + counts.fillerWords}
                    </span>
                  )}
                </div>
              )}
            </button>

            <button
              onClick={() => onSelectView('dataset')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeView === 'dataset'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
              title="Custom Speech Dataset Research Platform"
            >
              <Database className="w-4 h-4 shrink-0 text-cyan-400" />
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between text-left">
                  <span>Custom Speech Dataset</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300">
                    CSV / Audio
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => onSelectView('drills')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeView === 'drills'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
              title="Interactive Practice Speech Drills"
            >
              <Flame className="w-4 h-4 shrink-0 text-rose-400" />
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between text-left">
                  <span>Interview Practice Drills</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-800/60 text-rose-300">
                    Drills
                  </span>
                </div>
              )}
            </button>
          </nav>
        </div>

        {/* 4. Scenario & Configuration Settings in Side Dashboard */}
        {!isCollapsed && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 space-y-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-slate-400" /> Target Profile
            </span>

            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Scenario Target</label>
                <select
                  value={interviewScenario}
                  onChange={(e) => onSelectScenario(e.target.value as InterviewScenario)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-sans"
                >
                  <option value="tech-interview">Global Tech Interview (US/UK)</option>
                  <option value="study-visa">Study Abroad &amp; Visa Interview</option>
                  <option value="executive-pitch">Executive Keynote &amp; Pitch</option>
                  <option value="general-fluent">General Fluent Speaking</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Recognition Language</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => onSelectLanguage(e.target.value as SupportedLanguage)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-sans"
                >
                  <option value="en-US">English (Global / US)</option>
                  <option value="mr-IN">Marathi (मराठी)</option>
                  <option value="hi-IN">Hindi (हिन्दी)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 5. Dataset Tools & Compliance Shortcuts */}
        {!isCollapsed && (
          <div className="space-y-2">
            <div className="px-1 text-[10px] font-semibold tracking-wider uppercase text-slate-400">
              Dataset &amp; Engineering Tools
            </div>

            <div className="space-y-1.5">
              {/* One-Click Dataset Validator Modal */}
              <button
                onClick={onOpenValidatorModal}
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs rounded-lg transition-colors group"
                title="Run automated schema and integrity validator"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>Dataset Integrity Validator</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                  Run
                </span>
              </button>

              {/* Annotation Guidelines */}
              <button
                onClick={onOpenGuidelinesModal}
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs rounded-lg transition-colors group"
                title="View full research annotation criteria and zero-bias policy"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span>Annotation Guidelines</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/60">
                  Docs
                </span>
              </button>

              {/* Download Technical Documentation PDF */}
              <a
                href="/api/download/documentation-pdf"
                download="SpeakTwin_Technical_Documentation.pdf"
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs rounded-lg transition-colors group"
                title="Download 6-page Technical Architecture & Research Report PDF"
              >
                <div className="flex items-center gap-2">
                  <FileDown className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span>Technical Doc PDF</span>
                </div>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/60">
                  6-pg
                </span>
              </a>

              {/* Load Demo Benchmark */}
              <button
                onClick={onLoadDemo}
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span>Load Benchmark Demo</span>
                </div>
                <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/60">
                  PAIR_001
                </span>
              </button>

              {/* Open Audio File */}
              <button
                onClick={onOpenFileUpload}
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span>Upload Audio File</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/60">
                  Any Ext
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Footer Integration Buttons */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 space-y-2">
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenGitHubModal}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-md transition-colors"
              title="Push code to GitHub & add collaborators"
            >
              <Github className="w-3.5 h-3.5 text-purple-400" />
              <span>GitHub Team</span>
            </button>

            <button
              onClick={onOpenVSCodeModal}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-md transition-colors"
              title="Run locally in VS Code"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>VS Code</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onOpenGitHubModal}
              className="p-2 text-slate-300 hover:text-white bg-slate-900 rounded-md border border-slate-800"
              title="GitHub Team"
            >
              <Github className="w-4 h-4 text-purple-400" />
            </button>
            <button
              onClick={onOpenVSCodeModal}
              className="p-2 text-slate-300 hover:text-white bg-slate-900 rounded-md border border-slate-800"
              title="VS Code"
            >
              <Terminal className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
