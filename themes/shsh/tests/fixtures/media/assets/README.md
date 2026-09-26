# Media fixtures

`palette.png` is a 1440×600 indexed PNG. The top 240 rows are a crop of
`palette-screenshot.png` (1440×240 at 0,600). The remaining rows alternate red
and blue columns; their left half is opaque and their right half has alpha 128.
Its 84 palette entries contain no purple. A 360×150 Catmull-Rom resize should
produce RGB (128, 0, 128) in the columns, away from the image and alpha edges,
while preserving the alpha of each half. This detects palette reapplication
between resizing and lossless WebP encoding without using Hugo to generate the
expected pixels. Like real screenshots, its 720px and 1080px resizes are heavier
than the native-width WebP and are dropped, while the 360px one is kept.

`optimized.jpg` is the repository's first gaming-PC photo resized to 720×720
and encoded at JPEG quality 10 with metadata stripped. Its q80 WebP candidates
are larger than the original JPEG. They are still offered, because browsers
never fall back from a WebP source to the original.

`still.webp` is the same gaming-PC photo resized to 400×400 and encoded at
WebP quality 95 with metadata stripped. It is lossy (`VP8 `), so its smaller
candidate is lossy, while the native-width candidate reuses the original file
instead of re-encoding it at Hugo's default quality.

`lossless.webp` and `translucent.webp` are 480×120 gradients from `#1e66f5` to
`#df8e1d`, encoded with `cwebp -lossless -exact` and `cwebp -q 80`. The second
fades from alpha 255 to 64, so it uses the extended format (`VP8X`, `ALPH`,
`VP8 `). They test that smaller WebP candidates keep the original's
compression. `still.tiff` is the opaque gradient saved as a Deflate TIFF; other
processable formats are resized to lossy WebP.
