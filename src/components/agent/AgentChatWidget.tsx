'use client';

import { useCallback, useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { AgentChatPanel } from '@/components/agent/AgentChatPanel';

export function AgentChatWidget() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [locale, setLocale] = useState<'en' | 'hi'>('en');
  const [pipecatUrl, setPipecatUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/agent/config')
      .then((r) => r.json())
      .then((data: { enabled?: boolean; pipecatUrl?: string | null }) => {
        setEnabled(Boolean(data.enabled));
        setPipecatUrl(data.pipecatUrl ?? null);
      })
      .catch(() => setEnabled(false));
  }, []);

  const ensureSession = useCallback(async () => {
    if (sessionId) return sessionId;
    const res = await fetch('/api/agent/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: 'chat', locale }),
    });
    if (!res.ok) throw new Error('Failed to create session');
    const data = (await res.json()) as { sessionId: string; locale?: 'en' | 'hi' };
    setSessionId(data.sessionId);
    if (data.locale) setLocale(data.locale);
    return data.sessionId;
  }, [locale, sessionId]);

  const handleOpen = async () => {
    try {
      await ensureSession();
      setOpen(true);
    } catch {
      setOpen(false);
    }
  };

  const handleEndSession = () => {
    if (!sessionId) return;
    fetch('/api/agent/session-end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    }).catch(() => null);
  };

  if (!enabled) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => void handleOpen()}
        className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+200px)] right-4 z-[925] flex h-14 w-14 items-center justify-center rounded-full bg-[#8b1a1a] text-white shadow-lg transition hover:scale-105 hover:bg-[#6b1111]"
        aria-label="Ask Ratna"
        style={{ boxShadow: '0 12px 28px rgba(139, 26, 26, 0.35)' }}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {open && sessionId ? (
        <AgentChatPanel
          locale={locale}
          sessionId={sessionId}
          pipecatUrl={pipecatUrl}
          onClose={() => setOpen(false)}
          onEndSession={handleEndSession}
        />
      ) : null}
    </>
  );
}
