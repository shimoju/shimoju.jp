# Cloudflare Pages配信確認（T017）

状態：既存配信とdashboard実設定の読み取りまで確認済み。移行後の配信・GitHub CI実行は未確認。R002の判断後に対象コミットを確定して再検証する。

## 既存配信の証拠

2026-09-18にGitHub APIでCloudflare Pagesの成功チェックを確認した。プロジェクトは`shimoju`、本番ブランチはリポジトリのdefault branchである`master`が候補（Cloudflare設定は未確認）。GitHubのdeployment一覧とActions run一覧は空で、チェック結果だけを確認できた。

| 対象                             | コミット                                 | 配信先                              | Cloudflare deployment ID             |
| -------------------------------- | ---------------------------------------- | ----------------------------------- | ------------------------------------ |
| 既存本番のGitHubチェック         | fb3a9bb0b0a943afb5e666520f82be7414c2fd75 | https://shimoju.jp/                 | a441e0fe-70b9-4495-b0a2-3289ffef7089 |
| 既存作業ブランチのGitHubチェック | c3748dcbeebaac5bf4c07a512c7c58224c01b3df | https://bd0b6c0f.shimoju.pages.dev/ | bd0b6c0f-2c0f-4064-9d5a-b08951eac350 |

本番ドメインの配信内容とGitHubチェックのコミットの厳密な対応はdashboardで未確認。両環境のホーム・記事が200、`/feed.xml`が301で`/index.xml`へ転送、存在しないパスが404だった。既存previewはホーム・記事のHTTPヘッダーがnoindexだが、HTMLのrobotsはindex/follow、canonicalは本番ドメインだった。これは移行前の配信であり、shshのpreview要件に合格したことを意味しない。

応答ヘッダーと本文SHA-256・抽出結果は[t017](t017/existing-deployments.json)へ保存した。本文の全コピーは保存していない。プラグイン検索でCloudflare連携は見つからず、ブラウザ接続も利用できなかった。Safariの既存ハンドルでは再取得が必要というエラーになったため、dashboard確認は未実施。

## 接続の再確認（T027）

2026-09-18、Chromeのブラウザ接続が利用可能になったため、既存previewのCloudflare dashboard URLを専用タブで開いた。Safariでも確認したが、両方ともログイン画面へ移動し、ビルド設定は読めなかった。認証情報の入力や設定変更は行っていない。

この時点ではChromeに開いたCloudflare管理画面へのログインをユーザーへ依頼した。その後、下記T029でログインを確認済み。ログイン後はプロジェクト`shimoju`のproduction/preview設定を読み取る。本人が確認する場合も、以下の手順2〜4の設定・版・コミット対応が必要。パスワード等を会話や検証資料へ記録しない。

## ログイン後の実設定（T029）

2026-09-18、ユーザーから「ログイン済み」の回答を得て、プロジェクト`shimoju`の設定を読み取った。以下が最後に取得した値。初回の本番表示はHUGO_VERSION 0.165.0だったが、再取得時は両環境とも0.166.0だった。エージェントは設定を保存していない。ビルド構成ダイアログは項目を確認後にキャンセルした。

| 項目           | production                 | preview                    |
| -------------- | -------------------------- | -------------------------- |
| ビルドコマンド | `hugo`                     | `hugo`                     |
| 出力           | `public`                   | `public`                   |
| ルート         | 空欄（リポジトリルート）   | 空欄（リポジトリルート）   |
| HUGO_VERSION   | `0.166.0`                  | `0.166.0`                  |
| ビルドシステム | v3                         | v3                         |
| ブランチ       | `master`、自動デプロイ有効 | production以外の全ブランチ |

[設定のAX抜粋と観察](t029/settings-observation.json)。秘密値は取得・保存していない。Hugo版・ルート・出力は期待どおり。現在のコマンドにはminifyとpreview環境/baseURL指定がないため、配信前に次の引数を渡す必要がある。dashboardのビルド設定は「リポジトリ固有」と表示されるため、共通コマンドを使うなら以下の分岐を設定する（まだ適用していない）。

```sh
if [ "$CF_PAGES_BRANCH" = "master" ]; then bin/build --environment production --minify; else bin/build --environment preview --minify --baseURL "$CF_PAGES_URL/"; fi
```

GitHub APIではmasterのbranch protectionは404 `Branch not protected`、実効rulesetは空配列だった（[結果](t029/github-ci-gates.json)）。ローカルの`shsh` workflowは検査を実行するが、Cloudflareの自動配信との依存関係を定義していない。Cloudflareは[Gitへのpushを契機に自動配信する](https://developers.cloudflare.com/pages/configuration/git-integration/)ため、現在の構成だけでは「GitHub検査合格後に配信」を保証できない（F018）。

次の配信前に、同一コミットのCI成功を必須とする配信経路を確定する。検査成功後にGitHub Actionsから配信し、Cloudflare側の独立した自動配信を止める構成なら、本番・preview両方で順序を保証できる。認証と配信方法の具体化が必要で、まだ変更・トークン作成・新規配信は行っていない。既存の成功deploymentをshsh移行後の合格に流用しない。

## 移行後の確認手順

1. F014はT026で承認・反映済み。R002の判断後、GitHub Actionsへ送るコミットを確定する。テーマルートで`pnpm check`を通し、同じコミットのGitHub上の結果URLを記録する。
2. Cloudflareの既存プロジェクトでproduction/preview各環境のビルドコマンド、ルート、出力ディレクトリ、Hugo版、環境変数を読む。認証情報は記録しない。
3. サイト生成はHugoのみ。ルートはリポジトリルート、出力は`public`、両環境の`HUGO_VERSION`は`0.166.0`を期待する。本番は`bin/build --environment production --minify`で設定済み`https://shimoju.jp/`を使用。previewは`bin/build --environment preview --minify --baseURL "$CF_PAGES_URL/"`相当の引数を渡す。実際の設定を確認してから必要な差分を適用する。ビルドコマンドを共用する場合は環境ごとの分岐が必要で、単に`bin/build`とするだけではpreview指定にならない。
4. ビルドログでHugo版・環境・警告/エラー・コミット・deployment ID・URLを記録する。外部shortcode取得の警告と入力エラーを区別する。GitHub検査が公開を止める設定になっているかも確認する。
5. previewのホーム・記事・About・一覧2ページ目で、HTTPのnoindex、HTMLのnoindex、preview自身のcanonical/OGP/RSS、共有無効・スターなしを確認する。存在しないURLの404とfeed.xmlの301も確認する。
6. 本番で公開URL・RSS GUID・canonicalを照合し、共有先とスターの対象が公開URLであること、外部4サービスが表示されることを確認する。投稿確定やスター追加は行わない。
7. 両環境で配信CSS/JSのURLにfingerprintがあり、minifyされ、source map参照も`.map`配信もないことを確認する。各レスポンスと対象ファイルのハッシュを保存する。
8. HTTPS previewの同一コミットで[実機確認](real-devices.md)を依頼し、結果を記録する。本番公開後も404・RSS転送・noindexの適用先を再確認する。

既存`static/_headers`・`static/_redirects`は維持する。Cloudflareはpreviewにnoindexヘッダーを付けるが、共有・スターやHugoのbaseURLを変更する仕組みではない。[preview仕様](https://developers.cloudflare.com/pages/configuration/preview-deployments/)、[Hugo設定](https://developers.cloudflare.com/pages/framework-guides/deploy-a-hugo-site/)、[CF_PAGES_URL等のビルド変数](https://developers.cloudflare.com/pages/configuration/build-configuration/)を2026-09-18に参照した。
