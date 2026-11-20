import type { IHttp } from "@/core/http";
import type {
  CheckoutRequest,
  CheckoutResult,
  ICheckoutPort,
} from "../domain/types";

/**
 * Zibal (درگاه زیبال) personal gateway — the same provider rasa-to.ir uses.
 *
 * Flow (all client-side, no merchant secret needed for request/verify):
 *   1. POST https://gateway.zibal.ir/v1/request  → { result: 100, trackId }
 *   2. Redirect the customer to https://gateway.zibal.ir/start/{trackId}
 *   3. Zibal returns to callbackUrl?trackId=…&success=1|0
 *   4. POST https://gateway.zibal.ir/v1/verify { merchant, trackId }
 *      result 100 = paid, 201 = already verified, anything else = failed.
 *
 * Amounts are sent in Rials — the catalog stores Tomans, so ×10 here.
 */

const ZIBAL_REQUEST_URL = "https://gateway.zibal.ir/v1/request";
const ZIBAL_VERIFY_URL = "https://gateway.zibal.ir/v1/verify";
const ZIBAL_START_URL = "https://gateway.zibal.ir/start/";

const ZIBAL_OK = 100;
const ZIBAL_ALREADY_VERIFIED = 201;

interface ZibalRequestResponse {
  result?: number;
  trackId?: number | string;
  message?: string;
}

interface ZibalVerifyResponse {
  result?: number;
  amount?: number;
  refNumber?: number | string;
  cardNumber?: string;
  message?: string;
}

async function postJson<T>(http: IHttp, url: string, body: unknown): Promise<T> {
  const res = await http.post(url, JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`zibal_bad_response_${res.status}`);
  }
}

export function createZibalAdapter(
  http: IHttp,
  merchant: string,
): ICheckoutPort {
  const mid = merchant.trim();

  /** Zibal appends ?trackId=&success= to this URL when the customer returns. */
  const callbackUrl = () => {
    const { origin, pathname } = window.location;
    return `${origin}${pathname}?chinar_pay=1`;
  };

  return {
    async submitCheckout(request: CheckoutRequest): Promise<CheckoutResult> {
      if (!mid) return { ok: false, message: "gateway_missing" };

      const orderId = `rasamap-${Date.now()}`;
      const payload = {
        merchant: mid,
        amount: Math.round(request.amount) * 10, // Tomans → Rials
        callbackUrl: callbackUrl(),
        orderId,
        description: `Chinar coffee — ${request.item}`,
        mobile: request.phone || undefined,
        mail: request.email || undefined,
      };

      const res = await postJson<ZibalRequestResponse>(http, ZIBAL_REQUEST_URL, payload);
      const trackId = res.trackId != null ? String(res.trackId) : "";

      if (res.result !== ZIBAL_OK || !trackId) {
        return {
          ok: false,
          message: res.message || `zibal_result_${res.result ?? "unknown"}`,
        };
      }

      return {
        ok: true,
        paymentUrl: `${ZIBAL_START_URL}${trackId}`,
        message: orderId,
      };
    },

    /**
     * Verifies a returning customer. `success=0` short-circuits to failed
     * without a verify call (the customer cancelled at the gateway).
     */
    async verifyCallback(trackId: string, successFlag: string): Promise<CheckoutResult> {
      if (!mid) return { ok: false, message: "gateway_missing" };
      if (successFlag !== "1") {
        return { ok: false, message: "payment_cancelled" };
      }

      const res = await postJson<ZibalVerifyResponse>(http, ZIBAL_VERIFY_URL, {
        merchant: mid,
        trackId,
      });

      if (res.result === ZIBAL_OK || res.result === ZIBAL_ALREADY_VERIFIED) {
        return { ok: true, message: res.refNumber != null ? `ref_${res.refNumber}` : undefined };
      }
      return {
        ok: false,
        message: res.message || `zibal_verify_${res.result ?? "unknown"}`,
      };
    },
  };
}
