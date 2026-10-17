import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Sidebar,
  Code2,
  Bot,
  Eye,
  Terminal,
  HelpCircle,
  Command,
  Edit2,
  Check,
  Zap,
  MoreHorizontal,
  LayoutTemplate,
  LayoutGrid,
  Users,
  Github,
  Upload,
  UploadCloud,
  Download,
  Sliders,
  ChevronDown,
  Layers,
  Sparkle
} from 'lucide-react';
import { User } from '../../lib/firebase';
import { CollabParticipant } from '../../types/collaboration';

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
  viewMode: 'agent' | 'ide' | 'canvas' | 'split' | 'brainstorm' | 'terminal' | 'testing' | 'stats';
  setViewMode: (mode: 'agent' | 'ide' | 'canvas' | 'split' | 'brainstorm' | 'terminal' | 'testing' | 'stats') => void;
  onOpenGitHub?: () => void;
  onPushToGitHub?: () => void;
  onOpenCollab?: () => void;
  isCollabActive?: boolean;
  collabParticipants?: CollabParticipant[];
  onOpenCommandPalette?: () => void;
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
  onPushToGitHub,
  onOpenCollab,
  isCollabActive = false,
  collabParticipants = [],
  onOpenCommandPalette,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(projectName);
  const [showHelp, setShowHelp] = useState(false);
  const [showAddonsMenu, setShowAddonsMenu] = useState(false);
  const addonsMenuRef = useRef<HTMLDivElement>(null);

  // Close addons dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addonsMenuRef.current && !addonsMenuRef.current.contains(e.target as Node)) {
        setShowAddonsMenu(false);
      }
    };
    if (showAddonsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddonsMenu]);

  const handleSaveName = () => {
    if (nameValue.trim()) {
      onRenameProject(nameValue.trim());
    } else {
      setNameValue(projectName);
    }
    setIsEditingName(false);
  };

  return (
    <>
      <header className="h-11 bg-[#161b22] border-b border-[#30363d] px-3 flex items-center justify-between select-none text-slate-200 z-20 shrink-0">
        {/* Left: Project Branding & Name */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Subtle Logo Dot */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-xs">
              <Zap className="w-3 h-3 text-white" />
            </div>
          </div>

          {/* Project Name (Editable) */}
          {isEditingName ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                autoFocus
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                className="bg-[#0d1117] border border-sky-500 rounded px-2 py-0.5 text-xs text-white outline-none w-36 font-medium"
              />
              <button
                onClick={handleSaveName}
                className="text-emerald-400 hover:text-emerald-300 p-0.5"
                title="Save Project Name"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setNameValue(projectName);
                setIsEditingName(true);
              }}
              className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-[#21262d] text-xs text-slate-200 hover:text-white transition-colors group truncate max-w-48"
              title="Click to rename project"
            >
              <span className="font-semibold truncate">{projectName}</span>
              <Edit2 className="w-2.5 h-2.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
            </button>
          )}

          {/* Status badge */}
          <span className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 font-mono pl-1 border-l border-[#30363d]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Ready</span>
          </span>
        </div>

        {/* Center: Sleek Quick Command Bar & Primary Run Button */}
        <div className="flex items-center gap-2">
          {/* VS Code / Zed style Quick Command Trigger */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="flex items-center gap-2 px-3 py-1 bg-[#0d1117] hover:bg-[#1a212d] text-slate-400 hover:text-slate-200 border border-[#30363d] hover:border-slate-600 rounded-lg text-xs transition-all w-52 sm:w-64 md:w-80 justify-between shadow-inner"
              title="Search files, actions & settings (Ctrl+Shift+P / ⌘⇧P)"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Command className="w-3 h-3 text-sky-400 shrink-0" />
                <span className="truncate text-[11px]">Search & Run Commands...</span>
              </div>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.2 text-[9px] font-mono bg-[#161b22] text-slate-400 border border-[#30363d] rounded">
                ⌘⇧P
              </kbd>
            </button>
          )}

          {/* Run Sandbox Button */}
          <button
            onClick={onRunPreview}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all shadow-xs shrink-0"
            title="Execute & Refresh Sandbox (Ctrl+S / ⌘S)"
          >
            <Play className="w-3 h-3 fill-white" />
            <span className="hidden sm:inline">Run</span>
          </button>
        </div>

        {/* Right: Layout Panel Toggles, Add-ons Dropdown & Help */}
        <div className="flex items-center gap-1.5">
          {/* Add-ons & Options Dropdown (Cleanly houses secondary tools) */}
          <div className="relative" ref={addonsMenuRef}>
            <button
              onClick={() => setShowAddonsMenu(prev => !prev)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors border ${
                showAddonsMenu
                  ? 'bg-[#21262d] text-sky-300 border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#21262d] border-transparent'
              }`}
              title="Add-ons, Tools & Options"
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline text-[11px]">Add-ons</span>
              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            </button>

            {/* Dropdown Menu */}
            {showAddonsMenu && (
              <div className="absolute right-0 mt-1.5 w-56 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl py-1.5 z-50 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-[#21262d]">
                  Extensions & Addons
                </div>

                <button
                  onClick={() => {
                    onOpenGenerateModal();
                    setShowAddonsMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[#21262d] transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>AI Architect Generator</span>
                </button>

                <button
                  onClick={() => {
                    onOpenTemplatesModal();
                    setShowAddonsMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[#21262d] transition-colors"
                >
                  <LayoutTemplate className="w-3.5 h-3.5 text-amber-400" />
                  <span>Starter Templates</span>
                </button>

                {onOpenCollab && (
                  <button
                    onClick={() => {
                      onOpenCollab();
                      setShowAddonsMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-[#21262d] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Live Pairing</span>
                    </div>
                    {isCollabActive && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1 rounded border border-emerald-800">
                        {collabParticipants.length} online
                      </span>
                    )}
                  </button>
                )}

                {onPushToGitHub && (
                  <button
                    onClick={() => {
                      onPushToGitHub();
                      setShowAddonsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[#21262d] transition-colors text-sky-300"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-sky-400" />
                    <span>Push to GitHub</span>
                  </button>
                )}

                {onOpenGitHub && (
                  <button
                    onClick={() => {
                      onOpenGitHub();
                      setShowAddonsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[#21262d] transition-colors"
                  >
                    <Github className="w-3.5 h-3.5 text-slate-300" />
                    <span>GitHub Hub</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onOpenGallery();
                    setShowAddonsMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[#21262d] transition-colors"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-sky-400" />
                  <span>App Gallery</span>
                </button>

                <div className="my-1 border-t border-[#21262d]" />

                <button
                  onClick={() => {
                    onUploadHtmlClick();
                    setShowAddonsMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[#21262d] transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Upload .html</span>
                </button>

                <button
                  onClick={() => {
                    onDownloadStandaloneHtml();
                    setShowAddonsMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[#21262d] transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export HTML</span>
                </button>
              </div>
            )}
          </div>

          {/* Unified Compact Layout Panel Toggles */}
          <div className="flex items-center bg-[#0d1117] p-0.5 rounded-lg border border-[#30363d]">
            <button
              onClick={() => setShowSidebar(prev => !prev)}
              className={`p-1 rounded transition-colors ${
                showSidebar
                  ? 'bg-[#21262d] text-sky-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle File Explorer (Ctrl+B)"
            >
              <Sidebar className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowEditor(prev => !prev)}
              className={`p-1 rounded transition-colors ${
                showEditor
                  ? 'bg-[#21262d] text-sky-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Code Editor"
            >
              <Code2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowCopilot(prev => !prev)}
              className={`p-1 rounded transition-colors ${
                showCopilot
                  ? 'bg-[#21262d] text-sky-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Gemini Copilot (Ctrl+Shift+G)"
            >
              <Bot className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowPreview(prev => !prev)}
              className={`p-1 rounded transition-colors ${
                showPreview
                  ? 'bg-[#21262d] text-sky-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Live Preview"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowTerminal(prev => !prev)}
              className={`p-1 rounded transition-colors ${
                showTerminal
                  ? 'bg-[#21262d] text-sky-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Integrated Terminal (Ctrl+`)"
            >
              <Terminal className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Help Trigger */}
          <button
            onClick={() => setShowHelp(true)}
            className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-[#21262d] transition-colors"
            title="Keyboard Shortcuts & Manual"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#30363d] mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                <span>Gemini Live IDE Keyboard Shortcuts</span>
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-[#21262d]">
                <span className="text-slate-400">Command Palette</span>
                <span className="font-mono text-sky-300 bg-[#0d1117] px-1.5 py-0.5 rounded border border-[#30363d]">
                  Ctrl+Shift+P / ⌘⇧P
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#21262d]">
                <span className="text-slate-400">Run Sandbox & Save</span>
                <span className="font-mono text-emerald-400 bg-[#0d1117] px-1.5 py-0.5 rounded border border-[#30363d]">
                  Ctrl+S / ⌘S
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#21262d]">
                <span className="text-slate-400">Format Active Code</span>
                <span className="font-mono text-purple-400 bg-[#0d1117] px-1.5 py-0.5 rounded border border-[#30363d]">
                  Alt+Shift+F
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#21262d]">
                <span className="text-slate-400">Toggle Terminal Shell</span>
                <span className="font-mono text-amber-400 bg-[#0d1117] px-1.5 py-0.5 rounded border border-[#30363d]">
                  Ctrl+`
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#21262d]">
                <span className="text-slate-400">Toggle Explorer Sidebar</span>
                <span className="font-mono text-slate-300 bg-[#0d1117] px-1.5 py-0.5 rounded border border-[#30363d]">
                  Ctrl+B / ⌘B
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#21262d]">
                <span className="text-slate-400">Toggle Gemini Copilot</span>
                <span className="font-mono text-sky-400 bg-[#0d1117] px-1.5 py-0.5 rounded border border-[#30363d]">
                  Ctrl+Shift+G
                </span>
              </div>
            </div>

            <div className="mt-5 text-right">
              <button
                onClick={() => setShowHelp(false)}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
