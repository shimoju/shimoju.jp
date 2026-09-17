const controls: { block: HTMLElement; dismiss: () => void }[] = [];
for (const button of document.querySelectorAll<HTMLButtonElement>(".copy")) {
  const block = button.closest<HTMLElement>(".code-block");
  if (!block) continue;
  // Table line numbers occupy their own pre; use the code column when present.
  const pre =
    block.querySelector<HTMLElement>(".lntd:last-child pre") ??
    block.querySelector<HTMLElement>("pre");
  const status = block.querySelector<HTMLElement>(".copy-feedback");
  if (!pre || !status) continue;
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
  button.hidden = false;
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
