import { ProjectFile } from './ide';

export interface CollabParticipant {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
  activeFileId: string;
  cursorLine: number;
  cursorCol: number;
  selectionText?: string;
  lastActive: number;
}

export interface CollabSession {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  activeFileId: string;
  files: ProjectFile[];
  createdAt: number;
  updatedAt: number;
}

export interface CollabState {
  sessionId: string | null;
  session: CollabSession | null;
  participants: CollabParticipant[];
  currentParticipant: CollabParticipant | null;
  isHost: boolean;
  isConnected: boolean;
}
