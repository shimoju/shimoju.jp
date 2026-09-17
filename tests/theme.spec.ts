import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

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
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(24, 24, 37)");
  await expect(page.getByRole("button", { name: "Switch to light mode" })).toBeVisible();
});

test("OS follows until a keyboard choice, persists and ignores mock query parameters", async ({
  page,
  browserName,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/?theme=dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  // Safari uses Option-Tab to include links and buttons when full keyboard access is off.
  await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
  await expect(page.getByRole("button")).toBeFocused();
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
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "light" });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("invalid saved value uses OS preference", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("pref-theme", "unexpected"));
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("without JavaScript both OS palettes, navigation and subscription remain usable", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: "dark" });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4174/");
  await expect(page.getByRole("button", { includeHidden: true })).toBeHidden();
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(24, 24, 37)");
  await expect(page.locator(".chroma")).toHaveCSS("background-color", "rgb(30, 30, 46)");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(248, 249, 252)");
  await expect(page.locator(".chroma")).toHaveCSS("background-color", "rgb(239, 241, 245)");
  await page.getByRole("link", { name: "RSS", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:4174/index.xml");
  await context.close();
});

test("shared shell keeps mock dimensions at desktop and mobile widths in both palettes", async ({
  page,
  context,
}) => {
  const mock = await context.newPage();
  const shellStyles = async (target: typeof page) =>
    target.evaluate(() =>
      ["body", ".site-header", ".site-name", ".site-nav", ".theme-toggle", ".site-footer"].map(
        (selector) => {
          const element = document.querySelector(selector);
          if (!element) throw new Error(`Missing ${selector}`);
          const style = getComputedStyle(element);
          return [
            selector,
            ...[
              "fontSize",
              "fontFamily",
              "fontFeatureSettings",
              "fontWeight",
              "lineHeight",
              "paddingTop",
              "paddingBottom",
              "gap",
              "color",
              "backgroundColor",
            ].map((property) => style[property as keyof CSSStyleDeclaration]),
          ];
        },
      ),
    );
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
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      await mock.setViewportSize({ width, height: 1000 });
      await mock.goto(`http://127.0.0.1:4177/home.html?theme=${colorScheme}`);
      expect(await shellStyles(page)).toEqual(await shellStyles(mock));
      // Chroma's agreed color exceptions are scoped to the highlighter only.
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
  await mock.close();
});
