import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('src/theme.js', import.meta.url), 'utf8');
const originalCode = '# 日本語コメント\n[tools]\nruby = "3.4"\n';
function setup({ forceFailure = false, rejectClipboard = false } = {}) {
  const events = {};
  const timers = new Map();
  const writes = [];
  const feedback = { textContent: '' };
  let timerId = 0;
  let shouldReject = rejectClipboard;
  const copy = {
    textContent: 'Copy', disabled: false, attributes: {},
    setAttribute(k, v) { this.attributes[k] = v; },
    removeAttribute(k) { delete this.attributes[k]; },
    addEventListener(name, fn) { events[name] = fn; },
    closest() { return block; },
  };
  const code = { cloneNode() {
    let numbered = true;
    return {
      querySelectorAll() { return [{ remove() { numbered = false; } }]; },
      get textContent() { return numbered ? '1' + originalCode : originalCode; },
    };
  } };
  const block = { querySelector: s => s === '.copy-feedback' ? feedback : code };
  const document = {
    documentElement: { dataset: {} },
    querySelector: () => null,
    querySelectorAll: s => s === '.copy' ? [copy] : [],
    addEventListener(name, fn) { if (name === 'DOMContentLoaded') fn(); },
  };
  runInNewContext(source, {
    document, URLSearchParams,
    location: { search: forceFailure ? '?copy=failure' : '' },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    localStorage: { getItem: () => null },
    navigator: { clipboard: { async writeText(text) { if (shouldReject) throw new Error('Denied'); writes.push(text); } } },
    setTimeout(fn, delay) { assert.equal(delay, 3000); timers.set(++timerId, fn); return timerId; },
    clearTimeout(id) { timers.delete(id); },
  });
  return { copy, feedback, timers, writes, click: () => events.click(), allowClipboard() { shouldReject = false; } };
}
const app = setup();
await app.click();
assert.deepEqual(app.writes, [originalCode]);
assert.equal(app.copy.textContent, 'Copied');
assert.equal(app.copy.disabled, false);
assert.equal(app.feedback.textContent, 'Code copied.');
await app.click();
assert.equal(app.timers.size, 1, 'Repeated copy replaces the old reset timer');
[...app.timers.values()][0]();
assert.equal(app.copy.textContent, 'Copy');
assert.equal(app.copy.attributes['aria-label'], 'Copy code');
assert.equal(app.feedback.textContent, '');
const denied = setup({ rejectClipboard: true });
await denied.click();
assert.equal(denied.copy.textContent, 'Copy failed');
assert.equal(denied.copy.disabled, false);
assert.equal(denied.timers.size, 0);
denied.allowClipboard();
await denied.click();
assert.equal(denied.copy.textContent, 'Copied');
const fixture = setup({ forceFailure: true });
await fixture.click();
assert.equal(fixture.copy.textContent, 'Copy failed');
assert.equal(fixture.writes.length, 0);
console.log('PASS: copied payload, no line numbers, 3000ms reset, repeat copy, denied clipboard, retry, failure fixture.');
