import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCheckoutCallback } from "../application/useCheckoutCallback";
import { CloseIcon } from "@/shared/ui/Icons";

/**
 * Fixed toast shown once when the customer returns from the payment gateway.
 * Verifies the payment server-side (Zibal /v1/verify) and reports the result.
 */
export default function CoffeeCallbackNotice() {
  const { t } = useTranslation();
  const result = useCheckoutCallback();
  const [dismissed, setDismissed] = useState(false);

  if (!result || dismissed) return null;

  const ok = result.ok;
  const cancelled = result.message === "payment_cancelled";
  const text = ok
    ? t("shop.paymentSuccess")
    : cancelled
      ? t("shop.paymentCancelled")
      : t("shop.paymentFailed");

  return (
    <div
      className={`coffee-notice-toast${ok ? " coffee-notice-toast--ok" : ""}`}
      role="status"
    >
      <span>{text}</span>
      <button
        type="button"
        className="coffee-notice-toast-close"
        onClick={() => setDismissed(true)}
        aria-label={t("shell.common.close")}
      >
        <CloseIcon />
      </button>
    </div>
  );
}
