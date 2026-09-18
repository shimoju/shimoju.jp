# Cloudflare Pages配信確認（T017）

状態：F018/F019により「GitHub必須チェック → マージ → Pages自動配信」を採用。previewはCIを待たず自動配信する。T071で必須CIの全246件成功後にPR #5を統合し、本番移行・HTTP・共有/スター・外部埋め込みを確認済み。[本番証拠](t071/README.md)。旧テーマ整理後の最終配信も[T072](t072/README.md)で確認済み。

切り戻し先の固定コミット・配信成果物と、旧ソースの隔離復元結果は[切り戻し手順](rollback.md)を参照する。

## 現在の配信方式（T034）

- GitHub masterはPR必須、GitHub Actions由来の`shsh-check`必須、最新ベース必須、管理者にも適用。承認レビュー人数は0で、人の追加承認は要求しない。force push・削除は不可。
- `.github/workflows/shsh.yml`は検査専用。PRとpushで実行し、deployジョブ・トークン参照・Wrangler依存は削除した。
- Cloudflare Pagesのmaster本番自動配信と全非本番ブランチpreviewを維持する。build commandは`if [ -f themes/shsh/scripts/build-pages.sh ]; then sh themes/shsh/scripts/build-pages.sh; else hugo; fi`、出力`public`、root空、Hugo0.166.0。移行前masterなどスクリプトが存在しないブランチは従来のhugoを維持する（T035）。
- Pages内でHugoだけを実行する。masterはproduction・本番URL、他のブランチはpreview・`CF_PAGES_URL`を使用し、noindexと共有/スター無効を適用する。
- CI成功は本番へのマージ前の条件とする。previewの公開やマージ後のpush CIを待たせる構成ではない。
- Secret `CLOUDFLARE_API_TOKEN`はこの方式では使わない。既存登録の値を取得せず、削除や失効もしていない。配信用変数は未登録のまま。

設定証拠は[t034](t034/)、実CIの全240件成功と同一SHAのpreview成功は[t038](t038/)を参照する。記事執筆時は作業ブランチをpushしてpreviewを確認し、PRの`shsh-check`が成功してからmasterへマージする。masterが進んだ場合は更新して再検査する。

以下のT017〜T033の記述は当時の調査・準備履歴。T030のActions配信案と有効化手順はF018/F019により不採用となり、実行しない。

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

[設定のAX抜粋と観察](t029/settings-observation.json)。秘密値は取得・保存していない。Hugo版・ルート・出力は期待どおり。コマンドにpreview環境/baseURL指定がないため、現状ではpreviewの出力規則を満たさない。なお`hugo.yml`には既に`minifyOutput: true`があり、`--minify`がないことだけでは非圧縮とは判定できない。T030では配信用スクリプトに環境・baseURL・minifyを明示した。

