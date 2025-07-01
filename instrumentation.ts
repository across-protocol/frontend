import { registerOTel } from "@vercel/otel";

const serviceName = "across-api";

export function register() {
  registerOTel({
    serviceName,
  });
}
