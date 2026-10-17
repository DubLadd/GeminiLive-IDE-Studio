import { ChatMessage } from '../types/ide';
import {
  CopilotChatSession,
  CopilotSettings,
  DEFAULT_COPILOT_SETTINGS,
} from '../types/copilot';
import { auth, db, doc, setDoc } from '../lib/firebase';

const SESSIONS_STORAGE_KEY = 'gemini_copilot_chat_sessions_v3';
const ACTIVE_SESSION_STORAGE_KEY = 'gemini_copilot_active_session_id_v3';
const SETTINGS_STORAGE_KEY = 'gemini_copilot_settings_v3';

export function createNewSession(activeFileName?: string, welcomeMessage?: string): CopilotChatSession {
  const now = Date.now();
  const id = 'session-' + Math.random().toString(36).substring(2, 9);
  return {
    id,
    title: 'New Conversation',
    messages: [
      {
        id: 'init-' + id,
        role: 'assistant',
        content:
          welcomeMessage ||
          `Hello! I am **Gemini Live**, your real-time coding companion in the IDE.
I have full context of your workspace files${activeFileName ? ` (currently focusing on **${activeFileName}**)` : ''}.
You can ask me to write new features, refactor code, fix bugs, or build entire interactive components.`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ],
    createdAt: now,
    updatedAt: now,
    activeFileName,
    isPinned: false,
  };
}

export function loadChatSessions(defaultFileName?: string): { sessions: CopilotChatSession[]; activeId: string } {
  try {
    const rawSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
    const savedActiveId = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);

    if (rawSessions) {
      const parsed: CopilotChatSession[] = JSON.parse(rawSessions);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validActiveId =
          savedActiveId && parsed.some(s => s.id === savedActiveId)
            ? savedActiveId
            : parsed[0].id;
        return { sessions: parsed, activeId: validActiveId };
      }
    }
  } catch (err) {
    console.warn('Failed to load copilot chat sessions from localStorage:', err);
  }

  // Create initial default session
  const initial = createNewSession(defaultFileName);
  saveChatSessions([initial]);
  saveActiveSessionId(initial.id);
  return { sessions: [initial], activeId: initial.id };
}

export function saveChatSessions(sessions: CopilotChatSession[]): void {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.warn('Failed to save copilot chat sessions to localStorage:', err);
  }
}

export function saveActiveSessionId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, id);
  } catch (err) {
    console.warn('Failed to save active copilot session ID:', err);
  }
}

export function generateSmartSessionTitle(prompt: string): string {
  const clean = prompt
    .replace(/^(!proto|!harden|!scaffold|!fork|!vector|\/wild|\/mutate|\/failure)\s+/i, '')
    .replace(/[^\w\s-]/g, '')
    .trim();
  if (!clean) return 'Code Discussion';
  const words = clean.split(/\s+/).slice(0, 5);
  const title = words.join(' ');
  return title.charAt(0).toUpperCase() + title.slice(1);
}

export function loadCopilotSettings(): CopilotSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_COPILOT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('Failed to load copilot settings from localStorage:', err);
  }
  return { ...DEFAULT_COPILOT_SETTINGS };
}

export function saveCopilotSettings(settings: CopilotSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save copilot settings to localStorage:', err);
  }
}

export function exportSessionAsMarkdown(session: CopilotChatSession): string {
  let md = `# Gemini Copilot Transcript: ${session.title}\n`;
  md += `**Date:** ${new Date(session.createdAt).toLocaleString()}\n`;
  if (session.activeFileName) md += `**File:** \`${session.activeFileName}\`\n`;
  if (session.modelUsed) md += `**Model:** \`${session.modelUsed}\`\n`;
  md += `\n---\n\n`;

  session.messages.forEach(m => {
    const sender = m.role === 'user' ? '👤 **User**' : '✨ **Gemini Live**';
    md += `### ${sender} _(${m.timestamp})_\n\n${m.content}\n\n---\n\n`;
  });

  return md;
}

export function exportSessionAsJSON(session: CopilotChatSession): string {
  return JSON.stringify(session, null, 2);
}

export function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Optional cloud sync to Firestore if user is authenticated
 */
export async function syncSessionToFirestore(session: CopilotChatSession): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  try {
    const docRef = doc(db, 'copilot_sessions', `${currentUser.uid}_${session.id}`);
    await setDoc(
      docRef,
      {
        id: session.id,
        userId: currentUser.uid,
        userEmail: currentUser.email || '',
        title: session.title,
        messages: session.messages,
        activeFileName: session.activeFileName || null,
        modelUsed: session.modelUsed || null,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
      { merge: true }
    );
  } catch (err) {
    // Non-fatal, local-first fallback
    console.debug('Cloud sync notice:', err);
  }
}
