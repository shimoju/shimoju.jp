# Media fixtures

`palette.png` is a 720×360 indexed PNG with alternating red and blue columns.
The left half is opaque and the right half has alpha 128. Its four palette
entries contain no purple. A 360×180 box resize should produce RGB (128, 0, 128)
while preserving the alpha of each half. This detects palette reapplication
between resizing and lossless WebP encoding without using Hugo to generate
the expected pixels.

`optimized.jpg` is the repository's first gaming-PC photo resized to 720×720
and encoded at JPEG quality 10 with metadata stripped. Its 360px q80 WebP is
larger than the original JPEG, so only the original should appear in `srcset`.

`still.webp` is the same gaming-PC photo resized to 400×400 and encoded at
WebP quality 95 with metadata stripped. It tests that smaller candidates can
be generated while the same-width candidate preserves the original file
instead of re-encoding it at Hugo's default quality.
