import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('src/theme.js', import.meta.url), 'utf8');
function boot({ dark = false, saved = null, search = '', storageFails = false } = {}) {
  const root = { dataset: {}, setAttribute(name, value) { this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value; } };
  const callbacks = {};
  const attributes = {};
  const button = { setAttribute: (name, value) => attributes[name] = value, addEventListener: (name, fn) => callbacks[name] = fn };
  const os = { matches: dark, addEventListener: (_, fn) => callbacks.osChange = fn };
  const document = {
    documentElement: root,
    addEventListener: (name, fn) => { if (name === 'DOMContentLoaded') fn(); },
    querySelector: selector => selector === '.theme-toggle' ? button : null,
    querySelectorAll: () => [],
  };
  let stored = saved;
  const localStorage = {
    getItem: () => { if (storageFails) throw new Error('Unavailable'); return stored; },
    setItem: (_, value) => { if (storageFails) throw new Error('Unavailable'); stored = value; },
  };
  runInNewContext(source, { document, URLSearchParams, matchMedia: () => os, localStorage, location: { search, pathname: '/article.html', hash: '' }, history: { replaceState() {} } });
  return { root, attributes, stored: () => stored, click: () => callbacks.click(), changeOS: value => callbacks.osChange({ matches: value }) };
}
for (const dark of [false, true]) {
  const app = boot({ dark });
  assert.equal(app.root.dataset.theme, dark ? 'dark' : 'light');
  app.changeOS(!dark);
  assert.equal(app.root.dataset.theme, dark ? 'light' : 'dark');
  app.click();
  assert.equal(app.root.dataset.theme, dark ? 'dark' : 'light');
  assert.equal(app.stored(), app.root.dataset.theme);
  app.changeOS(!dark);
  assert.equal(app.root.dataset.theme, dark ? 'dark' : 'light');
  assert.match(app.attributes['aria-label'], dark ? /light/ : /dark/);
}
assert.equal(boot({ dark: true, saved: 'light' }).root.dataset.theme, 'light');
assert.equal(boot({ saved: 'unexpected' }).root.dataset.theme, 'light');
const preview = boot({ saved: 'dark', search: '?theme=light&cover-position=above&masthead=uniform&footer=centered' });
assert.equal(preview.root.dataset.theme, 'light');
assert.equal(preview.stored(), 'dark');
assert.equal(preview.root.dataset.coverPosition, 'above');
assert.equal(preview.root.dataset.masthead, 'uniform');
assert.equal(preview.root.dataset.footer, 'centered');
const retired = boot({ search: '?type=uniform17&cover=wide&links=blue&leading=relaxed&title=large' });
assert.deepEqual(Object.keys(retired.root.dataset), ['theme']);
preview.changeOS(true);
assert.equal(preview.root.dataset.theme, 'light');
assert.equal(boot({ search: '?type=bogus&theme=bogus' }).root.dataset.type, undefined);
const privateMode = boot({ storageFails: true, dark: true });
privateMode.click();
assert.equal(privateMode.root.dataset.theme, 'light');
console.log('PASS: OS-following, explicit theme, persistence, URL previews, option validation, unavailable storage.');
