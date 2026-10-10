import React, { useState } from 'react';
import {
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  CheckCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { DetectedPause, FillerWordItem, WrongWordItem } from '../types/audio';

interface DetailedIssuesPanelProps {
  wrongWords: WrongWordItem[];
  fillerWords: FillerWordItem[];
  pauses: DetectedPause[];
  actionableTips: string[];
  summary: string;
  source: 'realtime' | 'algorithmic' | 'gemini-ai';
  onRunDeepAnalysis?: () => void;
  isAnalyzingDeep?: boolean;
}

export const DetailedIssuesPanel: React.FC<DetailedIssuesPanelProps> = ({
  wrongWords,
  fillerWords,
  pauses,
  actionableTips,
  summary,
  source,
  onRunDeepAnalysis,
  isAnalyzingDeep,
}) => {
  const [activeTab, setActiveTab] = useState<'wrong-words' | 'fillers' | 'pauses' | 'coaching'>('wrong-words');

  const awkwardPauses = pauses.filter((p) => p.duration > 1.2);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col gap-4">
      {/* Top Tab Bar & Deep AI action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        {/* Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('wrong-words')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'wrong-words'
                ? 'bg-slate-800 text-rose-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Wrong Words ({wrongWords.length})
          </button>
          <button
            onClick={() => setActiveTab('fillers')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'fillers'
                ? 'bg-slate-800 text-amber-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Filler Words ({fillerWords.reduce((a, b) => a + b.count, 0)})
          </button>
          <button
            onClick={() => setActiveTab('pauses')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'pauses'
                ? 'bg-slate-800 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pauses Log ({pauses.length})
          </button>
          <button
            onClick={() => setActiveTab('coaching')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'coaching'
                ? 'bg-slate-800 text-indigo-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Speech Coach
          </button>
        </div>

        {/* Deep Gemini AI Diagnostic Button */}
        {onRunDeepAnalysis && (
          <button
            onClick={onRunDeepAnalysis}
            disabled={isAnalyzingDeep}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 rounded transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200 animate-spin-slow" />
            <span>{isAnalyzingDeep ? 'Analyzing with AI...' : 'Run Deep AI Diagnostic'}</span>
          </button>
        )}
      </div>

      {/* Tab 1: Wrong Words & Stumbles */}
      {activeTab === 'wrong-words' && (
        <div className="space-y-3">
          {wrongWords.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <CheckCircle className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
              <p>No wrong words or vocal stumbles detected in this segment.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 border border-slate-800/80 rounded overflow-hidden">
              {wrongWords.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-950/40 hover:bg-slate-900/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-rose-400 bg-rose-950/50 border border-rose-800/60 px-1.5 py-0.5 rounded">
                        &ldquo;{item.word}&rdquo;
                      </span>
                      <span className="text-xs text-slate-400 font-medium">· {item.issue}</span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">{item.context}</p>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-2 py-1 rounded max-w-sm">
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.suggestion}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Filler Words Frequency */}
      {activeTab === 'fillers' && (
        <div>
          {fillerWords.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <CheckCircle className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
              <p>Zero filler words detected. Speech is remarkably direct.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-mono">
                  <tr>
                    <th className="py-2.5 px-3">Filler Word</th>
                    <th className="py-2.5 px-3 text-right">Count</th>
                    <th className="py-2.5 px-3 text-right">% of Spoken Words</th>
                    <th className="py-2.5 px-3">Frequency Gauge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {fillerWords.map((f, i) => (
                    <tr key={i} className="hover:bg-slate-950/30 transition-colors">
                      <td className="py-2 px-3 font-semibold text-amber-300 font-mono">
                        &ldquo;{f.word}&rdquo;
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-white">
                        {f.count}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-400">
                        {f.percentage}%
                      </td>
                      <td className="py-2 px-3">
                        <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${Math.min(100, f.percentage * 8)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Pauses Log */}
      {activeTab === 'pauses' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Total {pauses.length} pause segments logged ({awkwardPauses.length} prolonged awkward silences)
            </span>
          </div>

          {pauses.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p>No significant pause intervals logged yet.</p>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60 border border-slate-800 rounded">
              {pauses.map((p, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 flex items-center justify-between text-xs bg-slate-950/40 hover:bg-slate-900/40"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 tabular-nums">
                      {p.startTime.toFixed(1)}s – {p.endTime.toFixed(1)}s
                    </span>
                    <span className="text-slate-500">·</span>
                    <span
                      className={`font-semibold font-mono tabular-nums ${
                        p.type === 'awkward'
                          ? 'text-rose-400'
                          : p.type === 'noticeable'
                          ? 'text-amber-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {p.duration.toFixed(2)}s duration
                    </span>
                  </div>

                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                      p.type === 'awkward'
                        ? 'bg-rose-950/60 border border-rose-800 text-rose-300'
                        : p.type === 'noticeable'
                        ? 'bg-amber-950/60 border border-amber-800 text-amber-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {p.type === 'awkward'
                      ? 'Awkward Silence'
                      : p.type === 'noticeable'
                      ? 'Noticeable Hesitation'
                      : 'Breath Pause'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Coaching Recommendations */}
      {activeTab === 'coaching' && (
        <div className="space-y-4">
          <div className="bg-indigo-950/30 border border-indigo-900/60 rounded-md p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 mb-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Acoustic &amp; Linguistic Synthesis</span>
              <span className="text-indigo-400/60 font-mono text-[10px]">· Engine: {source}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{summary}</p>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300">Actionable Coaching Drills</span>
            <div className="space-y-2">
              {actionableTips.map((tip, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 bg-slate-950/50 border border-slate-800/80 rounded text-xs text-slate-300"
                >
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[10px] text-cyan-400 shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
