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
  const location = { search, origin: 'http://mock.invalid', pathname: '/article.html', hash };
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
  runInNewContext(source, { document, getComputedStyle: () => ({ getPropertyValue: name => cssReady ? name : '' }), URL, URLSearchParams, matchMedia: () => os, localStorage, location, history: { replaceState: (_, __, url) => historyUrls.push(url) } });
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
for (const choice of ['200', '300', '500', 'invalid']) {
  const app = boot({ search: `?site-weight=${choice}&theme=dark` });
  assert.equal(app.root.dataset.siteWeight, undefined, 'Retired site-weight preview does not override adopted weight');
  assert.equal(new URL(app.follow('http://mock.invalid/about.html')).searchParams.get('site-weight'), null);
}
for (const share of ['icons', 'official', 'invalid']) {
  const app = boot({ search: `?share=${share}` });
  assert.equal(app.root.dataset.share, undefined);
  assert.equal(new URL(app.follow('http://mock.invalid/article-hugo.html')).searchParams.get('share'), null);
}
console.log('PASS: OS-following, persistence, previews, navigation, retired options, cold-cache font display, unavailable storage.');

for (const value of ['', 'corner', 'navigation', 'invalid']) {
  const app = boot({ search: '?toggle-position=' + value, withForm: true });
  assert.equal(app.root.dataset.togglePosition, undefined);
  assert.equal(app.fields['toggle-position'], undefined);
  assert.equal(new URL(app.follow('http://mock.invalid/about.html')).searchParams.get('toggle-position'), null);
}
console.log('PASS: retired toggle-position preview does not override the adopted header layout.');

for (const choice of ['current', '48', 'invalid']) {
  const app = boot({ search: `?controls=${choice}&theme=dark`, withForm: true });
  assert.equal(app.root.dataset.controls, undefined);
  assert.equal(app.fields.controls, undefined);
  assert.equal(new URL(app.follow('http://mock.invalid/about.html')).searchParams.get('controls'), null);
}
const controlCss = readFileSync(new URL('src/theme.css', import.meta.url), 'utf8');
assert.match(controlCss, /--control-size: var\(--ui-space-12\);/);
assert.doesNotMatch(controlCss, /data-controls/);
const controlRule = selector => controlCss.split('\n').find(line => line.startsWith(selector + ' {'))?.split('}')[0] || '';
for (const selector of ['.site-nav a', '.article-tags a', '.terms a']) {
  const rule = controlRule(selector);
  assert(rule.includes('min-height: var(--control-size)'));
  assert(!rule.includes('min-width:'), selector + ' keeps its content width');
}
for (const selector of ['.icon-link', '.pager a', '.site-name']) {
  assert(controlRule(selector).includes('min-width: var(--control-size)'));
  assert(controlRule(selector).includes('min-height: var(--control-size)'));
}
for (const selector of ['.entry-link', '.post-nav a', '.archive-month a']) {
  assert(controlRule(selector).includes('min-height: var(--control-size)'));
}
assert.match(controlCss, /\.site-nav \{[^}]*column-gap: var\(--ui-space-6\);/);
assert.match(controlCss, /\.site-nav \{ column-gap: var\(--ui-space-4\);/);
assert.match(controlCss, /--control-size-small: var\(--ui-space-8\);/);
assert.doesNotMatch(controlCss, /--copy-control-size|border-radius: 50%/);
const smallControl = controlRule('.theme-toggle, .copy');
for (const property of ['width', 'height', 'min-width', 'min-height']) assert(smallControl.includes(`${property}: var(--control-size-small);`));
assert(smallControl.includes('padding: var(--ui-space-2);'));
assert(smallControl.includes('border-radius: var(--radius-small);'));
assert(controlRule('.theme-toggle svg, .copy svg').includes('width: var(--icon-size-small); height: var(--icon-size-small);'));
console.log('PASS: 48px/24px large icons, 32px/16px small icons, shared small radius, natural-width text links.');

for (const value of ['columns', 'stacked', 'invalid']) {
  const app = boot({ search: '?post-nav=' + value, withForm: true });
  assert.equal(app.root.dataset.postNav, undefined);
  assert.equal(app.fields['post-nav'], undefined);
  assert.equal(new URL(app.follow('http://mock.invalid/article-hugo.html')).searchParams.get('post-nav'), null);
}
console.log('PASS: retired mobile navigation preview does not override the adopted layout.');

for (const [key, dataset, allowed] of [['heading-rhythm', 'headingRhythm', ['related']], ['quote-line', 'quoteLine', ['stronger']], ['heading-links', 'headingLinks', ['always', 'contextual']]]) {
  for (const value of ['', 'invalid', ...allowed]) {
    const app = boot({ search: `?${key}=${value}`, withForm: true, storageFails: true });
    assert.equal(app.root.dataset[dataset], undefined);
    assert.equal(app.fields[key], undefined);
    assert.equal(new URL(app.follow('http://mock.invalid/about.html')).searchParams.get(key), null);
    assert.equal(new URL(app.follow('http://mock.invalid/index.html')).searchParams.get(key), null);
    assert.equal(new URL(app.follow(`http://mock.invalid/specimen.html?${key}=`)).searchParams.get(key), '');
    assert.equal(app.follow('https://example.com/article.html'), 'https://example.com/article.html');
    assert.equal(app.follow('#heading-three'), '#heading-three');
  }
}
const combined = boot({ search: '?heading-rhythm=related&quote-line=stronger&heading-links=contextual&theme=light', withForm: true });
combined.click();
assert.equal(combined.root.dataset.headingLinks, undefined);
assert.equal(new URL(combined.follow('http://mock.invalid/about.html')).searchParams.get('theme'), 'dark');
assert.equal(combined.stored(), 'dark', 'Visual variants do not change saved preferences');
console.log('PASS: retired detail variants cannot override adopted spacing, quote colors or heading links.');
