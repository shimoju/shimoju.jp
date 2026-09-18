# Cloudflare Pages配信確認（T017）

状態：既存配信の読み取り調査まで。移行後の配信・CI・dashboardのビルド設定は未確認。R002の判断後に対象コミットを確定して再検証する。

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

Chromeに開いたCloudflare管理画面へのログインをユーザーへ依頼済みで、回答待ち。ログイン後はプロジェクト`shimoju`のproduction/preview設定を読み取る。本人が確認する場合も、以下の手順2〜4の設定・版・コミット対応が必要。パスワード等を会話や検証資料へ記録しない。

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
