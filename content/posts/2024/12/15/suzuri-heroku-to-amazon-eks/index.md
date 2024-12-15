---
title: SUZURIをHerokuからAmazon EKSに移設するためにやったこと
date: 2024-12-15T23:58:00+09:00
categories:
  - 技術
tags:
  - Heroku
  - EKS
  - Kubernetes
---

これは[🎄GMOペパボ エンジニア Advent Calendar 2024](https://adventar.org/calendars/10317)の15日目の記事です。

14日目はk4tayaさんの[DKIM2についての所感](https://zenn.dev/k4taya/articles/ec4c117e9e9b32)でした。
ペパボのエンジニアAdvent Calendarには[もうひとつの会場](https://adventar.org/calendars/10036)もありますので、ぜひこちらもご覧ください。

## HerokuからAmazon EKSへ移設

[SUZURI](https://suzuri.jp/)では2014年のサービス開始当初からHerokuを利用しており、2018年からは[Heroku Enterprise](https://jp.heroku.com/enterprise)を契約し、ここまで運用してきました。

今年、10年間使ってきたHerokuからAmazon EKSに移設することを決定し、2024年6月に無事完了しました。
これまで[Heroku関連の記事をいくつか書いたり](/tags/heroku/)、[Salesforceのセミナーで登壇する](https://www.slideshare.net/slideshow/gmoheroku-154211436/154211436)機会もいただくなど、長年付き合ってきたプラットフォームなので思い出深いものがあります。

移設の意思決定は、インフラの専門部署である技術部プラットフォームグループとSUZURI事業部の共同で行いました。[なぜSUZURIはHerokuから「EKS」へ移設する決定をしたのか](https://tech.pepabo.com/2024/06/13/heroku-to-eks/)に詳しいのでこちらをご覧ください。

移設作業はプラットフォームグループが行い、私は事業部のアプリケーションエンジニアとして主に以下を担当しました。

- アプリケーションコードの修正
- Amazon ECRにイメージをプッシュするようにビルドパイプラインを変更
- Private Spacesで動くアプリケーションのうち、小規模なものを通常版Heroku（Common Runtime）に移設
- 事業部のアプリケーションエンジニアに向けたドキュメントの作成

### アプリケーションコードの修正

Herokuは[The Twelve-Factor App](https://12factor.net/ja/)を提唱しており、疎結合でステートレスなアプリケーション設計が強制されるようになっています。

たとえばDBやRedisといったミドルウェアの接続先は環境変数で管理され、変更は環境変数を書き換えるだけで済みます。
ログはファイルではなく標準出力に出力され、収集・解析はAddonを用いて行います。
ローカルにファイルを保存しても再起動時に消滅するため、永続化する必要のあるすべてのデータはDBやオブジェクトストレージに保存しなければなりません。そのためHerokuから別のコンテナプラットフォームへの移設は比較的容易だと言えます。
実際、アプリケーションコードはほぼ変更していません。

しかしHeroku特有の事情に基づいて分岐している箇所はあったのでそれらを修正したほか、ミドルウェアの接続先についても、移行期間中はHeroku AddonとAWSの両方を参照できるようにするなどを行いました。

コードとは直接関係ありませんが、IPアドレスで制限されている外部サービスがいくつかあり、その洗い出しが一番苦労したポイントかもしれません……。

### Amazon ECRにイメージをプッシュするようにビルドパイプラインを変更

Herokuでは[buildpackによるデプロイ](https://devcenter.heroku.com/ja/articles/buildpacks)のほかに[Dockerイメージによるデプロイ](https://devcenter.heroku.com/ja/categories/deploying-with-docker)にも対応しています。
SUZURIではEKSへの移設以前からDockerデプロイにしていたため、プッシュ先をECRに変えるだけでDockerfileはほぼそのまま流用できました。
Herokuから別のコンテナプラットフォームへの移行を検討している場合、まずはDockerデプロイにしておくと環境差分が少なくなるのでおすすめです。

また、SUZURIではAPMとしてDatadogを利用しています。Herokuでは[Datadog AgentをDockerイメージに追加し、コンテナ内の別プロセスとしてAgentを起動する方法](https://docs.datadoghq.com/ja/agent/basic_agent_usage/heroku/#docker-%E3%82%A4%E3%83%A1%E3%83%BC%E3%82%B8%E3%81%A8%E5%85%B1%E3%81%AB-heroku-%E3%82%92%E4%BD%BF%E7%94%A8%E3%81%99%E3%82%8B)を用いていました。
この方法は（非効率ではあるものの）EKSでも動くため、移設時点ではそのままとしました。
現在は[Datadog Operator](https://docs.datadoghq.com/ja/containers/kubernetes/installation/?tab=datadogoperator)を使ってDaemonSetとして起動する方式に移行しています。

こういった変更はついでにやりたくなりがちですが、思わぬトラブルが起こったり、単純にタスクが増えてスケジュールを圧迫してしまうリスクがあるため、できる限り差分を減らして移設する方針を取りました。

### Private Spacesで動くアプリケーションのうち、小規模なものを通常版Heroku（Common Runtime）に移設

Heroku Enterpriseでは[Private Spaces](https://jp.heroku.com/private-spaces)と呼ばれる分離環境を構築でき、SUZURIではこれを活用していました。
このPrivate SpacesにはSUZURIのメインアプリケーション（モノリス）以外にも小規模なアプリが乗っていましたが、これはEKSではなく通常版Heroku（[Common Runtime](https://devcenter.heroku.com/ja/articles/dyno-runtime#common-runtime)）に移設しました。

小規模なのでEKSへの移設コストをかけるメリットが薄いことと、これ以外にもいくつかのアプリがCommon Runtime上で動いており、Herokuの知見は今後も残り続けることから、わざわざHeroku以外のプラットフォームを採用する理由はないと判断したためです。
したがってHeroku Enterpriseは解約したものの、通常版Herokuについては継続利用しています。

### 事業部のアプリケーションエンジニアに向けたドキュメントの作成

EKSを採用するにあたっては、インフラがアプリケーションエンジニアの手に負えなくなることで、これまでよりもアジリティが落ちてしまうことが一番の懸念でした。
以下のようなオペレーションはアプリケーションエンジニアでも行えるよう、ドキュメントを随時作るようにしています。

- kubectlコマンドを用いたPodの操作やログの確認
- 環境変数の変更（秘匿情報はAWS Secrets Manager、そうでないものはConfigMap）
- CronJobリソース、Jobリソースの作成変更

サービス運用では時折アドホックなデータの変更や処理の再実行が必要になることがあります（ここでは[oneshot task](https://osa.hatenablog.com/entry/introduce-oneshot-task-generator)と呼びます）。
Herokuでは`heroku run`コマンドを用いることで簡単にoneshot taskを実行できました。
この`heroku run`に相当するオペレーションができないとアジリティが落ちるのは目に見えていたため、ラッパースクリプトを用意してJobリソースを楽に作成できるようにしてあります。

## まとめ

10年間利用してきたプラットフォームからの移設は事業部にとっても挑戦でしたが、こうした取り組みにより無事完遂でき、今のところ大きな問題は起こっていません。

定量的なデータとして、ペパボでは[Four Keysを集計している](https://tech.pepabo.com/2022/01/06/four-keys-dashboard/)ので観測したところ、移設前後の半年間で、

- デプロイの頻度：やや増加
- 変更のリードタイム：やや減少
- 変更障害率：変わらず
- サービス復元時間：変わらず

という結果が得られました。
デプロイ頻度とリードタイムについては開発生産性を上げる取り組みを別途行っていたり、障害にはプラットフォーム起因だけでなくアプリケーション起因もあるため、厳密にEKS移設による影響を評価することは難しいですが、少なくともFour Keysにおいてはアジリティの低下は見られないと言えそうです。

今後はKubernetesをより活用し、開発者体験とユーザー体験の両面でさらなる向上を目指したいと思っています。
