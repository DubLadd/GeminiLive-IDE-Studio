import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  RotateCcw,
  Sidebar,
  Code2,
  Bot,
  Eye,
  Download,
  LayoutTemplate,
  Edit2,
  Check,
  Zap,
  Brain,
  Terminal,
  HelpCircle,
  LayoutGrid,
  Upload,
  LogIn,
  LogOut,
  Cloud
} from 'lucide-react';
import { User } from '../../lib/firebase';

interface TopBarProps {
  projectName: string;
  onRenameProject: (name: string) => void;
  onRunPreview: () => void;
  onOpenGenerateModal: () => void;
  onOpenTemplatesModal: () => void;
  onOpenGallery: () => void;
  onExportProject: () => void;
  onDownloadStandaloneHtml: () => void;
  onUploadHtmlClick: () => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  showSidebar: boolean;
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  showCopilot: boolean;
  setShowCopilot: React.Dispatch<React.SetStateAction<boolean>>;
  showPreview: boolean;
  setShowPreview: React.Dispatch<React.SetStateAction<boolean>>;
  showEditor: boolean;
  setShowEditor: React.Dispatch<React.SetStateAction<boolean>>;
  showTerminal: boolean;
  setShowTerminal: React.Dispatch<React.SetStateAction<boolean>>;
  viewMode: 'agent' | 'ide' | 'canvas' | 'split' | 'brainstorm' | 'terminal';
  setViewMode: (mode: 'agent' | 'ide' | 'canvas' | 'split' | 'brainstorm' | 'terminal') => void;
  onOpenGitHub?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  projectName,
  onRenameProject,
  onRunPreview,
  onOpenGenerateModal,
  onOpenTemplatesModal,
  onOpenGallery,
  onExportProject,
  onDownloadStandaloneHtml,
  onUploadHtmlClick,
  user,
  onSignIn,
  onSignOut,
  showSidebar,
  setShowSidebar,
  showCopilot,
  setShowCopilot,
  showPreview,
  setShowPreview,
  showEditor,
  setShowEditor,
  showTerminal,
  setShowTerminal,
  viewMode,
  setViewMode,
  onOpenGitHub,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(projectName);
  const [showHelp, setShowHelp] = useState(false);

  const handleSaveName = () => {
    if (nameValue.trim()) {
      onRenameProject(nameValue.trim());
    }
    setIsEditingName(false);
  };

  return (
    <>
      <header className="h-12 bg-[#161b22] border-b border-[#30363d] px-3 flex items-center justify-between select-none text-slate-200 z-20">
        {/* Left: Brand & Project Name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 font-bold tracking-tight text-xs text-slate-100">
                <span>GEMINI LIVE IDE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">v2.5 Creative Lab</span>
            </div>
          </div>

          <span className="text-slate-600">/</span>

          {/* Project Name */}
          {isEditingName ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                autoFocus
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                className="bg-[#0d1117] border border-sky-500 rounded px-2 py-0.5 text-xs text-white outline-none w-36"
              />
              <button onClick={handleSaveName} className="text-emerald-400 hover:text-emerald-300">
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setNameValue(projectName);
                setIsEditingName(true);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#21262d] text-xs text-slate-300 hover:text-white transition-colors"
              title="Rename Project"
            >
              <span className="font-medium truncate max-w-44">{projectName}</span>
              <Edit2 className="w-3 h-3 text-slate-500" />
            </button>
          )}
        </div>

