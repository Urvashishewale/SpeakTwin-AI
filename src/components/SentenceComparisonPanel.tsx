import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Lightbulb,
  PlusCircle,
  Database,
  Send,
  Zap,
} from 'lucide-react';
import { SentenceComparison } from '../types/audio';

interface SentenceComparisonPanelProps {
  comparisons: SentenceComparison[];
  onPlaySentence?: (text: string) => void;
  onAddCustomComparison?: (original: string, right: string, category: string, why: string) => void;
  onSaveAsPair?: (original: string, right: string) => void;
}

export const SentenceComparisonPanel: React.FC<SentenceComparisonPanelProps> = ({
  comparisons,
  onAddCustomComparison,
  onSaveAsPair,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const speakSentence = (text: string, id: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    if (speakingId === id) {
      setSpeakingId(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Steady, calm interview cadence
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Quick Indianism / Grammar Refiner
  const refineCustomSentence = (raw: string) => {
    let polished = raw.trim();
    const improvements: string[] = [];

    // Replace colloquial introductions
    if (/^myself\s+/i.test(polished)) {
      polished = polished.replace(/^myself\s+/i, 'My name is ');
      improvements.push('Replaced "myself" with standard executive self-introduction');
    }

    // Replace verb errors
    if (/\bdid\s+not\s+got\b/i.test(polished)) {
      polished = polished.replace(/\bdid\s+not\s+got\b/gi, 'did not encounter');
      improvements.push('Corrected past-tense verb conjugation ("did not got" -> "did not encounter")');
    }

    // Replace Indianisms
    if (/\bprepone\b/i.test(polished)) {
      polished = polished.replace(/\bprepone\b/gi, 'expedite');
      improvements.push('Replaced regional Indianism "prepone" with global standard "expedite"');
    }

    if (/\brevert\s+back\b/i.test(polished)) {
      polished = polished.replace(/\brevert\s+back\b/gi, 'follow up');
      improvements.push('Eliminated redundant phrasing ("revert back" -> "follow up")');
    }

    if (/\bdo\s+one\s+thing\b/i.test(polished)) {
      polished = polished.replace(/\bdo\s+one\s+thing\b/gi, 'proceed by');
      improvements.push('Upgraded colloquial phrase to decisive executive action');
    }

    // Strip fillers
    if (/(\bum\b|\buh\b|\bbasically\b|\blike\b)/i.test(polished)) {
      polished = polished.replace(/(\bum\b|\buh\b|\bbasically\b|\blike\b)/gi, '').replace(/\s{2,}/g, ' ').trim();
      improvements.push('Eliminated hesitation fillers');
    }

    // Fix repetitions
    if (/(\bthe\s+the\b|\bi\s+i\b|\bwe\s+we\b)/i.test(polished)) {
      polished = polished.replace(/\b(\w+)\s+\1\b/gi, '$1');
      improvements.push('Cleaned up stutter repetition');
    }

    polished = polished.charAt(0).toUpperCase() + polished.slice(1);
    if (!/[.?!]$/.test(polished)) polished += '.';

    return {
      polished: polished.length > 5 ? polished : 'Today, I would like to present a structured overview of our system.',
      improvements: improvements.length > 0 ? improvements : ['Enhanced executive vocabulary and cadence for global interviewers'],
      category: improvements.length > 0 ? 'Grammar & Phrasing' : 'Global Tone',
      why: 'Eliminates regional colloquial transfers and projects calm, authoritative confidence in international interviews.',
    };
  };

  const handleRefineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    setIsProcessing(true);
    const { polished, improvements, category, why } = refineCustomSentence(customInput);

    if (onAddCustomComparison) {
      onAddCustomComparison(customInput.trim(), polished, category, why);
    }
    setCustomInput('');
    setIsProcessing(false);
  };

  const presetExamples = [
    'Myself Rahul, I am lead engineer.',
    'We did not got any blocker issues.',
    'Basically we can prepone our release schedule.',
    'We will revert back after team sync.',
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Synchronized Sentence Comparison &amp; Executive Diff Studio
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare spoken sentences against polished, executive-level phrasing tailored for US, UK, and global interviewers.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{comparisons.length} Sentences Evaluated</span>
        </div>
      </div>

      {/* Interactive Sentence Polishing Bar */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Sentence Refiner: Type or paste any phrase to test</span>
          </span>
          <span className="text-[11px] text-slate-400">Fixes Indianisms &amp; grammar</span>
        </div>

        <form onSubmit={handleRefineSubmit} className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="e.g. Myself Rahul, we did not got any blocker and basically we can prepone release..."
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none font-sans"
          />
          <button
            type="submit"
            disabled={!customInput.trim() || isProcessing}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all shadow-md shadow-cyan-950/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Polish Phrasing</span>
          </button>
        </form>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
          <span className="text-slate-400">Try common pitfalls:</span>
          {presetExamples.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCustomInput(ex)}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              &ldquo;{ex}&rdquo;
            </button>
          ))}
        </div>
      </div>

      {/* Comparisons List */}
      {comparisons.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
          <Lightbulb className="w-8 h-8 text-slate-600 mb-1" />
          <p className="max-w-md">
            Start speaking or load benchmark audio to see your spoken sentences paired side-by-side with professional, interview-ready phrasing.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comparisons.map((item, idx) => (
            <div
              key={item.id}
              className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 space-y-3 hover:border-slate-700/80 transition-colors"
            >
              {/* Sentence Number & Category */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[11px] text-cyan-300 font-bold">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-300">Statement Comparison</span>
                  <span className="text-slate-500">&bull;</span>
                  <span className="text-cyan-400 font-mono text-[11px]">{item.category}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Listen button */}
                  <button
                    onClick={() => speakSentence(item.rightSentence, item.id)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded text-[11px] font-mono transition-colors"
                    title="Listen to the right sentence"
                  >
                    {speakingId === item.id ? (
                      <>
                        <VolumeX className="w-3 h-3 text-amber-400" />
                        <span className="text-amber-400">Stop</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3 text-cyan-400" />
                        <span>Hear Native</span>
                      </>
                    )}
                  </button>

                  {/* Copy button */}
                  <button
                    onClick={() => handleCopy(item.rightSentence, item.id)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded text-[11px] font-mono transition-colors"
                    title="Copy right sentence"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  {/* Save as Pair in Dataset button */}
                  {onSaveAsPair && (
                    <button
                      onClick={() => onSaveAsPair(item.originalSentence, item.rightSentence)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/80 text-cyan-300 rounded text-[11px] font-mono transition-colors"
                      title="Save this Good vs Error comparison as a contrastive pair in the Custom Speech Dataset"
                    >
                      <Database className="w-3 h-3 text-cyan-400" />
                      <span>Pair in Dataset</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Spoken vs Right Sentence Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Spoken Sentence */}
                <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-lg space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-rose-400 font-semibold uppercase tracking-wider">
                    <span>What You Said:</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans text-xs">
                    &ldquo;{item.originalSentence}&rdquo;
                  </p>
                </div>

                {/* Right Sentence */}
                <div className="p-3 bg-emerald-950/25 border border-emerald-900/50 rounded-lg space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Right / Professional Sentence:</span>
                  </div>
                  <p className="text-emerald-100 font-medium leading-relaxed font-sans text-xs">
                    &ldquo;{item.rightSentence}&rdquo;
                  </p>
                </div>
              </div>

              {/* Why it sounds better & improvements */}
              <div className="pt-2 border-t border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-start gap-1.5 text-slate-400">
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-300">Why this works better abroad:</strong> {item.whyItSoundsBetter}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {item.improvements.map((imp, impIdx) => (
                    <span
                      key={impIdx}
                      className="text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded"
                    >
                      {imp}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
