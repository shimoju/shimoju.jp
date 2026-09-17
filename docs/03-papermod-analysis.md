# 3. PaperModからの移行

移行元の調査対象はPaperMod [`d3768854d00ad003b0a8dbdba254ce9224377a01`][pm-root]、Hugo v0.165.0 Extended。以下はその固定版とサイト設定から確認した注意点であり、全バージョンの挙動を示すものではない。最新の表示・操作仕様は[HTMLモック](../mock/README.md)、責務は[資料2](02-hugo-core-vs-theme.md)を参照する。

## 維持するものと実装の対応

| 移行元 | 自作テーマでの扱い |
| --- | --- |
| postsの`/:year/:month/:day/:slugorcontentbasename/` | 既存URLを維持。contentの物理パスと混同しない |
| 日本語・CJK要約・日付`2006/01/02` | 日本語の要約と実記事を確認。公開日と更新日を区別し、本文に著者名・読了時間・文字数を反復しない |
| Home-InfoとSNSリンク | 現行のホーム紹介文は設定から取得して初ページだけに表示。Aboutは現行本文を維持する。X・Bluesky・GitHub・RSSは共通フッター |
| 一覧・分類・ページ送り | 同じ記事の情報を一つのリンクへ。空・1件・複数ページと端の操作を維持 |
| Archives | 独自layoutで年月・記事タイトル・日付。PaperModは年にPublishDate、月にDateを使うため、移行時は日付基準を明示する |
| カバー・本文画像 | 切り抜きなし。寸法・画像候補・読み込み優先度を入口ごとに設計する |
| 前後記事 | posts内の前後移動。HugoのRelated APIによる関連記事推薦とは別 |
| コードコピー | レンダーフックとClipboard API。行番号なしの本文、失敗処理、読み上げ通知を維持 |
| Mochaのinlineハイライト | `noClasses: false`とLatte／MochaのCSSにする。ライトのコードも正しい配色にする |
| 共有・はてなスター | 記事・AboutにX・Facebook・Bluesky・はてなブックマーク、はてなスターを接続。Xのタグ由来ハッシュタグは付けない |
| RSS | 現行テンプレートの対象範囲・除外条件、home/section/taxonomy/termのRSS、要約・件数制限なし、既存URLと自動検出を維持 |
| 検索・Profile・目次・パンくず・編集リンク・トップへ戻る | 実装しない。未使用のJS・CSSや検索索引を持ち込まない |
| `minify.minifyOutput`、robots生成、pages.dev向けnoindex | サイト・配信側の設定として維持し、本番とプレビューで確認 |

根拠：[現設定](../hugo.yml)、[一覧][pm-list]、[Archives][pm-archives]、[前後記事][pm-nav]、[RSS][pm-rss]。PaperModの機能名だけを新テーマへ移植せず、実際の対象データ・表示条件を確かめる。

## コンテンツとサイト独自処理

- 記事のshortcodeは`video`、`x`、`youtube`を使用する。videoはPaperMod提供、xとyoutubeはHugo内蔵。videoの名前・引数は自作テーマでも維持する。[同梱shortcode][pm-shortcodes]
- Instagram・Speaker Deckなどの生HTML埋め込みがある。`unsafe: true`を無条件にfalseへ変えず、必要ならshortcode等へ移行する。生HTMLはMarkdown画像hookの対象外。[現設定](../hugo.yml)
- [share_icons.html](../layouts/_partials/share_icons.html)のはてなブックマーク・スターはサイト独自。モックでは実サービスに接続しており、本実装でも公開URLと動作を確認する。外部JSのasync読み込みでも通信・処理コスト・レイアウト変動は残る。
- [サイト側partials](../layouts/_partials/)と[上書きCSS](../assets/css/extended/override.css)を棚卸しする。組版調整は新テーマへ統合し、旧PaperModセレクターをそのまま残さない。
- [static/_headers](../static/_headers)のpages.dev向けnoindexは配信機能。テーマを替えても別に管理する。
- PaperModのソースをコピー・改変する場合はMITの著作権・許諾表示を保持する。フッターの表示クレジットとは別。[LICENSE][pm-license]

## SEOの実装と限界

