/**
 * Pre-instantiated infrastructure services.
 *
 * This module creates singleton instances of the hexagonal adapters,
 * wiring them to the concrete cache and HTTP implementations.
 * Application hooks import from here instead of calling factories directly.
 */

import { localStorageCache } from "@/core/cache/localStorageCache";
import { fetchAdapter } from "@/core/http/fetchAdapter";
import { localFontsAdapter } from "@/core/fonts/localFontsAdapter";
import { ZIBAL_MERCHANT, TELEGRAM_ENDPOINT } from "@/core/config";
import { createTelegramSender } from "@/features/export/infrastructure/telegramSender";
import { createCheckoutAdapter } from "@/features/shop/infrastructure/checkoutAdapter";
import { createZibalAdapter } from "@/features/shop/infrastructure/zibalAdapter";
import { createNominatimAdapter } from "@/features/location/infrastructure/nominatimAdapter";
import { createRecentLocationsStore } from "@/features/location/infrastructure/recentLocationsStore";

/* ── Location / Geocoding ── */

const nominatim = createNominatimAdapter(fetchAdapter, localStorageCache);

export const searchLocations = nominatim.searchLocations;
export const geocodeLocation = nominatim.geocodeLocation;
export const reverseGeocodeCoordinates = nominatim.reverseGeocode;

/* ── Coffee shop / personal payment gateway ── */

// Zibal takes precedence when a merchant id is configured; the generic
// endpoint remains as a fallback for a future self-hosted gateway.
const zibalMerchant = String(ZIBAL_MERCHANT ?? "").trim();
const checkout = zibalMerchant
  ? createZibalAdapter(fetchAdapter, zibalMerchant)
  : createCheckoutAdapter(fetchAdapter);

export const submitCheckout = checkout.submitCheckout;
export const verifyCheckoutCallback = checkout.verifyCallback;

/* ── Recent location history ── */

const recentLocations = createRecentLocationsStore();

export const listRecentLocations = recentLocations.list;
export const addRecentLocation = recentLocations.add;
export const removeRecentLocation = recentLocations.remove;
export const clearRecentLocations = recentLocations.clear;

/* ── Fonts ── */

export const ensureFont =
  localFontsAdapter.ensureFont.bind(localFontsAdapter);

/* ── Poster compositing ── */

export { compositeExport } from "@/features/poster/infrastructure/renderer";

/* ── Export helpers ── */

export { captureMapAsCanvas } from "@/features/export/infrastructure/mapExporter";

export { createPngBlob } from "@/features/export/infrastructure/pngExporter";
export { createLayeredSvgBlobFromMap } from "@/features/export/infrastructure/layeredSvgExporter";

export { createPdfBlobFromCanvas } from "@/features/export/infrastructure/pdfExporter";

export { createPosterFilename } from "@/features/export/infrastructure/filenameGenerator";

export {
  createGifBlobFromCanvas,
  createAnimatedHtmlBlob,
} from "@/features/export/infrastructure/animatedExporters";

export { triggerDownloadBlob } from "@/features/export/infrastructure/fileDownloader";

/* ── Telegram delivery ── */

const telegramSender = createTelegramSender(fetchAdapter, TELEGRAM_ENDPOINT);
export const sendPosterToTelegram = telegramSender.sendFile;
export {
  loadFavoriteThemeIds,
  saveFavoriteThemeIds,
} from "@/features/theme/infrastructure/favoriteThemesStorage";
export {
  loadStartupWindowHidden,
  saveStartupWindowHidden,
} from "@/features/location/infrastructure/startupWindowStorage";
export {
  loadAllTimeDownloadCount,
  saveAllTimeDownloadCount,
} from "@/features/export/infrastructure/downloadCountStorage";
export {
  loadVideoGuideState,
  saveVideoGuideState,
} from "@/features/export/infrastructure/videoGuideStorage";
export {
  fetchUpdateReleases,
  resolveUpdateImage,
  loadNewsSeenVersion,
  saveNewsSeenVersion,
} from "@/features/updates/infrastructure/updatesFeed";

/* ── Analytics ── */

export { trackEvent, setUserProperty } from "@/core/analytics/gtagAnalytics";
export { loadAds } from "@/core/ads/adsenseLoader";

/* ── Legal docs ── */

export { fetchMarkdownDoc } from "@/features/legal/infrastructure/legalDocsAdapter";

/* ── Routes ── */

export { gpxParser } from "@/features/routes/infrastructure/gpxParser";
export { drawRoutesOnCanvas } from "@/features/routes/infrastructure/rendering";
