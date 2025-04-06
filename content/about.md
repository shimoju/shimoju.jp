---
title: About
date: 2025-04-06T00:00:00+09:00
---

## プロフィール

- 氏名 : 下重博資（Hiroshi Shimoju）
- 生年月日 : 1991年5月22日
- 居住地 : 東京都
- メールアドレス : hiroshi.shimoju@gmail.com

## 職務要約

2016年にGMOペパボ株式会社に入社し、9年間に渡りオリジナルグッズ作成サービス「[SUZURI](https://suzuri.jp/)」の開発に従事。
主にRuby on Railsを用いたWebアプリケーション開発を担当しています。2020年以降はSLI/SLOの策定・運用、パフォーマンス改善やインフラの構築といったSRE活動や、セキュリティ対策にも携わっています。

## スキルセット

### ソフトウェア開発

Ruby on Railsを用いたWebアプリケーションのバックエンド開発を専門領域としています。
フロントエンドはReact/GraphQLを使用した開発経験があります。パフォーマンス改善、インフラの構築・運用に携わったこともあり、必要に応じて幅広い技術領域に取り組んでいます。

- Webアプリケーションの設計・開発・運用
- リアーキテクティング・パフォーマンス改善 : 大規模なデータ移行、APMを利用したボトルネックの特定、N+1の解消などのクエリチューニング
- 開発基盤の整備 : 開発環境やCI/CDパイプラインの構築
- インフラの構築・運用 : IaaS上でのインフラ構築、TerraformによるIaC
- セキュリティ対策 : 言語処理系・フレームワークのアップデート、脆弱性の修正、内部統制の整備

| | | 業務経験 |
| - | - | - |
| バックエンド | Ruby | 9年 |
| | Ruby on Rails | 9年 |
| | GraphQL | 3年 |
| | Rust | 1年未満 |
| フロントエンド | JavaScript | 9年 |
| | TypeScript | 3年 |
| | React | 3年 |
| クラウド | Amazon Web Services | 9年 |
| | Heroku | 9年 |
| インフラ | Docker | 9年 |
| | Kubernetes | 3年 |
| | Terraform | 2年 |
| CI/CD | GitHub Actions | 5年 |

### 採用・教育

中途および新卒エンジニアの採用に長く取り組んでおり、書類選考・面接の経験があります。新卒エンジニアの研修を計画し、運営した実績があるほか、新入社員のオンボーディング業務も複数回担当しました。

また、マネジメントを専門とする役職についたことはないものの、評価者として複数名のエンジニアの評価を担当した経験があります。

- エンジニア採用 : 書類選考・面接、採用イベントへの参加やインターンの受け入れ
- 新卒エンジニア研修の設計・運営（GMOペパボ株式会社、2017年）
- オンボーディング : 1on1やペアプログラミング、コードレビューを通した成長支援

## 職務経歴

| 所属 | 時期 | 職種 |
| - | - | - |
| GMOペパボ株式会社 | 2019年7月〜現在 | Webアプリケーションエンジニア（シニア） |
| GMOペパボ株式会社 | 2016年4月〜2019年6月 | Webアプリケーションエンジニア |

### GMOペパボ株式会社（2016年4月〜現在）

2016年に入社し、9年間に渡りオリジナルグッズ作成サービス「[SUZURI](https://suzuri.jp/)」の開発に従事。
主にRuby on Railsを用いたWebアプリケーション開発を担当しています。

2019年からはシニアエンジニアとして、技術選定やセキュリティ対策をリードする立場となりました。事業部CTO（エンジニアリングマネージャー）と連携し、技術方針を策定したり、部署のエンジニア（10名ほど）の成長支援を通したチームビルディングに取り組んでいます。
2020年以降はSLI/SLOの策定・運用、パフォーマンス改善やインフラの構築といったSRE活動にも携わっています。

#### 主な実績

- クレジットカード決済における3Dセキュアの導入（2025年）
- プレゼント機能の開発（2024年）
- Heroku EnterpriseからAmazon EKSへの移設（2024年）
- Rails 6.1のままRuby 3.2にアップデートし、YJITを有効化（2023年）
- SAMLによるシングルサインオンの実装（2020年）
- Canvathの事業譲受（2018年）
- 新卒エンジニア研修の設計・運営（2017年）

#### クレジットカード決済における3Dセキュアの導入（2025年）

2025年3月末までに原則導入が求められている3Dセキュアについて、SUZURIではすでに導入していたものの一部経路では利用されていない状態でした。
未対応だった3つの経路を3人のエンジニアで手分けして実装を進めました。未対応箇所の洗い出しや、誰がどの部分を担当するかの判断、コードレビューなどを行い、プロジェクトを主導しました。

- チーム構成 : エンジニア3人
- 利用技術 : Ruby, Ruby on Rails, TypeScript, React, Vue.js

#### プレゼント機能の開発（2024年）

ある動画配信サービスと連携し、SUZURIのグッズをプレゼントとして他者に贈れる「プレゼント機能」をリリースしました。
当初はMinimum Viable Productとして請求書による決済を検討していましたが、価値が届くのが結果的に遅くなることから、クレジットカード決済も初期要件に盛り込みました。さらに配信者にヒアリングを行い、料金がネックになる可能性が想定されたことから、初回限定割引の機能も追加で実装しました。
その結果、利用した配信者の方からは非常に便利だとの声をいただいています。

- チーム構成 : エンジニア1人、デザイナー1人、プロダクトマネージャー1人
- 利用技術 : Ruby, Ruby on Rails, TypeScript, React, GraphQL

#### Heroku EnterpriseからAmazon EKSへの移設（2024年）

SUZURIではこれまでHeroku Enterpriseを利用していましたが、別サービスへの移設を検討した結果、最終的にAmazon EKSを採用することに決定しました。その移設作業をインフラの専門部署である技術部のメンバーと共同で実施しました。
移設作業は技術部が行い、私は事業部のWebアプリケーションエンジニアとして、コードの修正やビルドパイプラインの変更、ドキュメントの作成を担当しました。
また、SUZURIのメインアプリケーション以外の小規模なアプリは通常版Heroku（Common Runtime）に移設しました。

- チーム構成 : エンジニア3人
- 利用技術 : Ruby, Ruby on Rails, Heroku, Docker, Kubernetes, Amazon Web Services
- 記事 : [SUZURIをHerokuからAmazon EKSに移設するためにやったこと](/2024/12/15/suzuri-heroku-to-amazon-eks/)

#### Rails 6.1のままRuby 3.2にアップデートし、YJITを有効化（2023年）

Rails 6.1はRuby 3.2に対応していないため、通常の手法ではRails 7.0へアップデートしてからRuby 3.2にアップデートすることになります。
しかしYJITによる高速化の恩恵をいち早く受けるため、Rails 6.1のままRuby 3.2へのアップデートを実施しました。
理由としては、YJITにより現実のRailsアプリが高速化できることはわかっていて、かつ言語処理系のアップデートだけで大きな効果を得られるタイミングはめったにないので、できるだけ早くリリースしてビジネス的な価値を出したいと判断したためです。
この戦略をとったことで大規模キャンペーンの前に無事アップデートを完了でき、多くのユーザーに高速化したサービスを届けることができました。
その後、2024年にはRuby 3.3とRails 7.0へのアップデートを完了しています。

- チーム構成 : エンジニア1人
- 利用技術 : Ruby, Ruby on Rails, Docker
- 記事 : [Rails 6.1のままRuby 3.2にアップデートし、YJITの恩恵を受ける](/2023/08/10/ruby-3-2-yjit-with-rails-6-1/)

#### SAMLによるシングルサインオンの実装（2020年）

COVID-19の拡大に伴い在宅勤務に切り替えたことで、IPアドレスで制限している管理画面や社内サービスへのアクセスが不便になる問題が起こりました。
その対策として、SUZURI・CanvathにSAMLによるシングルサインオンを実装してIPアドレス制限を撤廃しました。さらに、コードの改変が難しい一部のサービスでは、oauth2-proxyを用いてアプリケーションの外側でアクセス制御を実現しました。実装にあたってはセキュリティや内部統制上の要件も検討し、セキュリティを保ちながら快適にリモートワークを行えるようになりました。

- チーム構成 : エンジニア1人
- 利用技術 : Ruby, Ruby on Rails, Nginx, oauth2-proxy
- 記事 : [快適なリモートワークを実現するために〜RailsでSSOを実現する3パターン](https://scrapbox.io/shimoju/%E5%BF%AB%E9%81%A9%E3%81%AA%E3%83%AA%E3%83%A2%E3%83%BC%E3%83%88%E3%83%AF%E3%83%BC%E3%82%AF%E3%82%92%E5%AE%9F%E7%8F%BE%E3%81%99%E3%82%8B%E3%81%9F%E3%82%81%E3%81%AB%E3%80%9CRails%E3%81%A7SSO%E3%82%92%E5%AE%9F%E7%8F%BE%E3%81%99%E3%82%8B3%E3%83%91%E3%82%BF%E3%83%BC%E3%83%B3)

#### Canvathの事業譲受（2018年）

株式会社ベーシックより譲り受けたグッズ作成サービス「Canvath」（2023年サービス終了）の引き継ぎを担当しました。
譲受した時点のCanvathの環境はAWS上に構築されていましたが、当時はSUZURIに専任のインフラエンジニアがおらず、アプリケーションエンジニアだけで運用を続けるのはセキュリティを担保できないと判断しました。そのため、SUZURIで培った知見を活用でき、プラットフォーム側で一定のセキュリティ対策を行ってくれるHerokuへの移設を決定しました。
Herokuに移設するためにログを標準出力に書き出す、環境変数を使う、リクエスト契機の処理をやめて非同期化するなどの対応を行いました。その他にもパフォーマンス改善やセキュリティ対策、問い合わせの調査対応を進め、自社で運用が完結できるようにしました。

- チーム構成 : エンジニア1人、プロダクトマネージャー1人、デザイナー1人
- 利用技術 : Ruby, Ruby on Rails, JavaScript, Heroku, Amazon Web Services

#### 新卒エンジニア研修の設計・運営（2017年）

2017年の新卒エンジニア研修の担当者として、研修の設計と運営を行いました。まずやってみよう、挑戦してみようという気持ちを後押しできるような研修を目指して「ナイストライ！」というコンセプトを打ち出しました。
この時作成した`:nicetry:`の絵文字はSlackで定期的に使われており、チャレンジを称賛する文化として全社に定着させることができました。また、研修担当者としてだけではなく、座学では自身も講師として登壇し、SUZURIでのOJTの受け入れも行いました。

- チーム構成 : エンジニア2人
- 記事 :
  - [ペパボの新卒エンジニア研修2017 Vol.1](https://tech.pepabo.com/2017/08/08/engineer-training-2017-vol1/)
  - [ペパボの新卒エンジニア研修2017 Vol.2](https://tech.pepabo.com/2017/11/08/engineer-training-2017-vol2/)
  - [新卒エンジニア研修の座学でImageMagickと画像加工の話をした](/2017/10/30/classroom-learning-for-new-engineers/)
  - [研修資料](https://github.com/pepabo/textbook)

#### 利用技術

- バックエンド : Ruby, Ruby on Rails, Node.js, Rust, GraphQL
- フロントエンド : JavaScript, TypeScript, CoffeeScript, React, Vue.js, Backbone.js, Apollo Client
- クラウド : OpenStack, Amazon Web Services, Google Cloud, Heroku
- インフラ : Docker, Kubernetes, Ansible, Terraform
- データベース : PostgreSQL, Amazon Aurora
- ミドルウェア : Redis, Sidekiq, Elasticsearch
- モニタリング : Datadog, Sentry, Grafana, Mackerel
- CI/CD : GitHub Actions, Argo CD
- データ分析 : Metabase, BigQuery

## 興味・関心

社会をより良くし、誇りを持てるプロダクトであることを理想としています。
また、「本当に良いものを作る」ためにそれぞれの職種やロールの専門性をもって意見を交わせる環境であることを好みます。ユーザーヒアリングや商談の場に同席したり、機能要件から一緒に考えていけるチームだと良いです。

特定の技術へのこだわりはそこまでなく、必要に応じて幅広い技術領域に取り組んできました。
しかしRuby on Railsを用いたWebアプリケーション開発の経験が長く、もっとも事業に貢献できるであろうことと、Rubyコミュニティに愛着がありコミュニティへの貢献を続けたいことから、今後のキャリアでもRubyを中心に据えたいと考えています。

## 業務外活動

### アウトプット

- Blog : https://shimoju.jp/
- Cosense : https://scrapbox.io/shimoju/
- GitHub : https://github.com/shimoju

### 著作

#### 2024年

- [Ruby コードレシピ集](https://gihyo.jp/book/2024/978-4-297-14403-6)（技術評論社、3名による共著）

### プレゼンテーション

主なものを記載。LT登壇は[Shibuya.rb](https://shibuyarb.connpass.com/)を中心に多数。

#### 2023年

- [プロダクト開発エンジニアからSREへの挑戦](https://speakerdeck.com/shimoju/backend-engineer-and-sre)（[Pepabo Tech Conference #20 春のSREまつり](https://pepabo.connpass.com/event/276927/)）

#### 2020年

- [快適なリモートワークを実現するために〜RailsでSSOを実現する3パターン](https://scrapbox.io/shimoju/%E5%BF%AB%E9%81%A9%E3%81%AA%E3%83%AA%E3%83%A2%E3%83%BC%E3%83%88%E3%83%AF%E3%83%BC%E3%82%AF%E3%82%92%E5%AE%9F%E7%8F%BE%E3%81%99%E3%82%8B%E3%81%9F%E3%82%81%E3%81%AB%E3%80%9CRails%E3%81%A7SSO%E3%82%92%E5%AE%9F%E7%8F%BE%E3%81%99%E3%82%8B3%E3%83%91%E3%82%BF%E3%83%BC%E3%83%B3)（[Kaigi on Rails 2020](https://kaigionrails.org/2020/timetable/)）

#### 2019年

- [実践 Heroku Enterprise](https://speakerdeck.com/shimoju/unite-heroku-enterprise)（[Heroku Meetup #26](https://herokujp.doorkeeper.jp/events/96641)）
- [GMOペパボのエンジニアが語るHeroku活用ノウハウ](https://www.slideshare.net/slideshow/gmoheroku-154211436/154211436)（Salesforce Webinar）

### イベント運営

- [Kaigi on Rails](https://kaigionrails.org/) : オーガナイザーとして2021年から活動
- [Rails Girls](https://railsgirls.jp/) : コーチとして2018年から活動

### OSS

- [metabase-ruby](https://github.com/shimoju/metabase-ruby) : [Metabase](https://www.metabase.com/)のAPIクライアント
