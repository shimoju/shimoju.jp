# T011: RSSとメタ情報

## 実装と共有箇所

`list-pages.html`はT005の`posts.html`を基に、ホーム・section・個別分類の記事を同じ順序で返す。分類一覧だけは`.Pages.ByTitle`を返し、分類ページを配信する既存RSSの役割を維持する。`rss.xml`は件数で切り詰めず、要約は一覧と同じ`summary.html`、公開日は`.Date`、GUIDは`.Permalink`を使用する。空の日付は出さない。

`public-url.html`は同じ集合で初期化したpagerのURLをHTMLのcanonicalとOGPへ渡す。共有・スター・記事RSSの`.Permalink`と同じbaseURLを使い、previewにも独自の本番ドメインへの差し替えを入れない。Hugoは最初のpagination呼び出しを保持するため、headと一覧で異なる集合を渡さない。[Hugoのpagination仕様](https://gohugo.io/templates/pagination/)

`metadata.html`はtitle・description・canonical・OGP・Twitter CardsとJSON-LDを生成する。description優先、未指定時は共通要約。記事はBlogPosting、通常固定ページはWebPage、ホームはWebSiteとPerson。公開・更新日は`.Date`／`.Lastmod`を使い、showDatesによる画面上の非表示とは分離する。JSON-LDは辞書からJSONへ変換し、本文全体やパンくずを複製しない。

`share-image.html`はcover、defaultShareImage、画像なしの順とし、本文画像を流用しない。既存の`media/resolve.html`を使い、サイト既定画像はglobal指定でpage bundleを探索対象から外す。assets／static／外部を区別し、絶対URLを出す。外部画像は取得しない。

RSSの自動検出linkとフッターのホーム購読先を維持する。sitemapはHugo標準生成、robots.txtはテーマテンプレートで本番のsitemapとpreviewのDisallowを出力する。**サイト側の`enableRobotsTXT: true`はT012で適用する。** RSSの既定出力種別については[HugoのRSS仕様](https://gohugo.io/templates/rss/)を参照した。`/feed.xml`の既存リダイレクトと公開サイト全件のGUID照合は移行工程で検査する。

## 検証

macOS27.0 arm64、Hugo0.166.0、Node24.21.0、pnpm12.4.1、Playwright1.63.0のChromium153／Firefox155／WebKit26.6。

- [fixture生成と入力検査](../../scripts/verify-metadata.ts): 別著者・別ドメイン・baseURLサブパス、13記事、通常固定ページ、日付なし、空分類、記号入り分類、公開条件を用意。assets／static／外部／protocol-relative画像とpreviewも別生成。全HTMLを検証する。参照切れ・bundle内だけの既定画像・明らかな型違いはエラーになる。
- [ブラウザ検査](../../tests/metadata.spec.ts): 18件成功。標準DOMParserで全XMLをパースし、記事集合・件数・順序・要約・分類フィード・GUID・日付・空feedを照合。各ページとページ送りのcanonical、RSS自動検出・購読先、JSON-LDの型と値、画像優先順、previewのURLとnoindexを確認する。タイトルの`</script>`・引用符・記号も文字列として維持する。
- `pnpm check`で整形・統合lint・CSS・進捗・Hugo生成・HTML・全ブラウザ回帰が成功。**102件成功、39.8秒**。[ログ](t011-check.log)
- 既存の一覧検査の「SEO説明は一覧本文へ混ざらない」はbodyに範囲を限定した。headに正当に出力するdescriptionを禁止しないための変更で、一覧要約の期待値は維持している。

## 検出・是正した点と制約

初回にfixtureの要約の生HTMLと、リダイレクト文書の長いURLタイトルを検出した。要約fixtureは対応するMarkdownにし、aliasのtitleは`Redirect — サイト名`とした。続く初回ブラウザ検査は9成功／9失敗で、XMLの二重エスケープ・formatterによるmeta content値の改行・分類fixtureの内部名と公開slugの取り違えを検出した。XMLはHugoの自動エスケープへ揃え、meta値は属性へ挿入する前に計算し、分類入力の配置を修正した。再検証は18件すべて成功した。

RSS XMLとrobots.txtは既存formatterの対象外。Go HTML formatterをRSSへ適用する試行では`invalid node root`となるため、無理にHTMLとして整形せず、生成XMLの構文と値を3ブラウザで検証している。

このタスクは代表画面承認に依存しない非視覚部分。R001の画像提出物はT009時点のものを維持し、T011後も同じ表示比較が通った。R001はユーザー判断待ち、T011の全画面レビューはR002で扱う。全59記事の移行照合・実機・Cloudflare Pages検証は未実施で、本番PaperModと凍結モックは変更していない。
