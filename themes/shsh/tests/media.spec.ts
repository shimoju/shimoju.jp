import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { mkdirSync } from "node:fs";

const base = "http://127.0.0.1:4179";
test.beforeEach(async ({ page }) => {
  await page.route("https://**/*", (route) => route.abort());
});

test("responsive candidates, originals, dimensions, loading and figure semantics", async ({
  page,
}) => {
  await page.route("**/*.mp4", (route) => route.abort());
  await page.goto(`${base}/gallery/`);
  const terminal = page.getByRole("img", { name: "ターミナルの文字", exact: true });
  const candidates = (value: string | null) =>
    value?.split(", ").map((s) => Number(s.split(" ")[1]?.replace("w", "")));
  expect(candidates(await terminal.getAttribute("srcset"))).toEqual([360, 720, 1080, 1200]);
  expect(
    candidates(await page.getByRole("img", { name: "実写真", exact: true }).getAttribute("srcset")),
  ).toEqual([360, 720, 1080, 1440]);
  expect(
    candidates(await page.getByRole("img", { name: "小さい透明画像" }).getAttribute("srcset")),
  ).toEqual([200]);
  expect(
    candidates(
      await page.getByRole("img", { name: "静止GIF", exact: true }).getAttribute("srcset"),
    ),
  ).toEqual([120]);
  await expect(terminal).toHaveAttribute("width", "1200");
  await expect(terminal).toHaveAttribute("height", "630");
  await expect(terminal).toHaveAttribute("loading", "lazy");
  await expect(page.locator(".prose > figure").filter({ has: terminal })).toHaveCount(1);
  const inline = page.getByRole("img", { name: "文中の画像", exact: true });
  await expect(page.locator(".prose > p").filter({ has: inline })).toHaveText("前後。");
  await expect(page.locator(".prose a:empty")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "リンク内の画像" })).toHaveAttribute(
    "href",
    "https://example.org/",
  );
  await expect(page.locator(".article-cover img")).toHaveAttribute("loading", "eager");
  for (const name of [
    "アニメーションGIF",
    "アニメーションPNG",
    "アニメーションWebP",
    "SVG図",
    "Static画像",
    "外部画像",
  ]) {
    const img = page.getByRole("img", { name, exact: true });
    await expect(img).not.toHaveAttribute("srcset");
    await expect(img).toHaveAttribute("width", /[1-9][0-9]*/);
    await expect(img.locator("..")).not.toHaveJSProperty("tagName", "PICTURE");
  }
  await expect(page.getByRole("img", { name: "SVG図" })).toHaveAttribute("width", "180");
  await expect(page.locator("figcaption")).toHaveText("画面の説明。captionはaltと別。");
  await expect(page.locator("figcaption strong")).toHaveText("captionはaltと別");
  const video = page.locator("video");
  for (const flag of ["controls", "playsinline"]) await expect(video).toHaveAttribute(flag, "");
  for (const flag of ["muted", "autoplay", "loop"]) await expect(video).not.toHaveAttribute(flag);
  await expect(video).toHaveAttribute("preload", "metadata");
  await expect(video).toHaveAttribute("width", "1440");
  await expect(video).toHaveAttribute("height", "1076");
  const before = await video.boundingBox();
  expect(Math.abs(before!.width / before!.height - 1440 / 1076)).toBeLessThan(0.001);
  await page.unroute("**/*.mp4");
  await video.evaluate((element: HTMLVideoElement) => element.load());
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState))
    .toBeGreaterThanOrEqual(1);
  expect(
    await video.evaluate((element: HTMLVideoElement) => [element.videoWidth, element.videoHeight]),
  ).toEqual([1440, 1076]);
  const after = await video.boundingBox();
  expect(Math.abs(after!.height - before!.height)).toBeLessThan(0.06);
  await expect(page.locator(".speakerdeck-embed")).toHaveAttribute(
    "data-id",
    "457f092496ab4856b7c3cef5bcd2babb",
  );
  for (const path of ["/", "/page/2/", "/posts/", "/posts/page/2/"]) {
    await page.goto(base + path);
    const covers = page.locator(".entry-cover img");
    await expect(covers.first()).toHaveAttribute("loading", "eager");
    if ((await covers.count()) > 1) await expect(covers.nth(1)).toHaveAttribute("loading", "lazy");
  }
});