GitHub APIではmasterのbranch protectionは404 `Branch not protected`、実効rulesetは空配列だった（[結果](t029/github-ci-gates.json)）。ローカルの`shsh` workflowは検査を実行するが、Cloudflareの自動配信との依存関係を定義していない。Cloudflareは[Gitへのpushを契機に自動配信する](https://developers.cloudflare.com/pages/configuration/git-integration/)ため、現在の構成だけでは「GitHub検査合格後に配信」を保証できない（F018）。

T030で、検査成功後にGitHub Actionsから既存プロジェクトへアップロードする経路を準備した。Cloudflare側の独立した自動配信はまだ停止しておらず、認証設定・新規配信も未実施。F018は実際の経路を検証するまで未解決とする。既存の成功deploymentをshsh移行後の合格に流用しない。

## CI成功後の配信準備（T030）

[workflow](../../../../.github/workflows/shsh.yml)の`deploy`は`needs: check`で同一コミットの検査成功に依存する。自リポジトリのブランチへのpushまたは手動実行だけが対象で、PR・タグ・fork先・検査失敗時は配信しない。Repository variable `SHSH_PAGES_DEPLOY=enabled`がない間も配信しない。アップロード直前にリモートブランチの最新SHAと照合し、古くなった実行は失敗させる。トークンはアップロードstepだけへ渡し、GitHub権限は`contents: read`とする。

[build-pages.sh](../../scripts/build-pages.sh)はHugoだけで生成する。masterはproductionと`https://shimoju.jp/`、他のブランチはpreviewと`https://preview-<40桁SHA>.shimoju.pages.dev/`を指定する。アップロード先のPagesブランチにも`preview-<SHA>`を使い、生成前から決まる[ブランチalias](https://developers.cloudflare.com/pages/configuration/preview-deployments/#preview-aliases)をcanonical・OGP・RSSに揃える。Cloudflareが別途発行するランダムなdeployment URLとaliasの対応は実配信時に確認する。出力は`.cache/pages/public`、環境・URL・SHAは`target.txt`とActions artifactへ保存する。

Wranglerはアップロード専用の開発依存として4.131.2に固定した。端末のpnpm最低公開経過時間の制約により4.134.0は導入できなかったため、制約を維持して公開日2026-09-14の4.131.2を選んだ。必要なネイティブ依存のインストール処理は`pnpm-workspace.yaml`でesbuild@0.28.1とworkerd@1.20260911.1だけを許可し、未確認のビルド処理を一律許可しない。サイトのHugo生成にNode.jsは不要。

本番/previewとも170 HTML・48 RSSの生成物を検査し、canonical/OGP/RSSのURL、robots、共有4サービスとスターの環境差、fingerprint・source map不出力、既存_headers/_redirectsの維持を確認した。Hugo警告・エラーなし。引数不正5条件は生成前に拒否。証拠と再現用監査は[t030](t030/)に保存した。ローカルの成功であり、GitHub上の実行・Cloudflareの配信結果はまだ未確認。

### 有効化の手順

既存のGit連携プロジェクトでも、自動配信を停止してWranglerからアップロードできる。プロジェクトの作り直しやドメイン移行は不要。[公式手順](https://developers.cloudflare.com/pages/configuration/git-integration/)

1. R002全画面レビューの判断を記録する。
2. Cloudflareの`shimoju` → Settings → Builds & deploymentsで、Production branchの自動配信を無効にし、Preview branchの自動配信をNoneへ変更する。最初のpushより前に両方の停止を確認する。有効化変数だけではCloudflare側の独立した配信は停止しない。
3. ユーザーがCloudflareでAPIトークンを作成する。権限は`Account / Cloudflare Pages / Edit`、対象アカウントは`c0c39e237ef194406cb2ba4680f5d5da`に限定する。この権限はアカウント内のPages編集権限となる。作成した値をGitHubの[Repository Actions secrets](https://github.com/shimoju/shimoju.jp/settings/secrets/actions)へ`CLOUDFLARE_API_TOKEN`という名前で登録する。値を会話・ファイル・ログへ渡さない。[認証の公式手順](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/)
4. GitHub Repository Actions variablesへ`SHSH_PAGES_DEPLOY=enabled`を登録する。上記のCloudflare自動配信停止を確認してから有効にする。
5. 対象コミットを作業ブランチへpushし、同じSHAのcheck成功→deploy成功、target.txt、Pages deployment/aliasを確認する。失敗した場合は新しい公開を進めず原因を修正する。
6. 下記のpreview配信・実機確認を完了させる。本番への反映はmasterへの統合時に同じcheck→deploy経路で行い、実際の本番応答も検証する。

配信の停止には`SHSH_PAGES_DEPLOY`を削除する。既存公開の切り戻しが必要なら、テーマ名だけではなく移行前の配信成果物を復元する。Cloudflareの自動配信を戻す場合はCIとの依存が再び失われるため、検査成功の保証を確認する。

## 移行後の確認手順（現行方式）

この節はF018/F019で採用した方式に従う。上記T030の履歴にある自動配信停止・Actions deployの手順は実行しない。

1. R002は承認済み。作業ブランチの対象コミットを確定し、GitHubの`shsh-check`の成功結果URLを記録する。
2. GitHub masterでPR・GitHub Actions由来の`shsh-check`・最新ベース・管理者適用を要求し、Pagesは本番masterと非本番ブランチpreviewの自動配信を維持する。previewはCI完了を待たない。
3. PagesのビルドログでHugo 0.166.0と`build-pages.sh`の環境・baseURL、出力`public`を確認する。Hugoによるサイト生成はPages内で行う。GitHub Actionsで生成する検査用fixtureをアップロードする構成ではない。
4. 対象コミット・deployment ID・URL・ビルド時刻を照合し、外部shortcode取得の警告と入力エラーを区別する。本番へのマージは必要な移行確認と必須CI成功後に行い、マージ後にPagesの実本番応答を検証する。
5. previewのホーム・記事・About・一覧2ページ目で、HTTPのnoindex、HTMLのnoindex、preview自身のcanonical/OGP/RSS、共有無効・スターなしを確認する。存在しないURLの404とfeed.xmlの301も確認する。
6. 本番で公開URL・RSS GUID・canonicalを照合し、共有先とスターの対象が公開URLであること、外部4サービスが表示されることを確認する。投稿確定やスター追加は行わない。
7. 両環境で配信CSS/JSのURLにfingerprintがあり、minifyされ、source map参照も`.map`配信もないことを確認する。各レスポンスと対象ファイルのハッシュを保存する。
8. HTTPS previewの同一コミットで[実機確認](real-devices.md)を依頼し、結果を記録する。本番公開後も404・RSS転送・noindexの適用先を再確認する。

既存`static/_headers`・`static/_redirects`は維持する。Cloudflareはpreviewにnoindexヘッダーを付けるが、共有・スターやHugoのbaseURLを変更する仕組みではない。[preview仕様](https://developers.cloudflare.com/pages/configuration/preview-deployments/)、[Hugo設定](https://developers.cloudflare.com/pages/framework-guides/deploy-a-hugo-site/)、[CF_PAGES_URL等のビルド変数](https://developers.cloudflare.com/pages/configuration/build-configuration/)を2026-09-18に参照した。
