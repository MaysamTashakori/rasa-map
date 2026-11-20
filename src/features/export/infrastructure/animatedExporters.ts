import { GIFEncoder, quantize, applyPalette } from "gifenc";
import { APP_CREDIT_URL } from "@/core/config";
import type { ResolvedTheme } from "@/features/theme/domain/types";

/* ─────────────────────────── GIF export ─────────────────────────── */

export interface GifExportOptions {
  /** Max output width in px; height follows the poster aspect. */
  maxWidth?: number;
  /** Number of frames in the loop. */
  frames?: number;
  /** Frame delay in 1/100s (gifenc unit). 8 ≈ 80 ms. */
  delay?: number;
  /** Optional frame colors drawn inside every frame (mat + keyline). */
  frame?: { mat: string; line: string };
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Encodes the composited poster canvas as an animated GIF.
 * Each frame applies a slow Ken Burns zoom + drift so the loop feels like a
 * living print, not a slideshow. Output is capped at `maxWidth` px to keep
 * the file shareable.
 */
export async function createGifBlobFromCanvas(
  source: HTMLCanvasElement,
  options: GifExportOptions = {},
): Promise<Blob> {
  const maxWidth = options.maxWidth ?? 420;
  const frameCount = options.frames ?? 28;
  const delay = options.delay ?? 8;
  const frameStyle = options.frame ?? null;

  const scale = Math.min(1, maxWidth / source.width);
  const w = Math.max(2, Math.round(source.width * scale));
  const h = Math.max(2, Math.round(source.height * scale));
  const matPx = frameStyle ? Math.max(6, Math.round(w * 0.018)) : 0;
  const linePx = Math.max(1, Math.round(w * 0.0025));

  const frame = document.createElement("canvas");
  frame.width = w;
  frame.height = h;
  const ctx = frame.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("gif_no_2d_context");

  const encoder = GIFEncoder();
  let firstFrame = true;

  for (let i = 0; i < frameCount; i++) {
    const t = frameCount === 1 ? 0 : i / (frameCount - 1);
    const zoom = 1 + 0.07 * easeInOut(t);
    const dx = (w - w * zoom) / 2;
    const dy = (h - h * zoom) / 2 - h * 0.012 * Math.sin(t * Math.PI);

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, dx, dy, w * zoom, h * zoom);

    if (frameStyle) {
      // Gallery frame: mat ring + hairline keyline + corner ticks.
      ctx.strokeStyle = frameStyle.mat;
      ctx.lineWidth = matPx * 2;
      ctx.strokeRect(matPx, matPx, w - matPx * 2, h - matPx * 2);
      ctx.strokeStyle = frameStyle.line;
      ctx.lineWidth = linePx;
      const inset = matPx + linePx * 2;
      ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
      const tick = matPx * 3.2;
      ctx.strokeStyle = frameStyle.line;
      ctx.lineWidth = linePx * 1.6;
      const corners: Array<[number, number, number, number]> = [
        [inset, inset, 1, 1],
        [w - inset, inset, -1, 1],
        [inset, h - inset, 1, -1],
        [w - inset, h - inset, -1, -1],
      ];
      for (const [cx, cy, sx, sy] of corners) {
        ctx.beginPath();
        ctx.moveTo(cx + tick * sx, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + tick * sy);
        ctx.stroke();
      }
    }

    const { data } = ctx.getImageData(0, 0, w, h);
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);
    encoder.writeFrame(index, w, h, {
      palette,
      delay,
      repeat: firstFrame ? 0 : undefined,
      dispose: firstFrame ? 2 : 1,
    });
    firstFrame = false;
    // Let the UI breathe between frames on large posters.
    if (i % 7 === 6) await new Promise((r) => setTimeout(r, 0));
  }

  encoder.finish();
  const bytes = encoder.bytes();
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return new Blob([copy.buffer], { type: "image/gif" });
}

/* ───────────────────────── animated HTML export ───────────────────────── */

export type AnimatedFrameStyle = "gallery" | "film" | "tape" | "retro";

