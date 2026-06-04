# WhatsApp Away Reply Bot

This is a CookMyBots managed WhatsApp brain service for AI-first away auto-replies.

CookMyBots handles WhatsApp connection, phone pairing, sessions, and message delivery. This project is only the bot brain. It does not implement WhatsApp Cloud API webhooks, Baileys sessions, QR login, or phone pairing, and it does not require WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, or WHATSAPP_VERIFY_TOKEN.

## What the bot does

The bot receives normalized WhatsApp messages from CookMyBots at:

POST /webhook/cookmybots/whatsapp

It verifies X-CookMyBots-Webhook-Secret, uses CookMyBots AI Gateway to draft a short away reply, stores recent conversation and cooldown state in MongoDB when available, and returns:

{ "ok": true, "reply": "..." }

The AI is the primary role detector, intent router, and final responder. There are no Telegram-style slash commands, menus, command maps, hard-coded categories, sales flows, support flows, moderation flows, products, prices, contacts, locations, policies, rules, or announcements.

## Owner knowledge

OWNER_KNOWLEDGE is loaded from the environment and preserved exactly as provided by the owner.

It is the only source of truth. If OWNER_KNOWLEDGE is empty, or if a user asks for a detail missing from it, the bot must say the owner has not provided that detail yet instead of inventing an answer.

## Public WhatsApp behavior

Users send ordinary WhatsApp messages in DMs, groups, or communities routed by CookMyBots.

The bot can naturally handle messages such as:

1) Asking whether the owner is available.
2) Asking why the owner is away.
3) Asking when the owner might reply.
4) Asking what the owner, business, group, or community is about.
5) Leaving a message for the owner.
6) Asking for details from OWNER_KNOWLEDGE.

The bot keeps group replies shorter and avoids repeated spammy replies by using a per-chat cooldown.

## Environment variables

PORT
HTTP port. Defaults to 3000.

CMB_WHATSAPP_WEBHOOK_SECRET
Required. Verifies inbound managed WhatsApp webhook calls from CookMyBots.

COOKMYBOTS_AI_ENDPOINT
Required for AI replies. CookMyBots AI Gateway base URL. Use a base URL such as https://api.cookmybots.com/api/ai. The bot appends /chat itself.

COOKMYBOTS_AI_KEY
Required for AI replies. Sent as Authorization: Bearer to CookMyBots AI Gateway. Never logged.

OWNER_KNOWLEDGE
Required owner prompt/knowledge. The code passes this raw value into AI context without rewriting it.

MONGODB_URI
Required for durable conversation memory, session state, cooldown tracking, and message idempotency. If MongoDB is unavailable, the bot logs the failure and continues with limited in-memory state.

AUTO_REPLY_COOLDOWN_SECONDS
Optional. Defaults to 3600 when missing or invalid. Reduces duplicate away replies in active chats while still allowing meaningful follow-up replies.

AUTO_REPLY_ENABLED
Optional. Defaults to true. Set false, 0, off, no, or disabled to pause auto replies.

AI_TIMEOUT_MS
Optional. Defaults to 600000 milliseconds.

AI_MAX_RETRIES
Optional. Defaults to 2.

CONCURRENCY
Optional. Defaults to 20 global simultaneous AI jobs. The bot also has a per-chat in-flight lock.

## Database

MongoDB collections used by this bot:

1) convo_history stores recent user and assistant turns.
2) auto_reply_cooldowns stores last inbound and last auto-reply timestamps per chat/user.
3) message_logs stores processed message IDs for idempotency.

Indexes are created only on application fields. The bot never creates an _id index manually.

MongoDB update safety is followed: createdAt is insert-only, updatedAt is mutable, and updates never overwrite createdAt.

## Local setup

1) Install dependencies:

npm install

2) Copy environment sample:

cp .env.sample .env

3) Fill in CMB_WHATSAPP_WEBHOOK_SECRET, COOKMYBOTS_AI_ENDPOINT, COOKMYBOTS_AI_KEY, OWNER_KNOWLEDGE, and MONGODB_URI.

4) Run locally:

npm run dev

## Local test endpoint

The /test endpoint is only for local HTTP testing. It is not a WhatsApp user command.

curl -X POST http://localhost:3000/test \
  -H "Content-Type: application/json" \
  -d '{"text":"Hi, are you there?"}'

## Deployment

Deploy as a single Node.js service.

Build command:
npm run build

Start command:
npm start

Do not run a separate worker or queue process.

## Logging

The bot logs startup, env sanity booleans, managed WhatsApp receive/respond activity, AI call start/success/failure, DB failures, cooldown skips, backpressure, and lightweight memory usage.

Secrets, tokens, API keys, authorization headers, and full private owner knowledge are never logged.
