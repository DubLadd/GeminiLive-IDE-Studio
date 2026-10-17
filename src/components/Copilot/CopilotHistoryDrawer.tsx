import React, { useState } from 'react';
import {
  X,
  Search,
  Plus,
  Trash2,
  Edit2,
  Check,
  Download,
  Pin,
  Clock,
  MessageSquare,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { CopilotChatSession } from '../../types/copilot';
import {
  exportSessionAsMarkdown,
  formatRelativeTime,
} from '../../utils/copilotStorage';

interface CopilotHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: CopilotChatSession[];
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onTogglePinSession: (sessionId: string) => void;
  onClearAllSessions: () => void;
}

export const CopilotHistoryDrawer: React.FC<CopilotHistoryDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onRenameSession,
  onDeleteSession,
  onTogglePinSession,
  onClearAllSessions,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  if (!isOpen) return null;

  const filteredSessions = sessions.filter(session => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const titleMatch = session.title.toLowerCase().includes(q);
    const fileMatch = session.activeFileName?.toLowerCase().includes(q);
    const messageMatch = session.messages.some(m =>
      m.content.toLowerCase().includes(q)
    );
    return titleMatch || fileMatch || messageMatch;
  });

  // Sort pinned first, then by updatedAt descending
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.updatedAt - a.updatedAt;
  });

  const handleStartRename = (session: CopilotChatSession) => {
    setEditingId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveRename = (sessionId: string) => {
    if (editingTitle.trim()) {
      onRenameSession(sessionId, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleExportMarkdown = (session: CopilotChatSession) => {
    const md = exportSessionAsMarkdown(session);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.replace(/[^\w-]/g, '_')}_transcript.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="absolute inset-0 z-30 bg-[#0d1117]/95 backdrop-blur-md flex flex-col border-l border-[#30363d] text-slate-200 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-[#161b22] border-b border-[#30363d]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-xs tracking-wider uppercase text-slate-200">
            Chat History
          </span>
          <span className="text-[10px] bg-sky-950 text-sky-300 px-1.5 py-0.5 rounded-full border border-sky-800/50">
            {sessions.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              onNewSession();
              onClose();
            }}
            className="flex items-center gap-1 px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-medium transition-colors"
            title="Start a new chat session"
          >
            <Plus className="w-3 h-3" />
            <span>New Chat</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-[#21262d] transition-colors"
            title="Close History"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-[#21262d] bg-[#161b22]/40">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search conversations or code..."
            className="w-full bg-[#0d1117] border border-[#30363d] focus:border-sky-500 rounded py-1 pl-8 pr-2 text-xs text-slate-200 placeholder-slate-500 outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 text-xs">
        {sortedSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 p-4">
            <MessageSquare className="w-8 h-8 text-slate-600 mb-2 stroke-[1.5]" />
            <p className="font-medium text-slate-400 text-xs">No sessions found</p>
            <p className="text-[11px] mt-1 text-slate-600">
              {searchQuery
                ? 'Try a different search term.'
                : 'Start a conversation with Gemini Copilot to build history.'}
            </p>
          </div>
        ) : (
          sortedSessions.map(session => {
            const isActive = session.id === activeSessionId;
            const isEditing = editingId === session.id;

            return (
              <div
                key={session.id}
                onClick={() => {
                  if (!isEditing) {
                    onSelectSession(session.id);
                    onClose();
                  }
                }}
                className={`group relative flex flex-col p-2.5 rounded-lg border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-950/40 border-sky-600/60 shadow-sm shadow-sky-950/50'
                    : 'bg-[#161b22]/70 hover:bg-[#1f242c] border-[#30363d]/60 hover:border-[#444c56]'
                }`}
              >
                {/* Header row: Title & Actions */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  {isEditing ? (
                    <div
                      className="flex items-center gap-1 flex-1"
                      onClick={e => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={e => setEditingTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveRename(session.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="bg-[#0d1117] border border-sky-500 rounded px-1.5 py-0.5 text-xs text-white outline-none w-full"
                      />
                      <button
                        onClick={() => handleSaveRename(session.id)}
                        className="p-1 text-emerald-400 hover:bg-emerald-950 rounded"
                        title="Save Title"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 text-slate-400 hover:bg-slate-800 rounded"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {session.isPinned && (
                          <Pin className="w-3 h-3 text-amber-400 shrink-0 fill-amber-400/20" />
                        )}
                        <span
                          className={`font-medium truncate text-xs ${
                            isActive ? 'text-sky-300 font-semibold' : 'text-slate-200'
                          }`}
                        >
                          {session.title}
                        </span>
                      </div>

                      {/* Action buttons (always visible on hover or if active) */}
                      <div
                        className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onTogglePinSession(session.id)}
                          className={`p-1 rounded transition-colors ${
                            session.isPinned
                              ? 'text-amber-400 hover:text-amber-300'
                              : 'text-slate-500 hover:text-slate-300 hover:bg-[#21262d]'
                          }`}
                          title={session.isPinned ? 'Unpin session' : 'Pin session to top'}
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleStartRename(session)}
                          className="p-1 text-slate-500 hover:text-slate-300 hover:bg-[#21262d] rounded transition-colors"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleExportMarkdown(session)}
                          className="p-1 text-slate-500 hover:text-slate-300 hover:bg-[#21262d] rounded transition-colors"
                          title="Export Markdown"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        {sessions.length > 1 && (
                          <button
                            onClick={() => onDeleteSession(session.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors"
                            title="Delete session"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Sub row: Details & Metadata */}
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>{formatRelativeTime(session.updatedAt)}</span>
                  <span>•</span>
                  <span>{session.messages.length} msgs</span>
                  {session.activeFileName && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-slate-400 truncate max-w-[100px]">
                        <FileCode className="w-2.5 h-2.5 text-sky-400" />
                        <span className="truncate">{session.activeFileName}</span>
                      </span>
                    </>
                  )}
                </div>

                {/* Snippet preview */}
                {session.messages.length > 1 && (
                  <p className="text-[11px] text-slate-400 truncate mt-1 text-left font-sans italic opacity-80">
                    {session.messages[session.messages.length - 1].content.slice(0, 60)}...
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Clear All */}
      <div className="p-2.5 bg-[#161b22] border-t border-[#30363d] flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-400 font-mono">
          Persistent across IDE sessions
        </span>
        {confirmClearAll ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-rose-400 font-medium">Delete all?</span>
            <button
              onClick={() => {
                onClearAllSessions();
                setConfirmClearAll(false);
              }}
              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmClearAll(false)}
              className="px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[10px]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClearAll(true)}
            className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
};
