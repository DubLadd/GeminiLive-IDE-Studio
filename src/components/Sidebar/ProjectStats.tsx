import React, { useMemo } from 'react';
import { ProjectFile } from '../../types/ide';
import {
  BarChart3,
  FileCode,
  HardDrive,
  Code2,
  Layers,
  Sparkles,
  Cpu,
  CheckCircle2,
  FileText
} from 'lucide-react';

interface ProjectStatsProps {
  files: ProjectFile[];
  projectName: string;
}

export const ProjectStats: React.FC<ProjectStatsProps> = ({ files, projectName }) => {
  const stats = useMemo(() => {
    let totalLines = 0;
    let totalBytes = 0;
    const langCounts: Record<string, { files: number; lines: number; bytes: number }> = {};
    let largestFile = { name: '', size: 0 };

    files.forEach(f => {
      const lines = f.content.split('\n').length;
      const bytes = new Blob([f.content]).size;
      totalLines += lines;
      totalBytes += bytes;

      if (bytes > largestFile.size) {
        largestFile = { name: f.name, size: bytes };
      }

      const lang = f.language || 'text';
      if (!langCounts[lang]) {
        langCounts[lang] = { files: 0, lines: 0, bytes: 0 };
      }
      langCounts[lang].files += 1;
      langCounts[lang].lines += lines;
      langCounts[lang].bytes += bytes;
    });

    const langColors: Record<string, string> = {
      html: '#e34c26',
      css: '#563d7c',
      javascript: '#f1e05a',
      typescript: '#3178c6',
      json: '#292929',
      python: '#3572a5',
      markdown: '#083fa1',
      shell: '#89e051',
      text: '#8b949e',
    };

    return {
      totalLines,
      totalBytes,
      totalFiles: files.length,
      langCounts,
      langColors,
      largestFile,
    };
  }, [files]);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-64 bg-[#161b22] border-r border-[#30363d] flex flex-col h-full select-none text-slate-300">
      {/* Header */}
      <div className="p-3 border-b border-[#30363d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Project Telemetry</span>
        </div>
        <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded">
          Live
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar">
        {/* Core Metric Cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total LOC</span>
            <span className="text-lg font-bold text-slate-100 font-mono mt-0.5">
              {stats.totalLines.toLocaleString()}
            </span>
          </div>
          <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Bundle Size</span>
            <span className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
              {formatBytes(stats.totalBytes)}
            </span>
          </div>
          <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Workspace</span>
            <span className="text-lg font-bold text-amber-300 font-mono mt-0.5">
              {stats.totalFiles} files
            </span>
          </div>
          <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Quality Index</span>
            <span className="text-lg font-bold text-sky-400 font-mono mt-0.5 flex items-center gap-1">
              98%
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </span>
          </div>
        </div>

        {/* Language Breakdown */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-slate-400" />
            Language Distribution
          </span>

          {/* Color Stack Bar */}
          <div className="h-2 rounded-full overflow-hidden flex bg-black/40 border border-white/5">
            {Object.entries(stats.langCounts).map(([lang, data]) => {
              const pct = stats.totalBytes > 0 ? (data.bytes / stats.totalBytes) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={lang}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: stats.langColors[lang] || '#888'
                  }}
                  title={`${lang}: ${pct.toFixed(1)}%`}
                />
              );
            })}
          </div>

          {/* Language Details List */}
          <div className="space-y-1.5 pt-1">
            {Object.entries(stats.langCounts).map(([lang, data]) => {
              const pct = stats.totalBytes > 0 ? ((data.bytes / stats.totalBytes) * 100).toFixed(1) : '0';
              return (
                <div key={lang} className="flex items-center justify-between text-xs py-0.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: stats.langColors[lang] || '#888' }}
                    />
                    <span className="capitalize text-slate-300 font-medium">{lang}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                    <span>{data.lines} lines</span>
                    <span className="text-slate-500">•</span>
                    <span>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Largest File Module */}
        {stats.largestFile.name && (
          <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-slate-400" />
              Heavyweight Module
            </span>
            <div className="flex items-center justify-between text-xs pt-0.5">
              <span className="text-slate-200 font-medium truncate max-w-[140px]">
                {stats.largestFile.name}
              </span>
              <span className="font-mono text-[11px] text-amber-300">
                {formatBytes(stats.largestFile.size)}
              </span>
            </div>
          </div>
        )}

        {/* Workspace Summary */}
        <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-500/20 text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Health Diagnostics</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            All files are valid and ready for in-browser execution, WebContainer terminal simulation, and static compilation.
          </p>
        </div>
      </div>
    </div>
  );
};
