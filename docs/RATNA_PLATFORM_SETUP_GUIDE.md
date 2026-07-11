# Ratna 1A — Platform Setup Guide

Follow these steps in order to take Ratna (bilingual AI gem consultant) fully live:
website chat, browser voice, phone (USA + Australia + UAE), and WhatsApp.

Legend:
- **[You]** = developer / your team
- **[Client]** = PureVedicGems
- Each platform lists: what it does, cost, steps, and which env var it fills.

> After every platform, copy the keys into BOTH `purevedicgems/.env.local` (local)
> and the **Vercel** dashboard (Production + Preview).

---

## 0. Prerequisites

- [ ] Node.js 20+, npm installed
- [ ] Access to the Supabase project (existing)
- [ ] Access to the Vercel project (existing)
- [ ] Access to `purevedicgems.com` DNS (client or you)
- [ ] A credit card for API providers (or client billing)

---

## 1. Supabase (database) — required

**What:** Stores agent sessions, messages, knowledge base, follow-ups.
**Cost:** Free tier is fine to start; already in use.

**Steps [You]:**
1. Open Supabase → your project → **SQL Editor**.
2. Paste the full contents of [`supabase/week32_agent.sql`](../supabase/week32_agent.sql) and **Run**.
3. Confirm these tables exist under **Table Editor**:
   - `agent_sessions`, `agent_messages`, `agent_knowledge`, `agent_followups`, `agent_webhook_events`
4. Confirm the `vector` extension is enabled (Database → Extensions → search "vector").

**Env vars (already set in project):**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 2. OpenAI (AI brain) — required

**What:** Powers chat replies, tool use, and knowledge embeddings.
**Cost:** Pay-as-you-go. Set a monthly cap (₹5,000 recommended for staging).

**Steps [You / Client billing]:**
1. Go to https://platform.openai.com → sign up / log in.
2. **Settings → Billing** → add a payment method.
3. **Settings → Limits** → set a monthly usage cap.
4. **API keys** → **Create new secret key** → copy it.

**Env var:**
```
OPENAI_API_KEY=sk-...
```

---

## 3. Enable the chat (first working milestone)

Once Supabase + OpenAI are set, you can see website chat working:

**Steps [You]:**
1. In `.env.local` set:
   ```
   AGENT_ENABLED=true
   OPENAI_API_KEY=sk-...
   AGENT_SESSION_SECRET=<random 32+ char string>
   ```
2. Run `npm run dev`.
3. Open the site → an **"Ask Ratna"** button appears bottom-right.
4. Send a message in English and Hindi to confirm replies + product cards.
5. Seed the knowledge base:
   ```bash
   curl -X POST http://localhost:3000/api/agent/knowledge/seed \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

> `AGENT_ENABLED=false` keeps the widget hidden. Set to `true` only when ready.

---

## 4. Twilio (phone calls — USA + Australia + UAE) — required for phone

**What:** Virtual phone numbers customers call to reach Ratna by voice.
**Cost:** ~$1–2 / number / month + ~$0.01–0.05 / minute.

**Steps [You]:**
1. Go to https://www.twilio.com → sign up → verify email + phone.
2. Add billing (client card or reimbursed).
3. **Phone Numbers → Buy a number**:
   - Filter country = **United States**, capability = **Voice** → buy. (needs a US address)
   - Filter country = **Australia**, capability = **Voice** → buy. (needs an AU address)
   - **UAE:** number availability is restricted; if unavailable, keep the client's
     existing UAE number on the site and skip a Twilio UAE number.
4. **Account → API keys / tokens** → copy Account SID + Auth Token.
5. For **each** number → **Configure → Voice → A call comes in**:
   - Set to **Webhook**, `HTTP POST`
   - URL: `https://<your-railway-voice-url>/twilio/voice` (from step 6)
   - All numbers point to the **same** URL — they all reach the same Ratna.

