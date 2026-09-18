import { expect, type Page } from "@playwright/test";

export async function applyApprovedCodeLeading(mock: Page) {
  // F023: apply the approved change only in memory; retain the frozen 1.3 baseline.
  await expect(mock.locator(":root")).toHaveCSS("--leading-code", "1.3");
  await mock.addStyleTag({ content: ":root { --leading-code: 1.4; }" });
}
