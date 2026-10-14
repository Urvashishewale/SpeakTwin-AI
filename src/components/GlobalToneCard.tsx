import React from 'react';
import { Globe, AlertCircle, Compass, Zap, CheckCircle2, ShieldAlert } from 'lucide-react';
import { GlobalToneMetrics } from '../types/audio';

interface GlobalToneCardProps {
  metrics: GlobalToneMetrics;
  wpm: number;
}

export const GlobalToneCard: React.FC<GlobalToneCardProps> = ({ metrics, wpm }) => {
  const isTooFast = wpm > 160;
  const isSlightlyFast = wpm > 145 && wpm <= 160;

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
              Cross-cultural speech cadence &amp; tone analysis for US, UK, European, and multinational interviews
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Comprehension Rating:</span>
          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
              metrics.globalComprehensionScore >= 80
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : metrics.globalComprehensionScore >= 65
                ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                : 'bg-rose-950/60 border-rose-800 text-rose-300'
            }`}
          >
            {metrics.globalComprehensionScore}% Intelligible
          </span>
        </div>
      </div>

      {/* Grid of Tone Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Metric 1: Tone Classification */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Tone Impression</span>
          <div className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>{metrics.toneCategory}</span>
          </div>
          <p className="text-[11px] text-slate-400">Perceived vocal confidence and authority in Q&amp;A</p>
        </div>

        {/* Metric 2: Cadence Rhythm */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Rhythm Cadence</span>
          <div className="text-sm font-bold text-cyan-300 font-mono flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate">{metrics.cadenceProfile}</span>
          </div>
          <p className="text-[11px] text-slate-400">Global standard: Stress-timed (125–145 WPM)</p>
        </div>

        {/* Metric 3: Speed Impact on International Comprehension */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Pacing Assessment</span>
          <div
            className={`text-sm font-bold font-mono flex items-center gap-1.5 ${
              isTooFast ? 'text-rose-400' : isSlightlyFast ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {isTooFast ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Pacing Rushed ({wpm} WPM)</span>
              </>
            ) : isSlightlyFast ? (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Slightly Fast ({wpm} WPM)</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ideal Pace ({wpm} WPM)</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {isTooFast
              ? 'International interviewers may struggle to keep up'
              : 'Effortless to follow for non-native & native interviewers'}
          </p>
        </div>
      </div>

      {/* Cross-Cultural Communication Insights Banner */}
      <div className="p-3.5 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-950/60 border border-indigo-900/50 rounded-lg text-xs space-y-2">
        <div className="flex items-center gap-2 text-indigo-300 font-semibold">
          <Globe className="w-3.5 h-3.5 text-indigo-400" />
          <span>Cross-Cultural Speech Advice (India $\rightarrow$ International Transitions)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
          <div className="space-y-1">
            <span className="text-slate-400 font-mono text-[11px] font-semibold">Pacing &amp; Speed:</span>
            <p className="leading-relaxed text-[11px]">
              {metrics.speedPacingAdvice}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-mono text-[11px] font-semibold">Articulation &amp; Tone:</span>
            <p className="leading-relaxed text-[11px]">
              {metrics.accentToneAdvice}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
