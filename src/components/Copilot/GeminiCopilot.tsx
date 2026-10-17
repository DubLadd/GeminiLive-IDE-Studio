import React, { useState, useEffect, useRef } from 'react';
import { ProjectFile, ChatMessage } from '../../types/ide';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  FileCheck,
  Wand2,
  Bug,
  ArrowRight,
  RotateCcw,
  Bot,
  User,
  Copy,
  Check,
  Brain,
  Flame,
  Dna,
  ShieldAlert,
  Radio,
  Sliders,
  Clock,
  Plus,
  History,
  Code2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  CopilotChatSession,
  CopilotSettings,
  DEFAULT_COPILOT_SETTINGS,
  SYSTEM_PERSONA_PROMPTS,
} from '../../types/copilot';
import {
  loadChatSessions,
  saveChatSessions,
  saveActiveSessionId,
  createNewSession,
  loadCopilotSettings,
  saveCopilotSettings,
  generateSmartSessionTitle,
  syncSessionToFirestore,
} from '../../utils/copilotStorage';
import { CopilotHistoryDrawer } from './CopilotHistoryDrawer';
import { CopilotSettingsModal } from './CopilotSettingsModal';
import { CopilotLiveMode } from './CopilotLiveMode';

interface GeminiCopilotProps {
  files: ProjectFile[];
  activeFile: ProjectFile;
  onApplyFileChanges: (fileName: string, newContent: string) => void;
  externalPrompt?: string;
  onClearExternalPrompt?: () => void;
}

