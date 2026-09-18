#!/bin/sh

set -eu

if [ "$#" -ne 2 ]; then
  echo 'Usage: build-pages.sh refs/heads/BRANCH COMMIT_SHA' >&2
  exit 1
fi
source_ref=$1
commit=$2
case "$source_ref" in
  refs/heads/?*) ;;
  *) echo 'Only branch refs can be deployed.' >&2; exit 1 ;;
esac
case "$commit" in
  ''|*[!0-9a-f]*) echo 'Expected a full lowercase commit SHA.' >&2; exit 1 ;;
esac
if [ "${#commit}" -ne 40 ]; then
  echo 'Expected a full lowercase commit SHA.' >&2
  exit 1
fi

cd "$(dirname "$0")/.."
if [ "$source_ref" = refs/heads/master ]; then
  environment=production
  pages_branch=master
  base_url=https://shimoju.jp/
else
  environment=preview
  # A commit-specific alias is known before upload and keeps canonical/RSS
  # URLs tied to this revision even when the source branch advances.
  pages_branch="preview-$commit"
  base_url="https://$pages_branch.shimoju.pages.dev/"
fi

mkdir -p .cache/pages
../../bin/build --environment "$environment" --minify \
  --baseURL "$base_url" --destination "$PWD/.cache/pages/public" \
  --cacheDir "$PWD/.cache/pages/hugo-cache"

printf 'environment=%s\nbranch=%s\nbase_url=%s\ncommit=%s\n' \
  "$environment" "$pages_branch" "$base_url" "$commit" > .cache/pages/target.txt
if [ -n "${GITHUB_OUTPUT:-}" ]; then
  cat .cache/pages/target.txt >> "$GITHUB_OUTPUT"
fi