| 項目 | 確認した挙動 | 自作テーマで確認すること |
| --- | --- | --- |
| title | ホームはsite.Title、他はページタイトルとsite.Title | 長い日本語タイトル、一覧のページ番号、重複 |
| description | Description、Summary、サイト説明等を条件で選択 | HTML混入、長さ、固定ページ・分類の説明 |
| canonical | ページ`canonicalURL`があれば使用、それ以外はPermalink | ページ送り、別サイト転載、URL正規化 |
| robots meta | productionまたは`params.env: production`かつrobotsNoIndexでなければindex/follow。それ以外はnoindex/nofollow | 404・検索・プレビューの意図を明示 |
| OGP | ページならarticle、他はwebsite。日付・タグ等、画像のfallbackあり | カバーのある記事だけ画像を指定。固定ページの型はページ用途に合わせる |
| Twitter Cards | 画像ありならsummary_large_image、なければsummary | カバーの有無に応じたカード種別、絶対URL、実際の画像サイズ |
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

## 画像・アセットで見落としやすい点

- PaperModのカバーは条件によりsrcset・寸法を生成するが、本文画像hookはURL解決とlazy指定が中心で、同じ最適化ではない。新テーマはカバー・Markdown画像・figure・生HTMLそれぞれの入口を確認する。[カバー][pm-cover]、[画像hook][pm-image]
- 一覧の先頭カバーもPaperModではlazyになる。実際のLCP候補を計測し、必要ならeager・優先度を調整する。幅・高さの領域確保はlazyとは独立したCLS対策。
- PaperModのCSSはPipesで結合・minify・fingerprintされるが、未使用CSSの自動除去ではない。新テーマに検索・Profile等の不要なコードを含めない。[head][pm-head]
- `rel="preload stylesheet"`を非同期CSSと混同しない。minify、SRI、HTTP圧縮・キャッシュも役割が異なる。詳細は[資料2](02-hugo-core-vs-theme.md)を参照。
- JSON-LDのarticleBodyや多数のSVGはHTMLサイズに含まれる。静的HTMLであることだけを軽量性の根拠にしない。

## 性能の確認

実装後に、固定PaperModの現サイトと自作テーマを同じ記事・画像・表示件数・外部サービスで測る。機能削減による差と処理効率の改善を区別する。モックは外部埋め込みを省略しているため、完成テーマとの同条件の比較対象にはしない。

1. サイト・テーマのコミット、Hugo・ブラウザ・Lighthouse・OS、ビルドと配信の設定を記録する。
2. productionビルドを一時ディレクトリへ出力し、既存URL、本文、画像、埋め込みを確認する。外部取得警告がある場合は、終了コード0でも内容一致を前提にしない。
3. 同じ配信条件・キャッシュ状態で、ホーム、一覧途中ページ、長文コード記事、画像記事、外部埋め込み、About、分類・Archivesを測る。
4. モバイル／デスクトップを分け、複数回の中央値とばらつきで判断する。配色・コピー・スクロール中の動作も別に確認する。
5. LCP・CLS・TBT、HTML/CSS/JS/画像の転送量、選択されたsrcset、長いタスクを記録する。総合スコアだけで退行を見逃さない。TBTを実ユーザーのINPと同一視しない。
6. 実際の404、canonical・OGP・JSON-LD、キーボード・コントラストを別に確認する。性能目標・転送予算はこの結果から決める。

ビルド先を分離する例：

```sh
theme_check_dir=$(mktemp -d /private/tmp/hugo-theme-check.XXXXXX)
HUGO_RESOURCEDIR="$theme_check_dir/resources" hugo \
  --environment production \
  --destination "$theme_check_dir/public" \
  --cacheDir "$theme_check_dir/cache" \
  --noBuildLock --printPathWarnings
```

Lighthouseのラボ値と公開後のPSI／CrUXの実ユーザー値を分ける。公開・実サービス接続は別工程。モック検証では本番相当のLCP・INP・CLSやWCAG適合性は測定していない。[Lighthouse CLI](https://github.com/GoogleChrome/lighthouse#using-the-node-cli)、[PageSpeed Insights](https://developers.google.com/speed/docs/insights/v5/about)

[pm-root]: https://github.com/adityatelange/hugo-PaperMod/tree/d3768854d00ad003b0a8dbdba254ce9224377a01
[pm-list]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/layouts/list.html
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
[pm-license]: https://github.com/adityatelange/hugo-PaperMod/blob/d3768854d00ad003b0a8dbdba254ce9224377a01/LICENSE
