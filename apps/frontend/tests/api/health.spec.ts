import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  it('returns a successful health status payload', async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload).toEqual({ status: 'ok' });

    expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0');
  });
});