export interface AnimatedHtmlOptions {
  /** Poster raster as a PNG data URL. */
  imageDataUrl: string;
  theme: ResolvedTheme;
  /** Theme id — picks a deterministic frame style when frameStyle is unset. */
  themeId?: string;
  title: string;
  subtitle: string;
  coordinateText: string;
  includeCredits: boolean;
  /** width / height of the poster. */
  aspect: number;
  /** Frame treatment; "auto" derives one from the theme id. */
  frameStyle?: AnimatedFrameStyle | "auto";
}

/** Deterministic frame per theme so each theme keeps its own identity. */
function frameForTheme(themeId: string | undefined): AnimatedFrameStyle {
  const styles: AnimatedFrameStyle[] = ["gallery", "film", "tape", "retro"];
  let hash = 0;
  for (const ch of String(themeId ?? "")) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return styles[hash % styles.length];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})/i.exec(hex.trim());
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/**
 * Builds a single self-contained animated HTML poster: Ken Burns drift on the
 * artwork, animated paper grain, floating dust particles, and theme-matched
 * typography. No external requests — works fully offline.
 */
export function createAnimatedHtmlBlob(options: AnimatedHtmlOptions): Blob {
  const {
    imageDataUrl,
    theme,
    themeId,
    title,
    subtitle,
    coordinateText,
    includeCredits,
    aspect,
    frameStyle,
  } = options;

  const bg = theme.ui.bg || "#0b1220";
  const text = theme.ui.text || "#f2f5f7";
  const border = theme.ui.border || bg;
  const borderLine = theme.ui.borderLine || text;
  const accent = theme.map.water || theme.map.roads.major || "#7fd4ff";
  const dark = luminance(bg) < 0.5;
  const grainOpacity = Math.min(0.16, (theme.fx?.grain ?? 0) * 0.22 + 0.05);
  const vignette = Math.min(0.5, (theme.fx?.vignette ?? 0) * 0.6);
  const frame: AnimatedFrameStyle =
    frameStyle === "auto" || frameStyle == null
      ? frameForTheme(themeId)
      : frameStyle;
  const mat = theme.ui.border || bg;
  const matLine = theme.ui.borderLine || text;

  const grainSvg =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — ${escapeHtml(subtitle)}</title>
<style>
  :root{
    --bg:${bg}; --ink:${text}; --line:${borderLine}; --accent:${accent};
    --mat:${mat}; --matline:${matLine};
    --grain:${grainOpacity}; --vig:${vignette};
  }
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{height:100%}
  body{
    background:var(--bg); color:var(--ink);
    font-family:"Space Grotesk","Vazirmatn",system-ui,sans-serif;
    display:flex; align-items:center; justify-content:center;
    min-height:100vh; overflow:hidden; position:relative;
  }
  .stage{position:relative; width:min(92vw, calc(88vh * var(--ar))); aspect-ratio:var(--ar);}
  .poster{
    position:absolute; inset:0; overflow:hidden;
    border:1px solid var(--line); background:${border};
    box-shadow:0 30px 80px rgba(0,0,0,.45);
    transition:transform .18s ease-out;
    will-change:transform;
  }
  /* ── frame: gallery — museum double mat + corner ticks ── */
  .frame-gallery .poster{border:clamp(10px,1.6vmin,18px) solid var(--mat);}
  .frame-gallery .poster::after{
    content:""; position:absolute; inset:clamp(14px,2.2vmin,24px);
    border:1px solid var(--matline); pointer-events:none; opacity:.8;
  }
  .frame-gallery .poster::before{
    content:""; position:absolute; inset:clamp(17px,2.7vmin,29px);
    border:1px solid var(--line); pointer-events:none; opacity:.45;
  }
  /* ── frame: film — sprocket holes top & bottom ── */
  .frame-film .poster{border-radius:6px;}
  .frame-film .sprockets{position:absolute; left:0; right:0; height:4.5%;
    background-image:radial-gradient(circle at 50% 50%, var(--bg) 32%, transparent 36%);
    background-size:4.2% 100%; background-repeat:repeat-x; opacity:.9;}
  .frame-film .sprockets.top{top:1.2%} .frame-film .sprockets.bottom{bottom:1.2%}
  .frame-film .poster{box-shadow:0 30px 80px rgba(0,0,0,.5), 0 0 0 1px var(--line);}
  /* ── frame: tape — washi tape corners ── */
  .frame-tape .tape{position:absolute; width:24%; height:7%;
    background:color-mix(in srgb, var(--accent) 55%, transparent);
    border-left:1px dashed rgba(255,255,255,.35); border-right:1px dashed rgba(255,255,255,.35);
    opacity:.5; backdrop-filter:blur(1px); pointer-events:none; z-index:3;
    box-shadow:0 2px 8px rgba(0,0,0,.15);}
  .frame-tape .tape.tl{top:-2.5%; left:6%; transform:rotate(-38deg);}
  .frame-tape .tape.tr{top:-2.5%; right:6%; transform:rotate(38deg);
    background:color-mix(in srgb, var(--matline) 45%, transparent);}
  .frame-tape .poster{border:1px solid var(--line);}
  /* ── frame: retro — thick rounded polaroid mat ── */
  .frame-retro .poster{
    border:clamp(14px,2.4vmin,26px) solid var(--mat);
    border-radius:clamp(4px,1vmin,10px);
    box-shadow:0 34px 90px rgba(0,0,0,.5), inset 0 0 0 1px var(--matline);
  }
  .frame-retro .poster::after{
    content:""; position:absolute; inset:clamp(18px,3vmin,32px);
    border-radius:inherit; box-shadow:inset 0 0 0 1px var(--line);
    pointer-events:none; opacity:.6;
  }
  /* ── light sweep: a slow shine crossing the print ── */
  .sweep{
    position:absolute; top:-20%; bottom:-20%; width:34%;
    left:0; pointer-events:none; z-index:4; opacity:0;
    background:linear-gradient(105deg, transparent, rgba(255,255,255,.14) 45%, rgba(255,255,255,.05) 55%, transparent);
    transform:translateX(-140%) skewX(-8deg);
    animation:sweep 11s ease-in-out infinite;
  }
  @keyframes sweep{
    0%,62%{transform:translateX(-140%) skewX(-8deg); opacity:0}
    66%{opacity:.9}
    88%,100%{transform:translateX(420%) skewX(-8deg); opacity:0}
  }
  .poster img{
    position:absolute; inset:-6%;
    width:112%; height:112%; object-fit:cover;
    animation:kenburns 26s ease-in-out infinite alternate;
    ${dark ? "filter:saturate(1.05) brightness(1.02);" : ""}
  }
  @keyframes kenburns{
    from{transform:scale(1) translate(0,0)}
    to{transform:scale(1.09) translate(-1.2%, -1.6%)}
  }
  .grain{
    position:absolute; inset:0; pointer-events:none; opacity:var(--grain);
    background-image:${grainSvg}; background-size:160px 160px;
    mix-blend-mode:overlay; animation:grainShift 1.2s steps(4) infinite;
  }
  @keyframes grainShift{
    0%{background-position:0 0} 25%{background-position:-40px 30px}
    50%{background-position:30px -50px} 75%{background-position:-20px -20px}
    100%{background-position:0 0}
  }
  .vig{
    position:absolute; inset:0; pointer-events:none;
    background:radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,var(--vig)) 100%);
  }
  .glow{
    position:absolute; inset:-14%; pointer-events:none; z-index:-1;
    background:radial-gradient(circle at 50% 42%, ${accent}26, transparent 65%);
    animation:breathe 7s ease-in-out infinite alternate;
  }
  @keyframes breathe{from{opacity:.55}to{opacity:1}}
  .caption{
    position:absolute; left:0; right:0; bottom:6.5%;
    text-align:center; padding:0 8%; pointer-events:none;
    text-shadow:0 2px 18px rgba(0,0,0,.55);
  }
  .caption .title{font-size:clamp(18px,4.2vmin,34px); font-weight:700; letter-spacing:.04em}
  .caption .sub{margin-top:.5em; font-size:clamp(11px,2vmin,16px); opacity:.82; letter-spacing:.14em; text-transform:uppercase}
  .coords{
    position:absolute; top:4%; left:0; right:0; text-align:center;
    font-size:clamp(9px,1.6vmin,12px); opacity:.6; letter-spacing:.12em;
    pointer-events:none;
  }
  .credit{
    position:absolute; bottom:2.4%; left:0; right:0; text-align:center;
    font-size:clamp(8px,1.4vmin,11px); opacity:.5; letter-spacing:.1em;
  }
  canvas.dust{position:absolute; inset:0; pointer-events:none; z-index:2}
  @media (prefers-reduced-motion: reduce){
    .poster img,.grain,.glow,.sweep{animation:none}
    .poster{transition:none}
  }
