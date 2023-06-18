---
title: Herokuでzip_code_jp gemの郵便番号データを定期更新したい
date: 2018-09-17 22:50:34
categories:
  - 技術
tags:
  - Heroku
  - Ruby
  - Rails
---

日本の郵便番号データを扱うRuby gemとしては[zip_code_jp](https://github.com/tanihiro/zip-code-jp)が有名です。ECサイトなどでは郵便番号から住所を補完する機能はもはや当たり前になっていますが、そのような機能を作りたいときに便利なライブラリです。

この郵便番号データは`ZipCodeJp.export_json`で更新できますが、このときgemの[`data/zip_code`](https://github.com/tanihiro/zip-code-jp/tree/master/data/zip_code)ディレクトリ内にあるJSONファイルを直接更新します。
一般的なサーバ環境であればcronで回すなどすれば普通に更新できますが、Herokuの場合はローカルにファイルを書き込んでも再起動のタイミングで自動で消滅します。[Heroku Scheduler](https://elements.heroku.com/addons/scheduler)などで定期実行しても、既にパッケージされたslug内のデータは変更できないので意味がありません。
[Release Phase](https://shimoju.jp/2018/07/29/heroku-release-phase/)でいけないかな？とも思いましたが、[Release Phaseはslugのビルド後に実行される](https://devcenter.heroku.com/articles/release-phase#when-does-the-release-command-run)のでこれも使えません。

どうしようかなと考えた結果、デプロイ時に更新処理を実行するようにして、slugに最新の郵便番号データを入れてあげることにしました。

`lib/tasks`以下に適当な名前でRakeタスクを作り、以下のように書きます。

```ruby
# lib/tasks/heroku_deploy.rake
Rake::Task['assets:precompile'].enhance do
  Rails.logger.info 'Update zip code data'
  ZipCodeJp.export_json
  Rails.logger.info 'Done!'
end
```

任意のタスクのあとに別のタスクを実行するため、[Rake::Task#enhance](https://docs.ruby-lang.org/ja/latest/method/Rake=3a=3aTask/i/enhance.html)を使っています。ドキュメントには「自身に事前タスクとアクションを追加します。」としか書かれておらず使い方がわかりにくいですが、[enhanceの引数に指定したタスクは事前に実行され、ブロック内に記述したタスクは事後に実行されます](https://www.hsbt.org/diary/20120210.html)。

Herokuへのデプロイ時には`assets:precompile`が毎回実行されるので、`Rake::Task['assets:precompile'].enhance`とすることで、デプロイ時に任意のタスクを実行できるようになります。ここで郵便番号データを更新するようにしました。
郵便番号データ更新に限らず、デプロイ時に実行したい処理があれば同じように書けます。

更新にかかる時間は約20秒でした。少し時間はかかりますが、デプロイのたびに最新の郵便番号データを含めることができるので安心ですね。

```
remote:        I, [2018-08-28T17:24:33.195355 #823]  INFO -- : Update zip code data
remote:        I, [2018-08-28T17:24:55.116512 #823]  INFO -- : Done!
```

(もし毎回実行されるのが気に入らなければ、前回の実行日をどこかに覚えておくとか、日付を見て○日にのみ実行する…といった方法が考えられます)
