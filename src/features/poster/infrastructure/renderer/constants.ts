export const OUTPUT_DPI = 300;
// Raised so common print sizes (up to ~A2 / 30×45 cm) keep true 300 dpi.
// Very large canvases are still capped to protect memory on mobile devices.
export const MAX_PIXELS = 20_000_000;
export const MAX_SIDE = 6144;
