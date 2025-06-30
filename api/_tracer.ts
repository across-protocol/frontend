import { trace } from "@opentelemetry/api";

const serviceName =
  process.env.VERCEL_ENV === "production"
    ? "app.across.to"
    : process.env.VERCEL_URL || "preview";

export function getTracer() {
  return trace.getTracer(serviceName);
}
