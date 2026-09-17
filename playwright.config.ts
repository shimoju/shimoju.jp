import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

// macOS 27 protects the user's Firefox app data even with a separate -profile.
// Keep automation data in this checkout; no access to personal profiles needed.
// https://bugzilla.mozilla.org/show_bug.cgi?id=2060476#c7
const firefoxAppData = resolve(".cache/firefox-app-data");
mkdirSync(firefoxAppData, { recursive: true });
const firefoxEnv = Object.fromEntries(
  Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined),
);
firefoxEnv.MOZ_APP_DATA = firefoxAppData;

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"], launchOptions: { env: firefoxEnv } } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
