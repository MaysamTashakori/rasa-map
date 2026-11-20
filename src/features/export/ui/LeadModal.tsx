import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { LEAD_ENDPOINT } from "@/core/config";
import { CloseIcon } from "@/shared/ui/Icons";
import { trackEvent } from "@/shared/utils/analytics";
import { LEAD_DONE_EVENT } from "../application/useExport";

interface LeadModalProps {
  onClose: () => void;
}

/**
 * One-time contact capture before the first download.
 * Submitting or skipping both resolve the export gate; the lead is
 * POSTed to VITE_LEAD_ENDPOINT when configured (otherwise kept local).
 */
export default function LeadModal({ onClose }: LeadModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const finish = async (skipped: boolean) => {
    if (busy) return;
    setBusy(true);
    if (!skipped) {
      const lead = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        page: "rasamap",
      };
      trackEvent("lead_submit", { has_phone: Boolean(lead.phone), has_email: Boolean(lead.email) });
      const endpoint = String(LEAD_ENDPOINT ?? "").trim();
      if (endpoint) {
        try {
          await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(lead),
          });
        } catch {
          // Endpoint unreachable — the download must not be blocked by it.
        }
      }
    } else {
      trackEvent("lead_skip");
    }
    window.dispatchEvent(new CustomEvent(LEAD_DONE_EVENT));
    onClose();
  };

  return createPortal(
    <div className="picker-modal-backdrop" role="presentation" onClick={() => void finish(true)}>
      <div
        className="picker-modal support-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="support-modal__close"
          onClick={() => void finish(true)}
          aria-label={t("export.lead.close")}
        >
          <CloseIcon />
        </button>
        <div className="support-modal__body">
          <p className="support-modal__headline" id="lead-modal-title">
            {t("export.lead.headline")}
          </p>
          <p className="support-modal__text">{t("export.lead.text")}</p>
          <form
            className="lead-form"
            onSubmit={(event) => {
              event.preventDefault();
              void finish(false);
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
            <div className="support-modal__actions">
              <button type="submit" className="support-modal__instagram" disabled={busy}>
                {t("export.lead.submit")}
              </button>
              <button
                type="button"
                className="support-modal__dismiss"
                onClick={() => void finish(true)}
                disabled={busy}
              >
                {t("export.lead.skip")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}
