/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string;
  readonly VITE_UPDATES_URL?: string;
  readonly VITE_REPO_URL?: string;
  readonly VITE_REPO_API_URL?: string;
  readonly VITE_CONTACT_EMAIL?: string;
  readonly VITE_LEGAL_NOTICE_URL?: string;
  readonly VITE_PRIVACY_URL?: string;
  readonly VITE_SOCIAL_LINKEDIN?: string;
  readonly VITE_SOCIAL_INSTAGRAM?: string;
  readonly VITE_SOCIAL_REDDIT?: string;
  readonly VITE_SOCIAL_THREADS?: string;
  readonly VITE_SOCIAL_TELEGRAM?: string;
  readonly VITE_LEAD_ENDPOINT?: string;
  readonly VITE_PAYMENT_GATEWAY_URL?: string;
  readonly VITE_PAYMENT_GATEWAY_TOKEN?: string;
  readonly VITE_ZIBAL_MERCHANT?: string;
  readonly VITE_KOFI_URL?: string;
  readonly VITE_DONATION_LINKS?: string;
  readonly VITE_APP_CREDIT_URL?: string;
  readonly VITE_DEVELOPER_NAME?: string;
  readonly VITE_DEVELOPER_PROFILE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
