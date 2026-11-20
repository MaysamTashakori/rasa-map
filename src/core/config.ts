/* ────── App config constants ────── */
/* Migrated from src/constants/appConfig.js — env-independent values */

export const CM_PER_INCH = 2.54;

export const MIN_POSTER_CM = 4;
export const MAX_POSTER_CM = 45;
export const DEFAULT_POSTER_WIDTH_CM = 20;
export const DEFAULT_POSTER_HEIGHT_CM = 30;
export const LAYOUT_MATCH_TOLERANCE_CM = 0.01;

export const MIN_DISTANCE_METERS = 100;
export const MAX_DISTANCE_METERS = 20_000_000;
export const DEFAULT_DISTANCE_METERS = 4_000;

/* ── Map / MapLibre ── */

/** Earth circumference at equator in meters. */
export const EARTH_CIRCUMFERENCE_M = 40_075_016.686;

/** Vector tile size for OpenMapTiles/OpenFreeMap tile scheme. */
export const TILE_SIZE_PX = 512;

/** Min zoom level allowed for the map. */
export const MIN_MAP_ZOOM = 0.5;

/** Max zoom level allowed for the map. */
export const MAX_MAP_ZOOM = 20;

/** Default container width (px) used before ResizeObserver measures the real one. */
export const DEFAULT_CONTAINER_PX = 600;

/** Duration (ms) for flyTo animation when selecting a location. */
export const FLY_TO_DURATION_MS = 1800;

/** Tehran, Iran — default fallback when geolocation is denied. */
export const DEFAULT_LAT = 35.6997;
export const DEFAULT_LON = 51.4062;
export const DEFAULT_CITY = "تهران";
export const DEFAULT_COUNTRY = "ایران";

/**
 * The sidebar ad in the poster preview panel is OFF unless
 * VITE_ADS_SIDEBAR_ENABLED is explicitly set to "true".
 */
export const ADS_SIDEBAR_ENABLED =
  String(import.meta.env.VITE_ADS_SIDEBAR_ENABLED ?? "")
    .trim()
    .toLowerCase() === "true";

export const ADSENSE_AD_CLIENT = import.meta.env.VITE_ADSENSE_AD_CLIENT ?? "";
export const AD_SLOT_SIDEBAR = import.meta.env.VITE_AD_SLOT_SIDEBAR ?? "";

export const REPO_URL = import.meta.env.VITE_REPO_URL ?? "";
export const REPO_API_URL = import.meta.env.VITE_REPO_API_URL ?? "";
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL ?? "";
/* Raw markdown URLs (e.g. raw.githubusercontent.com) for the in-app legal
   modal — imprint and privacy docs pulled from the meta repo. */
export const LEGAL_NOTICE_URL = import.meta.env.VITE_LEGAL_NOTICE_URL ?? "";
export const PRIVACY_URL = import.meta.env.VITE_PRIVACY_URL ?? "";

export const SOCIAL_LINKEDIN = import.meta.env.VITE_SOCIAL_LINKEDIN ?? "";
export const SOCIAL_INSTAGRAM = import.meta.env.VITE_SOCIAL_INSTAGRAM ?? "";
export const SOCIAL_REDDIT = import.meta.env.VITE_SOCIAL_REDDIT ?? "";
export const SOCIAL_THREADS = import.meta.env.VITE_SOCIAL_THREADS ?? "";
export const SOCIAL_TELEGRAM = import.meta.env.VITE_SOCIAL_TELEGRAM ?? "";
export const KOFI_URL = import.meta.env.VITE_KOFI_URL ?? "";
/** Optional webhook that receives {name, contact, page} once per visitor. */
export const LEAD_ENDPOINT = import.meta.env.VITE_LEAD_ENDPOINT ?? "";

/**
 * Personal payment gateway for the coffee shop. POSTs checkout JSON here and
 * expects { ok, paymentUrl?, message?, sandbox? }. Empty = gateway pending,
 * the shop shows an honest notice instead of taking payment.
 */
export const PAYMENT_GATEWAY_URL =
  import.meta.env.VITE_PAYMENT_GATEWAY_URL ?? "";
/** Optional shared token sent as X-Gateway-Token to the gateway. */
export const PAYMENT_GATEWAY_TOKEN =
  import.meta.env.VITE_PAYMENT_GATEWAY_TOKEN ?? "";

/**
 * Zibal merchant id (درگاه زیبال) for the coffee shop. When set it takes
 * precedence over the generic PAYMENT_GATEWAY_URL. Request/verify need only
 * this id — no secret ever ships to the client.
 */
export const ZIBAL_MERCHANT = import.meta.env.VITE_ZIBAL_MERCHANT ?? "";

export interface DonationLink {
  name: string;
  url: string;
}

/**
 * Donation targets from VITE_DONATION_LINKS, a JSON array of {name, url}.
 * Falls back to VITE_KOFI_URL as a single "Ko-fi" link. Invalid entries are
 * skipped; no links hides the donate buttons.
 */
function parseDonationLinks(raw: unknown, kofiUrl: string): DonationLink[] {
  const text = String(raw ?? "").trim();
  if (text) {
    try {
      const parsed: unknown = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => ({
            name: String(item?.name ?? "").trim(),
            url: String(item?.url ?? "").trim(),
          }))
          .filter((l) => l.name && /^https?:\/\//i.test(l.url));
      }
    } catch {
      console.warn("VITE_DONATION_LINKS is not valid JSON; ignoring it.");
    }
  }
  const kofi = kofiUrl.trim();
  return /^https?:\/\//i.test(kofi) ? [{ name: "Ko-fi", url: kofi }] : [];
}

export const DONATION_LINKS: DonationLink[] = parseDonationLinks(
  import.meta.env.VITE_DONATION_LINKS,
  KOFI_URL,
);
export const DEVELOPER_NAME = import.meta.env.VITE_DEVELOPER_NAME ?? "";
export const DEVELOPER_PROFILE_URL =
  import.meta.env.VITE_DEVELOPER_PROFILE_URL ?? "";
export const APP_CREDIT_URL =
  import.meta.env.VITE_APP_CREDIT_URL ?? "rasa-map";
export const APP_VERSION = String(
  import.meta.env.VITE_APP_VERSION ?? "0.0.0",
).trim();
export const UPDATES_URL = String(
  import.meta.env.VITE_UPDATES_URL ?? "./updates.json",
).trim();

export const INSTALL_DIAGNOSTICS_ENABLED = false;

export interface FontOption {
  value: string;
  label: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { value: "", label: "Default (Space Grotesk)" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Oswald", label: "Oswald" },
  { value: "Noto Sans JP", label: "Noto Sans JP" },
  { value: "Source Sans Pro", label: "Source Sans Pro" },
  { value: "Raleway", label: "Raleway" },
  { value: "Lato", label: "Lato" },
  { value: "Merriweather", label: "Merriweather" },
  { value: "Bebas neue", label: "Bebas Neue" },
  { value: "Vazirmatn", label: "وزیرمتن · Vazirmatn" },
  { value: "Lalezar", label: "لاله‌زار · Lalezar" },
  { value: "Markazi Text", label: "مرکزی · Markazi Text" },
  { value: "Reem Kufi", label: "کوفی · Reem Kufi" },
  { value: "Amiri", label: "نسخ امیری · Amiri" },
  { value: "Noto Naskh Arabic", label: "نسخ نوتو · Noto Naskh" },
  { value: "Aref Ruqaa", label: "رقعه · Aref Ruqaa" },
];
