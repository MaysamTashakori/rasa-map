import { useCallback, useState } from "react";
import { submitCheckout } from "@/core/services";
import { trackEvent } from "@/shared/utils/analytics";
import type { CheckoutRequest, CheckoutResult } from "../domain/types";

export type CheckoutStatus = "idle" | "busy" | "success" | "error";

/**
 * Orchestrates the coffee checkout: validates the form, submits through the
 * gateway port, and redirects to the gateway payment page when one is
 * returned. UI state stays in the component; this hook owns the async flow.
 */
export function useCoffeeCheckout() {
  const [status, setStatus] = useState<CheckoutStatus>("idle");
  const [result, setResult] = useState<CheckoutResult | null>(null);

  const submit = useCallback(
    async (request: CheckoutRequest): Promise<void> => {
      if (status === "busy") return;
      setStatus("busy");
      setResult(null);
      try {
        const checkout = await submitCheckout(request);
        setResult(checkout);
        if (checkout.ok && checkout.paymentUrl) {
          trackEvent("coffee_checkout_redirect", { item: request.item });
          window.location.assign(checkout.paymentUrl);
          return;
        }
        setStatus(checkout.ok ? "success" : "error");
        trackEvent(checkout.ok ? "coffee_checkout_ok" : "coffee_checkout_fail", {
          item: request.item,
          sandbox: checkout.sandbox === true,
        });
      } catch {
        setStatus("error");
        setResult({ ok: false, message: "network_error" });
        trackEvent("coffee_checkout_fail", { item: request.item, reason: "network" });
      }
    },
    [status],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
  }, []);

  return { status, result, submit, reset };
}
