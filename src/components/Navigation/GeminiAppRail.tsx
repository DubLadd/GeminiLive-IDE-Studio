import React from 'react';
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
  Key
} from 'lucide-react';
import { User } from '../../lib/firebase';
import { getStoredGitHubToken } from '../../services/githubService';

export type GeminiNavMode = 'agent' | 'ide' | 'split' | 'brainstorm' | 'terminal';

interface GeminiAppRailProps {
  currentMode: GeminiNavMode;
  onSelectMode: (mode: GeminiNavMode) => void;
  onOpenGitHub: () => void;
  onOpenGallery: () => void;
  onUploadHtml: () => void;
  onDownloadHtml: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const GeminiAppRail: React.FC<GeminiAppRailProps> = ({
  currentMode,
  onSelectMode,
  onOpenGitHub,
  onOpenGallery,
  onUploadHtml,
  onDownloadHtml,
  isCollapsed,
  onToggleCollapse,
  user,
  onSignIn,
  onSignOut,
}) => {
  const hasGitHubToken = Boolean(getStoredGitHubToken());

  const navItems = [
    {
      id: 'agent' as GeminiNavMode,
      label: 'Gemini Agent',
      icon: Sparkles,
      color: 'text-sky-400',
      activeBg: 'bg-sky-500/10 text-sky-300 border-sky-500/50',
      description: 'Autonomous Coding Partner',
    },
    {
      id: 'split' as GeminiNavMode,
      label: 'Live IDE Canvas',
      icon: Code2,
      color: 'text-emerald-400',
      activeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/50',
      description: 'Editor + HTML/TS/JS Sandbox',
    },
    {
      id: 'brainstorm' as GeminiNavMode,
      label: 'Brainstormer Lab',
      icon: Brain,
      color: 'text-purple-400',
      activeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/50',
      description: 'Concept Matrix & Mutations',
    },
    {
      id: 'terminal' as GeminiNavMode,
      label: 'Linux Shell',
      icon: Terminal,
      color: 'text-amber-400',
      activeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/50',
      description: 'Nano, Python, Node, Git',
    },
  ];

  return (
    <aside
      className={`h-full bg-[#12161f] border-r border-[#262c36] flex flex-col justify-between transition-all duration-200 select-none z-30 shrink-0 ${
        isCollapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* Top Header / Brand */}
      <div>
        <div className="h-12 px-3 border-b border-[#262c36] flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-xs tracking-tight text-white truncate">
                Gemini Workspace
              </span>
            </div>
          )}
          {isCollapsed && (
            <div className="w-full flex justify-center">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Core Navigation Items */}
        <div className="p-2 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentMode === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectMode(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? `${item.activeBg} border shadow-xs`
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a202c] border border-transparent'
                }`}
                title={item.label}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? item.color : 'text-slate-400 group-hover:text-slate-200'}`} />
                {!isCollapsed && (
                  <div className="flex flex-col text-left overflow-hidden">
                    <span className="truncate">{item.label}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Separator */}
        <div className="my-2 border-t border-[#262c36] mx-2" />

        {/* Integrations & Tools */}
        <div className="p-2 space-y-1">
          {/* GitHub Hub */}
          <button
            onClick={onOpenGitHub}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1a202c] transition-all group"
            title="GitHub Integration Hub"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Github className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
              {!isCollapsed && <span className="truncate">GitHub Hub</span>}
            </div>
            {!isCollapsed && (
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  hasGitHubToken ? 'bg-emerald-400 shadow-xs shadow-emerald-400/50' : 'bg-slate-600'
                }`}
                title={hasGitHubToken ? 'Token Connected' : 'No Token'}
              />
            )}
          </button>

          {/* App Gallery */}
          <button
            onClick={onOpenGallery}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1a202c] transition-all group"
            title="App Gallery & OS Storage"
          >
            <LayoutGrid className="w-4 h-4 shrink-0 text-sky-400" />
            {!isCollapsed && <span className="truncate">OS Gallery</span>}
          </button>

          {/* Upload HTML */}
          <button
            onClick={onUploadHtml}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1a202c] transition-all group"
            title="Upload .html file from Phone / Laptop"
          >
            <Upload className="w-4 h-4 shrink-0 text-indigo-400" />
            {!isCollapsed && <span className="truncate">Import .html</span>}
          </button>

          {/* Download Code */}
          <button
            onClick={onDownloadHtml}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1a202c] transition-all group"
            title="Export Standalone HTML"
          >
            <Download className="w-4 h-4 shrink-0 text-emerald-400" />
            {!isCollapsed && <span className="truncate">Download Code</span>}
          </button>
        </div>
      </div>

      {/* Bottom Profile & Collapse Toggle */}
      <div className="p-2 border-t border-[#262c36] space-y-2">
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
            className="w-full py-1.5 px-2 rounded-xl bg-sky-600/10 hover:bg-sky-600/20 text-sky-400 border border-sky-500/30 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            title="Sign In with Google"
          >
            <Cloud className="w-3.5 h-3.5" />
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
