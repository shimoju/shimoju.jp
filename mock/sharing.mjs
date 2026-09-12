// Mock-owned markup. Vendor scripts remain hosted by their respective services.
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const urlWith = (base, params) => `${base}?${new URLSearchParams(params)}`;

// Paths, not font glyphs: identical silhouettes on every OS, colored by currentColor.
const paths = {
  // Butterfly silhouette from the existing PaperMod icon, without its outline.
  bluesky: '<path d="M180 141.964C163.699 110.262 119.308 51.1817 78.0347 22.044C38.4971 -5.86834 23.414 -1.03207 13.526 3.43594C2.08093 8.60755 0 26.1785 0 36.5164C0 46.8542 5.66748 121.272 9.36416 133.694C21.5786 174.738 65.0603 188.607 105.104 184.156C107.151 183.852 109.227 183.572 111.329 183.312C109.267 183.642 107.19 183.924 105.104 184.156C46.4204 192.847 -5.69621 214.233 62.6582 290.33C137.848 368.18 165.705 273.637 180 225.702C194.295 273.637 210.76 364.771 295.995 290.33C360 225.702 313.58 192.85 254.896 184.158C252.81 183.926 250.733 183.645 248.671 183.315C250.773 183.574 252.849 183.855 254.896 184.158C294.94 188.61 338.421 174.74 350.636 133.697C354.333 121.275 360 46.8568 360 36.519C360 26.1811 357.919 8.61012 346.474 3.43851C336.586 -1.02949 321.503 -5.86576 281.965 22.0466C240.692 51.1843 196.301 110.262 180 141.964Z"/>',
  x: '<path d="M4 3h4.8L20 21h-4.8L4 3Zm2.7 1.5 9.3 15h1.3L8 4.5H6.7Z" fill-rule="evenodd"/><path d="m18.5 3 1.4 1-14.4 17-1.4-1L18.5 3Z"/>',
  facebook: '<path d="M14.5 22v-9h3l.5-3.5h-3.5V7.2c0-1 .3-1.7 1.8-1.7H18V2.3c-.7-.1-1.7-.3-2.8-.3-2.9 0-4.7 1.8-4.7 4.9v2.6H7V13h3.5v9h4Z"/>',
  hatena: '<path d="M3 4h5.5C12 4 14 5.5 14 8c0 1.5-.8 2.7-2.1 3.3 1.7.5 2.6 1.9 2.6 3.8 0 3.1-2.3 4.9-6 4.9H3V4Zm3.5 3v3h1.7c1.5 0 2.2-.5 2.2-1.5S9.7 7 8.2 7H6.5Zm0 6v4h2c1.6 0 2.4-.7 2.4-2S10.1 13 8.5 13h-2Z" fill-rule="evenodd"/><path d="M17 4h3.5v10H17z"/><circle cx="18.75" cy="18.25" r="1.75"/>',
  github: '<path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.58 9.58 0 0 1 12 6.82c.85 0 1.71.11 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/>',
  rss: '<circle cx="5" cy="19" r="2"/><path d="M3 3v3c8.28 0 15 6.72 15 15h3C21 11.06 12.94 3 3 3Zm0 6v3a9 9 0 0 1 9 9h3A12 12 0 0 0 3 9Z"/>',
};
// Crop canvas whitespace, not the artwork. Fit each silhouette into the shared
// square CSS viewport, preserving its aspect ratio and centering the short axis.
const bounds = {
  bluesky: [0, 0, 360, 320],
  x: [4, 3, 16, 18],
  facebook: [7, 2, 11, 20],
  hatena: [3, 4, 17.5, 16],
  github: [2, 2, 20, 20],
  rss: [3, 3, 18, 18],
};
export const icon = name => {
  const box = bounds[name];
  return `<svg viewBox="${box.join(' ')}" width="${box[2]}" height="${box[3]}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
};
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
  <div class="star-widget" aria-label="Hatena Star"><div data-hatena-star-container data-hatena-star-url="${escape(post.publicUrl)}" data-hatena-star-title="${escape(post.title)}" data-hatena-star-variant="profile-icon" data-hatena-star-profile-url-template="https://blog.hatena.ne.jp/{username}/"></div><noscript>Hatena Star requires JavaScript.</noscript></div>
  <p class="widget-status" role="status" aria-live="polite"></p>
</div>`;
}
