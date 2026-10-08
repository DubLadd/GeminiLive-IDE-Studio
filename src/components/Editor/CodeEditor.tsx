import React, { useState, useEffect, useRef } from 'react';
import { ProjectFile } from '../../types/ide';
import { formatCode } from '../../utils/codeFormatter';
import { Search, Replace, Copy, Check, Sparkles, Wand2, RefreshCw } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup'; // HTML
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';

interface CodeEditorProps {
  file: ProjectFile;
  onChange: (newContent: string) => void;
  onSave?: () => void;
  onAskCopilot?: (selectedCode: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  file,
  onChange,
  onSave,
  onAskCopilot,
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [selectedText, setSelectedText] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  // Sync highlighting
  const highlightedCode = React.useMemo(() => {
    let grammar = Prism.languages.javascript;
    if (file.language === 'html') grammar = Prism.languages.markup;
    else if (file.language === 'css') grammar = Prism.languages.css;
    else if (file.language === 'json') grammar = Prism.languages.json;
    else if (file.language === 'markdown') grammar = Prism.languages.markdown;

    try {
      return Prism.highlight(file.content || '', grammar, file.language);
    } catch {
      return file.content || '';
    }
  }, [file.content, file.language]);

  const lines = (file.content || '').split('\n');
  const lineCount = lines.length;

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
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Search & Replace actions
  const handleFindNext = () => {
    if (!searchQuery || !textareaRef.current) return;
    const text = textareaRef.current.value;
    const currentPos = textareaRef.current.selectionEnd;
    let nextIdx = text.indexOf(searchQuery, currentPos);
    if (nextIdx === -1) {
      nextIdx = text.indexOf(searchQuery, 0); // wrap around
    }
    if (nextIdx !== -1) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(nextIdx, nextIdx + searchQuery.length);
    }
  };

  const handleReplaceOne = () => {
    if (!searchQuery || !textareaRef.current) return;
    const text = textareaRef.current.value;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const sel = text.substring(start, end);

    if (sel === searchQuery) {
      const nextContent = text.substring(0, start) + replaceQuery + text.substring(end);
      onChange(nextContent);
      setTimeout(() => {
        handleFindNext();
      }, 10);
    } else {
      handleFindNext();
    }
  };

  const handleReplaceAll = () => {
    if (!searchQuery) return;
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const updated = file.content.replace(regex, replaceQuery);
    onChange(updated);
  };

  const handleFormat = () => {
    try {
      const formatted = formatCode(file.content, file.language);
      onChange(formatted);
    } catch {
      // Ignored if parsing fails
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-slate-200 relative overflow-hidden select-text">
      {/* Editor Sub-header & Action Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-[#30363d] text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="font-mono text-slate-300 font-medium">{file.name}</span>
          <span className="text-slate-600">·</span>
          <span className="uppercase text-[10px] tracking-wider text-slate-500 font-semibold">{file.language}</span>
          <span className="text-slate-600">·</span>
          <span>{lineCount} lines</span>
        </div>

        <div className="flex items-center gap-1.5">
          {selectedText.trim() && onAskCopilot && (
            <button
              onClick={() => onAskCopilot(selectedText)}
              className="flex items-center gap-1 px-2 py-1 bg-sky-600/20 text-sky-400 hover:bg-sky-600/30 rounded border border-sky-500/30 transition-colors text-[11px] font-medium"
              title="Ask Gemini Live about selected snippet"
            >
              <Sparkles className="w-3 h-3" />
              <span>Ask Gemini</span>
            </button>
          )}

          <button
            onClick={() => setShowSearch(prev => !prev)}
            className={`p-1 rounded hover:bg-[#21262d] transition-colors ${showSearch ? 'text-sky-400 bg-[#21262d]' : 'text-slate-400'}`}
            title="Find & Replace (Ctrl+F)"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleFormat}
            className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-[#21262d] transition-colors"
            title="Clean Indentation"
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
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-600">Gemini Live Active</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        </div>
      </div>
    </div>
  );
};
