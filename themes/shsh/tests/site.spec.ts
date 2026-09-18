import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(".cache/site/inputs.json", "utf8")) as {
  pages: { path: string; permalink: string; section: string; kind: string }[];
  embeds: { path: string; service: string; input: string }[];
};
for (const environment of ["production", "preview"])
  test(`Site ${environment}: all embed positions, URLs and publication controls`, async ({
    browser,
  }) => {
    test.setTimeout(60000);
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.route("https://**/*", (route) =>
      route.fulfill({ contentType: "text/javascript", body: "" }),
    );
    const base = `http://127.0.0.1:${environment === "production" ? 4196 : 4197}`;
    for (const path of new Set(input.embeds.map((e) => e.path))) {
      const pathname = new URL(input.pages.find((p) => p.path === path)!.permalink).pathname;
      const response = await page.goto(base + pathname);
      expect(response?.status()).toBe(200);
      const expected = input.embeds.filter((e) => e.path === path);
      const actual = await page
        .locator(".prose [data-offline-embed], .prose .speaker-deck, .prose video")
        .evaluateAll((elements) =>
          elements.map((e) => {
            if (e instanceof HTMLVideoElement)
              return {
                service: "video",
                src: e.getAttribute("src"),
                width: e.width,
                height: e.height,
              };
            if (e.classList.contains("speaker-deck"))
              return {
                service: "speakerdeck",
                id: e.querySelector("script")?.getAttribute("data-id"),
                ratio: e.querySelector("script")?.getAttribute("data-ratio"),
              };
            return {
              service: e.getAttribute("data-offline-embed"),
              url: e.querySelector("a")?.getAttribute("href"),
              text: e.textContent?.trim(),
            };
          }),
        );
      expect(
        actual.map((e) => e.service),
        path,
      ).toEqual(expected.map((e) => e.service));
      for (const [i, embed] of expected.entries()) {
        const id = embed.input.match(/id="([^"]+)"/)?.[1];
        const user = embed.input.match(/user="([^"]+)"/)?.[1];
        const observed = actual[i]!;
        if (embed.service === "x") expect(observed.url).toBe(`https://x.com/${user}/status/${id}`);
        if (embed.service === "instagram")
          expect(observed.url).toBe(`https://www.instagram.com/p/${embed.input}/`);
        if (embed.service === "youtube") {
          expect(observed.url).toBe(`https://www.youtube.com/watch?v=${id}`);
          expect(observed.text).toBe(embed.input.match(/title="([^"]+)"/)?.[1]);
        }
        if (embed.service === "speakerdeck") {
          expect(observed.id).toBe(id);
          expect(observed.ratio).toBe("1.77777777777778");
        }
        if (embed.service === "video") {
          expect(observed.src).toContain("zsh-prompt-demo.mp4");
          expect(observed.width).toBe(1440);
          expect(observed.height).toBe(1076);
        }
      }
      await expect(page.locator(".share-icons a")).toHaveCount(
        environment === "production" ? 4 : 0,
      );
      await expect(page.locator(".share-icons button:disabled")).toHaveCount(
        environment === "preview" ? 4 : 0,
      );
      await expect(page.locator("[data-hatena-star-container]")).toHaveCount(
        environment === "production" ? 1 : 0,
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `${environment === "production" ? "https://shimoju.jp" : "https://preview.invalid"}${pathname}`,
      );
    }
    await page.goto(base + "/");
    await expect(page.locator(".post-entry")).toHaveCount(10);
    await expect(page.locator(".intro")).toContainText("株式会社SmartHR");
    await expect(page.locator('.footer-links a[aria-label="RSS"]')).toHaveAttribute(
      "href",
      "/index.xml",
    );
    await page.goto(base + "/archives/");
    await expect(page.locator(".archive-month a")).toHaveCount(
      input.pages.filter((p) => p.kind === "page" && p.section === "posts").length,
    );
    await context.close();
  });

test("real video reserves its intrinsic ratio before loading; native playback dimensions agree", async ({
  browser,
}) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.route("https://**/*", (route) => route.fulfill({ body: "" }));
  await page.route("**/*.mp4", (route) => route.abort());
  const url = "http://127.0.0.1:4196/2026/09/01/development-environment-2026/";
  await page.goto(url);
  const video = page.locator("video");
  const before = await video.boundingBox();
  expect(before).not.toBeNull();
  expect(Math.abs(before!.width / before!.height - 1440 / 1076)).toBeLessThan(0.001);
  await page.unroute("**/*.mp4");
  await page.reload();
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState))
    .toBeGreaterThanOrEqual(1);
  expect(await video.evaluate((v: HTMLVideoElement) => [v.videoWidth, v.videoHeight])).toEqual([
    1440, 1076,
  ]);
  const after = await video.boundingBox();
  expect(Math.abs(after!.height - before!.height)).toBeLessThan(0.06);
  await context.close();
});
