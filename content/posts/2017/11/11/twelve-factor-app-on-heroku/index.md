---
title: Herokuはスケーラブルなアプリ養成ギプス
date: 2017-11-11T22:39:05+09:00
categories:
  - 技術
tags:
  - Heroku
---

社内勉強会でHerokuでの本番運用について発表しました。
いま携わっている[SUZURI](https://suzuri.jp/)はHerokuで運用しており、個人でもHerokuで運用しているアプリがあります。その中で経験したことや知見を話しました。

<script async class="speakerdeck-embed" data-id="457f092496ab4856b7c3cef5bcd2babb" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>

[Herokuで本番運用する技術](https://speakerdeck.com/shimoju/heroku-production)

目次を見るとわかるようにテーマは多岐にわたっており、ざっと＆ゆるめに発表しようという趣旨です。

## Herokuはスケーラブルなアプリ養成ギプス

Herokuのいいところといえば、マネージドで手軽に使えること、開発者にとって便利な機能が豊富なこともそうですが、アプリケーション設計に良い影響を与える点もあります。

たとえば、Herokuではローカルにファイルを保存できません(正確にはできますが、1日1回自動で再起動され、そのときに消滅します)。この挙動に代表されるように、Herokuではシステムローカルな何かに依存しない、疎結合でステートレスなアプリケーション設計が強制されます。

このHerokuが提唱している方法論をまとめたものが[The Twelve-Factor App](https://12factor.net/ja/)です。初めて読んだときはよくわからなかったのですが、新卒研修でインフラを学んだり、アプリケーション設計の知識がついていくにつれて、なるほどとてもよいポリシーだなあ、としみじみ感じています。

Herokuで動くように作ればスケーラブルなアプリが自然にできていくということで、養成ギプスを思わせます。Dockerなどのコンテナでアプリを運用するときにも同じ考え方を適用できるため、コンテナ時代になってその重要性はさらに高まっているのではないかと思います。Twelve-Factor Appを学ぶのにもHerokuはおすすめです。

## おまけ

「おまけ」に書いたのですが、Herokuにはテスト、ステージング、本番環境をシームレスに統合するCI/CD環境である[Heroku Pipelines](https://devcenter.heroku.com/articles/pipelines)があります。たとえばマージすると自動でデプロイできる[GitHub Integration](https://devcenter.heroku.com/articles/github-integration)、CI環境の[Heroku CI](https://devcenter.heroku.com/articles/heroku-ci)や、[ChatOps](https://devcenter.heroku.com/articles/chatops)もあります。特に[Heroku Review Apps](https://devcenter.heroku.com/articles/github-integration-review-apps)はPull Requestを作るたびに新しい環境を自動的に作ってくれてとても便利です。

しかしこの機能はGitHubしかサポートしておらず、会社のリポジトリはGitHub Enterpriseなので使えません😭
"github.com"がハードコードされていて色々大変らしいという話を[@hsbt](https://twitter.com/hsbt)さんから聞いたのですが、本当に書いてあって笑いました。なんとかしてほしいものです。

> Heroku's GitHub sync features are hard-coded to connect to and use github.com.
> ―[Can I use Github Enterprise with Pipeline Review apps? - Knowledge Base](https://kb.heroku.com/can-i-use-github-enterprise-with-pipeline-review-apps)

実はこの日には[新卒エンジニア研修の座学で1時間の発表](/2017/10/30/classroom-learning-for-new-engineers/)もしており、2回目の発表でとてもヘビーでした。あんまりうまく喋れてなかったのではないかと思います……。
