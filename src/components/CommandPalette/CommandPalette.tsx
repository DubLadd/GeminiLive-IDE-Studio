import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ProjectFile } from '../../types/ide';
import { TerminalThemeId, TERMINAL_THEMES } from '../Terminal/IntegratedTerminal';
import {
  Search,
  Command,
  FileCode,
  Layout,
  Terminal,
  Sparkles,
  Wand2,
  Save,
  Copy,
  Plus,
  Play,
  Download,
  Upload,
  Palette,
  Users,
  TestTube2,
  FolderOpen,
  Eye,
  Zap,
  ArrowRight,
  Code2,
  Brain,
  BarChart3,
  Check,
  UploadCloud,
  Github
} from 'lucide-react';

export interface CommandItem {
  id: string;
  title: string;
  description?: string;
  category: 'Editor' | 'View' | 'File' | 'Testing' | 'Theme' | 'AI' | 'Collaboration';
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  files: ProjectFile[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onFormatCode: () => void;
  onSaveFile: () => void;
  onToggleSidebar: () => void;
  onToggleTerminal: () => void;
  onSetViewMode: (mode: 'agent' | 'ide' | 'split' | 'brainstorm' | 'terminal' | 'testing' | 'stats') => void;
  onOpenTestRunner: () => void;
  onRunAllTests: () => void;
  onNewFile: () => void;
  onDownloadHtml: () => void;
  onUploadHtml: () => void;
  onOpenTemplates: () => void;
  onOpenGallery: () => void;
  onOpenCollab: () => void;
  onOpenGitHub?: () => void;
  onPushToGitHub?: () => void;
  onAskCopilot?: (query: string) => void;
  onToggleCopilot?: () => void;
  currentThemeId: TerminalThemeId;
  onSelectTheme: (themeId: TerminalThemeId) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  files,
  activeFileId,
  onSelectFile,
  onFormatCode,
  onSaveFile,
  onToggleSidebar,
  onToggleTerminal,
  onSetViewMode,
  onOpenTestRunner,
  onRunAllTests,
  onNewFile,
  onDownloadHtml,
  onUploadHtml,
  onOpenTemplates,
  onOpenGallery,
  onOpenCollab,
  onOpenGitHub,
  onPushToGitHub,
  onAskCopilot,
  onToggleCopilot,
  currentThemeId,
  onSelectTheme,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const activeFile = files.find(f => f.id === activeFileId);

  // Define full command registry
  const commands: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      // 1. Editor Commands
      {
        id: 'editor-format',
        title: 'Format Document / Code',
        description: `Clean indentation & format syntax for active file (${activeFile?.name || 'current'})`,
        category: 'Editor',
        icon: Wand2,
        shortcut: 'Alt+Shift+F',
        keywords: ['format', 'beautify', 'prettier', 'clean', 'indent'],
        action: () => {
          onFormatCode();
          onClose();
        },
      },
      {
        id: 'editor-save',
        title: 'Save Active File',
        description: 'Persist changes to workspace storage and refresh sandbox',
        category: 'Editor',
        icon: Save,
        shortcut: 'Ctrl+S',
        keywords: ['save', 'write', 'commit', 'sync'],
        action: () => {
          onSaveFile();
          onClose();
        },
      },
      {
        id: 'editor-copy-content',
        title: 'Copy File Contents',
        description: `Copy all text from ${activeFile?.name || 'active file'} to clipboard`,
        category: 'Editor',
        icon: Copy,
        shortcut: 'Ctrl+C',
        keywords: ['copy', 'clipboard', 'text'],
        action: () => {
          if (activeFile) {
            navigator.clipboard.writeText(activeFile.content);
          }
          onClose();
        },
      },

      // 2. View & Layout Commands
      {
        id: 'view-toggle-sidebar',
        title: 'Toggle Left Sidebar',
        description: 'Show or hide the project explorer and testing panel',
        category: 'View',
        icon: Layout,
        shortcut: 'Ctrl+B',
        keywords: ['sidebar', 'explorer', 'tree', 'hide', 'show', 'panel'],
        action: () => {
          onToggleSidebar();
          onClose();
        },
      },
      {
        id: 'view-toggle-terminal',
        title: 'Toggle Integrated Terminal',
        description: 'Toggle the bottom Linux command shell and diagnostic logs',
        category: 'View',
        icon: Terminal,
        shortcut: 'Ctrl+`',
        keywords: ['terminal', 'console', 'bash', 'shell', 'cli'],
        action: () => {
          onToggleTerminal();
          onClose();
        },
      },
      {
        id: 'view-testing-runner',
        title: 'Open Vitest Test Runner',
        description: 'View and run .test.ts and .test.js test suites in-browser',
        category: 'Testing',
        icon: TestTube2,
        shortcut: 'Ctrl+Shift+T',
        keywords: ['test', 'vitest', 'unit', 'testing', 'runner', 'spec'],
        action: () => {
          onOpenTestRunner();
          onClose();
        },
      },
      {
        id: 'test-run-all',
        title: 'Run All Unit Tests',
        description: 'Execute all discovered Vitest test suites across the project',
        category: 'Testing',
        icon: Zap,
        shortcut: 'Ctrl+Shift+R',
        keywords: ['run', 'tests', 'execute', 'vitest', 'all'],
        action: () => {
          onRunAllTests();
          onClose();
        },
      },
      {
        id: 'view-mode-split',
        title: 'Switch View: Live IDE Canvas (Split)',
        description: 'Side-by-side code editor and live rendered browser preview',
        category: 'View',
        icon: Code2,
        keywords: ['split', 'canvas', 'preview', 'editor', 'side'],
        action: () => {
          onSetViewMode('split');
          onClose();
        },
      },
      {
        id: 'view-mode-agent',
        title: 'Switch View: Gemini Autonomous Agent',
        description: 'Interactive AI pairing partner with autonomous code generation',
        category: 'AI',
        icon: Sparkles,
        keywords: ['gemini', 'agent', 'chat', 'copilot', 'ai'],
        action: () => {
          onSetViewMode('agent');
          onClose();
        },
      },
      {
        id: 'ai-toggle-copilot',
        title: 'Toggle Gemini Copilot Panel',
        description: 'Open or close the real-time Gemini Copilot pairing side panel',
        category: 'AI',
        icon: Sparkles,
        shortcut: 'Ctrl+Shift+G',
        keywords: ['copilot', 'gemini', 'chat', 'sidebar', 'panel', 'ai', 'live'],
        action: () => {
          if (onToggleCopilot) onToggleCopilot();
          onClose();
        },
      },
      {
        id: 'ai-copilot-explain',
        title: 'Gemini Copilot: Explain Architecture of Active File',
        description: `Analyze structure, patterns, and state flow in ${activeFile?.name || 'active file'}`,
        category: 'AI',
        icon: Wand2,
        keywords: ['explain', 'understand', 'architecture', 'gemini', 'copilot'],
        action: () => {
          if (onAskCopilot) onAskCopilot(`Explain the architecture and logic of ${activeFile?.name || 'current file'} in detail.`);
          onClose();
        },
      },
      {
        id: 'ai-copilot-refactor',
        title: 'Gemini Copilot: Refactor & Clean Active File',
        description: `Propose performance optimizations and structural cleanups for ${activeFile?.name || 'active file'}`,
        category: 'AI',
        icon: Wand2,
        keywords: ['refactor', 'clean', 'optimize', 'gemini', 'copilot'],
        action: () => {
          if (onAskCopilot) onAskCopilot(`Refactor ${activeFile?.name || 'current file'} to optimize performance, clean up structure, and enhance maintainability.`);
          onClose();
        },
      },
      {
        id: 'ai-copilot-bugcheck',
        title: 'Gemini Copilot: Audit & Bug Check',
        description: `Deep audit of ${activeFile?.name || 'active file'} for potential runtime bugs and edge cases`,
        category: 'AI',
        icon: Sparkles,
        keywords: ['bug', 'audit', 'check', 'security', 'gemini', 'lint'],
        action: () => {
          if (onAskCopilot) onAskCopilot(`Audit ${activeFile?.name || 'current file'} for potential runtime bugs, edge cases, or UX flaws, and provide fixes.`);
          onClose();
        },
      },
      {
        id: 'ai-copilot-proto',
        title: 'Gemini Copilot: Spin Up Zero-Dependency Prototype (!proto)',
        description: 'Instant disposable in-memory prototype without package setup',
        category: 'AI',
        icon: Zap,
        keywords: ['proto', 'prototype', 'lab', 'fast', 'disposable'],
        action: () => {
          if (onAskCopilot) onAskCopilot('!proto Spin up an in-memory zero-dependency prototype in one file.');
          onClose();
        },
      },
      {
        id: 'ai-copilot-harden',
        title: 'Gemini Copilot: Defensive Security Hardening (!harden)',
        description: 'Audit code and apply WebCrypto AES-GCM and zero-network isolation',
        category: 'AI',
        icon: Sparkles,
        keywords: ['harden', 'security', 'crypto', 'isolation', 'defensive'],
        action: () => {
          if (onAskCopilot) onAskCopilot('!harden Audit code and apply WebCrypto AES-GCM encryption and zero-network isolation.');
          onClose();
        },
      },
      {
        id: 'view-mode-terminal',
        title: 'Switch View: Full Screen Linux Terminal Shell',
        description: 'Dedicated Linux environment with Node.js, Python, and Git',
        category: 'View',
        icon: Terminal,
        keywords: ['terminal', 'bash', 'shell', 'fullscreen', 'python'],
        action: () => {
          onSetViewMode('terminal');
          onClose();
        },
      },
      {
        id: 'view-mode-brainstorm',
        title: 'Switch View: Brainstormer Lab',
        description: 'Concept Matrix and intelligent mutation engine',
        category: 'View',
        icon: Brain,
        keywords: ['brainstorm', 'matrix', 'mutations', 'ideas'],
        action: () => {
          onSetViewMode('brainstorm');
          onClose();
        },
      },
      {
        id: 'view-mode-stats',
        title: 'Switch View: Project Metrics & Breakdown',
        description: 'Detailed lines of code, language breakdown, and statistics',
        category: 'View',
        icon: BarChart3,
        keywords: ['stats', 'metrics', 'loc', 'breakdown', 'complexity'],
        action: () => {
          onSetViewMode('stats');
          onClose();
        },
      },

      // 3. File Operations
      {
        id: 'file-new',
        title: 'New File...',
        description: 'Create a new code file in the current project workspace',
        category: 'File',
        icon: Plus,
        shortcut: 'Ctrl+Alt+N',
        keywords: ['new', 'file', 'create', 'add'],
        action: () => {
          onNewFile();
          onClose();
        },
      },
      {
        id: 'file-download-html',
        title: 'Download Standalone HTML',
        description: 'Export project bundle as a single self-contained HTML file',
        category: 'File',
        icon: Download,
        keywords: ['export', 'download', 'html', 'save', 'dist'],
        action: () => {
          onDownloadHtml();
          onClose();
        },
      },
      {
        id: 'file-upload-html',
        title: 'Upload Code File',
        description: 'Import .html, .ts, .js, or .css from local device into IDE',
        category: 'File',
        icon: Upload,
        keywords: ['upload', 'import', 'open', 'load'],
        action: () => {
          onUploadHtml();
          onClose();
        },
      },

      // 4. Collaboration & Templates
      {
        id: 'collab-open',
        title: 'Start Live Collaboration Session',
        description: 'Generate real-time invite link with live cursors & multi-user sync',
        category: 'Collaboration',
        icon: Users,
        keywords: ['collab', 'share', 'pair', 'multiplayer', 'remote', 'live'],
        action: () => {
          onOpenCollab();
          onClose();
        },
      },
      {
        id: 'git-push-github',
        title: 'Git: Push Project to GitHub...',
        description: 'Commit all workspace files to your GitHub repository via API',
        category: 'Collaboration',
        icon: UploadCloud,
        shortcut: 'Ctrl+Shift+U',
        keywords: ['git', 'push', 'commit', 'github', 'repo', 'repository', 'sync', 'remote'],
        action: () => {
          if (onPushToGitHub) onPushToGitHub();
          onClose();
        },
      },
      {
        id: 'github-open-hub',
        title: 'GitHub: Open Integration Hub',
        description: 'Manage Personal Access Token, browse repos, or clone projects',
        category: 'Collaboration',
        icon: Github,
        keywords: ['github', 'hub', 'pat', 'token', 'clone', 'repositories'],
        action: () => {
          if (onOpenGitHub) onOpenGitHub();
          onClose();
        },
      },
      {
        id: 'templates-open',
        title: 'Browse Starter Templates',
        description: 'Load pre-built starter projects (AetherVector, Neon Lab, etc.)',
        category: 'File',
        icon: FolderOpen,
        keywords: ['templates', 'starter', 'samples', 'aether', 'preset'],
        action: () => {
          onOpenTemplates();
          onClose();
        },
      },
      {
        id: 'gallery-open',
        title: 'Open App Gallery',
        description: 'Browse saved prototypes and storage snapshots',
        category: 'File',
        icon: Eye,
        keywords: ['gallery', 'apps', 'saved', 'prototypes', 'storage'],
        action: () => {
          onOpenGallery();
          onClose();
        },
      },

      // 5. Classic VS Code Themes
      {
        id: 'theme-vscode-dark-plus',
        title: 'Switch Theme: VS Code Dark+ (Default)',
        description: 'Classic Visual Studio Code Dark modern color theme',
        category: 'Theme',
        icon: Palette,
        keywords: ['theme', 'dark', 'vscode', 'color', 'default'],
        action: () => {
          onSelectTheme('vscode-dark-plus');
          onClose();
        },
      },
      {
        id: 'theme-vscode-light-plus',
        title: 'Switch Theme: VS Code Light+',
        description: 'Clean high-readability day theme for bright environments',
        category: 'Theme',
        icon: Palette,
        keywords: ['theme', 'light', 'vscode', 'white'],
        action: () => {
          onSelectTheme('vscode-light-plus');
          onClose();
        },
      },
      {
        id: 'theme-vscode-high-contrast',
        title: 'Switch Theme: VS Code High Contrast',
        description: 'High contrast accessibility theme with cyan accents',
        category: 'Theme',
        icon: Palette,
        keywords: ['theme', 'high contrast', 'accessibility', 'cyan'],
        action: () => {
          onSelectTheme('vscode-high-contrast');
          onClose();
        },
      },
      {
        id: 'theme-vscode-monokai',
        title: 'Switch Theme: VS Code Monokai',
        description: 'Warm retro hacker palette with pink & lime accents',
        category: 'Theme',
        icon: Palette,
        keywords: ['theme', 'monokai', 'retro', 'hacker'],
        action: () => {
          onSelectTheme('vscode-monokai');
          onClose();
        },
      },
      {
        id: 'theme-vscode-abyss',
        title: 'Switch Theme: VS Code Abyss',
        description: 'Deep oceanic blue palette with neon highlights',
        category: 'Theme',
        icon: Palette,
        keywords: ['theme', 'abyss', 'blue', 'ocean'],
        action: () => {
          onSelectTheme('vscode-abyss');
          onClose();
        },
      },
      {
        id: 'theme-github-dark',
        title: 'Switch Theme: GitHub Dark',
        description: 'Minimalist GitHub Primer slate dark theme',
        category: 'Theme',
        icon: Palette,
        keywords: ['theme', 'github', 'primer'],
        action: () => {
          onSelectTheme('github-dark');
          onClose();
        },
      },
      {
        id: 'theme-dracula',
        title: 'Switch Theme: Dracula Official',
        description: 'Gothic purple and cyan dark theme',
        category: 'Theme',
        icon: Palette,
        keywords: ['theme', 'dracula', 'purple', 'gothic'],
        action: () => {
          onSelectTheme('dracula');
          onClose();
        },
      },
      {
        id: 'theme-cyberpunk',
        title: 'Switch Theme: Cyberpunk Neon',
        description: 'Ultra-vibrant hot pink and electric cyan CRT theme',
        category: 'Theme',
        icon: Palette,
        keywords: ['theme', 'cyberpunk', 'neon', 'pink'],
        action: () => {
          onSelectTheme('cyberpunk');
          onClose();
        },
      },
    ];

