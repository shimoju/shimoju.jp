const controls: { block: HTMLElement; dismiss: () => void }[] = [];
for (const block of document.querySelectorAll<HTMLElement>(".code-block")) {
  // Table line numbers occupy their own pre; use the code column when present.
  const pre =
    block.querySelector<HTMLElement>(".lntd:last-child pre") ??
    block.querySelector<HTMLElement>("pre");
  if (!pre) continue;
  const button = document.createElement("button");
  button.className = "copy icon-control";
  button.type = "button";
  button.lang = "en";
  button.innerHTML = `
    <svg viewBox="0 0 24 24" width="24" height="24" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <g class="copy-symbol-idle">
        <rect x="8" y="8" width="14" height="14" rx="2" />
        <path d="M16 8V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
      </g>
      <path class="copy-symbol-success" d="m3 12 6 6L21 6" />
      <g class="copy-symbol-error"><path d="m5 5 14 14M19 5 5 19" /></g>
    </svg>`;
  const status = document.createElement("span");
  status.className = "sr-only copy-feedback";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.lang = "en";
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
  setState("idle", "Copy code");
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
  // Keep the button before the code in the keyboard navigation order.
  block.insertBefore(button, block.querySelector(".highlight"));
  block.append(status);
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
