import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium, firefox, webkit } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { resolve } from "node:path";

mkdirSync("docs/verification/t026/images", { recursive: true });
const results: unknown[] = [];
for (const [name, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
  ["webkit", webkit],
] as const) {
  const browser = await engine.launch(
    name === "firefox"
      ? {
          env: {
            ...Object.fromEntries(
              Object.entries(process.env).filter(
                (entry): entry is [string, string] => entry[1] !== undefined,
              ),
            ),
            MOZ_APP_DATA: resolve(".cache/firefox-app-data"),
          },
        }
      : {},
  );
  try {
    for (const width of [1440, 390])
      for (const color of ["light", "dark"] as const) {
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          colorScheme: color,
        });
        const page = await context.newPage();
        await page.route("https://**/*", (route) => route.abort());
        for (const [side, port] of [
          ["current", 4211],
          ["approved", 4213],
        ] as const) {
          await page.goto(`http://127.0.0.1:${port}/about/`);
          await page.evaluate(() => document.fonts.ready);
          const table = page.locator(".prose table").first();
          const headers = await table.locator("th").allTextContents();
          assert.deepEqual(headers, ["業務経験", "技術", "経験年数"]);
          const axe = await new AxeBuilder({ page }).analyze();
          const violations = axe.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => n.target),
          }));
          assert.deepEqual(violations, []);
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          );
          assert.equal(overflow, false);
          if (name === "chromium")
            await table.screenshot({
              path: `docs/verification/t026/images/about-${width}-${color}-${side}.png`,
            });
          results.push({ browser: name, width, color, side, headers, violations, overflow });
        }
        await context.close();
      }
    if (name === "chromium") {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      await page.goto("http://127.0.0.1:4210/r002/");
      const links = await page
        .locator("a")
        .evaluateAll((nodes) => nodes.map((n) => (n as HTMLAnchorElement).href));
      for (const url of links) assert.equal((await page.request.get(url)).status(), 200, url);
      await page.screenshot({ path: "docs/verification/t026/review.png", fullPage: true });
      results.push({ reportLinks: links.length, status: "all 200" });
    }
  } finally {
    await browser.close();
  }
}
writeFileSync("docs/verification/t026/review-verification.json", JSON.stringify(results, null, 2));
console.log(
  "R002: 24 current/approved browser conditions checked; F014 headings and zero axe violations; review links reachable.",
);
