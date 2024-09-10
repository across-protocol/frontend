import { registerOTel } from "@vercel/otel";

export function register() {
  registerOTel({ serviceName: process.env.VERCEL_URL });
}
