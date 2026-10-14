/**
 * SpeakTwin AI — Export Dataset Modal
 * Exports metadata, transcripts, alignment labels, and pairs as standardized CSVs
 * with repository export instructions.
 */

import React from 'react';
import { X, FileDown, CheckCircle, Database, Github, Code, ExternalLink } from 'lucide-react';
import { DatasetSummaryStats } from '../../types/dataset';

interface ExportDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: DatasetSummaryStats | null;
}

export const ExportDatasetModal: React.FC<ExportDatasetModalProps> = ({
  isOpen,
  onClose,
  summary,
}) => {
  if (!isOpen) return null;

  const handleDownloadCsv = (table: string) => {
    window.location.href = `/api/dataset/export/csv/${table}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Export SpeakTwin AI Dataset</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Download standardized CSV tables and prepare files for repository commit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Dataset Status Banner */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">Current Dataset Metrics</span>
              <span className="text-xs font-mono text-cyan-400">
                {summary?.totalSamples || 0} registered samples
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60">
                <div className="text-slate-400 text-[11px]">Good Speech</div>
                <div className="font-mono font-bold text-emerald-400">{summary?.goodSpeechCount || 0}</div>
              </div>
              <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60">
                <div className="text-slate-400 text-[11px]">Error Speech</div>
                <div className="font-mono font-bold text-rose-400">{summary?.errorSpeechCount || 0}</div>
              </div>
              <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60">
                <div className="text-slate-400 text-[11px]">Verified</div>
                <div className="font-mono font-bold text-cyan-400">{summary?.verifiedCount || 0}</div>
              </div>
              <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60">
                <div className="text-slate-400 text-[11px]">Speech Pairs</div>
                <div className="font-mono font-bold text-purple-400">{summary?.audioPairsCount || 0}</div>
              </div>
            </div>
          </div>

          {/* Download CSV Files List */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Download Normalized CSV Tables
            </h3>

            {[
              {
                id: 'metadata',
                name: 'metadata.csv',
                desc: 'Acoustic parameters, sample IDs, durations, formats, and lifecycle states',
              },
              {
                id: 'transcripts',
                name: 'transcripts.csv',
                desc: 'Original ASR transcripts, human verified spoken text, and corrected reference targets',
              },
              {
                id: 'alignment_labels',
                name: 'alignment_labels.csv',
                desc: 'Fine-grained word and sentence alignment tags across all 13 error categories',
              },
              {
                id: 'pairs',
                name: 'pairs.csv',
                desc: 'Contrastive pairs linking Good Speech and Error speech counterparts',
              },
            ].map((tbl) => (
              <div
                key={tbl.id}
                className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="text-xs font-semibold text-white font-mono">{tbl.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{tbl.desc}</div>
                </div>
                <button
                  onClick={() => handleDownloadCsv(tbl.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 text-xs font-medium rounded transition-colors shrink-0"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            ))}
          </div>

          {/* Git Workflow Box */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Github className="w-4 h-4 text-purple-400" />
              <span>How to Commit Dataset & Audio to GitHub</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Audio files and CSV updates are stored directly in your workspace under{' '}
              <code className="text-cyan-400 font-mono">dataset/</code>. To commit your latest recordings
              to the repository:
            </p>
            <pre className="bg-slate-900 border border-slate-800/80 rounded p-2.5 text-[11px] font-mono text-slate-300 overflow-x-auto">
{`git add dataset/ metadata.csv transcripts.csv alignment_labels.csv pairs.csv
git add dataset/audio/
git commit -m "data: update SpeakTwin AI speech corpus with new recordings"
git push origin main`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-950">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
