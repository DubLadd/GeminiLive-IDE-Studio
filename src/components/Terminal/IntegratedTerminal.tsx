import React, { useState, useEffect, useRef } from 'react';
import { ProjectFile } from '../../types/ide';
import {
  Terminal as TerminalIcon,
  ChevronDown,
  Maximize2,
  Minimize2,
  Trash2,
  Play,
  X,
  Sparkles,
  Layers,
  Folder,
  FileCode,
  TerminalSquare,
  CheckCircle2,
  ArrowRight,
  Code,
  Palette,
  Search,
  Columns2,
  Rows2,
  CheckCircle,
  AlertCircle,
  AlignJustify
} from 'lucide-react';
import { NanoEditor } from './NanoEditor';
import {
  modeToPermissions,
  executePythonCode,
  executeNodeCode,
} from '../../utils/terminalExecutors';

export type TerminalThemeId =
  | 'vscode-dark-plus'
  | 'vscode-light-plus'
  | 'vscode-high-contrast'
  | 'vscode-monokai'
  | 'vscode-abyss'
  | 'github-dark'
  | 'dracula'
  | 'solarized-dark'
  | 'nord'
  | 'monokai'
  | 'cyberpunk';

export interface TerminalThemeConfig {
  id: TerminalThemeId;
  name: string;
  badge: string;
  headerBg: string;
  headerBorder: string;
  bodyBg: string;
  inputBg: string;
  promptColor: string;
  outputColor: string;
  inputTextColor: string;
  accentColor: string;
  activeTabBg: string;
  quickChipBg: string;
  quickChipHover: string;
  quickChipBorder: string;
  quickChipText: string;
}

export const TERMINAL_THEMES: Record<TerminalThemeId, TerminalThemeConfig> = {
  'vscode-dark-plus': {
    id: 'vscode-dark-plus',
    name: 'VS Code Dark+ (Default)',
    badge: '#007acc',
    headerBg: 'bg-[#252526]',
    headerBorder: 'border-[#3c3c3c]',
    bodyBg: 'bg-[#1e1e1e]',
    inputBg: 'bg-[#181818]',
    promptColor: 'text-[#4ec9b0]',
    outputColor: 'text-[#cccccc]',
    inputTextColor: 'text-[#d4d4d4]',
    accentColor: '#007acc',
    activeTabBg: 'bg-[#1e1e1e]',
    quickChipBg: 'bg-[#252526]',
    quickChipHover: 'hover:bg-[#2a2d2e]',
    quickChipBorder: 'border-[#3c3c3c]',
    quickChipText: 'text-[#cccccc] hover:text-[#4ec9b0]',
  },
  'vscode-light-plus': {
    id: 'vscode-light-plus',
    name: 'VS Code Light+',
    badge: '#007acc',
    headerBg: 'bg-[#f3f3f3]',
    headerBorder: 'border-[#e5e5e5]',
    bodyBg: 'bg-[#ffffff]',
    inputBg: 'bg-[#f8f8f8]',
    promptColor: 'text-[#008000]',
    outputColor: 'text-[#333333]',
    inputTextColor: 'text-[#111111]',
    accentColor: '#007acc',
    activeTabBg: 'bg-[#ffffff]',
    quickChipBg: 'bg-[#f3f3f3]',
    quickChipHover: 'hover:bg-[#e8e8e8]',
    quickChipBorder: 'border-[#dcdcdc]',
    quickChipText: 'text-[#333333] hover:text-[#008000]',
  },
  'vscode-high-contrast': {
    id: 'vscode-high-contrast',
    name: 'VS Code High Contrast',
    badge: '#00ffff',
    headerBg: 'bg-[#000000]',
    headerBorder: 'border-[#6fc3df]',
    bodyBg: 'bg-[#000000]',
    inputBg: 'bg-[#0a0a0a]',
    promptColor: 'text-[#00ffff]',
    outputColor: 'text-[#ffffff]',
    inputTextColor: 'text-[#ffff00]',
    accentColor: '#ffff00',
    activeTabBg: 'bg-[#0e639c]/50',
    quickChipBg: 'bg-[#000000]',
    quickChipHover: 'hover:bg-[#1a1a1a]',
    quickChipBorder: 'border-[#6fc3df]',
    quickChipText: 'text-[#ffffff] hover:text-[#00ffff]',
  },
  'vscode-monokai': {
    id: 'vscode-monokai',
    name: 'VS Code Monokai',
    badge: '#f92672',
    headerBg: 'bg-[#272822]',
    headerBorder: 'border-[#3e3d32]',
    bodyBg: 'bg-[#1e1f1c]',
    inputBg: 'bg-[#171814]',
    promptColor: 'text-[#a6e22e]',
    outputColor: 'text-[#f8f8f2]',
    inputTextColor: 'text-[#f8f8f2]',
    accentColor: '#f92672',
    activeTabBg: 'bg-[#3e3d32]',
    quickChipBg: 'bg-[#272822]',
    quickChipHover: 'hover:bg-[#3e3d32]',
    quickChipBorder: 'border-[#75715e]/50',
    quickChipText: 'text-[#f8f8f2] hover:text-[#a6e22e]',
  },
  'vscode-abyss': {
    id: 'vscode-abyss',
    name: 'VS Code Abyss',
    badge: '#6688cc',
    headerBg: 'bg-[#051336]',
    headerBorder: 'border-[#102a6b]',
    bodyBg: 'bg-[#000c18]',
    inputBg: 'bg-[#00060d]',
    promptColor: 'text-[#22aa44]',
    outputColor: 'text-[#80a0ff]',
    inputTextColor: 'text-[#e0e8ff]',
    accentColor: '#80a0ff',
    activeTabBg: 'bg-[#102a6b]',
    quickChipBg: 'bg-[#051336]',
    quickChipHover: 'hover:bg-[#102a6b]',
    quickChipBorder: 'border-[#18398b]',
    quickChipText: 'text-[#a0c0ff] hover:text-[#ffffff]',
  },
  'github-dark': {
    id: 'github-dark',
    name: 'GitHub Dark',
    badge: '#238636',
    headerBg: 'bg-[#161b22]',
    headerBorder: 'border-[#30363d]',
    bodyBg: 'bg-[#0d1117]',
    inputBg: 'bg-[#090d16]',
    promptColor: 'text-emerald-400',
    outputColor: 'text-slate-300',
    inputTextColor: 'text-slate-100',
    accentColor: '#3fb950',
    activeTabBg: 'bg-[#21262d]',
    quickChipBg: 'bg-[#161b22]',
    quickChipHover: 'hover:bg-[#21262d]',
    quickChipBorder: 'border-[#30363d]',
    quickChipText: 'text-slate-300 hover:text-emerald-300',
  },
  dracula: {
    id: 'dracula',
    name: 'Dracula',
    badge: '#bd93f9',
    headerBg: 'bg-[#21222c]',
    headerBorder: 'border-[#44475a]',
    bodyBg: 'bg-[#282a36]',
    inputBg: 'bg-[#1e1f29]',
    promptColor: 'text-[#50fa7b]',
    outputColor: 'text-[#f8f8f2]',
    inputTextColor: 'text-[#f8f8f2]',
    accentColor: '#bd93f9',
    activeTabBg: 'bg-[#44475a]',
    quickChipBg: 'bg-[#21222c]',
    quickChipHover: 'hover:bg-[#44475a]',
    quickChipBorder: 'border-[#6272a4]',
    quickChipText: 'text-[#f8f8f2] hover:text-[#50fa7b]',
  },
  'solarized-dark': {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    badge: '#268bd2',
    headerBg: 'bg-[#073642]',
    headerBorder: 'border-[#586e75]/40',
    bodyBg: 'bg-[#002b36]',
    inputBg: 'bg-[#00212b]',
    promptColor: 'text-[#859900]',
    outputColor: 'text-[#93a1a1]',
    inputTextColor: 'text-[#eee8d5]',
    accentColor: '#2aa198',
    activeTabBg: 'bg-[#073642]',
    quickChipBg: 'bg-[#073642]',
    quickChipHover: 'hover:bg-[#586e75]/30',
    quickChipBorder: 'border-[#586e75]/50',
    quickChipText: 'text-[#93a1a1] hover:text-[#2aa198]',
  },
  nord: {
    id: 'nord',
    name: 'Nord',
    badge: '#88c0d0',
    headerBg: 'bg-[#2e3440]',
    headerBorder: 'border-[#4c566a]',
    bodyBg: 'bg-[#242933]',
    inputBg: 'bg-[#1e222a]',
    promptColor: 'text-[#a3be8c]',
    outputColor: 'text-[#d8dee9]',
    inputTextColor: 'text-[#eceff4]',
    accentColor: '#88c0d0',
    activeTabBg: 'bg-[#434c5e]',
    quickChipBg: 'bg-[#2e3440]',
    quickChipHover: 'hover:bg-[#3b4252]',
    quickChipBorder: 'border-[#4c566a]',
    quickChipText: 'text-[#d8dee9] hover:text-[#88c0d0]',
  },
  monokai: {
    id: 'monokai',
    name: 'Monokai',
    badge: '#a6e22e',
    headerBg: 'bg-[#272822]',
    headerBorder: 'border-[#3e3d32]',
    bodyBg: 'bg-[#1e1f1c]',
    inputBg: 'bg-[#171814]',
    promptColor: 'text-[#a6e22e]',
    outputColor: 'text-[#f8f8f2]',
    inputTextColor: 'text-[#f8f8f2]',
    accentColor: '#fd971f',
    activeTabBg: 'bg-[#3e3d32]',
    quickChipBg: 'bg-[#272822]',
    quickChipHover: 'hover:bg-[#3e3d32]',
    quickChipBorder: 'border-[#75715e]/50',
    quickChipText: 'text-[#f8f8f2] hover:text-[#a6e22e]',
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    badge: '#ff007f',
    headerBg: 'bg-[#1a0826]',
    headerBorder: 'border-[#ff007f]/40',
    bodyBg: 'bg-[#100318]',
    inputBg: 'bg-[#0a0010]',
    promptColor: 'text-[#00ffff]',
    outputColor: 'text-[#ff79c6]',
    inputTextColor: 'text-[#f8f8f2]',
    accentColor: '#00ffff',
    activeTabBg: 'bg-[#ff007f]/20',
    quickChipBg: 'bg-[#1a0826]',
    quickChipHover: 'hover:bg-[#ff007f]/30',
    quickChipBorder: 'border-[#ff007f]/50',
    quickChipText: 'text-[#ff79c6] hover:text-[#00ffff]',
  },
};