export const GeminiCopilot: React.FC<GeminiCopilotProps> = ({
  files,
  activeFile,
  onApplyFileChanges,
  externalPrompt,
  onClearExternalPrompt,
}) => {
  // Chat History Persistence State
  const [{ sessions, activeId }, setSessionState] = useState(() =>
    loadChatSessions(activeFile.name)
  );
  const [activeSessionId, setActiveSessionId] = useState<string>(activeId);

  // Settings State
  const [settings, setSettings] = useState<CopilotSettings>(() =>
    loadCopilotSettings()
  );

  // UI Modal / Drawer States
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);

  // Active chat session
  const activeSession =
    sessions.find(s => s.id === activeSessionId) || sessions[0] || createNewSession(activeFile.name);

  const [input, setInput] = useState('');
  const [copilotMode, setCopilotMode] = useState<'developer' | 'brainstormer'>('developer');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voicePlaybackEnabled, setVoicePlaybackEnabled] = useState(
    settings.liveChatAutoPlayAudio
  );
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Keep storage in sync whenever sessions change
  const updateSessions = (
    updater: (prev: CopilotChatSession[]) => CopilotChatSession[]
  ) => {
    setSessionState(prev => {
      const nextSessions = updater(prev.sessions);
      saveChatSessions(nextSessions);
      return { ...prev, sessions: nextSessions };
    });
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    saveActiveSessionId(sessionId);
  };

  const handleNewSession = () => {
    const newSession = createNewSession(activeFile.name);
    updateSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    saveActiveSessionId(newSession.id);
  };

  const handleRenameSession = (sessionId: string, newTitle: string) => {
    updateSessions(prev =>
      prev.map(s => (s.id === sessionId ? { ...s, title: newTitle, updatedAt: Date.now() } : s))
    );
  };

  const handleDeleteSession = (sessionId: string) => {
    updateSessions(prev => {
      const remaining = prev.filter(s => s.id !== sessionId);
      if (remaining.length === 0) {
        const fresh = createNewSession(activeFile.name);
        setActiveSessionId(fresh.id);
        saveActiveSessionId(fresh.id);
        return [fresh];
      }
      if (activeSessionId === sessionId) {
        setActiveSessionId(remaining[0].id);
        saveActiveSessionId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleTogglePinSession = (sessionId: string) => {
    updateSessions(prev =>
      prev.map(s => (s.id === sessionId ? { ...s, isPinned: !s.isPinned } : s))
    );
  };

  const handleClearAllSessions = () => {
    const initial = createNewSession(activeFile.name);
    updateSessions(() => [initial]);
    setActiveSessionId(initial.id);
    saveActiveSessionId(initial.id);
  };

  const handleSaveSettings = (newSettings: CopilotSettings) => {
    setSettings(newSettings);
    saveCopilotSettings(newSettings);
    setVoicePlaybackEnabled(newSettings.liveChatAutoPlayAudio);
  };

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession.messages]);

  // Handle external prompt (e.g. from error auto-fix or command palette)
  useEffect(() => {
    if (externalPrompt) {
      handleSendMessage(externalPrompt);
      onClearExternalPrompt?.();
    }
  }, [externalPrompt]);

  // Text-To-Speech playback
  const playVocalResponse = async (text: string) => {
    if (!voicePlaybackEnabled) return;
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: settings.ttsVoice,
        }),
      });
      const data = await res.json();
      if (data.audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        audio.play();
      }
    } catch (err) {
      console.warn('TTS playback failed:', err);
    }
  };

  // Send message to streaming Gemini endpoint
  const handleSendMessage = async (textToSend: string, isLiveVoice = false): Promise<string> => {
    if (!textToSend.trim() || isStreaming) return '';

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    // Auto-rename session if it's currently generic
    const shouldRenameTitle =
      activeSession.title === 'New Conversation' ||
      activeSession.title === 'Code Discussion';
    const newTitle = shouldRenameTitle
      ? generateSmartSessionTitle(textToSend)
      : activeSession.title;

    const nextMessages = [...activeSession.messages, userMessage];

    const assistantMsgId = Math.random().toString(36).substring(2, 9);
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      isStreaming: true,
    };

    // Update active session in state and storage
    updateSessions(prev =>
      prev.map(s =>
        s.id === activeSession.id
          ? {
              ...s,
              title: newTitle,
              messages: [...nextMessages, initialAssistantMsg],
              updatedAt: Date.now(),
              modelUsed: settings.model,
              activeFileName: activeFile.name,
            }
          : s
      )
    );

    setInput('');
    setIsStreaming(true);

    let accumulated = '';

    try {
      const isBrainstormer = copilotMode === 'brainstormer';
      const brainstormMode = textToSend.startsWith('/') ? textToSend.split(' ')[0] : undefined;

      // Compose persona instructions
      const personaConfig = SYSTEM_PERSONA_PROMPTS[settings.systemPersona];
      const customDirectives = [
        personaConfig?.prompt || '',
        settings.customSystemPrompt || '',
      ]
        .filter(Boolean)
        .join('\n\n');

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
          projectFiles: files,
          activeFile: activeFile.name,
          isBrainstormer,
          brainstormMode,
          model: settings.model,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          thinkingBudget: settings.thinkingBudget,
          systemInstruction: customDirectives,
        }),
      });

      if (!response.body) throw new Error('No response stream available');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;
            try {
              const data = JSON.parse(dataStr);
              if (data.text) {
                accumulated += data.text;
                updateSessions(prev =>
                  prev.map(s =>
                    s.id === activeSession.id
                      ? {
                          ...s,
                          messages: s.messages.map(m =>
                            m.id === assistantMsgId
                              ? { ...m, content: accumulated, isStreaming: true }
                              : m
                          ),
                        }
                      : s
                  )
                );
              }
              if (data.error && !accumulated.trim()) {
                accumulated += `\n\n*Error: ${data.error}*`;
              }
            } catch {
              // Non-JSON SSE line
            }
          }
        }
      }

      // Finalize message
      updateSessions(prev =>
        prev.map(s => {
          if (s.id !== activeSession.id) return s;
          const updatedSession = {
            ...s,
            updatedAt: Date.now(),
            messages: s.messages.map(m =>
              m.id === assistantMsgId ? { ...m, content: accumulated, isStreaming: false } : m
            ),
          };
          syncSessionToFirestore(updatedSession);
          return updatedSession;
        })
      );

      // Trigger vocal feedback if not in live voice mode (live mode handles its own speech)
      if (!isLiveVoice && voicePlaybackEnabled) {
        playVocalResponse(accumulated);
      }

      return accumulated;
    } catch (err: any) {
      accumulated = `Error communicating with Gemini: ${err.message}`;
      updateSessions(prev =>
        prev.map(s =>
          s.id === activeSession.id
            ? {
                ...s,
                messages: s.messages.map(m =>
                  m.id === assistantMsgId
                    ? { ...m, content: accumulated, isStreaming: false }
                    : m
                ),
              }
            : s
        )
      );
      return accumulated;
    } finally {
      setIsStreaming(false);
    }
  };

  // Voice recording with MediaRecorder -> /api/transcribe
  const handleToggleRecord = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = e => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            try {
              const res = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioBase64: base64Data, mimeType: 'audio/webm' }),
              });
              const data = await res.json();
              if (data.text) {
                setInput(data.text);
              }
            } catch (err) {
              console.error('Transcription error:', err);
            }
          };
          stream.getTracks().forEach(t => t.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Microphone access denied:', err);
      }
    }
  };

  // Extract code blocks from markdown
  const extractCodeBlocks = (markdown: string) => {
    const regex = /```([a-zA-Z0-9_\-]+)?(?:\s+filename="?([^"\n]+)"?)?\n([\s\S]*?)```/g;
    const blocks: Array<{ language: string; fileName: string; code: string }> = [];
    let match;

    while ((match = regex.exec(markdown)) !== null) {
      let lang = match[1] || 'text';
      let fileName = match[2] || '';
      const code = match[3];

      if (!fileName) {
        if (lang === 'html') fileName = 'index.html';
        else if (lang === 'css') fileName = 'style.css';
        else if (lang === 'javascript' || lang === 'js') fileName = 'app.js';
        else if (lang === 'typescript' || lang === 'ts') fileName = activeFile.name.endsWith('.ts') ? activeFile.name : 'index.ts';
        else if (lang === 'json') fileName = 'data.json';
        else fileName = activeFile.name;
      }

      blocks.push({ language: lang, fileName, code });
    }

    return blocks;
  };

  const handleApplyCode = (fileName: string, code: string) => {
    onApplyFileChanges(fileName, code);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#38bdf8', '#818cf8', '#4ade80'],
    });
  };

  // Quick Action Triggers
  const handleQuickAction = (actionType: string) => {
    if (actionType === 'explain') {
      handleSendMessage(`Explain the architecture and logic of ${activeFile.name} in detail.`);
    } else if (actionType === 'refactor') {
      handleSendMessage(`Refactor ${activeFile.name} to optimize performance, clean up structure, and enhance maintainability.`);
    } else if (actionType === 'bugcheck') {
      handleSendMessage(`Audit ${activeFile.name} for potential runtime bugs, edge cases, or UX flaws, and provide fixes.`);
    } else if (actionType === 'feature') {
      handleSendMessage(`Propose and implement a compelling new interactive feature for this project.`);
    }
  };

  // If in dedicated Live Voice Mode, render CopilotLiveMode
  if (isLiveMode) {
    return (
      <div className="relative h-full flex flex-col">
        <CopilotLiveMode
          settings={settings}
          activeFile={activeFile}
          files={files}
          activeSession={activeSession}
          onSendMessage={handleSendMessage}
          onApplyCode={handleApplyCode}
          onExitLiveMode={() => setIsLiveMode(false)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
        />
        {/* Modals on top if requested */}
        <CopilotHistoryDrawer
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onRenameSession={handleRenameSession}
          onDeleteSession={handleDeleteSession}
          onTogglePinSession={handleTogglePinSession}
          onClearAllSessions={handleClearAllSessions}
        />
        <CopilotSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSaveSettings={handleSaveSettings}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border-l border-[#30363d] text-slate-200 select-none relative">
      {/* Sliding History Drawer */}
      <CopilotHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        onTogglePinSession={handleTogglePinSession}
        onClearAllSessions={handleClearAllSessions}
      />

      {/* Settings Modal */}
      <CopilotSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      {/* Copilot Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-[#30363d] text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200 truncate">
          {copilotMode === 'brainstormer' ? (
            <>
              <Brain className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="text-purple-300 font-bold truncate">BRAINSTORMER</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">GEMINI COPILOT</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Mode Switcher */}
          <div className="flex items-center bg-[#0d1117] p-0.5 rounded border border-[#21262d] text-[10px]">
            <button
              onClick={() => setCopilotMode('developer')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                copilotMode === 'developer'
                  ? 'bg-[#21262d] text-sky-400 font-bold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Coding Assistant Mode"
            >
              Dev
            </button>
            <button
              onClick={() => setCopilotMode('brainstormer')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                copilotMode === 'brainstormer'
                  ? 'bg-purple-900/50 text-purple-300 font-bold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Brainstormer Pro X"
            >
              Brainstorm
            </button>
          </div>

          {/* Gemini Live Mode Launcher */}
          <button
            onClick={() => setIsLiveMode(true)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-950/60 hover:bg-sky-900/70 border border-sky-800/60 text-sky-300 text-[10px] font-bold transition-all shadow-sm shadow-sky-950/50"
            title="Launch Interactive Voice Live Mode"
          >
            <Radio className="w-3 h-3 text-sky-400 animate-pulse" />
            <span>Live</span>
          </button>

          {/* History Drawer Toggle */}
          <button
            onClick={() => setIsHistoryOpen(prev => !prev)}
            className={`p-1 rounded transition-colors relative ${
              isHistoryOpen
                ? 'bg-sky-500/20 text-sky-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#21262d]'
            }`}
            title="Chat History Sessions"
          >
            <History className="w-3.5 h-3.5" />
            {sessions.length > 1 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-sky-600 text-[8px] font-bold text-white flex items-center justify-center">
                {sessions.length}
              </span>
            )}
          </button>

          {/* Settings Drawer Toggle */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-[#21262d] rounded transition-colors"
            title="Copilot Settings & Options"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* TTS Speaker Toggle */}
          <button
            onClick={() => setVoicePlaybackEnabled(prev => !prev)}
            className={`p-1 rounded transition-colors ${
              voicePlaybackEnabled
                ? 'bg-sky-500/20 text-sky-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title={voicePlaybackEnabled ? 'Live Voice Feedback: ON' : 'Live Voice Feedback: OFF'}
          >
            {voicePlaybackEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* New Chat Button */}
          <button
            onClick={handleNewSession}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-[#21262d] rounded transition-colors"
            title="New Chat Session"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Active Conversation Title & Model Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#121720] border-b border-[#21262d] text-[11px]">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-slate-400 truncate font-medium">
            {activeSession.title}
          </span>
          <span className="text-[9px] bg-[#21262d] text-slate-400 px-1 py-0.2 rounded font-mono">
            {settings.model.replace('gemini-', '')}
          </span>
        </div>
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="text-[10px] text-sky-400 hover:text-sky-300 font-mono flex items-center gap-0.5 shrink-0"
        >
          <span>Sessions</span>
          <span className="text-slate-500 font-sans">({sessions.length})</span>
        </button>
      </div>

      {/* Quick Action Pills */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161b22]/60 border-b border-[#21262d] overflow-x-auto text-[11px]">
        <button
          onClick={() => handleSendMessage('!proto Spin up an in-memory zero-dependency prototype in one file.')}
          className="flex items-center gap-1 px-2 py-0.5 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 rounded border border-cyan-800/40 whitespace-nowrap font-mono"
          title="!proto: Disposable lab, zero-dep"
        >
          <span>⚡ !proto</span>
        </button>
        <button
          onClick={() => handleSendMessage('!harden Audit code and apply WebCrypto AES-GCM encryption and zero-network isolation.')}
          className="flex items-center gap-1 px-2 py-0.5 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 rounded border border-emerald-800/40 whitespace-nowrap font-mono"
          title="!harden: Security isolation & encryption"
        >
          <span>🛡️ !harden</span>
        </button>
        <button
          onClick={() => handleSendMessage('!scaffold Create factory modular scaffolding and typed store primitives.')}
          className="flex items-center gap-1 px-2 py-0.5 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 rounded border border-amber-800/40 whitespace-nowrap font-mono"
          title="!scaffold: Factory reusable primitives"
        >
          <span>🏗️ !scaffold</span>
        </button>
        <button
          onClick={() => handleSendMessage('!fork Generate a 3-way architecture shootout (Minimal vs Fast vs Experimental) to test trade-offs.')}
          className="flex items-center gap-1 px-2 py-0.5 bg-violet-950/40 hover:bg-violet-900/50 text-violet-300 rounded border border-violet-800/40 whitespace-nowrap font-mono"
          title="!fork: 3-Way Shootout"
        >
          <span>⚔️ !fork</span>
        </button>
        <button
          onClick={() => handleSendMessage('!vector Construct an offline execution vector harness and test suite.')}
          className="flex items-center gap-1 px-2 py-0.5 bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 rounded border border-blue-800/40 whitespace-nowrap font-mono"
          title="!vector: Standalone runner harness"
        >
          <span>🚀 !vector</span>
        </button>

        {copilotMode === 'brainstormer' ? (
          <>
            <button
              onClick={() => handleSendMessage('/wild Generate 5 non-obvious, surprising conceptual directions')}
              className="flex items-center gap-1 px-2 py-0.5 bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 rounded border border-purple-800/40 whitespace-nowrap"
            >
              <Flame className="w-3 h-3 text-amber-400" />
              <span>/wild</span>
            </button>
            <button
              onClick={() => handleSendMessage('/mutate Mutate our strongest concept using inversion and extreme constraints')}
              className="flex items-center gap-1 px-2 py-0.5 bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 rounded border border-purple-800/40 whitespace-nowrap"
            >
              <Dna className="w-3 h-3 text-purple-400" />
              <span>/mutate</span>
            </button>
            <button
              onClick={() => handleSendMessage('/failure Run pre-mortem failure-first analysis. How does this fail?')}
              className="flex items-center gap-1 px-2 py-0.5 bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 rounded border border-purple-800/40 whitespace-nowrap"
            >
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span>/failure</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleQuickAction('refactor')}
              className="flex items-center gap-1 px-2 py-0.5 bg-[#21262d] hover:bg-[#30363d] text-slate-300 rounded transition-colors whitespace-nowrap"
            >
              <Wand2 className="w-3 h-3 text-purple-400" />
              <span>Refactor</span>
            </button>
            <button
              onClick={() => handleQuickAction('bugcheck')}
              className="flex items-center gap-1 px-2 py-0.5 bg-[#21262d] hover:bg-[#30363d] text-slate-300 rounded transition-colors whitespace-nowrap"
            >
              <Bug className="w-3 h-3 text-rose-400" />
              <span>Bug Check</span>
            </button>
          </>
        )}
      </div>

      {/* Message Stream Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 select-text text-xs">
        {activeSession.messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const codeBlocks = !isUser && settings.autoApplyCode ? extractCodeBlocks(msg.content) : [];

          return (
            <div
              key={msg.id || idx}
              className={`flex flex-col gap-1 ${
                isUser ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                {isUser ? (
                  <>
                    <span>You</span>
                    <User className="w-2.5 h-2.5" />
                  </>
                ) : (
                  <>
                    <Bot className="w-2.5 h-2.5 text-sky-400" />
                    <span className="text-sky-400 font-medium">Gemini</span>
                  </>
                )}
                <span>·</span>
                <span>{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[95%] p-2.5 rounded-lg leading-relaxed text-xs break-words ${
                  isUser
                    ? 'bg-sky-600 text-white rounded-tr-none'
                    : 'bg-[#161b22] border border-[#30363d] text-slate-200 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Detected Actionable Code Blocks */}
                {codeBlocks.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-[#30363d] space-y-2">
                    <span className="text-[10px] text-sky-400 font-semibold uppercase tracking-wider block">
                      Proposed File Patches:
                    </span>
                    {codeBlocks.map((block, bIdx) => (
                      <div
                        key={bIdx}
                        className="bg-[#0d1117] border border-[#30363d] rounded p-2 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300 truncate">
                          <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{block.fileName}</span>
                          <span className="text-slate-600 text-[10px]">
                            ({block.code.split('\n').length} lines)
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(block.code);
                              setCopiedIndex(bIdx);
                              setTimeout(() => setCopiedIndex(null), 1500);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-200 rounded"
                            title="Copy Code"
                          >
                            {copiedIndex === bIdx ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            onClick={() => handleApplyCode(block.fileName, block.code)}
                            className="flex items-center gap-1 px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-medium transition-colors"
                          >
                            <span>Apply</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isStreaming && (
          <div className="flex items-center gap-2 text-xs text-sky-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
            <span>Gemini Live is thinking & generating...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-2.5 bg-[#161b22] border-t border-[#30363d]">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="flex items-end gap-1.5 bg-[#0d1117] border border-[#30363d] focus-within:border-sky-500 rounded-lg p-1.5 transition-colors"
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(input);
              }
            }}
            placeholder="Ask Gemini to code, refactor, or test..."
            rows={2}
            className="flex-1 bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-500 resize-none font-sans px-1"
          />

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleToggleRecord}
              className={`p-1.5 rounded transition-colors ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#21262d]'
              }`}
              title={isRecording ? 'Stop Recording' : 'Voice Dictation'}
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className={`p-1.5 rounded transition-colors ${
                input.trim() && !isStreaming
                  ? 'bg-sky-600 text-white hover:bg-sky-500'
                  : 'text-slate-600 bg-transparent cursor-not-allowed'
              }`}
              title="Send Prompt (Enter)"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
