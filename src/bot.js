import express from "express";
import crypto from "node:crypto";
import { cfg } from "./lib/config.js";
import { log, safeErr } from "./lib/log.js";
import { handleText } from "./brain.js";

function safeCompare(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));

  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function normalizeInbound(body = {}) {
  const from = String(body.from || body.chatId || "anon").trim();
  const chatId = String(body.chatId || body.from || from || "anon").trim();
  const senderId = String(body.senderId || body.participantJid || body.participant || body.from || from || "anon").trim();

  return {
    projectId: String(body.projectId || "").trim(),
    platform: "whatsapp",
    source: String(body.source || "cookmybots-managed").trim(),
    from,
    chatId,
    senderId,
    participantJid: String(body.participantJid || body.participant || "").trim(),
    userId: senderId || from || "anon",
    text: String(body.text || "").trim(),
    messageId: String(body.messageId || "").trim(),
    isGroup: Boolean(body.isGroup || String(chatId).endsWith("@g.us")),
    groupId: body.groupId ? String(body.groupId) : String(chatId).endsWith("@g.us") ? chatId : null,
    pushName: body.pushName ? String(body.pushName) : "",
    messageType: body.messageType ? String(body.messageType) : "text",
    timestamp: Number(body.timestamp || Date.now()),
    context: body.context || body.conversationContext || null,
    raw: body.raw || body,
  };
}

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "2mb" }));

  app.get("/", (_req, res) => {
    res.status(200).send("OK");
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({
      ok: true,
      platform: "whatsapp",
      managedTransport: true,
      webhookSecretSet: Boolean(cfg.CMB_WHATSAPP_WEBHOOK_SECRET),
      aiEndpointSet: Boolean(cfg.COOKMYBOTS_AI_ENDPOINT),
      aiKeySet: Boolean(cfg.COOKMYBOTS_AI_KEY),
      autoReplyEnabled: cfg.AUTO_REPLY_ENABLED,
    });
  });

  app.post("/webhook/cookmybots/whatsapp", async (req, res) => {
    const expected = String(cfg.CMB_WHATSAPP_WEBHOOK_SECRET || "").trim();
    const received = String(req.headers["x-cookmybots-webhook-secret"] || "").trim();

    try {
      log.info("whatsapp.webhook.start", {
        platform: "whatsapp",
        hasBody: Boolean(req.body),
        secretConfigured: Boolean(expected),
      });

      if (!expected) {
        log.error("whatsapp.webhook.secret_missing", {
          platform: "whatsapp",
        });

        return res.status(503).json({
          ok: false,
          error: "webhook_secret_not_configured",
          reply: "",
        });
      }

      if (!safeCompare(received, expected)) {
        log.warn("whatsapp.webhook.unauthorized", {
          platform: "whatsapp",
          secretProvided: Boolean(received),
        });

        return res.status(401).json({
          ok: false,
          error: "unauthorized",
          reply: "",
        });
      }

      const event = normalizeInbound(req.body || {});

      if (!event.text) {
        log.info("whatsapp.webhook.no_text", {
          platform: "whatsapp",
          messageType: event.messageType,
          isGroup: event.isGroup,
        });

        return res.json({
          ok: true,
          reply: "",
        });
      }

      const reply = await handleText(event);

      return res.json({
        ok: true,
        reply: String(reply || "").slice(0, 4000),
      });
    } catch (err) {
      log.error("whatsapp.webhook.failure", {
        platform: "whatsapp",
        error: safeErr(err),
      });

      return res.status(500).json({
        ok: false,
        error: "server_error",
        reply: "I received your message, but the away responder is having trouble right now. Please try again later 🙏",
      });
    }
  });

  app.post("/test", async (req, res) => {
    try {
      const event = normalizeInbound({
        ...req.body,
        from: "local@s.whatsapp.net",
        chatId: req.body?.chatId || "local@s.whatsapp.net",
        senderId: "local@s.whatsapp.net",
        source: "local-test",
      });

      const reply = await handleText(event);
      return res.json({ ok: true, reply });
    } catch (err) {
      log.error("local.test.failure", {
        platform: "whatsapp",
        error: safeErr(err),
      });

      return res.status(500).json({ ok: false, error: "server_error" });
    }
  });

  return app;
}
