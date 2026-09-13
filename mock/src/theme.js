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
    const copyControls = [];
    document.querySelectorAll('.copy').forEach(button => {
      let resetTimer;
      const block = button.closest('.code-block');
      const pre = block.querySelector('pre');
      const status = block.querySelector('.copy-feedback');
      button.hidden = false;
      const reveal = () => {
        delete block.dataset.copyDismissed;
        block.dataset.copyVisible = '';
      };
      const dismiss = () => {
        if (document.activeElement === button) pre.focus({ preventScroll: true });
        delete block.dataset.copyVisible;
        block.dataset.copyDismissed = '';
      };
      copyControls.push({ block, dismiss });
      // Native clicks include taps, but do not consume drags, selection or scrolling.
      block.addEventListener('click', event => {
        if (!event.target.closest('.copy')) reveal();
      });
      block.addEventListener('focusin', () => { delete block.dataset.copyDismissed; });
      block.addEventListener('pointerenter', event => {
        if (event.pointerType === 'mouse') delete block.dataset.copyDismissed;
      });
      block.addEventListener('pointerleave', event => {
        if (event.pointerType === 'mouse') {
          delete block.dataset.copyVisible;
        }
      });
      block.addEventListener('focusout', event => {
        if (!block.contains(event.relatedTarget)) delete block.dataset.copyVisible;
      });
      pre.addEventListener('scroll', dismiss, { passive: true });
      block.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          dismiss();
          event.stopPropagation();
        }
      });
      button.addEventListener('click', async () => {
        clearTimeout(resetTimer);
        reveal();
        status.textContent = '';
        button.disabled = true;
        // Strip line numbers; copy only the code text, including its original newlines.
        const clone = block.querySelector('pre code').cloneNode(true);
        clone.querySelectorAll('.ln, .lnt, .lnlinks').forEach(el => el.remove());
        try {
          if (params.get('copy') === 'failure') throw new Error('Mock failure state');
          await navigator.clipboard.writeText(clone.textContent);
          button.dataset.copyState = 'success';
          button.setAttribute('aria-label', 'Copied');
          button.title = 'Copied';
          status.textContent = 'Code copied.';
          resetTimer = setTimeout(() => {
            button.dataset.copyState = 'idle';
            button.setAttribute('aria-label', 'Copy code');
            button.title = 'Copy code';
            status.textContent = '';
          }, 3000);
        } catch {
          button.dataset.copyState = 'error';
          button.setAttribute('aria-label', 'Copy failed. Retry copying code');
          button.title = 'Copy failed. Select the code and copy it manually, or retry.';
          status.textContent = 'Copy failed. Select the code and copy it manually, or retry.';
        } finally {
          button.disabled = false;
        }
      });
    });
    document.addEventListener('pointerdown', event => {
      copyControls.forEach(({ block, dismiss }) => {
        if (!block.contains(event.target)) dismiss();
      });
    });
    // Also allow dismissal when the hovered code block itself has no keyboard focus.
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') copyControls.forEach(({ dismiss }) => dismiss());
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
