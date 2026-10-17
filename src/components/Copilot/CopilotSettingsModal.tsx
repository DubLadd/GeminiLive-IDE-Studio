import React, { useState } from 'react';
import {
  X,
  Sliders,
  Sparkles,
  Volume2,
  Cpu,
  Shield,
  Palette,
  RotateCcw,
  Zap,
  Check,
  Brain,
  Layers,
  Wand2,
} from 'lucide-react';
import {
  CopilotSettings,
  DEFAULT_COPILOT_SETTINGS,
  GEMINI_MODELS,
  VOICE_OPTIONS,
  SYSTEM_PERSONA_PROMPTS,
  CopilotSystemPersona,
  GeminiModelId,
  VoicePersona,
} from '../../types/copilot';

interface CopilotSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CopilotSettings;
  onSaveSettings: (settings: CopilotSettings) => void;
}

export const CopilotSettingsModal: React.FC<CopilotSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [localSettings, setLocalSettings] = useState<CopilotSettings>(settings);
  const [activeTab, setActiveTab] = useState<'model' | 'persona' | 'voice' | 'editor'>('model');
  const [isPlayingTestVoice, setIsPlayingTestVoice] = useState(false);
  const [testVoiceSuccess, setTestVoiceSuccess] = useState(false);

  if (!isOpen) return null;

  const handleUpdate = <K extends keyof CopilotSettings>(key: K, value: CopilotSettings[K]) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    onSaveSettings(updated);
  };

  const handleResetDefaults = () => {
    setLocalSettings(DEFAULT_COPILOT_SETTINGS);
    onSaveSettings(DEFAULT_COPILOT_SETTINGS);
  };

  const handleTestVoice = async () => {
    if (isPlayingTestVoice) return;
    setIsPlayingTestVoice(true);
    setTestVoiceSuccess(false);

    try {
      const sampleText = `Greetings! I am ${localSettings.ttsVoice}, your Gemini pair programming voice assistant in this workspace.`;
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          voice: localSettings.ttsVoice,
        }),
      });

      const data = await res.json();
      if (data.audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        audio.onended = () => {
          setIsPlayingTestVoice(false);
          setTestVoiceSuccess(true);
          setTimeout(() => setTestVoiceSuccess(false), 2000);
        };
        audio.onerror = () => setIsPlayingTestVoice(false);
        await audio.play();
      } else {
        setIsPlayingTestVoice(false);
      }
    } catch (err) {
      console.warn('Voice preview failed:', err);
      setIsPlayingTestVoice(false);
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-[#0d1117]/95 backdrop-blur-md flex flex-col border-l border-[#30363d] text-slate-200 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-[#161b22] border-b border-[#30363d]">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-xs tracking-wider uppercase text-slate-200">
            Copilot Settings & Options
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-200 hover:bg-[#21262d] rounded transition-colors"
            title="Reset to defaults"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-[#21262d] transition-colors"
            title="Close Settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-[#161b22]/70 border-b border-[#21262d] text-xs px-2 pt-1">
        <button
          onClick={() => setActiveTab('model')}
          className={`flex items-center gap-1.5 px-3 py-1.5 border-b-2 font-medium transition-colors ${
            activeTab === 'model'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Model & Tokens</span>
        </button>
        <button
          onClick={() => setActiveTab('persona')}
          className={`flex items-center gap-1.5 px-3 py-1.5 border-b-2 font-medium transition-colors ${
            activeTab === 'persona'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>Persona & Role</span>
        </button>
        <button
          onClick={() => setActiveTab('voice')}
          className={`flex items-center gap-1.5 px-3 py-1.5 border-b-2 font-medium transition-colors ${
            activeTab === 'voice'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Voice & Live</span>
        </button>
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex items-center gap-1.5 px-3 py-1.5 border-b-2 font-medium transition-colors ${
            activeTab === 'editor'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Editor</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
        {/* TAB 1: MODEL & GENERATION */}
        {activeTab === 'model' && (
          <div className="space-y-4">
            {/* Model Selection */}
            <div>
              <label className="text-slate-300 font-semibold block mb-2">
                Gemini Intelligence Engine
              </label>
              <div className="space-y-1.5">
                {GEMINI_MODELS.map(m => {
                  const isSelected = localSettings.model === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleUpdate('model', m.id)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-sky-950/50 border-sky-500 text-white shadow-sm'
                          : 'bg-[#161b22] border-[#30363d] text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Sparkles className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-400' : 'text-slate-500'}`} />
                          <span className="font-semibold text-xs">{m.name}</span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          isSelected ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40' : 'bg-[#21262d] text-slate-400'
                        }`}>
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {m.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500 font-mono">
                        <span>Speed: <strong className="text-slate-300">{m.speed}</strong></span>
                        <span>Reasoning: <strong className="text-slate-300">{m.intelligence}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Temperature Slider & Presets */}
            <div className="pt-2 border-t border-[#21262d]">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-300 font-medium">
                  Temperature: <span className="font-mono text-sky-400">{localSettings.temperature.toFixed(2)}</span>
                </label>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    onClick={() => handleUpdate('temperature', 0.2)}
                    className={`px-1.5 py-0.5 rounded border transition-colors ${
                      localSettings.temperature === 0.2
                        ? 'bg-sky-900/60 border-sky-500 text-sky-200'
                        : 'border-[#30363d] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Precise (0.2)
                  </button>
                  <button
                    onClick={() => handleUpdate('temperature', 0.7)}
                    className={`px-1.5 py-0.5 rounded border transition-colors ${
                      localSettings.temperature === 0.7
                        ? 'bg-sky-900/60 border-sky-500 text-sky-200'
                        : 'border-[#30363d] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Balanced (0.7)
                  </button>
                  <button
                    onClick={() => handleUpdate('temperature', 0.95)}
                    className={`px-1.5 py-0.5 rounded border transition-colors ${
                      localSettings.temperature === 0.95
                        ? 'bg-sky-900/60 border-sky-500 text-sky-200'
                        : 'border-[#30363d] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Creative (0.95)
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={localSettings.temperature}
                onChange={e => handleUpdate('temperature', parseFloat(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                <span>0.0 Strict & Deterministic</span>
                <span>1.0 Highly Exploratory</span>
              </div>
            </div>

            {/* Max Output Tokens */}
            <div className="pt-2 border-t border-[#21262d]">
              <label className="text-slate-300 font-medium block mb-1.5">
                Max Output Tokens
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[1024, 2048, 4096, 8192].map(t => (
                  <button
                    key={t}
                    onClick={() => handleUpdate('maxTokens', t)}
                    className={`py-1.5 px-1 rounded border text-center font-mono text-[11px] transition-colors ${
                      localSettings.maxTokens === t
                        ? 'bg-sky-600/30 border-sky-500 text-sky-300 font-bold'
                        : 'bg-[#161b22] border-[#30363d] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Thinking Budget (Thinking Config) */}
            <div className="pt-2 border-t border-[#21262d]">
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-purple-400" />
                  <span>Thinking Budget (Extended Reasoning)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {localSettings.thinkingBudget === 0 ? 'Standard (Off)' : `${localSettings.thinkingBudget} tokens`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                {[
                  { value: 0, label: 'Off' },
                  { value: 1024, label: '1k' },
                  { value: 2048, label: '2k' },
                  { value: 4096, label: '4k' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleUpdate('thinkingBudget', opt.value)}
                    className={`py-1 rounded border text-center font-mono text-[11px] transition-colors ${
                      localSettings.thinkingBudget === opt.value
                        ? 'bg-purple-900/40 border-purple-500 text-purple-300 font-bold'
                        : 'bg-[#161b22] border-[#30363d] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Allocates internal reasoning tokens before generating code for intricate architectural tasks.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: PERSONA & DIRECTIVES */}
        {activeTab === 'persona' && (
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 font-semibold block mb-2">
                Active System Persona
              </label>
              <div className="space-y-2">
                {(Object.keys(SYSTEM_PERSONA_PROMPTS) as CopilotSystemPersona[]).map(pKey => {
                  const p = SYSTEM_PERSONA_PROMPTS[pKey];
                  const isSelected = localSettings.systemPersona === pKey;
                  return (
                    <div
                      key={pKey}
                      onClick={() => handleUpdate('systemPersona', pKey)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-sky-950/50 border-sky-500 text-white shadow-sm'
                          : 'bg-[#161b22] border-[#30363d] text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-sky-300">{p.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Directives Textarea */}
            <div className="pt-2 border-t border-[#21262d]">
              <label className="text-slate-300 font-medium block mb-1">
                Custom System Directives & Instructions
              </label>
              <p className="text-[10px] text-slate-500 mb-2">
                Persistent instructions injected into Gemini prompts (e.g. style rules, architectural preferences, libraries).
              </p>
              <textarea
                value={localSettings.customSystemPrompt}
                onChange={e => handleUpdate('customSystemPrompt', e.target.value)}
                placeholder="e.g. Prefer Tailwind 4 utilities. Enforce strict null safety. Write tests using Vitest..."
                rows={4}
                className="w-full bg-[#0d1117] border border-[#30363d] focus:border-sky-500 rounded p-2 text-xs text-slate-200 placeholder-slate-600 outline-none font-mono"
              />
            </div>
          </div>
        )}

        {/* TAB 3: VOICE & LIVE */}
        {activeTab === 'voice' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-slate-300 font-semibold">
                  Gemini TTS Voice Persona
                </label>
                <button
                  onClick={handleTestVoice}
                  disabled={isPlayingTestVoice}
                  className="flex items-center gap-1 px-2.5 py-1 bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 border border-sky-500/40 rounded text-[11px] font-medium transition-colors"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isPlayingTestVoice ? 'animate-bounce text-sky-400' : ''}`} />
                  <span>{isPlayingTestVoice ? 'Playing...' : testVoiceSuccess ? 'Voice OK!' : 'Test Voice'}</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {VOICE_OPTIONS.map(v => {
                  const isSelected = localSettings.ttsVoice === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => handleUpdate('ttsVoice', v.id)}
                      className={`p-2 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-sky-950/50 border-sky-500 text-white'
                          : 'bg-[#161b22] border-[#30363d] text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Volume2 className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-400' : 'text-slate-500'}`} />
                        <div>
                          <span className="font-semibold text-xs">{v.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono ml-2">({v.gender})</span>
                          <p className="text-[10px] text-slate-400">{v.description}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Chat Hands-Free Toggle */}
            <div className="pt-2 border-t border-[#21262d] space-y-3">
              <label className="flex items-center justify-between p-2 bg-[#161b22] rounded-lg border border-[#30363d] cursor-pointer">
                <div>
                  <span className="font-medium text-slate-200 block text-xs">
                    Continuous Hands-Free Conversation
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Microphone automatically restarts after Gemini finishes speaking.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.liveChatHandsFree}
                  onChange={e => handleUpdate('liveChatHandsFree', e.target.checked)}
                  className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 bg-[#161b22] rounded-lg border border-[#30363d] cursor-pointer">
                <div>
                  <span className="font-medium text-slate-200 block text-xs">
                    Auto-Play Voice Responses
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Speak Gemini's summary responses aloud through TTS.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.liveChatAutoPlayAudio}
                  onChange={e => handleUpdate('liveChatAutoPlayAudio', e.target.checked)}
                  className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* TAB 4: EDITOR & WORKSPACE */}
        {activeTab === 'editor' && (
          <div className="space-y-3">
            <label className="flex items-center justify-between p-2.5 bg-[#161b22] rounded-lg border border-[#30363d] cursor-pointer">
              <div>
                <span className="font-medium text-slate-200 block text-xs">
                  Auto-Detect Actionable Code Patches
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Parses Markdown code blocks and surfaces 1-click 'Apply to File' buttons.
                </span>
              </div>
              <input
                type="checkbox"
                checked={localSettings.autoApplyCode}
                onChange={e => handleUpdate('autoApplyCode', e.target.checked)}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 bg-[#161b22] rounded-lg border border-[#30363d] cursor-pointer">
              <div>
                <span className="font-medium text-slate-200 block text-xs">
                  Show Model & Token Diagnostics
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Displays active model badge and message timestamps.
                </span>
              </div>
              <input
                type="checkbox"
                checked={localSettings.showTokenEstimates}
                onChange={e => handleUpdate('showTokenEstimates', e.target.checked)}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </label>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-[#161b22] border-t border-[#30363d] flex items-center justify-between">
        <span className="text-[10px] text-slate-500 font-mono">
          Model: {localSettings.model}
        </span>
        <button
          onClick={onClose}
          className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};
