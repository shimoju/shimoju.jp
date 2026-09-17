# 2. PaperModと現サイトの調査

調査対象はPaperMod [`d3768854d00ad003b0a8dbdba254ce9224377a01`][pm-root]。初回調査時のHugoはv0.165.0 Extended。以下は対象ソースとサイト設定で確認した挙動であり、PaperMod全バージョンに共通する仕様とは限らない。Hugo本体とテーマの責務分担は[資料1](01-hugo-theme-structure.md#hugo本体とテーマの責務)を参照。

## 現サイトの設定とテーマ機能

| 項目 | 確認した設定・挙動 |
| --- | --- |
| 記事URL | postsのパーマリンク設定は`/:year/:month/:day/:slugorcontentbasename/`。記事の物理パスは`content/posts/YYYY/MM/DD/<slug>/index.md` |
| 日本語・要約 | `hasCJKLanguage: true`、`summaryLength: 140` |
| 日付・著者 | `post_meta.html`は`.Date`を表示し、日付書式はサイト設定の`2006/01/02`。更新日を別表示する処理はない。著者・読了時間・語数はそれぞれの表示条件に従う |
| Home-Info | `homeInfoParams`にタイトル・紹介文を持つ。ホーム初ページの紹介とSNSリンクをテーマが出力する |
| 一覧・ページ送り | 共通の`list.html`が記事一覧とPaginatorを出力する。`hiddenInHomeList`等の条件がある |
| Archives | 独自layout。年のグループ化はPublishDate、月はDateを使う |
| 前後記事 | `mainSections`に属する通常ページの集合から前後を取得。左の「前へ」に`$pages.Next`、右の「次へ」に`$pages.Prev`を使う。関連記事推薦とは別の処理 |
| コード | サイト設定は`catppuccin-mocha`。`noClasses`は未指定で、調査時の実効値は`true`。コピーはテーマのブラウザ用JSが追加する |
| 共有 | サイト設定はX・Facebook・はてなブックマーク・はてなスター。共有partialはサイト側で上書きされている |
| ビルド・配信 | `minify.minifyOutput: true`、`enableRobotsTXT: true`。pages.dev向けnoindexヘッダーはサイト側の配信設定 |

根拠：[サイト設定](../hugo.yml)、[一覧][pm-list]、[日付等のメタ情報][pm-meta]、[Home-Info][pm-home-info]、[Archives][pm-archives]、[前後記事][pm-nav]、[footerのJS][pm-footer]。

## コンテンツとサイト独自の上書き

- 記事では`video`・`x`・`youtube` shortcodeを使用している。`video`はPaperMod提供、`x`と`youtube`はHugo内蔵。[同梱shortcode][pm-shortcodes]
- Instagram・Speaker Deck等の生HTML埋め込みがある。サイト設定の`markup.goldmark.renderer.unsafe: true`で生HTMLを許可している。[サイト設定](../hugo.yml)
- [share_icons.html](../layouts/_partials/share_icons.html)に、はてなブックマークとはてなスターを追加している。Xにはタグから作ったハッシュタグを渡し、はてなブックマークは投稿パネルへのリンク、スターは公開URL・タイトルを渡す公式ウィジェットとなっている。
- [サイト側partials](../layouts/_partials/)と[上書きCSS](../assets/css/extended/override.css)には、テーマ本体とは別の変更がある。
- [static/_headers](../static/_headers)のpages.dev向けnoindexは、PaperModではなく配信環境が解釈する設定である。
- PaperModはMITライセンスで、ソースのコピー・改変に関する著作権・許諾表示の条件は、画面上のフッタークレジットとは別である。[LICENSE][pm-license]

## RSSの出力

PaperModは独自の`layouts/rss.xml`を持つ。生成するページ種別はHugoの出力設定に従い、XMLの内容はこのテンプレートが決める。[RSS][pm-rss]

| 項目 | テンプレートの挙動 |
| --- | --- |
| 対象ページ | ホーム・セクションはRegularPages、それ以外はPagesを参照する |
| 除外条件 | `hiddenInRss`がtrueのページを除き、item出力時にsearch／archivesレイアウトを除く |
| 件数 | `services.rss.limit`が1以上なら制限する |
| 本文 | Descriptionがあれば優先し、なければSummaryを使う。`ShowFullTextinRSS`が有効なら本文も出力する |
| 日付 | itemのpubDateはPublishDate。channelのlastBuildDateは対象集合のLastmodを参照する |
| 自動検出 | headがAlternativeOutputFormatsに対応するlinkを出力する |

現サイトは要約形式・件数制限なしで、ホーム・posts・タグ／カテゴリ一覧・個別タグ／カテゴリのフィードが生成される。RSSの公開URLは各出力の`index.xml`で、`/feed.xml`は配信側の[リダイレクト設定](../static/_redirects)から`/index.xml`へ転送される。

## SEOと公開条件

| 項目 | 確認した挙動 |
| --- | --- |
| title | ホームはsite.Title、それ以外はページタイトルとsite.Title |
| description | Description、Summary、サイト説明等を条件で選択 |
| canonical | ページの`canonicalURL`があれば使用し、それ以外はPermalink |
| robots meta | productionまたは`params.env: production`、かつrobotsNoIndexでなければindex/follow。それ以外はnoindex/nofollow |
| OGP | pageならarticle、それ以外はwebsite。日付・タグ・画像のfallback等を出力 |
| Twitter Cards | 画像があればsummary_large_image、なければsummary |
| 構造化データ | ホームはOrganization（Personも設定可）、page／sectionにBreadcrumbList、pageにBlogPosting |
| 言語 | htmlのlang／dir、翻訳へのhreflangを出力 |
| sitemap | テーマに上書きはなく、Hugo内蔵テンプレートが生成 |
| robots.txt | 有効化時、本番はクロール許可、非本番はDisallow: /。sitemap URLも出力 |
| 所有権検証 | Google・Yandex・Bing・Naver向けmetaの設定がある |
| Google Analytics | production条件でHugoのpartialを呼ぶ。現サイトはサービス未設定 |

根拠：[head][pm-head]、[OGP][pm-og]、[Twitter Cards][pm-twitter]、[schema_json][pm-schema]、[robots][pm-robots]。

### 出力ごとの違いと限界

- OGP・Twitter Cards・JSON-LD・Analyticsはproduction条件で呼ばれる。`hugo server`とproductionビルドでは、出力される情報が異なる。
- JSON-LDは`.IsPage`を条件にBlogPostingを出すため、現サイトではAboutとArchivesにもこの型が付く。
- `canonicalURL`はcanonicalタグで使うが、OGPの`og:url`やJSON-LDの`mainEntityOfPage`等は`.Permalink`を使う。canonicalの上書きがすべてのURLへ反映されるわけではない。
- 画面上のカバーはResourceを探索する一方、SEO画像のURL分岐には`cover.relative`があり、表示画像とメタ情報ではURLの解決経路が異なる。
- JSON-LDの`articleBody`にも本文を含むため、本文情報はHTML内に重複して存在する。
- 構造化パンくずは親URLを分解してPageを探す。公開URLとコンテンツ階層が異なるサイトでは、その対応関係が項目の生成に影響する。
- `searchHidden`・`hiddenInHomeList`・`hiddenInRss`・`robotsNoIndex`は別の場所で解釈される。検索索引・ホーム一覧・RSS・robots metaの制御であり、ページ全体を非公開にする統一スイッチではない。[検索索引][pm-search-index]、[一覧][pm-list]、[RSS][pm-rss]、[head][pm-head]

## 画像・アセット処理

| 対象 | 確認した処理 |
| --- | --- |
| カバー画像 | 本番・処理可能なローカルResource・responsiveImages有効等の条件で、複数幅とsrcset・寸法を生成。詳細はeager、一覧はlazy |
| Markdown本文画像 | render hookでURLを解決し、lazyを指定。リサイズ・srcset・寸法の自動取得は行わない |
| figure shortcode | PaperMod版でlazy、明示された寸法、キャプション等を出力。自動リサイズは行わない |
| 生HTML画像・埋め込み | Markdown画像hookを経由せず、本文内のHTMLとして出力 |
| CSS | Hugo Pipesで取得・結合・minify・fingerprint。クラス方式のハイライトCSSもバンドル |
| JS | テーマ同梱のJSとテンプレート内の処理を使用。通常のテーマビルドにNode.jsやwebpackは要求しない |

根拠：[カバー][pm-cover]、[画像hook][pm-image]、[figure][pm-figure]、[head][pm-head]、[footer][pm-footer]。

minifyは未使用CSSの自動除去ではない。また、`rel="preload stylesheet"`はCSSの適用を伴い、非同期CSS化やrender-blockingの解消を意味しない。ビルド時の加工、ブラウザへの取得指示、HTTP圧縮・キャッシュの違いは[資料1](01-hugo-theme-structure.md#混同しやすい境界)に整理している。

性能に影響する要因には、一覧先頭カバーへのlazy指定、JSON-LDの本文重複、HTML内のSVG、外部埋め込みやスターの通信・実行処理がある。ソース上の機能の有無と、実際のLCP・CLS・操作応答性の測定結果は別である。

[pm-root]: https://github.com/adityatelange/hugo-PaperMod/tree/d3768854d00ad003b0a8dbdba254ce9224377a01
[pm-list]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/list.html
[pm-meta]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/post_meta.html
[pm-home-info]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/home_info.html
[pm-archives]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/archives.html
[pm-head]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/head.html
[pm-cover]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/cover.html
[pm-nav]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/post_nav_links.html
[pm-rss]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/rss.xml
[pm-shortcodes]: https://github.com/adityatelange/hugo-PaperMod/tree/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_shortcodes
[pm-og]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/templates/opengraph.html
[pm-twitter]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/templates/twitter_cards.html
[pm-schema]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/templates/schema_json.html
[pm-robots]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/robots.txt
[pm-image]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_markup/render-image.html
[pm-figure]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_shortcodes/figure.html
[pm-footer]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/footer.html
[pm-search-index]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/index.json
[pm-license]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/LICENSE
