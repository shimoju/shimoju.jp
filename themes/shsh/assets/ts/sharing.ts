const star = document.querySelector<HTMLElement>("[data-hatena-star-container]");
if (star && !document.getElementById("hatena-star-script")) {
  const script = document.createElement("script");
  script.id = "hatena-star-script";
  script.src = "https://s.hatena.ne.jp/js/widget/star.js";
  script.async = true;
  script.addEventListener(
    "error",
    () => {
      const engagement = star.closest(".engagement");
      const status = engagement?.querySelector(".widget-status");
      if (status)
        status.textContent = engagement?.querySelector(".share-icons a")
          ? "Unable to load Hatena Star. Share links are still available."
          : "Unable to load Hatena Star.";
    },
    { once: true },
  );
  document.head.append(script);
}
export {};
