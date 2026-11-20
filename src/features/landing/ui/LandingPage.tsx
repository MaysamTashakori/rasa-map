import { useEffect, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { trackEvent } from "@/shared/utils/analytics";

interface LandingPageProps {
  onEnter: () => void;
}

const STEP_MS = 3200;
const STEP_COUNT = 4;

/** Deterministic street grid for the living-map illustration. */
const STREETS = [
  "M20 90 H380",
  "M20 170 H380",
  "M20 250 H380",
  "M20 330 H380",
  "M20 410 H380",
  "M60 20 V500",
  "M140 20 V500",
  "M220 20 V500",
  "M300 20 V500",
  "M60 90 C 120 130, 90 200, 160 240 S 260 300, 240 380",
  "M300 60 C 260 120, 330 180, 280 250 S 340 340, 300 420",
];

const PARKS = [
  { x: 70, y: 200, w: 56, h: 40 },
  { x: 240, y: 90, w: 64, h: 44 },
  { x: 150, y: 380, w: 60, h: 46 },
];

const BLOCKS = [
  { x: 90, y: 120, w: 34, h: 26 },
  { x: 180, y: 120, w: 26, h: 34 },
  { x: 250, y: 200, w: 30, h: 26 },
  { x: 90, y: 290, w: 30, h: 30 },
  { x: 250, y: 300, w: 34, h: 30 },
  { x: 160, y: 430, w: 40, h: 24 },
];

const MARKERS = [
  { cx: 120, cy: 210, r: 7, delay: "0s" },
  { cx: 262, cy: 285, r: 6, delay: ".25s" },
  { cx: 200, cy: 120, r: 6, delay: ".5s" },
];

const FORMATS = ["PNG", "PDF", "RSVG", "GIF", "HTML"];

/**
 * Animated first-visit front door. A "living poster" on the right cycles
 * through the four creative steps — pick a place, pick a theme, draw the
 * route, export — while the copy on the left explains each one.
 */
export default function LandingPage({ onEnter }: LandingPageProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const id = window.setInterval(
      () => setStep((s) => (s % STEP_COUNT) + 1),
      STEP_MS,
    );
    return () => window.clearInterval(id);
  }, []);

  /** Subtle pointer parallax — the poster leans toward the cursor. */
  const onStageMove = (e: ReactMouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setTilt({ x, y });
  };

  const enter = () => {
    trackEvent("landing_enter");
    onEnter();
  };

  return (
    <div className="lp">
      <div className="lp-aurora" aria-hidden="true">
        <i /><i /><i /><i />
      </div>

      <main className="lp-shell">
        <section className="lp-copy">
          <p className="lp-eyebrow">{t("landing.eyebrow")}</p>
          <h1 className="lp-title">
            {t("landing.title")} <em>{t("landing.titleAccent")}</em>
          </h1>
          <p className="lp-tagline">{t("landing.tagline")}</p>

          <ol className="lp-steps" aria-label={t("landing.stepsLabel")}>
            {[1, 2, 3, 4].map((n) => (
              <li
                key={n}
                className={`lp-step${step === n ? " is-active" : ""}`}
                onClick={() => setStep(n)}
              >
                <span className="lp-step-num">{n}</span>
                <span className="lp-step-text">
                  <b>{t(`landing.step${n}.title`)}</b>
                  <small>{t(`landing.step${n}.desc`)}</small>
                </span>
              </li>
            ))}
          </ol>
          <div className="lp-progress" aria-hidden="true">
            <i style={{ width: `${(step / STEP_COUNT) * 100}%` }} />
          </div>

          <button type="button" className="lp-cta" onClick={enter}>
            {t("landing.cta")}
          </button>
          <p className="lp-hint">{t("landing.hint")}</p>
        </section>

        <section
          className="lp-stage"
          data-step={step}
          aria-hidden="true"
          onMouseMove={onStageMove}
          onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        >
          <div
            className="lp-poster"
            style={
              {
                "--lp-rx": `${tilt.x * 5}deg`,
                "--lp-ry": `${-tilt.y * 4}deg`,
              } as CSSProperties
            }
          >
            <svg viewBox="0 0 400 520" role="img">
              <defs>
                <linearGradient id="lp-sky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="var(--lp-bg)" />
                  <stop offset="1" stopColor="var(--lp-bg2)" />
                </linearGradient>
                <radialGradient id="lp-glow" cx="50%" cy="38%" r="60%">
                  <stop offset="0" stopColor="var(--lp-accent)" stopOpacity=".28" />
                  <stop offset="1" stopColor="var(--lp-accent)" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect width="400" height="520" fill="url(#lp-sky)" />
              <rect width="400" height="520" fill="url(#lp-glow)" />

              <g stroke="var(--lp-grid)" strokeWidth="1">
                {Array.from({ length: 10 }, (_, i) => (
                  <line key={`v${i}`} x1={40 + i * 40} y1="0" x2={40 + i * 40} y2="520" />
                ))}
                {Array.from({ length: 13 }, (_, i) => (
                  <line key={`h${i}`} x1="0" y1={40 + i * 40} x2="400" y2={40 + i * 40} />
                ))}
              </g>

              <path
                className="lp-river"
                d="M-10 120 C 90 100, 140 210, 260 190 S 390 260, 420 240"
                fill="none"
              />

              {PARKS.map((p, i) => (
                <rect
                  key={`park${i}`}
                  className="lp-park"
                  x={p.x}
                  y={p.y}
                  width={p.w}
                  height={p.h}
                  rx="10"
                />
              ))}
              {BLOCKS.map((b, i) => (
                <rect
                  key={`blk${i}`}
                  className="lp-block"
                  x={b.x}
                  y={b.y}
                  width={b.w}
                  height={b.h}
                  rx="4"
                />
              ))}

              <g className="lp-streets">
                {STREETS.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>

              <path
                className="lp-route"
                d="M40 430 C 110 400, 140 330, 200 300 S 320 210, 350 130"
              />
              <path
                className="lp-route lp-route--under"
                d="M40 430 C 110 400, 140 330, 200 300 S 320 210, 350 130"
              />
              {/* Two pulses riding the route, like GPS dots streaming in */}
              <circle className="lp-pulse" r="4" fill="var(--lp-accent)">
                <animateMotion
                  dur="3.4s"
                  repeatCount="indefinite"
                  path="M40 430 C 110 400, 140 330, 200 300 S 320 210, 350 130"
                />
              </circle>
              <circle className="lp-pulse lp-pulse--late" r="3" fill="#fff">
                <animateMotion
                  dur="3.4s"
                  begin="-1.7s"
                  repeatCount="indefinite"
                  path="M40 430 C 110 400, 140 330, 200 300 S 320 210, 350 130"
                />
              </circle>

              {MARKERS.map((m, i) => (
                <g key={`m${i}`} className="lp-marker" style={{ animationDelay: m.delay }}>
                  <circle className="lp-marker-ring" cx={m.cx} cy={m.cy} r={m.r + 7} />
                  <circle className="lp-marker-dot" cx={m.cx} cy={m.cy} r={m.r} />
                </g>
              ))}
              {/* key={step} re-drops the main marker on every step change */}
              <g key={step} className="lp-marker lp-marker--main">
                <circle className="lp-marker-ring" cx="200" cy="300" r="16" />
                <circle className="lp-marker-ring lp-marker-ring--late" cx="200" cy="300" r="16" />
                <circle className="lp-marker-dot" cx="200" cy="300" r="9" />
              </g>

              <rect
                x="14"
                y="14"
                width="372"
                height="492"
                rx="18"
                fill="none"
                className="lp-frame"
              />
            </svg>

            <div className="lp-caption">
              <b key={step}>{t(`landing.step${step}.title`)}</b>
              <span key={`s${step}`}>{t(`landing.step${step}.desc`)}</span>
            </div>

            <div className="lp-chips" data-on={step === 4}>
              {FORMATS.map((f) => (
                <span key={f} className="lp-chip">
                  {f}
                </span>
              ))}
              <span className="lp-chip lp-chip--print">{t("landing.chipPrint")}</span>
            </div>
          </div>
        </section>
      </main>

      <div className="lp-marquee" aria-hidden="true">
        <div className="lp-marquee-track">
          {[0, 1].map((copy) => (
            <span key={copy} className="lp-marquee-set">
              {[...FORMATS, t("landing.chipPrint"), t("landing.chipPostcard"), t("landing.chipStory")].map(
                (item, i) => (
                  <em key={`${copy}-${i}`}>{item}</em>
                ),
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
