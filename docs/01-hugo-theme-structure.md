# 1. Hugoテーマに必要な画面とテンプレート

前提とバージョンは[技術情報の前提](README.md#技術情報の前提)を参照。ここでは「Hugoが描画するために必要なもの」と「このブログで実装するもの」を区別する。

対象画面をHugoテンプレートへ対応付ける。表示項目と画面幅の詳細は[資料4の合意済み視覚要件](04-theme-visual-requirements.md)を参照する。

## 必須の考え方

Hugoテーマに、必ず個別実装しなければならない固定数の画面はない。有効なページ種別・出力形式に対応するテンプレートが必要になる。共通の`all.html`だけで広くHTMLを描画することも可能だが、記事と一覧を分けるブログなら`single.html`と`list.html`が実用上の出発点になる。`baseof.html`は共通枠を再利用する仕組みであり、それだけでは記事本文を描画するテンプレートにならない。[新テンプレートシステム](https://gohugo.io/templates/new-templatesystem-overview/)、[テンプレートの種類](https://gohugo.io/templates/types/)

`theme.toml`、README、LICENSE、スクリーンショット、サンプルサイトは配布・利用案内のためのもの。`theme.toml`を置くだけでページが描画されるわけではない。自分のサイト専用ならルートの`layouts/`と`assets/`から始めてもよく、再利用するテーマとして切り出す場合は`themes/<テーマ名>/`にまとめ、サイト設定の`theme`で選ぶ。[ディレクトリ構成](https://gohugo.io/getting-started/directory-structure/)

## 実装する画面

検索・Profile・目次は実装しない。各ページは共通枠と本文・一覧部品を再利用する。

| 優先度 | 画面・URL例 | HugoのKind / 主なテンプレート候補 | モックに含める内容 |
| --- | --- | --- | --- |
| 必須 | ホーム `/` | `home` / `home.html` → `list.html` | 現行設定の紹介文、記事一覧、ページ送り。紹介は初ページのみ、SNSリンクは共通フッター |
| 必須 | 記事詳細 `/2026/09/01/development-environment-2026/` | `page` / `posts/page.html`、`page.html`、`single.html` | タイトル、公開日・更新日、本文、コード、画像、タグ、前後記事、共有・スター |
| 必須 | 固定ページ `/about/` | `page` / `page.html`、`single.html`、独自`layout` | 現行のプロフィール本文を維持する。日付・共有・はてなスターを表示し、タグ・前後記事は表示しない |
| 必須 | セクション一覧 `/posts/` | `section` / `section.html` → `list.html` | 見出し、説明、記事一覧。ホームとは紹介部分が異なる |
| 必須 | タグ・カテゴリの一覧 `/tags/`、`/categories/` | `taxonomy` / `taxonomy.html` → `list.html` | 分類名と件数。記事カードの一覧とは異なる |
| 必須 | 個別タグ・カテゴリ `/tags/hugo/`、`/categories/技術/` | `term` / `term.html` → `list.html` | 分類見出し、その分類の記事、ページ送り |
| 必須 | 年月別アーカイブ `/archives/` | `page` + `layout: archives` / `archives.html` | 年月・タイトル・日付。Hugo固有のKindではない |
| 必須 | 404 | `404` / `404.html` | 見つからないことの説明、ホーム等への復帰導線 |
| 状態として必須 | 一覧2ページ目以降 `/page/2/` 等 | 元の一覧と同じテンプレート | 初ページのみの紹介を消す、前後リンクの端の状態 |

上表の矢印は同じ配置・言語・HTML形式で見た代表的フォールバック。実際にはページパス、独自`layout`、`type`等も選択に影響する。`taxonomy`は「タグ全体」、`term`は「特定タグの記事一覧」で、v0.146以降の`taxonomy.html`は`term`用を兼ねない。[新テンプレートシステム](https://gohugo.io/templates/new-templatesystem-overview/)

404のHTML生成と、存在しないURLにHTTP 404を返す設定は別。後者は配信環境で確認する。[404テンプレート](https://gohugo.io/templates/404/)

### 画面ごとの状態・部品

別画面を増やすより、以下を同じモックのバリエーションとして用意すると実装時の見落としを減らせる。

| 対象 | 確認する状態 |
| --- | --- |
| 共通枠 | 400px／1280px、追加320px／360px／768px、light/dark、メニューが横幅を超える場合、長いサイト名、キーボードフォーカス |
| 記事一覧 | 0件・1件・多数、長い日本語タイトル、要約なし、カバーあり／なし、先頭／途中／最終ページ |
| 記事本文 | H2〜H6、段落、強調、リンク、引用、入れ子リスト、タスクリスト、表、脚注、区切り、長いURL |
| コード | 言語あり／なし、インラインコード、長い行、行番号、強調行、コピー成功／失敗、light/dark |
| 画像・埋め込み | 横長／縦長／小画像、alt・caption、リンク付き画像、本文最上部の大画像、動画、SNS・Speaker Deck、取得失敗 |
| メタ情報 | 複数タグ、長いタグ、Aboutの日付・共有・スター、更新日の表示条件、下書きプレビュー、共有ボタンの折り返し |
| アクセシビリティ | 200%拡大、Tab操作、フォーカス表示、reduced motion、JS無効でも記事を読める、画像が読み込めない |

具体的な手順とモックの検査コマンドは[資料6](06-theme-validation.md)を参照する。

## HTML画面以外の成果物

| 成果物 | 自作が必要か | 決めること |
| --- | --- | --- |
| RSS `index.xml` | Hugo内蔵あり。要件に応じ上書き | PaperModの対象範囲・除外条件を維持。home/section/taxonomy/term、要約・件数無制限、既存URL・自動検出 |
| `sitemap.xml` | Hugo内蔵あり | 公開対象、除外、更新日の由来 |
| `robots.txt` | `enableRobotsTXT: true`で生成可能 | 本番とプレビューの方針。noindexとは別 |
| CSS/JS | テーマ側で作る | 共通／画面別の分割、minify、fingerprint、読み込み方法 |
| favicon等 | 元画像とリンクを用意する | 種類・サイズ。テーマのHTMLだけでは実画像は生成されない |
| リダイレクト | Hugoの`aliases`等を利用可能 | 既存URLの維持、配信側の301/308等との使い分け |

根拠: [RSS](https://gohugo.io/templates/rss/)、[sitemap](https://gohugo.io/templates/sitemap/)、[robots.txt](https://gohugo.io/templates/robots/)、[出力形式の有効化](https://gohugo.io/configuration/outputs/)。PaperMod固有の出力は[資料3](03-papermod-analysis.md)を参照。

## 推奨ディレクトリ構成

最初から全ファイルを作る必要はない。以下は拡張時の置き場所を含めた設計例。

```text
themes/my-theme/
├── theme.toml                 # 配布メタデータ・対応バージョン
├── README.md / LICENSE
├── archetypes/default.md     # 新規記事のfront matter雛形（任意）
├── assets/
│   ├── css/main.css           # Hugo Pipesで処理するソース
│   └── js/main.js
├── static/                   # そのまま配信するファイル
├── i18n/ja.yaml              # UIラベル（多言語化する場合）
└── layouts/
    ├── baseof.html           # 共通HTML枠
    ├── home.html             # ホーム固有部分が必要なら
    ├── single.html           # 記事・固定ページの共通フォールバック
    ├── list.html             # section・term等の共通フォールバック
    ├── taxonomy.html         # タグ／カテゴリ自体の一覧
    ├── archives.html         # 独自layout
    ├── 404.html
    ├── posts/page.html       # 記事と固定ページを分ける場合
    ├── _partials/
    │   ├── head.html
    │   ├── header.html
    │   ├── footer.html
    │   └── post-card.html
    ├── _markup/
    │   ├── render-image.html
    │   ├── render-heading.html
    │   └── render-codeblock.html
    └── _shortcodes/
        └── video.html
```

`assets/`は変換・結合の対象として取得する場所、`static/`は基本的にコピーする場所。`content/`は通常サイト側に残す。記事と画像を一緒に持つ`index.md`のleaf bundleと、セクション等の説明を持つ`_index.md`のbranch bundleを区別する。現在の記事は`content/posts/YYYY/MM/DD/<slug>/index.md`形式で、出力URLは`hugo.yml`のpermalinksにより決まる。[ディレクトリ構成](https://gohugo.io/getting-started/directory-structure/)、[Page bundles](https://gohugo.io/content-management/page-bundles/)

## テンプレートの基本と最小例

Go templateでは`{{ ... }}`内に処理を書く。`.`は現在のコンテキストで、`range`・`with`の内側で変わる。`$page := .`のように元のPageを保存できる。`partial "name.html" .`はコンテキストを渡して部品を呼び出す。`{{-`・`-}}`は隣接空白を除去するもので、HTML/CSSのminifyとは別。[テンプレート入門](https://gohugo.io/templates/introduction/)

以下の4ファイルは、構文と一覧／詳細の分離を示す小さなサンプル。CSS、SEO、メニュー、404等は別途追加する。ルートの`layouts/`またはテーマの`layouts/`に同名で配置する。

### `layouts/baseof.html`

```go-html-template
<!doctype html>
<html lang="{{ site.Language.Locale }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ if not .IsHome }}{{ .Title }} | {{ end }}{{ site.Title }}</title>
</head>
<body>
  <a href="#main">本文へ移動</a>
  <header><a href="{{ site.Home.RelPermalink }}">{{ site.Title }}</a></header>
  <main id="main">{{ block "main" . }}{{ end }}</main>
</body>
</html>
```

### `layouts/single.html`

```go-html-template
{{ define "main" }}
  <article>
    <h1>{{ .Title }}</h1>
    {{ if not .Date.IsZero }}
      <time datetime="{{ .Date.Format "2006-01-02T15:04:05Z07:00" }}">
        {{ .Date.Format "2006/01/02" }}
      </time>
    {{ end }}
    {{ if and (not .Lastmod.IsZero) (ne (.Date.Format "2006-01-02") (.Lastmod.Format "2006-01-02")) }}
      <span lang="en">Updated <time datetime="{{ .Lastmod.Format "2006-01-02T15:04:05Z07:00" }}">{{ .Lastmod.Format "2006/01/02" }}</time></span>
    {{ end }}
    {{ .Content }}
  </article>
{{ end }}
```

### `layouts/list.html`

```go-html-template
{{ define "main" }}
  <h1>{{ .Title }}</h1>
  {{ .Content }}
  {{ $pages := .Pages }}
  {{ if .IsHome }}
    {{ $pages = where site.RegularPages "Section" "posts" }}
  {{ end }}
  {{ $pager := .Paginate $pages }}
  {{ range $pager.Pages }}
    <article>
      <h2><a href="{{ .RelPermalink }}">{{ .LinkTitle }}</a></h2>
      <p>{{ .Summary | plainify }}</p>
    </article>
  {{ else }}
    <p>記事はまだありません。</p>
  {{ end }}
  {{ if gt $pager.TotalPages 1 }}
  <nav aria-label="ページ送り">
    {{ with $pager.Prev }}<a href="{{ .URL }}">前のページ</a>{{ end }}
    {{ with $pager.Next }}<a href="{{ .URL }}">次のページ</a>{{ end }}
  </nav>
  {{ end }}
{{ end }}
```

### `layouts/taxonomy.html`

```go-html-template
{{ define "main" }}
  <h1>{{ .Title }}</h1>
  <ul>
    {{ range .Data.Terms.Alphabetical }}
      <li><a href="{{ .Page.RelPermalink }}">{{ .Page.LinkTitle }}</a> ({{ .Count }})</li>
    {{ end }}
  </ul>
{{ end }}
```

この例の`list.html`はhome/section/termを担当し、taxonomyだけ別にする。`.Pages`は子セクション等も含み得るので、実サイトの一覧対象は`.RegularPages`、`.RegularPagesRecursive`等との違いを確認して決める。

この最小例は記事・About共通の日付表示と、分類名順の一覧を示す。共有・はてなスター、記事のタグ・前後記事は[視覚要件](04-theme-visual-requirements.md)に従って組み込む。

`define`を使う子テンプレートには、`define`、空白、Go templateコメント以外を外側に置かない。外側に通常のHTMLを書くとbase templateが適用されない。HTMLの出力はコンテキストに応じてエスケープされるため、`safeHTML`等は信頼できるHTMLに限定する。[テンプレートの種類](https://gohugo.io/templates/types/)、[テンプレート入門](https://gohugo.io/templates/introduction/)

### 実装時に決めること

- 一覧のフィルタとソートを決めてから`.Paginate`を呼ぶ。同じページで最初に作られたPaginatorはキャッシュされる。headとmainで異なる条件のPaginatorを先に作らない。[Pagination](https://gohugo.io/templates/pagination/)
- 特定ページを独自表示にするならfront matterに`layout: archives`等を置く。`type`はコンテンツ型、`Kind`はhome/page/section等で別概念。Archivesという新Kindは作らない。
- Markdownの標準画像・見出しを一括変更するならrender hook、著者が明示的に呼び出す動画・埋め込みならshortcode、テンプレート間の共通部品ならpartialを選ぶ。[画像render hook](https://gohugo.io/render-hooks/images/)、[Shortcode templates](https://gohugo.io/templates/shortcode/)
- shortcodeの`{{< name >}}`はHTMLとして扱う用途、`{{% name %}}`は出力をMarkdown処理に参加させる用途。`.Get`で引数、`.Inner`で囲まれた内容を取得する。内部のMarkdown処理をどちらで行うか決め、二重レンダリングを避ける。[Shortcodes](https://gohugo.io/content-management/shortcodes/)
- `partialCached`は描画時間を短縮するが、ページ・設定など出力に影響する値をキャッシュキーに含める。言語ごとのSiteキャッシュはHugoが分離する。まず通常のpartialで正しく動かし、必要なら計測して最適化する。[partials.IncludeCached](https://gohugo.io/functions/partials/includecached/)
- 同一テンプレートパスのサイト側ファイルでテーマを上書きできる。ただし汎用テンプレートをサイト側に置いても、テーマ側のより具体的なパスまで必ず上書きするわけではない。現在の`layouts/_partials/share_icons.html`等の上書きを移行時に棚卸しする。[Lookup order](https://gohugo.io/templates/lookup-order/)

## 実装の完了確認

1. 必須画面をモバイルとデスクトップで作り、記事本文の部品一覧を用意する。ライト／ダークの両配色を確認する。
2. 実記事を流し込み、既存パーマリンク・画像・`video`/`x`/`youtube` shortcode・生HTML埋め込みを維持する。
3. home/section/taxonomy/term/page/404と、複数ページの一覧を実際に生成する。テンプレート不足・重複出力・非推奨APIの警告を確認する。
4. RSS・sitemap・robots・canonical・OGPの内容を確認し、公開URLとプレビュー方針を整合させる。
5. キーボード・拡大表示・JS無効・画像と外部サービスの失敗時を確認する。
6. [資料3の性能確認](03-papermod-analysis.md#性能の確認)でPaperModと比較する。

これらは自作テーマ実装時の受け入れ条件とする。
