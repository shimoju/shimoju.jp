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
  expect(candidates(await terminal.getAttribute("srcset"))).toEqual([360, 720, 1200]);
  expect(
    candidates(await page.getByRole("img", { name: "実写真", exact: true }).getAttribute("srcset")),
  ).toEqual([360, 720, 1080, 1440]);
  const photo = page.getByRole("img", { name: "実写真", exact: true });
  expect(await photo.getAttribute("srcset")).not.toContain(await photo.getAttribute("src"));
  // Rejecting the 1080px resize must not discard the cheaper same-width WebP.
  expect(await terminal.getAttribute("srcset")).not.toContain(await terminal.getAttribute("src"));
  expect(await terminal.getAttribute("srcset")).toMatch(/\.webp 1200w$/);
  expect(
    candidates(await page.getByRole("img", { name: "小さい透明画像" }).getAttribute("srcset")),
  ).toEqual([200]);
  expect(
    candidates(
      await page.getByRole("img", { name: "静止GIF", exact: true }).getAttribute("srcset"),
    ),
  ).toEqual([120]);
  expect(
    candidates(
      await page.getByRole("img", { name: "静止WebP", exact: true }).getAttribute("srcset"),
    ),
  ).toEqual([360, 400]);
  expect(
    candidates(
      await page.getByRole("img", { name: "パレットのスクリーンショット" }).getAttribute("srcset"),
    ),
  ).toEqual([360, 720, 1080, 2304]);
  expect(
    candidates(await page.getByRole("img", { name: "圧縮済みJPEG" }).getAttribute("srcset")),
  ).toEqual([720]);
  for (const name of ["パレットのスクリーンショット", "圧縮済みJPEG", "静止GIF", "静止WebP"]) {
    const img = page.getByRole("img", { name, exact: true });
    expect(await img.getAttribute("srcset")).toContain(
      `${await img.getAttribute("src")} ${await img.getAttribute("width")}w`,
    );
  }
  await expect(page.locator("picture")).toHaveCount(0);
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
    "グレースケール画像",
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

test("direct lossless resizing preserves palette midtones and transparency", async ({ page }) => {
  await page.goto(`${base}/gallery/`);
  const img = page.getByRole("img", { name: "パレット画像", exact: true });
  const result = await img.evaluate(async (element: HTMLImageElement) => {
    // The 720px indexed PNG alternates red/blue columns. A 2:1 box resize must
    // produce purple, absent from the source palette, on both opaque and half-alpha halves.
    const bitmap = new Image();
    bitmap.src = element.srcset.split(", ")[0]!.split(" ")[0]!;
    await bitmap.decode();
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.naturalWidth;
    canvas.height = bitmap.naturalHeight;
    const context = canvas.getContext("2d")!;
    context.drawImage(bitmap, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let alphaEqual = true;
    let maxCompositeDelta = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = (i / 4) % canvas.width < canvas.width / 2 ? 255 : 128;
      alphaEqual &&= pixels[i + 3] === alpha;
      for (const [channel, expected] of [128, 0, 128].entries()) {
        maxCompositeDelta = Math.max(
          maxCompositeDelta,
          Math.abs(
            Math.round((pixels[i + channel]! * pixels[i + 3]!) / 255) -
              Math.round((expected * alpha) / 255),
          ),
        );
      }
    }
    return { width: canvas.width, height: canvas.height, alphaEqual, maxCompositeDelta };
  });
  expect(result.width).toBe(360);
  expect(result.height).toBe(180);
  expect(result.alphaEqual).toBe(true);
  // Allow one 8-bit step for decoder rounding of premultiplied RGB.
  expect(result.maxCompositeDelta).toBeLessThanOrEqual(1);
});

test("media preserves aspect ratios, small images stay small, both colors remain accessible", async ({
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
      // Layout uses the declared source ratio; srcset natural dimensions can be density-rounded.
      const dimensions = await page
        .locator(".article-cover img")
        .evaluate((img: HTMLImageElement) => ({
          width: Number(img.getAttribute("width")),
          height: Number(img.getAttribute("height")),
        }));
      expect(cover!.width / cover!.height).toBeCloseTo(dimensions.width / dimensions.height, 3);
      await page.goto(`${base}/`);
      expect((await page.locator(".entry-cover img").nth(1).boundingBox())!.width).toBe(200);
    }
});

test("DPR chooses fitting candidates and JavaScript-free media remain usable", async ({
  browser,
}) => {
  for (const [width, deviceScaleFactor] of [
    [400, 1],
    [400, 2],
    [1280, 2],
    [1280, 3],
  ] as const) {
    const context = await browser.newContext({
      viewport: { width, height: 800 },
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
      candidates: img.srcset,
    }));
    expect(source.current).toContain(".webp");
    const chosen = source.candidates
      .split(", ")
      .find((candidate) => source.current.endsWith(candidate.split(" ")[0]!))!;
    const chosenWidth = Number(chosen.split(" ")[1]!.replace("w", ""));
    expect(chosenWidth).toBeGreaterThanOrEqual(width === 1280 ? 1200 : 352 * deviceScaleFactor);
    expect(chosenWidth).toBeLessThanOrEqual(deviceScaleFactor === 1 ? 720 : 1200);
    // A large photo keeps only WebP candidates, even when DPR calls for more than 1440px.
    const photo = page.getByRole("img", { name: "実写真", exact: true });
    await photo.scrollIntoViewIfNeeded();
    await expect
      .poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true);
    const photoSource = await photo.evaluate((img: HTMLImageElement) => ({
      current: img.currentSrc,
      candidates: img.srcset,
    }));
    expect(photoSource.current).toContain(".webp");
    if (width === 1280) {
      const largest = photoSource.candidates.split(", ").at(-1)!;
      expect(largest).toMatch(/ 1440w$/);
      expect(photoSource.current).toContain(largest.split(" ")[0]!);
    }
    await expect(page.locator("video")).toHaveAttribute("controls", "");
    await context.close();
  }
});
