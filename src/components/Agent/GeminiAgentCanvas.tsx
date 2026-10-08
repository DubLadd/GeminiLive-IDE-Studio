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
  BookOpen,
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
  Rocket,
  Terminal as TerminalIcon,
  Github,
  Play,
  Eye,
  CheckCircle2,
  Layers,
  Code2,
  HelpCircle,
  Command,
  ChevronRight,
  Zap,
  DownloadCloud
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface AgentAction {
  id: string;
  type: 'create_file' | 'update_file' | 'run_terminal' | 'switch_view' | 'add_concept' | 'push_github';
  target?: string;
  payload?: string;
  status: 'pending' | 'executed' | 'dismissed';
}

interface GeminiAgentCanvasProps {
  files: ProjectFile[];
  activeFile: ProjectFile;
  projectName: string;
  onApplyFileChanges: (fileName: string, newContent: string) => void;
  onRunTerminalCommand?: (command: string) => void;
  onSwitchView?: (mode: 'ide' | 'canvas' | 'split') => void;
  onOpenGitHub?: () => void;
  onOpenGallery?: () => void;
  onRunPreview?: () => void;
  externalPrompt?: string;
  onClearExternalPrompt?: () => void;
  isCompact?: boolean;
}

export const GeminiAgentCanvas: React.FC<GeminiAgentCanvasProps> = ({
  files,
  activeFile,
  projectName,
  onApplyFileChanges,
  onRunTerminalCommand,
  onSwitchView,
  onOpenGitHub,
  onOpenGallery,
  onRunPreview,
  externalPrompt,
  onClearExternalPrompt,
  isCompact = false,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'agent-welcome',
      role: 'assistant',
      content: `👋 **Gemini Live AI Agent** is online.

I manage your **Live IDE, Canvas Sandbox, Brainstormer, Terminal, and GitHub** in real time.

What would you like to build or iterate on today?`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voicePlaybackEnabled, setVoicePlaybackEnabled] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCommandsMenu, setShowCommandsMenu] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle external incoming prompt
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
        body: JSON.stringify({ text }),
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

  // Send message
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isStreaming) return;

    // Check for client-side quick commands
    const trimmed = textToSend.trim();
    if (trimmed === '/github') {
      onOpenGitHub?.();
      setInput('');
      return;
    }
    if (trimmed === '/gallery') {
      onOpenGallery?.();
      setInput('');
      return;
    }
    if (trimmed.startsWith('/terminal ')) {
      const cmd = trimmed.replace('/terminal ', '');
      onRunTerminalCommand?.(cmd);
      setInput('');
      return;
    }

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setShowCommandsMenu(false);
    setIsStreaming(true);

    const assistantMsgId = Math.random().toString(36).substring(2, 9);
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      isStreaming: true,
    };

    setMessages([...nextMessages, initialAssistantMsg]);

    try {
      const isBrainstormer = trimmed.startsWith('/') || trimmed.startsWith('!');

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
          projectFiles: files,
          activeFile: activeFile.name,
          isBrainstormer,
        }),
      });

      if (!response.body) throw new Error('No stream available');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

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
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantMsgId
                      ? { ...m, content: accumulated, isStreaming: true }
                      : m
                  )
                );
              }
              if (data.error && !accumulated.trim()) {
                accumulated += `\n\n*Error: ${data.error}*`;
              }
            } catch {
              // ignore
            }
          }
        }
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId ? { ...m, isStreaming: false } : m
        )
      );

      if (voicePlaybackEnabled) {
        playVocalResponse(accumulated);
      }
    } catch (err: any) {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, content: `Error: ${err.message}`, isStreaming: false }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  // Voice Recording
  const handleToggleRecord = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = e => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            try {
              const res = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioBase64: base64Audio, mimeType: 'audio/webm' }),
              });
              const data = await res.json();
              if (data.text) {
                setInput(data.text);
              }
            } catch (err) {
              console.error('Transcription failed:', err);
            }
          };
          stream.getTracks().forEach(t => t.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Microphone error:', err);
      }
    }
  };

  // Extract code blocks from response
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
        else if (lang === 'typescript' || lang === 'ts') fileName = 'app.ts';
        else if (lang === 'tsx') fileName = 'App.tsx';
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
      particleCount: 35,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#38bdf8', '#818cf8', '#4ade80'],
    });
  };

  const handleApplyAllBlocks = (blocks: Array<{ fileName: string; code: string }>) => {
    for (const block of blocks) {
      onApplyFileChanges(block.fileName, block.code);
    }
    confetti({ particleCount: 50, spread: 70 });
    onRunPreview?.();
  };

  const slashCommands = [
    { cmd: '/proto', label: '!proto (Disposable Lab)', desc: 'Generate single-file in-memory prototype' },
    { cmd: '/scamper', label: '/scamper (SCAMPER Lab)', desc: 'Mutate concept with lateral contradiction attack' },
    { cmd: '/harden', label: '!harden (Defensive Layer)', desc: 'Inject WebCrypto AES-GCM and zero-network defense' },
    { cmd: '/fork', label: '!fork (3-Way Shootout)', desc: 'Generate Minimal vs Fast vs Experimental benchmarks' },
    { cmd: '/scaffold', label: '!scaffold (Factory Primitives)', desc: 'Create reusable modular generator & contracts' },
    { cmd: '/github', label: '/github (Open Hub)', desc: 'Connect token, commit or clone repositories' },
    { cmd: '/gallery', label: '/gallery (OS Storage)', desc: 'Browse saved projects & uploaded HTML' },
  ];

  return (
    <div className={`flex flex-col h-full bg-[#0b0f19] ${isCompact ? 'border-l border-[#30363d]' : ''} text-slate-200 select-none overflow-hidden relative`}>
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-[#30363d] text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-white text-xs">
              <span>Gemini Agent OS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Model: gemini-3.8-flash • Autonomous Coding Partner
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setVoicePlaybackEnabled(p => !p)}
            className={`p-1.5 rounded-lg transition-colors ${voicePlaybackEnabled ? 'bg-sky-950 text-sky-400 border border-sky-800' : 'text-slate-400 hover:text-white hover:bg-[#21262d]'}`}
            title={voicePlaybackEnabled ? 'Voice playback active' : 'Enable voice readback (TTS)'}
          >
            {voicePlaybackEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setMessages([messages[0]])}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#21262d] transition-colors"
            title="Clear Chat Conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => {
          const isUser = msg.role === 'user';
          const codeBlocks = !isUser ? extractCodeBlocks(msg.content) : [];

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                {isUser ? (
                  <>
                    <span>You</span>
                    <span className="w-4 h-4 rounded-full bg-[#21262d] flex items-center justify-center text-[9px] text-slate-300 font-bold">U</span>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center">
                      <Sparkles className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="font-semibold text-slate-300">Gemini</span>
                  </>
                )}
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl px-4 py-3 text-xs leading-relaxed max-w-2xl break-words select-text ${
                  isUser
                    ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-tr-none shadow-md'
                    : 'bg-[#161b22] border border-[#30363d] text-slate-200 rounded-tl-none shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Extracted Code Blocks Action Cards */}
                {codeBlocks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#30363d] space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-sky-400 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5" />
                        Fabricated Code Artifacts ({codeBlocks.length})
                      </span>
                      {codeBlocks.length > 1 && (
                        <button
                          onClick={() => handleApplyAllBlocks(codeBlocks)}
                          className="px-2 py-0.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold transition-colors"
                        >
                          Apply All to Workspace
                        </button>
                      )}
                    </div>

                    {codeBlocks.map((block, idx) => (
                      <div
                        key={idx}
                        className="bg-[#0d1117] border border-[#21262d] rounded-xl p-2.5 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-sky-300 font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                            {block.fileName} ({block.language})
                          </span>
                          <button
                            onClick={() => handleApplyCode(block.fileName, block.code)}
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shadow-xs"
                          >
                            <FileCheck className="w-3 h-3" />
                            Apply File
                          </button>
                        </div>
                        <pre className="text-[11px] font-mono text-slate-400 bg-black/40 p-2 rounded max-h-32 overflow-y-auto">
                          {block.code.slice(0, 400)}
                          {block.code.length > 400 && '\n...'}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isStreaming && (
          <div className="flex items-center gap-2 text-xs text-sky-400 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Gemini Agent is synthesizing solution and workspace artifacts...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts (If fresh) */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <div className="text-[11px] text-slate-400 font-semibold mb-1.5 flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" />
            Suggested High-Agency Prompts
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <button
              onClick={() => handleSendMessage('Create an interactive TypeScript component with Tailwind and test in live preview')}
              className="text-left p-2 rounded-lg bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-[11px] text-slate-300 transition-colors"
            >
              🚀 <strong>TypeScript + Canvas:</strong> Build interactive component
            </button>
            <button
              onClick={() => handleSendMessage('/proto Build a disposable zero-dependency particle engine with HTML5 Canvas')}
              className="text-left p-2 rounded-lg bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-[11px] text-slate-300 transition-colors"
            >
              ⚡ <strong>!proto Lab:</strong> Zero-dep particle physics engine
            </button>
            <button
              onClick={() => handleSendMessage('/harden Audit this workspace and inject WebCrypto AES-GCM local encryption defense')}
              className="text-left p-2 rounded-lg bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-[11px] text-slate-300 transition-colors"
            >
              🛡️ <strong>!harden:</strong> Security & WebCrypto encryption layer
            </button>
            <button
              onClick={() => handleSendMessage('/fork Generate 3 competing implementations (Minimal vs Fast vs Experimental) to benchmark')}
              className="text-left p-2 rounded-lg bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-[11px] text-slate-300 transition-colors"
            >
              ⚔️ <strong>!fork Shootout:</strong> 3-way architecture benchmark
            </button>
          </div>
        </div>
      )}

      {/* Bottom Command Popup Menu */}
      {showCommandsMenu && (
        <div className="mx-4 mb-2 bg-[#161b22] border border-[#30363d] rounded-xl p-2 shadow-2xl space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold px-2 py-1">
            Slash Commands & Subroutines
          </div>
          {slashCommands.map(cmd => (
            <button
              key={cmd.cmd}
              onClick={() => {
                setInput(cmd.cmd + ' ');
                setShowCommandsMenu(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#21262d] text-xs flex items-center justify-between text-slate-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-sky-400 font-semibold">{cmd.cmd}</span>
                <span className="text-slate-200">{cmd.label}</span>
              </div>
              <span className="text-[11px] text-slate-500">{cmd.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Persistent Prompt Input Bar */}
      <div className="p-3 bg-[#161b22] border-t border-[#30363d]">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          {/* Slash Commands Button */}
          <button
            type="button"
            onClick={() => setShowCommandsMenu(p => !p)}
            className="p-2 text-slate-400 hover:text-sky-400 hover:bg-[#21262d] rounded-xl transition-colors font-mono text-xs flex items-center gap-1"
            title="Insert Slash Command"
          >
            <Command className="w-3.5 h-3.5" />
            <span>/</span>
          </button>

          {/* Prompt Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={e => {
                setInput(e.target.value);
                if (e.target.value === '/') setShowCommandsMenu(true);
              }}
              placeholder="Ask Gemini Agent to build, refactor, transpile TypeScript, or type / for commands..."
              className="w-full bg-[#0d1117] border border-[#30363d] focus:border-sky-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>

          {/* Voice Input */}
          <button
            type="button"
            onClick={handleToggleRecord}
            className={`p-2 rounded-xl transition-colors ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse'
                : 'text-slate-400 hover:text-white hover:bg-[#21262d]'
            }`}
            title={isRecording ? 'Stop Recording' : 'Voice Input via Gemini Transcribe'}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="p-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl shadow-md transition-all"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
