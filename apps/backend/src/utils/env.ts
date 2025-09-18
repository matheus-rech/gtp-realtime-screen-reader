import 'dotenv/config';

type EnvConfig = {
  port: number;
  openAiApiKey: string | undefined;
  openAiRealtimeModel: string;
  redisUrl: string | undefined;
  frameRateLimit: number;
  maxSessions: number;
  visualMaxResolution: number;
};

const parseNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return parsed;
};

export const env: EnvConfig = {
  port: parseNumber(process.env.PORT, 8080),
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiRealtimeModel: process.env.OPENAI_REALTIME_MODEL ?? 'gpt-4o-realtime-preview-2024-12-17',
  redisUrl: process.env.REDIS_URL,
  frameRateLimit: parseNumber(process.env.FRAME_RATE_LIMIT, 2),
  maxSessions: parseNumber(process.env.MAX_SESSIONS, 100),
  visualMaxResolution: parseNumber(process.env.VISUAL_MAX_RESOLUTION, 1024)
};
