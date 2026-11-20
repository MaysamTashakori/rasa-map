/**
 * Rasa Map — Telegram relay (zero dependencies, Node >= 18).
 *
 * Forwards exported poster files and notifications to a Telegram chat via
 * the Bot API. The bot token lives ONLY here (server-side env), never in the
 * web app.
 *
 * Env:
 *   TELEGRAM_BOT_TOKEN   — from @BotFather
 *   TELEGRAM_CHAT_ID     — target chat id (use @userinfobot to find yours)
 *   PORT                 — listen port (default 8787)
 *
 * Endpoints:
 *   POST /api/send     { fileName, mime, dataBase64, caption? } → sendDocument
 *   POST /api/notify   { text }                                → sendMessage
 *   GET  /health       → { ok: true }
 *
 * Run:  TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=... node server/telegram-bot.mjs
 * Deploy behind your domain/TLS (e.g. api.rasa-map.example.com) and set
 * VITE_TELEGRAM_ENDPOINT=https://that-host/api/send in the web app.
 */
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Minimal .env loader (no dependency): .env.local wins over .env.
const here = dirname(fileURLToPath(import.meta.url));
for (const name of [".env", ".env.local"]) {
  const p = join(here, "..", name);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const TOKEN = (process.env.TELEGRAM_BOT_TOKEN ?? "").trim();
const CHAT_ID = (process.env.TELEGRAM_CHAT_ID ?? "").trim();
const PORT = Number(process.env.PORT) || 8787;
const MAX_BODY = 30 * 1024 * 1024; // 30 MB
const MINI_APP_URL =
  (process.env.TELEGRAM_MINI_APP_URL ?? "").trim() ||
  "https://maysamtashakori.github.io/rasa-map/";
const POLL_ENABLED = process.env.TELEGRAM_POLL !== "0";

const API = `https://api.telegram.org/bot${TOKEN}`;

/** Resolve a chat id: env first, else the most recent chat that wrote to the bot. */
async function resolveChatId() {
  if (CHAT_ID) return CHAT_ID;
  const res = await fetch(`${API}/getUpdates?limit=20`);
  const data = await res.json().catch(() => ({}));
  const updates = Array.isArray(data.result) ? data.result : [];
  for (let i = updates.length - 1; i >= 0; i--) {
    const msg = updates[i]?.message ?? updates[i]?.my_chat_member;
    const id = msg?.chat?.id ?? msg?.from?.id;
    if (id != null) return String(id);
  }
  return "";
}

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(body);
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error("payload_too_large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function tgCall(method, fields) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null || v === "") continue;
    form.append(k, v);
  }
  const res = await fetch(`${API}/${method}`, { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok !== true) {
    throw new Error(data.description || `telegram_${res.status}`);
  }
  return data;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");

    if (req.method === "GET" && url.pathname === "/health") {
      return json(res, 200, {
        ok: Boolean(TOKEN),
        configured: Boolean(TOKEN),
        chatResolved: Boolean(CHAT_ID),
      });
    }

    if (req.method !== "POST") return json(res, 404, { ok: false });

    const raw = await readBody(req);
    const body = JSON.parse(raw || "{}");

    if (!TOKEN) {
      return json(res, 503, { ok: false, message: "bot_not_configured" });
    }

    const chatId = await resolveChatId();
    if (!chatId) {
      return json(res, 409, {
        ok: false,
        message: "no_chat_yet — send any message to the bot first",
      });
    }

    if (url.pathname === "/api/notify") {
      const text = String(body.text ?? "").slice(0, 4000);
      if (!text) return json(res, 400, { ok: false, message: "empty_text" });
      await tgCall("sendMessage", { chat_id: chatId, text });
      return json(res, 200, { ok: true });
    }

    if (url.pathname === "/api/send") {
      const fileName = String(body.fileName ?? "poster.png").slice(0, 200);
      const mime = String(body.mime ?? "image/png");
      const dataBase64 = String(body.dataBase64 ?? "");
      const caption = String(body.caption ?? "").slice(0, 1000);
      if (!dataBase64) return json(res, 400, { ok: false, message: "empty_file" });

      const bytes = Buffer.from(dataBase64, "base64");
      const blob = new Blob([bytes], { type: mime });
      await tgCall("sendDocument", {
        chat_id: chatId,
        document: new File([blob], fileName, { type: mime }),
        caption,
      });
      return json(res, 200, { ok: true });
    }

    return json(res, 404, { ok: false, message: "not_found" });
  } catch (err) {
    json(res, 500, { ok: false, message: String(err?.message ?? err) });
  }
});

