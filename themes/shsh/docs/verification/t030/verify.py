"""Audit the actual Pages build. Run from themes/shsh after build-pages.sh."""

import hashlib
import json
import re
from html.parser import HTMLParser
from pathlib import Path
import xml.etree.ElementTree as ET


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.elements = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        self.elements.append((tag, dict(attrs)))


target = dict(line.split("=", 1) for line in Path(".cache/pages/target.txt").read_text().splitlines())
root = Path(".cache/pages/public")
base = target["base_url"]
preview = target["environment"] == "preview"
pages = sorted(root.rglob("*.html"))
aliases = 0
for path in pages:
    page = Page(path.read_text())
    canonical = [a["href"] for tag, a in page.elements if tag == "link" and a.get("rel") == "canonical"]
    assert len(canonical) == 1 and canonical[0].startswith(base), (path, canonical)
    metas = [a for tag, a in page.elements if tag == "meta"]
    if any(a.get("http-equiv", "").lower() == "refresh" for a in metas):
        aliases += 1
        continue
    assert any(a.get("property") == "og:url" and a.get("content") == canonical[0] for a in metas), path
    noindex = any(a.get("name") == "robots" and "noindex" in a.get("content", "") for a in metas)
    assert noindex == preview, path

about_source = (root / "about/index.html").read_text()
about = Page(about_source)
shares = [(tag, a) for tag, a in about.elements if "share-icon" in a.get("class", "").split()]
assert len(shares) == 4
assert all(tag == ("button" if preview else "a") and ("disabled" in a) == preview for tag, a in shares)
assert ("data-hatena-star-container" in about_source) == (not preview)
rss_count = 0
for path in sorted(root.rglob("*.xml")):
    document = ET.parse(path).getroot()
    if document.tag != "rss":
        continue
    rss_count += 1
    for element in document.findall("./channel/link") + document.findall("./channel/item/link") + document.findall("./channel/item/guid"):
        assert element.text.startswith(base), (path, element.text)
assert rss_count > 0

assets = []
for directory in ("css", "js"):
    for path in sorted((root / directory).rglob("*")):
        if not path.is_file():
            continue
        assert re.search(r"\.[0-9a-f]{64}\.(css|js)$", path.name), path
        data = path.read_bytes()
        assert b"sourceMappingURL" not in data, path
        assets.append({"path": str(path.relative_to(root)), "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()})
assert assets and not list(root.rglob("*.map"))
for name in ("_headers", "_redirects"):
    assert (root / name).read_bytes() == (Path("../../static") / name).read_bytes()
robots = (root / "robots.txt").read_text()
assert ("Disallow: /\n" in robots) == preview
assert preview or f"Sitemap: {base}sitemap.xml" in robots

report = {"target": target, "html_count": len(pages), "alias_count": aliases, "rss_count": rss_count,
          "assets": assets, "share_count": len(shares), "result": "passed"}
output = Path("docs/verification/t030") / f"{target['environment']}-output.json"
output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
print(f"{target['environment']}: {len(pages)} HTML, {aliases} aliases, {rss_count} RSS, {len(assets)} assets passed")
