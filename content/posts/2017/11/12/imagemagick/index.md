---
title: ImageMagickで画像処理に入門する
date: 2017-11-12T13:56:10+09:00
categories:
  - 技術
tags:
  - 画像処理
  - ImageMagick
---

この記事は、[ImageMagickと画像加工について発表した](https://shimoju.jp/2017/10/30/classroom-learning-for-new-engineers/)ときの資料を文章に起こして加筆修正したものです。

## ImageMagickとは

- 画像加工といえばこれという有名ライブラリ
- メジャーからマイナーまでさまざまな画像形式に対応
  - 機能が多すぎて脆弱性もたびたび発見されるくらい…
- Cで実装され、多くの言語でバインディングがある
  - Ruby：[rmagick](https://github.com/rmagick/rmagick), [mini_magick](https://github.com/minimagick/minimagick) gem
  - PHP：[Imagick拡張モジュール](http://php.net/manual/ja/book.imagick.php)
  - Go：[gographics/imagick](https://github.com/gographics/imagick)

## インストール

Mac Homebrew

```sh
$ brew install imagemagick
```

Debian / Ubuntu

```sh
$ sudo apt-get install -y imagemagick
```

CentOS

```sh
$ sudo yum -y install ImageMagick
```

## コマンド

- `imagemagick`というコマンドはない(!)
- 機能ごとに`convert`や`identify`などのコマンドにわかれている
  - ただし、ImageMagick 7からはすべて`magick`コマンドへのシンボリックリンクになっている

### ImageMagick 6 (Ubuntu 16.04)

```sh
$ ls -Alh /usr/lib/x86_64-linux-gnu/ImageMagick-6.8.9/bin-Q16
total 88K
-rwxr-xr-x 1 root root 6.3K Jul 31 13:22 animate
-rwxr-xr-x 1 root root 6.3K Jul 31 13:22 compare
-rwxr-xr-x 1 root root 6.3K Jul 31 13:22 composite
-rwxr-xr-x 1 root root 6.3K Jul 31 13:22 conjure
-rwxr-xr-x 1 root root 6.3K Jul 31 13:22 convert
-rwxr-xr-x 1 root root 6.3K Jul 31 13:22 display
-rwxr-xr-x 1 root root 6.3K Jul 31 13:22 identify
-rwxr-xr-x 1 root root 6.3K Jul 31 13:22 import
-rwxr-xr-x 1 root root 6.3K Jul 31 13:22 mogrify
-rwxr-xr-x 1 root root 6.3K Jul 31 13:22 montage
-rwxr-xr-x 1 root root 6.3K Jul 31 13:22 stream
```

### ImageMagick 7 (Mac Homebrew)

`magick`コマンドへのシンボリックリンクになっていることがわかる

```sh
$ ls -Alh /usr/local/Cellar/imagemagick/7.0.7-7/bin | grep -v config
total 64
lrwxr-xr-x  1 shimoju  admin     6B 10  7 21:02 animate -> magick
lrwxr-xr-x  1 shimoju  admin     6B 10  7 21:02 compare -> magick
lrwxr-xr-x  1 shimoju  admin     6B 10  7 21:02 composite -> magick
lrwxr-xr-x  1 shimoju  admin     6B 10  7 21:02 conjure -> magick
lrwxr-xr-x  1 shimoju  admin     6B 10  7 21:02 convert -> magick
lrwxr-xr-x  1 shimoju  admin     6B 10  7 21:02 display -> magick
lrwxr-xr-x  1 shimoju  admin     6B 10  7 21:02 identify -> magick
lrwxr-xr-x  1 shimoju  admin     6B 10  7 21:02 import -> magick
-r-xr-xr-x  1 shimoju  admin    18K 10  9 18:25 magick
lrwxr-xr-x  1 shimoju  admin     6B 10  7 21:02 magick-script -> magick
lrwxr-xr-x  1 shimoju  admin     6B 10  7 21:02 mogrify -> magick
lrwxr-xr-x  1 shimoju  admin     6B 10  7 21:02 montage -> magick
lrwxr-xr-x  1 shimoju  admin     6B 10  7 21:02 stream -> magick
```

## identify

- 画像の情報を出力できる
- サイズをさっと知りたいときとか、大量の画像の中からサイズが違うものを探したりとかに便利
- フォーマット文字列はこちら参照：[Format and Print Image Properties @ ImageMagick](https://www.imagemagick.org/script/escape.php)

```sh
$ identify *.jpg
original.jpg JPEG 800x533 800x533+0+0 8-bit sRGB 104823B 0.000u 0:00.000
resize.jpg JPEG 400x267 400x267+0+0 8-bit sRGB 37116B 0.000u 0:00.000
```

JSON形式で出力して`jq`に食わせる

```sh
$ identify -format '{"width": %w, "height": %h}' *.jpg | jq
{
  "width": 800,
  "height": 533
}
```

`grep -v`で指定のサイズではない画像を抽出

```sh
$ identify -format '%wx%h %f\n' *.jpg | grep -v 800x533
200x200 crop.jpg
```

## convert

- さまざまな画像加工を行える、ImageMagickのメインコマンド
- 適当な画像を`original.jpg`として用意しておきます

### 回転 (rotate)

`-rotate`で指定した角度回転する

```sh
$ convert -rotate 90 original.jpg rotate.jpg
```

上下反転

```sh
$ convert -flip original.jpg flip.jpg
```

左右反転

```sh
$ convert -flop original.jpg flop.jpg
```

上下左右反転

```sh
$ convert -flip -flop original.jpg flipflop.jpg
```

### サンプル (sample)

ピクセルを間引く

```sh
$ convert -sample 10% original.jpg sample.jpg
```

10%になるようにピクセルを間引いたあと、1000%になるように拡大
→元画像と同じサイズでモザイクがかかる

```sh
$ convert -sample 10% -sample 1000% original.jpg mosaic.jpg
```

### リサイズ (resize)

デフォルトではアスペクト比を変えない：指定した幅・高さに収まるようにリサイズされる

```sh
$ convert -resize 400x400 original.jpg resize.jpg
$ identify resize.jpg
resize.jpg JPEG 400x267 400x267+0+0 8-bit sRGB 37116B 0.000u 0:00.000
```

`!`をつけるとアスペクト比を無視して指定した値にリサイズする

```sh
$ convert -resize 400x400! original.jpg resize2.jpg
```

幅または高さのみ指定できる

```sh
$ convert -resize 400x original.jpg resize3.jpg
```

### エッジ検出 (edge)

不連続に変化している箇所を検出する

```sh
$ convert -edge 5 original.jpg edge.jpg
```

値を変化させてみよう

```sh
$ convert -edge 10 original.jpg edge2.jpg
$ convert -edge 1 original.jpg edge3.jpg
```

### 切り抜き (crop)

`-gravity`で基準点を指定し、`-crop widthxheight`で切り抜くサイズを指定

```sh
$ convert -gravity center -crop 200x200+0+0 original.jpg crop.jpg
```

`+`/`-`で基準点からのx,y座標を指定できる
画像右上を基準に、xに140px,yに50px移動し、その点から200x200px切り抜く

```sh
$ convert -gravity northeast -crop 200x200+140+50 original.jpg crop.jpg
```

### 塗り足し (extent)

指定したサイズになるように余白を追加する
正方形のサイズが必要なのに4:3の画像しかないときなどに便利

```sh
$ convert -background black -gravity center \
          -extent 800x800 original.jpg extent.jpg
```

余白の色は`-background`で指定する
PNG(透過が扱えるフォーマット)であれば、`-background transparent`で透過できる

```sh
$ convert -background transparent -gravity north \
          -extent 1000x1000 original.jpg extent.png
```

### 文字の画像を作る

```sh
$ convert -background transparent \
          -fill '#ff6060' -font Arial -pointsize 128 label:LGTM lgtm.png
```

指定サイズで作成

```sh
$ convert -size 400x200 -gravity center -background transparent \
          -fill '#ff6060' -font Arial -pointsize 128 label:LGTM lgtm.png
```

### 合成 (composite)

`original.jpg`の上に`lgtm.png`を合成して、`compose-over.jpg`として出力

```sh
$ convert original.jpg lgtm.png -gravity center \
          -compose over -composite compose-over.jpg
```

`-geometry`で基準点から移動

```sh
$ convert original.jpg lgtm.png -gravity center -geometry +150+50 \
          -compose over -composite compose-over.jpg
```

#### 描画モード (blend mode)

- 重ねられた画像をどのように合成するかを指定できる
  - 参考：[画像の結合１（重ね合わせ） – Imagemagickの使い方日本語マニュアル](http://imagemagick.rulez.jp/archives/672)
- Photoshopなどの画像編集ソフトにあるものと同様
- 実際どんな計算で算出されるかはソースを読めばわかる…が、感覚をつかむには[GIMPのドキュメント](https://docs.gimp.org/2.8/ja/gimp-concepts-layer-modes.html)がわかりやすい
  - たとえば乗算は：合成画像の色 = 上側の色 * 下側の色 / 255
- `-compose`で描画モードを指定する

乗算 (multiply)

```sh
$ convert original.jpg lgtm.png -gravity center -geometry +150+50 \
          -compose multiply -composite compose-multiply.jpg
```

オーバーレイ (overlay)

```sh
$ convert original.jpg lgtm.png -gravity center -geometry +150+50 \
          -compose overlay -composite compose-overlay.jpg
```

減算 (subtract)

```sh
$ convert original.jpg lgtm.png -gravity center -geometry +150+50 \
          -compose subtract -composite compose-subtract.jpg
```
