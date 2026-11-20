import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { APP_VERSION, RASATO_URL, SOCIAL_INSTAGRAM } from "@/core/config";
import { CloseIcon, InstagramIcon } from "@/shared/ui/Icons";
import { trackEvent } from "@/shared/utils/analytics";
import type { SupportPromptVariant } from "../application/useExport";

/** Closes by itself after this long, unless the user touches it. */
const AUTO_CLOSE_MS = 10_000;

interface SupportModalProps {
  posterNumber: number;
  /** "videoGuide" until the guide is opened, then "follow". */
  variant?: SupportPromptVariant;
  onClose: () => void;
  titleId?: string;
}

export default function SupportModal({
  posterNumber,
  onClose,
  titleId = "export-support-modal-title",
}: SupportModalProps) {
  const { t } = useTranslation();
  const instagramUrl = String(SOCIAL_INSTAGRAM ?? "").trim();
  const trackParams = {
    source: "download_modal",
    download_number: posterNumber,
    app_release: APP_VERSION,
  };

  // A timed close is not the user's choice, so it doesn't count as closing
  // the video guide. Any touch or hover on the window stops the timer.
  const timerRef = useRef<number | null>(null);
  const stopAutoClose = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  useEffect(() => {
    timerRef.current = window.setTimeout(onClose, AUTO_CLOSE_MS);
    return stopAutoClose;
  }, []);

  const handleClose = () => {
    onClose();
  };

  return createPortal(
    <div
      className="picker-modal-backdrop"
      role="presentation"
      onClick={handleClose}
    >
      <div
        className="picker-modal support-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        onPointerEnter={stopAutoClose}
        onPointerDown={stopAutoClose}
        onFocus={stopAutoClose}
      >
        <button
          type="button"
          className="support-modal__close"
          onClick={handleClose}
          aria-label={t("export.support.close")}
        >
          <CloseIcon />
        </button>
        <div className="support-modal__body">
          <p className="support-modal__headline" id={titleId}>
            {t("export.support.headline")}
          </p>
          <p className="support-modal__text">{t("export.support.text")}</p>
          {RASATO_URL ? (
            <div className="support-modal__rasato">
              <p className="support-modal__rasato-text">
                {t("export.support.rasatoText")}
              </p>
              <a
                className="support-modal__rasato-link"
                href={RASATO_URL}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  trackEvent("rasato_click", { ...trackParams, source: "support_modal" })
                }
              >
                {t("export.support.rasatoCta")}
              </a>
            </div>
          ) : null}
          <div className="support-modal__actions">
            {instagramUrl ? (
              <a
                className="support-modal__instagram"
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackEvent("follow_click", trackParams)}
              >
                <InstagramIcon /> {t("export.support.followUs")}
              </a>
            ) : (
              <button
                type="button"
                className="support-modal__dismiss"
                onClick={handleClose}
              >
                {t("export.support.close")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
