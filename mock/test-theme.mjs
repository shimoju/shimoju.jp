import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('src/theme.js', import.meta.url), 'utf8');
function boot({ dark = false, saved = null, search = '', hash = '', storageFails = false, withForm = false, withFontStacks = false } = {}) {
  const root = { dataset: {}, setAttribute(name, value) { this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value; } };
  const callbacks = {};
  const attributes = {};
  const button = { setAttribute: (name, value) => attributes[name] = value, addEventListener: (name, fn) => callbacks[name] = fn };
  const os = { matches: dark, addEventListener: (_, fn) => callbacks.osChange = fn };
  const fields = { theme: {} };
  const historyUrls = [];
  let cssReady = false;
  const fontOutputs = { body: {}, code: {}, site: {} };
  const form = { elements: { namedItem: name => fields[name] }, addEventListener() {} };
  const document = {
    documentElement: root,
    defaultView: { addEventListener: (name, fn) => { if (name === 'load') callbacks.load = fn; } },
    addEventListener: (name, fn) => { if (name === 'DOMContentLoaded') fn(); else if (name === 'click') callbacks.linkClick = fn; },
    querySelector: selector => selector === '.theme-toggle' ? button : selector === '#comparison-form' && withForm ? form : withFontStacks && selector.startsWith('[data-font-stack=') ? fontOutputs[selector.match(/"([^"]+)"/)[1]] : null,
    querySelectorAll: () => [],
  };
  let stored = saved;
  const localStorage = {
    getItem: () => { if (storageFails) throw new Error('Unavailable'); return stored; },
    setItem: (_, value) => { if (storageFails) throw new Error('Unavailable'); stored = value; },
  };
  runInNewContext(source, { document, getComputedStyle: () => ({ getPropertyValue: name => cssReady ? name : '' }), URL, URLSearchParams, matchMedia: () => os, localStorage, location: { search, origin: 'http://mock.invalid', pathname: '/article.html', hash }, history: { replaceState: (_, __, url) => historyUrls.push(url) } });
  return { root, attributes, fields, stored: () => stored, click: () => callbacks.click(), changeOS: value => callbacks.osChange({ matches: value }),
    fontOutputs, loadStyles() { cssReady = true; callbacks.load(); },
    historyUrls,
    follow(href) { const link = typeof href === 'string' ? { href, getAttribute: () => href } : href; callbacks.linkClick({ target: { closest: () => link } }); return link.href; } };
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
const preview = boot({ saved: 'dark', search: '?theme=light&masthead=avenir' });
assert.equal(preview.root.dataset.theme, 'light');
assert.equal(preview.stored(), 'dark');
assert.equal(preview.root.dataset.masthead, undefined);
for (const font of ['humanist', 'geometric', 'grotesque', 'arial']) assert.equal(boot({ search: `?font=${font}` }).root.dataset.font, undefined);
for (const value of ['avenir', 'body', 'uniform', 'bogus']) assert.equal(boot({ search: `?masthead=${value}` }).root.dataset.masthead, undefined);
const retired = boot({ search: '?type=uniform17&cover=wide&links=blue&leading=relaxed&title=large&cover-position=above&masthead=uniform&footer=centered' });
assert.deepEqual(Object.keys(retired.root.dataset), ['theme']);
preview.changeOS(true);
assert.equal(preview.root.dataset.theme, 'light');
assert.equal(boot({ search: '?type=bogus&theme=bogus' }).root.dataset.type, undefined);
const privateMode = boot({ storageFails: true, dark: true });
privateMode.click();
assert.equal(privateMode.root.dataset.theme, 'light');
const formPreview = boot({ search: '?masthead=avenir&theme=dark&footer=centered', withForm: true });
assert.equal(formPreview.fields.masthead, undefined);
assert.equal(formPreview.fields.theme.value, 'dark');
formPreview.click();
assert.equal(formPreview.fields.theme.value, 'light');
const followed = new URL(formPreview.follow('http://mock.invalid/about.html'));
assert.equal(followed.searchParams.get('masthead'), null);
assert.equal(followed.searchParams.get('theme'), 'light');
assert.equal(followed.searchParams.get('footer'), null);
const comparison = new URL(formPreview.follow('http://mock.invalid/index.html?masthead=body'));
assert.equal(comparison.searchParams.get('masthead'), 'body');
assert.equal(comparison.searchParams.get('theme'), null);
assert.equal(formPreview.follow('https://example.com/'), 'https://example.com/');
assert.equal(formPreview.follow('http://mock.invalid/index.html'), 'http://mock.invalid/index.html');
const coldCache = boot({ withFontStacks: true });
assert.equal(coldCache.fontOutputs.body.textContent, '');
coldCache.loadStyles();
for (const name of ['body', 'code', 'site']) assert.equal(coldCache.fontOutputs[name].textContent, '--font-' + name);
for (const value of ['medium', '500', 'invalid']) assert.equal(boot({ search: `?heading=${value}` }).root.dataset.heading, undefined);
for (const choice of ['native', 'segoe', 'explicit', 'system', 'invalid']) {
  const app = boot({ search: `?typography=${choice}&theme=light` });
  assert.equal(app.root.dataset.typography, undefined, 'Retired typography choices do not affect the adopted font');
  assert.equal(new URL(app.follow('http://mock.invalid/about.html')).searchParams.get('typography'), null);
}
for (const choice of ['current', 'scale', 'plus-one', 'plus-two', 'invalid']) {
  const app = boot({ search: `?heading-space=${choice}&theme=dark` });
  assert.equal(app.root.dataset.proseSpacing, undefined, 'Retired spacing choices do not override adopted margins');
  assert.equal(new URL(app.follow('http://mock.invalid/about.html')).searchParams.get('heading-space'), null);
}
console.log('PASS: OS-following, persistence, color previews, navigation, retired options, cold-cache font display, unavailable storage.');
