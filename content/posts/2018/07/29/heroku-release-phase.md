---
title: HerokuのRelease PhaseでDBマイグレーション忘れを防ぐ
date: 2018-07-29 21:46:04
categories:
  - 技術
tags:
  - Heroku
  - Rails
---

Herokuには[Release Phase](https://devcenter.heroku.com/articles/release-phase)という機能があります。
これはアプリケーションのビルドが終わってリリースする直前に任意のコマンドを実行するもので、DBのマイグレーションやキャッシュの削除といった用途に使えます。

設定方法は`Procfile`に`release: command`の形式で書くだけです。例えば、Railsでmigrateと[seed-fu](https://github.com/mbleigh/seed-fu)を実行するのであれば以下のようになります。

```
release: bin/rails db:migrate db:seed_fu
web: bundle exec puma -C config/puma.rb
```

DBマイグレーションを忘れて500エラーはあるあるな話ですが、これで防ぐことができます。
コマンドが失敗したとき(0以外のステータスで終了したとき)はもちろんデプロイは行われません。

Herokuはかゆいところに手が届いて便利ですね。
