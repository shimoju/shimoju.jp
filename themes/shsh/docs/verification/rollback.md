# 移行の切り戻し（T054）

この手順は準備資料であり、本番の切り戻しは実行していない。設定・コンテンツ・素材・テーマ・上書きをまとめて戻す。`hugo.yml`のテーマ名だけをPaperModへ戻しても、shortcode化済み本文と削除済み上書きは復元されない。

## 復元対象

2026-09-18にGitHub APIでmasterと成功チェックを再取得した（[証拠](t054/github-state.json)）。

| 対象                        | 固定値                                            |
| --------------------------- | ------------------------------------------------- |
| 移行前master                | `fb3a9bb0b0a943afb5e666520f82be7414c2fd75`        |
| PaperMod submodule          | `d3768854d00ad003b0a8dbdba254ce9224377a01`        |
| 既存本番のPages成功チェック | deployment `a441e0fe-70b9-4495-b0a2-3289ffef7089` |
| 移行照合基準                | `c266ebb0f6c198053ab6c7e7974a1916a5524f5f`        |

masterと照合基準の間で`hugo.yml`・`content`・`static`・`assets`・`layouts`・PaperModに差分がないことをGitで確認した。照合基準は資料を含む後続コミット、本番復元対象は上記masterであり、混同しない。

T071の本番移行直前に、PagesのDeploymentsでこのSHA・成功したproduction環境・deployment IDを再照合し、実際の配信元を[記録した](t071/pre-production.json)。GitHub成功チェックだけでは、現在本番ドメインがその成果物を配信していることまで証明しない。

## 配信成果物を戻す場合

Cloudflare Pagesの成功済みproduction deploymentへ戻す方法を優先する。生成済みの内容を復元でき、再ビルド時の外部取得結果の変化を避けられる。previewは切り戻し先に指定できない。[Cloudflare公式手順](https://developers.cloudflare.com/pages/configuration/rollbacks/)（2026-09-18確認）。

1. `shimoju`のDeploymentsで、移行直前に確定した旧production deploymentのSHAとIDを確認する。
2. 対象のメニューから`Rollback to this deployment`を選び、対象を確認して実行する。本番の表示が切り替わる操作なので、障害対応として切り戻す判断を記録してから実施する。
3. 本番ホーム・代表記事・About・Archives・RSSを確認し、不存在URLのHTTP404と`/feed.xml`→`/index.xml`の301、本番にnoindexが付いていないことを確認する。
4. 戻したdeployment、実施日時、HTTP結果、残る問題を進捗JSONへ記録する。

配信成果物の切り戻しはGitのmasterを戻す操作ではない。PagesのGit連携は維持されるため、次のmaster更新で新しい成果物が配信されることを踏まえ、修正PRの必須CIと配信内容を確認する。F019で不採用となった自動配信停止やActions deployへの切替を、この手順で復活させない。

## ソースから再生成する場合

旧コミット全体と、そのコミットが指定するPaperModを独立した作業場所へ取得する。既存作業ツリーの上に展開せず、masterのforce pushやブランチ保護解除は行わない。Hugo 0.166.0を使用する。

次の検証スクリプトは全ソースを`git archive`で一時ディレクトリへ展開し、PaperModの同じコミットを復元する。旧独自CSS・partial・生埋め込みの本文・画像動画・`_headers`・`_redirects`も含まれる。生成物を検査後、一時ディレクトリを削除する。本番やrepoの`public/`には書き込まない。

```sh
python3 themes/shsh/docs/verification/t054/verify-restore.py
```

PaperMod撤去後は別checkoutを用意して指定する。移行前のGit履歴とPaperModの指定コミットを取得できることが前提となる。

```sh
git clone --no-checkout https://github.com/adityatelange/hugo-PaperMod.git /tmp/shsh-rollback-papermod
python3 themes/shsh/docs/verification/t054/verify-restore.py --papermod-repository /tmp/shsh-rollback-papermod
```

このスクリプトは再生成の確認用で、配信・Gitソースの切り戻しPRは作成しない。ソース復元を恒久反映する場合も、設定・本文・素材・テーマの一式をレビューし、採用済みのPR・必須CI・Pages自動配信の経路で別途扱う。shsh向けCIの期待値をそのまま旧テーマへ適用できるとは仮定しない。

## 隔離復元の実施結果

[結果JSON](t054/result.json)・[ビルドログ](t054/build.log)・[再現スクリプト](t054/verify-restore.py)。59記事とAbout・Archivesの計61入力、170 HTML、48 RSSを生成。全HTML/RSSのURL集合と全フィードのGUID集合が移行前基準に一致した。ホームRSSは旧仕様の60件（Aboutを含む）、posts RSSは59件。404の生成、配信設定2ファイルの一致、ホームcanonicalが本番URLであることも確認した。

初回sandbox内の実行はDNS制約でX取得に警告が出た（[初回ログ](t054/sandbox-build.log)）。ネットワークを許可して再実行した結果、外部取得警告は0件。旧PaperModのHugo非推奨API警告2件は残るが、生成は成功した。検査用shortcodeへの置換はしていない。

これは旧ソースの生成・URL/RSS/配信設定の復元確認であり、外部ウィジェットのブラウザ表示やCloudflareでの切り戻し操作、公開後のHTTP検査の成功を代用しない。
