import React from 'react';
import { Terminal, Activity, FileAudio, RefreshCw } from 'lucide-react';

interface TopBarProps {
  activeView: 'dashboard' | 'timeline' | 'issues';
  onSelectView: (view: 'dashboard' | 'timeline' | 'issues') => void;
  onOpenVSCodeModal: () => void;
  isRecording: boolean;
  durationSeconds: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  onSelectView,
  onOpenVSCodeModal,
  isRecording,
  durationSeconds,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-cyan-500/20">
          <Activity className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
            AudioPulse
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
        <button
          onClick={() => onSelectView('dashboard')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'dashboard' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Speech Telemetry
        </button>
        <button
          onClick={() => onSelectView('timeline')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'timeline' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Waveform & Pauses
        </button>
        <button
          onClick={() => onSelectView('issues')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'issues' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Wrong Words & Coaching
        </button>
      </nav>

      {/* Zone 3: Primary Action & Live Telemetry Marker */}
      <div className="flex items-center gap-3 shrink-0">
        {isRecording && (
          <div className="flex items-center gap-2 text-xs font-mono text-red-400 bg-red-950/40 border border-red-800/60 px-2.5 py-1 rounded">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>LIVE REC {formatTime(durationSeconds)}</span>
          </div>
        )}

        <button
          onClick={onOpenVSCodeModal}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 shadow-sm"
        >
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span>VS Code Guide</span>
        </button>
      </div>
    </header>
  );
};
