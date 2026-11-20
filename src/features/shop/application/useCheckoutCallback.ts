import { useEffect, useState } from "react";
import { verifyCheckoutCallback } from "@/core/services";
import { trackEvent } from "@/shared/utils/analytics";
import { parseCheckoutCallback } from "../infrastructure/callbackParser";
import type { CheckoutResult } from "../domain/types";

/**
 * Detects a payment-gateway return (…?chinar_pay=1&trackId=…&success=…),
 * strips the params from the URL, verifies the payment, and exposes the
 * result for the notice toast. Runs once on mount.
 */
export function useCheckoutCallback(): CheckoutResult | null {
  const [result, setResult] = useState<CheckoutResult | null>(null);

  useEffect(() => {
    const params = parseCheckoutCallback(window.location.search);
    if (!params) return;

    // Clean the URL so a refresh does not re-verify the same payment.
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.hash,
    );

    if (!params.trackId) {
      setResult({ ok: false, message: "payment_missing_track" });
      return;
    }
    if (!verifyCheckoutCallback) {
      setResult({ ok: false, message: "gateway_missing" });
      return;
    }

    let cancelled = false;
    void verifyCheckoutCallback(params.trackId, params.successFlag)
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        trackEvent(res.ok ? "coffee_payment_ok" : "coffee_payment_fail", {
          gateway: "zibal",
        });
      })
      .catch(() => {
        if (cancelled) return;
        setResult({ ok: false, message: "network_error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return result;
}
