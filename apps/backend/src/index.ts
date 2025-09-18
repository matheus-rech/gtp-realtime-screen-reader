import { createApp } from './server.js';
import { logger } from './logger.js';

const bootstrap = async () => {
  const { start } = createApp();
  try {
    await start();
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exitCode = 1;
  }
};

if (process.env.NODE_ENV !== 'test') {
  void bootstrap();
}

export { createApp };
