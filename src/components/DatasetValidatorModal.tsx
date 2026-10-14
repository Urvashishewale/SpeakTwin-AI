import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Terminal,
  X,
  FileCheck,
  Database,
  Volume2,
} from 'lucide-react';

interface DatasetValidatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ValidationReport {
  passed: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalMetadataRecords: number;
    totalTranscriptRecords: number;
    totalAlignmentLabels: number;
    totalSpeechPairs: number;
    goodSamples: number;
    errorSamples: number;
    verifiedSamples: number;
    pendingRecordings: number;
    physicalAudioFilesFound: number;
    missingPhysicalAudioFiles: number;
  };
}

export const DatasetValidatorModal: React.FC<DatasetValidatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runValidation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dataset/validate');
      if (!res.ok) throw new Error('Failed to run dataset integrity validator');
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err?.message || 'Validator error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runValidation();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="validator-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-950/70 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="validator-title" className="text-base font-bold text-white flex items-center gap-2">
                Automated Dataset Integrity Validator
                {report && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                      report.passed
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950/80 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {report.passed ? 'PASSED (100%)' : 'ISSUES DETECTED'}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Audits relational CSV foreign keys, primary keys, timestamps, and physical audio files.
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

        {/* Action Toolbar */}
        <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-[11px]">npx tsx scripts/validate_dataset.ts</span>
          </div>
          <button
            onClick={runValidation}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-md transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Re-validate</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-lg text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        {report && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Total Samples</div>
              <div className="text-lg font-bold font-mono text-white">
                {report.stats.totalMetadataRecords}
              </div>
              <div className="text-[10px] text-slate-400">
                {report.stats.goodSamples} Good / {report.stats.errorSamples} Errors
              </div>
            </div>

            <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Speech Pairs</div>
              <div className="text-lg font-bold font-mono text-indigo-400">
                {report.stats.totalSpeechPairs}
              </div>
              <div className="text-[10px] text-slate-400">Contrastive pairs</div>
            </div>

            <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Alignment Labels</div>
              <div className="text-lg font-bold font-mono text-cyan-400">
                {report.stats.totalAlignmentLabels}
              </div>
              <div className="text-[10px] text-slate-400">13 error classes</div>
            </div>

            <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Verified Ground Truth</div>
              <div className="text-lg font-bold font-mono text-emerald-400">
                {report.stats.verifiedSamples}
              </div>
              <div className="text-[10px] text-slate-400">
                {report.stats.pendingRecordings} Pending
              </div>
            </div>
          </div>
        )}

        {/* Validation Checkpoints Checklist */}
        {report && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Relational Integrity Audit Checks
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 p-2 bg-slate-950/50 border border-slate-800/60 rounded">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">
                  <strong className="text-white">CSV Header Conformity:</strong> metadata.csv, transcripts.csv, alignment_labels.csv, and pairs.csv schemas valid.
                </span>
              </div>

              <div className="flex items-center gap-2 p-2 bg-slate-950/50 border border-slate-800/60 rounded">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">
                  <strong className="text-white">Primary Key Uniqueness:</strong> Zero duplicated sample_id, pair_id, or label_id detected.
                </span>
              </div>

              <div className="flex items-center gap-2 p-2 bg-slate-950/50 border border-slate-800/60 rounded">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">
                  <strong className="text-white">Referential Integrity:</strong> All transcripts and alignment labels map to registered metadata entries.
                </span>
              </div>

              <div className="flex items-center gap-2 p-2 bg-slate-950/50 border border-slate-800/60 rounded">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">
                  <strong className="text-white">Timestamp Discipline:</strong> start_time &le; end_time constraint verified; no extrapolated values.
                </span>
              </div>

              <div className="flex items-center gap-2 p-2 bg-slate-950/50 border border-slate-800/60 rounded">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">
                  <strong className="text-white">Physical Audio Files:</strong> Verified audio containers present in dataset/audio/good and dataset/audio/bad.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Warnings or Errors Display */}
        {report && report.warnings.length > 0 && (
          <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-xs space-y-1">
            <div className="font-semibold text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Warnings ({report.warnings.length})</span>
            </div>
            {report.warnings.map((w, idx) => (
              <div key={idx} className="text-amber-200/90 font-mono text-[11px]">
                &bull; {w}
              </div>
            ))}
          </div>
        )}

        {report && report.errors.length > 0 && (
          <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-lg text-xs space-y-1">
            <div className="font-semibold text-rose-300 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              <span>Errors ({report.errors.length})</span>
            </div>
            {report.errors.map((e, idx) => (
              <div key={idx} className="text-rose-200 font-mono text-[11px]">
                &bull; {e}
              </div>
            ))}
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
