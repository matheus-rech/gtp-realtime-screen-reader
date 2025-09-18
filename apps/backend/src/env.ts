import 'dotenv/config';

export interface RuntimeEnv {
  openaiApiKey?: string;
  redisUrl?: string;
  port: number;
  frameRateLimit: number;
  maxSessions: number;
}

const parseIntOr = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env: RuntimeEnv = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  redisUrl: process.env.REDIS_URL,
  port: parseIntOr(process.env.PORT, 4000),
  frameRateLimit: parseIntOr(process.env.FRAME_RATE_LIMIT, 2),
  maxSessions: parseIntOr(process.env.MAX_SESSIONS, 100)
};

if (!env.openaiApiKey) {
  // Warn only; the application can still boot for local UI testing.
  console.warn('Warning: OPENAI_API_KEY is not set. Ephemeral session creation will fail.');
}
