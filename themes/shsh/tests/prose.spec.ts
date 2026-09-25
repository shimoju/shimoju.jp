import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText(text: string) {
          document.documentElement.dataset.copied = text;
          if (document.documentElement.dataset.failCopy) return Promise.reject(new Error("Denied"));
          return Promise.resolve();
        },
      },
    });
  });
});

test("code tokens follow both palettes without site highlighting configuration", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/specimen/");
  const blocks = page.locator(".code-block");
  await expect(blocks).toHaveCount(5);
  await expect(blocks.locator("pre:not(.chroma), [style]")).toHaveCount(0);
  const code = blocks.first();
  const string = code.locator(".s2");
  await expect(string).toHaveText('"Hello & <world>"');
  await expect(code.locator("pre")).toHaveCSS("background-color", "rgb(239, 241, 245)");
  await expect(string).toHaveCSS("color", "rgb(64, 160, 43)");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(code.locator("pre")).toHaveCSS("background-color", "rgb(30, 30, 46)");
  await expect(string).toHaveCSS("color", "rgb(166, 227, 161)");
});

test("copy preserves code with Japanese, inline/table numbers, unknown language and no label", async ({
  page,
}) => {
  await page.goto("/specimen/?copy=failure");
  const expected = [
    '# 日本語コメント\nputs "Hello & <world>"',
    '# config.toml — 行番号と強調行の確認\n[tools]\nruby = "3.4"\nnode = "24"',
    "日本語の一行目\nSecond line",
    "言語なし\nABCDEFGHIJKLMNOPQRSTUVWXYZ/abcdefghijklmnopqrstuvwxyz/ABCDEFGHIJKLMNOPQRSTUVWXYZ/abcdefghijklmnopqrstuvwxyz/ABCDEFGHIJKLMNOPQRSTUVWXYZ/abcdefghijklmnopqrstuvwxyz",
    "未知の言語 & <sample>",
  ];
  await expect(page.locator(".code-label")).toHaveText(["config.toml", "table.txt", "example.txt"]);
  for (const index of [0, 3])
    await expect(page.locator(".code-block").nth(index).locator(".code-label")).toHaveCount(0);
  await expect(page.locator(".code-block").nth(1).locator(".hl")).toHaveCount(1);
  for (const [i, code] of expected.entries()) {
    const block = page.locator(".code-block").nth(i);
    await block.hover();
    await block.getByRole("button").click();
    await expect(page.locator("html")).toHaveAttribute("data-copied", code);
    await expect(block.getByRole("button")).toHaveAccessibleName("Copied");
    await expect(block.getByRole("status")).toHaveText("Code copied.");
  }
});

test("failed copy announces manual fallback, permits retry, and resets success after three seconds", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-09-17T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-09-17T00:00:01Z"));
  await page.goto("/specimen/");
  const block = page.locator(".code-block").first();
  await page.evaluate(() => {
    document.documentElement.dataset.failCopy = "true";
  });
  await block.hover();
  await block.getByRole("button").click();
  await expect(block.getByRole("button")).toBeEnabled();
  await expect(block.getByRole("status")).toHaveText(
    "Copy failed. Select the code and copy it manually, or retry.",
  );
  await page.evaluate(() => {
    delete document.documentElement.dataset.failCopy;
  });
  await block.getByRole("button").click();
  await page.clock.fastForward(2999);
  await expect(block.getByRole("button")).toHaveAccessibleName("Copied");
  await page.clock.fastForward(1);
  await expect(block.getByRole("button")).toHaveAccessibleName("Copy code");
  await expect(block.getByRole("status")).toBeEmpty();
});

test("keyboard reveals copy and Escape returns focus to selectable code", async ({
  page,
  browserName,
}) => {
  await page.goto("/specimen/");
  const button = page.locator(".copy").first();
  for (let i = 0; i < 35; i++) {
    if (await button.evaluate((element) => element === document.activeElement)) break;
    await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
  }
  await expect(button).toBeFocused();
  await expect(button).toHaveCSS("opacity", "1");
  await page.keyboard.press("Escape");
  await expect(button).toHaveCSS("opacity", "0");
  await expect(page.locator(".code-block").first().locator("pre")).toBeFocused();
  await page.keyboard.press(browserName === "webkit" ? "Shift+Alt+Tab" : "Shift+Tab");
  await expect(button).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(button).toHaveAccessibleName("Copied");
});

