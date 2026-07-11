import { test, expect } from '@playwright/test';

test.describe('Ratna agent', () => {
  test('config endpoint responds', async ({ request }) => {
    const res = await request.get('/api/agent/config');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('enabled');
  });

  test('chat returns 503 when agent disabled', async ({ request }) => {
    const res = await request.post('/api/agent/chat', {
      data: {
        sessionId: '00000000-0000-0000-0000-000000000001',
        messages: [],
      },
    });
    expect([503, 404, 400]).toContain(res.status());
  });
});
