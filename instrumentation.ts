import { registerOTel } from "@vercel/otel";

const serviceName =
  process.env.VERCEL_ENV === "production"
    ? "app.across.to"
    : process.env.VERCEL_URL || "preview";

registerOTel({ serviceName });
