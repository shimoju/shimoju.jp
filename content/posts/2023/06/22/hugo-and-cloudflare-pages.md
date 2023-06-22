---
title: HugoとCloudflare Pagesでブログを作り直した
date: 2023-06-22T22:38:09+09:00
categories:
  - 技術
tags:
  - Hugo
  - Cloudflare
---

このブログはNode.js製の静的サイトジェネレーターである[Hexo](https://hexo.io/)で作っていたけど、放置しすぎて（最新の記事が[3年前](https://shimoju.jp/2020/10/24/kaigi-on-rails/)…）Node.jsやnpmがだいぶ古くなっており、アップデートが面倒な状態になっていた。

最近は[Scrapbox](https://scrapbox.io/shimoju/)にシュッと書いてしまうことが多いものの、やはりすべてをコントロールできる自分のサイトを持ちたいよなーということで作り直した。

## 静的サイトジェネレーター

[前回の構築時](https://shimoju.jp/2017/09/26/hello-hexo-netlify/)にも比較に上がっていた[Hugo](https://gohugo.io/)を採用。

以前と比べて、Markdownとアセットをまとめて管理できる[Page Bundles](https://gohugo.io/content-management/page-bundles/)機能などが追加されて順調に進化していることや、Hexoから大きくディレクトリ構成やfront-matterを変えなくてもよかったのが理由。

GatsbyやAstroも考えたけど、そんな凝ったことやるわけでもないし、アップデート業もめんどいし、ということで。やはりワンバイナリは楽ですね。

## テーマ

[adityatelange/hugo-PaperMod](https://github.com/adityaおtelange/hugo-PaperMod)を採用。

このテーマがあったのもHugoを選定した理由のひとつで、シンプルなデザインながら機能も豊富で気に入っている。
トップページにプロフィールを表示できる[Home-Info Mode](https://github.com/adityatelange/hugo-PaperMod/wiki/Features#home-info-mode)があり、これを使って簡単なプロフィールと各種SNSへのリンクを置いた。

CSS/JSのバンドリングやSubresource Integrity対応もしてるし、コードブロックのコピーボタンや、見出しにマウスカーソルを乗せるとアンカーリンクを出せるなど、細かいところも気が利いていて良い。

## デザイン調整

PaperModは[assets/css/extendedにCSSを置くとそれもバンドルしてくれる](https://github.com/adityatelange/hugo-PaperMod/wiki/FAQs#bundling-custom-css-with-themes-assets)。

デフォルトだと本文のline-heightが1.6、見出しが1.2〜1.3で、和文だと詰まった印象だったので調整。
以下の記事を参考に、[本文は2、見出しは1.4にした](https://github.com/shimoju/shimoju.jp/blob/master/assets/css/extended/override.css)。Paperというくらいだしゆったりさせてみた。

- [日本語の文章とline-heightに対する考察 - Qiita](https://qiita.com/NagayamaToshiaki/items/25d4969636d05bf48c41)
- [ウェブデザインにおけるline-heightについて  |  Rriver](https://parashuto.com/rriver/development/line-height-in-web-design)

## クールなURIは変わらない

URLはできるだけ変えないように、パーマリンクは[以前のブログと同様に設定した](https://github.com/shimoju/shimoju.jp/blob/master/hugo.yml)。

```yaml
permalinks:
  posts: /:year/:month/:day/:slugorfilename/
```

アーカイブ（[/archives/](https://shimoju.jp/archives/)）、カテゴリー（[/categories/](https://shimoju.jp/categories/)）、タグ（[/tags/](https://shimoju.jp/tags/)）はとくに設定しなくても同じパスだったのでそのまま使えている。
カテゴリー名・タグ名はHexoでは指定した通りのURLになる（大文字にすればURLも大文字になる）が、Hugoだと小文字に統一されるようで、そこだけ404になってしまったのが悲しみ。

RSSフィードはURLが変わったので[リダイレクトを設定してある](https://github.com/shimoju/shimoju.jp/blob/master/static/_redirects)。

## ホスティング

少し前にNetlifyから[Cloudflare Pages](https://www.cloudflare.com/ja-jp/products/pages/)に乗り換えており、引き続きこれを採用した。

Cloudflare Pagesについては[Scrapboxにまとめている](https://scrapbox.io/shimoju/Cloudflare_Pages)。
プレビュー環境もあるしHTTP/3対応もしてるし、レスポンスヘッダーのカスタマイズやリダイレクトもできるし便利。

環境変数`HUGO_VERSION`を設定しておかないとかなり古いバージョンでビルドされてしまうので注意。
[ビルドシステム](https://developers.cloudflare.com/pages/platform/language-support-and-tools/)はv1とv2（ベータ）があり、v2にするとデフォルトのバージョンも上がる。
v1はRuby 2.7系までしか対応してなかったけど、v2だと3.2もいけるのでRubyでも使えそう。

## ToDo

- `<ul><li><ul>`のときに子要素のulにmargin-bottomが入ってリストが不格好になる
- Twitterシェアボタンは記事につけたタグがハッシュタグとして付加されるのだが、タグが0個の状態でTwitterシェアすると`#`だけがツイートに入ってしまう

という不具合を見つけたので直してコントリビュートしたい。

---

なかなか満足のいく仕上がりになったので、今年はScrapboxだけでなくブログにも書いていきたい。
RubyKaigiの感想とか……（もう1か月以上経ってしまった）
