#!/bin/sh

set -eu

# Cloudflare Pages Git integration supplies the branch and deployment URL.
# Keep site generation independent of Node.js and the GitHub CI runner.
: "${CF_PAGES_BRANCH:?CF_PAGES_BRANCH is required}"
if [ "$CF_PAGES_BRANCH" = master ]; then
  environment=production
  base_url=https://shimoju.jp/
else
  environment=preview
  : "${CF_PAGES_URL:?CF_PAGES_URL is required for preview}"
  case "$CF_PAGES_URL" in
    https://*.shimoju.pages.dev|https://*.shimoju.pages.dev/) ;;
    *) echo 'Expected this project’s HTTPS Pages preview URL.' >&2; exit 1 ;;
  esac
  base_url="${CF_PAGES_URL%/}/"
fi

cd "$(dirname "$0")/../../.."
printf 'Pages build: environment=%s branch=%s baseURL=%s\n' \
  "$environment" "$CF_PAGES_BRANCH" "$base_url"
exec sh bin/build --environment "$environment" --minify --baseURL "$base_url" "$@"
