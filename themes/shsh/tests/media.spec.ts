import { test, expect, type Locator } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { mkdirSync } from "node:fs";

const base = "http://127.0.0.1:4179";
test.beforeEach(async ({ page }) => {
  await page.route("https://**/*", (route) => route.abort());
});
// Candidates live in the picture's WebP source; the img keeps only the original src.
const candidates = async (img: Locator) =>
  (await img.locator("xpath=../source").getAttribute("srcset"))!.split(", ").map((candidate) => {
    const [url, descriptor] = candidate.split(" ");
    return { url: url!, width: Number(descriptor!.slice(0, -1)) };
  });

test("responsive candidates, originals, dimensions, loading and figure semantics", async ({
  page,
}) => {
  await page.route("**/*.mp4", (route) => route.abort());
  await page.goto(`${base}/gallery/`);
  const terminal = page.getByRole("img", { name: "ターミナルの文字", exact: true });
  const smallSrc = await page.getByRole("img", { name: "小さい透明画像" }).getAttribute("src");
  await expect(page.getByRole("img", { name: "クエリ付き画像" })).toHaveAttribute(
    "src",
    `${smallSrc}?v=1&x=2#sample`,
  );
  // The native width is always last, even above 1440px. Heavier intermediate resizes give way to
  // a lighter wider one; without comparing to the original, WebP heavier than a JPEG is offered.
  const widths: Record<string, number[]> = {
    ターミナルの文字: [360, 1200],
    実写真: [360, 720, 1080, 1440, 1500],
    パレット画像: [360, 1440],
    小さい透明画像: [200],
    静止GIF: [120],
    静止WebP: [360, 400],
    可逆WebP: [360, 480],
    半透明の非可逆WebP: [360, 480],
    TIFF画像: [360, 480],
    パレットのスクリーンショット: [360, 720, 2304],
    // Grayscale PNGs shift slightly in brightness through Hugo's WebP encoder; this is accepted.
    グレースケール画像: [360, 860],
    圧縮済みJPEG: [360, 720],
  };
  for (const [name, expected] of Object.entries(widths)) {
    const img = page.getByRole("img", { name, exact: true });
    await expect(img.locator("..")).toHaveJSProperty("tagName", "PICTURE");
    const sources = await candidates(img);
    expect(
      sources.map((candidate) => candidate.width),
      name,
    ).toEqual(expected);
    // Only a WebP original can stand in the WebP source, at its own width.
    const src = (await img.getAttribute("src"))!;
    expect(
      sources.map((candidate) => candidate.url === src),
      name,
    ).toEqual(sources.map((_, index) => src.endsWith(".webp") && index === sources.length - 1));
  }
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
  await expect(page.locator(".article-cover img")).toHaveAttribute("fetchpriority", "high");
  await expect(page.locator(".prose img[fetchpriority]")).toHaveCount(0);
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
  await expect(video).toHaveAttribute("src", /^\/gallery\/demo\.[a-f0-9]{64}\.mp4$/);
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
  for (const path of ["/", "/page/2/", "/posts/", "/posts/page/2/", "/categories/covered/"]) {
    await page.goto(base + path);
    const covers = page.locator(".entry-cover img");
    await expect(covers.first()).toHaveAttribute("loading", "eager");
    await expect(covers.first()).toHaveAttribute("fetchpriority", "high");
    await expect(page.locator(".entry-cover img[fetchpriority]")).toHaveCount(1);
    if ((await covers.count()) > 1) {
      await expect(covers.nth(1)).toHaveAttribute("loading", "lazy");
      await expect(covers.nth(1)).not.toHaveAttribute("fetchpriority");
    }
  }
});

test("a missing first cover does not promote body images or a later entry cover", async ({
  page,
}) => {
  await page.goto(`${base}/posts/no-cover/`);
  await expect(page.locator(".article-cover")).toHaveCount(0);
  await expect(page.getByRole("img", { name: "本文の画像" })).toHaveAttribute("loading", "lazy");
  await expect(page.locator("img[fetchpriority]")).toHaveCount(0);

  await page.goto(`${base}/categories/mixed/`);
  const entries = page.locator(".post-entry");
  await expect(entries).toHaveCount(2);
  await expect(entries.first().locator(".entry-title")).toHaveText("カバーなしの記事");
  await expect(entries.first().locator("img")).toHaveCount(0);
  await expect(entries.nth(1).locator(".entry-cover img")).toHaveAttribute("loading", "lazy");
  await expect(page.locator("img[fetchpriority]")).toHaveCount(0);
});

