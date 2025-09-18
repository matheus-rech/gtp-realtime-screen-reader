import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

process.env.OPENAI_API_KEY = 'test-key';

vi.mock('../lib/openai.js', () => ({
  openai: {
    realtime: {
      sessions: {
        create: vi.fn(async () => ({
          id: 'session-123',
          client_secret: {
            value: 'secret',
            expires_at: Date.now() + 60_000
          }
        }))
      }
    }
  }
}));

describe('server', () => {
  let createApp: typeof import('../server.js').createApp;

  beforeEach(async () => {
    ({ createApp } = await import('../server.js'));
  });

  it('creates ephemeral sessions', async () => {
    const { app, server } = createApp();
    const response = await request(app).post('/api/session').send({ mode: 'screen' });
    await new Promise((resolve) => server.close(resolve));
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('client_secret');
  });

  it('processes frames and broadcasts responses', async () => {
    const { app, server } = createApp();
    const pngPixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEoQH9sy9QvgAAAABJRU5ErkJggg==',
      'base64'
    );
    const response = await request(app)
      .post('/api/frames/analyze')
      .send({ frame: pngPixel.toString('base64'), source: 'screen', transcriptSnippet: 'hello' });
    await new Promise((resolve) => server.close(resolve));
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('description');
  });
});
