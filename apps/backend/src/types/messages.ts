export type VisualFrameMessage = {
  type: 'frame';
  payload: {
    base64: string;
    source: 'screen' | 'camera';
    quick?: boolean;
  };
};

export type AudioMessage = {
  type: 'audio';
  payload: unknown;
};

export type InterruptMessage = {
  type: 'interrupt';
};

export type ResumeVisualMessage = {
  type: 'resume-visual';
};

export type ClientMessage = VisualFrameMessage | AudioMessage | InterruptMessage | ResumeVisualMessage;
