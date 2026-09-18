"""Read-only HTTP verification of the T034 Pages Git preview."""
import hashlib
import json
import re
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler
import xml.etree.ElementTree as ET

BASE = 'https://2f9d9a6b.shimoju.pages.dev/'
OUT = Path(__file__).parent
class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None
class Page(HTMLParser):
    def __init__(self, source):
        super().__init__(); self.elements = []; self.feed(source)
    def handle_starttag(self, tag, attrs):
        self.elements.append((tag, dict(attrs)))
def fetch(path):
    url = urljoin(BASE, path)
    try:
        response = build_opener(NoRedirect).open(Request(url, headers={'User-Agent': 'shsh-migration-verification'}), timeout=30)
    except HTTPError as error:
        response = error
    body = response.read()
    record = {'url': url, 'status': response.status, 'headers': {key.lower(): value for key,value in response.headers.items() if key.lower() in ['content-type','x-robots-tag','location','cache-control']}, 'bytes':len(body), 'sha256':hashlib.sha256(body).hexdigest()}
    return record, body
home_record, home_body = fetch('/')
home = Page(home_body.decode())
article = next(a['href'] for t,a in home.elements if t=='a' and re.search(r'/\d{4}/\d{2}/\d{2}/', a.get('href','')))
paths = ['/', '/about/', '/archives/', '/posts/', '/page/2/', '/tags/', article]
records = []
assets = set()
for record, body in ThreadPoolExecutor(max_workers=4).map(fetch, paths):
    assert record['status']==200, record
    assert 'noindex' in record['headers'].get('x-robots-tag',''), record
    source = body.decode(); page = Page(source)
    canonical = [a['href'] for t,a in page.elements if t=='link' and a.get('rel')=='canonical']
    assert canonical==[record['url']], (record['url'],canonical)
    assert any(t=='meta' and a.get('name')=='robots' and 'noindex' in a.get('content','') for t,a in page.elements)
    assert any(t=='meta' and a.get('property')=='og:url' and a.get('content')==canonical[0] for t,a in page.elements)
    assert 'data-hatena-star-container' not in source
    shares=[(t,a) for t,a in page.elements if 'share-icon' in a.get('class','').split()]
    if record['url'].endswith('/about/') or record['url']==urljoin(BASE,article):
        assert len(shares)==4 and all(t=='button' and 'disabled' in a for t,a in shares)
    record['canonical']=canonical[0];record['disabled_shares']=len(shares)
    for t,a in page.elements:
        value=a.get('href','') if t=='link' and a.get('rel')=='stylesheet' else a.get('src','') if t=='script' else ''
        if value: assets.add(urljoin(BASE,value))
    records.append(record)
for path in ['/index.xml','/posts/index.xml','/tags/index.xml','/categories/index.xml']:
    record,body=fetch(path);assert record['status']==200
    doc=ET.fromstring(body)
    for element in doc.findall('./channel/link')+doc.findall('./channel/item/link')+doc.findall('./channel/item/guid'):
        assert element.text.startswith(BASE), element.text
    records.append(record)
for path,expected in [('/feed.xml',301),('/__shsh_t035_missing__/',404),('/robots.txt',200)]:
    record,body=fetch(path);assert record['status']==expected, record
    if path=='/feed.xml': assert urljoin(BASE,record['headers']['location'])==BASE+'index.xml'
    if path=='/robots.txt': assert 'Disallow: /\n' in body.decode()
    records.append(record)
for url in sorted(assets):
    assert urlsplit(url).netloc==urlsplit(BASE).netloc
    record,body=fetch(url);assert record['status']==200, record
    fingerprint=re.search(r'\.([0-9a-f]{64})\.(css|js)$', url)
    assert fingerprint and fingerprint[1]==record['sha256'], url
    assert b'sourceMappingURL' not in body
    records.append(record)
report={'recorded_at':datetime.now(timezone.utc).isoformat(),'commit':'18a9ab1c1928e12409ac0381f8063e0b4b6d13fd','base_url':BASE,'result':'passed','responses':records}
(OUT/'preview-http.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(f'{len(paths)} HTML, 4 RSS, 301/404/robots, {len(assets)} fingerprinted assets passed')
