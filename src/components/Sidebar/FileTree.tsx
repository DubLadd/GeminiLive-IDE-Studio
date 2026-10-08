import React, { useState, useRef } from 'react';
import { ProjectFile } from '../../types/ide';
import {
  FileCode,
  FileText,
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit2,
  FolderOpen,
  Download,
  Upload,
  LayoutTemplate,
  Search,
  Check,
  X,
  Brain,
  LayoutGrid,
  FileUp,
  Laptop
} from 'lucide-react';

interface FileTreeProps {
  files: ProjectFile[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onAddFile: (name: string, language: ProjectFile['language']) => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onOpenTemplatesModal: () => void;
  onExportProject: () => void;
  onUploadFile: (file: File) => void;
  onDownloadFile: (file: ProjectFile) => void;
  onBrainstormOnFile: (file: ProjectFile) => void;
  onOpenGallery: () => void;
  onDownloadStandaloneHtml: () => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onAddFile,
  onDeleteFile,
  onRenameFile,
  onOpenTemplatesModal,
  onExportProject,
  onUploadFile,
  onDownloadFile,
  onBrainstormOnFile,
  onOpenGallery,
  onDownloadStandaloneHtml,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getLanguageFromExt = (filename: string): ProjectFile['language'] => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'html' || ext === 'htm') return 'html';
    if (ext === 'css') return 'css';
    if (ext === 'json') return 'json';
    if (ext === 'md') return 'markdown';
    if (ext === 'ts' || ext === 'tsx') return 'typescript';
    return 'javascript';
  };

  const getFileIcon = (lang: string) => {
    switch (lang) {
      case 'html':
        return <span className="text-orange-400 font-bold text-xs">HTML</span>;
      case 'css':
        return <span className="text-sky-400 font-bold text-xs">CSS</span>;
      case 'javascript':
        return <span className="text-amber-400 font-bold text-xs">JS</span>;
      case 'json':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-yellow-500" />;
      case 'markdown':
        return <FileText className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <FileCode className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const cleanName = newFileName.trim();
    const lang = getLanguageFromExt(cleanName);
    onAddFile(cleanName, lang);
    setNewFileName('');
    setIsAdding(false);
  };

  const handleStartRename = (file: ProjectFile, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(file.id);
    setRenameValue(file.name);
  };

  const handleSaveRename = (fileId: string) => {
    if (renameValue.trim()) {
      onRenameFile(fileId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => {
        onUploadFile(file);
      });
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files) {
      Array.from(e.dataTransfer.files).forEach(file => {
        onUploadFile(file);
      });
    }
  };

  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div
      onDragOver={e => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
      className={`w-64 bg-[#0d1117] border-r border-[#30363d] flex flex-col h-full select-none text-xs transition-colors ${
        isDraggingOver ? 'bg-sky-950/20 border-r-sky-500' : ''
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".html,.htm,.js,.css,.json,.md,.txt"
        multiple
        className="hidden"
      />

      {/* Explorer Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#21262d] bg-[#161b22]">
        <div className="flex items-center gap-1.5 font-semibold text-slate-300">
          <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
          <span className="tracking-wide">EXPLORER</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Upload .html / code from Phone or Laptop */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1 rounded text-sky-400 hover:text-sky-300 hover:bg-[#21262d] transition-colors"
            title="Upload .html from Phone / Laptop storage"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-[#21262d] transition-colors"
            title="New File"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenTemplatesModal}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-[#21262d] transition-colors"
            title="Templates"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* File Search */}
      <div className="px-2 py-1.5 border-b border-[#21262d]">
        <div className="flex items-center gap-1.5 bg-[#161b22] px-2 py-1 rounded border border-[#30363d]">
          <Search className="w-3 h-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 text-[11px]"
          />
        </div>
      </div>

      {/* Drag & Drop Upload Highlight Banner */}
      {isDraggingOver && (
        <div className="m-2 p-3 border-2 border-dashed border-sky-400 rounded-lg text-center bg-sky-950/40 text-sky-300 text-xs">
          Drop .html or code files here to upload
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* New File Inline Form */}
        {isAdding && (
          <form onSubmit={handleCreateSubmit} className="px-2 py-1 flex items-center gap-1">
            <input
              type="text"
              autoFocus
              placeholder="e.g. index.html"
              value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
              className="flex-1 bg-[#161b22] border border-sky-500 rounded px-1.5 py-0.5 text-xs text-slate-200 outline-none"
            />
            <button
              type="submit"
              className="p-1 text-emerald-400 hover:bg-[#21262d] rounded"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-1 text-slate-400 hover:bg-[#21262d] rounded"
            >
              <X className="w-3 h-3" />
            </button>
          </form>
        )}

        {filteredFiles.map(file => {
          const isActive = file.id === activeFileId;
          const isRenaming = renamingId === file.id;

          return (
            <div
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={`group flex items-center justify-between px-3 py-1.5 cursor-pointer transition-colors ${
                isActive
                  ? 'bg-[#21262d] text-slate-100 font-medium border-l-2 border-sky-400'
                  : 'text-slate-400 hover:bg-[#161b22] hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden flex-1 mr-1">
                <span className="w-5 flex items-center justify-center shrink-0">
                  {getFileIcon(file.language)}
                </span>

                {isRenaming ? (
                  <input
                    type="text"
                    autoFocus
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={() => handleSaveRename(file.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveRename(file.id);
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    onClick={e => e.stopPropagation()}
                    className="bg-[#0d1117] border border-sky-500 rounded px-1 py-0 text-xs text-slate-100 outline-none w-full"
                  />
                ) : (
                  <span className="truncate font-mono text-[12px]">{file.name}</span>
                )}
              </div>

              {/* Action Buttons on Hover */}
              {!isRenaming && (
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
                  {/* Brainstorm this file in Brainstormer Pro X */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onBrainstormOnFile(file);
                    }}
                    className="p-0.5 text-purple-400 hover:text-purple-300 rounded"
                    title="Brainstorm & Mutate in Brainstormer Canvas"
                  >
                    <Brain className="w-3 h-3" />
                  </button>

                  {/* Download this file */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onDownloadFile(file);
                    }}
                    className="p-0.5 text-slate-400 hover:text-emerald-400 rounded"
                    title="Download to Phone / Laptop Storage"
                  >
                    <Download className="w-3 h-3" />
                  </button>

                  {/* Rename */}
                  <button
                    onClick={e => handleStartRename(file, e)}
                    className="p-0.5 text-slate-400 hover:text-slate-200 rounded"
                    title="Rename"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>

                  {/* Delete */}
                  {files.length > 1 && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm(`Delete file "${file.name}"?`)) {
                          onDeleteFile(file.id);
                        }
                      }}
                      className="p-0.5 text-slate-400 hover:text-rose-400 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upload Callout Button for easy access on mobile */}
      <div className="p-2 border-t border-[#21262d] bg-[#161b22]/30 flex flex-col gap-1.5">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border border-sky-500/30 rounded-lg text-xs font-medium transition-colors"
          title="Upload .html directly from your phone or laptop storage"
        >
          <FileUp className="w-3.5 h-3.5 text-sky-400" />
          <span>Upload .html File</span>
        </button>

        {/* Footer Utilities */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <button
            onClick={onOpenGallery}
            className="flex items-center gap-1 px-1.5 py-1 text-slate-300 hover:text-sky-300 hover:bg-[#21262d] rounded transition-colors"
            title="Open App Gallery & OS Storage"
          >
            <LayoutGrid className="w-3 h-3 text-sky-400" />
            <span>App Gallery</span>
          </button>

          <button
            onClick={onDownloadStandaloneHtml}
            className="flex items-center gap-1 px-1.5 py-1 text-slate-300 hover:text-emerald-400 hover:bg-[#21262d] rounded transition-colors"
            title="Download Standalone HTML (Runs anywhere offline)"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            <span>Save HTML</span>
          </button>
        </div>
      </div>
    </div>
  );
};
