'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Loader2, Mic, MicOff, Send, X } from 'lucide-react';
import { ProductCardMessage } from '@/components/agent/ProductCardMessage';
import type { AgentProductCard } from '@/lib/agent/types';

const CONSENT_KEY = 'ratna_consent_v1';

const UI_STRINGS = {
  en: {
    title: 'Ask Ratna',
    subtitle: 'AI gem consultant',
    placeholder: 'Ask about gems, rashis, or products…',
    consent:
      'Ratna is an AI assistant. We may store your messages to improve recommendations. By continuing you agree to our privacy policy.',
    consentBtn: 'I agree, continue',
    disclaimer: 'AI guidance — not a substitute for a paid astrologer consultation.',
    close: 'Close chat',
    voice: 'Talk to Ratna',
    voiceStop: 'Stop voice',
    busy: 'Ratna is briefly busy. Try again or use WhatsApp.',
  },
  hi: {
    title: 'Ratna से पूछें',
    subtitle: 'AI रत्न सलाहकार',
    placeholder: 'रत्न, राशि या उत्पाद के बारे में पूछें…',
    consent:
      'Ratna एक AI सहायक है। सुझावों के लिए हम आपके संदेश संग्रहीत कर सकते हैं। जारी रखकर आप हमारी गोपनीयता नीति से सहमत हैं।',
    consentBtn: 'मैं सहमत हूँ',
    disclaimer: 'AI मार्गदर्शन — सशुल्क ज्योतिषी परामर्श का विकल्प नहीं।',
    close: 'चैट बंद करें',
    voice: 'Ratna से बात करें',
    voiceStop: 'आवाज़ बंद करें',
    busy: 'Ratna व्यस्त है। पुनः प्रयास करें या WhatsApp करें।',
  },
} as const;

function extractProductsFromParts(parts: unknown): AgentProductCard[] {
  if (!Array.isArray(parts)) return [];
  const products: AgentProductCard[] = [];

  for (const part of parts) {
    if (
      typeof part === 'object' &&
      part !== null &&
      'type' in part &&
      (part as { type: string }).type === 'tool-invocation' &&
      'toolInvocation' in part
    ) {
      const inv = (part as { toolInvocation: { toolName?: string; result?: { products?: AgentProductCard[]; product?: AgentProductCard } } })
        .toolInvocation;
      if (inv.toolName === 'searchProducts' && inv.result?.products) {
        products.push(...inv.result.products);
      }
      if (inv.toolName === 'getProduct' && inv.result?.product) {
        products.push(inv.result.product);
      }
    }
  }
  return products;
}

type AgentChatPanelProps = {
  locale: 'en' | 'hi';
  sessionId: string;
  onClose: () => void;
  onEndSession: () => void;
  pipecatUrl?: string | null;
};

export function AgentChatPanel({ locale, sessionId, onClose, onEndSession, pipecatUrl }: AgentChatPanelProps) {
  const strings = UI_STRINGS[locale];
  const [consented, setConsented] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const transport = useRef(
    new DefaultChatTransport({
      api: '/api/agent/chat',
      body: { sessionId },
    })
  ).current;

  const { messages, sendMessage, status, error } = useChat({
    id: sessionId,
    transport,
  });

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === '1') setConsented(true);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const handleConsent = () => {
    localStorage.setItem(CONSENT_KEY, '1');
    setConsented(true);
    fetch('/api/agent/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    }).catch(() => null);
  };

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || !consented) return;
      await sendMessage({ text });
    },
    [consented, sendMessage]
  );

  const toggleVoice = useCallback(() => {
    if (!pipecatUrl) return;
    if (voiceActive) {
      wsRef.current?.close();
      wsRef.current = null;
      setVoiceActive(false);
      return;
    }

    const wsUrl = pipecatUrl.replace(/^http/, 'ws') + `/ws?sessionId=${sessionId}&locale=${locale}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onopen = () => setVoiceActive(true);
    ws.onclose = () => setVoiceActive(false);
    ws.onerror = () => setVoiceActive(false);
  }, [locale, pipecatUrl, sessionId, voiceActive]);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const [input, setInput] = useState('');

  return (
    <div
      className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+140px)] right-4 z-[930] flex h-[min(520px,calc(100vh-160px))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[#e8dcc8] bg-[#fdfaf5] shadow-2xl"
      role="dialog"
      aria-label={strings.title}
    >
      <header className="flex items-center justify-between border-b border-[#e8dcc8] bg-[#8b1a1a] px-4 py-3 text-white">
        <div>
          <h2 className="text-sm font-bold">{strings.title}</h2>
          <p className="text-[11px] opacity-80">{strings.subtitle}</p>
        </div>
        <div className="flex items-center gap-1">
          {pipecatUrl ? (
            <button
              type="button"
              onClick={toggleVoice}
              className="rounded-lg p-2 hover:bg-white/10"
              aria-label={voiceActive ? strings.voiceStop : strings.voice}
            >
              {voiceActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              onEndSession();
              onClose();
            }}
            className="rounded-lg p-2 hover:bg-white/10"
            aria-label={strings.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {!consented ? (
        <div className="flex flex-1 flex-col justify-center gap-4 p-4 text-sm text-[#3d2b1f]">
          <p>{strings.consent}</p>
          <button
            type="button"
            onClick={handleConsent}
            className="rounded-lg bg-[#8b1a1a] px-4 py-2 text-sm font-semibold text-white"
          >
            {strings.consentBtn}
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4" aria-live="polite">
            {messages.map((message) => {
              const text = message.parts
                ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
                .map((p) => p.text)
                .join('');
              const products = extractProductsFromParts(message.parts);
              const isUser = message.role === 'user';
              return (
                <div key={message.id} className={`mb-3 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      isUser ? 'bg-[#8b1a1a] text-white' : 'bg-white text-[#3d2b1f] shadow-sm'
                    }`}
                  >
                    {text}
                    {!isUser ? <ProductCardMessage products={products} /> : null}
                  </div>
                </div>
              );
            })}
            {status === 'streaming' ? (
              <div className="flex items-center gap-2 text-xs text-[#8b7355]">
                <Loader2 className="h-3 w-3 animate-spin" />
                …
              </div>
            ) : null}
            {error ? <p className="text-xs text-red-600">{strings.busy}</p> : null}
            <div ref={bottomRef} />
          </div>

          <form
            className="border-t border-[#e8dcc8] p-3"
            onSubmit={(e) => {
              e.preventDefault();
              const text = input.trim();
              if (!text) return;
              setInput('');
              void handleSend(text);
            }}
          >
            <p className="mb-2 text-[10px] text-[#8b7355]">{strings.disclaimer}</p>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={strings.placeholder}
                className="flex-1 rounded-lg border border-[#e8dcc8] bg-white px-3 py-2 text-sm outline-none focus:border-[#8b1a1a]"
                disabled={status === 'streaming'}
              />
              <button
                type="submit"
                disabled={status === 'streaming' || !input.trim()}
                className="rounded-lg bg-[#8b1a1a] p-2 text-white disabled:opacity-50"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
