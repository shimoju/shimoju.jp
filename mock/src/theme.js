// Runs in the head: choose colors before first paint. Only the mock's own key is used.
(() => {
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const os = matchMedia('(prefers-color-scheme: dark)');
  let chosen = null;
  try { chosen = localStorage.getItem('shimoju-mock-theme'); } catch { /* File/private mode. */ }
  if (!['light', 'dark'].includes(chosen)) chosen = null;
  const preview = params.get('theme');
  root.dataset.theme = ['light', 'dark'].includes(preview) ? preview : chosen || (os.matches ? 'dark' : 'light');
  const syncButton = () => {
    const comparison = document.querySelector('#comparison-form');
    if (comparison) comparison.elements.namedItem('theme').value = root.dataset.theme;
    const button = document.querySelector('.theme-toggle');
    if (!button) return;
    const label = root.dataset.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    button.setAttribute('aria-label', label);
    button.title = label;
  };
  os.addEventListener('change', event => {
    if (!chosen && !['light', 'dark'].includes(preview)) {
      root.dataset.theme = event.matches ? 'dark' : 'light';
      syncButton();
    }
  });
  document.addEventListener('DOMContentLoaded', () => {
    syncButton();
    document.querySelector('.theme-toggle')?.addEventListener('click', () => {
      chosen = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = chosen;
      try { localStorage.setItem('shimoju-mock-theme', chosen); } catch { /* Keep this page usable. */ }
      if (params.has('theme')) {
        params.set('theme', chosen);
        history.replaceState(null, '', `${location.pathname}?${params}${location.hash}`);
      }
      syncButton();
    });
    // Keep explicit preview choices while following internal mock navigation.
    const preservePreview = event => {
      const link = event.target.closest('a');
      if (!link || !link.getAttribute('href') || link.getAttribute('href').startsWith('#')) return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || !url.pathname.endsWith('.html')) return;
      if (!url.pathname.endsWith('/index.html') && params.has('theme') && !url.searchParams.has('theme')) url.searchParams.set('theme', root.dataset.theme);
      link.href = url.href;
    };
    document.addEventListener('click', preservePreview);
    document.addEventListener('auxclick', preservePreview);
    document.addEventListener('contextmenu', preservePreview);
    document.querySelectorAll('.copy').forEach(button => {
      let resetTimer;
      button.addEventListener('click', async () => {
        const block = button.closest('.code-block');
        const status = block.querySelector('.copy-feedback');
        clearTimeout(resetTimer);
        button.disabled = true;
        // Strip line numbers; copy only the code text, including its original newlines.
        const clone = block.querySelector('pre code').cloneNode(true);
        clone.querySelectorAll('.ln, .lnt, .lnlinks').forEach(el => el.remove());
        try {
          if (params.get('copy') === 'failure') throw new Error('Mock failure state');
          await navigator.clipboard.writeText(clone.textContent);
          button.textContent = 'Copied';
          button.setAttribute('aria-label', 'Copied');
          button.removeAttribute('title');
          status.textContent = 'Code copied.';
          resetTimer = setTimeout(() => {
            button.textContent = 'Copy';
            button.setAttribute('aria-label', 'Copy code');
            status.textContent = '';
          }, 3000);
        } catch {
          button.textContent = 'Copy failed';
          button.setAttribute('aria-label', 'Copy failed. Retry copying code');
          button.title = 'Copy failed. Select the code and copy it manually, or retry.';
          status.textContent = 'Copy failed. Select the code and copy it manually, or retry.';
        } finally {
          button.disabled = false;
        }
      });
    });
    const showFontStacks = () => {
      for (const [name, property] of [['body', '--font-body'], ['code', '--font-code'], ['site', '--font-site']]) {
        const output = document.querySelector(`[data-font-stack="${name}"]`);
        if (output) output.textContent = getComputedStyle(root).getPropertyValue(property).trim();
      }
    };
    showFontStacks();
    // DOMContentLoaded may precede stylesheet loading on a cold cache.
    document.defaultView?.addEventListener('load', showFontStacks, { once: true });
    const comparisonForm = document.querySelector('#comparison-form');
    if (comparisonForm) {
      comparisonForm.elements.namedItem('theme').value = root.dataset.theme;
    }
    comparisonForm?.addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const query = new URLSearchParams();
      for (const [key, value] of data) if (key !== 'page' && value) query.set(key, value);
      location.href = `${data.get('page')}?${query}`;
    });
  });
})();
