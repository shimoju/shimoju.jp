import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "@playwright/test";

// Explicit live verification only; never imported by the normal offline test suite.
const destination = "docs/verification/t012-live";
mkdirSync(destination, { recursive: true });
const server = spawn(process.execPath, ["scripts/serve-fixtures.mjs"], {
  stdio: ["ignore", "pipe", "pipe"],
});
let serverError = "";
server.stderr.on("data", (data: Buffer) => {
  serverError += data.toString();
});
const browser = await chromium.launch();
const results: unknown[] = [];
let failed = false;
try {
  let ready = false;
  for (let n = 0; n < 100; n++) {
    if (server.exitCode !== null) throw new Error(serverError);
    try {
      ready = (await fetch("http://127.0.0.1:4198/")).ok;
    } catch {
      /* Wait for our server only. */
    }
    if (ready) break;
    await delay(50);
  }
  if (!ready) throw new Error("Live fixture server did not become ready");
  for (const environment of ["production", "preview"])
    for (const [service, path, selector] of [
      ["x", "/2016/07/30/tochijisen/", "iframe[src*='/embed/Tweet.html']"],
      ["instagram", "/2016/08/01/tiritiri-curry/", "iframe.instagram-media-rendered"],
      ["youtube", "/2016/08/31/hiphop-music-video/", "iframe[src*='youtube.com']"],
      ["speakerdeck", "/2017/11/11/twelve-factor-app-on-heroku/", "iframe.speakerdeck-iframe"],
    ] as const) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      const responses: { url: string; status: number }[] = [];
      const failures: { url: string; error: string | undefined }[] = [];
      const clean = (url: string) => {
        const parsed = new URL(url);
        return parsed.origin + parsed.pathname;
      };
      page.on("response", (response) => {
        if (response.url().startsWith("https://"))
          responses.push({ url: clean(response.url()), status: response.status() });
      });
      page.on("requestfailed", (request) =>
        failures.push({ url: clean(request.url()), error: request.failure()?.errorText }),
      );
      const localURL = `http://127.0.0.1:${environment === "production" ? 4198 : 4199}${path}`;
      let error: string | undefined;
      await page.goto(localURL, { waitUntil: "domcontentloaded", timeout: 30000 });
      try {
        await page.locator(selector).waitFor({ state: "visible", timeout: 15000 });
        await page.locator(selector).scrollIntoViewIfNeeded();
      } catch (failure) {
        error = String(failure);
      }
      try {
        await page.waitForLoadState("networkidle", { timeout: 10000 });
      } catch {
        /* Long-lived third-party activity is recorded below. */
      }
      const frames = [];
      for (const frame of page.frames().filter((frame) => frame !== page.mainFrame())) {
        let text = "";
        try {
          text = (await frame.locator("body").innerText({ timeout: 1000 })).slice(0, 1500);
        } catch {
          /* An inaccessible/empty frame is not a verified display. */
        }
        frames.push({ url: clean(frame.url()), text });
      }
      await page.screenshot({
        path: `${destination}/${environment}-${service}.png`,
        fullPage: true,
      });
      if (await page.locator(selector).isVisible())
        await page.locator(selector).screenshot({
          path: `${destination}/${environment}-${service}-embed.png`,
        });
      const record = {
        environment,
        service,
        path,
        selector,
        visible: await page
          .locator(selector)
          .isVisible()
          .catch(() => false),
        error,
        responses,
        failures,
        frames,
        starContainers: await page.locator("[data-hatena-star-container]").count(),
        shareLinks: await page.locator(".share-icons a").count(),
        capturedAt: new Date().toISOString(),
      };
      results.push(record);
      if (!record.visible) failed = true;
      writeFileSync(
        `${destination}/results.json`,
        JSON.stringify(
          {
            environment: "macOS27; Chromium153; 390×844; fresh contexts; no service actions",
            results,
          },
          null,
          2,
        ),
      );
      console.log(
        `${environment}/${service}: frame=${record.visible}; responses=${responses.length}; failures=${failures.length}`,
      );
      await context.close();
    }
} finally {
  await browser.close();
  server.kill("SIGTERM");
}

if (failed) process.exitCode = 1;
