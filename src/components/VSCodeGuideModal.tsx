import React, { useState } from 'react';
import { X, Copy, Check, Terminal, FolderTree, Play, Laptop } from 'lucide-react';

interface VSCodeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VSCodeGuideModal: React.FC<VSCodeGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const terminalCommands = `# 1. Clone or open the project folder in VS Code
cd /path/to/project

# 2. Install all dependencies
npm install

# 3. (Optional) Set your Gemini API key in .env for AI speech coaching
# If skipped, the app still analyzes pauses, speed, and stumbles offline!
echo "GEMINI_API_KEY=your_gemini_api_key_here" >> .env

# 4. Start the full-stack development server
npm run dev

# 5. Open in your browser:
# http://localhost:3000`;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Run AudioPulse on VS Code
              </h2>
              <p className="text-xs text-slate-400">
                Step-by-step instructions to execute this speech analytics dashboard locally
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Quick Terminal Script */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Terminal Setup Commands
              </span>
              <button
                onClick={() => copyToClipboard(terminalCommands, 'terminal')}
                className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono transition-colors"
              >
                {copiedSection === 'terminal' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Commands</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-cyan-300 overflow-x-auto leading-relaxed">
              {terminalCommands}
            </pre>
          </div>

          {/* Architecture Overview */}
          <div className="space-y-2">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
              Key Project Files in VS Code
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded">
                <span className="text-cyan-400 font-bold">server.ts</span>
                <p className="text-slate-400 font-sans mt-0.5">
                  Express backend with Gemini API proxy &amp; fallback algorithmic speech analyzer.
                </p>
              </div>
              <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded">
                <span className="text-cyan-400 font-bold">src/utils/audioAnalyzer.ts</span>
                <p className="text-slate-400 font-sans mt-0.5">
                  Real-time Web Audio API RMS silence &amp; pause detector, decodes any duration file.
                </p>
              </div>
              <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded">
                <span className="text-cyan-400 font-bold">src/utils/speechRecognition.ts</span>
                <p className="text-slate-400 font-sans mt-0.5">
                  Live streaming Speech Recognition, WPM calculation, and filler word dictionary.
                </p>
              </div>
              <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded">
                <span className="text-cyan-400 font-bold">src/App.tsx</span>
                <p className="text-slate-400 font-sans mt-0.5">
                  Full state orchestration connecting live microphone, file upload, &amp; visualizations.
                </p>
              </div>
            </div>
          </div>

          {/* How simultaneous analysis works */}
          <div className="p-3 bg-indigo-950/30 border border-indigo-900/60 rounded text-slate-300 space-y-1.5">
            <span className="font-semibold text-indigo-300">How Simultaneous Analysis Works:</span>
            <p className="text-slate-400 leading-relaxed">
              When you hit <strong>Start Recording</strong> or <strong>Open Audio</strong>, two parallel pipelines execute simultaneously:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li><strong>Web Audio Stream:</strong> Computes instantaneous volume RMS every 25ms, flagging pauses &gt; 0.45s directly into the timeline.</li>
              <li><strong>Web Speech Recognition:</strong> Streams word tokens, calculating real-time Words Per Minute (WPM) and spotting filler &amp; wrong words.</li>
              <li><strong>Any Duration Audio:</strong> Uploaded audio of any length is decoded into PCM chunks to detect all pauses and waveform peaks instantly.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