</style>
</head>
<body>
  <div class="stage" style="--ar:${aspect.toFixed(4)}">
    <div class="glow"></div>
    <div class="poster frame-${frame}">
      <img src="${imageDataUrl}" alt="${escapeHtml(title)}">
      ${frame === "film" ? `<div class="sprockets top"></div><div class="sprockets bottom"></div>` : ""}
      ${frame === "tape" ? `<div class="tape tl"></div><div class="tape tr"></div>` : ""}
      <div class="sweep"></div>
      <div class="grain"></div>
      <div class="vig"></div>
      ${coordinateText ? `<div class="coords">${escapeHtml(coordinateText)}</div>` : ""}
      <div class="caption">
        <div class="title">${escapeHtml(title)}</div>
        ${subtitle ? `<div class="sub">${escapeHtml(subtitle)}</div>` : ""}
      </div>
      ${includeCredits ? `<div class="credit">${escapeHtml(APP_CREDIT_URL)} · <a href="https://rasa-to.ir" target="_blank" rel="noreferrer" style="color:inherit;opacity:.8;text-decoration:none">Rasato</a></div>` : ""}
      <canvas class="dust" id="dust"></canvas>
    </div>
  </div>
<script>
(function(){
  var c=document.getElementById('dust'),x=c.getContext('2d');
  var W,H,ps=[];
  function rs(){W=c.width=c.offsetWidth*devicePixelRatio;H=c.height=c.offsetHeight*devicePixelRatio;
    ps=[];for(var i=0;i<26;i++)ps.push({x:Math.random(),y:Math.random(),r:.6+Math.random()*1.8,
      s:.00012+Math.random()*.0003,ph:Math.random()*6.28,a:.12+Math.random()*.3});}
  rs();addEventListener('resize',rs);
  /* mouse parallax: the print leans toward the pointer, glow counter-leans */
  var poster=document.querySelector('.poster'),glow=document.querySelector('.glow');
  var tx=0,ty=0,cx=0,cy=0,mq=window.matchMedia('(prefers-reduced-motion: reduce)');
  addEventListener('mousemove',function(e){
    if(mq.matches)return;
    tx=(e.clientX/innerWidth-.5)*2;ty=(e.clientY/innerHeight-.5)*2;
  });
  (function par(){
    cx+=(tx-cx)*.06;cy+=(ty-cy)*.06;
    if(poster)poster.style.transform='perspective(1200px) rotateY('+(-cx*1.4)+'deg) rotateX('+(cy*1.1)+'deg)';
    if(glow)glow.style.transform='translate('+(-cx*18)+'px,'+(cy*14)+'px)';
    requestAnimationFrame(par);
  })();
  var t0=performance.now();
  (function loop(t){
    x.clearRect(0,0,W,H);
    for(var i=0;i<ps.length;i++){var p=ps[i];
      p.y-=p.s*(t-t0)/16;if(p.y<-.02)p.y=1.02;
      var px=p.x*W+Math.sin(t*.0004+p.ph)*W*.012, py=p.y*H;
      x.beginPath();x.arc(px,py,p.r*devicePixelRatio,0,6.283);
      x.fillStyle='rgba(255,255,255,'+p.a+')';x.fill();}
    requestAnimationFrame(loop);
  })(t0);
})();
</script>
</body>
</html>`;

  return new Blob([html], { type: "text/html;charset=utf-8" });
}
