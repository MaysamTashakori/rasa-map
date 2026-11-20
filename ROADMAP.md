# Rasa Map — Development Roadmap

Backlog for continuous improvement. Each item should ship as a small,
verified commit: `bun run typecheck`, `bun run i18n:check` and
`bun run build` must pass before pushing to `main`.

## Creative exports

- [ ] Route-draw animation in animated HTML export (stroke-dash draw-on loop)
- [ ] Marker pulse rings in animated HTML export
- [ ] More frame styles: deckle edge, orbit stickers, stamp frame
- [ ] Cinematic intro variant for the animated HTML (3-2-1 title reveal)
- [ ] Animated WebP export (better quality/size than GIF)
- [ ] Social-story format preset (9:16 animated HTML)

## Themes

- [ ] More print-art themes: cyanotype, letterpress, giclée, hologram pastel
- [ ] User theme editor improvements (live preview while picking colors)
- [ ] Seasonal/occasion themes (Yalda, Nowruz, Ramadan nights)

## Product & monetization

- [ ] Physical print order flow (size + frame + contact → Telegram notify)
- [ ] Telegram bot delivery for generated files (needs server endpoint)
- [ ] Real Zibal merchant wiring once credentials arrive (`VITE_ZIBAL_MERCHANT`)
- [ ] Lead endpoint integration when `VITE_LEAD_ENDPOINT` is provisioned

## Quality & reach

- [ ] Lighthouse pass: keep mobile TTI low despite MapLibre bundle
- [ ] OG/social preview image for link shares
- [ ] More showcase screenshots in README
- [ ] Persian SEO content page (how-to guides in fa)

## Rules for contributors (human or agent)

- All user-facing text goes through i18n — update **every** locale file.
- New CSS classes need a matching rule in `src/styles/`.
- Respect layer boundaries in `AGENT.md` — no infra imports in UI.
- Never commit secrets; env vars live in `.env.local` / CI secrets only.
- Persian copy follows the `persian-writing` conventions (ZWNJ, RTL).
