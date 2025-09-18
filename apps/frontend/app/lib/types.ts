export type CaptureMode = 'screen' | 'camera' | 'hybrid';

export interface TranscriptEntry {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
}

export interface VisualContextItem {
  description: string;
  capturedAt: number;
  source: 'screen' | 'camera';
}

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error';
