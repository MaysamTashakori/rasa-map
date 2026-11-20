export interface CheckoutCallbackParams {
  trackId: string;
  successFlag: string;
}

/**
 * Reads the gateway return parameters appended to the callback URL.
 * Zibal redirects to `…?chinar_pay=1&trackId=…&success=1|0`.
 * Returns null when the current URL is not a payment callback.
 */
export function parseCheckoutCallback(
  search: string,
): CheckoutCallbackParams | null {
  const params = new URLSearchParams(search);
  if (params.get("chinar_pay") !== "1") return null;
  return {
    trackId: params.get("trackId") ?? "",
    successFlag: params.get("success") ?? "",
  };
}
