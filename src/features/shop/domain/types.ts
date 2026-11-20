/**
 * Personal payment gateway contracts for the coffee shop.
 * Pure types only — no I/O, no React.
 */

export interface CoffeeItem {
  /** Stable product key sent to the gateway. */
  id: string;
  /** i18n key for the display name under `shop.items.<id>.name`. */
  nameKey: string;
  /** i18n key for the short description under `shop.items.<id>.desc`. */
  descKey: string;
  /** Price in Iranian Tomans (integer, no decimals). */
  priceToman: number;
}

/** Payload POSTed to the personal gateway endpoint. */
export interface CheckoutRequest {
  /** Product id from the catalog. */
  item: string;
  /** Price in Tomans, copied from the catalog server-side trusted source. */
  amount: number;
  currency: "IRT";
  name: string;
  phone: string;
  email: string;
  /** Support-channel reference, e.g. "rasamap". */
  page: string;
}

/** Normalized gateway response. */
export interface CheckoutResult {
  ok: boolean;
  /** Gateway-hosted payment page to redirect to, when provided. */
  paymentUrl?: string;
  /** Human-readable gateway message (already localized when possible). */
  message?: string;
  /** Sandbox acknowledgement — the gateway accepted but did not charge. */
  sandbox?: boolean;
}

/** Port the UI layer consumes via core/services. */
export interface ICheckoutPort {
  submitCheckout(request: CheckoutRequest): Promise<CheckoutResult>;
  /**
   * Verifies a gateway return (e.g. Zibal ?trackId=&success=). Optional —
   * generic endpoints without a callback flow omit it.
   */
  verifyCallback?(trackId: string, successFlag: string): Promise<CheckoutResult>;
}
