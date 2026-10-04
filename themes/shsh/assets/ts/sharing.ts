const star = document.querySelector<HTMLElement>("[data-hatena-star-container]");
if (star && !document.getElementById("hatena-star-script")) {
  const script = document.createElement("script");
  script.id = "hatena-star-script";
  script.src = "https://s.hatena.ne.jp/js/widget/star.js";
  script.async = true;
  script.addEventListener(
    "error",
    () => {
      const status = star.closest(".engagement")?.querySelector<HTMLElement>(".widget-status");
      if (status) status.textContent = status.dataset.failed ?? "";
    },
    { once: true },
  );
  document.head.append(script);
}
export {};
