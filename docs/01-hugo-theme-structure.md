# 1. Hugoのテーマ構造と責務

Hugoのページモデル、テンプレート、テーマとの責務分担をまとめた調査資料。テンプレート名はv0.146以降の体系を前提とする。確認環境は[技術情報の前提](README.md#技術情報の前提)、PaperMod固有の挙動は[資料2](02-papermod-analysis.md)を参照。

## ページ種別とテンプレート

Hugoには、テーマが必ず個別に実装する固定数の画面はない。有効なページ種別・出力形式に対し、検索順に従ってテンプレートが選ばれる。`all.html`は広いフォールバック、`single.html`と`list.html`は詳細と一覧のフォールバックに使える。`baseof.html`は共通枠であり、単独で記事本文を描画するテンプレートではない。[テンプレートの種類](https://gohugo.io/templates/types/)、[検索順](https://gohugo.io/templates/lookup-order/)

| ページ種別 | Kind | HTMLテンプレートの代表例 |
| --- | --- | --- |
| ホーム | `home` | `home.html`、`list.html` |
| 記事・固定ページ | `page` | `page.html`、`single.html` |
| セクション一覧 | `section` | `section.html`、`list.html` |
| タクソノミー一覧 | `taxonomy` | `taxonomy.html`、`list.html` |
| 個別の分類に属するページ一覧 | `term` | `term.html`、`list.html` |
| 404 | `404` | `404.html` |

表は代表例であり、ページパス、`layout`、`type`、言語、出力形式等も検索順に影響する。`taxonomy`は分類名の集合、`term`は特定の分類に属するページの集合。v0.146以降の`taxonomy.html`は`term`用を兼ねない。[新テンプレートシステム](https://gohugo.io/templates/new-templatesystem-overview/)

`Kind`はHugoが持つページ種別、`type`はコンテンツ型、`layout`はテンプレート選択の指定で、それぞれ別の概念。年月別Archivesは独自の`layout`で構成でき、Hugo固有のKindではない。一覧の2ページ目以降はページ送り機能が同じテンプレートから生成する。

## テーマとディレクトリ

テーマはテンプレート・アセット等の集合で、サイト側と同じHugoの仕組みを使う。サイト側に同じテンプレートパスのファイルがあれば、テーマ側を上書きできる。ただし、サイト側の汎用テンプレートよりテーマ側の具体的なテンプレートが先に選ばれる場合がある。[検索順](https://gohugo.io/templates/lookup-order/)

| 場所 | 役割 |
| --- | --- |
| `layouts/` | ページ・出力形式ごとのテンプレートと共通枠 |
| `layouts/_partials/` | テンプレートから呼ぶ共通部品 |
| `layouts/_markup/` | Markdown要素の出力を変えるrender hook |
| `layouts/_shortcodes/` | コンテンツから明示的に呼ぶshortcode |
| `assets/` | Hugo Pipes等でResourceとして取得・加工するソース |
| `static/` | 出力先へ基本的にそのままコピーするファイル |
| `archetypes/` | 新規コンテンツの雛形 |
| `i18n/` | 翻訳ラベル |
| `theme.toml`、README、LICENSE等 | テーマのメタデータ・利用案内・ライセンス |

テーマのメタデータだけでは画面は生成されない。テーマとしてのファイル群は`themes/<名前>/`等に配置され、サイト設定から読み込まれる。[ディレクトリ構成](https://gohugo.io/getting-started/directory-structure/)

コンテンツの`index.md`はleaf bundle、`_index.md`はbranch bundleを表す。前者は記事と画像等のResource、後者はセクション等の一覧ページの説明やメタデータをまとめる。コンテンツの物理パスと出力URLは同一とは限らず、パーマリンク設定等がURLに影響する。[Page bundles](https://gohugo.io/content-management/page-bundles/)

## Hugo本体とテーマの責務

HugoがAPIや内蔵テンプレートを提供することと、任意のテーマでその機能が表示されることは別である。

| 領域 | Hugo本体 | テーマ・サイト側 | ブラウザ・配信側 |
| --- | --- | --- | --- |
| 本文・一覧 | Markdown変換、Page・分類モデル、要約・日付等の取得 | 対象データ・表示条件、HTML構造、CSS | HTMLを描画 |
| ページ送り・目次・関連記事 | Paginator、見出し情報、関連記事抽出等のAPI | 呼び出し・設定とUI | 移動・スクロール等 |
| CSS・JS | 結合・minify・変換・fingerprint等のビルド機能 | 入力・処理順・出力参照、ブラウザ用JS | JS実行、キャッシュ、HTTP圧縮 |
| 画像 | Resourceの寸法取得・リサイズ・形式変換 | 候補幅、`srcset`・`sizes`・寸法・alt・読み込み属性 | 候補選択、遅延読み込み、取得優先度 |
| コード | Chromaによるビルド時ハイライト | 配色CSS、コードの外枠、コピーUI | クリップボードAPIと権限 |
| RSS・sitemap・robots | 内蔵テンプレートと生成機能 | 有効化・対象・設定、必要に応じた上書き | リーダーやクローラーが利用 |
| SEO情報 | Permalink等のデータ、OGP等の内蔵partial | 呼び出し・独自出力、canonical・構造化データの組み立て | 検索・SNSが解釈 |
| 検索・配色・外部サービス | JSON等の出力や埋め込み用テンプレート | 索引・UI・切り替えJS・外部サービスの呼び出し | 検索JS・OS設定・外部バックエンド |
| 公開・セキュリティ | 出力のエスケープ、ビルド時の実行・取得制限 | 公開条件、raw HTMLや外部スクリプトの設定 | TLS・CSP・CORS・認証・HTTPステータス |

サイト設定は言語・URL・出力形式・機能の有効化等を、記事のメタデータはタイトル・日付・画像等の入力値を持つ。テーマ固有のパラメーターやshortcodeは、それを解釈するテンプレートに依存する。

### 混同しやすい境界

- HTML等の出力minifyと、Resourceに対するCSS／JSのminifyは別の処理。`static/`のCSSが自動的に結合・変換される仕組みではなく、未使用CSSの削除やHTTP圧縮も別である。[minify設定](https://gohugo.io/configuration/minify/)、[resources.Minify](https://gohugo.io/functions/resources/minify/)
- fingerprintはハッシュ付きURLと完全性検証用の値を生成する。HTMLの`integrity`属性を出力するのはテンプレート、検証するのはブラウザ。長期キャッシュの設定は配信側の責務となる。[resources.Fingerprint](https://gohugo.io/functions/resources/fingerprint/)
- 画像処理APIは、全画像を自動的にレスポンシブ画像へ変えるものではない。テンプレートが処理対象と候補を定める。`loading`・`fetchpriority`・preloadは読み込みの指定で、画像の寸法確保とは別の役割を持つ。[画像処理](https://gohugo.io/content-management/image-processing/)、[画像render hook](https://gohugo.io/render-hooks/images/)
- Chromaはinline styleまたはクラス付きHTMLを生成する。クラス方式では対応するCSSの配信が必要。コピー操作はハイライトとは独立したブラウザ側の機能である。[Syntax highlighting](https://gohugo.io/content-management/syntax-highlighting/)
- `js.Build`はHugo内蔵のesbuildを利用する。追加パッケージを使う場合の依存管理とは別。Sassの必要ツールはtranspilerによって異なる。[js.Build](https://gohugo.io/functions/js/build/)、[css.Sass](https://gohugo.io/functions/css/sass/)
- RSS等の生成対象は出力設定、内容はテンプレートが担う。OGP等の内蔵partialはテンプレートからの呼び出しが必要となる。[出力設定](https://gohugo.io/configuration/outputs/)、[RSS](https://gohugo.io/templates/rss/)、[Embedded partial templates](https://gohugo.io/templates/embedded/)
- 404のHTML生成とHTTP 404の応答、robots.txtとアクセス制御は別の仕組み。HTTPヘッダーや圧縮は配信環境が扱う。[404](https://gohugo.io/templates/404/)、[robots.txt](https://gohugo.io/templates/robots/)

## テンプレートとコンテンツ変換の仕組み

Go templateの`.`は現在のコンテキストで、`range`・`with`の内側で変わる。`partial`は渡されたコンテキストで共通部品を実行し、`block`・`define`はbase templateと子テンプレートを組み合わせる。`{{-`・`-}}`は隣接する空白の除去で、HTMLのminifyとは別。[テンプレート入門](https://gohugo.io/templates/introduction/)

`define`を使う子テンプレートの外側に通常のHTMLがあると、base templateが適用されない。HTML出力はコンテキストに応じてエスケープされ、`safeHTML`等はその扱いを変える。[テンプレートの種類](https://gohugo.io/templates/types/)

- **render hook**：Markdownの画像・リンク・見出し・コード等の変換時に呼ばれる。本文に書かれた生HTMLはMarkdown画像hookの対象にはならない。[Render hooks](https://gohugo.io/render-hooks/introduction/)
- **shortcode**：記事中から名前と引数で呼ぶ。Hugo内蔵のものと、テーマ・サイトが定義するものがある。`{{< name >}}`と`{{% name %}}`ではMarkdown処理への参加方法が異なる。[Shortcodes](https://gohugo.io/content-management/shortcodes/)
- **partial**：ページテンプレート等から呼ぶ共通部品。`partialCached`では、言語ごとのSiteに分離されたキャッシュと、指定したvariantキーで結果を再利用する。[partials.IncludeCached](https://gohugo.io/functions/partials/includecached/)

`.Pages`は子セクション等を含み得る。`.RegularPages`と`.RegularPagesRecursive`は通常ページの取得範囲が異なる。ページ送りは渡された集合を分割し、同じページで最初に生成したPaginatorをキャッシュするため、最初の対象・ソート条件が後の呼び出しにも影響する。[Pagination](https://gohugo.io/templates/pagination/)
