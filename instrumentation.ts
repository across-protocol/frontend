import { registerOTel } from "@vercel/otel";

registerOTel({
  serviceName: "app-frontend-v3",
});
