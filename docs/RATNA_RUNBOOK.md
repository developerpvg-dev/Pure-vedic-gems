# Ratna 1A Operations Runbook

## Enable agent

1. Run `supabase/week32_agent.sql` on production Supabase
2. Set Vercel env: `AGENT_ENABLED=true`, `OPENAI_API_KEY`, etc.
3. Seed knowledge: `POST /api/agent/knowledge/seed` with `Authorization: Bearer $CRON_SECRET`
4. Deploy `ratna-voice` on Railway; set `PIPECAT_SERVICE_URL`
5. Configure Meta WhatsApp webhook → `/api/agent/whatsapp`
6. Configure Twilio voice → `https://<voice-service>/twilio/voice`

## Monthly ops

- Top up OpenAI, Deepgram, Twilio credits
- Review WhatsApp template status in Meta Business Manager
- Re-embed knowledge when catalog FAQs change: call seed endpoint or run ingestion script
- Monitor `/admin/agent-sessions` for failed handoffs

## Incident response

| Symptom | Check |
|---------|-------|
| Chat widget missing | `AGENT_ENABLED=true` on Vercel |
| 503 busy | OpenAI quota; circuit breaker resets in 60s |
| WA no reply | `WHATSAPP_ACCESS_TOKEN`, webhook verify token |
| Voice dead | Railway health `/health`, `PIPECAT_SERVICE_URL` |
| Hot leads not in Chatwoot | `CHATWOOT_*` env vars |

## Data / privacy

- PII stored in `agent_sessions.context`, `enquiries`, `agent_messages`
- Delete on request: remove session rows + linked enquiry by `session_id`
- Do not log raw phone/DOB in application logs

## Load expectations

- Rate limits: 30 chat/min/IP, 20 WA/min/phone
- ponytail: in-process rate limiter — upgrade to Redis if multi-region Vercel
