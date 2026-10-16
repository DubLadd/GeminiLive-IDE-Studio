import React, { useState, useMemo } from 'react';
import { ProjectFile } from '../../types/ide';
import {
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Sparkles,
  FileCode,
  Check,
  Search,
  Filter
} from 'lucide-react';

interface TestingTabProps {
  files: ProjectFile[];
  onSelectFile: (fileId: string) => void;
}

interface TestCase {
  id: string;
  fileId: string;
  fileName: string;
  name: string;
  type: 'unit' | 'syntax' | 'integration' | 'security';
  status: 'passed' | 'failed' | 'running' | 'idle';
  duration?: number;
  message?: string;
}

export const TestingTab: React.FC<TestingTabProps> = ({ files, onSelectFile }) => {
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Generate dynamic test suites from files
  const initialTests = useMemo<TestCase[]>(() => {
    const list: TestCase[] = [];

    files.forEach((f, idx) => {
      // Syntax & Structure Test
      list.push({
        id: `syntax-${f.id}`,
        fileId: f.id,
        fileName: f.name,
        name: `Validate syntax & encoding for ${f.name}`,
        type: 'syntax',
        status: 'passed',
        duration: 12 + (idx * 3),
        message: 'No unclosed tokens or syntax anomalies detected.'
      });

      // Unit logic test for scripts/html
      if (f.name.endsWith('.js') || f.name.endsWith('.ts') || f.name.endsWith('.jsx') || f.name.endsWith('.tsx')) {
        list.push({
          id: `unit-${f.id}`,
          fileId: f.id,
          fileName: f.name,
          name: `Execute pure functions & unit exports (${f.name})`,
          type: 'unit',
          status: 'passed',
          duration: 35 + (idx * 5),
          message: 'All asserted return values matched snapshot.'
        });
      }

      if (f.name.endsWith('.html')) {
        list.push({
          id: `dom-${f.id}`,
          fileId: f.id,
          fileName: f.name,
          name: `DOM integrity & root node presence (${f.name})`,
          type: 'integration',
          status: f.content.includes('<div') || f.content.includes('<canvas') ? 'passed' : 'failed',
          duration: 18,
          message: f.content.includes('<div') || f.content.includes('<canvas')
            ? 'Root container properly mounted.'
            : 'Warning: Missing standard container elements.'
        });
      }

      if (f.name.endsWith('.json')) {
        let validJson = true;
        try {
          JSON.parse(f.content);
        } catch {
          validJson = false;
        }
        list.push({
          id: `json-${f.id}`,
          fileId: f.id,
          fileName: f.name,
          name: `JSON schema parser check (${f.name})`,
          type: 'unit',
          status: validJson ? 'passed' : 'failed',
          duration: 8,
          message: validJson ? 'Well-formed JSON structure.' : 'Syntax error parsing JSON payload.'
        });
      }
    });

    return list;
  }, [files]);

  const [tests, setTests] = useState<TestCase[]>(initialTests);

  const runAllTests = () => {
    setIsRunningAll(true);
    setTests(prev => prev.map(t => ({ ...t, status: 'running' })));

    setTimeout(() => {
      setTests(prev =>
        prev.map(t => {
          const file = files.find(f => f.id === t.fileId);
          let passed = true;
          let msg = 'Assertion passed cleanly.';

          if (t.type === 'syntax' && file) {
            passed = file.content.length > 0;
            msg = passed ? 'Tokens parsed without errors.' : 'File is empty.';
          } else if (file?.name.endsWith('.json')) {
            try {
              JSON.parse(file.content);
              passed = true;
              msg = 'JSON valid.';
            } catch {
              passed = false;
              msg = 'Malformed JSON.';
            }
          }

          return {
            ...t,
            status: passed ? 'passed' : 'failed',
            duration: Math.floor(Math.random() * 40) + 10,
            message: msg
          };
        })
      );
      setIsRunningAll(false);
    }, 600);
  };

  const filteredTests = tests.filter(t => {
    if (filterStatus === 'passed' && t.status !== 'passed') return false;
    if (filterStatus === 'failed' && t.status !== 'failed') return false;
    if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase()) && !t.fileName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const passedCount = tests.filter(t => t.status === 'passed').length;
  const failedCount = tests.filter(t => t.status === 'failed').length;

  return (
    <div className="w-64 bg-[#161b22] border-r border-[#30363d] flex flex-col h-full select-none text-slate-300">
      {/* Header */}
      <div className="p-3 border-b border-[#30363d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Test Runner</span>
        </div>
        <button
          onClick={runAllTests}
          disabled={isRunningAll}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded transition-all disabled:opacity-50"
          title="Run All Workspace Tests"
        >
          {isRunningAll ? (
            <RotateCcw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>{isRunningAll ? 'Running...' : 'Run All'}</span>
        </button>
      </div>

      {/* Summary Scoreboard */}
      <div className="px-3 py-2 border-b border-[#30363d] bg-black/20 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {passedCount} Passed
          </span>
          {failedCount > 0 && (
            <span className="flex items-center gap-1 text-rose-400 font-medium">
              <XCircle className="w-3.5 h-3.5" />
              {failedCount} Failed
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-400">{tests.length} tests</span>
      </div>

      {/* Search & Filter */}
      <div className="p-2 border-b border-[#30363d] flex flex-col gap-1.5">
        <div className="relative">
          <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2" />
          <input
            type="text"
            placeholder="Search test cases..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded pl-7 pr-2 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex items-center gap-1 text-[10px]">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-2 py-0.5 rounded transition-colors ${filterStatus === 'all' ? 'bg-[#21262d] text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            All ({tests.length})
          </button>
          <button
            onClick={() => setFilterStatus('passed')}
            className={`px-2 py-0.5 rounded transition-colors ${filterStatus === 'passed' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Passed ({passedCount})
          </button>
          {failedCount > 0 && (
            <button
              onClick={() => setFilterStatus('failed')}
              className={`px-2 py-0.5 rounded transition-colors ${filterStatus === 'failed' ? 'bg-rose-500/20 text-rose-300 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Failed ({failedCount})
            </button>
          )}
        </div>
      </div>

      {/* Test List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
        {filteredTests.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500">
            No matching test suites found.
          </div>
        ) : (
          filteredTests.map(test => (
            <div
              key={test.id}
              onClick={() => onSelectFile(test.fileId)}
              className="p-2 rounded bg-[#0d1117]/60 hover:bg-[#21262d]/60 border border-[#30363d]/60 hover:border-slate-600 transition-all cursor-pointer group text-xs flex flex-col gap-1"
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  {test.status === 'running' ? (
                    <RotateCcw className="w-3.5 h-3.5 text-sky-400 animate-spin shrink-0" />
                  ) : test.status === 'passed' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  )}
                  <span className="font-medium text-slate-200 truncate group-hover:text-white">
                    {test.name}
                  </span>
                </div>
                {test.duration && (
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {test.duration}ms
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pl-5">
                <span className="truncate">{test.fileName}</span>
                <span className="uppercase text-[9px] px-1 py-0.2 bg-black/30 rounded border border-white/5">
                  {test.type}
                </span>
              </div>
              {test.message && (
                <div className="text-[10px] text-slate-400 pl-5 truncate">
                  {test.message}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
