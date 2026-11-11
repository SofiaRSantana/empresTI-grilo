import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  timeout: 90_000,
  use: {
    baseURL: "http://127.0.0.1:3315",
    browserName: "chromium",
    channel: process.env.EMPRESTI_TEST_BROWSER_CHANNEL,
  },
});
