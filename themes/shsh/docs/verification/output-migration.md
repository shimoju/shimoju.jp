# T013: 全公開出力の照合とCI

旧テーマの固定基準`c266ebb`に対し、170 HTML（記事・固定ページ・一覧・分類・ページ送り・alias・404）と48 RSSのURL集合を照合する。通常の本番／preview隔離生成を用い、外部埋め込みはT012の固定shortcodeに置換する。実サービス接続は[T012](site-input-migration.md)の別工程を参照。

`tests/migration.spec.ts`は全59記事・Aboutの本文テキスト、本文見出しの階層とID、本文リンクの順序、画像／動画の順序・原URL・altを旧基準と比較する。本文では空白を正規化し、旧見出しの補助`#`と新コードラベル／コピーボタンを除く。コード内容は元Markdownの全64 fenceと別途空白を含めて比較する。閉じfence直前の終端改行1つだけを区別する。Instagramの旧埋め込み内テキスト・リンクは記録した旧HTMLの範囲だけを除き、置換後のID/URL/位置はT012の全46件検査で担保する。検査用YouTubeリンクも本文照合から分離する。

原ファイルはT012で80件を検査済み。公開された元素材のSHA-256も一致させる。全HTMLの内部href/src/srcsetとfragment、画像の寸法・alt・sizes、canonical/OGP/説明文・構造化データ・日付、previewのnoindex/共有/スターを検査する。配信画像は各ブラウザで142 URLをデコードし、候補の幅と元画像の縦横寸法を照合する。sitemapの全61入力のURLとリンク先、本番robotsのsitemap URLとpreviewのDisallow: /も検査する。

RSSは旧GUID/link集合を維持する。Q8/Q19に従いホームRSSだけAbout/Archivesを共通記事集合から除外する。分類一覧RSSは分類ページを維持。記事の`.Date`・順序、自己参照、自動検出linkと一覧／RSSの共通要約を確認する。要約内の`<ul><li><ul>`のようなコードはXMLテキストとして保持し、タグらしい文字列を一律に禁止しない。日本語URLはパーセントエンコードの表現を正規化して比較する。

## HTML構造検査と初回の修正

`check:site-output`は本番とpreviewの340ファイルをHTML-validateで検査する。初回はソース向けの引用符・文字参照の書式既定値を圧縮HTMLにも適用し、全ファイルを不合格にした。大量のassert差分の生成も終了137となったため、以後は件数と先頭3件だけを表示する。[初回記録](t013/initial-html-validation.json)は履歴として保持。

圧縮HTMLにはHTML5で合法な非引用属性と曖昧でないampersandを許可する公式オプションを適用した。ソース・非圧縮fixtureの検査設定は変更しない。構文・構造検査は有効なままで、不正属性とalt欠落の負例も検出する。[attr-quotes](https://html-validate.org/rules/attr-quotes.html)・[no-raw-characters](https://html-validate.org/rules/no-raw-characters.html)。この適用範囲はF017に記録した。

長いtitleのSEO目安はF015の方針を全記事へ適用し、既存の開発環境記事とHeroku Redis記事の正確な2タイトルに限定する。タイトル短縮・axe例外の追加は行わない。

## CIと再現

```sh
cd themes/shsh
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps chromium firefox webkit
pnpm check
```

`.github/workflows/shsh.yml`はUbuntu 24.04、Hugo 0.166.0、テーマの`.node-version`（24.21.0）と`packageManager`（pnpm 12.4.1）、固定lockfileを使う。型付きlintは型検査も同時実行し、CSS lint、整形、進捗、全fixture、全サイト出力、3エンジンの操作／axe／移行照合を順に実行する。既存基準設定を`git show`で読むため履歴を取得する。PaperMod submoduleの生成は通常CIに含めない。

Actionは公式公開タグから実コミットへ解決してSHA固定した。参照: [checkout](https://github.com/actions/checkout/releases/tag/v7.0.1)、[setup-node](https://github.com/actions/setup-node/releases/tag/v7.0.0)、[pnpm/action-setup](https://github.com/pnpm/action-setup)、[Hugo setup](https://github.com/peaceiris/actions-hugo)、[artifact upload](https://github.com/actions/upload-artifact)。失敗時もログ・時間・移行照合JSON・Playwright報告／traceを14日間保存する。サイトの生成処理は引き続きHugoだけで完結する。

ローカルではfrozen-lockfileの照合と[actionlint 1.7.12](t013/actionlint.log)のworkflow検査を実施した。GitHub上のworkflow実行は未実施であり、ローカル検査の結果とは区別する。About空thのF014、人の全画面レビューR002、実機・性能・Cloudflare配信は残件。

## 実施結果と残件

[統合検査](t013-check.log)は静的検査を通過し、240件中234件成功（2.4分）。About空th 3件と、preview robotsへ本番sitemapを期待した3件が不合格だった。後者を修正し、追加したコード検査のfence終端改行の扱いも[初回記録](t013-migration-recheck.log)から訂正した。[最終の移行照合6件](t013-migration-final.log)は3エンジンで成功（3.7秒）。有効な統合結果は237/240で、残る不合格はF014のAboutだけ。これを例外化していない。

[各環境・ブラウザのJSON](t013/)に本文差分0件・未解決の移行照合0件を保存した。内部参照は本番2771／preview2710、fragment216、img37を各エンジンで検査し、本番の142配信画像をデコードした。凍結モック68ファイルはSHA-256不変。
