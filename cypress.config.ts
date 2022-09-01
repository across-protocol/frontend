import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    // Override by setting `CYPRESS_BASE_URL`
    baseUrl: "http://localhost:3000",
    // Allow more time for a timeout to avoid using cy.wait();
    defaultCommandTimeout: 10000,
  },
});