const TERMINAL_HISTORY_STORAGE_KEY = 'gemini_terminal_command_history';
const TERMINAL_THEME_STORAGE_KEY = 'gemini_terminal_theme_preset';
const TERMINAL_GLOBAL_PKGS_STORAGE_KEY = 'gemini_terminal_global_packages';

function highlightTerminalEntities(text: string, theme: TerminalThemeConfig) {
  const tokenRegex = /(https?:\/\/[^\s]+)|(\b(?:src|components|utils|data|types|lib|dist)\/[^\s:]+)|(\b[a-zA-Z0-9_\-\.]+\.(?:ts|tsx|js|jsx|json|sql|yaml|yml|html|css|md)\b)|(\[\d{1,2}:\d{2}:\d{2}(?:\s*[AP]M)?\])/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const [, url, path, file, timestamp] = match;

    if (url) {
      parts.push(
        <span key={match.index} className="text-sky-400 underline underline-offset-2 hover:text-sky-300 font-medium">
          {url}
        </span>
      );
    } else if (path || file) {
      parts.push(
        <span key={match.index} className="text-amber-300 bg-amber-500/10 px-1 py-0.5 rounded text-[11px] font-mono">
          {path || file}
        </span>
      );
    } else if (timestamp) {
      parts.push(
        <span key={match.index} className="text-slate-500 font-mono text-[10px] select-none">
          {timestamp}
        </span>
      );
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

function renderReadableTerminalLine(lineText: string, lineType: string, theme: TerminalThemeConfig) {
  // 1. Error messages
  if (lineType === 'error' || lineText.startsWith('Error:') || lineText.startsWith('ERR!') || lineText.includes('command not found') || lineText.includes('failed')) {
    return (
      <div className="flex items-start gap-1.5 pl-2 py-0.5 my-0.5 border-l-2 border-rose-500 bg-rose-500/10 text-rose-300 font-mono text-xs rounded-r">
        <span className="text-rose-400 font-bold select-none shrink-0">✖</span>
        <span className="whitespace-pre-wrap break-all leading-relaxed">{lineText}</span>
      </div>
    );
  }

  // 2. Success messages
  if (lineType === 'success' || lineText.startsWith('✓') || lineText.includes('[SUCCESS]') || lineText.includes('Build succeeded') || lineText.includes('written to workspace') || lineText.includes('found 0 vulnerabilities') || lineText.includes('Everything up to date')) {
    return (
      <div className="flex items-start gap-1.5 pl-2 py-0.5 my-0.5 border-l-2 border-emerald-500 bg-emerald-500/10 text-emerald-300 font-mono text-xs rounded-r">
        <span className="text-emerald-400 font-bold select-none shrink-0">✓</span>
        <span className="whitespace-pre-wrap break-all leading-relaxed">{lineText}</span>
      </div>
    );
  }

  // 3. Info / Notices
  if (lineType === 'info') {
    return (
      <div className="flex items-start gap-1.5 pl-1.5 text-sky-400 font-mono text-xs whitespace-pre-wrap break-all leading-relaxed">
        <span className="select-none text-sky-500 font-bold">ℹ</span>
        <span>{lineText}</span>
      </div>
    );
  }

  // 4. Multi-line output formatting (git log, diff, ps, tree, etc.)
  const rawSubLines = lineText.split('\n');
  if (rawSubLines.length > 1) {
    return (
      <div className={`space-y-0.5 font-mono text-xs leading-relaxed ${theme.outputColor}`}>
        {rawSubLines.map((sub, idx) => {
          // Git commit line
          if (sub.startsWith('commit ')) {
            return (
              <div key={idx} className="flex items-center gap-1.5 text-amber-300 font-semibold pt-1">
                <span className="text-amber-500">commit</span>
                <span className="bg-amber-500/10 px-1 py-0.2 rounded text-[11px] font-mono">{sub.substring(7)}</span>
              </div>
            );
          }
          // Git branch
          if (sub.startsWith('* ')) {
            return (
              <div key={idx} className="text-emerald-400 font-bold flex items-center gap-1">
                <span>*</span>
                <span className="bg-emerald-500/10 px-1.5 py-0.5 rounded text-emerald-300">{sub.substring(2)}</span>
                <span className="text-[10px] text-emerald-500/80 font-normal">(active branch)</span>
              </div>
            );
          }
          // Git diff additions / deletions
          if (sub.startsWith('+') && !sub.startsWith('+++')) {
            return <div key={idx} className="text-emerald-400 bg-emerald-500/10 px-1 rounded">{sub}</div>;
          }
          if (sub.startsWith('-') && !sub.startsWith('---')) {
            return <div key={idx} className="text-rose-400 bg-rose-500/10 px-1 rounded">{sub}</div>;
          }
          // npm tree lines
          if (sub.includes('├──') || sub.includes('└──')) {
            return (
              <div key={idx} className="text-sky-300 pl-1 font-mono">
                {sub}
              </div>
            );
          }
          // Table header
          if (sub.includes('PID') && sub.includes('TTY') && sub.includes('CMD')) {
            return (
              <div key={idx} className="text-slate-400 font-bold uppercase tracking-wider text-[11px] pb-0.5 border-b border-white/10">
                {sub}
              </div>
            );
          }
          // ls -la
          if (/^([d\-]r[w\-][x\-][r\-][w\-][x\-][r\-][w\-][x\-]|total\s+\d+)/.test(sub.trim())) {
            const parts = sub.trim().split(/\s+/);
            const perm = parts[0];
            const isDir = perm.startsWith('d');
            const name = parts.slice(8).join(' ') || parts[parts.length - 1];
            return (
              <div key={idx} className="font-mono text-xs whitespace-pre flex items-center gap-2 py-0.5">
                <span className={isDir ? 'text-sky-400 font-bold' : 'text-slate-400'}>{perm}</span>
                <span className="text-slate-500">{parts.slice(1, 8).join(' ')}</span>
                <span className={isDir ? 'text-sky-300 font-semibold' : 'text-slate-100'}>{name}</span>
              </div>
            );
          }
          return (
            <div key={idx} className="whitespace-pre-wrap break-all">
              {highlightTerminalEntities(sub, theme)}
            </div>
          );
        })}
      </div>
    );
  }

  // 5. Single line ls -la
  if (/^([d\-]r[w\-][x\-][r\-][w\-][x\-][r\-][w\-][x\-]|total\s+\d+)/.test(lineText.trim())) {
    const parts = lineText.trim().split(/\s+/);
    const perm = parts[0];
    const isDir = perm.startsWith('d');
    const name = parts.slice(8).join(' ') || parts[parts.length - 1];
    return (
      <div className="font-mono text-xs whitespace-pre flex items-center gap-2 py-0.5">
        <span className={isDir ? 'text-sky-400 font-bold' : 'text-slate-400'}>{perm}</span>
        <span className="text-slate-500">{parts.slice(1, 8).join(' ')}</span>
        <span className={isDir ? 'text-sky-300 font-semibold' : 'text-slate-100'}>{name}</span>
      </div>
    );
  }

  // 6. Default single line
  return (
    <div className={`whitespace-pre-wrap break-all leading-relaxed ${theme.outputColor}`}>
      {highlightTerminalEntities(lineText, theme)}
    </div>
  );
}

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info' | 'system';
  text: string;
  promptPrefix?: string;
  timestamp?: string;
}

export interface IntegratedTerminalProps {
  files: ProjectFile[];
  projectName: string;
  isOpen: boolean;
  onToggle: () => void;
  onAskCopilot?: (query: string) => void;
  onTriggerPreviewReload?: () => void;
  onAddFile?: (name: string, language?: ProjectFile['language'], content?: string) => void;
  onDeleteFile?: (fileId: string) => void;
  onRenameFile?: (fileId: string, newName: string) => void;
  onUpdateContent?: (fileId: string, content: string) => void;
  onUpsertFile?: (name: string, content: string) => void;
  onSelectFile?: (fileId: string) => void;
}

export const IntegratedTerminal: React.FC<IntegratedTerminalProps> = ({
  files,
  projectName,
  isOpen,
  onToggle,
  onAskCopilot,
  onTriggerPreviewReload,
  onAddFile,
  onDeleteFile,
  onRenameFile,
  onUpdateContent,
  onUpsertFile,
  onSelectFile,
}) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'build' | 'output'>('terminal');
  const [isMaximized, setIsMaximized] = useState(false);

  // Persistent Command History via localStorage
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(TERMINAL_HISTORY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      'npm run build',
      'ls -la',
      'pwd',
    ];
  });

  // Pane and Layout State
  interface TerminalPane {
    id: string;
    lines: TerminalLine[];
    currentDir: string;
    replMode: 'bash' | 'python' | 'node' | 'gemini';
    inputVal: string;
    historyIdx: number;
    pythonContext: Record<string, any>;
    nanoState: {
      isOpen: boolean;
      fileName: string;
      initialContent: string;
    };
  }

  const initialLines: TerminalLine[] = [
    {
      id: 'init-1',
      type: 'info',
      text: 'Linux sandbox-cloud 6.6.0-x86_64 GNU/Linux (Ubuntu 24.04 LTS)',
    },
    {
      id: 'init-2',
      type: 'info',
      text: 'Gemini Live IDE Extended Linux Terminal Shell (Bash 5.2 / Node.js 22.14 / Python 3.12)',
    },
    {
      id: 'init-3',
      type: 'output',
      text: 'Type "help" for a list of Linux commands (cd, pwd, nano, git clone, curl, wget, python3, npm i, mkdir, rm, rn, chmod, cat).',
    },
  ];

  const [panes, setPanes] = useState<TerminalPane[]>([
    {
      id: 'pane-1',
      lines: [...initialLines],
      currentDir: '~/project',
      replMode: 'bash',
      inputVal: '',
      historyIdx: -1,
      pythonContext: {},
      nanoState: { isOpen: false, fileName: '', initialContent: '' }
    }
  ]);
  const [activePaneId, setActivePaneId] = useState<string>('pane-1');
  const [layout, setLayout] = useState<'single' | 'split-h' | 'split-v'>('single');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const activePane = panes.find(p => p.id === activePaneId) || panes[0];

  const updateActivePane = (updates: Partial<TerminalPane>) => {
    setPanes(prev => prev.map(p => p.id === activePaneId ? { ...p, ...updates } : p));
  };

  const updatePane = (id: string, updates: Partial<TerminalPane>) => {
    setPanes(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  // Terminal Theme Preset (Defaults to classic VS Code Dark+)
  const [themeId, setThemeId] = useState<TerminalThemeId>(() => {
    try {
      const saved = localStorage.getItem(TERMINAL_THEME_STORAGE_KEY) as TerminalThemeId;
      if (saved && TERMINAL_THEMES[saved]) return saved;
    } catch {
      // ignore
    }
    return 'vscode-dark-plus';
  });
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isComfortableSpacing, setIsComfortableSpacing] = useState(true);

  // Sync theme changes to localStorage
  const handleSelectTheme = (tid: TerminalThemeId) => {
    setThemeId(tid);
    try {
      localStorage.setItem(TERMINAL_THEME_STORAGE_KEY, tid);
    } catch {
      // ignore
    }
    setIsThemeMenuOpen(false);
  };

  const currentTheme = TERMINAL_THEMES[themeId] || TERMINAL_THEMES['vscode-dark-plus'];

  // Save history updates to localStorage
  const appendHistory = (newCmd: string) => {
    const trimmed = newCmd.trim();
    if (!trimmed) return;
    setHistory(prev => {
      // Avoid immediate exact duplicates at end of history
      const updated = prev.length > 0 && prev[prev.length - 1] === trimmed
        ? prev
        : [...prev, trimmed].slice(-150); // retain last 150 commands
      try {
        localStorage.setItem(TERMINAL_HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    updateActivePane({ historyIdx: -1 });
  };

  const [isBuilding, setIsBuilding] = useState(false);
  const [buildStatus, setBuildStatus] = useState<'idle' | 'building' | 'success' | 'error'>('success');
  const [lastBuildTime, setLastBuildTime] = useState('0.42s');

  // Linux Virtual Environment State
  const [virtualDirs, setVirtualDirs] = useState<Set<string>>(new Set(['src', 'components', 'styles', 'scripts', 'public']));
  const [filePermissions, setFilePermissions] = useState<Record<string, number>>({
    'index.html': 0o644,
    'style.css': 0o644,
    'app.js': 0o755,
    'package.json': 0o644,
    'README.md': 0o644,
  });
  const [envVars, setEnvVars] = useState<Record<string, string>>({
    SHELL: '/bin/bash',
    USER: 'developer',
    LOGNAME: 'developer',
    HOME: '/home/developer',
    TERM: 'xterm-256color',
    PATH: '/usr/local/bin:/usr/bin:/bin:~/.npm-global/bin',
    NODE_VERSION: 'v22.14.0',
    PYTHON_VERSION: '3.12.2',
    EDITOR: 'nano',
  });

  // Global npm packages (e.g., @google/gemini-cli)
  const [globalPackages, setGlobalPackages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(TERMINAL_GLOBAL_PKGS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      '@google/gemini-cli': '1.4.2',
    };
  });

  const [runningProcesses, setRunningProcesses] = useState([
    { pid: 1204, cmd: 'npm run dev', startTime: 'Oct 08 21:00' },
    { pid: 3412, cmd: 'vite-plugin-checker', startTime: 'Oct 08 21:05' },
    { pid: 5590, cmd: 'python3 scripts/monitor.py', startTime: 'Oct 08 21:10' },
  ]);

  const [buildLogs, setBuildLogs] = useState<string[]>([
    '[vite] vite v8.3.0 building for production...',
    'transforming (14) modules...',
    '✓ 14 modules transformed.',
    'dist/index.html                   1.48 kB │ gzip: 0.65 kB',
    'dist/assets/style.css             3.84 kB │ gzip: 1.12 kB',
    'dist/assets/app.js               19.20 kB │ gzip: 5.50 kB',
    '✓ built in 420ms',
  ]);

  const terminalEndRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (isOpen && !activePane.nanoState.isOpen) {
      terminalEndRefs.current[activePaneId]?.scrollIntoView({ behavior: 'smooth' });
      inputRefs.current[activePaneId]?.focus();
    }
  }, [panes, isOpen, activeTab, activePaneId, activePane.nanoState.isOpen, activePane.replMode]);

  // Compute full virtual Linux path
  const getFullUnixPath = (dir: string): string => {
    if (dir === '~') return '/home/developer';
    if (dir === '~/project') return '/home/developer/project';
    if (dir.startsWith('~/project/')) return '/home/developer/project/' + dir.replace('~/project/', '');
    if (dir === '/') return '/';
    return '/home/developer/project';
  };

  const getPromptPrefix = (dir: string = activePane.currentDir, mode: string = activePane.replMode) => {
    if (mode === 'python') return '>>> ';
    if (mode === 'node') return '> ';
    if (mode === 'gemini') return 'gemini> ';
    return `developer@sandbox:${dir}$ `;
  };

  // Helper to upsert file in IDE workspace
  const handleUpsertWorkspaceFile = (fileName: string, content: string) => {
    if (onUpsertFile) {
      onUpsertFile(fileName, content);
    } else {
      const existing = files.find(f => f.name.toLowerCase() === fileName.toLowerCase());
      if (existing && onUpdateContent) {
        onUpdateContent(existing.id, content);
      } else if (onAddFile) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        const lang: ProjectFile['language'] =
          ext === 'ts' || ext === 'tsx'
            ? 'typescript'
            : ext === 'sql'
            ? 'sql'
            : ext === 'yaml' || ext === 'yml'
            ? 'yaml'
            : ext === 'html'
            ? 'html'
            : ext === 'css'
            ? 'css'
            : ext === 'json'
            ? 'json'
            : ext === 'py'
            ? 'python'
            : ext === 'sh'
            ? 'shell'
            : ext === 'md'
            ? 'markdown'
            : 'javascript';
        onAddFile(fileName, lang, content);
      }
    }
  };

  const runBuildCommand = () => {
    setIsBuilding(true);
    setBuildStatus('building');
    setActiveTab('build');

    const start = performance.now();
    const newLogs: string[] = [
      `[${new Date().toLocaleTimeString()}] npm run build`,
      `> ${projectName.toLowerCase().replace(/\s+/g, '-')}@1.0.0 build`,
      `> vite build`,
      'Compiling workspace files...',
    ];

    files.forEach(f => {
      newLogs.push(`  ✓ ${f.name} (${(f.content.length / 1024).toFixed(2)} kB)`);
    });

    setTimeout(() => {
      const elapsed = ((performance.now() - start) / 1000).toFixed(2) + 's';
      newLogs.push('Optimizing bundle assets with esbuild...');
      newLogs.push('dist/index.html                   1.48 kB');
      newLogs.push(`dist/assets/bundle.js            ${(files.reduce((a, b) => a + b.content.length, 0) / 1024).toFixed(1)} kB`);
      newLogs.push(`✓ Built successfully in ${elapsed}`);

      setBuildLogs(newLogs);
      setIsBuilding(false);
      setBuildStatus('success');
      setLastBuildTime(elapsed);

      setPanes(prev => prev.map(p => ({
        ...p,
        lines: [
          ...p.lines,
          {
            id: Math.random().toString(),
            type: 'success',
            text: `✓ Build completed successfully in ${elapsed} (All ${files.length} files bundled).`,
          }
        ]
      })));
    }, 600);
  };

  // Execute Command Line Handler
  const executeCommand = async (cmd: string, paneId: string = activePaneId) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const pane = panes.find(p => p.id === paneId) || activePane;

    // Add to persistent command history
    appendHistory(trimmed);

    const promptText = getPromptPrefix(pane.currentDir, pane.replMode);
    const userLine: TerminalLine = {
      id: Math.random().toString(),
      type: 'input',
      text: trimmed,
      promptPrefix: promptText,
    };

    // Sub-REPL Modes
    if (pane.replMode === 'python') {
      if (trimmed === 'exit()' || trimmed === 'quit()' || trimmed === 'exit' || trimmed === 'quit') {
        updatePane(paneId, {
          replMode: 'bash',
          lines: [
            ...pane.lines,
            userLine,
            {
              id: Math.random().toString(),
              type: 'info',
              text: 'Exited Python 3 REPL. Returned to bash.',
            },
          ],
          inputVal: ''
        });
        return;
      }

      if (trimmed === 'clear' || trimmed === 'clear()' || trimmed === 'cls') {
        updatePane(paneId, { lines: [], inputVal: '' });
        return;
      }

      const res = executePythonCode(trimmed, pane.pythonContext);
      const outLines: TerminalLine[] = [];
      if (res.outputs.length > 0) {
        outLines.push({
          id: Math.random().toString(),
          type: 'output',
          text: res.outputs.join('\n'),
        });
      }
      if (res.error) {
        outLines.push({
          id: Math.random().toString(),
          type: 'error',
          text: res.error,
        });
      }

      updatePane(paneId, {
        pythonContext: res.updatedVars,
        lines: [...pane.lines, userLine, ...outLines],
        inputVal: ''
      });
      return;
    }

    if (pane.replMode === 'node') {
      if (trimmed === '.exit' || trimmed === 'exit' || trimmed === 'exit()') {
        updatePane(paneId, {
          replMode: 'bash',
          lines: [
            ...pane.lines,
            userLine,
            {
              id: Math.random().toString(),
              type: 'info',
              text: 'Exited Node.js REPL. Returned to bash.',
            },
          ],
          inputVal: ''
        });
        return;
      }

      if (trimmed === 'clear' || trimmed === 'clear()' || trimmed === 'cls') {
        updatePane(paneId, { lines: [], inputVal: '' });
        return;
      }

      const res = executeNodeCode(trimmed);
      const outLines: TerminalLine[] = [];
      if (res.outputs.length > 0) {
        outLines.push({
          id: Math.random().toString(),
          type: 'output',
          text: res.outputs.join('\n'),
        });
      }
      if (res.error) {
        outLines.push({
          id: Math.random().toString(),
          type: 'error',
          text: `Uncaught ${res.error}`,
        });
      }

      updatePane(paneId, {
        lines: [...pane.lines, userLine, ...outLines],
        inputVal: ''
      });
      return;
    }

    if (pane.replMode === 'gemini') {
      if (trimmed === 'exit' || trimmed === 'quit' || trimmed === ':q') {
        updatePane(paneId, {
          replMode: 'bash',
          lines: [
            ...pane.lines,
            userLine,
            {
              id: Math.random().toString(),
              type: 'info',
              text: 'Exited Gemini CLI session. Returned to bash.',
            },
          ],
          inputVal: ''
        });
        return;
      }

      updatePane(paneId, {
        lines: [
          ...pane.lines,
          userLine,
          {
            id: Math.random().toString(),
            type: 'info',
            text: '⠋ Querying Google Gemini Developer CLI...',
          },
        ],
        inputVal: ''
      });

      try {
        const response = await fetch('/api/gemini-cli', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: trimmed,
            files: files.map(f => ({ name: f.name, content: f.content })),
          }),
        });

        const data = await response.json();
        const cliText = data.text || 'Command completed with no output.';

        setPanes(prev => prev.map(p => p.id === paneId ? {
          ...p,
          lines: [
            ...p.lines.filter(l => !l.text.includes('⠋ Querying Google Gemini Developer CLI...')),
            {
              id: Math.random().toString(),
              type: 'output',
              text: cliText,
            },
          ]
        } : p));
      } catch (err: any) {
        setPanes(prev => prev.map(p => p.id === paneId ? {
          ...p,
          lines: [
            ...p.lines.filter(l => !l.text.includes('⠋ Querying Google Gemini Developer CLI...')),
            {
              id: Math.random().toString(),
              type: 'error',
              text: `Gemini CLI Error: ${err.message}`,
            },
          ]
        } : p));
      }
      return;
    }

    // Bash Shell Logic (Standard Execution)
    const args = trimmed.split(/\s+/);
    const command = args[0].toLowerCase();
    const outputLines: TerminalLine[] = [];

    switch (command) {
      case 'clear':
      case 'cls':
        updatePane(paneId, { lines: [], inputVal: '' });
        return;

      case 'help':
        outputLines.push({
          id: Math.random().toString(),
          type: 'info',
          text: `
Available commands:
  ls [-la]       - List files in current directory
  cd <dir>       - Change directory
  pwd            - Print working directory
  mkdir <dir>    - Create a new directory
  touch <file>   - Create an empty file
  rm <file/dir>  - Remove a file or directory
  cat <file>     - Print file contents
  nano <file>    - Open terminal text editor
  npm i <pkg>    - Mock install npm packages
  python3        - Start Python 3.12 REPL
  node           - Start Node.js v22 REPL
  gemini <query> - One-off query to Gemini CLI
  gemini chat    - Start interactive Gemini CLI session
  git <command>  - Basic git operations (clone, status, log)
  chmod <mode>   - Change file permissions (e.g. chmod +x app.js)
  ps             - List running processes
  kill <pid>     - Terminate a running process
  history [-c]   - Show or clear command history
  clear | cls    - Wipe the terminal output buffer
  help           - Show this manual

Keyboard Shortcuts:
  Up / Down      - Scroll through command history
  Ctrl+L         - Clear terminal screen
  Ctrl+C         - Interrupt process / Exit REPL
  ESC            - Exit nano editor (inside nano)
  Ctrl+S         - Save file (inside nano)
`,
        });
        break;

      case 'history':
        if (args[1] === '-c') {
          setHistory([]);
          localStorage.removeItem(TERMINAL_HISTORY_STORAGE_KEY);
          outputLines.push({ id: Math.random().toString(), type: 'success', text: 'Command history cleared.' });
        } else {
          outputLines.push({
            id: Math.random().toString(),
            type: 'output',
            text: history.map((h, i) => `  ${i + 1}  ${h}`).join('\n'),
          });
        }
        break;

      case 'pwd':
        outputLines.push({ id: Math.random().toString(), type: 'output', text: getFullUnixPath(pane.currentDir) });
        break;

      case 'ps':
        outputLines.push({
          id: Math.random().toString(),
          type: 'output',
          text: `  PID TTY          TIME CMD\n${runningProcesses.map(p => ` ${p.pid} pts/0    00:00:01 ${p.cmd}`).join('\n')}`
        });
        break;

      case 'kill':
        const pidStr = args[1];
        if (!pidStr) {
          outputLines.push({ id: Math.random().toString(), type: 'error', text: 'kill: usage: kill <pid>' });
        } else {
          const pid = parseInt(pidStr);
          const process = runningProcesses.find(p => p.pid === pid);
          if (process) {
            setRunningProcesses(prev => prev.filter(p => p.pid !== pid));
            outputLines.push({ id: Math.random().toString(), type: 'success', text: `Terminated process ${pid} (${process.cmd})` });
          } else {
            outputLines.push({ id: Math.random().toString(), type: 'error', text: `kill: (${pid}) - No such process` });
          }
        }
        break;

      case 'ls':
        const isLong = args.includes('-la') || args.includes('-l');
        const listFiles = files.filter(f => {
          if (pane.currentDir === '~' || pane.currentDir === '~/project') return !f.name.includes('/');
          const relativePath = pane.currentDir.replace('~/project/', '');
          return f.name.startsWith(relativePath + '/') && !f.name.replace(relativePath + '/', '').includes('/');
        });

        const listDirs = Array.from(virtualDirs).filter(d => {
          if (pane.currentDir === '~/project' || pane.currentDir === '~') return !d.includes('/');
          return d.startsWith(pane.currentDir.replace('~/project/', '') + '/');
        });

        if (isLong) {
          const rows = [
            `total ${listFiles.length + listDirs.length}`,
            ...listDirs.map(d => `drwxr-xr-x 2 developer developer 4096 Oct  8 22:15 ${d}`),
            ...listFiles.map(f => {
              const permStr = (f.name.endsWith('.js') || f.name.endsWith('.sh')) ? '-rwxr-xr-x' : '-rw-r--r--';
              return `${permStr} 1 developer developer ${f.content.length} Oct  8 22:15 ${f.name}`;
            }),
          ];
          outputLines.push({ id: Math.random().toString(), type: 'output', text: rows.join('\n') });
        } else {
          const names = [...listDirs, ...listFiles.map(f => f.name.split('/').pop() || f.name)];
          outputLines.push({ id: Math.random().toString(), type: 'output', text: names.join('  ') });
        }
        break;

      case 'cd':
        const target = args[1];
        if (!target || target === '~' || target === '~/project') {
          updatePane(paneId, { currentDir: '~/project', lines: [...pane.lines, userLine], inputVal: '' });
          return;
        } else if (target === '..') {
          const parts = pane.currentDir.split('/');
          if (parts.length > 2) {
            updatePane(paneId, { currentDir: parts.slice(0, -1).join('/'), lines: [...pane.lines, userLine], inputVal: '' });
          } else {
            updatePane(paneId, { currentDir: '~/project', lines: [...pane.lines, userLine], inputVal: '' });
          }
          return;
        } else {
          const dirExists = Array.from(virtualDirs).some(d => d.toLowerCase() === target.toLowerCase() || (pane.currentDir.replace('~/project/', '') + '/' + target).toLowerCase() === d.toLowerCase());
          if (dirExists) {
            const newPath = target.startsWith('/') ? target : (pane.currentDir === '~/project' ? `~/project/${target}` : `${pane.currentDir}/${target}`);
            updatePane(paneId, { currentDir: newPath, lines: [...pane.lines, userLine], inputVal: '' });
            return;
          } else {
            outputLines.push({ id: Math.random().toString(), type: 'error', text: `cd: no such file or directory: ${target}` });
          }
        }
        break;

      case 'mkdir':
        const newDir = args[1];
        if (!newDir) {
          outputLines.push({ id: Math.random().toString(), type: 'error', text: 'mkdir: missing operand' });
        } else {
          setVirtualDirs(prev => new Set([...Array.from(prev), newDir]));
          outputLines.push({ id: Math.random().toString(), type: 'success', text: `Directory '${newDir}' created.` });
        }
        break;

      case 'touch':
        const newFile = args[1];
        if (!newFile) {
          outputLines.push({ id: Math.random().toString(), type: 'error', text: 'touch: missing file operand' });
        } else {
          handleUpsertWorkspaceFile(newFile, '');
          outputLines.push({ id: Math.random().toString(), type: 'success', text: `File '${newFile}' created.` });
        }
        break;

      case 'cat':
        const catFile = args[1];
        const fileObj = files.find(f => f.name.toLowerCase() === catFile?.toLowerCase());
        if (fileObj) {
          outputLines.push({ id: Math.random().toString(), type: 'output', text: fileObj.content });
        } else {
          outputLines.push({ id: Math.random().toString(), type: 'error', text: `cat: ${catFile}: No such file or directory` });
        }
        break;

      case 'edit':
      case 'nano':
        const nanoFile = args[1];
        if (!nanoFile) {
          outputLines.push({ id: Math.random().toString(), type: 'error', text: 'nano: missing file operand' });
        } else {
          const existing = files.find(f => f.name.toLowerCase() === nanoFile.toLowerCase());
          updatePane(paneId, {
            nanoState: {
              isOpen: true,
              fileName: nanoFile,
              initialContent: existing ? existing.content : '',
            },
            lines: [...pane.lines, userLine],
            inputVal: ''
          });
          return;
        }
        break;

      case 'python3':
      case 'python':
        updatePane(paneId, {
          replMode: 'python',
          lines: [
            ...pane.lines,
            userLine,
            {
              id: Math.random().toString(),
              type: 'info',
              text: 'Python 3.12.2 (main, Oct  8 2024, 22:15:00)\nType "help", "copyright", "credits" or "license" for more information.',
            },
          ],
          inputVal: ''
        });
        return;

      case 'node':
        updatePane(paneId, {
          replMode: 'node',
          lines: [
            ...pane.lines,
            userLine,
            {
              id: Math.random().toString(),
              type: 'info',
              text: 'Welcome to Node.js v22.14.0.\nType ".help" for more information.',
            },
          ],
          inputVal: ''
        });
        return;

      case 'gemini':
        if (args[1] === 'chat') {
          updatePane(paneId, {
            replMode: 'gemini',
            lines: [
              ...pane.lines,
              userLine,
              {
                id: Math.random().toString(),
                type: 'info',
                text: 'Connected to Google Gemini Developer CLI (interactive mode).\nType your prompt and press Enter. Type "exit" to quit.',
              },
            ],
            inputVal: ''
          });
          return;
        }

        const query = args.slice(1).join(' ');
        if (!query) {
          outputLines.push({ id: Math.random().toString(), type: 'info', text: 'Google Gemini Developer CLI v1.4.2\nUsage: gemini <prompt> | gemini chat | gemini review' });
        } else {
          updatePane(paneId, {
            lines: [
              ...pane.lines,
              userLine,
              {
                id: Math.random().toString(),
                type: 'info',
                text: '⠋ Querying Google Gemini Developer CLI...',
              },
            ],
            inputVal: ''
          });
          try {
            const resp = await fetch('/api/gemini-cli', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: query, files: files.map(f => ({ name: f.name, content: f.content })) }),
            });
            const d = await resp.json();
            setPanes(prev => prev.map(p => p.id === paneId ? {
              ...p,
              lines: [
                ...p.lines.filter(l => !l.text.includes('⠋ Querying Google Gemini Developer CLI...')),
                {
                  id: Math.random().toString(),
                  type: 'output',
                  text: d.text || 'Done.',
                },
              ]
            } : p));
          } catch (e: any) {
            setPanes(prev => prev.map(p => p.id === paneId ? {
              ...p,
              lines: [
                ...p.lines.filter(l => !l.text.includes('⠋ Querying Google Gemini Developer CLI...')),
                {
                  id: Math.random().toString(),
                  type: 'error',
                  text: `Error: ${e.message}`,
                },
              ]
            } : p));
          }
          return;
        }
        break;

      case 'npm': {
        const subCmd = (args[1] || '').toLowerCase();
        if (!subCmd || subCmd === 'help' || subCmd === '--help' || subCmd === '-h') {
          outputLines.push({
            id: Math.random().toString(),
            type: 'info',
            text: `npm <command>\n\nUsage:\n  npm install [-g] [<pkg>]     install packages locally or globally\n  npm run <script>             run arbitrary package scripts (dev, build, test)\n  npm start                    run project development server\n  npm test                     run test suite\n  npm list [-g]                list installed dependencies\n  npm -v, --version            show npm CLI version`,
          });
        } else if (subCmd === '-v' || subCmd === '--version' || subCmd === 'version') {
          outputLines.push({
            id: Math.random().toString(),
            type: 'output',
            text: '10.8.2',
          });
        } else if (subCmd === 'i' || subCmd === 'install' || subCmd === 'add') {
          const isGlobal = args.includes('-g') || args.includes('--global');
          const pkgs = args.slice(2).filter(a => !a.startsWith('-'));

          if (isGlobal) {
            const targetPkg = pkgs[0] || '@google/gemini-cli';
            setGlobalPackages(prev => {
              const updated = { ...prev, [targetPkg]: '1.4.2' };
              try {
                localStorage.setItem(TERMINAL_GLOBAL_PKGS_STORAGE_KEY, JSON.stringify(updated));
              } catch {}
              return updated;
            });
            outputLines.push({
              id: Math.random().toString(),
              type: 'success',
              text: `added 1 package, and audited 14 packages in 1.12s\n\n+ ${targetPkg}@1.4.2\n\n1 package is looking for funding\n  run \`npm fund\` for details\n\nfound 0 vulnerabilities\nGlobal binary linked: /usr/local/bin/${targetPkg.split('/').pop()} -> ~/.npm-global/bin/${targetPkg.split('/').pop()}`,
            });
          } else if (pkgs.length === 0) {
            outputLines.push({
              id: Math.random().toString(),
              type: 'success',
              text: `audited 48 packages in 320ms\nfound 0 vulnerabilities\nEverything up to date.`,
            });
          } else {
            // Local package installation
            const pkgNames = pkgs.join(' ');
            const pkgJson = files.find(f => f.name.toLowerCase() === 'package.json');
            if (pkgJson) {
              try {
                const parsed = JSON.parse(pkgJson.content);
                if (!parsed.dependencies) parsed.dependencies = {};
                pkgs.forEach(p => { parsed.dependencies[p] = '^1.0.0'; });
                handleUpsertWorkspaceFile('package.json', JSON.stringify(parsed, null, 2) + '\n');
              } catch {}
            }
            outputLines.push({
              id: Math.random().toString(),
              type: 'success',
              text: `added ${pkgs.length} package${pkgs.length > 1 ? 's' : ''} in 780ms\n+ ${pkgNames}@latest\nfound 0 vulnerabilities\nWorkspace package.json synced.`,
            });
          }
        } else if (subCmd === 'run') {
          const script = args[2];
          if (!script) {
            outputLines.push({
              id: Math.random().toString(),
              type: 'info',
              text: 'Scripts available in project:\n  dev: vite\n  build: vite build\n  test: vitest run\n  lint: eslint src/',
            });
          } else if (script === 'build') {
            runBuildCommand();
            return;
          } else if (script === 'dev' || script === 'start') {
            outputLines.push({
              id: Math.random().toString(),
              type: 'info',
              text: `> ${projectName.toLowerCase().replace(/\\s+/g, '-')}@0.1.0 dev\n> vite --port 3000\n\n  VITE v8.3.0  ready in 184 ms\n\n  ➜  Local:   http://localhost:3000/\n  ➜  Network: use --host to expose`,
            });
          } else if (script === 'test') {
            outputLines.push({
              id: Math.random().toString(),
              type: 'success',
              text: `> ${projectName.toLowerCase().replace(/\\s+/g, '-')}@0.1.0 test\n> vitest run\n\n ✓ src/utils/codeFormatter.test.ts (4 tests)\n ✓ src/components/Editor.test.tsx (3 tests)\n\n Test Files  2 passed (2)\n      Tests  7 passed (7)\n   Duration  342ms`,
            });
          } else {
            outputLines.push({
              id: Math.random().toString(),
              type: 'output',
              text: `> ${projectName.toLowerCase().replace(/\\s+/g, '-')}@0.1.0 ${script}\nExecuted script '${script}' successfully.`,
            });
          }
        } else if (subCmd === 'start') {
          outputLines.push({
            id: Math.random().toString(),
            type: 'info',
            text: `  VITE v8.3.0  ready in 160 ms\n  ➜  Local:   http://localhost:3000/`,
          });
        } else if (subCmd === 'test') {
          outputLines.push({
            id: Math.random().toString(),
            type: 'success',
            text: ` ✓ All test suites passed! (7 tests across 2 files, duration 280ms)`,
          });
        } else if (subCmd === 'list' || subCmd === 'ls') {
          const isGlobal = args.includes('-g') || args.includes('--global');
          if (isGlobal) {
            const list = Object.entries(globalPackages).map(([k, v]) => `├── ${k}@${v}`).join('\n');
            outputLines.push({
              id: Math.random().toString(),
              type: 'output',
              text: `/home/developer/.npm-global/lib\n${list}`,
            });
          } else {
            outputLines.push({
              id: Math.random().toString(),
              type: 'output',
              text: `${projectName}@0.1.0 /home/developer/project\n├── @google/genai@2.4.0\n├── lucide-react@0.546.0\n├── prismjs@1.30.0\n├── react@19.0.1\n└── vite@8.3.0`,
            });
          }
        } else {
          outputLines.push({
            id: Math.random().toString(),
            type: 'output',
            text: `npm: '${subCmd}' completed with code 0.`,
          });
        }
        break;
      }

      case 'git': {
        const sub = (args[1] || '').toLowerCase();
        if (!sub || sub === 'status') {
          outputLines.push({
            id: Math.random().toString(),
            type: 'output',
            text: `On branch main\nYour branch is up to date with 'origin/main'.\n\nChanges to be committed:\n  (use "git restore --staged <file>..." to unstage)\n\tmodified:   src/App.tsx\n\tmodified:   src/components/Editor/CodeEditor.tsx\n\nno other untracked files present (working tree clean)`,
          });
        } else if (sub === 'log') {
          outputLines.push({
            id: Math.random().toString(),
            type: 'output',
            text: `commit e4f820c (HEAD -> main, origin/main)\nAuthor: developer <dev@gemini.local>\nDate:   ${new Date().toUTCString()}\n\n    feat: real-time multi-user collaboration and syntax support\n\ncommit a1b2c3d\nAuthor: developer <dev@gemini.local>\nDate:   Wed Oct 14 03:38:00 2026\n\n    chore: initialized project workspace with AetherVector template`,
          });
        } else if (sub === 'branch') {
          outputLines.push({
            id: Math.random().toString(),
            type: 'output',
            text: `* main\n  feature/collab-sync\n  staging`,
          });
        } else if (sub === 'clone') {
          const repo = args[2] || 'https://github.com/developer/repo.git';
          const dirName = repo.split('/').pop()?.replace('.git', '') || 'repo';
          setVirtualDirs(prev => new Set([...Array.from(prev), dirName]));
          outputLines.push({
            id: Math.random().toString(),
            type: 'success',
            text: `Cloning into '${dirName}'...\nremote: Enumerating objects: 42, done.\nremote: Total 42 (delta 18), reused 42\nReceiving objects: 100% (42/42), 24.12 KiB | 1.8 MiB/s, done.\nResolving deltas: 100% (18/18), done.`,
          });
        } else if (sub === 'diff') {
          outputLines.push({
            id: Math.random().toString(),
            type: 'output',
            text: `diff --git a/src/components/Editor/CodeEditor.tsx b/src/components/Editor/CodeEditor.tsx\nindex 8f3c1a..b2d9e4 100644\n--- a/src/components/Editor/CodeEditor.tsx\n+++ b/src/components/Editor/CodeEditor.tsx\n+ import 'prismjs/components/prism-typescript';\n+ import 'prismjs/components/prism-sql';\n+ import 'prismjs/components/prism-yaml';`,
          });
        } else if (sub === 'add') {
          outputLines.push({
            id: Math.random().toString(),
            type: 'success',
            text: `Staged changes for commit.`,
          });
        } else if (sub === 'commit') {
          const msgIdx = args.indexOf('-m');
          const commitMsg = msgIdx !== -1 ? args.slice(msgIdx + 1).join(' ').replace(/['"]/g, '') : 'update workspace files';
          outputLines.push({
            id: Math.random().toString(),
            type: 'success',
            text: `[main ${Math.random().toString(16).substring(2, 9)}] ${commitMsg}\n 2 files changed, 48 insertions(+), 6 deletions(-)`,
          });
        } else {
          outputLines.push({
            id: Math.random().toString(),
            type: 'output',
            text: `git: '${sub}' completed.`,
          });
        }
        break;
      }

      case 'rm': {
        const isRecursive = args.includes('-rf') || args.includes('-r');
        const target = args.filter(a => !a.startsWith('-'))[1];
        if (!target) {
          outputLines.push({ id: Math.random().toString(), type: 'error', text: 'rm: missing operand' });
        } else {
          const fileMatch = files.find(f => f.name.toLowerCase() === target.toLowerCase());
          if (fileMatch) {
            onDeleteFile?.(fileMatch.id);
            outputLines.push({ id: Math.random().toString(), type: 'success', text: `Removed file '${target}'.` });
          } else if (virtualDirs.has(target)) {
            if (isRecursive) {
              setVirtualDirs(prev => {
                const next = new Set(prev);
                next.delete(target);
                return next;
              });
              outputLines.push({ id: Math.random().toString(), type: 'success', text: `Removed directory '${target}'.` });
            } else {
              outputLines.push({ id: Math.random().toString(), type: 'error', text: `rm: cannot remove '${target}': Is a directory (use -r)` });
            }
          } else {
            outputLines.push({ id: Math.random().toString(), type: 'error', text: `rm: cannot remove '${target}': No such file or directory` });
          }
        }
        break;
      }

      case 'mv':
      case 'rn': {
        const srcName = args[1];
        const destName = args[2];
        if (!srcName || !destName) {
          outputLines.push({ id: Math.random().toString(), type: 'error', text: `${command}: missing file operands. Usage: ${command} <old> <new>` });
        } else {
          const fileMatch = files.find(f => f.name.toLowerCase() === srcName.toLowerCase());
          if (fileMatch) {
            onRenameFile?.(fileMatch.id, destName);
            outputLines.push({ id: Math.random().toString(), type: 'success', text: `Renamed '${srcName}' -> '${destName}'.` });
          } else {
            outputLines.push({ id: Math.random().toString(), type: 'error', text: `${command}: cannot stat '${srcName}': No such file or directory` });
          }
        }
        break;
      }

      case 'chmod': {
        const mode = args[1];
        const fileTarget = args[2];
        if (!mode || !fileTarget) {
          outputLines.push({ id: Math.random().toString(), type: 'error', text: 'chmod: missing operand. Usage: chmod <mode> <file>' });
        } else {
          outputLines.push({ id: Math.random().toString(), type: 'success', text: `Changed permissions of '${fileTarget}' to ${mode}.` });
        }
        break;
      }

      case 'curl': {
        const isHeaderOnly = args.includes('-I') || args.includes('-i');
        const url = args.find(a => a.startsWith('http://') || a.startsWith('https://')) || args[1];
        if (!url) {
          outputLines.push({ id: Math.random().toString(), type: 'error', text: 'curl: try \'curl --help\' for more information' });
        } else if (isHeaderOnly) {
          outputLines.push({
            id: Math.random().toString(),
            type: 'output',
            text: `HTTP/2 200 OK\nserver: nginx/1.24.0 (Ubuntu)\ndate: ${new Date().toUTCString()}\ncontent-type: text/html; charset=UTF-8\ncontent-length: 1480\nstrict-transport-security: max-age=31536000\naccess-control-allow-origin: *`,
          });
        } else {
          outputLines.push({
            id: Math.random().toString(),
            type: 'output',
            text: `<!DOCTYPE html>\n<html>\n<head><title>200 OK</title></head>\n<body>\n<h1>Service Online</h1>\n<p>Response received from ${url}</p>\n</body>\n</html>`,
          });
        }
        break;
      }

      case 'wget': {
        const url = args[1];
        if (!url) {
          outputLines.push({ id: Math.random().toString(), type: 'error', text: 'wget: missing URL' });
        } else {
          const fileName = url.split('/').pop()?.split('?')[0] || 'downloaded_file.txt';
          handleUpsertWorkspaceFile(fileName, `// Downloaded from ${url}\n// Timestamp: ${new Date().toISOString()}\nconsole.log("Loaded remote asset");\n`);
          outputLines.push({
            id: Math.random().toString(),
            type: 'success',
            text: `--${new Date().toISOString()}--  ${url}\nConnecting... connected.\nHTTP request sent, awaiting response... 200 OK\nLength: 1024 (1.0K) [text/plain]\nSaving to: '${fileName}'\n\n'${fileName}' saved [1024/1024]`,
          });
        }
        break;
      }

      case 'echo': {
        if (trimmed.includes('>')) {
          const parts = trimmed.substring(5).split('>');
          const content = parts[0].trim().replace(/^['"]|['"]$/g, '');
          const dest = parts[1].trim();
          handleUpsertWorkspaceFile(dest, content);
          outputLines.push({ id: Math.random().toString(), type: 'success', text: `Written to '${dest}'.` });
        } else {
          const out = trimmed.substring(5).replace(/^['"]|['"]$/g, '');
          outputLines.push({ id: Math.random().toString(), type: 'output', text: out });
        }
        break;
      }

      case 'which': {
        const target = args[1];
        if (!target) {
          outputLines.push({ id: Math.random().toString(), type: 'error', text: 'which: missing argument' });
        } else if (['node', 'npm', 'python3', 'python', 'git', 'gemini', 'nano', 'bash', 'curl', 'wget', 'cat', 'ls', 'chmod'].includes(target)) {
          outputLines.push({ id: Math.random().toString(), type: 'output', text: `/usr/local/bin/${target}` });
        } else {
          outputLines.push({ id: Math.random().toString(), type: 'error', text: `which: no ${target} in (/usr/local/bin:/usr/bin:/bin)` });
        }
        break;
      }

      case 'whoami':
        outputLines.push({ id: Math.random().toString(), type: 'output', text: 'developer' });
        break;

      case 'uname':
        if (args.includes('-a')) {
          outputLines.push({ id: Math.random().toString(), type: 'output', text: 'Linux sandbox-cloud 6.6.0-x86_64 #1 SMP PREEMPT_DYNAMIC Ubuntu 24.04 LTS x86_64 GNU/Linux' });
        } else {
          outputLines.push({ id: Math.random().toString(), type: 'output', text: 'Linux' });
        }
        break;

      case 'date':
        outputLines.push({ id: Math.random().toString(), type: 'output', text: new Date().toString() });
        break;

      case 'env': {
        const envRows = Object.entries(envVars).map(([k, v]) => `${k}=${v}`).join('\n');
        outputLines.push({ id: Math.random().toString(), type: 'output', text: envRows });
        break;
      }

      case 'export': {
        const pair = args[1];
        if (pair && pair.includes('=')) {
          const [k, ...rest] = pair.split('=');
          const v = rest.join('=').replace(/^['"]|['"]$/g, '');
          setEnvVars(prev => ({ ...prev, [k]: v }));
          outputLines.push({ id: Math.random().toString(), type: 'success', text: `Exported ${k}` });
        }
        break;
      }

      default:
        outputLines.push({ id: Math.random().toString(), type: 'error', text: `bash: ${command}: command not found` });
    }

    updatePane(paneId, { lines: [...pane.lines, userLine, ...outputLines], inputVal: '' });
  };

  const handleKeyDown = (e: React.KeyboardEvent, paneId: string = activePaneId) => {
    const pane = panes.find(p => p.id === paneId) || activePane;

    if (e.key === 'Enter') {
      executeCommand(pane.inputVal, paneId);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (pane.replMode !== 'bash') return;

      const val = pane.inputVal;
      const parts = val.trimStart().split(/\s+/);
      if (parts.length < 1) return;

      const lastPart = val.endsWith(' ') ? '' : parts[parts.length - 1];
      const cmd = parts[0].toLowerCase();

      // Only autocomplete if we have a command or we are typing a command
      const fileCmds = ['cat', 'nano', 'rm', 'edit', 'ls', 'cd', 'vi', 'vim', 'touch'];
      if (!fileCmds.includes(cmd) && parts.length > 1) return;

      // Get available names in current directory
      const availableNames = [
        ...files.filter(f => {
          if (pane.currentDir === '~' || pane.currentDir === '~/project') return !f.name.includes('/');
          const relativePath = pane.currentDir.replace('~/project/', '');
          return f.name.startsWith(relativePath + '/') && !f.name.replace(relativePath + '/', '').includes('/');
        }).map(f => f.name.split('/').pop() || f.name),
        ...Array.from(virtualDirs).filter(d => {
          if (pane.currentDir === '~/project' || pane.currentDir === '~') return !d.includes('/');
          return d.startsWith(pane.currentDir.replace('~/project/', '') + '/');
        })
      ];

      const matches = availableNames.filter(n => n.startsWith(lastPart));

      if (matches.length === 1) {
        const newVal = val.substring(0, val.lastIndexOf(lastPart)) + matches[0];
        updatePane(paneId, { inputVal: newVal });
      } else if (matches.length > 1) {
        // Cycle matches if Tab is pressed again?
        // For simplicity, just list them in terminal
        const matchLines: TerminalLine = {
          id: Math.random().toString(),
          type: 'output',
          text: matches.join('  ')
        };
        updatePane(paneId, { lines: [...pane.lines, matchLines] });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = pane.historyIdx === -1 ? history.length - 1 : Math.max(0, pane.historyIdx - 1);
      updatePane(paneId, { historyIdx: nextIdx, inputVal: history[nextIdx] || '' });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (pane.historyIdx === -1) return;
      const nextIdx = pane.historyIdx + 1;
      if (nextIdx >= history.length) {
        updatePane(paneId, { historyIdx: -1, inputVal: '' });
      } else {
        updatePane(paneId, { historyIdx: nextIdx, inputVal: history[nextIdx] || '' });
      }
    } else if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      if (pane.replMode !== 'bash') {
        updatePane(paneId, {
          replMode: 'bash',
          lines: [
            ...pane.lines,
            {
              id: Math.random().toString(),
              type: 'info',
              text: '^C\nKeyboardInterrupt: Exited REPL. Returned to bash.',
            },
          ],
          inputVal: ''
        });
      } else {
        updatePane(paneId, {
          lines: [
            ...pane.lines,
            {
              id: Math.random().toString(),
              type: 'output',
              text: `${getPromptPrefix(pane.currentDir, pane.replMode)}${pane.inputVal}^C`,
            },
          ],
          inputVal: ''
        });
      }
    } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      updatePane(paneId, { lines: [] });
    }
  };

  const handleSplit = (direction: 'vertical' | 'horizontal') => {
    if (panes.length >= 2) return;
    const newPane: TerminalPane = {
      id: Math.random().toString(),
      lines: [...initialLines],
      currentDir: activePane.currentDir,
      replMode: 'bash',
      inputVal: '',
      historyIdx: -1,
      pythonContext: {},
      nanoState: { isOpen: false, fileName: '', initialContent: '' }
    };
    setPanes([...panes, newPane]);
    setLayout(direction === 'vertical' ? 'split-v' : 'split-h');
    setActivePaneId(newPane.id);
  };

  const closePane = (id: string) => {
    if (panes.length <= 1) return;
    const newPanes = panes.filter(p => p.id !== id);
    setPanes(newPanes);
    setLayout('single');
    setActivePaneId(newPanes[0].id);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`border-t ${currentTheme.headerBorder} ${currentTheme.bodyBg} flex flex-col transition-all duration-200 select-none z-30 ${
        isMaximized ? 'h-[440px]' : 'h-[250px]'
      }`}
    >
      {/* Terminal Titlebar & Tabs */}
      <div className={`flex items-center justify-between px-3 py-1.5 ${currentTheme.headerBg} border-b ${currentTheme.headerBorder} text-xs`}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-300 mr-2">
            <TerminalIcon className={`w-3.5 h-3.5 ${currentTheme.promptColor}`} />
            <span className="font-semibold text-slate-200">LINUX TERMINAL</span>
            <span className="text-[10px] bg-black/40 text-slate-300 px-1 py-0.2 rounded border border-white/10">
              {activePane.replMode === 'python' ? 'Python 3.12' : activePane.replMode === 'node' ? 'Node v22' : 'bash 5.2'}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-black/30 p-0.5 rounded border border-white/10">
            <button
              onClick={() => setActiveTab('terminal')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors flex items-center gap-1 ${
                activeTab === 'terminal'
                  ? `${currentTheme.activeTabBg} ${currentTheme.promptColor} font-medium shadow-sm`
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TerminalSquare className={`w-3 h-3 ${currentTheme.promptColor}`} />
              <span>Shell</span>
              {activePane.nanoState.isOpen && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('build')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors ${
                activeTab === 'build'
                  ? `${currentTheme.activeTabBg} text-sky-300 font-medium shadow-sm`
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Build</span>
              {buildStatus === 'success' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('output')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                activeTab === 'output'
                  ? `${currentTheme.activeTabBg} text-sky-300 font-medium shadow-sm`
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Diagnostics
            </button>
          </div>
        </div>

        {/* Right Terminal Action Controls */}
        <div className="flex items-center gap-1.5 text-slate-400">
          {/* Theme Selector Popover */}
          <div className="relative">
            <button
              onClick={() => setIsThemeMenuOpen(prev => !prev)}
              className="flex items-center gap-1 px-2 py-0.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded border border-white/10 text-[11px] transition-colors"
              title="Change Terminal Theme"
            >
              <Palette className="w-3 h-3 text-amber-400" />
              <span>{currentTheme.name}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {isThemeMenuOpen && (
              <div
                className="absolute right-0 bottom-full mb-1 w-48 bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl z-50 py-1 font-sans text-xs overflow-hidden backdrop-blur-md"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-[#30363d]">
                  Terminal Theme Palette
                </div>
                {Object.values(TERMINAL_THEMES).map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTheme(t.id)}
                    className={`w-full text-left px-2.5 py-1.5 flex items-center justify-between text-xs transition-colors ${
                      themeId === t.id
                        ? 'bg-[#21262d] text-white font-medium'
                        : 'text-slate-300 hover:bg-[#21262d]/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full ring-1 ring-white/20"
                        style={{ backgroundColor: t.badge }}
                      />
                      <span>{t.name}</span>
                    </div>
                    {themeId === t.id && (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={runBuildCommand}
            disabled={isBuilding}
            className="flex items-center gap-1 px-2 py-0.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded text-[11px] transition-colors disabled:opacity-50"
            title="Trigger production build"
          >
            <Play className="w-2.5 h-2.5 fill-emerald-300" />
            <span>{isBuilding ? 'Building...' : 'Run Build'}</span>
          </button>

          <button
            onClick={() => setIsSearchVisible(prev => !prev)}
            className={`p-1 hover:text-slate-200 hover:bg-white/10 rounded transition-colors ${isSearchVisible ? 'text-sky-400 bg-sky-400/10' : ''}`}
            title="Search Output (Esc to close)"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsComfortableSpacing(prev => !prev)}
            className={`p-1 hover:text-slate-200 hover:bg-white/10 rounded transition-colors ${isComfortableSpacing ? 'text-sky-400 bg-sky-400/10' : 'text-slate-400'}`}
            title={isComfortableSpacing ? 'Comfortable Readability (Click for Compact)' : 'Compact View (Click for Comfortable)'}
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleSplit('vertical')}
            className="p-1 hover:text-slate-200 hover:bg-white/10 rounded transition-colors"
            title="Split Vertical"
          >
            <Columns2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleSplit('horizontal')}
            className="p-1 hover:text-slate-200 hover:bg-white/10 rounded transition-colors"
            title="Split Horizontal"
          >
            <Rows2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              if (activeTab === 'terminal') {
                updateActivePane({ lines: [] });
              }
              else if (activeTab === 'build') setBuildLogs([]);
            }}
            className="p-1 hover:text-slate-200 hover:bg-white/10 rounded transition-colors"
            title="Clear terminal screen (Ctrl+L)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsMaximized(prev => !prev)}
            className="p-1 hover:text-slate-200 hover:bg-white/10 rounded transition-colors"
            title={isMaximized ? 'Restore Size' : 'Maximize'}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onToggle}
            className="p-1 hover:text-slate-200 hover:bg-white/10 rounded transition-colors"
            title="Collapse Terminal"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab 1: Terminal Shell or Nano Editor */}
      {activeTab === 'terminal' && (
        <div className={`flex-1 flex ${layout === 'split-h' ? 'flex-col' : 'flex-row'} ${currentTheme.inputBg} overflow-hidden relative`}>
          {panes.map((pane, index) => (
            <div
              key={pane.id}
              className={`flex-1 flex flex-col overflow-hidden relative ${
                index > 0 ? (layout === 'split-h' ? 'border-t' : 'border-l') + ` ${currentTheme.headerBorder}` : ''
              } ${activePaneId === pane.id ? 'ring-1 ring-inset ring-sky-500/30' : 'opacity-90 hover:opacity-100 transition-opacity'}`}
              onClick={() => setActivePaneId(pane.id)}
            >
              {/* Pane Header (only if split) */}
              {panes.length > 1 && (
                <div className={`flex items-center justify-between px-2 py-0.5 ${currentTheme.headerBg} border-b ${currentTheme.headerBorder} text-[10px]`}>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className={activePaneId === pane.id ? 'text-sky-400 font-bold' : ''}>
                      {pane.replMode.toUpperCase()} SESSION {index + 1}
                    </span>
                    <span className="text-[9px] opacity-60">{getFullUnixPath(pane.currentDir)}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); closePane(pane.id); }}
                    className="p-0.5 hover:bg-white/10 rounded"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}

              {/* Search Bar (Only shown for active pane) */}
              {isSearchVisible && activePaneId === pane.id && (
                <div className="absolute top-0 right-0 left-0 bg-[#0d1117]/95 border-b border-white/10 z-20 flex items-center px-3 py-1 gap-2 shadow-lg backdrop-blur-sm animate-in slide-in-from-top-1 duration-200">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Escape') setIsSearchVisible(false); }}
                    placeholder="Search terminal output..."
                    className="flex-1 bg-transparent border-none outline-none text-xs text-slate-200"
                  />
                  <button onClick={() => { setSearchQuery(''); setIsSearchVisible(false); }} className="p-0.5 hover:bg-white/10 rounded">
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              )}

              {/* If Nano Mode is active */}
              {pane.nanoState.isOpen ? (
                <NanoEditor
                  fileName={pane.nanoState.fileName}
                  initialContent={pane.nanoState.initialContent}
                  onSave={(savedName, savedContent) => {
                    handleUpsertWorkspaceFile(savedName, savedContent);
                    setPanes(prev => prev.map(p => p.id === pane.id ? {
                      ...p,
                      lines: [
                        ...p.lines,
                        {
                          id: Math.random().toString(),
                          type: 'success',
                          text: `[ GNU nano: File '${savedName}' written to workspace (${savedContent.length} bytes) ]`,
                        }
                      ]
                    } : p));
                  }}
                  onExit={() => {
                    updatePane(pane.id, {
                      nanoState: { isOpen: false, fileName: '', initialContent: '' },
                      lines: [
                        ...pane.lines,
                        {
                          id: Math.random().toString(),
                          type: 'info',
                          text: `[ Closed GNU nano editor for ${pane.nanoState.fileName} ]`,
                        }
                      ]
                    });
                  }}
                />
              ) : (
                /* Interactive Shell View */
                <div
                  onClick={() => {
                    setIsThemeMenuOpen(false);
                    inputRefs.current[pane.id]?.focus();
                  }}
                  className={`flex-1 flex flex-col p-2.5 overflow-hidden font-mono ${
                    isComfortableSpacing ? 'text-[12.5px] leading-relaxed' : 'text-xs leading-normal'
                  } cursor-text select-text`}
                >
                  {/* Output History List */}
                  <div className={`flex-1 overflow-y-auto mb-1 ${isComfortableSpacing ? 'space-y-1.5' : 'space-y-0.5'}`}>
                    {(searchQuery && activePaneId === pane.id ? pane.lines.filter(l => l.text.toLowerCase().includes(searchQuery.toLowerCase())) : pane.lines).map(line => (
                      <div key={line.id}>
                        {line.type === 'input' ? (
                          <div className="flex items-center gap-1.5 text-slate-200 flex-wrap">
                            <span className={`${currentTheme.promptColor} font-semibold select-none`}>
                              {line.promptPrefix || getPromptPrefix(pane.currentDir, pane.replMode)}
                            </span>
                            <span className={currentTheme.inputTextColor}>{line.text}</span>
                          </div>
                        ) : (
                          renderReadableTerminalLine(line.text, line.type, currentTheme)
                        )}
                      </div>
                    ))}
                    <div ref={el => { terminalEndRefs.current[pane.id] = el; }} />
                  </div>

                  {/* Quick Linux Command Shortcut Chips */}
                  <div className="flex items-center gap-1 py-1 overflow-x-auto no-scrollbar border-t border-white/10 select-none text-[10px]">
                    <span className="text-slate-500 uppercase tracking-wider text-[9px] mr-1 shrink-0">Quick:</span>
                    {[
                      { label: 'gemini --help', cmd: 'gemini --help' },
                      { label: 'gemini chat', cmd: 'gemini chat' },
                      { label: 'gemini review', cmd: 'gemini review' },
                      { label: 'npm i -g @google/gemini-cli', cmd: 'npm i -g @google/gemini-cli' },
                      { label: 'ls -la', cmd: 'ls -la' },
                      { label: 'pwd', cmd: 'pwd' },
                      { label: 'nano index.html', cmd: 'nano index.html' },
                      { label: 'python3', cmd: 'python3' },
                      { label: 'node', cmd: 'node' },
                      { label: 'npm i lodash', cmd: 'npm i lodash' },
                      { label: 'git status', cmd: 'git status' },
                      { label: 'chmod +x', cmd: 'chmod +x app.js' },
                      { label: 'clear', cmd: 'clear' },
                      { label: 'history', cmd: 'history' },
                      { label: 'help', cmd: 'help' },
                    ].map(item => (
                      <button
                        key={item.label}
                        onClick={() => {
                          updatePane(pane.id, { inputVal: item.cmd });
                          executeCommand(item.cmd, pane.id);
                        }}
                        className={`px-1.5 py-0.5 ${currentTheme.quickChipBg} ${currentTheme.quickChipHover} ${currentTheme.quickChipText} rounded border ${currentTheme.quickChipBorder} transition-colors shrink-0`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Active Command Input Line */}
                  <div className="flex items-center gap-1.5 pt-1 text-xs border-t border-white/5">
                    <span className={`${currentTheme.promptColor} font-semibold shrink-0 select-none`}>
                      {getPromptPrefix(pane.currentDir, pane.replMode)}
                    </span>
                    <input
                      ref={el => { inputRefs.current[pane.id] = el; }}
                      type="text"
                      value={pane.inputVal}
                      onChange={e => updatePane(pane.id, { inputVal: e.target.value })}
                      onKeyDown={e => handleKeyDown(e, pane.id)}
                      autoComplete="off"
                      spellCheck="false"
                      className={`flex-1 bg-transparent border-none outline-none ${currentTheme.inputTextColor} font-mono text-xs`}
                      placeholder={pane.replMode === 'python' ? 'print(2 + 2)' : pane.replMode === 'node' ? 'console.log("hello")' : pane.replMode === 'gemini' ? 'ask gemini anything...' : 'type command...'}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Build Logs */}
      {activeTab === 'build' && (
        <div className="flex-1 flex flex-col bg-[#090d16] p-3 overflow-y-auto font-mono text-xs select-text">
          <div className="flex items-center justify-between pb-2 border-b border-[#21262d] mb-2 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Status:</span>
              {buildStatus === 'building' ? (
                <span className="text-amber-400 font-bold animate-pulse">BUILDING...</span>
              ) : (
                <span className="text-emerald-400 font-bold">SUCCESS (ready for distribution)</span>
              )}
            </div>
            <div className="text-slate-500">
              Build Duration: <span className="text-slate-300">{lastBuildTime}</span>
            </div>
          </div>

          <div className="space-y-1 text-slate-300">
            {buildLogs.map((log, i) => (
              <div
                key={i}
                className={`${
                  log.startsWith('✓') ? 'text-emerald-400' : log.includes('error') ? 'text-rose-400' : ''
                }`}
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: System Status & Diagnostic Overview */}
      {activeTab === 'output' && (
        <div className="flex-1 bg-[#090d16] p-4 text-xs font-mono text-slate-300 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="p-2.5 bg-[#161b22] border border-[#21262d] rounded-lg">
              <div className="text-[10px] text-slate-500 uppercase">OS Distribution</div>
              <div className="text-slate-100 font-semibold truncate mt-0.5">Ubuntu 24.04 (Linux 6.6)</div>
            </div>
            <div className="p-2.5 bg-[#161b22] border border-[#21262d] rounded-lg">
              <div className="text-[10px] text-slate-500 uppercase">Current Directory</div>
              <div className="text-emerald-400 font-semibold truncate mt-0.5">{getFullUnixPath(activePane.currentDir)}</div>
            </div>
            <div className="p-2.5 bg-[#161b22] border border-[#21262d] rounded-lg">
              <div className="text-[10px] text-slate-500 uppercase">Active Workspace Files</div>
              <div className="text-slate-100 font-semibold mt-0.5">{files.length} files</div>
            </div>
            <div className="p-2.5 bg-[#161b22] border border-[#21262d] rounded-lg">
              <div className="text-[10px] text-slate-500 uppercase">Node / Python Runtimes</div>
              <div className="text-sky-400 font-semibold mt-0.5">v22.14 / 3.12.2 Active</div>
            </div>
          </div>

          <div className="text-slate-400 text-[11px] leading-relaxed space-y-1.5">
            <p>
              Simulated Linux Environment with real workspace synchronization.
              Files modified via <code className="text-emerald-400">nano</code>, <code className="text-emerald-400">touch</code>, <code className="text-emerald-400">rm</code>, <code className="text-emerald-400">rn</code>, <code className="text-emerald-400">git clone</code>, <code className="text-emerald-400">wget</code>, and <code className="text-emerald-400">npm install</code> directly sync with the IDE file tree and live preview.
            </p>
            <p>
              Tip: Press <code className="text-sky-300">Ctrl+C</code> in Python or Node REPL to return to bash shell prompt at any time.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
