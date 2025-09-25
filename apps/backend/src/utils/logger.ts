export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const log = (level: LogLevel, message: string, meta?: Record<string, unknown>): void => {
  const time = new Date().toISOString();
  const payload = meta ? ` ${JSON.stringify(meta)}` : '';
  console[level](`[${time}] [${level.toUpperCase()}] ${message}${payload}`);
};

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta)
};
