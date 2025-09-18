declare module '@openai/agents' {
  type EventHandler = (payload: any) => void;

  export class RealtimeClient {
    constructor(options: Record<string, any>);
    connect(): Promise<void>;
    close(): void;
    on(event: string, handler: EventHandler): void;
    off(event: string, handler: EventHandler): void;
    send(payload: any): Promise<void>;
    createPeerConnection(): RTCPeerConnection;
  }
}
