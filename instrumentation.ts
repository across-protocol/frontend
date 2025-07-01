import { registerOTel } from "@vercel/otel";

const serviceName = "Across API";

export function register() {
  registerOTel({
    serviceName,
  });
}
