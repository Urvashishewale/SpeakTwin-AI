import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  GitBranch,
  Github,
  Users,
  ShieldCheck,
  Terminal,
  FolderGit2,
  ExternalLink,
} from 'lucide-react';

interface GitHubGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubGuideModal: React.FC<GitHubGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const gitInitCommands = `# Step 1: Open VS Code terminal and initialize Git
git init

# Step 2: Add all project files
git add .

# Step 3: Create initial commit
git commit -m "feat: initial commit of AudioPulse professional interview dashboard"

# Step 4: Rename default branch to main
git branch -M main

# Step 5: Link to your GitHub repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/audiopulse-dashboard.git

# Step 6: Push the project to GitHub
git push -u origin main`;

  const teamBranchWorkflow = `# Team Member 1 creates a new feature branch
git checkout -b feature/interview-metrics

# Make edits in VS Code, then stage and commit
git add .
git commit -m "feat: enhance cross-cultural speech scoring"

# Push feature branch to GitHub
git push origin feature/interview-metrics

# Pull latest updates from teammates
git checkout main
git pull origin main`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-white">
              <Github className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Push to GitHub &amp; Add Team Members
              </h2>
              <p className="text-xs text-slate-400">
                Complete workflow to link your VS Code project to a shared team repository on GitHub
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Section 1: Initial Push to GitHub */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Phase 1: Initial Push from VS Code Terminal
              </span>
              <button
                onClick={() => copyText(gitInitCommands, 'init')}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-mono transition-colors"
              >
                {copiedId === 'init' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Script</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-cyan-300 overflow-x-auto leading-relaxed">
              {gitInitCommands}
            </pre>
          </div>

          {/* Section 2: Adding All Team Members */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg space-y-3">
            <span className="font-semibold text-slate-200 flex items-center gap-2 text-xs">
              <Users className="w-4 h-4 text-indigo-400" />
              Phase 2: Adding All Members to One Shared Repository
            </span>
            <p className="text-slate-400 leading-relaxed">
              Once you push the code to your GitHub account, grant your teammates access so everyone can code together:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
              <li>
                Open your repository on <strong>GitHub.com</strong> in your browser.
              </li>
              <li>
                Click on the <strong>Settings</strong> tab at the top right of the repository.
              </li>
              <li>
                In the left sidebar, click <strong>Collaborators</strong> (under Access).
              </li>
              <li>
                Click <strong>Add people</strong> (the green button).
              </li>
              <li>
                Type your teammates&rsquo; <strong>GitHub usernames or email addresses</strong> and click <strong>Add to this repository</strong>.
              </li>
              <li>
                Your team members will receive an invite email or notification on GitHub to accept!
              </li>
            </ol>
          </div>

          {/* Section 3: Team Branching & Conflict-Free Workflow */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-purple-400" />
                Phase 3: Multi-Member Team Workflow
              </span>
              <button
                onClick={() => copyText(teamBranchWorkflow, 'branch')}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-mono transition-colors"
              >
                {copiedId === 'branch' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Workflow</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-purple-300 overflow-x-auto leading-relaxed">
              {teamBranchWorkflow}
            </pre>
          </div>

          {/* Security & Gitignore note */}
          <div className="flex items-start gap-2.5 p-3 bg-emerald-950/25 border border-emerald-900/40 rounded text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-emerald-300">Safe for Public / Team GitHub:</span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                The <code className="text-slate-200 font-mono">.gitignore</code> file is already configured so that <code className="text-slate-200 font-mono">node_modules</code>, build artifacts, and private environment variables are never exposed on GitHub.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
