---
title: 'Sidekiq + Heroku RedisでERROR: ERR max number of clients reachedと言われたら'
date: 2018-08-05 23:41:33
categories:
  - 技術
tags:
  - Sidekiq
  - Redis
  - Heroku
---

Redisの同時接続数制限が原因です。

[Sidekiqのconcurrencyのデフォルトは25](https://github.com/mperham/sidekiq/wiki/Advanced-Options#concurrency)となっており、Redisにもその数だけ接続するため、デフォルトのままだと一気に25接続を消費します。[Heroku Redis](https://elements.heroku.com/addons/heroku-redis)のHobby Dev(接続数制限20)のような低価格なプランでは、concurrencyの設定をせずにデプロイすると一瞬でログがエラーまみれになってしまうので注意しましょう……。

上記Wikiにもあるように、変更するには`sidekiq.yml`に以下のように書きます。`RAILS_ENV`ごとに切り替えることもできます。

```yaml
:concurrency: 5
staging:
  :concurrency: 10
production:
  :concurrency: 20
```
