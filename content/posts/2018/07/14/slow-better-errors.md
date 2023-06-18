---
title: better_errorsがやたら遅いときは最新版にアップデートするとよい
date: 2018-07-14 19:18:49
categories:
  - 技術
tags:
  - Rails
---

[better_errors](https://github.com/charliesome/better_errors)が入ったRailsプロジェクトを最近触っているのですが、エラー画面の表示がやたら遅く、コンソールが使い物にならない状態になっていました。
[Puma 3系で発生しており](https://github.com/charliesome/better_errors/issues/341)、リクエスト・レスポンス変数内の`puma.config`のサイズが非常に大きく、通信に時間がかかってしまっているからのようです。

この対策として、最新バージョンの2.4.0(2017年10月リリース)で[サイズの大きいインスタンス変数をフィルタする機能](https://github.com/charliesome/better_errors#set-maximum-variable-size-for-inspector)が追加されていました。フィルタ設定はデフォルトで有効なので、最新版にアップデートすればいい感じになります。

```ruby
# e.g. in config/initializers/better_errors.rb
# This will stop BetterErrors from trying to render larger objects, which can cause
# slow loading times and browser performance problems. Stated size is in characters and refers
# to the length of #inspect's payload for the given object. Please be aware that HTML escaping
# modifies the size of this payload so setting this limit too precisely is not recommended.
# default value: 100_000
BetterErrors.maximum_variable_inspect_size = 100_000
```

最近では[web-console](https://github.com/rails/web-console)があるのでbetter_errorsをやめることも検討したのですが、これで快適に使えるようになりました。
