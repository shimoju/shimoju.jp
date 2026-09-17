# 共通枠と配色の実装（T004）

`themes/shsh/` に共通枠と配色を実装した。ルートの本番設定はまだPaperModであり、現在は別サイト設定のfixtureで検査する。ホームの記事一覧・本文部品・メディア・共有はT005〜T008、代表画面の画像比較とユーザーレビューはT009で揃える。この成果だけでR001の承認済み・移行完了とはしない。

```sh
pnpm build:fixtures
pnpm check:theme
pnpm test
# 閲覧するときだけ実行
node scripts/serve-fixtures.mjs
```

fixtureはlocalhostの4174（production）・4175（preview）・4176（development）、凍結モックは4177で配信する。テーマの生成は `scripts/build-fixtures.ts` が呼ぶHugoだけで完結し、Nodeは検査fixtureの準備にのみ使用する。別の最小設定でもテーマを直接Hugo生成している。

## 共通設計と対応するソース

| 責務           | ソース                                                                              | 判断                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 尺度・役割     | `assets/css/tokens.css`                                                             | 本文スケールとUIグリッドを分離し、同値でもheading/label等の行高は別トークン。色は各役割のライト/ダークの組として定義 |
| 基本組版       | `assets/css/base.css`                                                               | 和欧文書体・palt・見出し階層・リンク下線・フォーカス。将来の一覧等のリンク内タイトルも `.link-title` に共有          |
| 共通枠         | `assets/css/layout.css`                                                             | 720px幅・ガター・ヘッダー/ナビ/フッターの配置。コピー等の位置は扱わない                                              |
| アイコン操作   | `assets/css/controls.css`                                                           | `.icon-control` の小操作領域と `.icon-link` の大操作領域。描画サイズと操作領域を分離                                 |
| 配色           | `assets/ts/theme.ts`                                                                | head内でCSSより先に選択を適用し、保存・OS追従・ボタンを同じ状態で制御                                                |
| サイト枠       | `layouts/baseof.html` と `_partials/header.html` / `footer.html` / `site-name.html` | サイト名のリンク生成は一か所。ホームのh1ラッパーだけ分岐。ナビ・著者・プロフィール・RSSは設定から生成                |
| 設定・アイコン | `_partials/config.html` / `icon.html` と `assets/icons/`                            | 既定値・明らかな型違い・未知アイコン・内部参照切れを共通処理。アイコンは凍結モックの図形を維持                       |
| 配信アセット   | `_partials/assets.html`                                                             | css.Build/js.Build、公式Chroma生成、開発時だけsource map、本番/previewはminifyとfingerprint                          |

ソースパスはすべて `themes/shsh/` 相対。`home.html` / `single.html` / `list.html` は共通枠を検査するための最小テンプレートであり、全画面への展開完了を表さない。fixtureのArchives等も遷移先の確認用本文である。

`light-dark()` と `color-scheme` で色トークンを選び、JavaScript無効時はOS配色に従う。明示選択は `pref-theme` を直接読み書きし、モック用URLパラメーターを解釈しない。保存が使えない場合も、そのページでの選択は保持する。JSが実行されるまでボタンをhiddenにして、動かない操作を表示しない。

[Hugo公式のChromaStylesとimportContext](https://gohugo.io/functions/css/chromastyles/)を使い、Latte/Mochaの宣言は変更せず、配色とJS無効時に対応するスコープだけを加える。CSS/TSの分割と配信ファイル数を分けており、現在の配信はCSS一つと初期配色JS一つである。

## 確認した範囲

- 設定が異なる最小サイトのHugo単独生成、入力型違い・未知アイコン・pageRef/内部URL切れのビルドエラー。
- production/preview/developmentの生成HTML、公開アセットのハッシュ/SRI、source mapの有無、previewのnoindex。
- 3エンジンで保存済み設定のCSS到着前適用、OS追従、キーボード選択、再読込、無効値・保存例外、モックパラメーターの無視。
- JS無効時の両配色、公式Chromaの背景、購読リンク。
- 1440px/390px・ライト/ダークで、共通枠の書体・サイズ・行高・余白・gap・色を凍結モックと比較。横はみ出しも検査。
- axeは全ページ要素を検査し、例外は `.chroma` 内に限定した `color-contrast` だけ。該当ノードはPlaywright添付へ記録し、他のルール・領域は除外しない。

WebKitのTab移動はmacOSの設定に依存する。検査は [Appleの標準操作](https://support.apple.com/en-ae/guide/safari/cpsh003/mac) に合わせてOption-Tabを使い、ボタンへのフォーカス移動とEnter実行を確認した。OSの設定自体は変更していない。

## 検出して直した差分

Stylelintの一般的なキーワード小文字化がCSS変数内の `BlinkMacSystemFont`・`Menlo`・`Consolas` にも適用された。特にChromiumの計算値で `BlinkMacSystemFont` の解釈が変わり、モックとの比較が失敗した。元の表記を復元し、`value-keyword-case` の対象から `--font-*` だけを外した。同じ比較を3エンジンで再実行して一致を確認した（F003）。見た目の変更として採用した差分ではない。

Hugo生成HTMLに残る空行のインデントは `no-trailing-whitespace` の対象外とした。HTMLの意味・構造・属性検査は維持し、ソース整形を生成HTML側へ重複させない。属性の条件分岐はタグをまたがない構造にし、Go template parserで整形可能にした。

モックからの仕様差分は、資料4で合意済みのpref-theme利用・モックパラメーター除外・JS無効時のOS配色と操作非表示・設定駆動の内容のみ。代表画面全体の視覚確認、実フォントの実機確認、実サービスや配信環境の確認は未実施。
