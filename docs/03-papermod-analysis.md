# 3. PaperModの機能・品質・性能

対象は[`d3768854d00ad003b0a8dbdba254ce9224377a01`][pm-root]（2026-08-02）。[README][pm-readme]・[機能Wiki](https://github.com/adityatelange/hugo-PaperMod/wiki/Features)・[変数Wiki](https://github.com/adityatelange/hugo-PaperMod/wiki/Variables)を入口とし、以下の挙動・有効化条件は固定リビジョンのソースを優先して確認した。Wikiの例や一般的な「PaperMod」の紹介と異なる場合がある。

Hugo本体との分担は[資料2](02-hugo-core-vs-theme.md)に反映済み。以下の「採用案」はこのサイト向けの提案であり、実装済み／採用決定を意味しない。

対象版の`theme.toml`は最低Hugoバージョンを`0.146.0`とし、`baseof.html`にもバージョンチェックがある。今回の検証環境はv0.165.0 Extendedで、将来のHugoまでの互換性を保証するものではない。[theme.toml][pm-theme]、[baseof][pm-base]

## 機能要件の棚卸し

設定名はソースやWikiに合わせて表記。実際のHugo設定ではキーの大小文字は正規化されるが、値の型、ページfront matterとサイト`params`の対応範囲は各テンプレートの条件に従う。

| 機能 | 実装・有効化条件 | 自作テーマへの採用案 | 根拠 |
| --- | --- | --- | --- |
| Regularホーム | 通常の記事一覧。紹介・profile未指定時は先頭記事の特別表示あり | Home-Info型と共通カードに整理 | [list][pm-list] |
| Home-Infoホーム | `homeInfoParams`。紹介とsocial iconsはホームの1ページ目のみ | 現サイトの構成として維持 | [list][pm-list]、[home_info][pm-home] |
| Profileホーム | `profileMode.enabled`。画像・紹介・ボタン中心 | 現在未使用。後回し | [profile][pm-profile] |
| 記事・固定ページ | `single.html`。タイトル、説明、本文、タグ、footer等 | 維持。Aboutと記事のメタ情報を分ける | [single][pm-single] |
| セクション・term一覧 | `.RegularPages`と`.Sections`、ホームではmainSectionsで絞る | 維持。対象範囲を明示 | [list][pm-list] |
| ページ送り | `.Paginate`、前後リンク、`ShowPageNums`でページ番号 | 維持 | [list][pm-list] |
| タグ・カテゴリ一覧 | 分類名と件数、名前順 | 維持 | [taxonomy][pm-taxonomy] |
| 年月アーカイブ | `layout: archives`。年はPublishDate、月はDateでグループ化。`ShowAllPagesInArchive`で対象拡張 | 維持。日付基準を統一するか検討 | [archives][pm-archives] |
| 404 | 共通枠と404表示 | 復帰導線を加えて採用 | [404][pm-404] |
| メニュー | `menu.main`、現在のURLの強調、横スクロール位置保存 | 維持。focusと小画面を検証 | [header][pm-header]、[footer][pm-footer] |
| light/dark/auto | `defaultTheme`、OS設定、localStorage、切替ボタン。`disableThemeToggle`で無効化 | 採用候補。初期描画のちらつきも検証 | [head][pm-head]、[footer][pm-footer] |
| 検索 | `layout: search`とhomeのJSON出力。Fuse.jsによるクライアント検索 | 現在未使用。記事数・日本語検索品質で採否判断 | [search][pm-search]、[index.json][pm-index]、[fastsearch][pm-fastsearch] |
| 日付・著者・読了時間・語数 | `dateFormat`、author、`ShowReadingTime`、`ShowWordCount`、`hideMeta`/`hideAuthor` | 日付・著者は維持。時間・語数は任意 | [post_meta][pm-meta]、[author][pm-author] |
| 複数著者 | ページ／サイトauthorの配列を表示可能 | データ構造を先に定義。現サイトは単独著者 | [author][pm-author] |
| 下書き表示 | `.Draft`なら印を表示 | 開発用に採用。公開可否自体はHugoのビルド設定 | [single][pm-single]、[list][pm-list] |
| カバー | `cover.image`、alt/caption、hidden/hiddenInList/hiddenInSingle、responsiveImages、linkFullImages | 採用し本文画像と処理統一 | [cover][pm-cover] |
| 目次 | `ShowToc`、`TocOpen`、`UseHugoToc`。detailsで開閉 | 必要な記事で採用。Hugo標準生成を基本案にする | [toc][pm-toc] |
| 見出しアンカー | 本文HTMLを書き換えてアンカーを追加。`disableAnchoredHeadings`で停止 | render-heading hookでの実装を検討 | [anchored_headings][pm-anchors] |
| パンくず | `ShowBreadCrumbs`で画面表示 | section階層が役立つ場合に採用 | [breadcrumbs][pm-breadcrumbs] |
| 編集リンク | `editPost.URL`、Text、appendFilePath等 | 個人ブログの一般読者には必須でない | [edit_post][pm-edit] |
| canonical元記事リンク | `canonicalURL`と`ShowCanonicalLink`で本文メタにもリンク | 転載する場合のみ。SEOタグとは分けて確認 | [post_canonical][pm-canonical] |
| 前後記事 | `ShowPostNavLinks`、mainSections内の前後記事 | 現サイト同様に採用 | [post_nav_links][pm-nav] |
| 共有リンク | サイト`ShowShareButtons`、`shareButtons`、ページ`disableShare` | 必要サービスだけ採用 | [single][pm-single]、[share_icons][pm-share] |
| SNSアイコン | `socialIcons`、同梱SVG | 現在のリンクを維持。追加SVGの保守方針を決める | [social_icons][pm-social] |
| コードコピー | `ShowCodeCopyButtons`。記事系pageにJS出力 | 採用し失敗処理・通知を改善 | [footer][pm-footer] |
| コメント | `comments`でpartial呼び出し。同梱partialは空 | 組み込みサービスはない。採用時に別実装 | [comments][pm-comments]、[single][pm-single] |
| 多言語・RTL | i18n、headerの言語切替、記事翻訳リンク、dir属性 | 現在は日本語のみ。拡張しやすいラベル分離は有用 | [header][pm-header]、[baseof][pm-base]、[translations][pm-translations] |
| スクロール補助 | ページ内smooth scroll、reduced motion分岐、上へ戻るリンク。`disableScrollToTop` | ブラウザー標準／CSSで足りる範囲を検討 | [footer][pm-footer] |
| RSS | 独自`rss.xml`、`hiddenInRss`、`ShowFullTextinRSS`、件数制限、RSSアイコン | 現在の購読URLを維持 | [rss][pm-rss]、[list][pm-list] |
| SEO・Analytics | canonical、OGP、Twitter Cards、JSON-LD、robots、verification、Google Analytics呼び出し | 後述の意味・条件を見直して採用 | [head][pm-head] |
| 拡張箇所 | extend_head/footer/post_content、comments、`css/extended/*.css`、partialの上書き | 小さく安定した拡張口を用意 | [head][pm-head]、[single][pm-single]、[footer][pm-footer] |
| `llms.txt` | 一覧用テンプレートを同梱。出力形式の設定が別途必要 | 現在未使用。必須要件にはしない | [llms][pm-llms] |

READMEの「related post suggestions」等は、実装上はmainSections内の前後記事ナビを指す。対象ソースにHugoの`.Related`を呼ぶ推薦処理は見当たらない。また、数式・Mermaid・PWA・無限スクロールを標準の完成機能として扱わない。必要なら別の機能要件・JS予算として追加する。

### 検索の詳細

`search.html`というテンプレートだけではページは作られない。例えば`content/search.md`に`layout: search`を指定し、既存のHTML/RSSを維持して`outputs.home: [HTML, RSS, JSON]`を有効化する。今回のテーマでは検索索引を`layouts/index.json`が生成する。新規テーマでの命名は`home.json`を基本とする。[PaperMod検索][pm-search]、[検索索引][pm-index]、[Hugoの出力設定](https://gohugo.io/configuration/outputs/)

- 索引は`site.RegularPages`のtitle/content/permalink/summary。`searchHidden`、archives/search layoutを除外する。ホームのmainSectionsフィルタと同一ではない。
- 検索ページだけでFuse.jsと検索JSを読み込み、`../index.json`をpreloadする。JSはloadイベント後にfetchし、索引をメモリーに保持する。
- 入力を150ms debounceし、既定ではtitle/permalink/summary/contentを検索。既定thresholdは0.4、ignoreLocationはtrue。`fuseOpts`を与えて調整でき、limitがなければ検索結果数を制限しない。
- 入力長は64。矢印キーとEscape等の操作を備える。0件時は一覧を空にし、取得失敗はconsoleに記録する実装で、専用の0件／エラー通知UIはない。
- 索引サイズ・パース／検索時間は記事増加に影響される。日本語の複合語、英日混在、IME変換中、連続入力、表記ゆれ、スマートフォンで実際に評価する。全文検索エンジンと同等の日本語解析を仮定しない。
- `../index.json`は検索ページのURL階層に依存する。任意の深いURLへ移動する場合は索引URLも修正する。

根拠: [head][pm-head]、[fastsearch.js][pm-fastsearch]。新テーマではロード中・取得失敗・0件の状態、再試行、結果件数通知も設計する。

### 同梱shortcode

| 名前 | 実装の範囲 | 採用時の注意 |
| --- | --- | --- |
| `figure` | Hugo内蔵を上書き。lazy画像、caption、配置、リンク、指定寸法 | 本文画像hookとは別経路。画像最適化を共通化する |
| `video` | `src`、controls、mutedのvideo | poster、preload、寸法、字幕等を必要に応じ追加 |
| `audio` | `src`、controls、muted、`loading="lazy"` | 属性があるだけで実際の遅延ロードを保証しない。対象ブラウザーと`preload`を検証 |
| `collapse` | summaryと本文の折りたたみ、openByDefault | HTMLの妥当性とキーボード操作を確認 |
| `rawhtml` | 内部HTMLを出力 | サニタイズ機能ではない |
| `inTextImg` | 小さな行内画像、既定高さ15 | 装飾ならaltの扱いを決める |
| `ltr` / `rtl` | 書字方向のラッパー | 多言語コンテンツが必要な場合 |

根拠: [固定リビジョンのshortcode一覧][pm-shortcodes]。`x`と`youtube`はここに含まれずHugo内蔵。利用中の名前・引数は新テーマで維持するかコンテンツを移行する。

## SEOの実装と限界

| 項目 | 確認した挙動 | 自作テーマで確認すること |
| --- | --- | --- |
| title | ホームはsite.Title、他はページタイトルとsite.Title | 長い日本語タイトル、一覧のページ番号、重複 |
| description | Description、Summary、サイト説明等を条件で選択 | HTML混入、長さ、固定ページ・分類の説明 |
| canonical | ページ`canonicalURL`があれば使用、それ以外はPermalink | ページ送り、別サイト転載、URL正規化 |
| robots meta | productionまたは`params.env: production`かつrobotsNoIndexでなければindex/follow。それ以外はnoindex/nofollow | 404・検索・プレビューの意図を明示 |
| OGP | ページならarticle、他はwebsite。日付・タグ等、画像のfallbackあり | 固定ページもarticle扱い。ページ用途に合わせる |
| Twitter Cards | 画像ありならsummary_large_image、なければsummary | fallback画像、絶対URL、実際の画像サイズ |
| 構造化データ | ホームはOrganization（Personも設定可）、page/sectionにBreadcrumbList、pageにBlogPosting | About/Archives/Search等の型、内容・URL整合性 |
| 言語 | html lang/dir、翻訳へのhreflang | locale、翻訳のないページ、言語別canonical |
| RSS発見 | AlternativeOutputFormatsへのlink | フィードのタイトル・URL・MIME |
| sitemap | テーマに上書きなし。Hugo内蔵が生成 | noindexとの整合、不要ページ除外、更新日 |
| robots.txt | 有効化時、本番はクロール許可、非本番はDisallow: /、sitemap URL | meta noindex／アクセス制御とは別 |
| 所有権検証 | Google/Yandex/Bing/Naver用meta | 利用するものだけ設定 |
| Google Analytics | production条件でHugoのpartialを呼ぶ。サービス設定が必要 | 現在未設定。採用時の通信・メインスレッド負荷 |

根拠: [head][pm-head]、[OGP][pm-og]、[Twitter Cards][pm-twitter]、[schema_json][pm-schema]、[robots][pm-robots]、[Hugo sitemap](https://gohugo.io/templates/sitemap/)。

### 機能名だけでは分からない注意点

1. OGP・Twitter Cards・JSON-LD・Analyticsはproduction条件で呼ばれる。通常の`hugo server`のHTMLだけを見て「SEO機能がない」と判断しない。逆にプレビューで`params.env: production`を付けるとrobotsの分岐にも影響する。
2. JSON-LDは`.IsPage`ならBlogPostingなので、現サイトのAboutとArchivesにも出る。汎用WebPage、AboutPage、CollectionPage等の使い分けを検討する。構造化データがあること自体は、検索結果表示や順位を保証しない。
3. `canonicalURL`はcanonicalタグで使われるが、OGPの`og:url`とJSON-LDの`mainEntityOfPage`等は`.Permalink`を使う。転載URLを指定する場合は項目ごとの意図を揃える。
4. カバー表示はResourceを探索するが、SEO画像のURL分岐には`cover.relative`が残る。画面にカバーが表示されてもOGP画像が正しいとは限らない。絶対URLで200になることを確認する。
5. JSON-LDの`articleBody`は本文を含む。長文記事ではHTML内に本文情報を二重に持つため、バイト数・圧縮後サイズを計測し、出力する必要性を検討する。
6. 構造化パンくずは親URLを分解してPageを探す実装。公開URLとコンテンツ階層が違うこのサイトでは、JSONとしてパースできることに加えて、positionと項目の意味を確認する必要がある。
7. keywords metaの出力を、高いSEO性能の根拠として採点しない。公開URL、適切な説明、クロール・索引の方針、ページ内容を優先する。

これらは対象ソースの条件と生成物からの評価であり、PaperMod全バージョンの不具合を主張するものではない。

## 非機能要件と性能最適化

| 観点 | PaperModが実装していること | 保証されないこと／改善候補 |
| --- | --- | --- |
| 初期HTML | 本文・一覧・ナビを静的HTMLで生成 | コンテンツ・SVG・JSON-LD・埋め込みでHTMLは増える |
| CSS | core/common/Chroma/extendedを結合・minifyし、1本のCSSにする | ページで未使用の検索・archive・profile用CSS等も含む。critical CSSや自動unused CSS除去ではない |
| CSS取得 | `rel="preload stylesheet"`、as=style、fingerprint/SRI | render-blocking CSSは残る。preloadが有効かはネットワーク計測が必要 |
| JS取得 | Fuse＋検索JSは検索ページだけ、defer、fingerprint/SRI | 共通処理とコードコピーはinline。全JSが外部化・遅延化されているわけではない |
| キャッシュ | ハッシュ付きアセットURL、partialCached等 | HTTPのCache-ControlやCDN設定は提供しない |
| フォント | システムフォントスタック | CSSにOpen Sans等の名前があっても、外部Webフォントをダウンロードする実装ではない |
| アイコン | inline SVG | 個々のアイコンはHTTP取得不要だがHTMLサイズに入る |
| カバー画像 | 360/480/720/1080/1500px候補＋原画像。元幅以上への拡大を避ける | 原画像も候補に残る。自動WebP/AVIF変換はない。未対応形式・外部URL等は寸法出力も省略される |
| 本文画像 | loading=lazy、Resource URL解決 | width/height・srcset自動生成なし。本文最上部のLCP候補もlazy |
| ハイライト | Hugo/Chromaのビルド時処理＋同梱CSS | コピーJS、クラス方式／inline方式、light/darkの適合は別 |
| 色テーマ | head内JSで初期配色、localStorageで選択保存、noscript用CSS | localStorage例外処理、初期ちらつき、CSP適合性は要検証 |
| アクセシビリティ | semantic要素、各種aria-label、focusスタイル、reduced motion対応箇所、キーボード検索 | WCAG適合の証明ではない。コントラスト、focus順序、通知、拡大表示を実測 |
| JS無効 | 記事本文とリンクを読める。切替・上へ戻るボタンをnoscriptで隠す | 検索・コピー等は使えない。代替導線は別設計 |
| 依存・保守 | Node.js不要の通常ビルド、同梱Fuse.js、MITライセンス | 同梱ライブラリの更新追随、Hugo互換性、ライセンス表示の維持は必要 |
| 拡張性 | partial・拡張CSSを上書きできる | 大きなpartial丸ごとのコピーはupstreamとの差分保守が増える |
| 外部通信 | 標準の共有リンク・SNSアイコンは主にリンク | コメント、Analytics、SNS埋め込み、サイト独自JSは追加通信・処理を発生させる |

根拠: [head][pm-head]、[footer][pm-footer]、[cover][pm-cover]、[render-image][pm-image]、[reset.css][pm-reset]、[zmedia.css][pm-media]、[baseof][pm-base]、[LICENSE][pm-license]。

通常ページ用ソースには画像の`fetchpriority`、preconnect、Service Worker、外部フォントの`@font-face`、critical CSS抽出処理は見当たらない。必要性を測定して個別に採用する。`params.assets.disableFingerprinting`を有効にするとCSS／検索JSのfingerprintとSRIは外れるが、CSSのminifyまで停止する設定ではない。

ソースのコピー・改変を行う場合はMITの著作権表示・許諾表示を保持する。フッターの表示クレジットと、ライセンス文書の保持は区別する。[PaperMod LICENSE][pm-license]

## 現サイトで有効なものと追加実装

設定根拠は[`hugo.yml`](../hugo.yml)、追加実装は[`layouts/_partials/`](../layouts/_partials/)、[`assets/css/extended/override.css`](../assets/css/extended/override.css)。

| 現状 | 移行時の扱い |
| --- | --- |
| 日本語、CJK要約、summaryLength 140、日付`2006/01/02` | 日本語の本文幅・行高・要約を実記事で確認 |
| postsの`/:year/:month/:day/:slugorcontentbasename/` | URLを維持。コンテンツの物理パスと混同しない |
| About/Archives/Categories/Tagsへのメニュー | 必須モックと移行後リンク検証に含める |
| Home-InfoとSNSリンク | 紹介文とリンクを維持。独自アイコンの有無も確認 |
| コードコピー、前後記事、共有、section/termのRSSボタン | 同等機能の移行対象 |
| highlight.styleはcatppuccin-mocha、noClasses実効値はtrue | inline色付けを維持するか、クラス＋CSSへ明示的に変更 |
| `minify.minifyOutput: true`、robots生成有効 | 新テーマでもサイト設定として維持・検証 |
| `unsafe: true`、生HTMLのInstagram/Speaker Deck | shortcode移行を検討。切替時に無条件で無効化しない |
| share_iconsを上書き、はてなブックマーク・はてなスターを追加 | PaperMod標準機能とは区別する |
| はてなスターの外部`star.js`をasync取得 | UIと通信を含めて移行要否を判断。asyncでも処理コストは残る |
| extend_headのauthorリンク、行高・文字サイズ等のCSS補正 | サイト固有の要件として新デザインに反映 |
| `static/_headers`のpages.dev向けnoindex | 配信要件。テーマとは別に維持 |
| Search、Profile、ToC、読了時間、語数、パンくず、コメント、Analytics、多言語は未設定 | 「PaperModで可能」と「現在使っている」を分ける |

`x` 35箇所、`youtube` 5箇所、PaperModの`video` 1箇所をコンテンツ検索で確認した。生成物のaboutにもはてなスターがあり、グローバル共有設定が記事だけに限定されていない。新テーマで表示対象を変えるなら意図した仕様変更として扱う。

## ローカルビルドで確認した基準値

調査日の実効設定、Hugo v0.165.0、対象PaperModリビジョンでproductionビルドした。publish先・Resource出力・ファイルキャッシュを一時ディレクトリに分離した。次の手順で再実行できる（この資料の数値は初回調査時の内容に対するもの）。

```sh
research_dir=$(mktemp -d /private/tmp/hugo-theme-baseline.XXXXXX)
HUGO_RESOURCEDIR="$research_dir/resources" hugo \
  --environment production \
  --destination "$research_dir/public" \
  --cacheDir "$research_dir/cache" \
  --noBuildLock --printPathWarnings
```

結果は終了コード0。Pages 160、Paginator pages 14、Processed images 14。PagesはHugoの集計項目であり記事数ではない。`.Language.LanguageDirection`・`.Language.LanguageCode`の非推奨警告、およびネットワーク制限によるX shortcodeのリモート取得警告が出た。警告抑制やテーマ改変は行っていない。この結果から本番埋め込みを含む表示速度は評価できない。

| 対象 | ファイルの実バイト数 | gzip参考バイト数 |
| --- | ---: | ---: |
| 共通CSS（サイトのextended CSS込み） | 18,124 | 4,627 |
| ホーム`/`のHTML | 29,300 | 10,799 |
| ホーム2ページ目のHTML | 21,170 | 8,037 |
| `/posts/`のHTML | 22,000 | 7,810 |
| `/archives/`のHTML | 39,259 | 7,850 |
| `/tags/`のHTML | 10,283 | 3,032 |
| `/tags/hugo/`のHTML | 10,837 | 4,301 |
| `/about/`のHTML | 47,359 | 12,056 |
| `/2026/09/01/development-environment-2026/`のHTML | 69,475 | 19,485 |
| `/404.html` | 6,045 | 2,297 |

ファイルサイズはUTF-8のバイト数。gzip参考値はNode.js v24.20.0の`zlib.gzipSync`の既定設定で計算したもので、HTTPヘッダー・画像・外部JSを含まない。CDNが実際にgzip/Brotliで配るサイズでもない。ファイル単体の転送予算を検討するための参考値。

生成物では以下も確認した。

- 共通CSSは1本。ファイル名のSHA-256とHTMLの`integrity`が実内容のハッシュに一致した。
- ホームの先頭カバーは`loading=lazy`、上記記事詳細のカバーは`loading=eager`で1200×630の寸法とsrcsetがある。実際のLCP要素はブラウザー計測が必要。
- 同記事の本文画像には`loading=lazy`があるが、width/height/srcsetはない。
- 表中のHTMLに含まれるJSON-LDはJSONとしてパースできた。ホームはOrganization、About/Archives/上記記事はBreadcrumbList＋BlogPosting、tags/term/404はJSON-LDなし。これは文法確認で、検索エンジンによる意味の検証ではない。
- 通常一覧のinline実行JS本文は合計1,557 bytes、上記記事とAboutは2,382 bytes。JSON-LDを除く。記事では別途はてなスターの外部JSを参照する。
- `search/index.html`、`index.json`、`llms.txt`は生成されなかった。対応テンプレートがあっても現サイトでは未有効。

PaperMod READMEのPageSpeedに関する説明やデモのスコアは、このサイトのベースラインの代用にしない。今回はPSI/Lighthouseを実行しておらず、Performance・LCP・CLS等の実測値は未取得。[PaperMod README][pm-readme]

## 自作テーマと比較するベンチマーク設計

### 比較条件

比較は次の2組に分ける。「B対C」を移行の合否に使い、「A対Cの対応条件」を原因調査に使う。

| 系統 | 内容 | 目的 |
| --- | --- | --- |
| A: PaperMod素体 | 固定PaperMod＋共通テスト記事。サイト独自CSS・はてなスター等なし | テーマ自身のCSS/JS・画像処理を調べる |
| B: 現サイト | 固定PaperMod＋現設定・全記事・独自機能 | 実際の移行元の基準 |
| C: 自作テーマ | Bと同じ記事・画像・有効機能・外部サービス | 同等機能での改善・退行を評価 |

本文、画像原本、表示件数、カバー、コード配色方式、目次、共有・Analytics等を揃える。機能を削った構成は別試験として記録し、同等条件の改善と混ぜない。比較の途中でPaperModやHugo、Chrome/Lighthouseのバージョンを上げない。

### 測定対象

| 種類 | 実サイトの候補／fixture | 見たい問題 |
| --- | --- | --- |
| ホーム初ページ | `/` | 紹介・アイコン・先頭カバー・LCP |
| 一覧2ページ目 | `/page/2/` | 初ページのみの機能、一覧件数・HTML量 |
| 長い技術記事 | `/2026/09/01/development-environment-2026/` | カバー、本文画像、コード、JSON-LD、コピー |
| カバー付き写真記事 | `/2025/11/16/building-my-first-gaming-pc-part2/` | 画像候補、転送量、CLS |
| 外部埋め込み記事 | `/2019/12/07/games-2019/`等 | X埋め込みの通信・JS・レイアウト安定性 |
| 固定ページ | `/about/` | 長文と共有の表示対象 |
| 分類とアーカイブ | `/tags/`、`/tags/hugo/`、`/categories/技術/`、`/archives/` | 長い一覧・多量DOM・ページ送り |
| エラー | 存在しないURL | 404ステータスと復帰導線 |
| 検索（採用時） | 同じ全記事から生成した索引 | 初期ロード、連続入力、検索時間、結果DOM、失敗UI |
| 部品fixture | 長い表、行番号、見出し、外部画像、空一覧、非公開設定 | 実記事だけでは網羅できない状態 |

### 実施手順

1. **固定条件を記録する。** サイトとテーマのコミット、Hugo/Chrome/Lighthouseの正確なバージョン、OS、ビルドコマンド、有効機能、記事件数、画像処理設定を結果に残す。
2. **同じproduction条件で生成する。** `hugo server`の開発出力を基準にしない。外部shortcode取得が成功し内容が揃っていることを確認する。生成HTMLを比べ、本文欠落やJSエラーを先に解消する。
3. **同じ配信条件にする。** 圧縮、Cache-Control、CDN、リージョン、HTTPS、プレビューヘッダーを揃える。生成URL・canonicalが本番ドメインを向いたまま別ホストへ測定しに行かない。公開は調査作業とは別工程。
4. **Lighthouseで反復する。** 固定したCLI/DevToolsでモバイルとデスクトップを別々に測り、各URL・各テーマを最低5回、A/B順を交互に実行する。初回ロードはブラウザーキャッシュとストレージをリセット。再訪キャッシュは別試験にする。CDNの温まり具合も揃える。
5. **結果を保存する。** HTML/JSONレポート、設定、中央値と最小・最大、スクリーンショット、Network/Performance traceを保存する。最大スコア1回だけを比較しない。境界付近やばらつきが大きい場合は追加測定する。
6. **画面操作を測る。** 検索入力、dark切替、コードコピー、目次を操作し、長いタスクや応答遅延を見る。Lighthouseの通常navigation測定だけでは操作性能を評価できない。
7. **公開後はPSI/CrUXも確認する。** PSIのLighthouseラボ値とCrUXフィールド値を分ける。フィールドは過去28日間の実ユーザー集計で、十分なデータがないURLもある。origin集計を特定ページの測定結果と混同しない。[PageSpeed Insights](https://developers.google.com/speed/docs/insights/v5/about)

固定したLighthouse CLIを用意した後の実行例（URLと出力先は検証環境に合わせる）:

```sh
lighthouse https://benchmark.example/ \
  --output=html --output=json \
  --output-path=/private/tmp/papermod-mobile-01

lighthouse https://benchmark.example/ \
  --preset=desktop --output=html --output=json \
  --output-path=/private/tmp/papermod-desktop-01
```

ブラウザーの選択やheadless起動は固定環境で設定する。CLIの既定値・presetを含むresolved settingsとthrottlingをレポートに残す。ローカル静的サーバーでの比較はテーマ差分を見るために使い、公開配信のPSI値とは別に扱う。[Lighthouse公式CLI案内](https://github.com/GoogleChrome/lighthouse#using-the-node-cli)

### 指標と合否案

| 指標 | 目標・判断案 |
| --- | --- |
| Lighthouse Performance | 各代表URLのモバイル・デスクトップ中央値がB以上。補助目標は95以上だが、PaperModが98なら95達成だけで同等とはしない |
| LCP | フィールド75パーセンタイルで2.5秒以下。ラボでは同じ条件のB以下を狙う |
| INP | フィールド75パーセンタイルで200ms以下。検索等の操作も個別に確認 |
| CLS | フィールド75パーセンタイルで0.1以下。ラボでもBからの退行を確認 |
| FCP / Speed Index / TBT | Bとの中央値と分布を比較。TBTはラボの応答性の手掛かりでありINPの代替測定値ではない |
| CSS / JS / HTML | 転送量、非圧縮量、リクエスト数、未使用CSS/JSを記録。共通CSSはまず今回の18,124 bytes以下を仮予算にする |
| 画像 | 実際に選ばれたsrcset候補、表示寸法に対する過大配信、LCP画像の発見・待機時間、画像起因CLS |
| 検索 | 索引転送量・パース時間・入力から結果表示まで・長いタスクを測る。日本語クエリ集合の結果品質も維持 |
| Accessibility / SEO / Best Practices | Bから退行しない。機械採点に加えキーボード、コントラスト、JSON-LDの意味、実際の404等を確認 |
| ビルド | 同じマシン・内容でcold/warmキャッシュを分け、所要時間・メモリー・生成画像数を比較 |

Core Web Vitalsの閾値と75パーセンタイルは[Web Vitals公式説明](https://web.dev/articles/vitals)による。95点やCSSサイズの予算はこの資料の提案で、GoogleやPaperModの保証ではない。

Performanceスコアは複数指標の重み付き集計であり、一つが悪化しても別の改善で総合点が上がり得る。公式説明のLighthouse 10の重みはFCP 10%、Speed Index 10%、LCP 25%、TBT 30%、CLS 25%。実際の採点は固定した使用バージョンのレポートで確認する。[Lighthouse scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring)

「同等以上」はスコア中央値だけで判定せず、重要な指標・機能の退行がないことも条件にする。差が反復測定のばらつきに収まる場合は改善／退行を断定せず、追加測定やtraceで原因を確認する。

結果記録の雛形:

| ビルドID・テーマSHA | URL | 端末・Lighthouse版 | 有効機能 | N | Performance中央値［最小–最大］ | LCP / CLS / TBT中央値 | CSS/JS/画像転送量 | 判定・レポート |
| --- | --- | --- | --- | ---: | --- | --- | --- | --- |
| B: 未測定 | — | — | — | — | — | — | — | 未測定 |
| C: 未測定 | — | — | — | — | — | — | — | 未測定 |

## 自作テーマで優先する改善案

1. **画像の共通処理。** カバー・本文・figureに寸法と適切なsrcsetを付け、LCP候補をlazyから除外する。モバイルでの選択画像とCLSを確認する。
2. **HTML・CSS・JSの役割別予算。** システムフォント、ビルド時Chroma、検索ページ限定JSを維持。JSON-LDの本文重複、使わない画面のCSS、inline JSの共通化を測定して判断する。
3. **意味に合うSEO。** 記事・固定ページ・一覧を区別し、canonical/OGP/JSON-LDを共通のURL・画像解決処理で揃える。sitemapと公開範囲も明示する。
4. **外部埋め込みの負荷管理。** はてなスター、X、Instagram、Speaker Deck等について、必要性とクリック後読み込み・領域確保を検討する。表示機能を維持した比較も必ず残す。
5. **操作と保守。** コピー失敗通知、検索状態、フォーカス表示、JS無効時の導線を整える。現HugoのLocale/Direction等を使い、非推奨APIを新実装へ持ち込まない。

上記はソース分析からの改善候補。効果の大小はベンチマークで決め、PaperModより速いという結論は測定が揃ってから出す。

[pm-root]: https://github.com/adityatelange/hugo-PaperMod/tree/d3768854d00ad003b0a8dbdba254ce9224377a01
[pm-theme]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/theme.toml
[pm-readme]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/README.md
[pm-base]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/baseof.html
[pm-list]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/list.html
[pm-home]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/home_info.html
[pm-profile]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/index_profile.html
[pm-single]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/single.html
[pm-taxonomy]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/taxonomy.html
[pm-archives]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/archives.html
[pm-404]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/404.html
[pm-header]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/header.html
[pm-footer]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/footer.html
[pm-head]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/head.html
[pm-search]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/search.html
[pm-index]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/index.json
[pm-fastsearch]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/assets/js/fastsearch.js
[pm-meta]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/post_meta.html
[pm-author]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/author.html
[pm-cover]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/cover.html
[pm-toc]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/toc.html
[pm-anchors]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/anchored_headings.html
[pm-breadcrumbs]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/breadcrumbs.html
[pm-edit]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/edit_post.html
[pm-canonical]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/post_canonical.html
[pm-nav]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/post_nav_links.html
[pm-share]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/share_icons.html
[pm-social]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/social_icons.html
[pm-comments]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/comments.html
[pm-translations]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/translation_list.html
[pm-rss]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/rss.xml
[pm-llms]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/llms.txt
[pm-shortcodes]: https://github.com/adityatelange/hugo-PaperMod/tree/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_shortcodes
[pm-og]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/templates/opengraph.html
[pm-twitter]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/templates/twitter_cards.html
[pm-schema]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/templates/schema_json.html
[pm-robots]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/robots.txt
[pm-image]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_markup/render-image.html
[pm-reset]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/assets/css/core/reset.css
[pm-media]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/assets/css/core/zmedia.css
[pm-license]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/LICENSE
