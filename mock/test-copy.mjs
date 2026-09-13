import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('src/theme.js', import.meta.url), 'utf8');
const originalCode = '# 日本語コメント\n[tools]\nruby = "3.4"\n';
function setup({ forceFailure = false, rejectClipboard = false } = {}) {
  const events = {};
  const blockEvents = {};
  const preEvents = {};
  const documentEvents = {};
  const timers = new Map();
  const writes = [];
  const feedback = { textContent: '' };
  let timerId = 0;
  let shouldReject = rejectClipboard;
  const copy = {
    dataset: { copyState: 'idle' }, hidden: true, disabled: false, attributes: {},
    setAttribute(k, v) { this.attributes[k] = v; },
    removeAttribute(k) { delete this.attributes[k]; },
    addEventListener(name, fn) { events[name] = fn; },
    closest() { return block; },
  };
  const pre = {
    closest: () => null,
    addEventListener(name, fn) { preEvents[name] = fn; },
    focus() { document.activeElement = pre; blockEvents.focusin(); },
  };
  const code = { cloneNode() {
    let numbered = true;
    return {
      querySelectorAll() { return [{ remove() { numbered = false; } }]; },
      get textContent() { return numbered ? '1' + originalCode : originalCode; },
    };
  } };
  const block = {
    dataset: {},
    querySelector: s => s === '.copy-feedback' ? feedback : s === 'pre' ? pre : code,
    addEventListener(name, fn) { blockEvents[name] = fn; },
    contains(target) { return [block, copy, pre].includes(target); },
  };
  const document = {
    documentElement: { dataset: {} },
    querySelector: () => null,
    querySelectorAll: s => s === '.copy' ? [copy] : [],
    activeElement: null,
    addEventListener(name, fn) {
      if (name === 'DOMContentLoaded') fn();
      else (documentEvents[name] ||= []).push(fn);
    },
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
  return { copy, feedback, timers, writes, block, pre, document, blockEvents, preEvents,
    click: () => events.click(),
    tap: () => blockEvents.click({ target: pre }),
    outside: () => documentEvents.pointerdown.forEach(fn => fn({ target: {} })),
    escape: () => documentEvents.keydown.forEach(fn => fn({ key: 'Escape' })),
    allowClipboard() { shouldReject = false; } };
}
const app = setup();
assert.equal(app.copy.hidden, false, 'Only enable the icon after its handlers are installed');
assert.equal(app.block.dataset.copyVisible, undefined);
app.tap();
assert.equal(app.block.dataset.copyVisible, '', 'A code tap reveals the button without copying');
assert.equal(app.writes.length, 0);
app.outside();
assert.equal(app.block.dataset.copyVisible, undefined);
assert.equal(app.block.dataset.copyDismissed, '');
app.blockEvents.pointerenter({ pointerType: 'mouse' });
assert.equal(app.block.dataset.copyDismissed, undefined);
await app.click();
assert.deepEqual(app.writes, [originalCode]);
assert.equal(app.copy.dataset.copyState, 'success');
assert.equal(app.copy.disabled, false);
assert.equal(app.feedback.textContent, 'Code copied.');
await app.click();
assert.equal(app.timers.size, 1, 'Repeated copy replaces the old reset timer');
[...app.timers.values()][0]();
assert.equal(app.copy.dataset.copyState, 'idle');
assert.equal(app.copy.attributes['aria-label'], 'Copy code');
assert.equal(app.feedback.textContent, '');
const denied = setup({ rejectClipboard: true });
await denied.click();
assert.equal(denied.copy.dataset.copyState, 'error');
assert.match(denied.copy.title, /manually, or retry/);
assert.match(denied.feedback.textContent, /manually, or retry/);
assert.equal(denied.copy.disabled, false);
assert.equal(denied.timers.size, 0);
denied.allowClipboard();
await denied.click();
assert.equal(denied.copy.dataset.copyState, 'success');
const fixture = setup({ forceFailure: true });
await fixture.click();
assert.equal(fixture.copy.dataset.copyState, 'error');
assert.equal(fixture.writes.length, 0);
app.document.activeElement = app.copy;
app.escape();
assert.equal(app.document.activeElement, app.pre, 'Escape moves focus to readable code instead of leaving it on a hidden button');
assert.equal(app.block.dataset.copyDismissed, '');
app.tap();
app.preEvents.scroll();
assert.equal(app.block.dataset.copyVisible, undefined, 'Horizontal scrolling dismisses the overlay');
assert.equal(app.block.dataset.copyDismissed, '');
app.tap();
app.blockEvents.pointerleave({ pointerType: 'touch' });
assert.equal(app.block.dataset.copyVisible, '', 'Touch controls persist until dismissed');
app.blockEvents.pointerleave({ pointerType: 'mouse' });
assert.equal(app.block.dataset.copyVisible, undefined);
assert.equal(app.block.dataset.copyDismissed, undefined);
console.log('PASS: icon states, tap reveal, outside/Escape/scroll dismissal, focus return, copied payload, line-number exclusion, 3000ms reset, retry, failure fixture.');
