import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  StopCircle,
  FileCheck,
  ArrowRight,
  Copy,
  Check,
  Radio,
  Settings,
  MessageSquare,
  Flame,
  ChevronDown,
} from 'lucide-react';
import { CopilotSettings, CopilotChatSession } from '../../types/copilot';
import { ProjectFile } from '../../types/ide';

interface CopilotLiveModeProps {
  settings: CopilotSettings;
  activeFile: ProjectFile;
  files: ProjectFile[];
  activeSession: CopilotChatSession;
  onSendMessage: (text: string, isLiveVoice?: boolean) => Promise<string>;
  onApplyCode: (fileName: string, code: string) => void;
  onExitLiveMode: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
}

export const CopilotLiveMode: React.FC<CopilotLiveModeProps> = ({
  settings,
  activeFile,
  files,
  activeSession,
  onSendMessage,
  onApplyCode,
  onExitLiveMode,
  onOpenSettings,
  onOpenHistory,
}) => {
  const [liveState, setLiveState] = useState<'idle' | 'listening' | 'transcribing' | 'thinking' | 'speaking'>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [lastGeminiReply, setLastGeminiReply] = useState('');
  const [handsFree, setHandsFree] = useState(settings.liveChatHandsFree);
  const [audioMuted, setAudioMuted] = useState(!settings.liveChatAutoPlayAudio);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const handsFreeTimeoutRef = useRef<any>(null);

  // Initialize SpeechRecognition if available in browser
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setLiveState('listening');
        };

        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const finalTranscript = event.results[i][0].transcript;
              setLiveTranscript(finalTranscript);
              handleVoiceSubmission(finalTranscript);
              return;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          if (interim) {
            setLiveTranscript(interim);
          }
        };

        recognition.onerror = (event: any) => {
          console.debug('Speech recognition event:', event.error);
          if (event.error !== 'no-speech') {
            setLiveState('idle');
          }
        };

        recognition.onend = () => {
          // If in listening mode and no transcript was submitted, return to idle
          setLiveState(prev => (prev === 'listening' ? 'idle' : prev));
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.debug('SpeechRecognition setup notice:', e);
      }
    }

    return () => {
      stopAllAudio();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (handsFreeTimeoutRef.current) {
        clearTimeout(handsFreeTimeoutRef.current);
      }
    };
  }, []);

  const stopAllAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
  };

  // Start voice capture (SpeechRecognition or fallback to MediaRecorder)
  const startListening = async () => {
    stopAllAudio();
    setLiveTranscript('');

    if (recognitionRef.current) {
      try {
        setLiveState('listening');
        recognitionRef.current.start();
        return;
      } catch (err) {
        console.debug('SpeechRecognition start fallback to MediaRecorder:', err);
      }
    }

    // MediaRecorder fallback via /api/transcribe
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        setLiveState('transcribing');
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
              setLiveTranscript(data.text);
              handleVoiceSubmission(data.text);
            } else {
              setLiveState('idle');
            }
          } catch (err) {
            console.error('Transcription error:', err);
            setLiveState('idle');
          }
        };
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setLiveState('listening');
    } catch (err) {
      console.error('Microphone error in Live Mode:', err);
      setLiveState('idle');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // Handle transcribed prompt
  const handleVoiceSubmission = async (text: string) => {
    if (!text.trim()) {
      setLiveState('idle');
      return;
    }

    setLiveState('thinking');
    try {
      const reply = await onSendMessage(text, true);
      setLastGeminiReply(reply);

      // Play vocal audio if not muted
      if (!audioMuted) {
        await playVoiceAudio(reply);
      } else {
        setLiveState('idle');
        if (handsFree) {
          triggerHandsFreeLoop();
        }
      }
    } catch (err) {
      console.error('Error generating live response:', err);
      setLiveState('idle');
    }
  };

  // TTS Playback
  const playVoiceAudio = async (text: string) => {
    setLiveState('speaking');
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
        currentAudioRef.current = audio;

        audio.onended = () => {
          setLiveState('idle');
          if (handsFree) {
            triggerHandsFreeLoop();
          }
        };
        audio.onerror = () => {
          setLiveState('idle');
        };

        await audio.play();
      } else {
        setLiveState('idle');
      }
    } catch (err) {
      console.warn('Live mode TTS failed, falling back to Web Speech Synthesis:', err);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text.slice(0, 300));
        utterance.onend = () => {
          setLiveState('idle');
          if (handsFree) triggerHandsFreeLoop();
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setLiveState('idle');
      }
    }
  };

  const triggerHandsFreeLoop = () => {
    if (handsFreeTimeoutRef.current) clearTimeout(handsFreeTimeoutRef.current);
    handsFreeTimeoutRef.current = setTimeout(() => {
      startListening();
    }, 1200);
  };

  // Interrupt speech
  const handleInterrupt = () => {
    stopAllAudio();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setLiveState('idle');
    startListening();
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
        else if (lang === 'json') fileName = 'data.json';
        else fileName = activeFile.name;
      }

      blocks.push({ language: lang, fileName, code });
    }

    return blocks;
  };

  const codeBlocks = lastGeminiReply ? extractCodeBlocks(lastGeminiReply) : [];

  return (
    <div className="flex flex-col h-full bg-[#090d16] text-slate-200 select-none overflow-hidden relative border-l border-[#30363d]">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_50%_40%,rgba(56,189,248,0.15),transparent_70%)]" />

      {/* Top Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#101623] border-b border-[#1f293d] z-10 text-xs">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
          </div>
          <span className="font-bold text-sky-300 tracking-wider">GEMINI LIVE MODE</span>
          <span className="text-[10px] bg-sky-950/80 text-sky-400 px-1.5 py-0.2 rounded border border-sky-800/60 font-mono">
            {settings.ttsVoice}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setAudioMuted(prev => !prev)}
            className={`p-1 rounded transition-colors ${
              !audioMuted ? 'text-sky-400 bg-sky-500/10' : 'text-slate-500 hover:text-slate-300'
            }`}
            title={audioMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {audioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onOpenSettings}
            className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-[#1a2333]"
            title="Copilot Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenHistory}
            className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-[#1a2333]"
            title="Chat History"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onExitLiveMode}
            className="px-2 py-0.5 bg-[#1f293d] hover:bg-[#2b3852] text-slate-300 hover:text-white rounded text-[11px] font-medium transition-colors"
          >
            Standard Chat
          </button>
        </div>
      </div>

      {/* Main Live Voice Interactive Orb Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 space-y-5">
        {/* Animated Gemini Waveform / Orb */}
        <div className="relative flex items-center justify-center">
          {/* Outer Breathing Rings */}
          <div
            className={`absolute rounded-full transition-all duration-700 pointer-events-none ${
              liveState === 'listening'
                ? 'w-44 h-44 bg-rose-500/20 animate-ping'
                : liveState === 'speaking'
                ? 'w-48 h-48 bg-sky-500/25 animate-pulse'
                : liveState === 'thinking'
                ? 'w-40 h-40 bg-purple-500/25 animate-spin'
                : 'w-36 h-36 bg-sky-500/10'
            }`}
          />

          <div
            className={`absolute rounded-full transition-all duration-500 pointer-events-none ${
              liveState === 'listening'
                ? 'w-36 h-36 border-2 border-rose-500/50 shadow-[0_0_25px_rgba(244,63,94,0.4)]'
                : liveState === 'speaking'
                ? 'w-36 h-36 border-2 border-sky-400/60 shadow-[0_0_30px_rgba(56,189,248,0.5)]'
                : liveState === 'thinking'
                ? 'w-36 h-36 border-2 border-dashed border-purple-400/60 animate-spin'
                : 'w-32 h-32 border border-sky-500/30'
            }`}
          />

          {/* Central Pulsing Orb / Mic Button */}
          <button
            onClick={() => {
              if (liveState === 'listening') {
                stopListening();
              } else if (liveState === 'speaking' || liveState === 'thinking') {
                handleInterrupt();
              } else {
                startListening();
              }
            }}
            className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-xl transition-all transform active:scale-95 ${
              liveState === 'listening'
                ? 'bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-rose-900/50'
                : liveState === 'speaking'
                ? 'bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 text-white shadow-sky-900/50'
                : liveState === 'thinking'
                ? 'bg-gradient-to-tr from-purple-600 to-pink-600 text-white shadow-purple-900/50'
                : 'bg-gradient-to-tr from-slate-800 to-slate-900 border border-sky-500/40 text-sky-400 hover:border-sky-400 hover:shadow-sky-900/40'
            }`}
            title={
              liveState === 'listening'
                ? 'Listening... Click to send'
                : liveState === 'speaking'
                ? 'Gemini is speaking. Click to Interrupt'
                : 'Tap to speak with Gemini Live'
            }
          >
            {liveState === 'listening' ? (
              <>
                <Mic className="w-8 h-8 animate-bounce" />
                <span className="text-[10px] font-bold tracking-wider mt-1">LISTENING</span>
              </>
            ) : liveState === 'speaking' ? (
              <>
                <Volume2 className="w-8 h-8 animate-pulse" />
                <span className="text-[10px] font-bold tracking-wider mt-1">INTERRUPT</span>
              </>
            ) : liveState === 'thinking' ? (
              <>
                <Sparkles className="w-8 h-8 animate-spin" />
                <span className="text-[10px] font-bold tracking-wider mt-1">THINKING</span>
              </>
            ) : (
              <>
                <Mic className="w-8 h-8" />
                <span className="text-[10px] font-bold tracking-wider mt-1">TAP TO SPEAK</span>
              </>
            )}
          </button>
        </div>

        {/* Live Audio Frequency Bars Simulation */}
        <div className="flex items-center gap-1 h-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(bar => {
            const isActive = liveState === 'listening' || liveState === 'speaking';
            return (
              <div
                key={bar}
                className={`w-1 rounded-full transition-all duration-150 ${
                  liveState === 'listening'
                    ? 'bg-rose-400'
                    : liveState === 'speaking'
                    ? 'bg-sky-400'
                    : 'bg-slate-700/60'
                }`}
                style={{
                  height: isActive
                    ? `${Math.max(4, ((bar * 7) % 24) + (Math.sin(bar) * 6 + 10))}px`
                    : '4px',
                }}
              />
            );
          })}
        </div>

        {/* Status Message */}
        <div className="text-center">
          <p className="text-xs font-medium text-slate-300">
            {liveState === 'idle' && 'Ready for your coding voice prompt'}
            {liveState === 'listening' && 'Listening to your voice in real time...'}
            {liveState === 'transcribing' && 'Transcribing speech with Gemini...'}
            {liveState === 'thinking' && 'Gemini is reasoning and writing code...'}
            {liveState === 'speaking' && 'Gemini Live responding with voice synthesis...'}
          </p>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
            Active file: <span className="text-sky-400">{activeFile.name}</span>
          </p>
        </div>

        {/* Hands-Free Loop Toggle */}
        <div className="flex items-center gap-2 bg-[#121927] border border-[#212d42] rounded-full px-3 py-1">
          <button
            onClick={() => setHandsFree(prev => !prev)}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
              handsFree ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                handsFree ? 'bg-sky-400 animate-ping' : 'bg-slate-600'
              }`}
            />
            <span>Hands-Free Loop {handsFree ? 'Active' : 'Off'}</span>
          </button>
        </div>
      </div>

      {/* Transcript & Code Block Bottom Drawer */}
      <div className="bg-[#101623] border-t border-[#1f293d] p-3 max-h-56 overflow-y-auto space-y-2.5 z-10">
        {/* Live User Prompt Transcript */}
        {liveTranscript && (
          <div className="flex items-start gap-2 bg-sky-950/30 border border-sky-800/40 rounded-lg p-2 text-xs">
            <Mic className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-sky-400 font-mono block">You said:</span>
              <p className="text-slate-200 italic">{liveTranscript}</p>
            </div>
          </div>
        )}

        {/* Last Gemini Summary */}
        {lastGeminiReply && (
          <div className="bg-[#161f30] border border-[#24334f] rounded-lg p-2.5 text-xs text-slate-300">
            <div className="flex items-center justify-between mb-1 text-[10px] text-sky-400 font-mono">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-sky-400" />
                Gemini Live Response:
              </span>
              <span>{settings.model}</span>
            </div>
            <p className="whitespace-pre-wrap leading-relaxed line-clamp-4 hover:line-clamp-none">
              {lastGeminiReply.replace(/```[\s\S]*?```/g, '[Actionable code block generated below]')}
            </p>

            {/* Generated Code Blocks */}
            {codeBlocks.length > 0 && (
              <div className="mt-2 pt-2 border-t border-[#24334f] space-y-1.5">
                <span className="text-[10px] text-emerald-400 font-semibold block uppercase">
                  Actionable Code Patches:
                </span>
                {codeBlocks.map((block, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 bg-[#090d16] p-1.5 rounded border border-[#24334f]"
                  >
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300 truncate">
                      <FileCheck className="w-3 h-3 text-emerald-400" />
                      <span className="truncate">{block.fileName}</span>
                      <span className="text-slate-500 text-[10px]">
                        ({block.code.split('\n').length} lines)
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(block.code);
                          setCopiedIndex(idx);
                          setTimeout(() => setCopiedIndex(null), 1500);
                        }}
                        className="p-1 text-slate-400 hover:text-white"
                        title="Copy Code"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => onApplyCode(block.fileName, block.code)}
                        className="flex items-center gap-1 px-2 py-0.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-semibold transition-colors"
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
        )}
      </div>
    </div>
  );
};
