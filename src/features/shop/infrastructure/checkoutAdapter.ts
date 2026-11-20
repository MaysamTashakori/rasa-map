import { PAYMENT_GATEWAY_URL, PAYMENT_GATEWAY_TOKEN } from "@/core/config";
import type { IHttp } from "@/core/http";
import type { CheckoutRequest, CheckoutResult, ICheckoutPort } from "../domain/types";

interface GatewayEnvelope {
  ok?: boolean;
  paymentUrl?: string;
  payment_url?: string;
  message?: string;
  sandbox?: boolean;
}

function normalize(payload: unknown): CheckoutResult {
  const env = (payload ?? {}) as GatewayEnvelope;
  const paymentUrl = String(env.paymentUrl ?? env.payment_url ?? "").trim();
  return {
    ok: env.ok !== false,
    paymentUrl: /^https?:\/\//i.test(paymentUrl) ? paymentUrl : undefined,
    message: typeof env.message === "string" ? env.message : undefined,
    sandbox: env.sandbox === true,
  };
}

/**
 * Personal gateway adapter.
 *
 * POSTs the checkout as JSON to VITE_PAYMENT_GATEWAY_URL and expects a JSON
 * envelope: { ok, paymentUrl?, message?, sandbox? }. A paymentUrl redirects
 * the customer to the gateway-hosted payment page; without one the order is
 * recorded as a support request the owner fulfils manually.
 *
 * With no endpoint configured the adapter reports the gateway as unavailable
 * so the UI can show an honest "coming soon" state instead of faking a sale.
 */
export function createCheckoutAdapter(http: IHttp): ICheckoutPort {
  return {
    async submitCheckout(request: CheckoutRequest): Promise<CheckoutResult> {
      const endpoint = String(PAYMENT_GATEWAY_URL ?? "").trim();
      if (!endpoint) {
        return { ok: false, message: "gateway_missing" };
      }

      const token = String(PAYMENT_GATEWAY_TOKEN ?? "").trim();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["X-Gateway-Token"] = token;

      const response = await http.post(
        endpoint,
        JSON.stringify(request),
        { headers },
      );

      const text = await response.text();
      let payload: unknown = null;
      try {
        payload = text ? JSON.parse(text) : null;
      } catch {
        payload = null;
      }

      if (!response.ok) {
        return {
          ok: false,
          message:
            (payload as GatewayEnvelope | null)?.message ??
            `gateway_http_${response.status}`,
        };
      }
      return normalize(payload);
    },
  };
}
