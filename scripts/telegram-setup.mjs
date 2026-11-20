/**
 * Rasa Map — Telegram bot setup: commands, welcome text, mini-app menu
 * button and a sticker pack. Uses TELEGRAM_BOT_TOKEN from env or .env.local.
 *
 *   node scripts/telegram-setup.mjs            # everything possible now
 *   node scripts/telegram-setup.mjs stickers   # sticker pack only (needs chat)
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
for (const name of [".env", ".env.local"]) {
  const p = join(here, "..", name);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const TOKEN = (process.env.TELEGRAM_BOT_TOKEN ?? "").trim();
if (!TOKEN) { console.error("TELEGRAM_BOT_TOKEN missing"); process.exit(1); }
const API = `https://api.telegram.org/bot${TOKEN}`;
const APP_URL = "https://maysamtashakori.github.io/rasa-map/";

async function call(method, fields = {}) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) if (v != null && v !== "") form.append(k, v);
  const res = await fetch(`${API}/${method}`, { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok !== true) throw new Error(`${method}: ${data.description ?? res.status}`);
  return data.result;
}

async function latestChatId() {
  const updates = await call("getUpdates", { limit: 20 });
  for (let i = updates.length - 1; i >= 0; i--) {
    const msg = updates[i]?.message;
    if (msg?.chat?.id != null) return { id: msg.chat.id, userId: msg.from?.id ?? msg.chat.id };
  }
  return null;
}

/* ── 1. bot personality: description + commands ── */
async function setupProfile() {
  await call("setMyName", { name: "رسا مپ | Rasa Map" });
  await call("setMyDescription", {
    description:
      "استودیوی خلاق نقشه — هر شهر را به پوستر هنری، کارت‌پستال، گیف و فایل چاپی تبدیل کن. فارسی‌محور، رایگان و متن‌باز.",
  });
  await call("setMyShortDescription", {
    short_description: "نقشه‌ات را به اثر هنری تبدیل کن — پوستر، گیف، چاپ",
  });
  await call("setMyCommands", {
    commands: JSON.stringify([
      { command: "start", description: "شروع و راهنمای رسا مپ" },
      { command: "poster", description: "ساخت پوستر نقشه" },
      { command: "coffee", description: "دعوت به قهوه ☕" },
    ]),
  });
  console.log("✔ profile, description, commands");
}

/* ── 2. mini app: chat menu button opens Rasa Map inside Telegram ── */
async function setupMiniApp() {
  await call("setChatMenuButton", {
    menu_button: JSON.stringify({
      type: "web_app",
      text: "رسا مپ",
      web_app: { url: APP_URL },
    }),
  });
  console.log("✔ mini app menu button →", APP_URL);
}

/* ── 3. sticker pack (needs the owner to have messaged the bot once) ── */
const STICKERS = [
  { file: "sticker-rs.webp", emoji: "🗺️", name: "RS monogram" },
  { file: "sticker-chinar.webp", emoji: "🌳", name: "Chinar leaf" },
  { file: "sticker-pin.webp", emoji: "📍", name: "Map pin" },
  { file: "sticker-coffee.webp", emoji: "☕", name: "Coffee" },
  { file: "sticker-heart-map.webp", emoji: "❤️", name: "Heart map" },
];

async function setupStickers() {
  const chat = await latestChatId();
  if (!chat) {
    console.log("✖ no chat yet — send any message to the bot first, then re-run.");
    return;
  }
  const setName = `rasa_map_by_Rasa_Studio_Bot`;
  try {
    await call("deleteStickerSet", { name: setName });
  } catch { /* first run */ }
  await call("createNewStickerSet", {
    user_id: chat.userId,
    name: setName,
    title: "رسا مپ | Rasa Map",
    stickers: JSON.stringify(
      STICKERS.map((s, i) => ({
        sticker: `https://maysamtashakori.github.io/rasa-map/stickers/${s.file}`,
        format: "static",
        emoji_list: [s.emoji],
      })),
    ),
    needs_repainting: false,
  });
  console.log("✔ sticker set created:", setName);
  console.log("  add it: https://t.me/addstickers/" + setName);
}

const only = process.argv[2];
if (!only || only === "profile") await setupProfile();
if (!only || only === "miniapp") await setupMiniApp();
if (!only || only === "stickers") await setupStickers();
