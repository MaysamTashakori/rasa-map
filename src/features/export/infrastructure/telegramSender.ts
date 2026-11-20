import type { IHttp } from "@/core/http";

/**
 * Sends an exported poster file to Telegram through the companion bot
 * endpoint (server/telegram-bot.mjs or any compatible relay). The bot token
 * never reaches the client — the endpoint holds it server-side.
 *
 * Endpoint contract:
 *   POST {endpoint}  JSON { fileName, mime, dataBase64, caption }
 *   → { ok: true } | { ok: false, message }
 */

export interface TelegramSendResult {
  ok: boolean;
  message?: string;
}

export function createTelegramSender(http: IHttp, endpoint: string) {
  const url = endpoint.trim();

  return {
    async sendFile(
      blob: Blob,
      fileName: string,
      caption = "",
    ): Promise<TelegramSendResult> {
      if (!url) return { ok: false, message: "telegram_not_configured" };

      const buffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      const CHUNK = 0x8000;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
      }

      try {
        const res = await http.post(
          url,
          JSON.stringify({
            fileName,
            mime: blob.type || "application/octet-stream",
            dataBase64: btoa(binary),
            caption,
          }),
          { headers: { "Content-Type": "application/json" } },
        );
        const text = await res.text();
        try {
          const json = JSON.parse(text) as { ok?: boolean; message?: string };
          return { ok: json.ok === true, message: json.message };
        } catch {
          return res.ok
            ? { ok: true }
            : { ok: false, message: `telegram_http_${res.status}` };
        }
      } catch {
        return { ok: false, message: "network_error" };
      }
    },
  };
}
