<div align="center">

<img src="./public/assets/logo.svg" alt="Rasa Map" width="96" />

# رسا مپ · Rasa Map

**Turn any place on Earth into a living piece of art — posters, postcards, animated GIFs and print-ready files, free and open.**

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-0B1424?style=for-the-badge&logo=gnu)](LICENSE)
[![Bun](https://img.shields.io/badge/Bun-000?logo=bun&logoColor=fff&style=for-the-badge)](https://bun.sh)
[![Vite](https://img.shields.io/badge/Vite-9135FF?logo=vite&logoColor=fff&style=for-the-badge)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=000&style=for-the-badge)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=fff&style=for-the-badge)](https://www.typescriptlang.org)
[![MapLibre](https://img.shields.io/badge/MapLibre-000?logo=maplibre&logoColor=fff&style=for-the-badge)](https://maplibre.org/)
[![i18n: 13 languages](https://img.shields.io/badge/i18n-13%20languages-D6AD55?style=for-the-badge)](src/core/i18n)

**🌐 Live demo: [maysamtashakori.github.io/rasa-map](https://maysamtashakori.github.io/rasa-map/)** · **🎬 [15s cinematic film](https://maysamtashakori.github.io/rasa-map/rasa-map-film.html)**

A Persian-first companion to [Terraink](https://github.com/yousifamanuel/terraink), reimagined as a creative studio: animated landing, living poster exports, a coffee shop powered by Zibal, and a lead gate that turns downloads into connections.

</div>

---

## ✨ What makes Rasa Map different

| | Terraink | **Rasa Map** |
|---|---|---|
| Language | English-first | **Persian-first, RTL, Vazirmatn** — 13 languages |
| First screen | Studio | **Animated landing** that tells the creative story |
| Exports | PNG / PDF / SVG | **+ animated GIF and self-contained animated HTML** |
| Themes | Color palettes | **Print-aware themes** — grain, vignette, risograph, x-ray, holo foil |
| Monetization | None | **Coffee shop (Zibal), lead capture, print orders** |

## 🎬 Features

- **Living landing page** — an animated "living poster" that demonstrates the creative process before you enter the studio
- **Real map posters** — any place on Earth via OpenStreetMap data: roads, water, parks, buildings, rail
- **Animated exports** — Ken Burns GIF (28 frames) and a single-file animated HTML poster with grain, dust particles and breathing glow — zero external requests
- **Print-grade output** — PNG, PDF, layered SVG (RSVG), up to 300 dpi; optional paper grain & vignette per theme
- **50+ curated themes** — Persian palettes (Chinar, Lajvard, Firuzeh), Rasa Night/Dusk, Risograph, Indigo Dye, X-Ray, Holo Foil, Neon, Swiss, Vintage Postcard…
- **Typography controls** — city/country labels in bundled typefaces including Vazirmatn
- **Smart geocoding** — search any city or enter coordinates manually
- **Coffee shop** — espresso / americano / macchiato checkout via Zibal gateway (sandbox-ready via env)
- **Lead gate** — optional name + phone/email before first download, webhook-ready
- **Zibal payment callback** — request → redirect → verify flow with localized notices
- **Fully client-side rendering** — no server needed for map generation

## 🖼️ Sample outputs

Every export is a real file you can print or share:

- **PNG / PDF poster** — gallery print, wall art
- **RSVG** — layered SVG for designers
- **GIF** — 28-frame Ken Burns animation for social posts & stories
- **Animated HTML** — a living poster that plays grain, particles and glow offline in one file

## 🧱 Stack

- **Map data**: [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)
- **Tiles**: [OpenMapTiles](https://openmaptiles.org/) · hosted by [OpenFreeMap](https://openfreemap.org/)
- **Geocoding**: [Nominatim](https://nominatim.openstreetmap.org/)
- **Renderer**: [MapLibre GL JS](https://maplibre.org/)
- **Payments**: [Zibal gateway](https://gateway.zibal.ir) (optional, env-configured)
- **GIF encoding**: [gifenc](https://github.com/mattdesl/gifenc) — fully client-side

## 🖼️ Sample works

Four poster styles from the theme engine — every one printable at 300 dpi:

<p align="center">
  <img src="./docs/samples/rasa-emerald.svg" alt="Rasa Emerald poster" width="30%" />
  <img src="./docs/samples/eshgh.svg" alt="Eshgh romance poster" width="30%" />
  <img src="./docs/samples/nostalgi.svg" alt="Nostalgi film poster" width="30%" />
  <img src="./docs/samples/holo-foil.svg" alt="Holo Foil poster" width="30%" />
</p>

**🌍 Multilingual:** the whole UI speaks **13 languages** — Persian-first and fully RTL with Vazirmatn, plus English, Arabic, German, Spanish, French, Italian, Japanese, Dutch, Polish, Portuguese (BR), Turkish and Chinese. Map labels and poster text support Persian typefaces natively.

## 🚀 Install & run

**One command (npm):**

```bash
npx rasa-map          # serves the studio on http://localhost:4173
```

**From source:**

```bash
bun install
bun run dev        # http://localhost:5173
```

Or with Docker:

```bash
docker compose up -d --build   # http://localhost:7200
```

## 📱 Telegram delivery

Send any poster straight to Telegram — the export menu gains a **Telegram** button when `VITE_TELEGRAM_ENDPOINT` points at the included relay:

```bash
# server side (token stays here, never in the web app)
TELEGRAM_BOT_TOKEN=123456:ABC... TELEGRAM_CHAT_ID=123 node server/telegram-bot.mjs

# web app
VITE_TELEGRAM_ENDPOINT=https://your-relay.example.com/api/send
```

- `server/telegram-bot.mjs` — zero-dependency Node relay: `POST /api/send` (file → `sendDocument`), `POST /api/notify` (text → `sendMessage`), `GET /health`
- If `TELEGRAM_CHAT_ID` is unset, the relay auto-resolves the chat from the bot's recent `getUpdates` — just message the bot once after creating it
- The web client only ever sees the endpoint URL; the bot token never ships to browsers

## ⚙️ Environment

All variables are optional for core functionality — see [`.env.example`](./.env.example).

| Variable | Purpose |
|---|---|
| `VITE_ZIBAL_MERCHANT` | Zibal merchant ID for the coffee shop |
| `VITE_PAYMENT_GATEWAY_URL` | Optional generic payment gateway fallback |
| `VITE_LEAD_ENDPOINT` | Webhook that receives lead submissions |
| `VITE_DONATION_LINKS` | JSON array of donation targets |
| `VITE_APP_CREDIT_URL` | Credit link printed on exports |

## 🏗️ Architecture

Feature-based + hexagonal layers under `src/features/` — `domain` (pure), `application` (hooks), `infrastructure` (adapters), `ui` (components). Single source of truth: `PosterContext`. See [AGENT.md](./AGENT.md) and [CLAUDE.md](./CLAUDE.md).

```text
src/features/
  export/  install/  landing/  layout/  location/
  map/     markers/  poster/   shop/    theme/  updates/
```

## 🤝 Contributing

Issues, PRs and [Discussions](https://github.com/MaysamTashakori/rasa-map/discussions) are welcome. The improvement backlog lives in [ROADMAP.md](./ROADMAP.md). Keep changes modular and aligned with the architecture in [AGENT.md](./AGENT.md).

## 📄 License & attribution

Rasa Map is licensed under [AGPL-3.0](LICENSE). It is a Persian-first fork & companion of [Terraink](https://github.com/yousifamanuel/terraink) by Yousuf Amanuel — all upstream copyright, license and trademark notices are preserved. Terraink™ remains a trademark of its owner; Rasa Map is an independent project.

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL) · Tiles © [OpenMapTiles](https://openmaptiles.org/) · Inspired by [MapToPoster](https://github.com/originalankur/maptoposter).

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=MaysamTashakori/rasa-map&type=Date)](https://star-history.com/#MaysamTashakori/rasa-map&Date)
