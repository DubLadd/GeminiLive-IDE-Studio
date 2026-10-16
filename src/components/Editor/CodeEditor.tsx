import React, { useState, useEffect, useRef } from 'react';
import { ProjectFile } from '../../types/ide';
import { CollabParticipant } from '../../types/collaboration';
import { formatCode } from '../../utils/codeFormatter';
import { Search, Replace, Copy, Check, Sparkles, Wand2, RefreshCw, Users } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup'; // HTML
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';

interface CodeEditorProps {
  file: ProjectFile;
  onChange: (newContent: string) => void;
  onSave?: () => void;
  onAskCopilot?: (selectedCode: string) => void;
  remoteParticipants?: CollabParticipant[];
  currentParticipantId?: string;
  onCursorChange?: (line: number, col: number, selectionText?: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  file,
  onChange,
  onSave,
  onAskCopilot,
  remoteParticipants = [],
  currentParticipantId,
  onCursorChange,
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [selectedText, setSelectedText] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  // Sync highlighting across all supported languages: TS, SQL, YAML, JS, HTML, CSS, JSON, Python, Bash
  const highlightedCode = React.useMemo(() => {
    let grammar = Prism.languages.javascript;
    const lang = file.language?.toLowerCase();

    if (lang === 'html' || lang === 'markup') grammar = Prism.languages.markup;
    else if (lang === 'css') grammar = Prism.languages.css;
    else if (lang === 'json') grammar = Prism.languages.json;
    else if (lang === 'markdown') grammar = Prism.languages.markdown;
    else if (lang === 'typescript' || lang === 'ts' || lang === 'tsx') grammar = Prism.languages.typescript || Prism.languages.javascript;
    else if (lang === 'sql') grammar = Prism.languages.sql;
    else if (lang === 'yaml' || lang === 'yml') grammar = Prism.languages.yaml;
    else if (lang === 'python' || lang === 'py') grammar = Prism.languages.python;
    else if (lang === 'shell' || lang === 'bash' || lang === 'sh') grammar = Prism.languages.bash;

    try {
      return Prism.highlight(file.content || '', grammar, lang || 'javascript');
    } catch {
      return file.content || '';
    }
  }, [file.content, file.language]);

  const lines = (file.content || '').split('\n');
  const lineCount = lines.length;

  // Filter remote participants active on this file
  const activeRemoteParticipants = remoteParticipants.filter(
    p => p.activeFileId === file.id && p.id !== currentParticipantId
  );

  // Handle Tab key and shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      onSave?.();
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
      e.preventDefault();
      setShowSearch(prev => !prev);
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;

      const updated = val.substring(0, start) + '  ' + val.substring(end);
      onChange(updated);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
        handleSelect();
      }, 0);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleSelect = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, start);
    const lineIndex = textBefore.split('\n').length;
    const colIndex = start - textBefore.lastIndexOf('\n');

    setCursorPos({ line: lineIndex, col: colIndex });

    const selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    setSelectedText(selected);

    // Notify collaboration service of cursor and selection movement
    onCursorChange?.(lineIndex, colIndex, selected);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Search & Replace actions
  const handleFindNext = () => {
    if (!searchQuery || !textareaRef.current) return;
    const content = textareaRef.current.value;
    const start = textareaRef.current.selectionEnd;
    const index = content.toLowerCase().indexOf(searchQuery.toLowerCase(), start);

    if (index !== -1) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(index, index + searchQuery.length);
      handleSelect();
    } else {
      // Loop back to beginning
      const firstIndex = content.toLowerCase().indexOf(searchQuery.toLowerCase(), 0);
      if (firstIndex !== -1) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(firstIndex, firstIndex + searchQuery.length);
        handleSelect();
      }
    }
  };

  const handleReplaceOne = () => {
    if (!searchQuery || !textareaRef.current) return;
    const content = textareaRef.current.value;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selected = content.substring(start, end);

    if (selected.toLowerCase() === searchQuery.toLowerCase()) {
      const updated = content.substring(0, start) + replaceQuery + content.substring(end);
      onChange(updated);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(start, start + replaceQuery.length);
          handleFindNext();
        }
      }, 0);
    } else {
      handleFindNext();
    }
  };

  const handleReplaceAll = () => {
    if (!searchQuery) return;
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const updated = file.content.replace(regex, replaceQuery);
    onChange(updated);
  };

  const handleFormat = () => {
    const formatted = formatCode(file.content, file.language);
    onChange(formatted);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d1117] text-slate-100 overflow-hidden relative select-none">
      {/* Editor Sub-Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-[#21262d] text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">{file.name}</span>
          <span className="px-1.5 py-0.5 text-[10px] uppercase font-mono bg-[#21262d] text-slate-400 rounded">
            {file.language}
          </span>
          {activeRemoteParticipants.length > 0 && (
            <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-[#30363d]">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <div className="flex -space-x-1.5 overflow-hidden">
                {activeRemoteParticipants.map(p => (
                  <div
                    key={p.id}
                    title={`${p.name} editing here`}
                    className="w-4 h-4 rounded-full border border-[#161b22] flex items-center justify-center text-[8px] font-bold text-slate-900 shadow-sm"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
              <span className="text-[11px] text-emerald-400 font-mono">
                {activeRemoteParticipants.length} active
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {selectedText && onAskCopilot && (
            <button
              onClick={() => onAskCopilot(selectedText)}
              className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-sky-500/20 to-purple-500/20 hover:from-sky-500/30 hover:to-purple-500/30 text-sky-300 border border-sky-500/30 rounded text-xs transition-colors"
              title="Send highlighted code snippet to Gemini"
            >
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span>Ask Gemini</span>
            </button>
          )}

          <button
            onClick={() => setShowSearch(prev => !prev)}
            className={`p-1 rounded hover:bg-[#21262d] transition-colors ${showSearch ? 'text-sky-400 bg-[#21262d]' : 'text-slate-400 hover:text-slate-200'}`}
            title="Find & Replace (Ctrl+F)"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleFormat}
            className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-[#21262d] transition-colors"
            title="Clean Indentation & Format Code"
          >
            <Wand2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-[#21262d] transition-colors"
            title="Copy Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Find & Replace Bar */}
      {showSearch && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#1b212c] border-b border-[#30363d] text-xs">
          <div className="flex items-center gap-1 bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 focus-within:border-sky-500">
            <Search className="w-3 h-3 text-slate-500" />
            <input
              type="text"
              placeholder="Find..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFindNext()}
              className="bg-transparent border-none outline-none text-slate-200 text-xs w-28"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 focus-within:border-sky-500">
            <Replace className="w-3 h-3 text-slate-500" />
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceQuery}
              onChange={e => setReplaceQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-slate-200 text-xs w-28"
            />
          </div>

          <button
            onClick={handleFindNext}
            className="px-2 py-1 bg-[#21262d] hover:bg-[#30363d] text-slate-300 rounded text-[11px]"
          >
            Next
          </button>
          <button
            onClick={handleReplaceOne}
            className="px-2 py-1 bg-[#21262d] hover:bg-[#30363d] text-slate-300 rounded text-[11px]"
          >
            Replace
          </button>
          <button
            onClick={handleReplaceAll}
            className="px-2 py-1 bg-[#21262d] hover:bg-[#30363d] text-slate-300 rounded text-[11px]"
          >
            All
          </button>
          <button
            onClick={() => setShowSearch(false)}
            className="text-slate-500 hover:text-slate-300 ml-auto text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Editor Body */}
      <div className="flex-1 relative flex overflow-hidden font-mono text-[13px]">
        {/* Line Numbers Gutter */}
        <div className="w-12 bg-[#0d1117] border-r border-[#21262d] select-none text-right pr-3 py-3 text-slate-600 font-mono text-[13px] leading-[1.6]">
          {Array.from({ length: lineCount }).map((_, i) => (
            <div
              key={i}
              className={`${cursorPos.line === i + 1 ? 'text-slate-300 font-bold' : ''}`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code Canvas Container */}
        <div className="flex-1 relative overflow-hidden h-full">
          {/* Syntax Highlighted Underlay */}
          <pre
            ref={preRef}
            aria-hidden="true"
            className="absolute inset-0 m-0 p-3 overflow-hidden pointer-events-none whitespace-pre font-mono text-[13px] leading-[1.6] text-slate-200"
            dangerouslySetInnerHTML={{ __html: highlightedCode + '\n' }}
          />

          {/* Remote Collaborators Cursors & Labels Overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20 m-0 p-3">
            {activeRemoteParticipants.map(participant => {
              const lineIdx = Math.max(1, participant.cursorLine || 1) - 1;
              const colIdx = Math.max(1, participant.cursorCol || 1) - 1;

              // Approximate line height (20.8px for 13px at 1.6 leading) and monospace character width (~7.8px)
              const topPx = lineIdx * 20.8;
              const leftPx = colIdx * 7.8;

              return (
                <div
                  key={participant.id}
                  style={{
                    position: 'absolute',
                    top: `${topPx + 12}px`,
                    left: `${leftPx + 12}px`,
                    transition: 'all 0.12s ease-out',
                  }}
                  className="flex items-start"
                >
                  {/* Vertical Caret */}
                  <div
                    className="w-[2px] h-[18px] animate-pulse"
                    style={{ backgroundColor: participant.color }}
                  />

                  {/* Collaborator Badge Tag */}
                  <div
                    className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-white rounded shadow-md whitespace-nowrap ml-0.5 -mt-3.5 select-none"
                    style={{ backgroundColor: participant.color }}
                  >
                    {participant.name}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Textarea Overlay */}
          <textarea
            ref={textareaRef}
            value={file.content}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            onSelect={handleSelect}
            onClick={handleSelect}
            onKeyUp={handleSelect}
            spellCheck="false"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className="absolute inset-0 w-full h-full m-0 p-3 bg-transparent text-transparent caret-sky-400 resize-none outline-none font-mono text-[13px] leading-[1.6] whitespace-pre overflow-auto z-10 selection:bg-sky-500/30 selection:text-transparent"
          />
        </div>
      </div>

      {/* Editor Status Bar Footer */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#161b22] border-t border-[#21262d] text-[11px] text-slate-500 select-none">
        <div className="flex items-center gap-3">
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>·</span>
          <span>UTF-8</span>
          <span>·</span>
          <span>2 spaces</span>
          <span>·</span>
          <span className="uppercase text-slate-400">{file.language}</span>
        </div>
        <div className="flex items-center gap-2">
          {activeRemoteParticipants.length > 0 ? (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px]">Real-Time Sync ({activeRemoteParticipants.length + 1} users)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600">Local Session</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