    // Add dynamic "Go to File: <filename>" commands
    files.forEach(f => {
      list.push({
        id: `file-open-${f.id}`,
        title: `Go to File: ${f.name}`,
        description: `Open ${f.name} (${f.language}) in Code Editor`,
        category: 'File',
        icon: FileCode,
        keywords: ['file', 'open', 'switch', f.name, f.language],
        action: () => {
          onSelectFile(f.id);
          onClose();
        },
      });
    });

    return list;
  }, [files, activeFile, onFormatCode, onSaveFile, onToggleSidebar, onToggleTerminal, onSetViewMode, onOpenTestRunner, onRunAllTests, onNewFile, onDownloadHtml, onUploadHtml, onOpenTemplates, onOpenGallery, onOpenCollab, onSelectTheme, onSelectFile, onClose]);

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase().trim();
    return commands.filter(cmd => {
      const matchTitle = cmd.title.toLowerCase().includes(q);
      const matchDesc = cmd.description?.toLowerCase().includes(q);
      const matchCategory = cmd.category.toLowerCase().includes(q);
      const matchKeywords = cmd.keywords?.some(k => k.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchCategory || matchKeywords;
    });
  }, [commands, query]);

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands.length]);

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredCommands[selectedIndex];
      if (selected) {
        selected.action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Ensure selected item is scrolled into view
  useEffect(() => {
    const activeEl = listRef.current?.children[selectedIndex] as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col text-slate-200 animate-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[#30363d] bg-[#0d1117] gap-3">
          <Command className="w-5 h-5 text-sky-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search (e.g. 'Format Code', 'Toggle Sidebar', 'Vitest', 'Theme')..."
            className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder-slate-500 text-sm font-sans"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded bg-[#21262d]"
            >
              Clear
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono bg-[#21262d] text-slate-400 border border-[#30363d] rounded">
              ESC to close
            </kbd>
          )}
        </div>

        {/* Command List */}
        <div
          ref={listRef}
          className="max-h-[380px] overflow-y-auto divide-y divide-[#21262d]/50 p-1 font-sans text-xs select-none"
        >
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <Search className="w-7 h-7 text-slate-600 mx-auto mb-2" />
              <span>No matching commands found for "{query}"</span>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = cmd.icon;
              const isCurrentTheme = cmd.id.startsWith('theme-') && cmd.id.replace('theme-', '') === currentThemeId;

              return (
                <div
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-sky-600/20 text-white border border-sky-500/40'
                      : 'text-slate-300 hover:bg-[#21262d]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                          : 'bg-[#21262d] border-[#30363d] text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs truncate">{cmd.title}</span>
                        {isCurrentTheme && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" />
                            Active
                          </span>
                        )}
                      </div>
                      {cmd.description && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {cmd.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-slate-400 border border-[#30363d]">
                      {cmd.category}
                    </span>
                    {cmd.shortcut && (
                      <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-[#0d1117] text-slate-300 border border-[#30363d] rounded">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#30363d] bg-[#0d1117] text-[11px] text-slate-500 select-none">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-[#161b22] px-1 rounded text-slate-400">↑</kbd> <kbd className="font-mono bg-[#161b22] px-1 rounded text-slate-400">↓</kbd> Navigate
            </span>
            <span>·</span>
            <span>
              <kbd className="font-mono bg-[#161b22] px-1 rounded text-slate-400">↵</kbd> Select
            </span>
          </div>
          <div>
            <span>{filteredCommands.length} commands</span>
          </div>
        </div>
      </div>
    </div>
  );
};
