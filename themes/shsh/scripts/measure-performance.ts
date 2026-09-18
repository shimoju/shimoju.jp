import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { cpus, release } from "node:os";
import { setTimeout as delay } from "node:timers/promises";
import { gzipSync } from "node:zlib";
import { chromium } from "@playwright/test";

// Explicit live lab measurement. This is independent of the normal offline CI.
const pilot = process.argv.includes("--pilot");
const runs = pilot ? 1 : 5;
const destination = `docs/verification/t016${pilot ? "-pilot" : ""}`;
mkdirSync(destination, { recursive: true });
const conditions = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  cpuSlowdown: 4,
  latency: 150,
  downloadThroughput: 1_600_000 / 8,
  uploadThroughput: 750_000 / 8,
  observationMilliseconds: 20_000,
  colorScheme: "light",
  userAgent: "Android 13 / Pixel 7 / Chromium version of the running binary; mobile emulation",
  cache: "new browser/context per run; cache disabled",
  host: `${process.platform}/${process.arch} ${release()} ${cpus()[0]?.model}`,
};
const cases = [
  { name: "without-embed", path: "/2026/09/01/development-environment-2026/", embed: false },
  { name: "with-x-embed", path: "/2016/07/30/tochijisen/", embed: true },
];
interface Metrics {
  lcp: { startTime: number; size: number; url: string; element: string }[];
  shifts: { startTime: number; value: number; recentInput: boolean; nodes: string[] }[];
}
interface TraceEvent {
  name: string;
  ts: number;
  args?: {
    data?: {
      weighted_score_delta?: number;
      is_main_frame?: boolean;
      had_recent_input?: boolean;
      [key: string]: unknown;
    };
  };
}
function cls(events: { time: number; value: number }[]) {
  let first = -Infinity,
    previous = -Infinity,
    sum = 0,
    maximum = 0;
  for (const event of [...events].sort((a, b) => a.time - b.time)) {
    if (event.time - first > 5000 || event.time - previous > 1000) {
      first = event.time;
      sum = 0;
    }
    sum += event.value;
    previous = event.time;
    maximum = Math.max(maximum, sum);
  }
  return maximum;
}
// Independent boundary checks for session-window accumulation.
assert.equal(
  cls([
    { time: 0, value: 0.05 },
    { time: 500, value: 0.06 },
    { time: 1600, value: 0.02 },
  ]),
  0.11,
);
assert.equal(
  cls(Array.from({ length: 7 }, (_, i) => ({ time: i * 900, value: 0.01 }))).toFixed(2),
  "0.06",
);
const server = spawn(process.execPath, ["scripts/serve-fixtures.mjs"], {
  stdio: ["ignore", "pipe", "pipe"],
});
let serverError = "";
server.stderr.on("data", (data: Buffer) => {
  serverError += data.toString();
});
const results: unknown[] = [];
let failed = false;
try {
  let ready = false;
  for (let n = 0; n < 100; n++) {
    if (server.exitCode !== null) throw new Error(serverError);
    try {
      ready = (await fetch("http://127.0.0.1:4198/")).ok;
    } catch {
      /* Server startup. */
    }
    if (ready) break;
    await delay(50);
  }
  assert.ok(ready, "Live fixture server ready");
  // Alternate the two cases to avoid measuring one group exclusively at a different time.
  for (let trial = 1; trial <= runs; trial++)
    for (const scenario of cases) {
      const browser = await chromium.launch();
      try {
        const context = await browser.newContext({
          viewport: conditions.viewport,
          deviceScaleFactor: 3,
          isMobile: true,
          hasTouch: true,
          colorScheme: "light",
          locale: "ja-JP",
          userAgent: `Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browser.version()} Mobile Safari/537.36`,
        });
        const page = await context.newPage();
        await page.addInitScript(() => {
          const state: Metrics = { lcp: [], shifts: [] };
          Object.assign(window, { __shshPerformance: state });
          const label = (element: Element | null | undefined) =>
            element ? `${element.tagName.toLowerCase()}.${element.className}` : "";
          new PerformanceObserver((list) => {
            for (const item of list.getEntries()) {
              const entry = item as PerformanceEntry & {
                size: number;
                url: string;
                element: Element | null;
              };
              state.lcp.push({
                startTime: entry.startTime,
                size: entry.size,
                url: entry.url,
                element: label(entry.element),
              });
            }
          }).observe({ type: "largest-contentful-paint", buffered: true });
          new PerformanceObserver((list) => {
            for (const item of list.getEntries()) {
              const entry = item as PerformanceEntry & {
                value: number;
                hadRecentInput: boolean;
                sources?: { node: Element }[];
              };
              state.shifts.push({
                startTime: entry.startTime,
                value: entry.value,
                recentInput: entry.hadRecentInput,
                nodes: entry.sources?.map((s) => label(s.node)) ?? [],
              });
            }
          }).observe({ type: "layout-shift", buffered: true });
        });
        const cdp = await context.newCDPSession(page);
        await cdp.send("Network.enable");
        await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
        await cdp.send("Network.setBypassServiceWorker", { bypass: true });
        await cdp.send("Network.emulateNetworkConditions", {
          offline: false,
          latency: conditions.latency,
          downloadThroughput: conditions.downloadThroughput,
          uploadThroughput: conditions.uploadThroughput,
          connectionType: "cellular4g",
        });
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: conditions.cpuSlowdown });
        const errors: { url: string; error: string | undefined }[] = [];
        const responses: { url: string; status: number }[] = [];
        const clean = (url: string) => {
          const value = new URL(url);
          return value.origin + value.pathname;
        };
        page.on("requestfailed", (request) =>
          errors.push({ url: clean(request.url()), error: request.failure()?.errorText }),
        );
        page.on("response", (response) =>
          responses.push({ url: clean(response.url()), status: response.status() }),
        );
        await cdp.send("Tracing.start", {
          categories:
            "-*,devtools.timeline,loading,blink.user_timing,disabled-by-default-devtools.timeline",
          transferMode: "ReturnAsStream",
        });
        const started = performance.now();
        const response = await page.goto(`http://127.0.0.1:4198${scenario.path}`, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
        await delay(
          Math.max(0, conditions.observationMilliseconds - (performance.now() - started)),
        );
        const metrics = await page.evaluate(
          () => (window as unknown as Window & { __shshPerformance: Metrics }).__shshPerformance,
        );
        const navigation = await page.evaluate(() =>
          performance.getEntriesByType("navigation")[0]?.toJSON(),
        );
        const traceReady = new Promise<string>((resolve) =>
          cdp.once("Tracing.tracingComplete", (event) => resolve(event.stream!)),
        );
        await cdp.send("Tracing.end");
        const stream = await traceReady;
        let json = "";
        for (;;) {
          const chunk = await cdp.send("IO.read", { handle: stream });
          json += chunk.base64Encoded
            ? Buffer.from(chunk.data, "base64").toString("utf8")
            : chunk.data;
          if (chunk.eof) break;
        }
        await cdp.send("IO.close", { handle: stream });
        writeFileSync(`${destination}/${scenario.name}-${trial}.trace.json.gz`, gzipSync(json));
        const trace = JSON.parse(json) as { traceEvents: TraceEvent[] };
        const shifts = trace.traceEvents
          .filter(
            (e) =>
              e.name === "LayoutShift" && typeof e.args?.data?.weighted_score_delta === "number",
          )
          .map((e) => ({
            time: e.ts / 1000,
            value: e.args!.data!.weighted_score_delta!,
            mainFrame: e.args!.data!.is_main_frame,
            recentInput: e.args!.data!.had_recent_input,
          }));
        // No input occurs during measurement. Includes viewport-emulation shifts and all frame weights.
        const allFrameCLS = cls(shifts);
        const mainFrameCLS = cls(shifts.filter((e) => e.mainFrame));
        const lcp = metrics.lcp.at(-1)?.startTime;
        const frame = page.frames().find((f) => f.url().includes("/embed/Tweet.html"));
        const widgetText = frame
          ? await frame
              .locator("body")
              .innerText({ timeout: 2000 })
              .catch(() => "")
          : "";
        const widgetVisible = await page
          .locator("iframe[src*='/embed/Tweet.html']")
          .isVisible()
          .catch(() => false);
        const valid =
          response?.status() === 200 &&
          lcp !== undefined &&
          (!scenario.embed || (widgetVisible && widgetText.trim().length > 0));
        const meetsTarget = valid && lcp! <= 2500 && allFrameCLS <= 0.1;
        if (!meetsTarget) failed = true;
        await page.screenshot({ path: `${destination}/${scenario.name}-${trial}.png` });
        const result = {
          scenario: scenario.name,
          path: scenario.path,
          trial,
          recordedAt: new Date().toISOString(),
          browser: browser.version(),
          status: response?.status(),
          valid,
          meetsTarget,
          lcpMilliseconds: lcp,
          cls: allFrameCLS,
          mainFrameCLS,
          observerCLS: cls(
            metrics.shifts
              .filter((s) => !s.recentInput)
              .map((s) => ({ time: s.startTime, value: s.value })),
          ),
          metrics,
          traceShifts: shifts,
          navigation,
          widgetVisible,
          widgetText: widgetText.slice(0, 1000),
          responses,
          errors,
        };
        results.push(result);
        writeFileSync(
          `${destination}/results.json`,
          JSON.stringify({ conditions, runs, results }, null, 2),
        );
        console.log(
          `${scenario.name} ${trial}/${runs}: LCP=${lcp?.toFixed(0)}ms CLS=${allFrameCLS.toFixed(4)} valid=${valid} target=${meetsTarget}`,
        );
      } finally {
        await browser.close();
      }
    }
} finally {
  server.kill("SIGTERM");
}
if (failed) process.exitCode = 1;
