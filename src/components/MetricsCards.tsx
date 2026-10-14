import React from 'react';
import { Gauge, PauseCircle, AlertTriangle, Sparkles, Globe, ShieldAlert } from 'lucide-react';
import { DetectedPause, FillerWordItem, WrongWordItem, GlobalToneMetrics } from '../types/audio';

interface MetricsCardsProps {
  wpm: number;
  durationSeconds: number;
  wordCount: number;
  pauses: DetectedPause[];
  wrongWords: WrongWordItem[];
  fillerWords: FillerWordItem[];
  fluencyScore: number;
  clarityScore: number;
  detectedPaceCategory: 'Too Slow' | 'Optimal' | 'Slightly Fast' | 'Too Fast';
  globalToneMetrics: GlobalToneMetrics;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  wpm,
  durationSeconds,
  wordCount,
  pauses,
  wrongWords,
  fillerWords,
  fluencyScore,
  clarityScore,
  detectedPaceCategory,
  globalToneMetrics,
}) => {
  const totalSilenceSeconds = pauses.reduce((acc, p) => acc + p.duration, 0);
  const awkwardPausesCount = pauses.filter((p) => p.duration > 1.2).length;
  const totalFillersCount = fillerWords.reduce((acc, f) => acc + f.count, 0);
  const fillerRatio = wordCount > 0 ? ((totalFillersCount / wordCount) * 100).toFixed(1) : '0.0';

  const isTooFastForGlobalAudience = wpm > 160;

  // Pace color styling
  const paceColor =
    detectedPaceCategory === 'Optimal'
      ? 'text-emerald-400'
      : detectedPaceCategory === 'Slightly Fast'
      ? 'text-amber-400'
      : 'text-rose-400';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Speaking Speed & Global Comprehension */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-medium">Speaking Speed (Global)</span>
          <Gauge className="w-4 h-4 text-cyan-400" />
        </div>

        <div className="flex items-baseline gap-2 my-1">
          <span className="text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
            {wpm}
          </span>
          <span className="text-xs text-slate-400 font-mono">WPM</span>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className={`font-medium ${paceColor}`}>
            {isTooFastForGlobalAudience ? 'Rushed for US/UK' : detectedPaceCategory}
          </span>
          <span className="text-slate-500 font-mono">Target: 125–145</span>
        </div>
      </div>

      {/* Metric 2: Pauses & Executive Silence Control */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-medium">Pauses &amp; Breath Control</span>
          <PauseCircle className="w-4 h-4 text-amber-400" />
        </div>

        <div className="flex items-baseline gap-2 my-1">
          <span className="text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
            {pauses.length}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            ({totalSilenceSeconds.toFixed(1)}s silence)
          </span>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>{awkwardPausesCount} hesitation stalls (&gt;1.2s)</span>
          <span className="text-slate-500 font-mono">
            {durationSeconds > 0
              ? `${Math.round((totalSilenceSeconds / durationSeconds) * 100)}% silence`
              : '0%'}
          </span>
        </div>
      </div>

      {/* Metric 3: Wrong Words & Fillers */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-medium">Wrong Words &amp; Fillers</span>
          <AlertTriangle className="w-4 h-4 text-rose-400" />
        </div>

        <div className="flex items-baseline gap-2 my-1">
          <span className="text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
            {totalFillersCount + wrongWords.length}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {totalFillersCount} fillers · {wrongWords.length} slips
          </span>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>{fillerRatio}% filler frequency</span>
          <span className="text-slate-500 font-mono">{wordCount} words spoken</span>
        </div>
      </div>

      {/* Metric 4: Interview Readiness & Tone Index */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-medium">Global Interview Readiness</span>
          <Globe className="w-4 h-4 text-indigo-400" />
        </div>

        <div className="flex items-baseline gap-3 my-1">
          <div>
            <span className="text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
              {globalToneMetrics.globalComprehensionScore}
            </span>
            <span className="text-xs text-slate-400 ml-1 font-mono">/100</span>
          </div>
          <span className="text-xs text-slate-500">·</span>
          <div className="text-xs text-slate-300 font-mono">
            Clarity: <span className="text-white font-semibold">{clarityScore}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-indigo-300 font-medium truncate max-w-[150px]">
            {globalToneMetrics.toneCategory}
          </span>
          <span className="text-cyan-400 font-mono text-[11px]">Intelligibility</span>
        </div>
      </div>
    </div>
  );
};
