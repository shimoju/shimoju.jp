# T012: サイト設定と埋め込み入力の移行

`hugo.yml`をshshの設定へ移し、従来の紹介文をそのまま`content/_index.md`へ移した。Asia/Tokyo、10件のページ送り、RSS、robots.txt、共有4サービスとプロフィール3サービスを明示した。サイト生成はHugoのみで、`bin/build`は追加の引数をHugoへ渡す。

生HTMLのInstagram 3件・Speaker Deck 2件をshortcode化し、既存video 1件に実寸1440×1076とタイトルを与えた。unsafe=falseと単独画像のfigure化を明示。X 35件・YouTube 5件の入力は変更していない。InstagramのHTML内にあった代替キャプションは組込shortcodeの公式埋め込みに置き換わる。独自の代替表示は追加せず、Q11/Q33に従う。旧HTML・新入力・SHA-256は[対応表](t012/input-migration.json)に保存した。

基準の80ファイル（61 Markdownと素材）のうち74はバイト一致、6つは正確な埋め込み置換だけを許可した。新しい紹介を含めMarkdownは62件、埋め込みは46件。動画バイトと既存の`static/_headers`・`_redirects`も一致する。[動画実寸](t012/video-probe.json)はffprobeで取得した。以前のmedia fixtureの仮寸法はF016として追跡し、T024で独立して是正する。凍結モックは変更していない。

## 通常検査

テーマディレクトリで以下を実行する。固定のX・Instagram・YouTube shortcodeは隔離したソースだけに置き、本番のthemeやroot layoutsへ置かない。外部読み込みはブラウザでも固定応答にする。

```sh
pnpm build:site-fixture
pnpm check:site-inputs
pnpm build:review
pnpm exec playwright test tests/site.spec.ts tests/review.spec.ts --workers 3
```

本番／previewのHugo生成は警告をエラーとして成功。3エンジンで全46埋め込みの順序・ID/URLと共有／スター／canonical、ホーム10件・Archives59件、実動画の読込前後の縦横比を検査した。代表モック比較も含め[21件成功](t012-browser.log)（24.3秒）。動画の読み込み前後の高さ差は0.06px未満。既存のAbout空見出し（F014）は本文を保持したまま未解決であり、T010のaxe不合格をこの結果で上書きしない。

## 本番同等の外部接続

```sh
node scripts/build-site-fixture.ts --live
node scripts/verify-live-embeds.ts
```

実際のrootソースと組込shortcodeをHugoで生成した。本番5.248秒、preview0.126秒で警告・入力エラーとも0件。previewは同じ外部取得キャッシュを使用。生成結果は[t012](t012/)の各build JSONと[ビルドログ](t012-live-build.log)を参照。

4サービス各1記事を本番／previewの計8条件でChromium 153・390×844・新しいブラウザコンテキストで開いた。外部iframeと本文、HTTP応答、画像を[実接続記録](t012-live/results.json)へ保存した。初回X検出セレクターの誤りは`initial-results.json`へ残し、実際の埋め込みURLを対象に修正した。iframeの表示位置へスクロールし、埋め込み単体の画像も保存する。プレビューの本文埋め込みは維持し、共有リンク・スターは0件。投稿・スター追加・動画再生は行っていない。

これは代表サービスの接続時点の確認であり、全外部投稿の将来の可用性、再生可否、実機Safari、Cloudflare配信の確認を意味しない。全公開出力とRSSの照合はT013、全画面の人のレビューはR002、実機・性能・配信はT015〜T017に残る。
