import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ProjectFile, ConsoleLog, DeviceViewport } from '../../types/ide';
import { bundleLivePreviewDocument } from '../../utils/transpiler';
import {
  RotateCcw,
  ExternalLink,
  Laptop,
  Tablet,
  Smartphone,
  Maximize2,
  Terminal,
  Trash2,
  Sparkles,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Play,
  FileCode,
  Layers
} from 'lucide-react';

interface LivePreviewProps {
  files: ProjectFile[];
  onFixErrorWithAI?: (errorMessage: string) => void;
  autoRefresh?: boolean;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  files,
  onFixErrorWithAI,
  autoRefresh = true,
}) => {
  const [viewport, setViewport] = useState<DeviceViewport>('responsive');
  const [reloadKey, setReloadKey] = useState(0);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [consoleFilter, setConsoleFilter] = useState<'all' | 'log' | 'warn' | 'error'>('all');
  const [evalCommand, setEvalCommand] = useState('');

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Compile bundled HTML document with HTML, TypeScript, and JavaScript support
  const bundledHtml = useMemo(() => {
    return bundleLivePreviewDocument(files);
  }, [files, reloadKey]);

  // Listen for console messages from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'IDE_CONSOLE') {
        const newLog: ConsoleLog = {
          id: Math.random().toString(36).substring(2, 9),
          type: e.data.logType || 'log',
          text: e.data.text || '',
          timestamp: new Date().toLocaleTimeString(),
        };
        setLogs(prev => [...prev.slice(-150), newLog]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleReload = () => {
    setReloadKey(k => k + 1);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleExecCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalCommand.trim() || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      { type: 'EXEC_COMMAND', cmd: evalCommand.trim() },
      '*'
    );
    setEvalCommand('');
  };

  const filteredLogs = logs.filter(l =>
    consoleFilter === 'all' ? true : l.type === consoleFilter
  );

  const errorCount = logs.filter(l => l.type === 'error').length;
  const warnCount = logs.filter(l => l.type === 'warn').length;

  const getViewportStyle = () => {
    switch (viewport) {
      case 'desktop':
        return { width: '1200px', maxWidth: '100%' };
      case 'tablet':
        return { width: '768px', maxWidth: '100%' };
      case 'mobile':
        return { width: '375px', maxWidth: '100%' };
      default:
        return { width: '100%' };
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#090d16] border-l border-[#30363d] overflow-hidden relative select-none">
      {/* Top Preview Control Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-[#30363d] text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">LIVE PREVIEW</span>
          <div className="flex items-center gap-1 bg-[#0d1117] border border-[#30363d] px-2 py-0.5 rounded text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>HTML • TS • JS</span>
          </div>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] bg-sky-950/50 text-sky-400 border border-sky-800/40">
            TypeScript/TSX Hot Reload
          </span>
        </div>

        {/* Viewport Width Controls */}
        <div className="flex items-center gap-1 bg-[#0d1117] p-0.5 rounded border border-[#30363d]">
          <button
            onClick={() => setViewport('responsive')}
            className={`p-1 rounded transition-colors ${viewport === 'responsive' ? 'bg-[#21262d] text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}
            title="Responsive (Full)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('desktop')}
            className={`p-1 rounded transition-colors ${viewport === 'desktop' ? 'bg-[#21262d] text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}
            title="Desktop (1200px)"
          >
            <Laptop className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`p-1 rounded transition-colors ${viewport === 'tablet' ? 'bg-[#21262d] text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}
            title="Tablet (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`p-1 rounded transition-colors ${viewport === 'mobile' ? 'bg-[#21262d] text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}
            title="Mobile (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReload}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-[#21262d] transition-colors"
            title="Reload Preview"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              const newTab = window.open('about:blank', '_blank');
              if (newTab) {
                newTab.document.open();
                newTab.document.write(bundledHtml);
                newTab.document.close();
              }
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-[#21262d] transition-colors"
            title="Open in Fresh Tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 bg-[#0b0f19] flex justify-center items-center overflow-auto p-2">
        <div
          style={getViewportStyle()}
          className="h-full bg-black rounded-lg overflow-hidden border border-[#21262d] shadow-2xl transition-all duration-200 relative flex flex-col"
        >
          <iframe
            ref={iframeRef}
            key={reloadKey}
            srcDoc={bundledHtml}
            sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
            title="Gemini Live Sandbox"
            className="w-full flex-1 border-none bg-white"
          />
        </div>
      </div>

      {/* Interactive Bottom Console Drawer */}
      <div className="border-t border-[#30363d] bg-[#0d1117] flex flex-col">
        {/* Console Header Toggle */}
        <div
          onClick={() => setConsoleOpen(prev => !prev)}
          className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] hover:bg-[#1c2129] cursor-pointer transition-colors text-xs text-slate-300"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-semibold text-slate-200">CONSOLE</span>
            <div className="flex items-center gap-1 text-[11px]">
              {errorCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 font-mono font-bold">
                  {errorCount} errors
                </span>
              )}
              {warnCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono font-bold">
                  {warnCount} warns
                </span>
              )}
              {errorCount === 0 && warnCount === 0 && (
                <span className="text-slate-500">{logs.length} messages</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            {consoleOpen && (
              <div className="flex items-center gap-1 mr-2 text-[11px]">
                <button
                  onClick={() => setConsoleFilter('all')}
                  className={`px-1.5 py-0.5 rounded ${consoleFilter === 'all' ? 'bg-[#21262d] text-white' : 'text-slate-500'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setConsoleFilter('error')}
                  className={`px-1.5 py-0.5 rounded ${consoleFilter === 'error' ? 'bg-rose-900/40 text-rose-300' : 'text-slate-500'}`}
                >
                  Errors
                </button>
                <button
                  onClick={handleClearLogs}
                  className="p-1 text-slate-400 hover:text-slate-200 rounded"
                  title="Clear Console"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}

            <button className="text-slate-400 hover:text-slate-200">
              {consoleOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Console Content */}
        {consoleOpen && (
          <div className="h-44 flex flex-col bg-[#0d1117] border-t border-[#21262d] font-mono text-xs">
            <div className="flex-1 overflow-y-auto p-2 space-y-1 select-text">
              {filteredLogs.length === 0 ? (
                <div className="text-slate-600 text-center py-6 italic text-[11px]">
                  No console logs recorded yet. Run code or trigger events to see outputs.
                </div>
              ) : (
                filteredLogs.map(log => (
                  <div
                    key={log.id}
                    className={`flex items-start justify-between gap-2 p-1 rounded leading-relaxed text-[11px] ${
                      log.type === 'error'
                        ? 'bg-rose-950/30 text-rose-300 border-l-2 border-rose-500'
                        : log.type === 'warn'
                        ? 'bg-amber-950/20 text-amber-300 border-l-2 border-amber-500'
                        : 'text-slate-300 hover:bg-[#161b22]'
                    }`}
                  >
                    <div className="flex items-start gap-2 flex-1 overflow-hidden">
                      <span className="text-slate-600 shrink-0">{log.timestamp}</span>
                      <pre className="whitespace-pre-wrap break-all font-mono">{log.text}</pre>
                    </div>

                    {log.type === 'error' && onFixErrorWithAI && (
                      <button
                        onClick={() => onFixErrorWithAI(log.text)}
                        className="shrink-0 flex items-center gap-1 px-2 py-0.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded border border-rose-500/30 transition-colors text-[10px]"
                        title="Diagnose & auto-fix with Gemini Live"
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Fix with Gemini</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Console Command Input */}
            <form
              onSubmit={handleExecCommand}
              className="flex items-center gap-2 px-2 py-1.5 border-t border-[#21262d] bg-[#161b22]"
            >
              <span className="text-sky-400 font-bold">&gt;</span>
              <input
                type="text"
                value={evalCommand}
                onChange={e => setEvalCommand(e.target.value)}
                placeholder="Execute JavaScript expression in sandbox context..."
                className="flex-1 bg-transparent border-none outline-none text-slate-200 text-xs font-mono placeholder-slate-600"
              />
              <button
                type="submit"
                className="px-2 py-0.5 bg-[#21262d] hover:bg-[#30363d] text-slate-300 rounded text-[11px]"
              >
                Run
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
