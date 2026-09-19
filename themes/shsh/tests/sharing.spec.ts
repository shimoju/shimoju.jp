import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

const production = "http://127.0.0.1:4180";
const preview = "http://127.0.0.1:4181";
const starURL = "https://s.hatena.ne.jp/js/widget/star.js";
const title = '日本語 & <記号> "引用" #hash 100%';
const stub = `const mount = document.querySelector('[data-hatena-star-container]');
if (mount) { const frame = document.createElement('iframe'); frame.title = 'Hatena Star';
frame.width = '80'; frame.height = '32'; frame.style.border = '0';
frame.srcdoc = '<!doctype html><html lang="en"><title>Hatena Star fixture</title><body style="margin:0"><button type="button">Star</button></body></html>';
mount.append(frame); }`;

test("shared document URLs, encoded titles, service order and keyboard navigation", async ({
  page,
  browserName,
}) => {
  let requests = 0;
  await page.route(starURL, (route) => {
    requests++;
    return route.fulfill({ contentType: "text/javascript", body: stub });
  });
  for (const path of ["/document/", "/posts/article/"]) {
    await page.goto(production + path);
    await expect(page.locator(".star-widget iframe")).toHaveCount(1);
    const publicURL = "https://sharing.invalid" + path;
    await expect(page.locator("[data-hatena-star-container]")).toHaveAttribute(
      "data-hatena-star-url",
      publicURL,
    );
    await expect(page.locator("[data-hatena-star-container]")).toHaveAttribute(
      "data-hatena-star-title",
      title,
    );
    const links = page.locator(".share-icons a");
    await expect(links).toHaveCount(4);
    const hrefs = await links.evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLAnchorElement).href),
    );
    const [x, facebook, bluesky, hatena] = hrefs.map((url) => new URL(url));
    expect(x!.searchParams.get("text")).toBe(title);
    expect(x!.searchParams.get("url")).toBe(publicURL);
    expect(facebook!.searchParams.get("u")).toBe(publicURL);
    expect(bluesky!.searchParams.get("text")).toBe(`${title}\n${publicURL}`);
    expect(hatena!.href).toBe("https://b.hatena.ne.jp/entry/s/sharing.invalid" + path);
    for (const link of await links.all()) {
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    await links.first().focus();
    await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
    await expect(links.nth(1)).toBeFocused();
    const scan = await new AxeBuilder({ page }).analyze();
    expect(scan.violations).toEqual([]);
  }
  expect(requests).toBe(2);
});

test("failed star download preserves reading and share links and announces failure", async ({
  page,
}) => {
  await page.route(starURL, (route) => route.abort());
  await page.goto(production + "/document/");
  await expect(page.getByRole("status")).toHaveText(
    "Unable to load Hatena Star. Share links are still available.",
  );
  await expect(page.locator(".prose")).toHaveText("本文を読む。");
  await expect(page.locator(".share-icons a")).toHaveCount(4);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

for (const javaScriptEnabled of [true, false]) {
  test.describe(`preview with JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
    test.use({ javaScriptEnabled });

    test("cannot share or load stars", async ({ page }) => {
      const external: string[] = [];
      await page.route("https://**/*", (route) => {
        external.push(route.request().url());
        return route.abort();
      });
      await page.goto(preview + "/document/");
      await expect(page.locator(".share-icons button:disabled")).toHaveCount(4);
      await expect(page.locator(".share-icons a, [data-hatena-star-container]")).toHaveCount(0);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        "noindex,nofollow",
      );
      expect(external).toEqual([]);
    });
  });
}

test.describe("production without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const path of ["/document/", "/posts/article/"]) {
    test(`${path} retains reading and share links without stars or notices`, async ({ page }) => {
      const external: string[] = [];
      await page.route("https://**/*", (route) => {
        external.push(route.request().url());
        return route.abort();
      });
      await page.goto(production + path);

      await expect(page.locator(".prose")).toBeVisible();
      await expect(page.locator(".prose")).toHaveText("本文を読む。");
      const links = page.getByRole("group", { name: "Share this article" }).getByRole("link");
      await expect(links).toHaveCount(4);
      for (const link of await links.all()) {
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute("href", /^https:\/\//);
      }
      await expect(page.locator(".star-widget")).toBeHidden();
      await expect(page.locator(".widget-status")).toBeHidden();
      expect(external).toEqual([]);
    });
  }
});

test("sharing retains control dimensions and icon styling at both widths and palettes", async ({
  page,
}) => {
  await page.route(starURL, (route) =>
    route.fulfill({ contentType: "text/javascript", body: stub }),
  );
  for (const width of [1280, 400])
    for (const colorScheme of ["light", "dark"] as const) {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme });
      const capture = () =>
        page.locator(".share-mount").evaluate((mount) => {
          const style = getComputedStyle(mount);
          const rect = mount.getBoundingClientRect();
          const icon = mount.querySelector(".icon-link")!;
          const svg = icon.querySelector("svg")!;
          const iconStyle = getComputedStyle(icon);
          return {
            width: rect.width,
            height: rect.height,
            margin: style.marginInlineStart,
            gap: getComputedStyle(mount.querySelector(".share-icons")!).gap,
            color: iconStyle.color,
            controlWidth: icon.getBoundingClientRect().width,
            controlHeight: icon.getBoundingClientRect().height,
            iconWidth: svg.getBoundingClientRect().width,
            stroke: getComputedStyle(svg).strokeWidth,
          };
        });
      await page.goto(production + "/document/");
      const actual = await capture();
      await expect(page.locator(".star-widget")).toHaveCSS("color-scheme", "light");
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      expect(actual).toMatchObject({
        gap: "8px",
        controlWidth: 48,
        controlHeight: 48,
        iconWidth: 24,
        stroke: "1.5px",
      });
    }
});
