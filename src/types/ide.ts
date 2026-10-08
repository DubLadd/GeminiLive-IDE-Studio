export interface ProjectFile {
  id: string;
  name: string;
  content: string;
  language: 'html' | 'css' | 'javascript' | 'json' | 'markdown' | 'typescript' | 'python' | 'plaintext' | 'shell';
}

export interface ConsoleLog {
  id: string;
  type: 'log' | 'warn' | 'error' | 'info';
  text: string;
  timestamp: string;
  count?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  proposedChanges?: Array<{
    fileName: string;
    content: string;
  }>;
}

export interface ProjectTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  files: ProjectFile[];
}

export type DeviceViewport = 'responsive' | 'desktop' | 'tablet' | 'mobile';

export interface CodeActionRequest {
  action: 'explain' | 'fix' | 'refactor' | 'review' | 'custom';
  code: string;
  language: string;
  filename: string;
  errorMessage?: string;
  extraContext?: string;
}
