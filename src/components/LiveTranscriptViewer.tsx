import React, { useState } from 'react';
import {
  Search,
  FileText,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  AlertTriangle,
  Radio,
  Layers,
  Filter,
} from 'lucide-react';
import { TranscriptWord } from '../types/audio';

interface LiveTranscriptViewerProps {
  transcriptText: string;
  transcriptWords: TranscriptWord[];
  onWordClick?: (timestamp?: number) => void;
  isListening?: boolean;
}

export const LiveTranscriptViewer: React.FC<LiveTranscriptViewerProps> = ({
  transcriptText,
  transcriptWords,
  onWordClick,
  isListening = false,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'issues' | 'fillers'>('all');
  const [viewMode, setViewMode] = useState<'text' | 'timeline'>('text');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [selectedWord, setSelectedWord] = useState<TranscriptWord | null>(null);

  // Check if any timestamps are actually present in the data
  const hasTimestamps = transcriptWords.some(
    (w) => w.timestamp !== undefined && w.timestamp !== null && !isNaN(w.timestamp)
  );

  const formatTimestamp = (seconds?: number): string => {
    if (seconds === undefined || seconds === null || isNaN(seconds)) {
      return '--:--';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const filteredWords = transcriptWords.filter((w) => {
    if (filterMode === 'issues' && !w.isWrong && !w.isPotentialIssue) return false;
    if (filterMode === 'fillers' && !w.isFiller) return false;
    if (searchQuery.trim() && !w.word.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const fillerCount = transcriptWords.filter((w) => w.isFiller).length;
  const issueCount = transcriptWords.filter((w) => w.isWrong || w.isPotentialIssue).length;

  const handleCopyTranscript = () => {
    if (!transcriptText.trim()) return;
    navigator.clipboard.writeText(transcriptText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Group words into sentence-like segments for the Timeline view
  const buildTimelineSegments = () => {
    const segments: {
      id: string;
      words: TranscriptWord[];
      startTime?: number;
      text: string;
    }[] = [];

    let currentSegmentWords: TranscriptWord[] = [];
    let segmentStartIndex = 0;

    transcriptWords.forEach((word, idx) => {
      currentSegmentWords.push(word);
      const isSentenceEnd = /[.?!]$/.test(word.word) || currentSegmentWords.length >= 14;
      const isLastWord = idx === transcriptWords.length - 1;

      if (isSentenceEnd || isLastWord) {
        const segText = currentSegmentWords.map((w) => w.word).join(' ');
        const firstWordWithTime = currentSegmentWords.find((w) => w.timestamp !== undefined);

        segments.push({
          id: `seg-${segmentStartIndex}`,
          words: [...currentSegmentWords],
          startTime: firstWordWithTime?.timestamp,
          text: segText,
        });

        currentSegmentWords = [];
        segmentStartIndex = idx + 1;
      }
    });

    return segments;
  };

  const timelineSegments = buildTimelineSegments();

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-3.5 shadow-sm">
      {/* 1. Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <FileText className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-white tracking-tight">
            Speech Transcript &amp; Timeline
          </span>

          <span className="text-[11px] font-mono text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
            {transcriptWords.length} words
          </span>

          {fillerCount > 0 && (
            <span className="text-[11px] font-mono text-amber-300 bg-amber-950/50 border border-amber-800/50 px-2 py-0.5 rounded">
              {fillerCount} fillers
            </span>
          )}

          {issueCount > 0 && (
            <span className="text-[11px] font-mono text-rose-300 bg-rose-950/50 border border-rose-800/50 px-2 py-0.5 rounded">
              {issueCount} potential slips
            </span>
          )}

          {isListening && (
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2 py-0.5 rounded animate-pulse">
              <Radio className="w-3 h-3 text-emerald-400" />
              <span>Listening Live</span>
            </span>
          )}
        </div>

        {/* View Switcher & Copy Action */}
        <div className="flex items-center gap-2">
          {/* Text vs Timeline View Switcher */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode('text')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                viewMode === 'text'
                  ? 'bg-slate-800 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Continuous Text View"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Text</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-slate-800 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Chronological Transcript Timeline"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
          </div>

          {/* Copy Verbatim Transcript */}
          {transcriptText.trim().length > 0 && (
            <button
              onClick={handleCopyTranscript}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs rounded-lg transition-colors font-mono"
              title="Copy verbatim recognized transcript to clipboard"
            >
              {isCopied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search recognized words..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
          />
        </div>

        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filterMode === 'all'
                ? 'bg-slate-800 text-white font-medium border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            All Text
          </button>
          <button
            onClick={() => setFilterMode('issues')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filterMode === 'issues'
                ? 'bg-rose-950/60 text-rose-300 font-medium border border-rose-800/60'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            Potential Slips ({issueCount})
          </button>
          <button
            onClick={() => setFilterMode('fillers')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filterMode === 'fillers'
                ? 'bg-amber-950/60 text-amber-300 font-medium border border-amber-800/60'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            Fillers ({fillerCount})
          </button>
        </div>
      </div>

      {/* 3. Main Transcript Display Area */}
      {viewMode === 'text' ? (
        /* Continuous Word Stream View */
        <div className="min-h-40 max-h-64 overflow-y-auto bg-slate-950/80 border border-slate-800/90 rounded-lg p-4 text-sm leading-relaxed text-slate-300 select-text">
          {transcriptWords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500 space-y-2">
              {isListening ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 animate-pulse">
                    <Radio className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    Listening for speech... Words will appear verbatim as recognized.
                  </p>
                </>
              ) : (
                <>
                  <FileText className="w-8 h-8 text-slate-700" />
                  <p className="text-xs text-slate-400">
                    No speech recorded yet. Speak into your microphone, upload an audio file, or click &ldquo;Benchmark Demo&rdquo;.
                  </p>
                </>
              )}
            </div>
          ) : filteredWords.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-8">
              No words match the selected filter (&ldquo;{searchQuery || filterMode}&rdquo;).
            </div>
          ) : (
            <div className="flex flex-wrap gap-x-1.5 gap-y-1.5">
              {filteredWords.map((item) => {
                if (item.isWrong || item.isPotentialIssue) {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedWord(item);
                        onWordClick?.(item.timestamp);
                      }}
                      title={item.suggestion || 'Potential speech stumble or slip'}
                      className="inline-flex items-center gap-1 bg-rose-950/50 border border-rose-800/80 text-rose-300 px-1.5 py-0.5 rounded text-xs font-medium hover:bg-rose-900/60 transition-colors"
                    >
                      <span>{item.word}</span>
                      {item.timestamp !== undefined && (
                        <span className="text-[10px] text-rose-400/80 font-mono">
                          [{formatTimestamp(item.timestamp)}]
                        </span>
                      )}
                    </button>
                  );
                }

                if (item.isFiller) {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedWord(item);
                        onWordClick?.(item.timestamp);
                      }}
                      title="Filler word (hesitation marker)"
                      className="inline-flex items-center gap-1 bg-amber-950/50 border border-amber-800/80 text-amber-300 px-1.5 py-0.5 rounded text-xs font-medium hover:bg-amber-900/60 transition-colors"
                    >
                      <span>{item.word}</span>
                      {item.timestamp !== undefined && (
                        <span className="text-[10px] text-amber-400/80 font-mono">
                          [{formatTimestamp(item.timestamp)}]
                        </span>
                      )}
                    </button>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedWord(item);
                      onWordClick?.(item.timestamp);
                    }}
                    className="hover:text-cyan-300 hover:underline transition-colors text-slate-200"
                  >
                    {item.word}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Timeline View (TASK 4: Transcript Timeline) */
        <div className="min-h-40 max-h-64 overflow-y-auto bg-slate-950/80 border border-slate-800/90 rounded-lg p-3 space-y-3">
          {/* Timestamp status banner */}
          <div className="px-3 py-2 bg-slate-900/70 border border-slate-800 rounded-md text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {hasTimestamps
                  ? 'Acoustic timestamp alignment active'
                  : 'Live browser speech recognition provides continuous word flow; timing offsets appear when benchmark/audio files are imported.'}
              </span>
            </span>
            <span className="font-mono text-slate-500">
              {hasTimestamps ? 'Verified Timestamps' : 'Untimed Stream'}
            </span>
          </div>

          {timelineSegments.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No transcript segments available to map on the timeline.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/70 border border-slate-800/80 rounded-lg overflow-hidden">
              {timelineSegments.map((seg, idx) => (
                <div
                  key={seg.id}
                  className="p-3 bg-slate-950/40 hover:bg-slate-900/40 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-mono text-[10px] text-cyan-400 font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 tabular-nums bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {hasTimestamps && seg.startTime !== undefined
                        ? formatTimestamp(seg.startTime)
                        : `Segment ${idx + 1}`}
                    </span>
                  </div>

                  <div className="flex-1 text-slate-200 leading-relaxed font-sans">
                    <span className="text-slate-300">&ldquo;{seg.text}&rdquo;</span>

                    {/* Word-level badges if errors/fillers exist in this segment */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {seg.words.map((w) => {
                        if (w.isFiller) {
                          return (
                            <span
                              key={w.id}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/80 text-amber-300"
                              title="Filler word"
                            >
                              filler: &ldquo;{w.word}&rdquo;
                            </span>
                          );
                        }
                        if (w.isWrong || w.isPotentialIssue) {
                          return (
                            <span
                              key={w.id}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-800/80 text-rose-300"
                              title={w.suggestion || 'Potential slip'}
                            >
                              slip: &ldquo;{w.word}&rdquo;
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Word Detail Drawer / Inspector */}
      {selectedWord && (
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs animate-in fade-in duration-100">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-mono">&ldquo;{selectedWord.word}&rdquo;</span>
            <span className="text-slate-500">&bull;</span>
            <span
              className={`font-semibold ${
                selectedWord.isFiller
                  ? 'text-amber-400'
                  : selectedWord.isWrong || selectedWord.isPotentialIssue
                  ? 'text-rose-400'
                  : 'text-emerald-400'
              }`}
            >
              {selectedWord.isFiller
                ? 'Hesitation Filler'
                : selectedWord.isWrong || selectedWord.isPotentialIssue
                ? selectedWord.issue || 'Potential Speech Slip'
                : 'Clean Spoken Word'}
            </span>
            {selectedWord.suggestion && (
              <>
                <span className="text-slate-500">&bull;</span>
                <span className="text-slate-300">{selectedWord.suggestion}</span>
              </>
            )}
            {selectedWord.timestamp !== undefined && (
              <>
                <span className="text-slate-500">&bull;</span>
                <span className="font-mono text-slate-400">
                  {formatTimestamp(selectedWord.timestamp)}
                </span>
              </>
            )}
          </div>
          <button
            onClick={() => setSelectedWord(null)}
            className="text-slate-500 hover:text-slate-300 text-xs px-2 py-0.5"
          >
            Close
          </button>
        </div>
      )}

      {/* 4. Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 font-mono pt-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/80" />
            <span>Potential Slip</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/80" />
            <span>Filler Word</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Clean Word</span>
          </div>
        </div>

        <div className="text-slate-400">
          <span>Verbatim ASR Capture &bull; Unaltered Speech</span>
        </div>
      </div>
    </div>
  );
};
