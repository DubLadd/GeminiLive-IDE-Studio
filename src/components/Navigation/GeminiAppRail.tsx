import React, { useState } from 'react';
import {
  Sparkles,
  Code2,
  Brain,
  Terminal,
  Github,
  LayoutGrid,
  Cloud,
  ChevronLeft,
  ChevronRight,
  Zap,
  Globe,
  Settings,
  HelpCircle,
  Upload,
  Download,
  Key,
  TestTube2,
  BarChart3,
  LayoutTemplate,
  Users,
  Command,
  Puzzle,
  Check,
  Radio,
  Sliders
} from 'lucide-react';
import { User } from '../../lib/firebase';
import { getStoredGitHubToken } from '../../services/githubService';

export type GeminiNavMode = 'agent' | 'ide' | 'split' | 'brainstorm' | 'terminal' | 'testing' | 'stats';

interface GeminiAppRailProps {
  currentMode: GeminiNavMode;
  onSelectMode: (mode: GeminiNavMode) => void;
  onOpenGenerateModal?: () => void;
  onOpenTemplatesModal?: () => void;
  onOpenCollab?: () => void;
  isCollabActive?: boolean;
  collabParticipantsCount?: number;
  onOpenGitHub: () => void;
  onOpenGallery: () => void;
  onUploadHtml: () => void;
  onDownloadHtml: () => void;
  onOpenCommandPalette?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const GeminiAppRail: React.FC<GeminiAppRailProps> = ({
  currentMode,
  onSelectMode,
  onOpenGenerateModal,
  onOpenTemplatesModal,
  onOpenCollab,
  isCollabActive = false,
  collabParticipantsCount = 0,
  onOpenGitHub,
  onOpenGallery,
  onUploadHtml,
  onDownloadHtml,
  onOpenCommandPalette,
  isCollapsed,
  onToggleCollapse,
  user,
  onSignIn,
  onSignOut,
}) => {
  const hasGitHubToken = Boolean(getStoredGitHubToken());
  const [showExtensionsMenu, setShowExtensionsMenu] = useState(false);

  const navItems = [
    {
      id: 'split' as GeminiNavMode,
      label: 'Live IDE Canvas',
      icon: Code2,
      color: 'text-emerald-400',
      activeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-950/40',
      description: 'Editor + HTML/TS/JS Sandbox',
    },
    {
      id: 'agent' as GeminiNavMode,
      label: 'Gemini Agent',
      icon: Sparkles,
      color: 'text-sky-400',
      activeBg: 'bg-sky-500/10 text-sky-300 border-sky-500/50 shadow-sm shadow-sky-950/40',
      description: 'Autonomous Coding Partner',
    },
    {
      id: 'testing' as GeminiNavMode,
      label: 'Testing Lab',
      icon: TestTube2,
      color: 'text-rose-400',
      activeBg: 'bg-rose-500/10 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-950/40',
      description: 'Vitest unit runner & assertions',
    },
    {
      id: 'brainstorm' as GeminiNavMode,
      label: 'Brainstormer Lab',
      icon: Brain,
      color: 'text-purple-400',
      activeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/50 shadow-sm shadow-purple-950/40',
      description: 'Concept Matrix & Mutations',
    },
    {
      id: 'terminal' as GeminiNavMode,
      label: 'Linux Shell',
      icon: Terminal,
      color: 'text-amber-400',
      activeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-950/40',
      description: 'Bash, Python, Node, Git CLI',
    },
    {
      id: 'stats' as GeminiNavMode,
      label: 'Project Metrics',
      icon: BarChart3,
      color: 'text-cyan-400',
      activeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-950/40',
      description: 'Code metrics & breakdown',
    },
  ];

  return (
    <aside
      className={`h-full bg-[#12161f] border-r border-[#262c36] flex flex-col justify-between transition-all duration-200 select-none z-30 shrink-0 ${
        isCollapsed ? 'w-14' : 'w-60'
      }`}
    >
      {/* Top Header & Brand */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
        {/* Brand Bar */}
        <div className="h-12 px-3 border-b border-[#262c36] flex items-center justify-between shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-xs tracking-tight text-white truncate">
                  GEMINI LIVE
                </span>
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  IDE Studio
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-sky-500/20">
                <Zap className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* SECTION 1: BIG PROMINENT AI & CREATION ACTION BUTTONS */}
        <div className="p-2 space-y-1.5 border-b border-[#262c36]">
          {!isCollapsed && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block">
              Creation Tools
            </span>
          )}

          {/* AI Architect (Big Gradient Feature Button) */}
          {onOpenGenerateModal && (
            <button
              onClick={onOpenGenerateModal}
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold transition-all group shadow-sm ${
                isCollapsed
                  ? 'justify-center bg-gradient-to-tr from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-sky-600/30'
                  : 'bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:from-sky-500 hover:via-indigo-500 hover:to-purple-500 text-white shadow-indigo-900/40'
              }`}
              title="AI Architect: Generate Full Project with Gemini"
            >
              <Sparkles className="w-4 h-4 shrink-0 text-white group-hover:rotate-12 transition-transform" />
              {!isCollapsed && (
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="truncate leading-tight">AI Architect</span>
                  <span className="text-[10px] text-sky-200 font-normal truncate opacity-90">
                    Generate Full Project
                  </span>
                </div>
              )}
            </button>
          )}

          {/* Starter Templates */}
          {onOpenTemplatesModal && (
            <button
              onClick={onOpenTemplatesModal}
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-[#1a202c]/60 hover:bg-[#212836] border border-[#2b3342] transition-all group ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title="Browse Starter Templates"
            >
              <LayoutTemplate className="w-4 h-4 shrink-0 text-amber-400 group-hover:scale-110 transition-transform" />
              {!isCollapsed && (
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="truncate leading-tight">Templates</span>
                  <span className="text-[10px] text-slate-400 font-normal truncate">
                    Starter Sandboxes
                  </span>
                </div>
              )}
            </button>
          )}

          {/* Real-Time Live Collaboration */}
          {onOpenCollab && (
            <button
              onClick={onOpenCollab}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-medium transition-all group ${
                isCollabActive
                  ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-950/50'
                  : 'text-slate-300 hover:text-white bg-[#1a202c]/60 hover:bg-[#212836] border border-[#2b3342]'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={
                isCollabActive
                  ? `Live Pairing Active (${collabParticipantsCount} participants)`
                  : 'Start Live Collaboration Session'
              }
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Users
                  className={`w-4 h-4 shrink-0 ${
                    isCollabActive ? 'text-emerald-400' : 'text-emerald-400 group-hover:scale-110'
                  } transition-transform`}
                />
                {!isCollapsed && (
                  <div className="flex flex-col text-left overflow-hidden">
                    <span className="truncate leading-tight">Live Pairing</span>
                    <span className="text-[10px] text-slate-400 font-normal truncate">
                      {isCollabActive ? `${collabParticipantsCount} online` : 'Multi-user sync'}
                    </span>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isCollabActive
                      ? 'bg-emerald-400 shadow-xs shadow-emerald-400/80 animate-ping'
                      : 'bg-slate-600'
                  }`}
                />
              )}
            </button>
          )}
        </div>

        {/* SECTION 2: WORKSPACE MODES & VIEWS */}
        <div className="p-2 space-y-1 border-b border-[#262c36]">
          {!isCollapsed && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mt-1">
              Workspace Views
            </span>
          )}
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentMode === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectMode(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? `${item.activeBg} border`
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a202c] border border-transparent'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={item.label}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? item.color : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!isCollapsed && (
                  <div className="flex flex-col text-left overflow-hidden">
                    <span className="truncate leading-tight">{item.label}</span>
                    <span className="text-[10px] text-slate-500 font-normal truncate">
                      {item.description}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* SECTION 3: INTEGRATIONS & EXTENSIONS */}
        <div className="p-2 space-y-1">
          {!isCollapsed && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mt-1">
              Hubs & Addons
            </span>
          )}

          {/* GitHub Hub */}
          <button
            onClick={onOpenGitHub}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1a202c] transition-all group ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title="GitHub Integration Hub (Token, Repos, Commits)"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Github className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
              {!isCollapsed && <span className="truncate">GitHub Hub</span>}
            </div>
            {!isCollapsed && (
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  hasGitHubToken
                    ? 'bg-emerald-400 shadow-xs shadow-emerald-400/50'
                    : 'bg-slate-600'
                }`}
                title={hasGitHubToken ? 'Token Connected' : 'No Token'}
              />
            )}
          </button>

          {/* OS App Gallery */}
          <button
            onClick={onOpenGallery}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1a202c] transition-all group ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title="App Gallery & Saved Snapshots"
          >
            <LayoutGrid className="w-4 h-4 shrink-0 text-sky-400" />
            {!isCollapsed && <span className="truncate">OS Gallery</span>}
          </button>

          {/* Import / Upload HTML */}
          <button
            onClick={onUploadHtml}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1a202c] transition-all group ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title="Import .html file from Local Storage"
          >
            <Upload className="w-4 h-4 shrink-0 text-indigo-400" />
            {!isCollapsed && <span className="truncate">Import .html</span>}
          </button>

          {/* Download Standalone HTML */}
          <button
            onClick={onDownloadHtml}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1a202c] transition-all group ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title="Export Standalone HTML to Local Device"
          >
            <Download className="w-4 h-4 shrink-0 text-emerald-400" />
            {!isCollapsed && <span className="truncate">Download Code</span>}
          </button>
        </div>
      </div>

      {/* BOTTOM PROFILE & CONTROLS */}
      <div className="p-2 border-t border-[#262c36] space-y-1.5 bg-[#10141c] shrink-0">
        {/* Command Palette Trigger */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-[#1a202c] transition-colors border border-slate-700/40 ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
            title="Command Palette (Ctrl+Shift+P / ⌘⇧P)"
          >
            <div className="flex items-center gap-2">
              <Command className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              {!isCollapsed && <span>Commands</span>}
            </div>
            {!isCollapsed && (
              <kbd className="px-1 py-0.2 text-[9px] font-mono bg-[#0d1117] text-slate-500 border border-slate-700 rounded">
                ⌘⇧P
              </kbd>
            )}
          </button>
        )}

        {/* User Card */}
        {user ? (
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#161b24] border border-[#2a313d] text-xs">
            {user.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-6 h-6 rounded-full shrink-0" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-sky-600 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                {user.email?.[0].toUpperCase()}
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden">
                <div className="truncate text-slate-200 font-medium text-[11px]">
                  {user.displayName || user.email}
                </div>
                <button
                  onClick={onSignOut}
                  className="text-[10px] text-rose-400 hover:underline"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onSignIn}
            className={`w-full py-1.5 px-2 rounded-xl bg-sky-600/10 hover:bg-sky-600/20 text-sky-400 border border-sky-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isCollapsed ? 'justify-center' : 'justify-center'
            }`}
            title="Sign In with Google"
          >
            <Cloud className="w-3.5 h-3.5 shrink-0" />
            {!isCollapsed && <span>Sign In</span>}
          </button>
        )}

        {/* Rail Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="w-full py-1.5 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-[#1a202c] rounded-lg transition-colors text-xs"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
