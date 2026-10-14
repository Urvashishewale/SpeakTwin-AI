import React from 'react';
import {
  BookOpen,
  X,
  CheckCircle,
  AlertTriangle,
  Scale,
  Shield,
  Tag,
  FileText,
  Clock,
  Sparkles,
  GitCompare,
} from 'lucide-react';

interface AnnotationGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnnotationGuidelinesModal: React.FC<AnnotationGuidelinesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guidelines-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-950/70 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 id="guidelines-title" className="text-base font-bold text-white flex items-center gap-2">
                Dataset Annotation Guidelines &amp; Protocol
              </h2>
              <p className="text-xs text-slate-400">
                Official research criteria for Good Speech vs Speech with Identified Errors and 13-category taxonomy.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Zero-Bias & Ethical Rule */}
        <div className="p-4 bg-purple-950/30 border border-purple-800/60 rounded-xl space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
            <Shield className="w-4 h-4 text-purple-400" />
            <span>Strict Anti-Bias &amp; Zero-Discrimination Policy</span>
          </div>
          <p className="text-xs text-purple-200/90 leading-relaxed">
            Speech is evaluated exclusively based on syntactic conformity, cadence consistency (125&ndash;155 WPM), pause dynamics, and international intelligibility. <strong>Never classify speech as erroneous due to regional accent, native language background, vocal timbre, gender, or age.</strong>
          </p>
        </div>

        {/* 2. Good Speech vs Errors Criteria */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Good Speech */}
          <div className="p-4 bg-slate-950/80 border border-emerald-900/40 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Category A: Good Speech</span>
            </div>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">&bull;</span>
                <span><strong>Pacing Cadence:</strong> 125&ndash;155 WPM (international baseline for high-stakes interviews).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">&bull;</span>
                <span><strong>Controlled Pauses:</strong> Natural syntactic boundaries (&le; 1.0s); no mid-word stalls.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">&bull;</span>
                <span><strong>Grammar &amp; Syntax:</strong> Proper subject-verb agreement and standard prepositions.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">&bull;</span>
                <span><strong>Low Fillers:</strong> Hesitation words constitute less than 2% of spoken tokens.</span>
              </li>
            </ul>
          </div>

          {/* Speech with Errors */}
          <div className="p-4 bg-slate-950/80 border border-rose-900/40 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Category B: Speech with Identified Errors</span>
            </div>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-1.5">
                <span className="text-rose-400 font-bold">&bull;</span>
                <span><strong>Syntactic Faults:</strong> Tense discord (e.g. <em>"did not got"</em>), spurious articles.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-rose-400 font-bold">&bull;</span>
                <span><strong>Hesitation Stalls:</strong> Unintentional awkward pauses &gt; 1.2s interrupting phrases.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-rose-400 font-bold">&bull;</span>
                <span><strong>Colloquial Mismatches:</strong> <em>"myself [Name]"</em>, <em>"revert back"</em>, <em>"prepone"</em>.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-rose-400 font-bold">&bull;</span>
                <span><strong>Stutters &amp; Fillers:</strong> Involuntary repetitions (<em>"we we will"</em>), excessive <em>"um/basically"</em>.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 3. Tripartite Transcript Governance */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2.5 text-xs">
          <div className="font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Tripartite Transcript Architecture</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded">
              <div className="font-mono text-cyan-300 font-semibold mb-1">1. original_transcript</div>
              <p className="text-slate-400 text-[11px]">
                Raw verbatim output from Speech Recognition. <strong>Immutable rule: NEVER modify or overwrite.</strong> Preserves ASR baseline.
              </p>
            </div>
            <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded">
              <div className="font-mono text-indigo-300 font-semibold mb-1">2. verified_transcript</div>
              <p className="text-slate-400 text-[11px]">
                Human-confirmed record of what the speaker literally uttered, correcting speech-to-text decoding slips while preserving speaker errors.
              </p>
            </div>
            <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded">
              <div className="font-mono text-emerald-300 font-semibold mb-1">3. corrected_transcript</div>
              <p className="text-slate-400 text-[11px]">
                Target grammatically polished reference sentence. Serves as ground-truth for neural correction models.
              </p>
            </div>
          </div>
        </div>

        {/* 4. 13-Category Alignment Taxonomy */}
        <div className="space-y-2 text-xs">
          <div className="font-bold text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-400" />
            <span>13-Category Alignment &amp; Error Taxonomy</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {[
              { name: 'Grammar Error', desc: 'Syntactic and morphological defects (e.g. subject-verb disagreement).' },
              { name: 'Incorrect Word Choice', desc: 'Semantically misaligned terms (e.g. "prepone" vs "expedite").' },
              { name: 'Unnecessary Word', desc: 'Spurious or redundant fillers (e.g. "revert back").' },
              { name: 'Missing Word', desc: 'Omission of essential verbs, prepositions, or pronouns.' },
              { name: 'Repeated Word', desc: 'Stutter repetitions or false starts (e.g. "we we will").' },
              { name: 'Incorrect Verb Form', desc: 'Tense mistakes (e.g. "did not got" -> "did not get").' },
              { name: 'Incorrect Article', desc: 'Superfluous or missing articles (e.g. "the Urvashi").' },
              { name: 'Incorrect Word Order', desc: 'Scrambled English constituent clause sequence.' },
              { name: 'Filler Word', desc: 'Hesitation vocalizations: "um", "uh", "basically", "like".' },
              { name: 'Long Pause', desc: 'Awkward hesitation gap exceeding 1.2 seconds.' },
              { name: 'Pronunciation Deviation', desc: 'Phonemic slips impairing international clarity.' },
              { name: 'Speech Recognition Uncertainty', desc: 'Muffled audio requiring manual auditor review.' },
              { name: 'Correct Speech', desc: 'Ground-truth benchmark confirming clean execution.' },
            ].map((cat, i) => (
              <div key={i} className="p-2 bg-slate-950/60 border border-slate-800/80 rounded">
                <span className="font-mono text-cyan-400 font-semibold">{cat.name}</span>
                <p className="text-slate-400 text-[11px] mt-0.5">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Paired Speech Benchmark Example */}
        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs">
          <div className="font-bold text-slate-200 flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-indigo-400" />
            <span>Benchmark Contrastive Pair: PAIR_001 (Urvashi Shewale)</span>
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            <div className="text-emerald-400">
              Good Speech (SMP_001_GOOD): "My name is Urvashi Shewale."
            </div>
            <div className="text-rose-400">
              Speech with Errors (SMP_002_ERROR): "My name is the Urvashi is Shewale."
            </div>
            <div className="text-cyan-300">
              Target Correction: "My name is Urvashi Shewale." (Fixes LBL_001 Article &amp; LBL_002 Verb)
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close Guidelines
          </button>
        </div>
      </div>
    </div>
  );
};
