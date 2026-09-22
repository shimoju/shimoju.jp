import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

test("portrait and landscape keep the type scale while explicit text enlargement still works", async ({
  browser,
  browserName,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: browserName !== "firefox",
  });
  const page = await context.newPage();
  const sizes = () =>
    page
      .locator("body, .site-name, h1, .prose > p, .code-block pre")
      .evaluateAll((elements) =>
        elements.map((element) => parseFloat(getComputedStyle(element).fontSize)),
      );
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto("http://127.0.0.1:4174/specimen/");
    const baseline = await sizes();
    for (const scale of [1, 1.25, 2]) {
      await page.evaluate((value) => {
        document.documentElement.style.fontSize = `${62.5 * value}%`;
      }, scale);
      for (const viewport of [
        { width: 390, height: 844 },
        { width: 844, height: 390 },
        { width: 390, height: 844 },
      ]) {
        await page.setViewportSize(viewport);
        const actual = await sizes();
        for (const [index, size] of actual.entries())
          expect(size).toBeCloseTo(baseline[index]! * scale, 1);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
          ),
        ).toBe(true);
      }
    }
  }
  // Desktop WebKit automation does not implement iOS text autosizing.
  // These are layout/enlargement checks; physical iPhone rotation and pinch zoom remain separate.
  await context.close();
});

test("saved pref-theme is applied before styles load", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("pref-theme", "dark"));
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/*.css", async (route) => {
    await gate;
    await route.continue();
  });
  const navigation = page.goto("/");
  try {
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  } finally {
    release();
    await navigation;
  }
  await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute("content", "dark");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(24, 24, 37)");
  await expect(page.getByRole("button", { name: "Switch to light mode" })).toBeVisible();
});

test("OS follows until a keyboard choice, persists and ignores unsupported query parameters", async ({
  page,
  browserName,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/?theme=dark");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(24, 24, 37)");
  // Safari uses Option-Tab to include links and buttons when full keyboard access is off.
  await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
  await expect(page.locator(".theme-toggle")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await page.evaluate(() => localStorage.getItem("pref-theme"))).toBe("light");
  await page.emulateMedia({ colorScheme: "light" });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("link", { name: "About", exact: true }).click();
  await expect(page.getByRole("link", { name: "About", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("theme icon and label always offer the opposite visible color, including OS changes", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const button = page.locator(".theme-toggle");
  async function expectControl(mode: "light" | "dark") {
    const next = mode === "dark" ? "light" : "dark";
    await expect(button).toHaveAccessibleName(`Switch to ${next} mode`);
    await expect(button).toHaveAttribute("title", `Switch to ${next} mode`);
    await expect(button.locator(".sun")).toBeVisible({ visible: mode === "dark" });
    await expect(button.locator(".moon")).toBeVisible({ visible: mode === "light" });
  }
  await expectControl("light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expectControl("dark");
  await button.click();
  await expectControl("light");
  await page.emulateMedia({ colorScheme: "light" });
  await expectControl("light");
  // Even when the OS catches up with the pinned choice, one click changes color.
  await button.click();
  await expectControl("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await button.click();
  await expectControl("light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("invalid and unavailable storage retain OS fallback and allow a page-local choice", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, "getItem", {
      value() {
        throw new Error("Unavailable");
      },
    });
    Object.defineProperty(Storage.prototype, "setItem", {
      value() {
        throw new Error("Unavailable");
      },
    });
  });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/?theme=light");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");
  await page.locator(".theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "light" });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("invalid saved value uses OS preference", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("pref-theme", "unexpected"));
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");
});

test("without JavaScript both OS palettes, navigation and subscription remain usable", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: "dark" });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4174/");
  await expect(page.locator(".theme-toggle")).toBeHidden();
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(24, 24, 37)");
  await expect(page.locator(".chroma")).toHaveCSS("background-color", "rgb(30, 30, 46)");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(248, 249, 252)");
  await expect(page.locator(".chroma")).toHaveCSS("background-color", "rgb(239, 241, 245)");
  await page.getByRole("link", { name: "RSS", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:4174/index.xml");
  await context.close();
});

test("fallback CSS keeps OS and explicit palettes without light-dark support", async ({ page }) => {
  await page.route("http://127.0.0.1:4174/", async (route) => {
    const response = await route.fetch();
    // The modified test stylesheet intentionally differs from its production SRI hash.
    await route.fulfill({
      response,
      body: (await response.text()).replace(/ integrity="[^"]+"/g, ""),
    });
  });
  await page.route("**/*.css", async (route) => {
    const response = await route.fetch();
    const css = await response.text();
    // Exercise the generated fallback branch in current engines, not just source CSS.
    const fallback = /@supports not\s*\(color:\s*light-dark\(white,\s*black\)\)/g;
    expect(css).toMatch(fallback);
    await route.fulfill({ response, body: css.replace(fallback, "@supports (color: white)") });
  });
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  async function expectPalette(mode: "light" | "dark") {
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      mode === "light" ? "rgb(248, 249, 252)" : "rgb(24, 24, 37)",
    );
    await expect(page.locator("body")).toHaveCSS(
      "color",
      mode === "light" ? "rgb(76, 79, 105)" : "rgb(205, 214, 244)",
    );
    await expect(page.locator(".chroma").first()).toHaveCSS(
      "background-color",
      mode === "light" ? "rgb(239, 241, 245)" : "rgb(30, 30, 46)",
    );
  }
  await expectPalette("light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expectPalette("dark");
  await page.locator(".theme-toggle").click();
  await expectPalette("light");
  await page.emulateMedia({ colorScheme: "light" });
  await page.locator(".theme-toggle").click();
  await expectPalette("dark");
  await page.reload();
  await expectPalette("dark");
});

test("shared shell keeps readable dimensions at desktop and mobile widths in both palettes", async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      await page.goto("/");
      await expect(page.locator("body")).toHaveCSS("font-size", "17px");
      await expect(page.locator(".site-name")).toHaveCSS("font-weight", "300");
      await expect(page.locator(".theme-toggle")).toHaveCSS("width", "32px");
      await expect(page.locator(".theme-toggle")).toHaveCSS("height", "32px");
      const shell = await page.locator("main").boundingBox();
      expect(shell?.width).toBeLessThanOrEqual(720);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      ).toBe(true);
      // Preserve Chroma's official palette; limit contrast exceptions to highlighted code.
      const result = await new AxeBuilder({ page }).analyze();
      for (const violation of result.violations) {
        expect(violation.id).toBe("color-contrast");
        for (const node of violation.nodes) {
          for (const target of node.target) {
            expect(typeof target).toBe("string");
            expect(
              await page
                .locator(String(target))
                .evaluate((element) => Boolean(element.closest(".chroma"))),
            ).toBe(true);
          }
        }
      }
      if (result.violations.length)
        await test.info().attach(`Chroma-contrast-${width}-${colorScheme}`, {
          body: JSON.stringify(result.violations),
          contentType: "application/json",
        });
    }
  }
});
