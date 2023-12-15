import * as fetch from "node-fetch";

// Required for @vercel/kv
if (!globalThis.fetch) {
  (globalThis as any).fetch = fetch;
}

export {};
