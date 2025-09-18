export type AssistantMode = 'screen' | 'camera' | 'hybrid';

export type TranscriptMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
};

export type VisualContext = {
  description: string;
  capturedAt: number;
  source: 'screen' | 'camera';
};

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