const REPLIES = {
  start: [
    "سلام! 👋 من <b>رسا مپ</b> هستم — استودیوی ساخت پوستر و نقشهٔ هنری.",
    "",
    "هر جایی از دنیا را انتخاب کن، تم و رنگش را خودت بساز و خروجی چاپی با کیفیت بگیر — PNG، PDF، SVG، GIF و HTML متحرک.",
    "کاملاً رایگان و بدون ثبت‌نام. 🇮🇷",
  ].join("\n"),
  poster: [
    "🎨 <b>ساخت پوستر نقشه</b>",
    "",
    "۱. دکمهٔ زیر را بزن تا استودیو داخل همین چت باز شود",
    "۲. شهر یا محله‌ات را جست‌وجو کن",
    "۳. تم، رنگ و حاشیه را انتخاب کن",
    "۴. دانلود کن یا برایم بفرست تا برات بسازم",
  ].join("\n"),
  coffee: [
    "☕ <b>یک قهوه برای رسا مپ بخر</b>",
    "",
    "رسا مپ رایگان می‌ماند — حمایت تو نگهش می‌دارد.",
    "داخل مینی‌اپ بخش «قهوه» را باز کن و با درگاه زیبال پرداخت کن.",
  ].join("\n"),
  fallback: [
    "من ربات <b>رسا مپ</b> هستم 🗺️",
    "برای ساخت پوستر نقشه دکمهٔ زیر را بزن، یا /poster را بفرست.",
    "دستورات: /start /poster /coffee",
  ].join("\n"),
};

function replyKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "🎨 باز کردن رسا مپ", web_app: { url: MINI_APP_URL } }],
      [
        { text: "🖼️ پوستر", callback_data: "poster" },
        { text: "☕ قهوه", callback_data: "coffee" },
      ],
    ],
  };
}

function replyText(command) {
  if (command === "start" || command === "help") return REPLIES.start;
  if (command === "poster") return REPLIES.poster;
  if (command === "coffee") return REPLIES.coffee;
  return REPLIES.fallback;
}

/** Long-poll getUpdates and answer commands + callback buttons. */
async function pollLoop() {
  if (!TOKEN || !POLL_ENABLED) return;
  let offset = 0;
  for (;;) {
    try {
      const res = await fetch(
        `${API}/getUpdates?timeout=25&offset=${offset}`,
      );
      const data = await res.json().catch(() => ({}));
      const updates = Array.isArray(data.result) ? data.result : [];
      for (const u of updates) {
        offset = Math.max(offset, u.update_id + 1);
        const msg = u.message;
        const cb = u.callback_query;
        if (msg?.chat?.id != null) {
          const text = String(msg.text ?? "");
          const cmd = text.trim().split(/\s+/)[0].replace(/^\//, "").split("@")[0];
          await tgCall("sendMessage", {
            chat_id: msg.chat.id,
            text: replyText(cmd),
            parse_mode: "HTML",
            reply_markup: replyKeyboard(),
            disable_web_page_preview: true,
          }).catch(() => {});
        } else if (cb?.message?.chat?.id != null) {
          const cmd = cb.data === "poster" ? "poster" : cb.data === "coffee" ? "coffee" : "start";
          await tgCall("sendMessage", {
            chat_id: cb.message.chat.id,
            text: replyText(cmd),
            parse_mode: "HTML",
            reply_markup: replyKeyboard(),
            disable_web_page_preview: true,
          }).catch(() => {});
          await tgCall("answerCallbackQuery", {
            callback_query_id: cb.id,
          }).catch(() => {});
        }
      }
    } catch {
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

server.listen(PORT, () => {
  console.log(`Rasa Map telegram relay → http://localhost:${PORT}`);
  console.log(`  health:  GET  /health`);
  console.log(`  send:    POST /api/send`);
  console.log(`  notify:  POST /api/notify`);
  console.log(`  poll:    ${POLL_ENABLED ? "on (/start /poster /coffee)" : "off"}`);
  void pollLoop();
});
