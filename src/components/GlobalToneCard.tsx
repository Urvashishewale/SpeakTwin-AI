import {
  Globe,
  AlertCircle,
  Compass,
  Zap,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';

import type { GlobalToneMetrics } from '../types/audio';

interface GlobalToneCardProps {
  metrics: GlobalToneMetrics;
  wpm: number;
}

export const GlobalToneCard = ({
  metrics,
  wpm,
}: GlobalToneCardProps) => {
  const isTooSlow = wpm > 0 && wpm < 125;
  const isIdeal = wpm >= 125 && wpm <= 145;
  const isSlightlyFast = wpm > 145 && wpm <= 160;
  const isTooFast = wpm > 160;
  const hasValidWpm = Number.isFinite(wpm) && wpm > 0;

  const comprehensionScore = Number.isFinite(
    metrics.globalComprehensionScore,
  )
    ? Math.min(100, Math.max(0, metrics.globalComprehensionScore))
    : 0;

  const comprehensionColor =
    comprehensionScore >= 80
      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
      : comprehensionScore >= 65
        ? 'bg-amber-950/60 border-amber-800 text-amber-300'
        : 'bg-rose-950/60 border-rose-800 text-rose-300';

  const pacingColor = isTooFast
    ? 'text-rose-400'
    : isSlightlyFast || isTooSlow
      ? 'text-amber-400'
      : 'text-emerald-400';

  const pacingLabel = !hasValidWpm
    ? 'Waiting for speech data'
    : isTooSlow
      ? `Slow Pace (${wpm} WPM)`
      : isTooFast
        ? `Pacing Rushed (${wpm} WPM)`
        : isSlightlyFast
          ? `Slightly Fast (${wpm} WPM)`
          : isIdeal
            ? `Ideal Pace (${wpm} WPM)`
            : `Steady Pace (${wpm} WPM)`;

  const pacingAdvice = !hasValidWpm
    ? 'Speak to generate a speaking-speed assessment.'
    : isTooSlow
      ? 'Try a slightly quicker pace while keeping your words clear.'
      : isTooFast
        ? 'Slow down and add natural pauses to help interviewers follow your answers.'
        : isSlightlyFast
          ? 'Reduce your speed slightly, especially when explaining technical details.'
          : isIdeal
            ? 'Your speaking speed is within the suggested interview range.'
            : 'Maintain a steady pace and focus on clear pronunciation.';

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
            <Globe className="w-4 h-4" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Global Interview Intelligibility &amp; Tone Analyzer
            </h3>
            <p className="text-xs text-slate-400">
              Cross-cultural speech cadence and tone analysis for international interviews
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">
            Comprehension Rating:
          </span>

          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${comprehensionColor}`}
          >
            {comprehensionScore}% Intelligibility
          </span>
        </div>
      </div>

      {/* Grid of Tone Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Metric 1: Tone Classification */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">
            Tone Impression
          </span>

          <div className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>{metrics.toneCategory || 'Not available'}</span>
          </div>

          <p className="text-[11px] text-slate-400">
            Vocal tone and confidence indicators
          </p>
        </div>

        {/* Metric 2: Cadence Rhythm */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">
            Rhythm Cadence
          </span>

          <div className="text-sm font-bold text-cyan-300 font-mono flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate">
              {metrics.cadenceProfile || 'Not available'}
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            Suggested interview pace: 125–145 WPM
          </p>
        </div>

        {/* Metric 3: Pacing Assessment */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">
            Pacing Assessment
          </span>

          <div
            className={`text-sm font-bold font-mono flex items-center gap-1.5 ${pacingColor}`}
          >
            {!hasValidWpm ? (
              <AlertCircle className="w-3.5 h-3.5" />
            ) : isTooFast ? (
              <ShieldAlert className="w-3.5 h-3.5" />
            ) : isSlightlyFast || isTooSlow ? (
              <AlertCircle className="w-3.5 h-3.5" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}

            <span>{pacingLabel}</span>
          </div>

          <p className="text-[11px] text-slate-400">
            {pacingAdvice}
          </p>
        </div>
      </div>

      {/* Cross-Cultural Communication Insights */}
      <div className="p-3.5 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-950/60 border border-indigo-900/50 rounded-lg text-xs space-y-2">
        <div className="flex items-center gap-2 text-indigo-300 font-semibold">
          <Globe className="w-3.5 h-3.5 text-indigo-400" />

          <span>
            Cross-Cultural Speech Advice (India to International Interviews)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
          <div className="space-y-1">
            <span className="text-slate-400 font-mono text-[11px] font-semibold">
              Pacing &amp; Speed:
            </span>

            <p className="leading-relaxed text-[11px]">
              {metrics.speedPacingAdvice || pacingAdvice}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-mono text-[11px] font-semibold">
              Articulation &amp; Tone:
            </span>

            <p className="leading-relaxed text-[11px]">
              {metrics.accentToneAdvice ||
                'Focus on clear pronunciation, natural pauses, and a steady speaking pace.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};