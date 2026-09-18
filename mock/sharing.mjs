// Mock-owned markup. Vendor scripts remain hosted by their respective services.
import { icon } from './icons.mjs';

const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const urlWith = (base, params) => `${base}?${new URLSearchParams(params)}`;

export function shareLinks(url, title) {
  return [
    ['x', 'X', urlWith('https://x.com/intent/tweet', { text: title, url })],
    ['facebook', 'Facebook', urlWith('https://www.facebook.com/sharer/sharer.php', { u: url })],
    ['bluesky', 'Bluesky', urlWith('https://bsky.app/intent/compose', { text: `${title}\n${url}` })],
    ['hatena', 'Hatena Bookmark', `https://b.hatena.ne.jp/entry/${url.startsWith('https://') ? 's/' : ''}${url.replace(/^https?:\/\//, '')}`],
  ];
}

export function engagement(post) {
  if (!post.publicUrl) return '';
  const links = shareLinks(post.publicUrl, post.title);
  const icons = links.map(([id, name, href]) => `<a class="icon-link share-icon" href="${escape(href)}" target="_blank" rel="noopener noreferrer" aria-label="${id === 'hatena' ? 'View on' : 'Share on'} ${name} (opens in a new tab)" title="${name}">${icon(id)}</a>`).join('');
  return `<div class="engagement" id="engagement" data-sharing-entry>
  <div class="share-mount" aria-label="Share this article" lang="en"><div class="share-icons">${icons}</div></div>
  <div class="star-widget" aria-label="Hatena Star"><div data-hatena-star-container data-hatena-star-url="${escape(post.publicUrl)}" data-hatena-star-title="${escape(post.title)}" data-hatena-star-variant="profile-icon" data-hatena-star-profile-url-template="https://blog.hatena.ne.jp/{username}/"></div><noscript lang="en">Hatena Star requires JavaScript.</noscript></div>
  <p class="widget-status" role="status" aria-live="polite" lang="en"></p>
</div>`;
}
