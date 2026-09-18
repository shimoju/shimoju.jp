"""Read-only production HTTP verification; run after Pages publishes the merge."""

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

BASE = "https://shimoju.jp"
DEVICE_BASE = "https://6f52990f.shimoju.pages.dev"
import sys
from concurrent.futures import ThreadPoolExecutor
SHA = sys.argv[1]
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


BASELINE = json.loads((ROOT.parents[2] / "tests/baseline/migration.json").read_text())
report = {"recorded_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
          "commit": SHA, "base": BASE, "pages": [], "feeds": [], "assets": []}
asset_paths = set()

def inspect_page(item):
    path, expected = item
    public_path = path.removesuffix("index.html") if path.endswith("/index.html") else path
    result, body = fetch(BASE + public_path)
    source = body.decode()
    elements = Page(source).elements
    canonical = [a.get("href") for t, a in elements if t == "link" and a.get("rel") == "canonical"]
    robots = [a.get("content", "") for t, a in elements if t == "meta" and a.get("name") == "robots"]
    result["canonical"] = canonical
    result["pre_migration_canonical"] = expected["canonical"]
    # Q20 requires each pagination URL itself, unlike the PaperMod baseline.
    # /404.html is a real static resource; missing paths are checked separately.
    result["checks"] = {"http_status": result["status"] == 200,
                        "no_http_noindex": "noindex" not in (result["x_robots_tag"] or ""),
                        "canonical": len(canonical) == 1 and urllib.parse.unquote(canonical[0]) == BASE + (public_path.removesuffix("page/1/") if public_path.endswith("/page/1/") else public_path)}
    if path != "/404.html":
        result["checks"]["no_html_noindex"] = not any("noindex" in v for v in robots)
    if public_path in ["/", "/about/", "/2026/09/01/development-environment-2026/"]:
        result["og_url"] = [a.get("content") for t, a in elements if t == "meta" and a.get("property") == "og:url"]
        result["checks"]["og_url"] = result["og_url"] == [BASE + public_path]
        for tag, attrs in elements:
            if (tag == "link" and attrs.get("rel") == "stylesheet") or (tag == "script" and attrs.get("src", "").endswith(".js")):
                url = urllib.parse.urljoin(BASE, attrs.get("href") or attrs.get("src"))
                if urllib.parse.urlsplit(url).netloc == "shimoju.jp" and urllib.parse.urlsplit(url).path.startswith(("/css/", "/js/")):
                    asset_paths.add(urllib.parse.urlsplit(url).path)
        if public_path != "/":
            shares = [(t, a) for t, a in elements if "share-icon" in a.get("class", "").split()]
            result["share_hrefs"] = [a.get("href") for _, a in shares]
            result["checks"]["shares_enabled"] = len(shares) == 4 and all(t == "a" and a.get("href") for t, a in shares)
            result["checks"]["star_container"] = "data-hatena-star-container" in source
    return result

with ThreadPoolExecutor(max_workers=4) as pool:
    report["pages"] = list(pool.map(inspect_page, BASELINE["html"].items()))

def inspect_feed(item):
    path, expected = item
    result, body = fetch(BASE + path)
    root = ET.fromstring(body)
    actual = [(n.findtext("link"), n.findtext("guid")) for n in root.findall("./channel/item")]
    expected_items = [(n["link"], n["guid"]) for n in expected if not (path == "/index.xml" and n["link"] == BASE + "/about/")]
    result["item_count"] = len(actual)
    result["checks"] = {"status_200": result["status"] == 200,
                        "identifiers": sorted(actual) == sorted(expected_items)}
    return result
with ThreadPoolExecutor(max_workers=4) as pool:
    report["feeds"] = list(pool.map(inspect_feed, BASELINE["feeds"].items()))
for path in sorted(asset_paths):
    result, body = fetch(BASE + path)
    device, device_body = fetch(DEVICE_BASE + path)
    mapping, _ = fetch(BASE + path + ".map")
    fingerprint = re.search(r"\.([a-f0-9]{64})\.(css|js)$", path)
    result["map_status"] = mapping["status"]
    result["device_sha256"] = device["sha256"]
    result["checks"] = {"status_200": result["status"] == 200,
                        "fingerprint": bool(fingerprint) and fingerprint.group(1) == result["sha256"],
                        "expected_asset_content": (body == (ROOT.parents[2] / ".cache/site-live/production" / path.lstrip("/")).read_bytes()) if path.startswith("/js/sharing.") else (device["status"] == 200 and body == device_body),
                        "no_map_reference": b"sourceMappingURL" not in body,
                        "map_not_served": mapping["status"] == 404}
    report["assets"].append(result)
redirect, _ = fetch(BASE + "/feed.xml", follow=False)
missing, _ = fetch(BASE + "/t071-deliberately-missing-page/")
report["feed_redirect"] = redirect
report["missing_page"] = missing
report["checks"] = {"pages": all(all(p["checks"].values()) for p in report["pages"]),
                    "feeds": all(all(p["checks"].values()) for p in report["feeds"]),
                    "assets": bool(report["assets"]) and all(all(p["checks"].values()) for p in report["assets"]),
                    "feed_301": redirect["status"] == 301 and urllib.parse.urljoin(BASE, redirect["location"] or "") == BASE + "/index.xml",
                    "missing_404": missing["status"] == 404}
report["result"] = "passed" if all(report["checks"].values()) else "failed"
(ROOT / "production-http.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"result": report["result"], "checks": report["checks"], "pages": len(report["pages"]), "feeds": len(report["feeds"])}))
raise SystemExit(0 if report["result"] == "passed" else 1)
