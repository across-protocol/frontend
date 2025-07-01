import { registerOTel } from "@vercel/otel";

registerOTel({
  serviceName: process.env.VERCEL_URL,
});
