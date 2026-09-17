# 2. Hugo本体とテーマの責務

前提は[技術情報の前提](README.md#技術情報の前提)を参照。HugoにAPIや組み込みテンプレートがあることと、任意のテーマでその機能が自動的に有効になることは別である。

## 責務の見方

| 担当 | 主な役割 |
| --- | --- |
| Hugo本体 | コンテンツのモデル化、Markdown変換、テンプレート実行、画像・CSS・JS等のビルド処理、内蔵テンプレート |
| テーマ | 呼び出すHugo API、対象・条件、HTML属性、CSS、ブラウザーで動くJS、UI・アクセシビリティ |
| サイト・記事 | 言語・URL・公開条件、機能の有効化、著者・説明・画像等の値、外部サービスの採否 |
| ブラウザー・配信環境 | lazy loadや優先度の解釈、SRI検証、HTTP圧縮・キャッシュ・TLS・HTTPステータス・レスポンスヘッダー |

テーマはサイトと同じHugoの機能を使うテンプレート・アセットの集合。テーマを替えてもMarkdownの処理機構は残るが、テーマ固有の`params`やshortcode・render hookは引き継がれない。

## 要件分担表

「本体の能力」だけで完了とせず、右側の設定・表示・検証まで分けて考える。以下はAPIの責務表であり、全機能の採用を意味しない。最新の表示・操作仕様は[HTMLモック](../mock/README.md)を参照する。

| 機能 | Hugo本体の能力・標準挙動 | テーマ／サイトが決める部分 | 配信／ブラウザー |
| --- | --- | --- | --- |
| Markdown | GoldmarkでHTML生成 | typography、表・脚注等のCSS、拡張の設定 | HTMLを描画 |
| 一覧・分類 | Page、section、taxonomy、termのモデル | 対象、順序、カード・分類UI | — |
| ページ送り | `.Paginate`/`.Paginator`、ページURL、内蔵pagination partial | 呼び出しと対象、ナビの出力・見た目 | — |
| アーカイブ | 日付別グループ化API | 独自layout、年／月の表示・件数 | — |
| HTML等のminify | `--minify`または`minify.minifyOutput` | ビルド設定で有効化、可読性・コメント保持等の設定 | gzip/Brotliは別 |
| CSS/JSのminify | `resources.Minify` | Resourceの取得と関数呼び出し、どのアセットに適用するか | — |
| CSS/JSの結合 | `resources.Concat` | 入力の順番、共通／画面別の単位、HTMLからの参照 | キャッシュ・取得 |
| Sass / JS変換 | `css.Sass`、esbuildを使う`js.Build`等 | 採用言語、ターゲット、ビルド依存ツール | 生成JSを実行 |
| fingerprint | `resources.Fingerprint`でハッシュ付きURLを生成 | 最終内容に対して実行、生成URLを使う | キャッシュポリシーは配信側 |
| SRI | `.Data.Integrity`を生成 | `integrity`属性の出力、対象、`crossorigin` | 内容を検証。クロスオリジンはCORSも必要 |
| lazy load | 任意の属性を生成するテンプレート機構 | `loading="lazy"`、対象・例外、埋め込みの遅延JS | 読み込み時期を判断 |
| preload | 任意の`link`を出力可能 | 対象、`as`、URL、CORS、`imagesrcset`等 | 先行取得を判断 |
| fetchpriority | 任意の属性を出力可能 | LCP候補などへの`fetchpriority="high"` | 優先度ヒントを解釈 |
| 画像リサイズ・変換 | Resourceの`.Resize`/`.Fit`/`.Fill`等 | 幅・品質・形式・候補枚数、処理対象 | 実際の候補を取得 |
| レスポンシブ画像 | 画像生成・寸法取得API | `srcset`/`sizes`/`picture`、width/height、alt | viewport・DPRに応じ選択 |
| シンタックスハイライト | Chromaによるビルド時処理 | 設定、配色CSS、コード枠、横スクロール | 表示のみ。色付け用JSは不要 |
| コードコピー | コードHTML生成まで | ボタン・Clipboard API・成功／失敗通知 | 権限・API対応 |
| shortcode | 呼び出し構文、引数処理、内蔵shortcode | 独自テンプレート／内蔵の上書き、引数互換性 | 外部埋め込みの実行 |
| render hook | Markdown要素ごとのテンプレート差し替え | 画像・リンク・見出し・コード等の出力 | — |
| 目次 | `.TableOfContents`、見出し情報 | 配置、開閉、深さ、アンカー装飾、独自生成の採否 | スクロール等 |
| 要約・読了時間・語数 | `.Summary`/`.ReadingTime`/`.WordCount` | 表示、有効化、日本語設定・期待値 | — |
| 検索 | JSON等の生成は可能 | 索引スキーマ、除外、検索エンジン・入力UI・エラー表示 | Fuse.js等の実行、または外部検索 |
| 関連記事 | `site.RegularPages.Related`等 | 条件・重み、件数、表示 | — |
| 多言語 | 言語別サイト、翻訳の対応、`i18n` | 言語設定、ラベル、切替UI、RTL、hreflang | — |
| RSS | 内蔵テンプレートと標準出力 | 件数・対象・全文化、独自XML、購読リンク | RSSリーダーが購読 |
| sitemap | 内蔵テンプレートで生成 | 除外、Lastmod、必要なら上書き | クローラーの利用 |
| robots.txt | 設定で生成、内蔵／独自テンプレート | 公開環境別の内容 | クローラーの解釈 |
| canonical / OGP | Permalink、説明等の値、OGP等の内蔵partial | partialの呼び出し／独自実装、fallback、ページ種別 | 検索・SNSの解釈 |
| JSON-LD | データの組み立て・JSON出力機構 | Schema型、属性、対象ページ、URL整合性 | 検索エンジンの解釈 |
| dark mode | 条件に応じたHTMLを生成可能 | CSS、切替JS、OS設定・保存値・初期描画 | media query、localStorage |
| コメント・Analytics | 埋め込み用テンプレート等を利用可能 | サービス選定、設定、呼び出し、同意や遅延ロード | 外部バックエンドが必要 |
| セキュリティ | テンプレートのエスケープ、実行・取得の制限設定 | raw HTML、信頼する入力、外部スクリプト | CSP、TLS、SRI、CORS、HTTPヘッダー |
| ビルド高速化 | Resourceキャッシュ、`partialCached`、計測 | キー設計、画像候補数、キャッシュ永続化 | CI環境 |
| 配信高速化 | 静的成果物を生成 | アセット量・リクエスト数・読み込み順 | CDN、Brotli/gzip、Cache-Control、HTTP/2・3 |

根拠は以下の分野別説明と、[Pagination](https://gohugo.io/templates/pagination/)、[Related content](https://gohugo.io/content-management/related-content/)、[Embedded partial templates](https://gohugo.io/templates/embedded/)、[RSS](https://gohugo.io/templates/rss/)、[sitemap](https://gohugo.io/templates/sitemap/)、[robots.txt](https://gohugo.io/templates/robots/)を参照。

## minify・アセット処理・SRI

### HTMLのminifyとCSSのminify

`minify.minifyOutput`の既定値は`false`。現サイトの[`hugo.yml`](../hugo.yml)は`true`なので、通常のproductionビルドでHTML等の出力がminifyされる。一方、PaperModは[`head.html`][pm-head]でCSSをResourceとして取得し、`resources.Concat`と`resources.Minify`を呼ぶ。テーマのCSS minifyは、CLIの`--minify`だけに依存していない。[Hugoのminify設定](https://gohugo.io/configuration/minify/)、[resources.Minify](https://gohugo.io/functions/resources/minify/)

`static/`に置いたCSSがすべて自動的に結合・変換される、と期待しない。Hugo Pipesで処理するファイルは`assets/`等からResourceとして取得する。CSS minifyには不要CSSの使用状況解析・削除、critical CSSの抽出、画像圧縮、HTTP転送圧縮までは含まれない。

新テーマでは「HTMLをminifyする」「最終CSS/JSをminifyする」「不要なものを読み込まない」「HTTP圧縮で配る」を別々の要件にすると検証しやすい。

### fingerprintとSRI

Hugoのfingerprintはハッシュ入りファイル名とSRI値を作る。テーマはそのURLと値をHTMLに埋める。ファイル名のハッシュだけではブラウザーによる完全性検証は行われない。[resources.Fingerprint](https://gohugo.io/functions/resources/fingerprint/)

新テーマ用の最小例（`assets/css/main.css`を用意してhead内で実行）:

```go-html-template
{{ with resources.Get "css/main.css" }}
  {{ $css := . | resources.Minify | resources.Fingerprint "sha384" }}
  <link rel="stylesheet" href="{{ $css.RelPermalink }}"
        integrity="{{ $css.Data.Integrity }}" crossorigin="anonymous">
{{ end }}
```

圧縮・結合・変換が終わってからfingerprintする。ここでのSHA-384は設計例で、PaperModの既定の呼び出しはSHA-256。CDN側で内容を書き換えるとSRIに失敗し得る。クロスオリジンのSRIにはサーバー側CORS対応も必要。SRIは高速化そのものではなく改変検出であり、長期キャッシュの配信設定も別途必要。[MDN: SRI](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity)

### Sass・JavaScriptの依存関係

`js.Build`はHugoに組み込まれたesbuildを使うため、JavaScriptを使うだけでNode.jsのビルド環境が必須になるわけではない。npmパッケージや独自ツールを採用すればそれらの管理は必要。Sassは選ぶtranspilerによりExtended版やDart Sass等の要件が変わる。バージョン・配布形態を固定して必要条件を記載する。PaperModの通常ビルドはCSSと同梱JSを利用し、Node.jsやwebpackは要求しない。[js.Build](https://gohugo.io/functions/js/build/)、[css.Sass](https://gohugo.io/functions/css/sass/)、[PaperMod head][pm-head]

## lazy load・preload・画像最適化

Hugo本体にはページのスクロール位置を実測してLCP画像を判定する機能はない。ビルド時に生成する画像・HTML属性はテーマが設計し、実際の遅延ロードや優先度はブラウザーが判断する。

| 画像の入口 | Hugo本体で利用できる処理 | 今回のPaperModの実装 | 新テーマで定義する要件 |
| --- | --- | --- | --- |
| 記事カバー | 画像Resourceの変換・寸法取得 | 本番・処理可能なローカルResource・responsiveImages有効時に複数幅と`srcset`、寸法。詳細はeager、一覧はlazy | 候補幅・形式、LCP候補の扱い、一覧先頭をlazyにするか |
| Markdown本文画像 | render hookから同じ画像APIを利用可能 | URL解決と`loading="lazy"`。リサイズ・`srcset`・寸法の自動取得なし | カバーと共通の画像partial、寸法自動化、最上部画像の例外 |
| `figure` shortcode | 内蔵shortcodeがあり上書き可能 | PaperMod版でlazy、明示width/height、caption等。自動リサイズなし | 引数の互換性、画像共通処理 |
| 生HTMLの`img`・外部埋め込み | raw HTML許可時はそのHTMLが本文に残る | Markdown画像hookの対象外 | HTML移行、shortcode化、iframeの寸法・遅延ロード |

根拠: [PaperMod cover][pm-cover]、[画像hook][pm-image]、[figure][pm-figure]。

Hugo内蔵の画像render hookも主にURL解決のためで、標準のレスポンシブ画像生成器ではない。画像処理APIがあることを、全画像への自動適用と読み替えない。[画像render hook](https://gohugo.io/render-hooks/images/)

処理可能なResourceを`.Resize`等に渡すと、Hugoが変換画像を生成・キャッシュする。`srcset`、`sizes`、`picture`の候補設計はテーマの責務。対応画像形式はHugoのバージョンやビルドに依存するため、現行の処理可能判定APIと対象バージョンを照合する。PaperModがハードコードした拡張子リストをHugo本体の能力上限と見なさない。[画像処理](https://gohugo.io/content-management/image-processing/)

### 要件定義上の注意

- LCPになり得る画像はlazyにしない。必要なら`fetchpriority="high"`を付ける。どの画像がLCPかは端末・画面によって変わるため計測する。[LCP最適化](https://web.dev/articles/optimize-lcp)
- `loading="eager"`は遅延させない指定であり、`fetchpriority="high"`と同じではない。
- preloadは「早めに必要だと知らせる」指定。CSSを適用する役割は`rel="stylesheet"`にある。PaperModの`rel="preload stylesheet"`はCSS適用を伴うので、非同期CSS化やrender-blocking解消の証拠にはならない。[MDN: preload](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload)
- preloadのURL・`as`・CORSモードが実際の取得と一致しないと再取得等の原因になる。全画像・全フォントをpreloadする方針にはしない。
- 外部画像は、URLをそのまま出力するだけなら寸法取得や変換はできない。Hugoでremote Resourceとして取得する設計なら、ビルド時ネットワーク依存・失敗時処理も要件になる。[画像処理](https://gohugo.io/content-management/image-processing/)
- width/heightやアスペクト比による領域確保と、lazy loadによる取得延期は別。CLS対策には前者も必要。

## シンタックスハイライト

HugoのChromaはビルド時に色分けされたHTMLを生成する。コードフェンスに言語を指定するか、内蔵`highlight` shortcode・`transform.Highlight`等から利用できる。言語未指定の扱い、行番号・強調行などは設定で制御する。[Syntax highlighting](https://gohugo.io/content-management/syntax-highlighting/)

| 設定 | 出力・テーマの責務 |
| --- | --- |
| `markup.highlight.noClasses: true`（既定） | 色をinline styleで出す。`style`設定が配色に影響する |
| `markup.highlight.noClasses: false` | クラスを出す。対応するChroma CSSをテーマが配信する必要がある |

現サイトは`style: catppuccin-mocha`を指定し、`noClasses`は未指定なので実効値は`true`。PaperModはクラス向けCSSも常時バンドルしている。自作テーマはモックと同じクラス方式を採用し、Latte／MochaのCSSを両配色へ適用する。Hugo v0.164以降にはChroma CSS生成のlight/dark mode関連機能が追加されており、採用時は対応スタイルと最低バージョンも確認する。[Syntax highlighting](https://gohugo.io/content-management/syntax-highlighting/)、[PaperMod head][pm-head]

コピー機能はHugoの色付けとは独立したテーマJS。PaperModは`pre > code`にボタンを追加する。自作テーマでは行番号を含めないコピー、空白保持、Clipboard APIのPromise失敗、キーボード操作、通知を要件にする。[PaperMod footer][pm-footer]

目次は実装しない。Hugoに目次APIがあることは、今回の採用要件を意味しない。

## shortcode・render hookとコンテンツ互換性

内蔵shortcode（例: `figure`、`highlight`、`x`、`youtube`）はHugoが提供する。`video`等の独自shortcodeは、その名前のテンプレートをテーマまたはサイトが提供して初めて利用できる。同名の内蔵shortcodeをテーマが上書きすることもできる。[Shortcodes](https://gohugo.io/content-management/shortcodes/)

現コンテンツで検出した呼び出しは`video` 1件、`x` 35件、`youtube` 5件。`video`はPaperMod、後二者はHugo内蔵を利用している（呼び出し箇所数であり、ページ数ではない）。PaperModの`figure`を現在使っていなくても、将来のコンテンツ仕様として選ぶなら引数と挙動を決める必要がある。

`markup.goldmark.renderer.unsafe: true`は、現サイトではInstagramやSpeaker Deckの生HTML埋め込みを許可するために設定されている。テーマ変更だけでは埋め込みのJS通信は消えない。`unsafe: false`への変更は既存コンテンツのshortcode移行と組み合わせる。`rawhtml` shortcodeは任意HTMLを出すための独自テンプレートであり、入力を無害化する機能ではない。[現設定](../hugo.yml)、[PaperMod shortcodes][pm-shortcodes]

## SEO・公開範囲・配信の分担

HugoにはOGP/Twitter Cards等の内蔵partialがあるが、テーマから呼ぶ必要がある。PaperModは同梱したSEO partialを使い、独自のJSON-LDを出している。`canonicalURL`等の値の対応範囲はテーマ次第で、canonicalタグを変更したからといってOGPやJSON-LDのURLも自動で揃うとは限らない。[Embedded partial templates](https://gohugo.io/templates/embedded/)、[PaperMod head][pm-head]

`searchHidden`・`hiddenInHomeList`・`hiddenInRss`・`robotsNoIndex`はPaperModがそれぞれ別の場所で解釈するパラメーター。全体を非公開にする統一スイッチではない。sitemapへの掲載、検索索引への収録、直接URLからの閲覧は別々に確認する。プレビューのアクセス制限が必要なら認証は配信側に実装する。[PaperMod検索索引][pm-search-index]、[RSS][pm-rss]、[head][pm-head]

HTTP圧縮、Cache-Control、CSP、実際の404ステータス、プレビュー用`X-Robots-Tag`は配信の責務。Hugoが`_headers`等をコピーできても、その解釈はホスティングサービスに依存する。現サイトの[`static/_headers`](../static/_headers)は`pages.dev`向けnoindexヘッダーであり、PaperMod標準機能ではない。

移行時の注意は[資料3](03-papermod-analysis.md)、デザインの判断理由は[資料4](04-theme-visual-requirements.md)を参照する。

[pm-head]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/head.html
[pm-cover]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/cover.html
[pm-image]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_markup/render-image.html
[pm-figure]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_shortcodes/figure.html
[pm-footer]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_partials/footer.html
[pm-shortcodes]: https://github.com/adityatelange/hugo-PaperMod/tree/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/_shortcodes
[pm-search-index]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/index.json
[pm-rss]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/rss.xml
