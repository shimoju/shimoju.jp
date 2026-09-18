# 必須CIと独立プレビューの実行確認（T035）

対象：18a9ab1c1928e12409ac0381f8063e0b4b6d13fd（T034）。R002承認済みのテーマ・移行入力を含む作業ブランチhugo-themeをpushした。本番masterはfb3a9bb0b0a943afb5e666520f82be7414c2fd75のまま、マージは実施していない。

## GitHubの本番保護

T034でmasterにPR必須、最新ベース必須、GitHub Actions App 15368由来の`shsh-check`必須を設定し、管理者にも適用した。force pushとブランチ削除は不可。承認レビュー人数は0。保護のAPI応答は[t034](../t034/branch-protection-verified.json)を参照する。

## Cloudflare Pages

[deployment](https://dash.cloudflare.com/c0c39e237ef194406cb2ba4680f5d5da/pages/view/shimoju/2f9d9a6b-5b9d-4caa-833a-f5f92c856916)は49秒で成功し、[preview](https://2f9d9a6b.shimoju.pages.dev/)を公開した。Git連携のpushが起点で、CI結果への依存はない。`checks-after-preview.json`にはCloudflare成功・Actions実行中が同時に記録されている。

PagesのビルドログでHugo0.166.0、preview環境、deployment固有のbaseURL、370アセット公開、redirect/header各1ルールを確認した。`cloudflare-deployment.json`にdashboard観察を記録。Hugo生成にNode.jsは使用しない。公開中の本番は変更していない。

`verify-preview.py`で実URLの7 HTML・4 RSSを読み取り、canonical/OGP、HTMLとHTTPのnoindex、記事・Aboutの共有4ボタン無効とスター不出力を検証した。feed.xmlの301、存在しないパスのHTTP404、robotsのクロール抑止、3 CSS/JSのHTTP200とSHA-256 fingerprint一致・source map参照なしも成功。結果は`preview-http.json`。

Chromeでホーム表示、ダーク→ライト切替、Aboutへの遷移後の配色維持、業務経験表の3見出し、共有無効を確認した（`browser-observation.json`）。この限定操作確認で全実機・実フォントの確認完了とはしない。

## GitHub Actions

[run 35316825816](https://github.com/shimoju/shimoju.jp/actions/runs/35316825816)の`shsh-check`が本番保護で指定したApp/nameと一致する。初回は239件成功・1件失敗。Linux Chromiumの縦スクロールバー15px分を除いた表示領域と、設定した画面幅を直接比較していたことが原因（F020）。`scrollWidth === clientWidth`へ修正し、横はみ出し検査を維持する。サイト表示と凍結モックは変更していない。修正コミットで全CIを再実行する。

Pagesの最終ビルドコマンドは`if [ -f themes/shsh/scripts/build-pages.sh ]; then sh themes/shsh/scripts/build-pages.sh; else hugo; fi`。新スクリプトがない移行前master等の再ビルドを壊さないための互換設定であり、新スクリプトの失敗時にhugoへ切り替えるものではない。
