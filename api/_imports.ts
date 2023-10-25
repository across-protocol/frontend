import * as fetch from "node-fetch";

if (!globalThis.fetch) {
  (globalThis as any).fetch = fetch;
}
