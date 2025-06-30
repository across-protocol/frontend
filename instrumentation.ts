import { registerOTel } from "@vercel/otel";

const environment = process.env.VERCEL_ENV;
const serviceName = "app.across.to";
const version = process.env.VERCEL_GIT_COMMIT_SHA;

registerOTel({
  serviceName,
  attributes: {
    env: environment,
    "deployment.environment": environment,
    "deployment.environment.name": environment,
    service: serviceName,
    "service.version": version,
    version: version,
  },
});
