import React from 'react';
import {
  Terminal,
  Activity,
  Github,
  PanelLeftClose,
  PanelLeftOpen,
  Mic,
  GitCompare,
  Volume2,
  AlertTriangle,
  Database,
  Flame,
} from 'lucide-react';
import { DashboardViewType } from './SideDashboard';

interface TopBarProps {
  activeView: DashboardViewType;
  onSelectView: (view: DashboardViewType) => void;
  onOpenVSCodeModal: () => void;
  onOpenGitHubModal: () => void;
  isRecording: boolean;
  durationSeconds: number;
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  onSelectView,
  onOpenVSCodeModal,
  onOpenGitHubModal,
  isRecording,
  durationSeconds,
  onToggleSidebar,
  isSidebarCollapsed,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Sidebar Toggle & Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors"
          title={isSidebarCollapsed ? 'Expand side dashboard' : 'Collapse side dashboard'}
          aria-label="Toggle Side Dashboard"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-cyan-400" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-slate-400" />
          )}
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm shadow-cyan-500/20 shrink-0">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-bold tracking-tight text-white whitespace-nowrap">
              AudioPulse
            </span>
            <span className="hidden md:inline-block text-[10px] font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-800/60 px-1.5 py-0.5 rounded">
              Global Speech Coach
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Navigation Pills */}
      <nav className="hidden xl:flex items-center gap-1.5 text-xs font-medium text-slate-400">
        <button
          onClick={() => onSelectView('dashboard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            activeView === 'dashboard'
              ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/60 font-semibold'
              : 'hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Speech Telemetry</span>
        </button>

        <button
          onClick={() => onSelectView('comparison')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            activeView === 'comparison'
              ? 'text-indigo-300 bg-indigo-950/40 border border-indigo-800/60 font-semibold'
              : 'hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
          <span>Right Sentence Diff</span>
        </button>

        <button
          onClick={() => onSelectView('timeline')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            activeView === 'timeline'
              ? 'text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 font-semibold'
              : 'hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Waveform &amp; Pauses</span>
        </button>

        <button
          onClick={() => onSelectView('issues')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            activeView === 'issues'
              ? 'text-amber-300 bg-amber-950/40 border border-amber-800/60 font-semibold'
              : 'hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Wrong Words &amp; Coaching</span>
        </button>

        <button
          onClick={() => onSelectView('dataset')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            activeView === 'dataset'
              ? 'text-cyan-300 bg-cyan-950/40 border border-cyan-800/60 font-semibold'
              : 'hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>Custom Speech Dataset</span>
        </button>

        <button
          onClick={() => onSelectView('drills')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            activeView === 'drills'
              ? 'text-rose-300 bg-rose-950/40 border border-rose-800/60 font-semibold'
              : 'hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          <span>Practice Drills</span>
        </button>
      </nav>

      {/* Zone 3: Live Recording Badge & Helper Action Buttons */}
      <div className="flex items-center gap-2.5 shrink-0">
        {isRecording && (
          <div className="flex items-center gap-2 text-xs font-mono text-rose-400 bg-rose-950/60 border border-rose-800/80 px-2.5 py-1 rounded-md animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>LIVE {formatTime(durationSeconds)}</span>
          </div>
        )}

        {/* GitHub Team Repo button */}
        <button
          onClick={onOpenGitHubModal}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors whitespace-nowrap shadow-sm"
          title="How to push code to GitHub and add team members"
        >
          <Github className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">GitHub Team</span>
        </button>

        {/* VS Code Guide button */}
        <button
          onClick={onOpenVSCodeModal}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors whitespace-nowrap shadow-sm"
          title="Run this project on VS Code"
        >
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span>VS Code</span>
        </button>
      </div>
    </header>
  );
};
