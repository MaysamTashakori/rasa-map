#!/usr/bin/env node
/**
 * rasa-map — serve the built Rasa Map studio locally.
 * Usage: npx rasa-map [port]   (default port 4173)
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../dist", import.meta.url));
const port = Number(process.argv[2]) || Number(process.env.PORT) || 4173;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    let path = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, "");
    let file = join(root, path);
    if (!file.startsWith(root)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    let body;
    try {
      body = await readFile(file);
    } catch {
      // SPA fallback: unknown paths serve index.html
      body = await readFile(join(root, "index.html"));
      res.writeHead(200, { "Content-Type": MIME[".html"], "Cache-Control": "no-cache" });
      res.end(body);
      return;
    }
    const type = MIME[extname(file).toLowerCase()] ?? "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(body);
  } catch {
    res.writeHead(500).end("Server error");
  }
}).listen(port, () => {
  console.log(`Rasa Map → http://localhost:${port}`);
});
