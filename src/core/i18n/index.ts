import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import { FALLBACK_LANGUAGE, SUPPORTED_LANGUAGE_CODES } from "./languages";

const LANGUAGE_STORAGE_KEY = "terraink:language";

/* English is bundled; every other language is its own small chunk,
   loaded only when that language is picked. */
const lazyLocales = import.meta.glob<{ default: Record<string, unknown> }>(
  ["./locales/*.json", "!./locales/en.json"],
);

async function loadLanguage(code: string): Promise<void> {
  if (i18n.hasResourceBundle(code, "translation")) return;
  const loader = lazyLocales[`./locales/${code}.json`];
  if (!loader) return;
  const mod = await loader();
  i18n.addResourceBundle(code, "translation", mod.default, true, true);
}

/* Arabic is kept left-to-right on purpose; Persian gets a full right-to-left layout. */
const RTL_LANGUAGES = new Set(["fa"]);

/* Inside the Telegram Mini App, Telegram.WebApp carries the user's app
   language. Map it to a supported code ("pt-br" → "pt-BR"). */
function telegramLanguageCode(): string | null {
  const w = window as unknown as {
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: { user?: { language_code?: string } };
        ready?: () => void;
        expand?: () => void;
      };
    };
  };
  const webApp = w.Telegram?.WebApp;
  webApp?.ready?.();
  webApp?.expand?.();
  const raw = webApp?.initDataUnsafe?.user?.language_code;
  if (!raw) return null;
  const normalized = raw.toLowerCase().replace(/_/g, "-");
  return (
    SUPPORTED_LANGUAGE_CODES.find((code) => code.toLowerCase() === normalized) ??
    null
  );
}

function syncHtmlLang(code: string) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = code;
    document.documentElement.dir = RTL_LANGUAGES.has(code) ? "rtl" : "ltr";
  }
}

/* Browser tab title and search description follow the language. */
function syncDocumentMeta() {
  if (typeof document === "undefined") return;
  document.title = i18n.t("meta.title");
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", i18n.t("meta.description"));
}

i18n.on("languageChanged", (code) => {
  syncHtmlLang(code);
  // Components re-render when the bundle is added (bindI18nStore: "added").
  void loadLanguage(code).then(syncDocumentMeta);
});

/** Resolves once the starting language is loaded, so the first paint is translated. */
export const i18nReady: Promise<void> = i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en } },
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGE_CODES,
    // The detector maps regional codes to a supported one:
    // "de-AT" → "de", "pt-PT" → "pt-BR", unknown → English.
    load: "currentOnly",
    partialBundledLanguages: true,
    interpolation: { escapeValue: false },
    react: { bindI18nStore: "added" },
    detection: {
      // A manual pick (saved under this key) wins over the browser language.
      // Only manual picks are saved, so browser changes still apply otherwise.
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: [],
    },
  })
  .then(() => loadLanguage(i18n.language))
  .then(syncDocumentMeta)
  /* In the Mini App, follow Telegram's language unless the user already
     made a manual pick on this device. */
  .then(() => {
    const tg = telegramLanguageCode();
    if (
      tg &&
      tg !== i18n.language &&
      !localStorage.getItem(LANGUAGE_STORAGE_KEY)
    ) {
      return i18n.changeLanguage(tg);
    }
  })
  .catch(() => undefined);

/** Manual pick from the language picker; remembered on this device. */
export function changeLanguage(code: string): Promise<unknown> {
  i18n.services.languageDetector?.cacheUserLanguage?.(code, ["localStorage"]);
  return loadLanguage(code).then(() => i18n.changeLanguage(code));
}

export default i18n;
