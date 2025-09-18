import { setTimeout as delay } from 'node:timers/promises';
import { env } from '../utils/env.js';
import { logger } from '../utils/logger.js';

export type EphemeralKeyResponse = {
  client_secret: {
    value: string;
    expires_at: number;
  };
  id: string;
};

const MAX_RETRIES = 3;

export class RealtimeSessionManager {
  async createEphemeralKey(): Promise<EphemeralKeyResponse> {
    if (!env.openAiApiKey) {
      throw new Error('OPENAI_API_KEY is required to mint ephemeral keys');
    }

    for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
      try {
        const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.openAiApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: env.openAiRealtimeModel,
            voice: 'marin',
            instructions: 'You are a multimodal assistant with persistent visual memory.'
          })
        });

        if (!response.ok) {
          const payload = await response.text();
          throw new Error(`Failed to create ephemeral key: ${response.status} ${payload}`);
        }

        return (await response.json()) as EphemeralKeyResponse;

      } catch (error) {
        logger.error('Error creating ephemeral key', { error, attempt });
        if (attempt === MAX_RETRIES - 1) {
          throw error;
        }
        await delay(250 * (attempt + 1));
      }
    }

    throw new Error('Unable to create ephemeral key');
  }
}
