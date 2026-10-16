import {
  db,
  auth,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  signInAnonymously,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { ProjectFile } from '../types/ide';
import { CollabSession, CollabParticipant } from '../types/collaboration';

const COLLAB_COLORS = [
  '#38bdf8', // Sky Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#a855f7', // Purple
];

export function getRandomCollabColor(): string {
  return COLLAB_COLORS[Math.floor(Math.random() * COLLAB_COLORS.length)];
}

export async function ensureCollabAuth(): Promise<string> {
  if (auth.currentUser) {
    return auth.currentUser.uid;
  }
  try {
    const cred = await signInAnonymously(auth);
    return cred.user.uid;
  } catch (error) {
    console.warn('Anonymous sign-in for collaboration fallback:', error);
    return 'user-' + Math.random().toString(36).substring(2, 9);
  }
}

/**
 * Creates a brand-new live collaboration room
 */
export async function createCollabSession(
  projectName: string,
  files: ProjectFile[],
  initialActiveFileId: string,
  userName?: string
): Promise<{ session: CollabSession; participant: CollabParticipant }> {
  const uid = await ensureCollabAuth();
  const sessionId = 'live-' + Math.random().toString(36).substring(2, 8);
  const now = Date.now();

  const participantName = userName || (auth.currentUser?.displayName || 'Host-' + uid.substring(0, 4));
  const participantColor = COLLAB_COLORS[0];

  const sessionData: CollabSession = {
    id: sessionId,
    name: projectName || 'Untitled Project',
    hostId: uid,
    hostName: participantName,
    activeFileId: initialActiveFileId,
    files: files.map(f => ({ ...f })),
    createdAt: now,
    updatedAt: now,
  };

  const participantData: CollabParticipant = {
    id: uid,
    name: participantName,
    color: participantColor,
    isHost: true,
    activeFileId: initialActiveFileId,
    cursorLine: 1,
    cursorCol: 1,
    selectionText: '',
    lastActive: now,
  };

  try {
    // Write session document
    await setDoc(doc(db, 'collab_sessions', sessionId), sessionData);

    // Write host participant document
    await setDoc(doc(db, 'collab_sessions', sessionId, 'participants', uid), participantData);

    return { session: sessionData, participant: participantData };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `collab_sessions/${sessionId}`);
    throw err;
  }
}

/**
 * Joins an existing collaboration session
 */
export async function joinCollabSession(
  sessionId: string,
  userName?: string
): Promise<{ session: CollabSession; participant: CollabParticipant }> {
  const uid = await ensureCollabAuth();
  const now = Date.now();

  try {
    const sessionDocRef = doc(db, 'collab_sessions', sessionId);
    const snap = await getDoc(sessionDocRef);

    if (!snap.exists()) {
      throw new Error(`Session '${sessionId}' was not found or has expired.`);
    }

    const sessionData = snap.data() as CollabSession;

    const isHost = sessionData.hostId === uid;
    const participantName = userName || (auth.currentUser?.displayName || (isHost ? 'Host' : 'Guest-' + uid.substring(0, 4)));
    const color = getRandomCollabColor();

    const participantData: CollabParticipant = {
      id: uid,
      name: participantName,
      color,
      isHost,
      activeFileId: sessionData.activeFileId || (sessionData.files[0]?.id || '1'),
      cursorLine: 1,
      cursorCol: 1,
      selectionText: '',
      lastActive: now,
    };

    // Register participant in subcollection
    await setDoc(doc(db, 'collab_sessions', sessionId, 'participants', uid), participantData);

    return { session: sessionData, participant: participantData };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `collab_sessions/${sessionId}`);
    throw err;
  }
}

/**
 * Subscribes to live session state changes (file edits, active file)
 */
export function subscribeToCollabSession(
  sessionId: string,
  onUpdate: (session: CollabSession) => void,
  onError?: (error: Error) => void
): () => void {
  const sessionDocRef = doc(db, 'collab_sessions', sessionId);

  return onSnapshot(
    sessionDocRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as CollabSession);
      }
    },
    (err) => {
      console.warn('Collab session snapshot error:', err);
      onError?.(err);
    }
  );
}

/**
 * Subscribes to live participants (cursors, selections, active files)
 */
export function subscribeToParticipants(
  sessionId: string,
  onUpdate: (participants: CollabParticipant[]) => void
): () => void {
  const participantsColRef = collection(db, 'collab_sessions', sessionId, 'participants');

  return onSnapshot(
    participantsColRef,
    (snap) => {
      const now = Date.now();
      const list: CollabParticipant[] = [];

      snap.forEach(docSnap => {
        const data = docSnap.data() as CollabParticipant;
        // Filter out stale peers inactive for more than 2 minutes
        if (now - (data.lastActive || 0) < 120000) {
          list.push(data);
        }
      });

      onUpdate(list);
    },
    (err) => {
      console.warn('Collab participants snapshot error:', err);
    }
  );
}

// Throttled cursor update helper
let cursorUpdateTimer: any = null;
let pendingCursorUpdate: Partial<CollabParticipant> | null = null;

export function broadcastCursorPosition(
  sessionId: string,
  participantId: string,
  update: { activeFileId: string; cursorLine: number; cursorCol: number; selectionText?: string }
) {
  pendingCursorUpdate = {
    ...update,
    lastActive: Date.now(),
  };

  if (!cursorUpdateTimer) {
    cursorUpdateTimer = setTimeout(async () => {
      cursorUpdateTimer = null;
      if (!pendingCursorUpdate) return;
      const dataToSave = { ...pendingCursorUpdate };
      pendingCursorUpdate = null;

      try {
        const participantDocRef = doc(db, 'collab_sessions', sessionId, 'participants', participantId);
        await setDoc(participantDocRef, dataToSave, { merge: true });
      } catch (err) {
        console.warn('Failed to broadcast cursor:', err);
      }
    }, 150); // 150ms debounce for smooth network performance
  }
}

// Debounced code broadcast helper
let codeUpdateTimer: any = null;

export function broadcastFileEdit(
  sessionId: string,
  files: ProjectFile[],
  editedFileId: string,
  newContent: string
) {
  if (codeUpdateTimer) clearTimeout(codeUpdateTimer);

  codeUpdateTimer = setTimeout(async () => {
    try {
      const updatedFiles = files.map(f =>
        f.id === editedFileId ? { ...f, content: newContent } : f
      );

      const sessionDocRef = doc(db, 'collab_sessions', sessionId);
      await setDoc(sessionDocRef, {
        files: updatedFiles,
        updatedAt: Date.now(),
      }, { merge: true });
    } catch (err) {
      console.warn('Failed to broadcast file edit:', err);
    }
  }, 200); // 200ms debounce
}

/**
 * Leave collaboration room and remove presence
 */
export async function leaveCollabSession(sessionId: string, participantId: string) {
  try {
    const participantDocRef = doc(db, 'collab_sessions', sessionId, 'participants', participantId);
    await deleteDoc(participantDocRef);
  } catch (err) {
    console.warn('Failed to leave collab session:', err);
  }
}
