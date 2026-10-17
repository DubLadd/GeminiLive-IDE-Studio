import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ProjectFile } from '../../types/ide';
import {
  findTestFiles,
  executeTestFile,
  runAllTests,
  generateSampleTestCode,
  TestFileResult,
  TestRunSummary,
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
  Terminal,
  Filter,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Eye,
  AlertTriangle,
  Zap,
  Code
} from 'lucide-react';

interface TestRunnerProps {
  files: ProjectFile[];
  activeFileId?: string;
  onSelectFile: (fileId: string) => void;
  onAddFile: (name: string, language: ProjectFile['language'], content?: string) => void;
  onAskCopilot?: (query: string) => void;
}

export const TestRunner: React.FC<TestRunnerProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onAddFile,
  onAskCopilot,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'cli'>('visual');
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [watchMode, setWatchMode] = useState(false);
  const [summary, setSummary] = useState<TestRunSummary | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [expandedSuites, setExpandedSuites] = useState<Record<string, boolean>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [newTestFileName, setNewTestFileName] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);

  // Discover all test files
  const testFiles = useMemo(() => findTestFiles(files), [files]);

  // Default selected test file
  useEffect(() => {
    if (testFiles.length > 0 && !selectedFileId) {
      setSelectedFileId(testFiles[0].id);
    }
  }, [testFiles, selectedFileId]);

  // Run all tests
  const handleRunAll = async () => {
    if (isRunning) return;
    setIsRunning(true);
    try {
      const res = await runAllTests(files);
      setSummary(res);

      // Auto expand all suites on run
      const expandMap: Record<string, boolean> = {};
      res.fileResults.forEach(f => {
        f.suites.forEach(s => {
          expandMap[`${f.fileId}-${s.name}`] = true;
        });
      });
      setExpandedSuites(expandMap);
    } catch (err) {
      console.error('Failed to run tests:', err);
    } finally {
      setIsRunning(false);
    }
  };

  // Run single test file
  const handleRunSingleFile = async (targetFile: ProjectFile, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsRunning(true);
    try {
      const singleRes = await executeTestFile(targetFile, files);
      setSummary(prev => {
        if (!prev) {
          return {
            fileResults: [singleRes],
            totalFiles: 1,
            passedFiles: singleRes.failed === 0 ? 1 : 0,
            failedFiles: singleRes.failed > 0 ? 1 : 0,
            totalTests: singleRes.passed + singleRes.failed + singleRes.skipped,
            passedTests: singleRes.passed,
            failedTests: singleRes.failed,
            skippedTests: singleRes.skipped,
            duration: singleRes.duration,
            timestamp: new Date().toLocaleTimeString(),
          };
        }

        const updatedResults = prev.fileResults.map(f => (f.fileId === targetFile.id ? singleRes : f));
        if (!updatedResults.some(f => f.fileId === targetFile.id)) {
          updatedResults.push(singleRes);
        }

        const totalTests = updatedResults.reduce((acc, r) => acc + r.passed + r.failed + r.skipped, 0);
        const passedTests = updatedResults.reduce((acc, r) => acc + r.passed, 0);
        const failedTests = updatedResults.reduce((acc, r) => acc + r.failed, 0);

        return {
          ...prev,
          fileResults: updatedResults,
          totalFiles: updatedResults.length,
          passedFiles: updatedResults.filter(f => f.failed === 0).length,
          failedFiles: updatedResults.filter(f => f.failed > 0).length,
          totalTests,
          passedTests,
          failedTests,
          timestamp: new Date().toLocaleTimeString(),
        };
      });

      // Expand its suites
      setExpandedSuites(prev => {
        const next = { ...prev };
        singleRes.suites.forEach(s => {
          next[`${targetFile.id}-${s.name}`] = true;
        });
        return next;
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Auto-run once on initial load if tests exist and haven't run yet
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current && testFiles.length > 0) {
      hasInitialized.current = true;
      handleRunAll();
    }
  }, [testFiles.length]);

  // Watch mode trigger when project files change
  const prevFilesSignature = useRef('');
  useEffect(() => {
    if (!watchMode || testFiles.length === 0) return;
    const signature = files.map(f => `${f.name}:${f.content.length}`).join('|');
    if (prevFilesSignature.current && prevFilesSignature.current !== signature) {
      handleRunAll();
    }
    prevFilesSignature.current = signature;
  }, [files, watchMode]);

  const toggleSuite = (key: string) => {
    setExpandedSuites(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Create a new sample test file
  const handleCreateTestFile = () => {
    const rawName = newTestFileName.trim() || 'math.test.ts';
    const finalName = rawName.endsWith('.test.ts') || rawName.endsWith('.test.js') ? rawName : `${rawName}.test.ts`;
    const code = generateSampleTestCode(finalName);
    onAddFile(finalName, 'typescript', code);
    setNewTestFileName('');
    setIsCreatingFile(false);
  };

  // Generate Vitest test suite using Gemini
  const handleGenerateTestsWithGemini = async () => {
    setIsGenerating(true);
    try {
      const nonTestFiles = files.filter(f => !f.name.includes('.test.') && !f.name.includes('.spec.'));
      const activeOrFirst = files.find(f => f.id === activeFileId) || nonTestFiles[0] || files[0];
      const targetName = activeOrFirst ? activeOrFirst.name.replace(/\.[^/.]+$/, '') : 'app';
      const promptText = `Generate a comprehensive Vitest unit test suite (.test.ts) for the following workspace code file "${activeOrFirst?.name}":\n\n${activeOrFirst?.content || ''}\n\nReturn strictly valid TypeScript code with imports from 'vitest' (describe, it, expect, vi) testing all edge cases, functional inputs, and return values.`;

      const resp = await fetch('/api/gemini-cli', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          files: files.map(f => ({ name: f.name, content: f.content })),
        }),
      });

      const data = await resp.json();
      let generatedCode = data.text || '';
      generatedCode = generatedCode.replace(/```typescript/g, '').replace(/```ts/g, '').replace(/```javascript/g, '').replace(/```/g, '').trim();

      if (!generatedCode || generatedCode.length < 30) {
        generatedCode = generateSampleTestCode(targetName);
      }

      const generatedFileName = `${targetName}.test.ts`;
      onAddFile(generatedFileName, 'typescript', generatedCode);
    } catch {
      // Fallback to local sample generator
      const fallbackName = 'unit.test.ts';
      onAddFile(fallbackName, 'typescript', generateSampleTestCode('unit'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Selected file result
  const activeFileResult = useMemo<TestFileResult | undefined>(() => {
    if (!summary) return undefined;
    if (selectedFileId) {
      return summary.fileResults.find(r => r.fileId === selectedFileId);
    }
    return summary.fileResults[0];
  }, [summary, selectedFileId]);

  // Aggregate CLI output
  const fullCliOutput = useMemo(() => {
    if (!summary || summary.fileResults.length === 0) return 'No tests have been executed yet.\nClick "Run All Tests" or select a file to begin.';
    let out = `⚡ Vitest v2.1.4 (In-Browser Runner)\nStarted at ${summary.timestamp}\n\n`;
    summary.fileResults.forEach(f => {
      out += f.rawOutput + '\n';
    });
    out += `\nTest Files  ${summary.passedFiles > 0 ? `${summary.passedFiles} passed` : ''}${summary.failedFiles > 0 ? `, ${summary.failedFiles} failed` : ''} (${summary.totalFiles})\n`;
    out += `     Tests  ${summary.passedTests > 0 ? `${summary.passedTests} passed` : ''}${summary.failedTests > 0 ? `, ${summary.failedTests} failed` : ''} (${summary.totalTests})\n`;
    out += `  Duration  ${summary.duration}ms\n`;
    return out;
  }, [summary]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d1117] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-[#30363d] gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                <span>VITEST RUNNER</span>
                <span className="px-1.5 py-0.2 text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                  v2.1
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {testFiles.length} test suite{testFiles.length !== 1 ? 's' : ''} detected
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          {summary && (
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#30363d] text-xs font-mono">
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{summary.passedTests} passed</span>
              </span>

              {summary.failedTests > 0 && (
                <span className="flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{summary.failedTests} failed</span>
                </span>
              )}

              <span className="flex items-center gap-1 text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700/50">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{summary.duration}ms</span>
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Watch Mode Toggle */}
          <button
            onClick={() => setWatchMode(prev => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              watchMode
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                : 'bg-[#21262d] text-slate-400 border-transparent hover:text-slate-200'
            }`}
            title="Automatically rerun tests when workspace files change"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Watch</span>
          </button>

          {/* Switch Visual / CLI Tab */}
          <div className="flex items-center bg-[#0d1117] p-0.5 rounded-lg border border-[#30363d]">
            <button
              onClick={() => setActiveTab('visual')}
              className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                activeTab === 'visual' ? 'bg-[#21262d] text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Visual
            </button>
            <button
              onClick={() => setActiveTab('cli')}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded font-medium transition-colors ${
                activeTab === 'cli' ? 'bg-[#21262d] text-amber-300 shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span>CLI Output</span>
            </button>
          </div>

          {/* Run All Button */}
          <button
            onClick={handleRunAll}
            disabled={isRunning || testFiles.length === 0}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            {isRunning ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Run All</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Runner Body */}
      {testFiles.length === 0 ? (
        /* Empty State: No Tests Found */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-200">No Unit Test Files Detected</h3>
            <p className="text-xs text-slate-400 mt-1">
              Vitest searches for files ending in <code className="text-amber-300 font-mono">.test.ts</code>, <code className="text-amber-300 font-mono">.test.js</code>, or <code className="text-amber-300 font-mono">.spec.ts</code>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 w-full">
            <button
              onClick={handleCreateTestFile}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Sample Unit Test</span>
            </button>

            <button
              onClick={handleGenerateTestsWithGemini}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-md shadow-sky-600/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'Generating...' : 'Generate with Gemini'}</span>
            </button>
          </div>
        </div>
      ) : activeTab === 'cli' ? (
        /* CLI Terminal View */
        <div className="flex-1 p-4 bg-[#090d16] font-mono text-xs overflow-y-auto whitespace-pre leading-relaxed text-slate-300 select-text">
          {fullCliOutput}
        </div>
      ) : (
        /* Visual Tree & Detail Split View */
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Discovered Test Files */}
          <div className="w-64 border-r border-[#262c36] bg-[#111622] flex flex-col shrink-0">
            {/* Search and Filter */}
            <div className="p-2 border-b border-[#262c36] space-y-2">
              <div className="flex items-center gap-1 bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 focus-within:border-emerald-500">
                <Search className="w-3 h-3 text-slate-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Filter tests..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-slate-200 text-xs w-full font-sans"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-2 py-0.5 rounded transition-colors ${filterStatus === 'all' ? 'bg-[#21262d] text-white font-medium' : 'hover:text-slate-200'}`}
                >
                  All ({summary?.totalTests || 0})
                </button>
                <button
                  onClick={() => setFilterStatus('passed')}
                  className={`px-2 py-0.5 rounded transition-colors ${filterStatus === 'passed' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'hover:text-emerald-300'}`}
                >
                  Passed ({summary?.passedTests || 0})
                </button>
                <button
                  onClick={() => setFilterStatus('failed')}
                  className={`px-2 py-0.5 rounded transition-colors ${filterStatus === 'failed' ? 'bg-rose-500/20 text-rose-300 font-medium' : 'hover:text-rose-300'}`}
                >
                  Failed ({summary?.failedTests || 0})
                </button>
              </div>
            </div>

            {/* Test File List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {testFiles.map(file => {
                const isSelected = selectedFileId === file.id;
                const fileRes = summary?.fileResults.find(r => r.fileId === file.id);
                const hasFailed = fileRes && fileRes.failed > 0;
                const isPassed = fileRes && fileRes.failed === 0 && fileRes.passed > 0;

                return (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer text-xs transition-colors group ${
                      isSelected
                        ? 'bg-[#1b2230] text-white border border-sky-500/30'
                        : 'text-slate-300 hover:bg-[#161c28]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {hasFailed ? (
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      ) : isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                      <span className="font-mono truncate">{file.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {fileRes && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {fileRes.duration}ms
                        </span>
                      )}
                      <button
                        onClick={e => handleRunSingleFile(file, e)}
                        className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title={`Run ${file.name}`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Add Footer */}
            <div className="p-2 border-t border-[#262c36] space-y-1.5 bg-[#0e121a]">
              {isCreatingFile ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    autoFocus
                    placeholder="my_test.test.ts"
                    value={newTestFileName}
                    onChange={e => setNewTestFileName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateTestFile()}
                    className="flex-1 bg-[#161b22] border border-emerald-500 rounded px-2 py-1 text-xs text-white outline-none font-mono"
                  />
                  <button
                    onClick={handleCreateTestFile}
                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setIsCreatingFile(false)}
                    className="px-1.5 py-1 text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setIsCreatingFile(true)}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 bg-[#1b2230] hover:bg-[#212a3b] text-slate-300 hover:text-white rounded text-[11px] font-medium transition-colors border border-slate-700/50"
                  >
                    <Plus className="w-3 h-3 text-emerald-400" />
                    <span>New Test</span>
                  </button>

                  <button
                    onClick={handleGenerateTestsWithGemini}
                    disabled={isGenerating}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 bg-gradient-to-r from-sky-600/30 to-indigo-600/30 hover:from-sky-600/40 hover:to-indigo-600/40 text-sky-200 rounded text-[11px] font-medium transition-colors border border-sky-500/30"
                  >
                    <Sparkles className="w-3 h-3 text-sky-400" />
                    <span>AI Suite</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Selected Test File Detail & Execution Tree */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117]">
            {activeFileResult ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* File Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-[#21262d] text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-200">
                      {activeFileResult.fileName}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                      {activeFileResult.duration}ms
                    </span>
                    <span className="text-emerald-400 text-xs font-medium">
                      ✓ {activeFileResult.passed} passed
                    </span>
                    {activeFileResult.failed > 0 && (
                      <span className="text-rose-400 text-xs font-medium">
                        ✕ {activeFileResult.failed} failed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectFile(activeFileResult.fileId)}
                      className="flex items-center gap-1 px-2 py-1 bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white rounded text-xs transition-colors"
                      title="Open test file in Code Editor"
                    >
                      <Code className="w-3 h-3 text-sky-400" />
                      <span>Edit Test File</span>
                    </button>

                    <button
                      onClick={() => {
                        const target = files.find(f => f.id === activeFileResult.fileId);
                        if (target) handleRunSingleFile(target);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded text-xs font-medium transition-colors"
                    >
                      <RotateCcw className={`w-3 h-3 ${isRunning ? 'animate-spin' : ''}`} />
                      <span>Rerun File</span>
                    </button>
                  </div>
                </div>

                {/* Suites & Tests Tree */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans">
                  {activeFileResult.suites.map(suite => {
                    const suiteKey = `${activeFileResult.fileId}-${suite.name}`;
                    const isExpanded = expandedSuites[suiteKey] ?? true;

                    // Filter tests based on searchQuery and filterStatus
                    const filteredTests = suite.tests.filter(t => {
                      if (filterStatus === 'passed' && t.status !== 'passed') return false;
                      if (filterStatus === 'failed' && t.status !== 'failed') return false;
                      if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                      return true;
                    });

                    if (filteredTests.length === 0 && (searchQuery || filterStatus !== 'all')) {
                      return null;
                    }

                    return (
                      <div
                        key={suite.name}
                        className="bg-[#111622] border border-[#21262d] rounded-xl overflow-hidden shadow-xs"
                      >
                        {/* Suite Header */}
                        <div
                          onClick={() => toggleSuite(suiteKey)}
                          className="flex items-center justify-between px-3.5 py-2.5 bg-[#161c28] cursor-pointer hover:bg-[#1a2232] transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span className="font-semibold text-xs text-slate-200">
                              {suite.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({suite.tests.length} test{suite.tests.length !== 1 ? 's' : ''})
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-slate-500">{suite.duration}ms</span>
                            {suite.failed > 0 ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                {suite.failed} FAILED
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                PASS
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Test Cases List */}
                        {isExpanded && (
                          <div className="divide-y divide-[#1e2533]">
                            {filteredTests.map(testCase => (
                              <div
                                key={testCase.id}
                                className="px-4 py-2.5 flex flex-col space-y-1 hover:bg-[#141b26] transition-colors"
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    {testCase.status === 'passed' ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                    )}
                                    <span
                                      className={`font-medium ${
                                        testCase.status === 'passed' ? 'text-slate-200' : 'text-rose-300 font-semibold'
                                      }`}
                                    >
                                      {testCase.name}
                                    </span>
                                  </div>

                                  <span className="text-[11px] font-mono text-slate-500 shrink-0">
                                    {testCase.duration}ms
                                  </span>
                                </div>

                                {/* Failure Diff & Stack Inspector */}
                                {testCase.error && (
                                  <div className="mt-2 p-3 bg-rose-950/20 border border-rose-500/30 rounded-lg text-xs font-mono space-y-2">
                                    <div className="flex items-start gap-1.5 text-rose-400 font-semibold">
                                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                      <span className="whitespace-pre-wrap">{testCase.error}</span>
                                    </div>

                                    {testCase.expected !== undefined && testCase.actual !== undefined && (
                                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-rose-500/20">
                                        <div className="bg-[#121620] p-2 rounded border border-emerald-500/30 text-emerald-300">
                                          <div className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold mb-0.5">
                                            Expected
                                          </div>
                                          <div className="whitespace-pre-wrap break-all">{testCase.expected}</div>
                                        </div>
                                        <div className="bg-[#121620] p-2 rounded border border-rose-500/30 text-rose-300">
                                          <div className="text-[9px] uppercase tracking-wider text-rose-400 font-bold mb-0.5">
                                            Received
                                          </div>
                                          <div className="whitespace-pre-wrap break-all">{testCase.actual}</div>
                                        </div>
                                      </div>
                                    )}

                                    {testCase.stack && (
                                      <details className="text-[10px] text-slate-500 pt-1">
                                        <summary className="cursor-pointer hover:text-slate-400 select-none">
                                          View Stack Trace
                                        </summary>
                                        <div className="mt-1 p-2 bg-[#090d16] rounded overflow-x-auto whitespace-pre text-slate-400">
                                          {testCase.stack}
                                        </div>
                                      </details>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
                <FileCode className="w-8 h-8 text-slate-600 mb-2" />
                <span>Select a test suite from the left pane or click "Run All"</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
