import React, { useState, useEffect, useMemo } from 'react';
import { ProjectFile } from '../../types/ide';
import {
  findTestFiles,
  runAllTests,
  executeTestFile,
  generateSampleTestCode,
  TestFileResult,
  TestRunSummary
} from '../../utils/vitestEngine';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  FileCode,
  Sparkles,
  Plus,
  Maximize2,
  Search,
  Zap,
  ChevronDown,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

interface TestingTabProps {
  files: ProjectFile[];
  onSelectFile: (fileId: string) => void;
  onOpenFullRunner?: () => void;
  onAddFile?: (name: string, language: ProjectFile['language'], content?: string) => void;
}

export const TestingTab: React.FC<TestingTabProps> = ({
  files,
  onSelectFile,
  onOpenFullRunner,
  onAddFile,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<TestRunSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'failed'>('all');
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});

  const testFiles = useMemo(() => findTestFiles(files), [files]);

  const handleRunAll = async () => {
    if (isRunning) return;
    setIsRunning(true);
    try {
      const res = await runAllTests(files);
      setSummary(res);
      const expandMap: Record<string, boolean> = {};
      res.fileResults.forEach(f => {
        expandMap[f.fileId] = true;
      });
      setExpandedFiles(expandMap);
    } finally {
      setIsRunning(false);
    }
  };

  // Run on mount if test files exist
  useEffect(() => {
    if (testFiles.length > 0 && !summary) {
      handleRunAll();
    }
  }, [testFiles.length]);

  const toggleExpand = (id: string) => {
    setExpandedFiles(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddSampleTest = () => {
    if (onAddFile) {
      onAddFile('math.test.ts', 'typescript', generateSampleTestCode('math'));
    }
  };

  return (
    <div className="w-80 h-full bg-[#111622] border-r border-[#262c36] flex flex-col text-slate-100 select-none shrink-0 font-sans">
      {/* Top Header */}
      <div className="p-3 border-b border-[#262c36] bg-[#161c28] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center shadow-xs">
            <Zap className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-xs text-white">
              <span>VITEST</span>
              <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 px-1 rounded border border-emerald-500/30">
                v2.1
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {testFiles.length} file{testFiles.length !== 1 ? 's' : ''} detected
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onOpenFullRunner && (
            <button
              onClick={onOpenFullRunner}
              className="p-1 text-slate-400 hover:text-white hover:bg-[#21262d] rounded transition-colors"
              title="Expand into full Test Runner panel"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleRunAll}
            disabled={isRunning || testFiles.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors shadow-xs"
          >
            {isRunning ? (
              <RotateCcw className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3 fill-white" />
            )}
            <span>Run All</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      {summary && (
        <div className="px-3 py-2 bg-[#0d1117] border-b border-[#262c36] flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-semibold">✓ {summary.passedTests} passed</span>
            {summary.failedTests > 0 && (
              <span className="text-rose-400 font-semibold">✕ {summary.failedTests} failed</span>
            )}
          </div>
          <span className="text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {summary.duration}ms
          </span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="p-2 border-b border-[#262c36] space-y-1.5">
        <div className="flex items-center gap-1 bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 focus-within:border-emerald-500">
          <Search className="w-3 h-3 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search test names..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-slate-200 text-xs w-full font-sans"
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-1.5 py-0.5 rounded transition-colors ${filterStatus === 'all' ? 'bg-[#21262d] text-white font-medium' : 'hover:text-slate-200'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('passed')}
            className={`px-1.5 py-0.5 rounded transition-colors ${filterStatus === 'passed' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'hover:text-emerald-300'}`}
          >
            Passed
          </button>
          <button
            onClick={() => setFilterStatus('failed')}
            className={`px-1.5 py-0.5 rounded transition-colors ${filterStatus === 'failed' ? 'bg-rose-500/20 text-rose-300 font-medium' : 'hover:text-rose-300'}`}
          >
            Failed
          </button>
        </div>
      </div>

      {/* Test Suites Tree List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {testFiles.length === 0 ? (
          <div className="p-6 text-center text-slate-400 space-y-3">
            <p className="text-xs">No unit test files found in workspace.</p>
            {onAddFile && (
              <button
                onClick={handleAddSampleTest}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Sample Test File</span>
              </button>
            )}
          </div>
        ) : (
          testFiles.map(file => {
            const fileRes = summary?.fileResults.find(r => r.fileId === file.id);
            const isExpanded = expandedFiles[file.id] ?? true;
            const hasFailed = fileRes && fileRes.failed > 0;
            const isPassed = fileRes && fileRes.failed === 0 && fileRes.passed > 0;

            return (
              <div
                key={file.id}
                className="bg-[#161c28] border border-[#262c36] rounded-lg overflow-hidden text-xs"
              >
                {/* File Row */}
                <div
                  onClick={() => toggleExpand(file.id)}
                  className="flex items-center justify-between px-2.5 py-2 cursor-pointer hover:bg-[#1a2232] transition-colors"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                    )}
                    {hasFailed ? (
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    ) : isPassed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span className="font-mono font-medium truncate text-slate-200">
                      {file.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-mono shrink-0">
                    {fileRes && <span className="text-slate-500">{fileRes.duration}ms</span>}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onSelectFile(file.id);
                      }}
                      className="text-slate-400 hover:text-sky-300"
                      title="Open in editor"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {/* Suites & Tests inside File */}
                {isExpanded && fileRes && (
                  <div className="px-2 pb-2 space-y-1.5 pt-1 border-t border-[#262c36]/60">
                    {fileRes.suites.map(suite => (
                      <div key={suite.name} className="space-y-1">
                        <div className="text-[11px] font-semibold text-slate-400 px-1 flex items-center justify-between">
                          <span>{suite.name}</span>
                          <span className="font-mono text-[9px] text-slate-500">
                            {suite.passed}/{suite.tests.length}
                          </span>
                        </div>

                        <div className="space-y-1 pl-1">
                          {suite.tests
                            .filter(t => {
                              if (filterStatus === 'passed' && t.status !== 'passed') return false;
                              if (filterStatus === 'failed' && t.status !== 'failed') return false;
                              if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                              return true;
                            })
                            .map(t => (
                              <div
                                key={t.id}
                                className="flex flex-col p-1.5 bg-[#0d1117] rounded border border-[#21262d] text-[11px]"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {t.status === 'passed' ? (
                                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                    ) : (
                                      <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
                                    )}
                                    <span
                                      className={`truncate ${
                                        t.status === 'passed' ? 'text-slate-300' : 'text-rose-300 font-semibold'
                                      }`}
                                    >
                                      {t.name}
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-mono text-slate-500 shrink-0">
                                    {t.duration}ms
                                  </span>
                                </div>

                                {t.error && (
                                  <div className="mt-1 p-1.5 bg-rose-950/30 border border-rose-500/30 rounded text-[10px] font-mono text-rose-300 whitespace-pre-wrap">
                                    {t.error}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
