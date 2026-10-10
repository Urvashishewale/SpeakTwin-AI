import React, { useState } from 'react';
import { Search, FileText, CheckCircle2 } from 'lucide-react';
import { TranscriptWord } from '../types/audio';

interface LiveTranscriptViewerProps {
  transcriptText: string;
  transcriptWords: TranscriptWord[];
  onWordClick?: (timestamp: number) => void;
}

export const LiveTranscriptViewer: React.FC<LiveTranscriptViewerProps> = ({
  transcriptText,
  transcriptWords,
  onWordClick,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'issues'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWords = transcriptWords.filter((w) => {
    if (filterMode === 'issues' && !w.isFiller && !w.isWrong) return false;
    if (searchQuery.trim() && !w.word.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col gap-3">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-300">
            Real-Time Synchronized Transcript
          </span>
          <span className="text-xs text-slate-500 font-mono">
            ({transcriptWords.length} words)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search words..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Segmented Filter */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded p-0.5">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Text
            </button>
            <button
              onClick={() => setFilterMode('issues')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterMode === 'issues'
                  ? 'bg-slate-800 text-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Issues Only
            </button>
          </div>
        </div>
      </div>

      {/* Transcript Body */}
      <div className="min-h-36 max-h-56 overflow-y-auto bg-slate-950/70 border border-slate-800/80 rounded p-4 text-sm leading-relaxed text-slate-300 select-text">
        {transcriptWords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
            <p className="text-xs">
              No speech recorded yet. Speak into your microphone, upload an audio file, or click &ldquo;Load Demo Audio&rdquo;.
            </p>
          </div>
        ) : filteredWords.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-6">
            No words match the selected filter.
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-1.5 gap-y-1">
            {filteredWords.map((item) => {
              if (item.isWrong) {
                return (
                  <span
                    key={item.id}
                    onClick={() => onWordClick?.(item.timestamp)}
                    title={item.suggestion || 'Potential speech stumble / repeated word'}
                    className="cursor-pointer bg-rose-950/60 border border-rose-800 text-rose-300 px-1 py-0.5 rounded text-xs font-medium hover:bg-rose-900/60 transition-colors"
                  >
                    {item.word}
                  </span>
                );
              }

              if (item.isFiller) {
                return (
                  <span
                    key={item.id}
                    onClick={() => onWordClick?.(item.timestamp)}
                    title="Filler word (hesitation marker)"
                    className="cursor-pointer bg-amber-950/60 border border-amber-800/80 text-amber-300 px-1 py-0.5 rounded text-xs font-medium hover:bg-amber-900/60 transition-colors"
                  >
                    {item.word}
                  </span>
                );
              }

              return (
                <span
                  key={item.id}
                  onClick={() => onWordClick?.(item.timestamp)}
                  className="cursor-pointer hover:text-cyan-300 transition-colors"
                >
                  {item.word}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend footer */}
      <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-rose-500" />
          <span>Stumble / Wrong Word</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-amber-500" />
          <span>Filler Word</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span>Clean Word</span>
        </div>
      </div>
    </div>
  );
};