test("WebP preserves PNG pixels and transparency at each generated width", async ({ page }) => {
  await page.goto(`${base}/gallery/`);
  const result = await page.evaluate(async () => {
    const pictures = [...document.querySelectorAll<HTMLPictureElement>(".prose picture")];
    const results = [];
    for (const picture of pictures) {
      const img = picture.querySelector("img")!;
      if (!img.src.endsWith(".png")) continue;
      const pngs = img.srcset.split(", ").map((value) => value.split(" ")[0]!);
      const webps = picture
        .querySelector("source")!
        .srcset.split(", ")
        .map((value) => value.split(" ")[0]!);
      for (const [index, png] of pngs.entries()) {
        const pixels = async (src: string) => {
          const bitmap = new Image();
          bitmap.src = src;
          await bitmap.decode();
          const canvas = document.createElement("canvas");
          canvas.width = bitmap.naturalWidth;
          canvas.height = bitmap.naturalHeight;
          const context = canvas.getContext("2d")!;
          context.drawImage(bitmap, 0, 0);
          return {
            width: canvas.width,
            height: canvas.height,
            data: context.getImageData(0, 0, canvas.width, canvas.height).data,
          };
        };
        const a = await pixels(png);
        const b = await pixels(webps[index]!);
        results.push({
          png,
          width: a.width,
          // Image decoders may round premultiplied RGB differently for partial alpha.
          // Require exact opaque RGB and alpha; at most one 8-bit step after compositing.
          opaqueEqual: a.data.every((v, i) => a.data[i - (i % 4) + 3] !== 255 || v === b.data[i]),
          alphaEqual: a.data.every((v, i) => i % 4 !== 3 || v === b.data[i]),
          maxCompositeDelta: a.data.reduce(
            (m, v, i) =>
              Math.max(
                m,
                Math.abs(
                  Math.round((v * a.data[i - (i % 4) + 3]!) / 255) -
                    Math.round((b.data[i]! * b.data[i - (i % 4) + 3]!) / 255),
                ),
              ),
            0,
          ),
          sameDimensions: a.width === b.width && a.height === b.height,
        });
      }
    }
    return results;
  });
  expect(result.length).toBeGreaterThan(10);
  expect(
    result.filter(
      (r) => !r.opaqueEqual || !r.alphaEqual || !r.sameDimensions || r.maxCompositeDelta > 1,
    ),
  ).toEqual([]);
});

test("media geometry matches mock, small images stay small, both colors remain accessible", async ({
  page,
  browserName,
}) => {
  for (const width of [1280, 400])
    for (const colorScheme of ["light", "dark"] as const) {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme });
      await page.goto(`${base}/gallery/`);
      const small = page.getByRole("img", { name: "小さい透明画像" });
      await small.scrollIntoViewIfNeeded();
      await expect
        .poll(() => small.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
        .toBe(true);
      expect((await small.boundingBox())!.width).toBe(200);
      const cover = await page.locator(".article-cover img").boundingBox();
      const figure = await page.locator(".prose figure").first().locator("img").boundingBox();
      expect(figure!.width).toBe(cover!.width);
      expect(figure!.height).toBeCloseTo(cover!.height, 3);
      const deck = await page.locator(".speaker-deck").boundingBox();
      expect(deck!.width / deck!.height).toBeCloseTo(16 / 9, 3);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      const scan = await new AxeBuilder({ page }).analyze();
      expect(scan.violations).toEqual([]);
      if (browserName === "chromium") {
        mkdirSync(".cache/media-images", { recursive: true });
        await page.screenshot({
          path: `.cache/media-images/gallery-${width}-${colorScheme}.png`,
          fullPage: true,
        });
      }
      await page.goto(`http://127.0.0.1:4177/article.html?theme=${colorScheme}`);
      const mockCover = await page.locator(".article-cover img").boundingBox();
      expect(cover!.width).toBe(mockCover!.width);
      expect(cover!.height).toBeCloseTo(mockCover!.height, 3);
      await page.goto(`${base}/`);
      expect((await page.locator(".entry-cover img").nth(1).boundingBox())!.width).toBe(200);
    }
});

test("DPR chooses fitting candidates and JavaScript-free media remain usable", async ({
  browser,
}) => {
  for (const deviceScaleFactor of [1, 2]) {
    const context = await browser.newContext({
      viewport: { width: 400, height: 800 },
      deviceScaleFactor,
      javaScriptEnabled: false,
    });
    const page = await context.newPage();
    await page.route("https://**/*", (route) => route.abort());
    await page.goto(`${base}/gallery/`);
    const cover = page.locator(".article-cover img");
    await expect(cover).toBeVisible();
    const source = await cover.evaluate((img: HTMLImageElement) => ({
      current: img.currentSrc,
      candidates: img.parentElement!.querySelector("source")!.srcset,
    }));
    expect(source.current).toContain(".webp");
    const chosen = source.candidates
      .split(", ")
      .find((candidate) => source.current.endsWith(candidate.split(" ")[0]!))!;
    const chosenWidth = Number(chosen.split(" ")[1]!.replace("w", ""));
    expect(chosenWidth).toBeGreaterThanOrEqual(352 * deviceScaleFactor);
    expect(chosenWidth).toBeLessThanOrEqual(deviceScaleFactor === 1 ? 720 : 1080);
    await expect(page.locator("video")).toHaveAttribute("controls", "");
    await context.close();
  }
});
