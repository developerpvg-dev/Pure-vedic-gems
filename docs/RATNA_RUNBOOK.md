# Ratna 1A Operations Runbook

## Enable agent

1. Run `supabase/week32_agent.sql` on production Supabase (needs `week42_leads_crm.sql` already applied)
2. Set Worker env: `AGENT_ENABLED=true`, `NEXT_PUBLIC_AGENT_ENABLED=true`, `OPENAI_API_KEY`, `CRON_SECRET`, optional `RATNA_MODEL`
3. Seed the 40 FAQs (EN + HI): `POST /api/agent/knowledge/seed` with `Authorization: Bearer $CRON_SECRET`. Safe to re-run after FAQ edits in `src/lib/agent/ratna-faqs.ts`
4. Invite the sales team (Admin → Settings → Team, role "Sales"): they get Ratna lead alerts and see leads in `/admin/leads`
5. WhatsApp is off for now: don't configure the Meta webhook. Voice/phone: see `RATNA_FINAL_BUILD_PLAN.md` Phase 3

## How Ratna leads reach the team

- Ratna asks for name + phone (after consent) and saves them with the `saveContact` tool → a lead appears in `/admin/leads` as "1. New", with Ratna's note and the full conversation in the message, and a follow-up date (hot today, warm tomorrow, cold +3 days).
- Hot leads (score ≥ `RATNA_LEAD_SCORE_THRESHOLD` or the customer asks for a person) alert the `sales` role in-app and by email (`SALES_NOTIFICATION_EMAIL` / admin email).
- When the chat ends (widget "end", or 30 min idle via the 5-minute cron) the note is rewritten from the whole conversation. Chats without a phone/email stay in `/admin/agent-sessions` only.
- The customer receives no automatic message (no email, no WhatsApp); the team follows up.

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
| Lead missing for a chat | Customer never shared phone/email (check `/admin/agent-sessions`); else Worker logs for `[ratna-lead-note]` / Supabase errors |
| Idle chats never closed | `CRON_SECRET` set, `AGENT_ENABLED=true` on the Worker |

## Data / privacy

- PII stored in `agent_sessions.context`, `enquiries`, `agent_messages`
- Delete on request: remove session rows + linked enquiry by `session_id`
- Do not log raw phone/DOB in application logs

## Load expectations

- Rate limits: 30 chat/min/IP, 20 WA/min/phone
- ponytail: in-process rate limiter — upgrade to Redis if multi-region Vercel
