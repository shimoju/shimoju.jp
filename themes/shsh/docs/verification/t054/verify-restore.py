"""Rehearse the complete pre-migration source restore in a temporary directory."""
import argparse
import csv
import hashlib
import io
import json
from pathlib import Path
import subprocess
import tarfile
import tempfile
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[5]
OUT = Path(__file__).resolve().parent
REF = 'fb3a9bb0b0a943afb5e666520f82be7414c2fd75'
CLOCK = '2026-09-18T13:00:00Z'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--papermod-repository', type=Path, default=ROOT / 'themes/PaperMod')
args = parser.parse_args()


def git(*args, cwd=ROOT):
    return subprocess.check_output(['git', *args], cwd=cwd)


def archive(repo, ref, target):
    with tarfile.open(fileobj=io.BytesIO(git('archive', ref, cwd=repo))) as stream:
        stream.extractall(target, filter='data')


class CanonicalParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.urls.append(attrs.get('href'))


with tempfile.TemporaryDirectory(prefix='shsh-restore-') as directory:
    scratch = Path(directory)
    source = scratch / 'source'
    source.mkdir()
    archive(ROOT, REF, source)
    theme_ref = git('rev-parse', f'{REF}:themes/PaperMod').decode().strip()
    archive(args.papermod_repository, theme_ref, source / 'themes/PaperMod')
    command = ['hugo', '--source', str(source), '--destination', str(scratch / 'public'),
               '--environment', 'production', '--baseURL', 'https://shimoju.jp/',
               '--cacheDir', str(scratch / 'cache'), '--clock', CLOCK, '--minify']
    build = subprocess.run(command, capture_output=True, text=True)
    OUT.joinpath('build.log').write_text(build.stdout + build.stderr)
    result = {'recorded_at': datetime.now(timezone.utc).isoformat(), 'source_ref': REF,
              'theme_ref': theme_ref, 'hugo': subprocess.check_output(['hugo', 'version'], text=True).strip(),
              'clock': CLOCK, 'source_restore': 'Full git archive plus the exact PaperMod submodule archive; no shortcode overrides.',
              'build_exit_code': build.returncode, 'production_changed': False,
              'warnings': [line for line in build.stderr.splitlines() if line.startswith('WARN')],
              'external_fetch_warning_count': sum('unable to retrieve' in line for line in build.stderr.splitlines())}
    if build.returncode == 0:
        public = scratch / 'public'
        listing = subprocess.check_output(['hugo', 'list', 'all', '--source', str(source), '--clock', CLOCK], text=True)
        pages = list(csv.DictReader(io.StringIO(listing)))
        baseline = json.loads((ROOT / 'themes/shsh/tests/baseline/migration.json').read_text())
        html_paths = sorted('/' + file.relative_to(public).as_posix() for file in public.rglob('*.html'))
        feed_paths = sorted('/' + file.relative_to(public).as_posix() for file in public.rglob('index.xml'))
        feeds = {}
        for path in feed_paths:
            channel = ET.parse(public / path.lstrip('/')).getroot().find('channel')
            feeds[path] = [item.findtext('guid') for item in channel.findall('item')]
        source_inputs = {}
        for folder in ['content', 'static', 'assets', 'layouts']:
            for file in sorted((source / folder).rglob('*')):
                if file.is_file():
                    source_inputs[file.relative_to(source).as_posix()] = hashlib.sha256(file.read_bytes()).hexdigest()
        source_inputs['hugo.yml'] = hashlib.sha256((source / 'hugo.yml').read_bytes()).hexdigest()
        canonical = CanonicalParser()
        canonical.feed((public / 'index.html').read_text())
        checks = {
            'posts_59': sum(page['section'] == 'posts' for page in pages) == 59,
            'inputs_61': len(pages) == 61,
            'html_url_set_matches_baseline': html_paths == sorted(baseline['html']),
            'feed_url_set_matches_baseline': feed_paths == sorted(baseline['feeds']),
            'all_feed_guids_match_baseline': all(sorted(feeds[path]) == sorted(item['guid'] for item in baseline['feeds'][path]) for path in feed_paths),
            '404_exists': (public / '404.html').is_file(),
            'redirects_preserved': (public / '_redirects').read_bytes() == (source / 'static/_redirects').read_bytes(),
            'headers_preserved': (public / '_headers').read_bytes() == (source / 'static/_headers').read_bytes(),
            'home_canonical_is_production': canonical.urls == ['https://shimoju.jp/'],
        }
        result.update(checks=checks, html_count=len(html_paths), feed_count=len(feed_paths),
                      home_rss_items=len(feeds['/index.xml']), post_rss_items=len(feeds['/posts/index.xml']),
                      source_input_hashes=source_inputs,
                      limitation='Local generation only; deployed artifact rollback, HTTP behavior, external embeds and visual output are not verified by this rehearsal.')
    OUT.joinpath('result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: value for key, value in result.items() if key != 'source_input_hashes'}, ensure_ascii=False, indent=2))
    if build.returncode:
        raise SystemExit(build.returncode)
    if not all(result['checks'].values()):
        raise SystemExit('Restore verification failed')
