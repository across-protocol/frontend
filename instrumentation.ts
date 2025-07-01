import { registerOTel } from "@vercel/otel";

const serviceName = "app-frontend-v3";

export function register() {
  registerOTel({
    serviceName,
  });
}
