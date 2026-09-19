import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

test("Hugo formatting preserves inline spaces, attributes, render hooks and compiled assets", async ({
  page,
}) => {
  const results = [];
  for (const phase of ["before", "after"]) {
    await page.setContent(readFileSync(`.cache/tooling/${phase}/index.html`, "utf8"));
    await expect(page.locator("#inline")).toHaveText("Hello World!");
    await expect(page.locator("#trim")).toHaveText("ABC");
    await expect(page.locator("#inline span")).toHaveAttribute("title", "World & friends");
    await expect(page.locator("#attribute a")).toHaveAttribute("href", "/page/?x=1&y=2");
    await expect(page.locator("p").nth(3)).toHaveText("Before inline emphasis after.");
    await expect(page.locator("p").last()).toHaveText("OneTwosuffix.");
    await expect(page.locator("body")).toHaveCSS("color", "rgb(17, 17, 17)");
    await page.getByRole("button", { name: "Run" }).click();
    await expect(page.getByRole("button")).toHaveText("Done");
    results.push(
      await page.locator("main").evaluate((element) => ({
        text: element.textContent?.replace(/\s+/g, " ").trim(),
        height: element.getBoundingClientRect().height,
      })),
    );
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
  expect(results[1]).toEqual(results[0]);
});
