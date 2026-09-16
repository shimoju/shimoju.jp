// Load the unmodified official Hatena Star widget only on published article fixtures.
(() => {
  const entry = document.querySelector('[data-sharing-entry]');
  if (!entry || document.getElementById('hatena-star-script')) return;
  const script = document.createElement('script');
  script.id = 'hatena-star-script';
  script.src = 'https://s.hatena.ne.jp/js/widget/star.js';
  script.async = true;
  script.addEventListener('error', () => {
    entry.querySelector('.widget-status').textContent = 'Unable to load Hatena Star. Share links are still available.';
  }, { once: true });
  document.head.append(script);
})();
