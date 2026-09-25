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
  // Candidates live in the WebP source; the img keeps only the original src.
  const srcset = (name: string) =>
    page
      .locator("picture")
      .filter({ has: page.getByRole("img", { name, exact: true }) })
      .locator('source[type="image/webp"]')
      .getAttribute("srcset");
  const candidates = async (name: string) =>
    (await srcset(name))?.split(", ").map((s) => Number(s.split(" ")[1]?.replace("w", "")));
  expect(await candidates("ターミナルの文字")).toEqual([360, 1200]);
  // The native width is a candidate even above 1440px.
  expect(await candidates("実写真")).toEqual([360, 720, 1080, 1440, 1500]);
  // Heavier intermediate resizes give way to the lighter native-width WebP.
  expect(await srcset("ターミナルの文字")).toMatch(/\.webp 1200w$/);
  expect(await candidates("パレット画像")).toEqual([360, 1440]);
  expect(await candidates("小さい透明画像")).toEqual([200]);
  const smallSrc = await page.getByRole("img", { name: "小さい透明画像" }).getAttribute("src");
  await expect(page.getByRole("img", { name: "クエリ付き画像" })).toHaveAttribute(
    "src",
    `${smallSrc}?v=1&x=2#sample`,
  );
  expect(await candidates("静止GIF")).toEqual([120]);
  expect(await candidates("静止WebP")).toEqual([360, 400]);
  expect(await candidates("可逆WebP")).toEqual([360, 480]);
  expect(await candidates("半透明の非可逆WebP")).toEqual([360, 480]);
  expect(await candidates("TIFF画像")).toEqual([360, 480]);
  expect(await candidates("パレットのスクリーンショット")).toEqual([360, 720, 2304]);
  // Without comparing to the original, even WebP larger than an optimized JPEG is offered.
  expect(await candidates("圧縮済みJPEG")).toEqual([360, 720]);
  for (const name of [
    "ターミナルの文字",
    "実写真",
    "パレット画像",
    "小さい透明画像",
    "静止GIF",
    "静止WebP",
    "可逆WebP",
    "半透明の非可逆WebP",
    "TIFF画像",
    "パレットのスクリーンショット",
    "圧縮済みJPEG",
  ]) {
    const img = page.getByRole("img", { name, exact: true });
    const original = `${await img.getAttribute("src")} ${await img.getAttribute("width")}w`;
    // Only a WebP original can stand in the WebP source, at its own width.
    if (name.includes("WebP")) expect((await srcset(name))?.endsWith(original)).toBe(true);
    else expect(await srcset(name)).not.toContain(await img.getAttribute("src"));
    await expect(img.locator("..")).toHaveJSProperty("tagName", "PICTURE");
  }
  await expect(page.locator("img[srcset], img[sizes]")).toHaveCount(0);
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
  const result = await img.evaluate(async (element: HTMLImageElement) => {
    // Below a screenshot band, the 1440px indexed PNG alternates red/blue columns. A 4:1
    // Catmull-Rom resize must produce purple, absent from the source palette, away from edges.
    const bitmap = new Image();
    bitmap.src = element
      .parentElement!.querySelector("source")!
      .srcset.split(", ")[0]!
      .split(" ")[0]!;
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
  });
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
    const source = await cover.evaluate((img: HTMLImageElement) => ({
      current: img.currentSrc,
      candidates: img.parentElement!.querySelector("source")!.srcset,
    }));
    expect(source.current).toContain(".webp");
    const chosen = source.candidates
      .split(", ")
      .find((candidate) => source.current.endsWith(candidate.split(" ")[0]!))!;
    const chosenWidth = Number(chosen.split(" ")[1]!.replace("w", ""));
    expect(chosenWidth).toBeGreaterThanOrEqual(width === 1280 ? 1200 : 352 * deviceScaleFactor);
    expect(chosenWidth).toBeLessThanOrEqual(deviceScaleFactor === 1 ? 720 : 1200);
    // A large photo offers its native width when DPR calls for more than 1440px.
    const photo = page.getByRole("img", { name: "実写真", exact: true });
    await photo.scrollIntoViewIfNeeded();
    await expect
      .poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true);
    const photoSource = await photo.evaluate((img: HTMLImageElement) => ({
      current: img.currentSrc,
      candidates: img.parentElement!.querySelector("source")!.srcset,
    }));
    expect(photoSource.current).toContain(".webp");
    if (width === 1280) {
      const expected = photoSource.candidates
        .split(", ")
        .find((candidate) => candidate.endsWith(deviceScaleFactor === 3 ? " 1500w" : " 1440w"))!;
      expect(photoSource.current).toContain(expected.split(" ")[0]!);
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
