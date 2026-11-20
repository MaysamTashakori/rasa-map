import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { PAYMENT_GATEWAY_URL, ZIBAL_MERCHANT } from "@/core/config";
import { COFFEE_MENU } from "../domain/catalog";
import type { CoffeeItem } from "../domain/types";
import { useCoffeeCheckout } from "../application/useCoffeeCheckout";
import { CloseIcon, CoffeeIcon, LoaderIcon } from "@/shared/ui/Icons";

interface CoffeeShopProps {
  className: string;
  children: ReactNode;
}

const formatToman = (n: number) => n.toLocaleString("en-US");

/**
 * "Buy us a coffee" entry point: a badge-styled button that opens the coffee
 * menu modal. Checkout posts to the personal gateway configured via
 * VITE_PAYMENT_GATEWAY_URL; until the gateway is provisioned the modal shows
 * an honest notice instead of pretending to charge.
 */
export default function CoffeeShop({ className, children }: CoffeeShopProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const label = t("shop.buttonLabel");
  const gatewayReady =
    String(PAYMENT_GATEWAY_URL ?? "").trim().length > 0 ||
    String(ZIBAL_MERCHANT ?? "").trim().length > 0;

  return (
    <>
      <button
        type="button"
        className={className}
        aria-label={label}
        title={label}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <CoffeeIcon aria-hidden="true" style={{ marginInlineEnd: 6 }} />
        {children}
      </button>
      {open ? (
        <CoffeeShopModal gatewayReady={gatewayReady} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

function CoffeeShopModal({
  gatewayReady,
  onClose,
}: {
  gatewayReady: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [item, setItem] = useState<CoffeeItem>(COFFEE_MENU[1]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const { status, result, submit, reset } = useCoffeeCheckout();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const busy = status === "busy";
  const done = status === "success";

  const pay = () => {
    void submit({
      item: item.id,
      amount: item.priceToman,
      currency: "IRT",
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      page: "rasamap",
    });
  };

  return createPortal(
    <div className="donate-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="donate-modal coffee-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="coffee-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="donate-modal-close"
          onClick={onClose}
          aria-label={t("shell.common.close")}
        >
          <CloseIcon />
        </button>
        <h2 className="donate-modal-title" id="coffee-modal-title">
          {t("shop.title")}
        </h2>
        <p className="donate-modal-intro">{t("shop.subtitle")}</p>

        {!gatewayReady ? (
          <p className="coffee-notice">{t("shop.gatewayPending")}</p>
        ) : null}

        {done ? (
          <div className="coffee-success">
            <p className="coffee-success-text">
              {result?.sandbox ? t("shop.successSandbox") : t("shop.success")}
            </p>
            {result?.message && result.message !== "gateway_missing" ? (
              <p className="coffee-notice">{result.message}</p>
            ) : null}
            <button type="button" className="donate-modal-link coffee-again" onClick={reset}>
              {t("shop.orderAnother")}
            </button>
          </div>
        ) : (
          <>
            <ul className="coffee-menu" role="radiogroup" aria-label={t("shop.menuLabel")}>
              {COFFEE_MENU.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={item.id === entry.id}
                    className={`coffee-item${item.id === entry.id ? " coffee-item--active" : ""}`}
                    onClick={() => setItem(entry)}
                    disabled={busy}
                  >
                    <span className="coffee-item-name">{t(entry.nameKey)}</span>
                    <span className="coffee-item-desc">{t(entry.descKey)}</span>
                    <span className="coffee-item-price">
                      {formatToman(entry.priceToman)} {t("shop.currency")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <form
              className="lead-form coffee-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (gatewayReady) pay();
              }}
            >
              <input
                className="lead-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("export.lead.name")}
                autoComplete="name"
              />
              <input
                className="lead-input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("export.lead.phone")}
                autoComplete="tel"
                required
              />
              <input
                className="lead-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("export.lead.email")}
                autoComplete="email"
              />

              {status === "error" ? (
                <p className="coffee-notice coffee-notice--error">
                  {result?.message === "gateway_missing"
                    ? t("shop.gatewayPending")
                    : result?.message === "network_error"
                      ? t("shop.errorNetwork")
                      : t("shop.errorGeneric")}
                </p>
              ) : null}

              <button
                type="submit"
                className="support-modal__instagram coffee-pay"
                disabled={busy || !gatewayReady || !phone.trim()}
              >
                {busy ? <LoaderIcon className="coffee-spinner" aria-hidden="true" /> : null}
                {busy
                  ? t("shop.processing")
                  : `${t("shop.pay")} — ${formatToman(item.priceToman)} ${t("shop.currency")}`}
              </button>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