test("touch reveals copy, outside tap and horizontal scroll dismiss it", async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 400, height: 800 },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4174/specimen/");
  const block = page.locator(".code-block").nth(3);
  await block.locator("pre").tap();
  await expect(block.getByRole("button")).toHaveCSS("opacity", "1");
  await block.locator("pre").evaluate((element) => {
    element.scrollLeft = 100;
  });
  await expect(block.getByRole("button")).toHaveCSS("opacity", "0");
  await block.locator("pre").tap();
  await expect(block.getByRole("button")).toHaveCSS("opacity", "1");
  await page.locator("h1").tap();
  await expect(block.getByRole("button")).toHaveCSS("opacity", "0");
  await context.close();
});

test("the first tap on a revealed copy button copies exactly once", async ({
  browser,
  browserName,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: browserName !== "firefox",
    viewport: { width: 400, height: 800 },
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText(text: string) {
          const data = document.documentElement.dataset;
          data.copied = text;
          data.copyCalls = String(Number(data.copyCalls ?? 0) + 1);
          return Promise.resolve();
        },
      },
    });
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4174/specimen/");
  const block = page.locator(".code-block").first();
  const pre = block.locator("pre");
  const button = block.getByRole("button");
  await pre.tap();
  await expect(button).toHaveCSS("opacity", "1");
  await button.tap();
  await expect(page.locator("html")).toHaveAttribute("data-copy-calls", "1");
  await expect(page.locator("html")).toHaveAttribute(
    "data-copied",
    '# 日本語コメント\nputs "Hello & <world>"',
  );
  await expect(button).toHaveAccessibleName("Copied");
  await page.locator("h1").tap();
  await expect(button).toHaveCSS("opacity", "0");
  await pre.tap();
  await button.tap();
  await expect(page.locator("html")).toHaveAttribute("data-copy-calls", "2");
  await expect(button).toHaveAccessibleName("Copied");
  await context.close();
});

test("prose remains readable; footnotes, headings, dates and JS-free reading work", async ({
  page,
  browser,
}) => {
  for (const width of [1280, 400]) {
    await page.setViewportSize({ width, height: 900 });
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      await page.goto("/specimen/");
      await expect(page.locator(".prose")).toHaveCSS("font-size", "17px");
      await expect(page.locator(".code-block pre").first()).toHaveCSS("line-height", "19.6px");
      await expect(page.locator(".prose th").first()).toHaveCSS("font-weight", "700");
      const viewport = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      // A reserved scrollbar gutter can make scrollWidth smaller than clientWidth.
      // Only content wider than the viewport is horizontal overflow.
      expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
      if (width === 400)
        expect(
          await page
            .locator(".table-scroll")
            .nth(1)
            .evaluate((element) => element.scrollWidth > element.clientWidth),
        ).toBe(true);
      const result = await new AxeBuilder({ page }).analyze();
      for (const violation of result.violations) {
        expect(violation.id).toBe("color-contrast");
        for (const node of violation.nodes)
          for (const target of node.target) {
            expect(
              await page
                .locator(String(target))
                .evaluate((element) => Boolean(element.closest(".chroma"))),
            ).toBe(true);
          }
      }
      await test.info().attach(`prose-axe-${width}-${colorScheme}`, {
        body: JSON.stringify(result.violations),
        contentType: "application/json",
      });
    }
  }
  await expect(page.locator(".article-header .meta")).toHaveText("2026/09/02 Updated 2026/09/03");
  // The anchor glyph lives in CSS so plain-text summaries never see a "#".
  const heading = page.locator(".prose h2").first();
  const anchor = heading.locator(".heading-anchor");
  expect(await heading.textContent()).not.toContain("#");
  await expect(anchor).toHaveText("");
  await expect(anchor).toHaveAttribute("aria-label", /^Link to /);
  expect(await anchor.evaluate((element) => getComputedStyle(element, "::before").content)).toBe(
    '"#"',
  );
  await heading.hover();
  await expect(anchor).toHaveCSS("opacity", "1");
  await page.locator('a[href="#fn:1"]').click();
  await expect(page).toHaveURL(/#fn:1$/);
  await page.locator(".footnote-backref").click();
  await expect(page).toHaveURL(/#fnref:1$/);
  const noJS = await browser.newContext({ javaScriptEnabled: false });
  const plain = await noJS.newPage();
  await plain.goto("http://127.0.0.1:4174/specimen/");
  await expect(plain.locator(".copy, .copy-feedback")).toHaveCount(0);
  await expect(plain.locator("pre").first()).toContainText("日本語コメント");
  await noJS.close();
});
