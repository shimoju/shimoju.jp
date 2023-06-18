---
title: ブログをHexoで作り直してNetlifyにデプロイした
date: 2017-09-26 23:59:59
categories:
  - 技術
tags:
  - Hexo
---

ようやく重い腰を上げてブログを作り直しました。
以前のブログはとりあえずWordPressでやっていたのですが、普段のエディタでMarkdownを書きたい…Git管理したい……となったので移行しました。

## 静的サイトジェネレータ

静的サイトジェネレータとしては[Hexo](https://hexo.io/)を採用しました。
当初はGo言語製の[Hugo](https://gohugo.io/)を使おうとしたのですが、投稿ごとにアセット用のディレクトリを切って管理できる[Post Asset Folder](https://hexo.io/docs/asset-folders.html)機能など、ディレクトリ構成の柔軟性や機能の充実度を考えてHexoにしました。

WordPressからの移行には[wordpress-to-hugo-exporter](https://github.com/SchumacherFM/wordpress-to-hugo-exporter)を使用(当初はHugoの予定だったので…)。Markdownで書き出したあとの調整はエディタによる一括置換やGit管理で楽ちん。Hexoへの切り替えはfront-matterやヘルパーを少しいじっただけなので、ジェネレータ間の移行もしやすいのがいいですね。

## デザイン・テーマ

Tumblrテーマの[Apollo](http://sanographix.github.io/tumblr/apollo/)をHexoに移植した[hexo-theme-apollo](https://github.com/joyceim/hexo-theme-apollo)を、さらに[フォークして](https://github.com/shimoju/hexo-theme-apollo)使っています。
[コードブロックの空白行が詰まって行番号とずれる問題を修正したり](https://github.com/shimoju/hexo-theme-apollo/commit/9d723b99085689e48a2c228aee2cec57bbbba842)、[アーカイブページにページネーションをつけたり](https://github.com/shimoju/hexo-theme-apollo/commit/cba3045ac88e933ae651d0f132b9f88a4bf9ffdc)、[はてブボタンをつけたり](https://github.com/shimoju/hexo-theme-apollo/commit/c0f628c627c06bef0586720183edb020525b10de)しました。

デザイン自体がシンプルですし、実装も素朴なのでカスタマイズしやすかったことが決め手です。いろいろ変えたいところはあるので次はテーマを自作したいです。今回はDone is better than perfect精神でいっています…。

## サーバー

サーバーは、静的サイトのホスティング先として最近話題の[Netlify](https://www.netlify.com/)を利用しています。

- [NetlifyでHugoで作った静的サイトをホスティングしてビルドを自動化する – Snaplog](https://blog.mismithportfolio.com/web/hugo-netlify-build)

チーム機能を使うには有料ですがパーソナルであれば[無料](https://www.netlify.com/pricing/)で、独自ドメイン利用・Let's EncryptによるSSLも無料。当然のようにHTTP/2対応で、アセットはCloudFrontのCDNで配信されます。
ビルドコマンドを指定すればあとはNetlifyが全部やってくれるので便利です。GitHub連携もあり、masterにマージしたら自動でデプロイされます。おまけに[Heroku Review Apps](https://devcenter.heroku.com/articles/github-integration-review-apps)のような、Pull Requestごとにプレビュー用の環境まで作ってくれます。すごい……。

## まとめ

静的サイトジェネレータは様々な言語で実装されて、いまや[450以上](https://staticsitegenerators.net/)あるようです。機能やエコシステムも洗練されてきているような感覚があります。静的サイトの自動ビルド・デプロイはCIサービスを使う方法が主流でしたが、Netlifyは意外とありそうでなかったサービスですね。すごい。

[ロリポップ！マネージドクラウド](https://mc.lolipop.jp/)にもNetlify的な静的サイトをビルドしてくれるコンテナがあると便利そうな気がしました。よろしくお願いします🙏(勤務先です)
