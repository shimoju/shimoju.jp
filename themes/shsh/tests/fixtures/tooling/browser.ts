const button = document.querySelector<HTMLButtonElement>("button");
button?.addEventListener("click", () => {
  button.textContent = "Done";
});