        {/* Center: View Mode Segmented Switcher & Action Buttons */}
        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-[#0d1117] p-0.5 rounded-lg border border-[#30363d] mr-1">
            <button
              onClick={() => setViewMode('agent')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'agent'
                  ? 'bg-sky-600/30 text-sky-200 border border-sky-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Gemini Agent OS // Coding Partner"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Gemini Agent</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'split' || viewMode === 'ide'
                  ? 'bg-[#21262d] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Live IDE Canvas (Code + Live HTML/TS/JS Sandbox)"
            >
              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live IDE</span>
            </button>
            <button
              onClick={() => setViewMode('brainstorm')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'brainstorm' || viewMode === 'canvas'
                  ? 'bg-purple-900/40 text-purple-200 border border-purple-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Brainstormer Pro X // Playground Engine"
            >
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>Brainstormer</span>
            </button>
            <button
              onClick={() => setViewMode('terminal')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'terminal'
                  ? 'bg-amber-900/40 text-amber-200 border border-amber-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Linux Terminal Shell"
            >
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>Shell</span>
            </button>
          </div>

          {/* Run Preview */}
          <button
            onClick={onRunPreview}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
            title="Execute & Refresh Sandbox (Ctrl+S / ⌘S)"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Run Sandbox</span>
          </button>

          {/* GitHub Hub */}
          {onOpenGitHub && (
            <button
              onClick={onOpenGitHub}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-medium transition-all"
              title="GitHub Integration Hub (Token, Repos, Commits)"
            >
              <Cloud className="w-3.5 h-3.5 text-sky-400" />
              <span>GitHub</span>
            </button>
          )}

          {/* App Gallery */}
          <button
            onClick={onOpenGallery}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-sky-300 hover:text-white border border-sky-500/20 rounded-lg text-xs font-medium transition-all"
            title="Open App Gallery & OS Storage"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-sky-400" />
            <span>App Gallery</span>
          </button>

          {/* AI Architect */}
          <button
            onClick={onOpenGenerateModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-lg text-xs font-medium transition-all shadow-md shadow-sky-600/20"
            title="Generate a full project with Gemini"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Architect</span>
          </button>

          {/* Templates */}
          <button
            onClick={onOpenTemplatesModal}
            className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white rounded-lg text-xs transition-colors"
            title="Browse Starter Templates"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>Templates</span>
          </button>
        </div>

        {/* Right: Storage, Auth & Layout Panel Toggles */}
        <div className="flex items-center gap-2">
          {/* Upload HTML Quick Trigger */}
          <button
            onClick={onUploadHtmlClick}
            className="p-1.5 bg-[#21262d] hover:bg-[#30363d] text-sky-400 hover:text-sky-300 rounded-lg transition-colors"
            title="Upload .html file from Phone / Laptop"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          {/* Download Standalone HTML */}
          <button
            onClick={onDownloadStandaloneHtml}
            className="p-1.5 bg-[#21262d] hover:bg-[#30363d] text-emerald-400 hover:text-emerald-300 rounded-lg transition-colors"
            title="Download Standalone .html File to Storage"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Firebase Google Auth Profile */}
          {user ? (
            <div className="flex items-center gap-1.5 bg-[#0d1117] border border-[#30363d] pl-1 pr-2 py-0.5 rounded-full text-xs">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-5 h-5 rounded-full" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {user.email?.[0].toUpperCase()}
                </div>
              )}
              <span className="text-[11px] text-slate-300 font-medium max-w-20 truncate">
                {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
              </span>
              <button
                onClick={onSignOut}
                className="text-slate-400 hover:text-rose-400 transition-colors p-0.5"
                title="Sign Out"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 rounded-lg text-xs font-medium transition-all"
              title="Sign in with Google to enable Firestore cloud sync and Google Workspace"
            >
              <LogIn className="w-3 h-3" />
              <span>Sign In</span>
            </button>
          )}

          {/* Panel toggles */}
          <div className="flex items-center bg-[#0d1117] p-0.5 rounded-lg border border-[#30363d]">
            <button
              onClick={() => setShowSidebar(prev => !prev)}
              className={`p-1.5 rounded transition-colors ${
                showSidebar ? 'bg-[#21262d] text-sky-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle File Explorer"
            >
              <Sidebar className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowEditor(prev => !prev)}
              className={`p-1.5 rounded transition-colors ${
                showEditor ? 'bg-[#21262d] text-sky-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Code Editor"
            >
              <Code2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowCopilot(prev => !prev)}
              className={`p-1.5 rounded transition-colors ${
                showCopilot ? 'bg-[#21262d] text-sky-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Gemini Copilot"
            >
              <Bot className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowPreview(prev => !prev)}
              className={`p-1.5 rounded transition-colors ${
                showPreview ? 'bg-[#21262d] text-sky-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Live Preview"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowTerminal(prev => !prev)}
              className={`p-1.5 rounded transition-colors ${
                showTerminal ? 'bg-[#21262d] text-sky-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Integrated Terminal"
            >
              <Terminal className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setShowHelp(true)}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-[#21262d] transition-colors"
            title="Keyboard Shortcuts & Help"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#30363d] mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                <span>Gemini Live IDE & Brainstormer Pro X</span>
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-[#21262d]">
                <span className="text-slate-400">Upload .html</span>
                <span className="font-mono text-sky-300">Phone & Laptop Storage Pickers</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#21262d]">
                <span className="text-slate-400">Save in OS / App Gallery</span>
                <span className="font-mono text-sky-300">Local OS + Firestore Cloud</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#21262d]">
                <span className="text-slate-400">Download Single HTML</span>
                <span className="font-mono text-sky-300">Works 100% Offline Anywhere</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#21262d]">
                <span className="text-slate-400">Run Sandbox</span>
                <span className="font-mono text-sky-400">Ctrl + S / ⌘ + S</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#21262d]">
                <span className="text-slate-400">Brainstorm Canvas Slash Bar</span>
                <span className="font-mono text-purple-400">/ or !</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#21262d]">
                <span className="text-slate-400">Google Workspace Sync</span>
                <span className="font-mono text-amber-400">Drive & Docs Integration</span>
              </div>
            </div>

            <div className="mt-5 text-right">
              <button
                onClick={() => setShowHelp(false)}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
