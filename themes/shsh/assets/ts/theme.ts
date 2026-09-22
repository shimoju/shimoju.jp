// Loaded synchronously in <head>, before CSS. Keep first paint and live changes
// on the same selection rule.
const root = document.documentElement;
const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
const os = matchMedia("(prefers-color-scheme: dark)");
type ColorMode = "light" | "dark";
let chosen: ColorMode | null = null;
try {
  const saved = localStorage.getItem("pref-theme");
  if (saved === "light" || saved === "dark") chosen = saved;
} catch {
  // Storage may be unavailable; an explicit choice still lasts for this page.
}
function currentMode(): ColorMode {
  return chosen ?? (os.matches ? "dark" : "light");
}
function syncButton() {
  const button = document.querySelector<HTMLButtonElement>(".theme-toggle");
  if (!button) return;
  const label = currentMode() === "dark" ? "Switch to light mode" : "Switch to dark mode";
  button.setAttribute("aria-label", label);
  button.title = label;
}
function apply() {
  if (chosen) root.dataset.theme = chosen;
  else delete root.dataset.theme;
  // Keep early browser UI and CSS in sync, including macOS Firefox scrollbars.
  if (meta) meta.content = chosen ?? "light dark";
  syncButton();
}
apply();
os.addEventListener("change", () => {
  if (!chosen) apply();
});
document.addEventListener("DOMContentLoaded", () => {
  const button = document.querySelector<HTMLButtonElement>(".theme-toggle");
  if (!button) return;
  button.hidden = false;
  syncButton();
  button.addEventListener("click", () => {
    chosen = currentMode() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("pref-theme", chosen);
    } catch {
      /* Keep the chosen mode in memory. */
    }
    apply();
  });
});
export {};
