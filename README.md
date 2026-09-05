# shimoju.jp

My website: https://shimoju.jp/

```sh
brew install hugo imagemagick pngquant oxipng ffmpeg
git clone https://github.com/shimoju/shimoju.jp.git
cd shimoju.jp
git submodule update --init --recursive
bin/dev
```

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
