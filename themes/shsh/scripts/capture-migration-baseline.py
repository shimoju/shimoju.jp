"""Rebuild the pre-migration commit in isolation; never mutate the frozen mock.

Python's standard library is used only for this development audit. Site builds
remain Hugo-only. The generated data is evidence, not an expected-output update
command: retain the fixed source ref when rerunning after migration.
"""
import csv
import hashlib
import io
import json
from pathlib import Path
import subprocess
import tarfile
import tempfile
from html.parser import HTMLParser
from urllib.parse import urljoin
import xml.etree.ElementTree as ET

THEME = Path(__file__).resolve().parents[1]
ROOT = THEME.parents[1]
REF = 'c266ebb'
CLOCK = '2026-09-17T12:00:00+09:00'
OUT = THEME / 'tests/baseline/migration.json'
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}


def run(*args, cwd=ROOT):
    return subprocess.check_output(args, cwd=cwd, text=True)


def extract_archive(repository, ref, destination, paths=()):
    archive = subprocess.check_output(['git', 'archive', ref, *paths], cwd=repository)
    with tarfile.open(fileobj=io.BytesIO(archive)) as tar:
        tar.extractall(destination, filter='data')


class Page(HTMLParser):
    def __init__(self, url):
        super().__init__(convert_charrefs=True)
        self.url = url
        self.stack = []
        self.body = []
        self.headings = []
        self.links = []
        self.media = []
        self.ids = []
        self.canonical = None
        self.body_roots = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        inside = any(item[1] for item in self.stack) or 'post-content' in attrs.get('class', '').split()
        if 'post-content' in attrs.get('class', '').split():
            self.body_roots += 1
        ignored = tag in {'script', 'style'} or any(item[2] for item in self.stack)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical = attrs.get('href')
        if tag == 'a' and 'href' in attrs:
            self.links.append({'url': urljoin(self.url, attrs['href']), 'body': inside})
        if tag in {'img', 'video', 'source', 'iframe'}:
            self.media.append({'tag': tag, 'body': inside, **attrs})
        if inside and tag in {'h1', 'h2', 'h3', 'h4', 'h5', 'h6'}:
            self.headings.append({'level': tag, 'id': attrs.get('id'), 'text': ''})
        if inside and tag in {'p', 'div', 'li', 'br', 'pre', 'blockquote', 'td', 'th', 'h2', 'h3', 'h4', 'h5', 'h6'}:
            self.body.append('\n')
        if tag not in VOID:
            self.stack.append((tag, inside, ignored))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        if self.stack and self.stack[-1][1] and not self.stack[-1][2]:
            self.body.append(data)
            if any(item[0] in {'h1', 'h2', 'h3', 'h4', 'h5', 'h6'} for item in self.stack):
                self.headings[-1]['text'] += data

    def record(self):
        return dict(canonical=self.canonical, body_roots=self.body_roots,
                    body_text=' '.join(''.join(self.body).split()), headings=self.headings,
                    ids=self.ids, links=self.links, media=self.media)


def main():
    with tempfile.TemporaryDirectory(prefix='shsh-baseline-') as directory:
        scratch = Path(directory)
        extract_archive(ROOT, REF, scratch, ['hugo.yml', 'content', 'static', 'assets', 'layouts', 'mock'])
        theme_ref = run('git', 'rev-parse', f'{REF}:themes/PaperMod').strip()
        extract_archive(ROOT / 'themes/PaperMod', theme_ref, scratch / 'themes/PaperMod')
        override = scratch / 'layouts/_shortcodes/x.html'
        override.parent.mkdir(parents=True, exist_ok=True)
        override.write_bytes((THEME / 'tests/fixtures/offline/layouts/_shortcodes/x.html').read_bytes())
        build = run('hugo', '--source', str(scratch), '--destination', str(scratch / 'public'), '--clock', CLOCK, '--cacheDir', str(scratch / 'cache'))
        listing = run('hugo', 'list', 'all', '--source', str(scratch), '--clock', CLOCK)
        pages = list(csv.DictReader(io.StringIO(listing)))
        sources = []
        for file in sorted((scratch / 'content').rglob('*')):
            if file.is_file():
                item = dict(path=file.relative_to(scratch).as_posix(), sha256=hashlib.sha256(file.read_bytes()).hexdigest(), bytes=file.stat().st_size)
                if file.suffix == '.md':
                    item['source'] = file.read_text()
                sources.append(item)
        mock = {file.relative_to(scratch).as_posix(): hashlib.sha256(file.read_bytes()).hexdigest()
                for file in sorted((scratch / 'mock').rglob('*')) if file.is_file()}
        html = {}
        feeds = {}
        public = scratch / 'public'
        for file in sorted(public.rglob('*.html')):
            path = '/' + file.relative_to(public).as_posix()
            url = 'https://shimoju.jp' + (path.removesuffix('index.html') if path.endswith('/index.html') else path)
            parser = Page(url)
            parser.feed(file.read_text())
            html[path] = parser.record()
        for file in sorted(public.rglob('index.xml')):
            channel = ET.parse(file).getroot().find('channel')
            assert channel is not None, file
            feeds['/' + file.relative_to(public).as_posix()] = [
                {name: item.findtext(name) for name in ['title', 'link', 'guid', 'pubDate', 'description']}
                for item in channel.findall('item')]
        posts = [p for p in pages if p['section'] == 'posts']
        assert len(posts) == 59, f'Baseline commit article count changed: {len(posts)}'
        assert len(pages) == 61
        for page in pages:
            path = '/' + page['permalink'].split('shimoju.jp/', 1)[1] + 'index.html'
            assert path in html, path
            if path != '/archives/index.html':
                assert html[path]['body_roots'] == 1, path
        assert len(feeds['/posts/index.xml']) == 59
        result = dict(format_version=1, source_ref=run('git', 'rev-parse', REF).strip(),
                      theme_ref=theme_ref, clock=CLOCK, hugo=run('hugo', 'version').strip(),
                      external_fetch='Only X is replaced by tests/fixtures/offline/layouts/_shortcodes/x.html. Raw Instagram and Speaker Deck and built-in YouTube markup are preserved; their browser connections are not exercised.',
                      content=pages, source_files=sources, frozen_mock_sha256=mock, html=html, feeds=feeds)
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
        print(build.strip())
        print(f'Captured {len(posts)} posts, {len(pages)} content pages, {len(html)} HTML outputs, {len(feeds)} feeds, {len(sources)} source/assets, {len(mock)} frozen mock files.')
        print(f'Evidence: {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
