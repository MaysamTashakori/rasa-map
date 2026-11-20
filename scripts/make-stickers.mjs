/**
 * Generates Telegram sticker PNG/WebP assets (512×512) from inline SVG.
 * Run: node scripts/make-stickers.mjs  →  public/stickers/*.webp
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "stickers");
mkdirSync(out, { recursive: true });

const NAVY = "#0B1424", AMBER = "#D6AD55", AMBER2 = "#E6C983", VIOLET = "#7C5CFF",
  CYAN = "#5AD7FF", ROSE = "#FF5C8A", GREEN = "#45E499", INK = "#F2EFE6";

const svg = (inner, bg = "none") =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    ${bg !== "none" ? `<rect width="512" height="512" rx="110" fill="${bg}"/>` : ""}
    ${inner}</svg>`;

const designs = {
  "sticker-rs": svg(`
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${AMBER}"/><stop offset=".55" stop-color="${VIOLET}"/><stop offset="1" stop-color="${CYAN}"/>
    </linearGradient></defs>
    <rect x="56" y="56" width="400" height="400" rx="96" fill="url(#g)"/>
    <text x="256" y="330" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="200" font-weight="800" fill="#0B1424">RS</text>
    <circle cx="256" cy="120" r="10" fill="#0B1424" opacity=".35"/>`, NAVY),

  "sticker-chinar": svg(`
    <path d="M256 70 C 340 130, 400 210, 400 300 C 400 390, 335 440, 256 440 C 177 440, 112 390, 112 300 C 112 210, 172 130, 256 70 Z" fill="${GREEN}" opacity=".92"/>
    <path d="M256 110 L256 420 M256 200 L200 160 M256 200 L312 160 M256 290 L190 250 M256 290 L322 250 M256 370 L205 335 M256 370 L307 335" stroke="#04140B" stroke-width="14" stroke-linecap="round" fill="none"/>
    <rect x="196" y="440" width="120" height="26" rx="13" fill="#8A5A2B"/>`),

  "sticker-pin": svg(`
    <path d="M256 60 C 170 60, 110 120, 110 206 C 110 300, 256 452, 256 452 C 256 452, 402 300, 402 206 C 402 120, 342 60, 256 60 Z" fill="${AMBER}"/>
    <circle cx="256" cy="206" r="72" fill="${NAVY}"/>
    <circle cx="256" cy="206" r="34" fill="${CYAN}"/>
    <path d="M256 60 C 170 60, 110 120, 110 206" fill="none" stroke="${AMBER2}" stroke-width="10" opacity=".6" stroke-linecap="round"/>`),

  "sticker-coffee": svg(`
    <rect x="140" y="150" width="240" height="230" rx="36" fill="#F2EFE6"/>
    <path d="M380 190 h40 a52 52 0 0 1 0 104 h-40" fill="none" stroke="#F2EFE6" stroke-width="30"/>
    <ellipse cx="260" cy="152" rx="120" ry="26" fill="#5A3A22"/>
    <path d="M200 240 q30 -18 60 0 t60 0 t60 0" stroke="#C89B6D" stroke-width="12" fill="none" stroke-linecap="round"/>
    <path d="M230 110 q14 -22 0 -44 M270 110 q14 -22 0 -44 M310 110 q14 -22 0 -44" stroke="#8A8A86" stroke-width="9" fill="none" stroke-linecap="round" opacity=".7"/>`),

  "sticker-heart-map": svg(`
    <path d="M256 430 C 120 330, 80 250, 110 170 C 140 95, 220 80, 256 140 C 292 80, 372 95, 402 170 C 432 250, 392 330, 256 430 Z" fill="${ROSE}"/>
    <g stroke="#0B1424" stroke-width="9" opacity=".5" fill="none">
      <path d="M120 200 H400 M130 260 H390 M150 320 H370 M180 380 H330"/>
      <path d="M180 90 V420 M256 80 V440 M332 90 V420"/>
    </g>
    <circle cx="256" cy="255" r="26" fill="${AMBER}"/>`),
};

for (const [name, markup] of Object.entries(designs)) {
  const file = join(out, `${name}.webp`);
  await sharp(Buffer.from(markup)).webp({ quality: 92 }).toFile(file);
  console.log("✔", name);
}
console.log("done →", out);
