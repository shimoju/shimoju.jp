# T071: 本番移行と実配信の確認

PR [#5](https://github.com/shimoju/shimoju.jp/pull/5)を必須CI成功後、2026-09-18 15:13:18 UTCに通常のmerge commitで統合した。headは`7b55a99`、mergeは`a442780f8644ba32f88fb31b58dde192502c99d1`。5代表環境の証拠と制約は[T070](../t070/README.md)を参照。

## CIと配信

- [CI](ci-pr.json)は[run 35359642509](https://github.com/shimoju/shimoju.jp/actions/runs/35359642509)成功。[統合検査ログ](ci-check.log)は型付きlint・生成物・移行検査・3エンジン246テストの成功を含む。
- [マージ前PR](pr-before-merge.json)でhead/base、ready、必須チェック成功とCLEANを確認。[マージ記録](pr-merged.json)。管理者バイパスは使用していない。
- [旧本番の直接確認](pre-production.json)で`fb3a9bb` / deployment `a441e0fe-70b9-4495-b0a2-3289ffef7089`を切り戻し先として確定。[手順](../rollback.md)。切り戻し自体は実施していない。
- [本番デプロイ](production-deployment.json)は`a880fe98-4cac-4c20-a5c2-ad6b9e0cd77b`、上記mergeを51秒で配信。Hugo 0.166.0、environment=production、branch=master、baseURL=https://shimoju.jp/。ビルドログに警告・エラーなし。
- [preview HTTP](preview.json)は`24b23fc4` / head `7b55a99`。noindex・共有無効・スターなし・アセット一致・59件RSS・feed301・不存在404を確認。

## 本番HTTP

[結果](production-http.json)は全170 HTML（page/1エイリアス46を含む）、全48 RSS、テーマCSS/JS 4ファイル、feed301、不存在404で合格。RSS link/GUIDを旧基準と照合し、ホームRSSからAboutを除くQ8/Q19の変更のみを適用した。canonicalはQ20の各ページ自身のURL、page/1はHugo標準の一覧先頭へのエイリアスを確認。本番HTML/HTTPに意図しないnoindexなし。404実在ファイルと不存在ページの応答は区別する。

テーマCSS/JSのfingerprintは本文SHA-256と一致、source map参照なし・map URLは404。配色/コピーのJSとCSSは実機確認previewと同一バイト。本番のみのsharing JSは`.cache/site-live/production`のHugo本番生成物と一致した。生成実装・設定・記事・素材は実機確認版`268bbb0`以降変更なし。

[再現スクリプト](verify-production.py)は`python3 themes/shsh/docs/verification/t071/verify-production.py <production-SHA>`で実行する。sharing JS照合用に、同じソースで`node scripts/build-site-fixture.ts --live`の本番生成物が必要。HTTP応答は実行時点の本番を読み取り、SHAはPagesの配信記録と併せて特定する。

初回の検査実装に期待値の誤りがあったため、[初回結果](production-http-initial.json)と[page/1照合時](production-http-alias-check.json)も保持した。旧PaperModのページ送りcanonicalをそのまま要求したこと、実在`/404.html`にも404を要求したこと、Cloudflareが注入する`/cdn-cgi/.../email-decode.min.js`をテーマfingerprintの対象に含めたことを是正。続けてpage/1を標準エイリアスとして扱った。配信コードや要件は変更していない。

## 本番ブラウザ

Mac Chrome（T061の現行安定版確認から同一セッション）でCUAのAX・スクリーンショットを確認。[操作記録](production-browser.json)。ホーム本文/一覧/ナビ/RSS、Aboutと記事の共有先URL、スターの実読み込みと公開URL、Xカード、Instagram写真、YouTube映像/再生/一時停止、Speaker Deckの1→2枚目を確認した。画面取得で見えた結果とAXの状態を区別して記録。共有投稿・スター追加は実施していない。

T017の本番/preview確認は完了。PaperMod整理・仕様参照先の移行・撤去後の統合検査・最終監査はT018に続く。
