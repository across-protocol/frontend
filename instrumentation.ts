import { registerOTel } from "@vercel/otel";

const serviceName = "app.across.to";

registerOTel({
  serviceName,
});
