"""Read-only HTTP verification of PR #5's fixed preview."""

import datetime
import hashlib
import json
import re
import subprocess
import tempfile
import urllib.parse
import xml.etree.ElementTree as ET
from email.parser import Parser
from html.parser import HTMLParser
from pathlib import Path

BASE = "https://24b23fc4.shimoju.pages.dev"
DEVICE_BASE = "https://6f52990f.shimoju.pages.dev"
SHA = "7b55a999218fdb8481ea6347e464c062d1579dfd"
ROOT = Path(__file__).resolve().parent


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.elements = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        self.elements.append((tag, dict(attrs)))


def fetch(url, follow=True):
    # Python urllib receives Cloudflare 1010 here; use the working curl client.
    # Keep redirects disabled for the feed's first-response status check.
    with tempfile.TemporaryDirectory(prefix="shsh-t071-") as directory:
        temp = Path(directory)
        command = ["curl", "--silent", "--show-error", "--max-time", "30",
                   "--dump-header", str(temp / "headers"), "--output", str(temp / "body"),
                   "--write-out", "%{http_code}"]
        if follow:
            command.append("--location")
        completed = subprocess.run(command + [url], check=True, capture_output=True, text=True)
        body = (temp / "body").read_bytes()
        blocks = (temp / "headers").read_text().strip().split("\n\n")
        headers = Parser().parsestr(blocks[-1].split("\n", 1)[1])
        result = {
            "url": url,
            "status": int(completed.stdout),
            "content_type": headers.get("Content-Type"),
            "x_robots_tag": headers.get("X-Robots-Tag"),
            "location": headers.get("Location"),
            "bytes": len(body),
            "sha256": hashlib.sha256(body).hexdigest(),
        }
    return result, body


report = {"recorded_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
          "commit": SHA, "base": BASE, "device_preview": DEVICE_BASE,
          "pages": [], "assets": [], "checks": {}}
assets = set()
for path in ["/", "/about/", "/page/2/", "/2026/09/01/development-environment-2026/"]:
    result, body = fetch(BASE + path)
    source = body.decode()
    elements = Page(source).elements
    canonical = [a.get("href") for t, a in elements if t == "link" and a.get("rel") == "canonical"]
    og = [a.get("content") for t, a in elements if t == "meta" and a.get("property") == "og:url"]
    robots = [a.get("content", "") for t, a in elements if t == "meta" and a.get("name") == "robots"]
    shares = [(t, a) for t, a in elements if "share-icon" in a.get("class", "").split()]
    result.update(canonical=canonical, og_url=og, html_robots=robots,
                  share_count=len(shares), star_container="data-hatena-star-container" in source)
    checks = {
        "status_200": result["status"] == 200,
        "http_noindex": "noindex" in (result["x_robots_tag"] or ""),
        "html_noindex": any("noindex" in value for value in robots),
        "canonical": canonical == [BASE + path],
        "og_url": og == [BASE + path],
        "star_absent": not result["star_container"],
    }
    if path in ["/about/", "/2026/09/01/development-environment-2026/"]:
        checks["shares_disabled"] = len(shares) == 4 and all(t == "button" and "disabled" in a for t, a in shares)
    for tag, attrs in elements:
        if tag == "link" and attrs.get("rel") == "stylesheet":
            assets.add(urllib.parse.urlsplit(attrs["href"]).path)
        if tag == "script" and attrs.get("src", "").split("?")[0].endswith(".js"):
            url = urllib.parse.urljoin(BASE, attrs["src"])
            if urllib.parse.urlsplit(url).netloc == urllib.parse.urlsplit(BASE).netloc:
                assets.add(urllib.parse.urlsplit(url).path)
    result["checks"] = checks
    report["pages"].append(result)

for path in sorted(assets):
    result, body = fetch(BASE + path)
    previous, previous_body = fetch(DEVICE_BASE + path)
    mapping, _ = fetch(BASE + path + ".map")
    fingerprint = re.search(r"\.([a-f0-9]{64})\.(css|js)$", path)
    result["device_sha256"] = previous["sha256"]
    result["map_status"] = mapping["status"]
    result["checks"] = {
        "status_200": result["status"] == 200,
        "fingerprint": bool(fingerprint) and fingerprint.group(1) == result["sha256"],
        "device_preview_identical": previous["status"] == 200 and body == previous_body,
        "no_source_map_reference": b"sourceMappingURL" not in body,
        "no_source_map_response": mapping["status"] == 404,
    }
    report["assets"].append(result)

feed, body = fetch(BASE + "/index.xml")
root = ET.fromstring(body)
urls = [node.text for node in root.findall("./channel/link") + root.findall("./channel/item/link") + root.findall("./channel/item/guid")]
feed["item_count"] = len(root.findall("./channel/item"))
feed["urls_use_preview"] = all(url and url.startswith(BASE + "/") for url in urls)
report["rss"] = feed
redirect, _ = fetch(BASE + "/feed.xml", follow=False)
missing, _ = fetch(BASE + "/t071-deliberately-missing-page/")
report["feed_redirect"] = redirect
report["missing_page"] = missing
report["checks"] = {
    "pages": all(all(p["checks"].values()) for p in report["pages"]),
    "assets": bool(report["assets"]) and all(all(a["checks"].values()) for a in report["assets"]),
    "rss": feed["status"] == 200 and feed["item_count"] == 59 and feed["urls_use_preview"],
    "feed_301": redirect["status"] == 301 and urllib.parse.urljoin(BASE, redirect["location"] or "") == BASE + "/index.xml",
    "http_404": missing["status"] == 404,
}
report["result"] = "passed" if all(report["checks"].values()) else "failed"
(ROOT / "preview.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"result": report["result"], "checks": report["checks"]}, ensure_ascii=False))
raise SystemExit(0 if report["result"] == "passed" else 1)
