import { defineConfig } from "@playwright/test";

export default defineConfig({
  testMatch: ["**/tests.spec.ts", "**/generate-directory.ts"],
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: "npx serve apps -l 3000",
    port: 3000,
    reuseExistingServer: true,
  },
});