**Client needs to provide (they offered):**
- [ ] US business address
- [ ] Australia business address
- [ ] UAE address (when ready)

**Env vars:**
```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER_US=+1...
TWILIO_PHONE_NUMBER_AU=+61...
TWILIO_PHONE_NUMBER_UAE=+971...      # only if purchased
NEXT_PUBLIC_RATNA_CALL_NUMBERS=US:+1..., AU:+61..., UAE:+971...
```

> `NEXT_PUBLIC_RATNA_CALL_NUMBERS` is what the website shows as "Call Ratna".
> The UAE entry can be the client's existing number even without a Twilio UAE line.

---

## 5. Railway (voice service + Chatwoot) — required for voice + handoff

**What:** Hosts the Python voice bridge (`ratna-voice`) and the Chatwoot handoff app.
**Cost:** ~$5–20 / month depending on usage.

### 5a. Voice service (`ratna-voice`)
**Steps [You]:**
1. Go to https://railway.app → new project.
2. **Deploy from repo** (or upload) the [`ratna-voice/`](../../ratna-voice/) folder — it has a Dockerfile.
3. Set service env vars:
   ```
   RATNA_AGENT_API_URL=https://www.purevedicgems.com
   OPENAI_API_KEY=
   DEEPGRAM_API_KEY=
   CARTESIA_API_KEY=
   BHARATVOICE_API_KEY=
   PUBLIC_HOST=voice.ratna.purevedicgems.com
   PORT=8765
   ```
4. Copy the public Railway URL.
5. Set on Vercel: `PIPECAT_SERVICE_URL=https://<railway-voice-url>`
6. Health check: open `https://<railway-voice-url>/health` → should return `{"ok": true}`.
7. Point all Twilio numbers' voice webhook to `https://<railway-voice-url>/twilio/voice`.

### 5b. Chatwoot (sales handoff)
**Steps [You]:**
1. Railway → **New → Template → Chatwoot** (or Chatwoot Docker image + Postgres plugin).
2. After it boots, open the Chatwoot URL → create admin account.
3. **Inboxes → Add inbox → API** → name it "Ratna" → copy the **Inbox ID**.
4. **Profile → Access Token** → copy the API token.
5. Add sales agents (client provides names + emails).

**Env vars:**
```
CHATWOOT_BASE_URL=https://<railway-chatwoot-url>
CHATWOOT_API_TOKEN=
CHATWOOT_INBOX_ID=
```

---

## 6. Deepgram + Cartesia (English voice quality) — required for voice

**What:** Deepgram = English speech-to-text; Cartesia = English text-to-speech.
**Cost:** Pay-as-you-go, low.

**Steps [You]:**
1. https://deepgram.com → sign up → **API keys** → create → copy.
2. https://cartesia.ai → sign up → **API keys** → create → copy.

**Env vars:**
```
DEEPGRAM_API_KEY=
CARTESIA_API_KEY=
```

---

## 7. BharatVoiceAI (Hindi voice) — required for Hindi voice

**What:** Hindi speech-to-text and text-to-speech.
**Cost:** Per provider pricing.

**Steps [You]:**
1. Sign up / request access: https://github.com/DuttaSam/bharatvoiceai
2. Get API key + base URL.
3. Test 3 Hindi phrases before wiring into voice.

**Env vars:**
```
BHARATVOICE_API_KEY=
BHARATVOICE_API_BASE_URL=https://api.bharatvoice.ai
```

---

## 8. Meta WhatsApp Cloud API — required for WhatsApp

**What:** Inbound WhatsApp chat + outbound follow-up messages.
**Cost:** Free tier of conversations, then per-conversation pricing by Meta.

**Client MUST do first:**
- [ ] Add your developer email as **Admin** in **Meta Business Manager**.
- [ ] Provide a **dedicated WhatsApp business number** (not on personal WhatsApp).

