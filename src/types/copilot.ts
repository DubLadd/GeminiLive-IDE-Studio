import { ChatMessage } from './ide';

export type GeminiModelId =
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash-lite'
  | 'gemini-flash-latest'
  | 'gemini-3.8-flash';

export interface ModelMetadata {
  id: GeminiModelId;
  name: string;
  badge: string;
  description: string;
  speed: 'Ultra-fast' | 'Fast' | 'Balanced';
  intelligence: 'Superior' | 'Advanced' | 'High';
}

export const GEMINI_MODELS: ModelMetadata[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    badge: 'Recommended',
    description: 'Fast and versatile multimodal workhorse for pair coding and debugging.',
    speed: 'Fast',
    intelligence: 'Advanced',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    badge: 'Deep Reasoning',
    description: 'Premier model for complex multi-file architecture and intricate algorithms.',
    speed: 'Balanced',
    intelligence: 'Superior',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    badge: 'Ultra Fast',
    description: 'Ultra-lightweight low-latency model for instant responses.',
    speed: 'Ultra-fast',
    intelligence: 'High',
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    badge: 'Dynamic',
    description: 'Continuously updated Flash checkpoint with latest improvements.',
    speed: 'Fast',
    intelligence: 'Advanced',
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    badge: 'Next-Gen Preview',
    description: 'Latest model candidate with enhanced code comprehension.',
    speed: 'Fast',
    intelligence: 'Superior',
  },
];

export type VoicePersona = 'Puck' | 'Charon' | 'Aoede' | 'Fenrir' | 'Kore';

export interface VoiceOption {
  id: VoicePersona;
  name: string;
  gender: string;
  description: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'Puck', name: 'Puck', gender: 'Energetic', description: 'Upbeat and engaging pair-programming companion' },
  { id: 'Charon', name: 'Charon', gender: 'Calm', description: 'Deep, steady, and measured architectural guide' },
  { id: 'Aoede', name: 'Aoede', gender: 'Warm', description: 'Clear, natural, and expressive explanations' },
  { id: 'Fenrir', name: 'Fenrir', gender: 'Crisp', description: 'Direct, focused, and punchy technical advice' },
  { id: 'Kore', name: 'Kore', gender: 'Gentle', description: 'Smooth, friendly, and patient walkthroughs' },
];

export type CopilotSystemPersona = 'architect' | 'pair' | 'security' | 'creative' | 'custom';

export interface CopilotChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  activeFileName?: string;
  modelUsed?: GeminiModelId;
  isPinned?: boolean;
}

export interface CopilotSettings {
  model: GeminiModelId;
  temperature: number; // 0.0 to 1.0
  maxTokens: number; // 1024, 2048, 4096, 8192
  thinkingBudget: number; // 0 (off), 1024, 2048, 4096
  systemPersona: CopilotSystemPersona;
  customSystemPrompt: string;
  autoApplyCode: boolean;
  ttsVoice: VoicePersona;
  liveChatHandsFree: boolean;
  liveChatAutoPlayAudio: boolean;
  showTokenEstimates: boolean;
}

export const DEFAULT_COPILOT_SETTINGS: CopilotSettings = {
  model: 'gemini-2.5-flash',
  temperature: 0.7,
  maxTokens: 4096,
  thinkingBudget: 0,
  systemPersona: 'architect',
  customSystemPrompt: '',
  autoApplyCode: true,
  ttsVoice: 'Puck',
  liveChatHandsFree: false,
  liveChatAutoPlayAudio: true,
  showTokenEstimates: true,
};

export const SYSTEM_PERSONA_PROMPTS: Record<CopilotSystemPersona, { label: string; description: string; prompt: string }> = {
  architect: {
    label: 'Cloud Architect',
    description: 'Senior full-stack perspective emphasizing modular structures, clean abstractions, and scalability.',
    prompt: `You are a Senior Full-Stack Cloud Architect. Emphasize modular architecture, clean functional interfaces, TypeScript strictness, edge-case resilience, and zero unnecessary dependencies. Provide production-ready code with actionable structural breakdowns.`,
  },
  pair: {
    label: 'Pair Programmer',
    description: 'Agile companion focused on fast iteration, practical solutions, and immediate runnable patches.',
    prompt: `You are an agile Pair Programming Companion. Be concise, clear, and focused on instant developer iteration. Highlight why specific changes were made and how to test them.`,
  },
  security: {
    label: 'Security Auditor',
    description: 'Defensive engineering mindset enforcing input sanitization, WebCrypto encryption, and boundary safety.',
    prompt: `You are a Defensive Application Security Auditor. Scrutinize all inputs, prevent injection vulnerabilities, enforce least privilege, memory bounds, and local-first data isolation.`,
  },
  creative: {
    label: 'Creative Experimenter',
    description: 'Generative and visual computing specialist emphasizing interactive canvas, physics, and expressive styling.',
    prompt: `You are a Creative Computing & Generative Physics Experimenter. Emphasize expressive UI canvas mechanics, smooth mathematical simulations, particle physics, and captivating visual styling.`,
  },
  custom: {
    label: 'Custom Persona',
    description: 'User-specified behavioral directives and rules.',
    prompt: ``,
  },
};
