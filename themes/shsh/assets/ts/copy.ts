// Controls exist only in the browser, so content, summaries and feeds carry no UI markup.
const template = document.createElement("template");
template.innerHTML = `
  <button
    class="copy icon-control"
    type="button"
    aria-label="Copy code"
    title="Copy code"
    lang="en"
    data-copy-state="idle"
  >
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <g class="copy-symbol-idle">
        <rect x="8" y="8" width="14" height="14" rx="2" />
        <path d="M16 8V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
      </g>
      <path class="copy-symbol-success" d="m3 12 6 6L21 6" />
      <g class="copy-symbol-error"><path d="m5 5 14 14M19 5 5 19" /></g>
    </svg>
  </button>
  <span class="sr-only copy-feedback" role="status" aria-live="polite" lang="en"></span>
`;
const [buttonTemplate, statusTemplate] = template.content.children;

const controls: { block: HTMLElement; dismiss: () => void }[] = [];
for (const block of document.querySelectorAll<HTMLElement>(".code-block")) {
  const highlight = block.querySelector(".highlight");
  // Table line numbers occupy their own pre; use the code column when present.
  const pre =
    block.querySelector<HTMLElement>(".lntd:last-child pre") ??
    block.querySelector<HTMLElement>("pre");
  if (!highlight || !pre || !buttonTemplate || !statusTemplate) continue;
  const button = buttonTemplate.cloneNode(true) as HTMLButtonElement;
  const status = statusTemplate.cloneNode(true) as HTMLElement;
  // Label, button, code: focus order and the label's sibling selector depend on it.
  highlight.before(button);
  block.append(status);
  let resetTimer: ReturnType<typeof setTimeout> | undefined;
  const reveal = () => {
    delete block.dataset.copyDismissed;
    block.dataset.copyVisible = "";
  };
  const dismiss = () => {
    if (document.activeElement === button) pre.focus({ preventScroll: true });
    delete block.dataset.copyVisible;
    block.dataset.copyDismissed = "";
  };
  const setState = (state: string, label: string, title = label) => {
    button.dataset.copyState = state;
    button.setAttribute("aria-label", label);
    button.title = title;
  };
  controls.push({ block, dismiss });
  block.addEventListener("click", (event) => {
    if (event.target instanceof Element && !event.target.closest(".copy")) reveal();
  });
  block.addEventListener("focusin", () => {
    delete block.dataset.copyDismissed;
  });
  block.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") delete block.dataset.copyDismissed;
  });
  block.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") delete block.dataset.copyVisible;
  });
  block.addEventListener("focusout", (event) => {
    if (!(event.relatedTarget instanceof Node) || !block.contains(event.relatedTarget))
      delete block.dataset.copyVisible;
  });
  pre.addEventListener("scroll", dismiss, { passive: true });
  const copy = async () => {
    clearTimeout(resetTimer);
    reveal();
    status.textContent = "";
    button.disabled = true;
    try {
      const clone = pre.querySelector("code")?.cloneNode(true);
      if (!(clone instanceof HTMLElement)) throw new Error("Missing code");
      clone.querySelectorAll(".ln, .lnt, .lnlinks").forEach((node) => node.remove());
      await navigator.clipboard.writeText(clone.textContent);
      setState("success", "Copied");
      status.textContent = "Code copied.";
      resetTimer = setTimeout(() => {
        setState("idle", "Copy code");
        status.textContent = "";
      }, 3000);
    } catch {
      const message = "Copy failed. Select the code and copy it manually, or retry.";
      setState("error", "Copy failed. Retry copying code", message);
      status.textContent = message;
    } finally {
      button.disabled = false;
    }
  };
  let touchActivation = false;
  button.addEventListener("pointerdown", (event) => {
    touchActivation = event.pointerType === "touch";
  });
  button.addEventListener("mousedown", (event) => {
    // Safari blurs the code without focusing a tapped button. Prevent that
    // compatibility mousedown from hiding the button before its click arrives.
    if (touchActivation) event.preventDefault();
  });
  button.addEventListener("click", () => {
    void copy();
  });
}
document.addEventListener("pointerdown", (event) => {
  if (!(event.target instanceof Node)) return;
  const target = event.target;
  controls.forEach(({ block, dismiss }) => {
    if (!block.contains(target)) dismiss();
  });
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") controls.forEach(({ dismiss }) => dismiss());
});
