import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

test("home and section pagination retain newer-left/older-right and first-page introduction", async ({
  page,
}) => {
  for (const root of ["/", "/posts/"]) {
    await page.goto(root);
    await expect(page.locator(".post-entry")).toHaveCount(2);
    await expect(page.locator(".entry-title")).toHaveText(["記事 1", "記事 2"]);
    await expect(page.locator(".previous-page")).toHaveCount(0);
    await expect(page.locator(".intro")).toHaveCount(root === "/" ? 1 : 0);
    await page.getByRole("link", { name: "Next" }).click();
    await expect(page).toHaveURL(new RegExp(`${root}page/2/$`));
    await expect(page.locator(".intro")).toHaveCount(0);
    await expect(page.locator(".entry-title")).toHaveText(["記事 3", "記事 4"]);
    const previous = await page.locator(".previous-page").boundingBox();
    const next = await page.locator(".next-page").boundingBox();
    expect(previous?.x).toBeLessThan(next?.x ?? 0);
    await expect(page.getByRole("group", { name: "Page 2 of 3" })).toHaveText("2 / 3");
    await page.getByRole("link", { name: "Next" }).click();
    await expect(page.locator(".entry-title")).toHaveText(["記事 5"]);
    await expect(page.locator(".next-page")).toHaveCount(0);
    await page.getByRole("link", { name: "Prev" }).click();
    await expect(page.locator(".page-number")).toHaveText("2 / 3");
  }
});

test("list text, separators and pager preserve frozen mock styles in both widths and palettes", async ({
  page,
  context,
}) => {
  const mock = await context.newPage();
  const properties = [
    "fontSize",
    "fontWeight",
    "lineHeight",
    "color",
    "marginTop",
    "marginBottom",
    "paddingTop",
    "borderTopWidth",
    "borderTopColor",
    "gap",
    "minHeight",
    "gridTemplateColumns",
    "webkitLineClamp",
  ] as const;
  const styles = async (target: typeof page, selector: string) =>
    target
      .locator(selector)
      .first()
      .evaluate((element, keys) => {
        const style = getComputedStyle(element);
        return keys.map((key) => style[key as keyof CSSStyleDeclaration]);
      }, properties);
  for (const width of [1280, 400, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await mock.setViewportSize({ width, height: 900 });
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      await page.goto("/page/2/");
      await mock.goto(`http://127.0.0.1:4177/home-2.html?theme=${colorScheme}`);
      for (const selector of [
        ".post-list",
        ".post-entry + .post-entry",
        ".entry-link",
        ".entry-title",
        ".meta",
        ".entry-summary",
        ".pager",
        ".previous-page",
        ".next-page",
        ".page-number",
      ]) {
        expect(await styles(page, selector), `${width}/${colorScheme}/${selector}`).toEqual(
          await styles(mock, selector),
        );
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      ).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
  }
  await mock.close();
});

test("pagination and whole-card links work without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4174/");
  await page.getByRole("link", { name: "Next" }).click();
  await expect(page.locator(".entry-title")).toHaveText(["記事 3", "記事 4"]);
  await page.getByRole("link", { name: "記事 3", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("記事 3");
  await context.close();
});
