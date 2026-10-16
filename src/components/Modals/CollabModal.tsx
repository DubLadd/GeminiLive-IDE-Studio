import React, { useState } from 'react';
import { CollabSession, CollabParticipant } from '../../types/collaboration';
import { Users, Copy, Check, LogOut, Radio, Globe, Shield, Sparkles, X, ArrowRight } from 'lucide-react';

interface CollabModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSession: CollabSession | null;
  currentParticipant: CollabParticipant | null;
  participants: CollabParticipant[];
  onStartSession: (userName: string) => Promise<void>;
  onJoinSession: (sessionId: string, userName: string) => Promise<void>;
  onLeaveSession: () => Promise<void>;
}

export const CollabModal: React.FC<CollabModalProps> = ({
  isOpen,
  onClose,
  activeSession,
  currentParticipant,
  participants,
  onStartSession,
  onJoinSession,
  onLeaveSession,
}) => {
  const [userName, setUserName] = useState(currentParticipant?.name || '');
  const [sessionIdInput, setSessionIdInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!activeSession) return;
    const url = new URL(window.location.href);
    url.searchParams.set('collabSession', activeSession.id);
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      await onStartSession(userName.trim() || 'Collaborator');
    } catch (err: any) {
      setError(err?.message || 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!sessionIdInput.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // Allow passing full URL or plain ID
      let id = sessionIdInput.trim();
      if (id.includes('collabSession=')) {
        id = new URL(id).searchParams.get('collabSession') || id;
      }
      await onJoinSession(id, userName.trim() || 'Collaborator');
    } catch (err: any) {
      setError(err?.message || 'Failed to join session');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    setLoading(true);
    try {
      await onLeaveSession();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to leave session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363d] bg-[#0d1117]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">Real-Time Pair Programming</h3>
              <p className="text-xs text-slate-400">Live multi-user code synchronization and cursor presence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-[#21262d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs">
              {error}
            </div>
          )}

          {activeSession ? (
            /* ACTIVE SESSION VIEW */
            <div className="space-y-4">
              <div className="p-4 bg-[#0d1117] border border-emerald-500/30 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Session Active</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">ID: {activeSession.id}</span>
                </div>

                <div className="text-sm font-semibold text-slate-200">
                  {activeSession.name}
                </div>

                {/* Shareable Link Box */}
                <div className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-md px-3 py-2">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-xs text-slate-300 font-mono truncate flex-1">
                    {window.location.origin}?collabSession={activeSession.id}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* Connected Collaborators */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Connected Peers ({participants.length})
                  </span>
                  <span className="text-[11px] text-slate-500">Auto-synced</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {participants.map(p => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: p.color }}
                        />
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-200">{p.name}</span>
                          {p.isHost && (
                            <span className="px-1.5 py-0.2 text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-mono">
                              HOST
                            </span>
                          )}
                          {p.id === currentParticipant?.id && (
                            <span className="text-slate-500 text-[10px]">(You)</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                        <span>Ln {p.cursorLine || 1}:{p.cursorCol || 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leave Session Button */}
              <button
                onClick={handleLeave}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect from Session</span>
              </button>
            </div>
          ) : (
            /* CREATE OR JOIN FORM */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Your Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex (Frontend Dev)"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {/* Host Session */}
                <div className="p-4 bg-[#0d1117] border border-[#30363d] rounded-xl flex flex-col justify-between space-y-3">
                  <div>
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-2">
                      <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <h4 className="text-xs font-semibold text-slate-200">Host New Session</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Broadcast current workspace and invite collaborators
                    </p>
                  </div>
                  <button
                    onClick={handleStart}
                    disabled={loading}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>{loading ? 'Starting...' : 'Create Session'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Join Session */}
                <div className="p-4 bg-[#0d1117] border border-[#30363d] rounded-xl flex flex-col justify-between space-y-3">
                  <div>
                    <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mb-2">
                      <Globe className="w-3.5 h-3.5 text-sky-400" />
                    </div>
                    <h4 className="text-xs font-semibold text-slate-200">Join by Session ID</h4>
                    <input
                      type="text"
                      placeholder="Paste ID or Link..."
                      value={sessionIdInput}
                      onChange={e => setSessionIdInput(e.target.value)}
                      className="w-full mt-2 bg-[#161b22] border border-[#30363d] rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <button
                    onClick={handleJoin}
                    disabled={loading || !sessionIdInput.trim()}
                    className="w-full py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>{loading ? 'Joining...' : 'Join Session'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