**Steps [You]:**
1. https://business.facebook.com → Business Settings.
2. **Accounts → WhatsApp Accounts** → create/select a WABA.
3. https://developers.facebook.com → **Create App** → Business → add **WhatsApp** product.
4. **WhatsApp → API Setup**:
   - Add the phone number → verify via OTP.
   - Copy **Phone number ID** and **WhatsApp Business Account ID**.
5. Create a **permanent access token** (System User in Business Settings → assign WhatsApp app → generate token).
6. **App → Settings → Basic** → copy **App Secret**.
7. **WhatsApp → Configuration → Webhook**:
   - Callback URL: `https://www.purevedicgems.com/api/agent/whatsapp`
   - Verify token: pick a random string, put the **same** value in env.
   - Subscribe to: `messages`.
8. Submit **3 message templates** (client approves wording; Meta approval 24–72h):
   - Follow-up intro, product summary, handoff notice.

**Env vars:**
```
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<same random string as in Meta>
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_APP_SECRET=
```

---

## 9. Sales handoff alerts

**What:** When a lead scores >= 70, Ratna opens a Chatwoot ticket and pings sales.

**Env vars:**
```
RATNA_HANDOFF_PHONE=<sales WhatsApp number, e.g. 9198...>
RATNA_LEAD_SCORE_THRESHOLD=70
```

Client provides the sales phone(s) and hot-lead definition.

---

## 10. DNS (optional but recommended)

Add CNAME records in the domain registrar for `purevedicgems.com`:
```
voice.ratna   -> <railway-voice-url>
inbox.ratna   -> <railway-chatwoot-url>
```

---

## 11. Final go-live checklist

- [ ] `week32_agent.sql` run on **production** Supabase
- [ ] All env vars set on **Vercel** (Production + Preview)
- [ ] `AGENT_ENABLED=true` on production
- [ ] Knowledge base seeded (production URL)
- [ ] `ratna-voice` deployed, `/health` OK, `PIPECAT_SERVICE_URL` set
- [ ] Chatwoot deployed, inbox + agents added
- [ ] Meta webhook verified, templates approved
- [ ] Twilio US + AU numbers buy + webhook set
- [ ] `NEXT_PUBLIC_RATNA_CALL_NUMBERS` shows correct numbers on site
- [ ] Test matrix passed: chat / WhatsApp / voice / phone × English × Hindi
- [ ] Hot-lead test → Chatwoot ticket + sales alert received
- [ ] `npm run test:agent` and `npm run agent:eval` pass

---

## 12. Environment variables — full reference

Copy this block into `.env.local` and Vercel, fill each value:

```
# Core
AGENT_ENABLED=true
OPENAI_API_KEY=
AGENT_SESSION_SECRET=
RATNA_LEAD_SCORE_THRESHOLD=70

# WhatsApp (Meta)
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_APP_SECRET=

# Phone (Twilio) — USA + Australia + UAE
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER_US=
TWILIO_PHONE_NUMBER_AU=
TWILIO_PHONE_NUMBER_UAE=
NEXT_PUBLIC_RATNA_CALL_NUMBERS=

# Voice service (Railway)
PIPECAT_SERVICE_URL=
DEEPGRAM_API_KEY=
CARTESIA_API_KEY=
BHARATVOICE_API_KEY=
BHARATVOICE_API_BASE_URL=https://api.bharatvoice.ai

# Sales handoff (Chatwoot)
CHATWOOT_BASE_URL=
CHATWOOT_API_TOKEN=
CHATWOOT_INBOX_ID=
RATNA_HANDOFF_PHONE=
```

---

## Order of operations (fastest path)

```
1. Supabase SQL           -> chat can store data
2. OpenAI key + enable    -> website chat works (demo-able)
3. Meta WhatsApp          -> WhatsApp channel
4. Railway voice + Deepgram/Cartesia/BharatVoice -> voice + Hindi
5. Twilio US + AU         -> phone calls
6. Chatwoot               -> sales handoff
7. Go-live checklist      -> production
```
