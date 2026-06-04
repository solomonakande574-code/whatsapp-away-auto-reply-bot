# WhatsApp Away Reply Bot

This is a CookMyBots managed WhatsApp brain service.

CookMyBots handles WhatsApp connection, phone pairing, sessions, and message routing. This project does not implement WhatsApp Cloud API webhooks, Baileys sessions, QR login, or phone pairing.

The bot is an AI-first away auto-reply assistant. When CookMyBots routes a WhatsApp message to this service, the bot uses CookMyBots AI Gateway to generate a brief, friendly WhatsApp-native away reply with appropriate emojis.

## Owner knowledge

The raw owner prompt is preserved exactly as:

Create a bot that automatically responds to messages when not online,with emojis

This is the only source of truth for what the bot knows. The bot must not invent business details, products, prices, contacts, locations, delivery details, payment details, support policies, moderation rules, or community behavior.

If someone asks for details that the owner did not provide, the bot should politely say that the owner has not provided that detail yet.

## Public behavior

There are no slash commands, menus, or command maps.

Users simply send normal WhatsApp messages. The bot replies as an away responder when AUTO_REPLY_ENABLED is enabled.

Public behavior:

1) Responds naturally to WhatsApp DMs routed by CookMyBots.
2) Responds briefly in groups or communities when CookMyBots routes those messages.
3) Acknowledges the incoming message.
4) Explains that the owner is currently unavailable or not online.
5) Invites the sender to wait for a direct reply later.
6) Uses friendly emojis without overusing them.
7) Says clearly when the requested detail was not supplied by the owner.

## Endpoint

CookMyBots calls this endpoint:

POST /webhook/cookmybots/whatsapp

The request must include:

X-CookMyBots-Webhook-Secret: your configured CMB_WHATSAPP_WEBHOOK_SECRET

The endpoint returns:

{ "ok": true, "reply": "..." }

## Environment variables

PORT
The HTTP port. Defaults to 3000.

CMB_WHATSAPP_WEBHOOK_SECRET
Used to verify that inbound webhook calls came from CookMyBots. Configure this in the deployed service environment.

COOKMYBOTS_AI_ENDPOINT
CookMyBots AI Gateway base URL. It must be a base URL such as https://api.cookmybots.com/api/ai. The bot appends /chat itself.

COOKMYBOTS_AI_KEY
CookMyBots AI Gateway key. The bot sends it using Authorization: Bearer, but never logs the key.

AUTO_REPLY_ENABLED
Optional. Defaults to true when missing. Set to false, 0, off, no, or disabled to pause auto replies.

OWNER_DISPLAY_NAME
Optional. Defaults to the owner when missing. Used only to help AI phrase natural away replies.

AI_TIMEOUT_MS
Optional. Defaults to 600000 milliseconds.

AI_MAX_RETRIES
Optional. Defaults to 2 retries.

CONCURRENCY
Optional. Defaults to 20 global simultaneous AI jobs. The bot also uses a per-chat lock so one chat cannot stack multiple AI replies at once.

## Local setup

1) Install dependencies:

npm install

2) Copy the sample environment file:

cp .env.sample .env

3) Fill in CMB_WHATSAPP_WEBHOOK_SECRET and COOKMYBOTS_AI_KEY.

4) Start development mode:

npm run dev

## Local test

You can test without WhatsApp transport by using /test:

curl -X POST http://localhost:3000/test \
  -H "Content-Type: application/json" \
  -d '{"text":"Hi, are you there?"}'

## Deployment

Deploy as one Node.js service on Render or a similar host.

Use:

Build command: npm run build
Start command: npm start

Do not create a worker process or queue process. This project runs as a single Node.js process.

## Logging

The bot logs startup, environment sanity booleans, managed webhook handling, AI gateway start, AI gateway success, AI gateway failure, and occasional memory usage.

Secrets are never logged.

## Database

No database is required for this version. The bot keeps only a small bounded in-memory conversation context per chat to help AI respond naturally during the current process lifetime.
