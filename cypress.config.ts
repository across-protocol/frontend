import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    // Override by setting `CYPRESS_BASE_URL`
    baseUrl: "http://localhost:3000",
  },
});