test("direct lossless resizing preserves palette midtones and transparency", async ({ page }) => {
  await page.goto(`${base}/gallery/`);
  const img = page.getByRole("img", { name: "パレット画像", exact: true });
  const [smallest] = await candidates(img);
  const result = await img.evaluate(async (_, url: string) => {
    // Below a screenshot band, the 1440px indexed PNG alternates red/blue columns. A 4:1
    // Catmull-Rom resize must produce purple, absent from the source palette, away from edges.
    const bitmap = new Image();
    bitmap.src = url;
    await bitmap.decode();
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.naturalWidth;
    canvas.height = bitmap.naturalHeight;
    const context = canvas.getContext("2d")!;
    context.drawImage(bitmap, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const pixel = (x: number, y: number) =>
      Array.from(pixels.slice((y * canvas.width + x) * 4, (y * canvas.width + x) * 4 + 4));
    return {
      width: canvas.width,
      height: canvas.height,
      opaque: pixel(canvas.width / 4, canvas.height / 2),
      translucent: pixel((canvas.width * 3) / 4, canvas.height / 2),
    };
  }, smallest!.url);
  expect(result.width).toBe(360);
  expect(result.height).toBe(150);
  expect(result.opaque).toEqual([128, 0, 128, 255]);
  expect(result.translucent[1]).toBe(0);
  expect(result.translucent[3]).toBe(128);
  // The 4:1 resize stores 127 at alpha 128, and decoders may round premultiplied RGB once more.
  // Palette reapplication would move these channels far further.
  for (const channel of [result.translucent[0], result.translucent[2]])
    expect(Math.abs(channel! - 128)).toBeLessThanOrEqual(2);
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
    const current = await cover.evaluate((img: HTMLImageElement) => img.currentSrc);
    expect(current).toContain(".webp");
    const chosen = (await candidates(cover)).find((candidate) => current.endsWith(candidate.url))!;
    expect(chosen.width).toBeGreaterThanOrEqual(width === 1280 ? 1200 : 352 * deviceScaleFactor);
    expect(chosen.width).toBeLessThanOrEqual(deviceScaleFactor === 1 ? 720 : 1200);
    // A large photo offers its native width when DPR calls for more than 1440px.
    const photo = page.getByRole("img", { name: "実写真", exact: true });
    await photo.scrollIntoViewIfNeeded();
    await expect
      .poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true);
    const photoCurrent = await photo.evaluate((img: HTMLImageElement) => img.currentSrc);
    expect(photoCurrent).toContain(".webp");
    if (width === 1280) {
      const expected = (await candidates(photo)).find(
        (candidate) => candidate.width === (deviceScaleFactor === 3 ? 1500 : 1440),
      )!;
      expect(photoCurrent).toContain(expected.url);
    }
    await expect(page.locator("video")).toHaveAttribute("controls", "");
    await context.close();
  }
});

test("browsers without WebP load the original, and the cover keeps high priority", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Image type emulation and priorities use Chromium CDP");
  const cdp = await page.context().newCDPSession(page);
  const priorities = new Map<string, string>();
  cdp.on("Network.requestWillBeSent", ({ request }) =>
    priorities.set(request.url, request.initialPriority),
  );
  await cdp.send("Network.enable");
  await page.goto(`${base}/gallery/`);
  const cover = page.locator(".article-cover img");
  await expect
    .poll(() => cover.evaluate((img: HTMLImageElement) => img.currentSrc))
    .toContain(".webp");
  expect(priorities.get(await cover.evaluate((img: HTMLImageElement) => img.currentSrc))).toBe(
    "High",
  );

  await cdp.send("Emulation.setDisabledImageTypes", { imageTypes: ["webp"] });
  priorities.clear();
  await page.reload();
  // A WebP original cannot be shown there either, so check other formats.
  for (const name of ["カバーのターミナル画面", "実写真", "静止GIF"]) {
    const img = page.getByRole("img", { name, exact: true });
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        img.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0),
      )
      .toBe(true);
    const { current, src } = await img.evaluate((element: HTMLImageElement) => ({
      current: element.currentSrc,
      src: element.src,
    }));
    expect(current).toBe(src);
  }
  // The typed source is skipped outright, so no WebP candidate is requested.
  expect([...priorities.keys()].filter((url) => url.includes("_hu_"))).toEqual([]);
});
