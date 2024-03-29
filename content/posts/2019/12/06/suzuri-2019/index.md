---
title: 2019年、SUZURIの怪事件
date: 2019-12-06T02:01:08+09:00
categories:
  - 技術
tags:
  - SUZURI
  - Rails
---

[SUZURI Advent Calendar 2019](https://adventar.org/calendars/4698)の5日目の記事です。ちょっと遅れました。

SUZURIでエンジニアをしている[しもじゅー](https://twitter.com/shimoju_)です。最近はSUZURIのAndroidアプリを開発するために目下勉強中で、Android何もわからない…となっています。

今年自分が担当したのは目に見えない裏側部分や長い調査を必要としたものが多かったです。謎の不具合にも悩まされたのでそこからいくつか紹介します。
ご迷惑をおかけしたものもありますが、裏側ではこんなことやっているんだ、と感じていただければ幸いです。

## 祝日消滅事件

SUZURIの商品の納期は「○営業日」となっているため、発送予定日を算出するときは土日祝日を考慮する必要があります。
日本の祝日をリスト化している[holiday_jp](https://github.com/holiday-jp/holiday_jp-ruby)という便利なライブラリがあるのですが、あるときから動作がおかしくなり、祝日のはずなのに祝日ではないという判定になってしまいました。
このままでは祝日が存在しないブラックな世界が訪れてしまうので調査して原因を特定し、無事祝日を取り戻すことができました。

原因は`Object#to_msgpack`を独自に定義していたせいで、[bootsnap](https://github.com/Shopify/bootsnap)のYAMLキャッシュが意図通り動作しなくなり、デコードしたときに元のDateオブジェクトに復元できなくなっていた…ということなのですが、詳しいことは別記事で書ければと思います。

## 画像合成サーバを過保護にしていた

SUZURIではアップロードされた画像をアイテムに合成して、実物さながらのサムネイル画像を作っています。
キャンペーンなどでアクセス数が増えた際に、サーバの負荷自体はそれほどでもないのにエラーが多発する、という問題がありました。

これは突発的なアクセス急増から保護するために数年前に設定された制限(Nginxの`limit_conn`)が残っており、サーバ台数が増えて実際には余裕がある今もエラーを返していた、という過保護なものでした。こういう設定は定期的に見直さないといけないですね。

## ステッカーでだけ追加サムネイル画像が出ない

アイテムによっては正面以外にもいくつかのアングルからの画像を用意していますが、iOSアプリでステッカーだけ追加画像が出ない不具合がありました。

これはアプリの問題ではなくAPI側の問題で、設定値を[`Array#delete_if`](https://docs.ruby-lang.org/ja/latest/method/Array/i/delete_if.html)で破壊的に操作している箇所があり、そのせいでステッカーの追加画像の設定が抜け落ちてしまうというバグでした。破壊的操作よくない。

## HTMLメール空っぽ問題

これまでSUZURIから送られるメールはテキスト形式のみでしたが、5月頃からHTMLメールの対応を進め、7月頃にほぼすべてのメールをHTMLメール化しました。
作業自体はデザイナーが爆速で進めてくれたのですが、時間がかかったのはたまに本文が空のメールが送られてしまう問題があり一旦差し止めていたためです。ご迷惑をおかけいたしました。

これはHTMLメール作成に使っていた[mjml](https://github.com/mjmlio/mjml)がメモリを消費しすぎてkillされていたが、[mjml-rails](https://github.com/sighmon/mjml-rails)でのハンドリングが甘く例外を返さずに正常終了していたためで、サーバの増強とメール送信前に本文が空でないかチェックしてリトライさせるようにして解決しました。こちらも詳しい記事をどこかで書ければと思います。

これによってメール内に画像を差し込むなど、よりわかりやすく情報を見渡しやすいメールを作れるようになりました。
例えばズッキュンお祝いメールにはかわいいGIF画像のついたHTMLメールが送られるようになっています。どう動くかは5回ズッキュンされてからのお楽しみ。

![ズッキュンお祝いメール](zukkyun.png)

---

2020年はついにAndroidアプリのリリースを予定しています。ご期待ください。
