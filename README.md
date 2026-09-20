# shimoju.jp

My website: https://shimoju.jp/

```sh
brew install hugo imagemagick pngquant oxipng ffmpeg
git clone https://github.com/shimoju/shimoju.jp.git
cd shimoju.jp
bin/dev
```

## Build

Site generation requires Hugo only;
Node.js and pnpm are development and verification tools.

```sh
bin/build
bin/build --environment development
bin/build --environment preview --baseURL https://example.pages.dev/
```

`bin/build` runs Hugo from the repository root, cleans the destination,
and forwards any arguments.

- Locally it keeps Hugo's defaults (the production environment);
  use `--environment` to select another environment.
- For a local server with draft and future posts, use `bin/dev`.

Preview output has noindex metadata and disabled sharing / Hatena Star.
External content embeds still load.

## Deploy to Cloudflare Pages

After the GitHub Actions `shsh-test` check succeeds, merge the PR into `master`
to build and deploy through Cloudflare Pages Git integration.
Branch pushes produce preview deployments.

Configure Pages with output directory `public` and this build command:

```sh
bin/build
```

When `CF_PAGES=1` or `CF_PAGES_BRANCH` is set,
`bin/build` selects the environment and enables minification.

- The `master` branch uses `production` and `https://shimoju.jp/`.
- Other branches use `preview` and require `CF_PAGES_URL` to be an HTTPS URL
  under `shimoju.pages.dev`.

Preview output uses its own URL for canonical links, OGP, and RSS.

To reproduce a Pages preview build locally:

```sh
CF_PAGES_BRANCH=feature CF_PAGES_URL=https://example.shimoju.pages.dev bin/build
```

After deployment, verify:

- HTTP responses for missing-page 404s
- The redirect from `/feed.xml` to `/index.xml`
- Preview noindex metadata
- External embeds, video playback, and slide navigation in the deployed preview

Roll back using a commit or deployment artifact that includes both configuration
and content.

## Create new post

```sh
# Create content/posts/YYYY/MM/DD/slug-foo-bar/index.md
bin/new-post slug-foo-bar
```

## Optimize media

Resize PNG images to a maximum width of 1600px, convert them to sRGB, and
optimize them in place.

```sh
bin/optimize-image content/posts/path/to/*.png
```

Use `--width` to specify a different maximum width.

```sh
bin/optimize-image --width 2400 content/posts/path/to/foo.png
```

Convert videos to H.264 MP4 files with a maximum width of 1440px at 30fps.
The input files are preserved; for example, `video.mov` produces `video.mp4`.

```sh
bin/optimize-video content/posts/path/to/*.mov
```

## Theme development

- `bin/` contains blog authoring and deployment commands.
- `themes/shsh/scripts/` contains theme development and test tools.

Theme tests use self-contained fixtures and do not depend on this blog's
configuration or content.
See [themes/shsh/README.md](themes/shsh/README.md) for theme development
and verification commands.
