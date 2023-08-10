---
title: Rails 6.1のままRuby 3.2にアップデートし、YJITの恩恵を受ける
date: 2023-08-10T17:33:00+09:00
categories:
  - 技術
tags:
  - Ruby
  - Rails
  - YJIT
draft: true
---

先日、携わっているサービスで一番大きいRailsアプリをRuby 3.2にアップデートし、YJITを有効化できました。
方針を検討した結果、今回はRails 6.1およびPsych 3系のままRuby 3.2にアップデートする戦略をとったため、その手順をまとめます。

{{< tweet user="shimoju_" id="1681662811389190147" >}}

## 前提

今回のRailsアプリはサービスの機能がほぼすべて詰まっているモノリスで、歴史も8年と比較的長いです。
アップデート前のバージョンはRuby 3.0、Rails 6.1で、Psychは3系。

正攻法では、おおむね「Rails 6.1の最新版→各種gemのアップデート→Psych 4対応→Ruby 3.1→Rails 7.0→Ruby 3.2」の手順でアップデートを進めていくことになります。
Ruby 3.1と3.2のそれぞれで非互換があるため、その対応を考慮するとだいたいこうなるはず。

### Ruby 3.1での非互換

- [net-smtp](https://github.com/ruby/net-smtp)や[net-pop](https://github.com/ruby/net-pop)などがbundled gemsとなっており、依存関係を明示的に追加する必要がある
  - Railsが依存するgemでは[mail](https://github.com/mikel/mail)（Action Mailerの依存）などに影響が出る
  - これはアップデートすれば対応できるため、まずはRailsと関連gemを最新版にアップデートする
- Ruby 3.1に同梱される[Psych](https://github.com/ruby/psych) 4に非互換がある
  - YAMLを扱うgemのアップデートやアプリケーションの改修が必要となる
  - Psych 4系への対応完了後、Ruby 3.1にアップデートする

### Ruby 3.2での非互換

- Rails 6.1はRuby 3.2に対応していない
  - Rails 6.1はすでにセキュリティ修正のみ行うフェーズになっており、Ruby 3.2に対応したRails 6.1の新バージョンがリリースされることはない
  - したがって、先にRails 7.0にしてからRuby 3.2にアップデートしなければならない

ということで、事前に小さなRailsアプリのアップデートに取り組んだときは上記の手順で行いました。

## 今回の方針

それに対して、今回アップデートしたモノリスでは「Rails 6.1の最新版→各種gemのアップデート→Psychを3系に固定する→Ruby 3.1→RailsをGitHubの6-1-stableブランチを使うように変更→Ruby 3.2」の流れにしました（それぞれの詳細については後述）。

これはYJITにより[現実のRailsアプリが高速化できる](https://www.publickey1.jp/blog/23/rubyyjitshpopifyrailsrubyjit.html)ことはわかっていて、かつ言語処理系のアップデートだけで大きな効果を得られるタイミングはめったにないので、できるだけ早くリリースしてビジネス的な価値を出したいと判断したためです。
とくに今回は7月末にサービスの大規模キャンペーンを控えており、正攻法だとリリースは厳しい状況でしたが、Rails 6.1のままRuby 3.2にできれば間に合う可能性が高かったのも理由のひとつ。

この戦略をとったことで、無事キャンペーン前にRuby 3.2アップデートを完了できました。

## 手順

では具体的な手順に入ります。

### Rails 6.1の最新版にアップデート

これはアップデートするだけです。執筆時点での最新版は[6.1.7.4](https://rubygems.org/gems/rails/versions/6.1.7.4)。

### 各種gemのアップデート

changelogを読みながらひたすらアップデートします。
`bundle update --group development test`で開発環境のgemだけアップデートしたり、`bundle update --minor`でマイナーバージョンまでアップデートするなどのオプションを使っていくと便利。

メジャーバージョンアップは慎重に検証し、ひとつずつアップデートします。
すぐに直せない非互換があれば時間をかけすぎず、ToDoコメントを残していったんバージョンを固定して次に進みます。
それがRuby/Railsアップデートのブロッカーになったらまた向き合いましょう。

### Psychを3系に固定する

[Ruby 3.1に同梱されるPsych 4では破壊的変更があり](https://www.ruby-lang.org/ja/news/2021/12/25/ruby-3-1-0-released/)、セキュリティのためデフォルトではYAMLのエイリアスが使えなくなり、DateやTimeクラスのデコードもできなくなりました。

> • Psych 4.0 では `Psych.load` が `safe_load` を利用するように変更されました。この挙動が影響ある場合は、従来の挙動である `unsafe_load` を利用する Psych 3.3.2 を移行パスとして利用できます。

よって、YAMLを扱うgemのアップデートやアプリケーションの改修が必要となります。

アプリケーションでは適切に`permitted_classes: [Date]`や`aliases: true`オプションをつけていけばOK。
YAMLを扱うgemは対応バージョンにアップデートします。

ただし今回はそのgemが[Settingslogic](https://github.com/binarylogic/settingslogic)であり、アップデートが止まっています。
チームで検討した結果、SettingslogicをやめてRails標準の[config_forを用いたカスタム設定](https://railsguides.jp/configuring.html#%E3%82%AB%E3%82%B9%E3%82%BF%E3%83%A0%E8%A8%AD%E5%AE%9A)に移行する方針としましたが、移行完了するまではPsych 3系に固定することにしました。

```ruby
# Gemfile
gem 'psych', '< 4.0.0'
```

モンキーパッチを当てたりgemをforkして一時対応し、まずPsych 4以降に上げてしまう手もあります。
今回は急いでPsych 4に上げるメリットもそこまで大きくないと判断しました。

### Ruby 3.1にアップデート

[Ruby 3.1ではnet-smtp、net-ftp、matrixなどがbundled gemsになりました](https://www.ruby-lang.org/ja/news/2021/12/25/ruby-3-1-0-released/)。

> 以下のライブラリが新たに bundled gems になりました。Bundler から利用する場合は Gemfile に明示的に指定してください。
>
> - net-ftp 0.1.3
> - （以下省略）

外部のgemがこれらのgemに依存している場合、そのgemが対応済みであればアップデートします。もしくは明示的にGemfileに追加します。

アプリケーション内で該当のライブラリを使っていれば、こちらも明示的にGemfileに追加します。
今回のアプリではnet-ftpを使っていたので対応しました。

### RailsをGitHubの6-1-stableブランチを使うように変更

[Rails 6.1はすでにセキュリティ修正のみ行うフェーズ](https://railsguides.jp/maintenance_policy.html)になっており、Ruby 3.2に対応したRails 6.1の新バージョンがリリースされることはありません。

ただし、[GitHubの6-1-stableブランチ](https://github.com/rails/rails/tree/6-1-stable)には[バックポートが取り込まれており](https://github.com/rails/rails/pull/46895)、[このブランチを使うことで対応できます](https://linkers.hatenablog.com/entry/2023/06/28/161932)。

```ruby
# Gemfile
gem 'rails', git: 'https://github.com/rails/rails.git', branch: '6-1-stable'
```

実際に6-1-stableブランチを利用したところ、Ruby 3.2で落ちていたテストがすべて通るようになりました。
このやり方は非公式な対応のため、もちろん速やかにRails 7.0にアップデートするべきです。

### Ruby 3.2にアップデート

ここまでの手順ができていれば、あまり苦労はなくRuby 3.2にアップデートできました。
[Ruby 3.2ではFile.exists?やDir.exists?が削除された](https://www.ruby-lang.org/ja/news/2022/12/25/ruby-3-2-0-released/)のが比較的大きい非互換です。

アプリケーションはgrepして`Dir/File.exist?`に直し、gemはアップデートしていけば問題ありません。

#### ビルド時の注意点

コードの修正が必要な変更ではありませんが、[libyamlなどのライブラリのソースコード同梱が廃止された](https://www.ruby-lang.org/ja/news/2022/12/25/ruby-3-2-0-released/)影響で、ビルドする際は事前にライブラリをインストールしておく必要があります。
また、YJITを有効にしてビルドするにはRustも必要です。

> - YJIT をビルドするためには Rust 1.58.0 以降が必要となります

> - `libyaml` や `libffi` のような 3rd パーティのライブラリのソースコードの同梱を廃止しました

[RubyのDocker official image](https://hub.docker.com/_/ruby)は[YJITを有効にしてビルドしてある](https://github.com/docker-library/ruby/blob/ed1be47a38a7a24a0aa03c450549afcb592f02a8/3.2/bookworm/Dockerfile#L82)ため、対応不要でYJITが使えます。

### YJITを有効化する

いよいよ最終目標のYJITを有効化します。[主に2つの方法が利用できます](https://github.com/ruby/ruby/blob/master/doc/yjit/yjit.md#command-line-options)。

- コマンドラインオプションで`--yjit`を指定する
- 環境変数で`RUBY_YJIT_ENABLE=1`をセットする

Herokuや各種コンテナプラットフォームなど、多くの環境では環境変数を利用するのが手っ取り早いと思います。

YJITが有効化されていれば、`ruby -v`の出力に`+YJIT`が含まれます。
irbなどから`RubyVM::YJIT.enabled?`を実行しても確認できます。

```sh
$ ruby -v --yjit
ruby 3.2.2 (2023-03-30 revision e51014f9c0) +YJIT [arm64-darwin22]

$ RUBY_YJIT_ENABLE=1 ruby -e 'p RubyVM::YJIT.enabled?'
true
```

## YJITでどれだけ高速化できたか

とくに大きい効果を得られたページでは、p95レスポンスタイムが650msから500〜550msになり、100〜150msほど短縮しました。
少なく見積もって100msとしても、約18%パフォーマンス向上できたことになります。
リクエスト全体でもグラフを目で見てわかるくらい改善できていました。

JITコンパイラなのだから当たり前ですが、DBや外部IOがボトルネックになっている箇所では効果が得られず、Rubyがヘビーに使われている処理では大きく改善できる傾向です。

具体的なグラフなどは会社のテックブログで出せたらなと思っています（力尽きなければ……）。

## まとめ

以上のように、Ruby 3.2+YJITの恩恵をいち早く受けるため、Psych 4対応やRails 7.0アップデートを後回しにする方針をとりました。
そして実際に大規模キャンペーンの前にリリースできたことで、多くのお客様に高速化したサービスをご利用いただけました。

[RubyKaigi 2023](https://rubykaigi.org/2023/)での[YJITの発表](https://rubykaigi.org/2023/presentations/maximecb.html#day2)に感銘を受けてアップデートに取り組み、そこから2か月ほどでリリースできてよかったです。
今後は引き続きRails 7.0に向けてがんばっていきます。
