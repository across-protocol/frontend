import { registerOTel } from "@vercel/otel";
import {
  SimpleSpanProcessor,
  ConsoleSpanExporter,
} from "@opentelemetry/sdk-trace-base";

registerOTel({
  serviceName: "app-frontend-v3",
  spanProcessors: [new SimpleSpanProcessor(new ConsoleSpanExporter())],
});
