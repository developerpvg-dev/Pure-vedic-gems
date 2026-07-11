'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, MessageSquare, Phone } from 'lucide-react';
import Link from 'next/link';
import { AdminPageHeader } from '@/components/admin/AdminPageShell';

type AgentSession = {
  id: string;
  visitor_id: string;
  channel: string;
  locale: string;
  status: string;
  lead_score: number;
  enquiry_id: string | null;
  created_at: string;
  closed_at: string | null;
  context: Record<string, unknown>;
};

type AgentMessage = {
  id: string;
  role: string;
  content: string;
  language: string | null;
  created_at: string;
};

export default function AgentSessionsPage() {
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/agent-sessions');
    const data = await res.json();
    setSessions(data.sessions ?? []);
    setLoading(false);
  }, []);

  const loadMessages = useCallback(async (sessionId: string) => {
    const res = await fetch(`/api/admin/agent-sessions?sessionId=${sessionId}`);
    const data = await res.json();
    setMessages(data.messages ?? []);
    setSelectedId(sessionId);
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  return (
    <div className="space-y-6 p-6">
      <AdminPageHeader title="Ratna AI Sessions" description="Chat, voice, and WhatsApp agent transcripts" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3 font-semibold text-gray-900">Sessions</div>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
            </div>
          ) : (
            <ul className="max-h-[520px] divide-y divide-gray-100 overflow-y-auto">
              {sessions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => void loadMessages(s.id)}
                    className={`w-full px-4 py-3 text-left text-sm hover:bg-amber-50 ${selectedId === s.id ? 'bg-amber-50' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-gray-900">{s.channel}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">Score {s.lead_score}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      {s.channel === 'whatsapp' ? <Phone className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                      {s.locale.toUpperCase()} · {s.status} · {new Date(s.created_at).toLocaleString()}
                    </div>
                  </button>
                </li>
              ))}
              {!sessions.length ? <li className="p-6 text-sm text-gray-500">No agent sessions yet.</li> : null}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3 font-semibold text-gray-900">Transcript</div>
          <div className="max-h-[520px] space-y-3 overflow-y-auto p-4">
            {messages.map((m) => (
              <div key={m.id} className={`rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-amber-50' : 'bg-gray-50'}`}>
                <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{m.role}</div>
                <p className="whitespace-pre-wrap text-gray-800">{m.content}</p>
              </div>
            ))}
            {!messages.length ? <p className="text-sm text-gray-500">Select a session to view messages.</p> : null}
          </div>
          {selectedId ? (
            <div className="border-t border-gray-100 p-3">
              <Link href={`/admin/leads`} className="text-sm font-medium text-amber-700 hover:underline">
                View leads inbox
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
