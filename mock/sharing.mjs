// Mock-owned markup. Vendor scripts remain hosted by their respective services.
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const urlWith = (base, params) => `${base}?${new URLSearchParams(params)}`;

// Paths, not font glyphs: identical silhouettes on every OS, colored by currentColor.
const paths = {
  x: '<path d="M4 3h4.8L20 21h-4.8L4 3Zm2.7 1.5 9.3 15h1.3L8 4.5H6.7Z" fill-rule="evenodd"/><path d="m18.5 3 1.4 1-14.4 17-1.4-1L18.5 3Z"/>',
  facebook: '<path d="M14.5 22v-9h3l.5-3.5h-3.5V7.2c0-1 .3-1.7 1.8-1.7H18V2.3c-.7-.1-1.7-.3-2.8-.3-2.9 0-4.7 1.8-4.7 4.9v2.6H7V13h3.5v9h4Z"/>',
  hatena: '<path d="M3 4h5.5C12 4 14 5.5 14 8c0 1.5-.8 2.7-2.1 3.3 1.7.5 2.6 1.9 2.6 3.8 0 3.1-2.3 4.9-6 4.9H3V4Zm3.5 3v3h1.7c1.5 0 2.2-.5 2.2-1.5S9.7 7 8.2 7H6.5Zm0 6v4h2c1.6 0 2.4-.7 2.4-2S10.1 13 8.5 13h-2Z" fill-rule="evenodd"/><path d="M17 4h3.5v10H17z"/><circle cx="18.75" cy="18.25" r="1.75"/>',
  github: '<path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.58 9.58 0 0 1 12 6.82c.85 0 1.71.11 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/>',
  rss: '<circle cx="5" cy="19" r="2"/><path d="M3 3v3c8.28 0 15 6.72 15 15h3C21 11.06 12.94 3 3 3Zm0 6v3a9 9 0 0 1 9 9h3A12 12 0 0 0 3 9Z"/>',
};
export const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
export function shareLinks(url, title) {
  return [
    ['x', 'X', urlWith('https://x.com/intent/tweet', { text: title, url })],
    ['facebook', 'Facebook', urlWith('https://www.facebook.com/sharer/sharer.php', { u: url })],
    ['hatena', 'Hatena Bookmark', `https://b.hatena.ne.jp/entry/${url.startsWith('https://') ? 's/' : ''}${url.replace(/^https?:\/\//, '')}`],
  ];
}

export function engagement(post) {
  if (!post.publicUrl) return '';
  const links = shareLinks(post.publicUrl, post.title);
  const icons = links.map(([id, name, href]) => `<a class="icon-link share-icon" href="${escape(href)}" target="_blank" rel="noopener noreferrer" aria-label="${id === 'hatena' ? 'View on' : 'Share on'} ${name} (opens in a new tab)" title="${name}">${icon(id)}</a>`).join('');
  return `<div class="engagement" id="engagement" data-sharing-entry>
  <div class="share-mount" aria-label="Share this article" lang="en"><div class="share-icons">${icons}</div></div>
  <div class="star-widget" aria-label="Hatena Star"><div data-hatena-star-container data-hatena-star-url="${escape(post.publicUrl)}" data-hatena-star-title="${escape(post.title)}" data-hatena-star-variant="profile-icon" data-hatena-star-profile-url-template="https://blog.hatena.ne.jp/{username}/"></div><noscript>Hatena Star requires JavaScript.</noscript></div>
  <p class="widget-status" role="status" aria-live="polite"></p>
</div>`;
}
