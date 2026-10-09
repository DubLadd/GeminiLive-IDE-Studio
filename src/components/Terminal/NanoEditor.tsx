import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  X,
  Search,
  Scissors,
  Clipboard,
  HelpCircle,
  FileText,
  Check,
  AlertCircle
} from 'lucide-react';

interface NanoEditorProps {
  fileName: string;
  initialContent: string;
  onSave: (fileName: string, content: string) => void;
  onExit: (saved: boolean) => void;
}

export const NanoEditor: React.FC<NanoEditorProps> = ({
  fileName,
  initialContent,
  onSave,
  onExit,
}) => {
  const [content, setContent] = useState(initialContent);
  const [isModified, setIsModified] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>(
    `[ GNU nano 7.2 - File: ${fileName} - Use ^O to WriteOut, ^X to Exit ]`
  );
  const [cutBuffer, setCutBuffer] = useState<string>('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [showHelp, setShowHelp] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsModified(true);
    updateCursorPos(e.target);
  };

  const updateCursorPos = (textarea: HTMLTextAreaElement) => {
    const textUntilCursor = textarea.value.substring(0, textarea.selectionStart);
    const lines = textUntilCursor.split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    setCursorPos({ line, col });
  };

  const handleSave = () => {
    onSave(fileName, content);
    setIsModified(false);
    const linesCount = content.split('\n').length;
    setStatusMessage(`[ Wrote ${linesCount} lines to ${fileName} ]`);
  };

  const handleExit = () => {
    if (isModified) {
      handleSave();
    }
    onExit(isModified);
  };

  const handleCutLine = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const lines = content.split('\n');
    const currentLineIdx = cursorPos.line - 1;
    if (currentLineIdx >= 0 && currentLineIdx < lines.length) {
      const lineToCut = lines[currentLineIdx];
      setCutBuffer(lineToCut);
      lines.splice(currentLineIdx, 1);
      const newContent = lines.join('\n');
      setContent(newContent);
      setIsModified(true);
      setStatusMessage(`[ Cut 1 line to cutbuffer ]`);
    }
  };

  const handlePasteLine = () => {
    if (!cutBuffer) {
      setStatusMessage(`[ Cutbuffer is empty ]`);
      return;
    }
    const lines = content.split('\n');
    const currentLineIdx = cursorPos.line - 1;
    lines.splice(currentLineIdx, 0, cutBuffer);
    const newContent = lines.join('\n');
    setContent(newContent);
    setIsModified(true);
    setStatusMessage(`[ Pasted line from cutbuffer ]`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Intercept Nano shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleSave();
      } else if (e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleExit();
      } else if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleCutLine();
      } else if (e.key.toLowerCase() === 'u') {
        e.preventDefault();
        handlePasteLine();
      } else if (e.key.toLowerCase() === 'w') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      } else if (e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setShowHelp(prev => !prev);
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setStatusMessage(`[ Line ${cursorPos.line}/${content.split('\n').length}, Col ${cursorPos.col} ]`);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      setContent(newContent);
      setIsModified(true);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const linesList = content.split('\n');

  return (
    <div className="flex-1 flex flex-col bg-[#0c1017] text-slate-100 font-mono text-xs select-none h-full overflow-hidden">
      {/* Nano Header Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#1e293b] text-white border-b border-[#334155] select-none text-[11px] font-semibold">
        <div className="flex items-center gap-2">
          <span className="bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
            GNU nano 7.2
          </span>
          <span className="text-slate-300 font-mono">File: {fileName}</span>
          {isModified && (
            <span className="text-amber-400 bg-amber-950/60 border border-amber-500/30 px-1 py-0.2 rounded text-[10px] font-bold">
              [Modified]
            </span>
          )}
        </div>

        {/* Quick touch actions for mobile / desktop */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition-colors"
            title="WriteOut File (Ctrl+O)"
          >
            <Save className="w-3 h-3" />
            <span>WriteOut (^O)</span>
          </button>
          <button
            onClick={handleExit}
            className="flex items-center gap-1 px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold transition-colors"
            title="Exit Nano (Ctrl+X)"
          >
            <X className="w-3 h-3" />
            <span>Exit (^X)</span>
          </button>
        </div>
      </div>

      {/* Nano Main Editor Body */}
      <div className="flex-1 flex overflow-hidden relative bg-[#090d16]">
        {/* Line Numbers Gutter */}
        <div className="w-10 bg-[#0e1420] text-slate-500 text-[11px] font-mono py-2 text-right pr-2 select-none border-r border-[#1e293b] overflow-hidden">
          {linesList.map((_, i) => (
            <div key={i} className="leading-5 h-5">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          onKeyUp={e => updateCursorPos(e.currentTarget)}
          onClick={e => updateCursorPos(e.currentTarget)}
          spellCheck="false"
          autoCapitalize="none"
          autoComplete="off"
          className="flex-1 bg-transparent text-slate-200 font-mono text-xs p-2 leading-5 outline-none resize-none overflow-y-auto selection:bg-sky-500/30 whitespace-pre"
          placeholder="Start typing file content..."
        />

        {/* Search Overlay */}
        {showSearch && (
          <div className="absolute top-2 right-2 bg-[#161b22] border border-sky-500/40 p-2 rounded shadow-xl flex items-center gap-2 z-20">
            <Search className="w-3.5 h-3.5 text-sky-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Where is (regex/string)..."
              className="bg-[#0d1117] border border-[#30363d] px-2 py-0.5 text-xs text-white rounded outline-none font-mono"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const idx = content.indexOf(searchQuery);
                  if (idx !== -1 && textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.setSelectionRange(idx, idx + searchQuery.length);
                    setStatusMessage(`[ Found match for "${searchQuery}" ]`);
                  } else {
                    setStatusMessage(`[ "${searchQuery}" not found ]`);
                  }
                } else if (e.key === 'Escape') {
                  setShowSearch(false);
                }
              }}
            />
            <button
              onClick={() => setShowSearch(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Help Overlay */}
        {showHelp && (
          <div className="absolute inset-4 bg-[#161b22]/95 border border-[#30363d] rounded p-4 text-xs font-mono text-slate-300 overflow-y-auto z-30 shadow-2xl">
            <div className="flex justify-between items-center mb-2 pb-1 border-b border-[#30363d]">
              <span className="font-bold text-sky-400">GNU nano 7.2 Help Manual</span>
              <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mb-2">The nano editor is designed to emulate the functionality of UW-PICO.</p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><span className="text-emerald-400 font-bold">^O (Ctrl+O)</span> Write file to disk</div>
              <div><span className="text-emerald-400 font-bold">^X (Ctrl+X)</span> Close nano editor</div>
              <div><span className="text-emerald-400 font-bold">^W (Ctrl+W)</span> Search / Where is</div>
              <div><span className="text-emerald-400 font-bold">^K (Ctrl+K)</span> Cut current line</div>
              <div><span className="text-emerald-400 font-bold">^U (Ctrl+U)</span> Paste cut buffer</div>
              <div><span className="text-emerald-400 font-bold">^C (Ctrl+C)</span> Display line/col pos</div>
            </div>
          </div>
        )}
      </div>

      {/* Status Message Line */}
      <div className="bg-[#111827] px-3 py-1 border-t border-[#1e293b] text-slate-300 text-[11px] truncate flex justify-between items-center">
        <span>{statusMessage}</span>
        <span className="text-slate-400 font-mono text-[10px]">
          Line: {cursorPos.line}/{linesList.length} Col: {cursorPos.col}
        </span>
      </div>

      {/* Bottom Nano Shortcut Bar */}
      <div className="bg-[#161e2e] border-t border-[#1e293b] p-1.5 grid grid-cols-3 sm:grid-cols-6 gap-1 select-none text-[10px]">
        <button
          onClick={() => setShowHelp(prev => !prev)}
          className="flex items-center gap-1 px-1.5 py-1 bg-[#0f172a] hover:bg-[#1e293b] text-slate-300 rounded text-left transition-colors"
        >
          <span className="bg-slate-700 text-white font-bold px-1 rounded">^G</span>
          <span>Get Help</span>
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1 px-1.5 py-1 bg-[#0f172a] hover:bg-[#1e293b] text-emerald-300 rounded text-left transition-colors"
        >
          <span className="bg-emerald-700 text-white font-bold px-1 rounded">^O</span>
          <span>WriteOut</span>
        </button>
        <button
          onClick={() => setShowSearch(true)}
          className="flex items-center gap-1 px-1.5 py-1 bg-[#0f172a] hover:bg-[#1e293b] text-sky-300 rounded text-left transition-colors"
        >
          <span className="bg-sky-700 text-white font-bold px-1 rounded">^W</span>
          <span>Where Is</span>
        </button>
        <button
          onClick={handleCutLine}
          className="flex items-center gap-1 px-1.5 py-1 bg-[#0f172a] hover:bg-[#1e293b] text-amber-300 rounded text-left transition-colors"
        >
          <span className="bg-amber-700 text-white font-bold px-1 rounded">^K</span>
          <span>Cut Text</span>
        </button>
        <button
          onClick={handlePasteLine}
          className="flex items-center gap-1 px-1.5 py-1 bg-[#0f172a] hover:bg-[#1e293b] text-indigo-300 rounded text-left transition-colors"
        >
          <span className="bg-indigo-700 text-white font-bold px-1 rounded">^U</span>
          <span>Paste Text</span>
        </button>
        <button
          onClick={handleExit}
          className="flex items-center gap-1 px-1.5 py-1 bg-[#0f172a] hover:bg-[#1e293b] text-rose-300 rounded text-left transition-colors"
        >
          <span className="bg-rose-700 text-white font-bold px-1 rounded">^X</span>
          <span>Exit</span>
        </button>
      </div>
    </div>
  );
};
