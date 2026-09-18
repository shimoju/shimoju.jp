# R001: 代表画面と共通設計のレビュー

ホーム・一覧・実記事・本文部品の共通設計を確認するための提出資料。対象はT004〜T009と、比較で検出した是正T019。**承認後にT010の残りの画面へ展開する段階であり、移行完了の確認ではない。**

[実装とモックを並べた比較ページ](http://127.0.0.1:4184/r001/)を開く。止まっている場合は`themes/shsh`で`pnpm review`を実行する。サーバーは127.0.0.1だけで待ち受ける。[比較HTML](r001/index.html)と画像はリポジトリにも保存している。

## 確認していただきたい範囲

1. サイト名・ナビ・配色ボタン、本文と見出し、一覧のタイトル・日付・要約・カバーの関係がモックを維持しているか。
2. PC／モバイル・ライト／ダークで、本文・画像・コード・表・共有の読みやすさに修正したい点がないか。
3. 下記の役割分担と共通化を、残りの画面へ展開する土台として承認できるか。

## 表示と操作の確認

macOS 27.0 arm64、Playwright 1.63.0（Chromium153／Firefox155／WebKit26.6）、Hugo0.166.0、Node24.21.0、pnpm12.4.1で確認した。画像はChromiumで撮影。PCは1440×1000・hoverあり、モバイルは390×844・タッチ・hoverなし、DPRは1。OS・フォントは同一環境で比較している。実機SafariやWindows等での確認を代替するものではない。

- 統合検査84件が成功。その後、390pxの提出用条件をタッチ入力へ揃えて代表画面12件を3エンジンで再検証し、すべて成功した。
- ホーム／一覧の共通枠・カード・ページ送り・フッター、および2026年の実記事のヘッダー／全本文ブロックの位置・寸法は、モックとの差0.06px未満。
- 125%／200%の文字拡大でページ全体の横あふれなし。コードと表は局所スクロールを保つ。これはルート文字サイズを変えた検証で、実機のOS／ブラウザ設定は後続工程で扱う。
- 配色の初期適用・保存・OS追従、コピーの成功／失敗／復帰、Tab／Escape／タッチ、ページ送り、JS無効、画像の候補／形式／寸法、共有URL、スター取得失敗、previewの操作・通信停止を検証した。
- axeで検出された違反は、公式Chroma内の合意済みコントラスト例外に限定した。例外の対象ノードは比較画像に添えたevidence JSONに記録している。

[統合ログ](t019-check.log)／[タッチ条件での代表比較ログ](t009-review.log)／[代表画面の検査](../../tests/review.spec.ts)／[メディアの検査](../../tests/media.spec.ts)／[共有の検査](../../tests/sharing.spec.ts)

## 共通化の構造

| 役割                     | 所有箇所                                                                                               | 一緒に変わる範囲                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 基礎尺度と役割別トークン | [tokens.css](../../assets/css/tokens.css)                                                              | 本文起点の文字・余白、remの操作寸法、役割別行高、Latte/Mochaの色             |
| 共通枠                   | [layout.css](../../assets/css/layout.css)、header/footer partial                                       | 最大720px・左右余白、サイト名・ナビ、フッターの配置                          |
| 操作領域とアイコン       | [controls.css](../../assets/css/controls.css)、icon partial                                            | 配色・コピーの小操作、プロフィール・共有の48px操作と24px図柄                 |
| 記事集合・要約・日付     | posts/summary/date/local-time/dates partial                                                            | home/listの新着順、公開パスによる同日時順、明示summary→more→自動、サイト暦日 |
| 一覧                     | [list.css](../../assets/css/list.css)、post-list/pagination partial                                    | 同じカード構造、日付・要約、先頭カバー、Prev/Next方向                        |
| 本文・コード             | [prose.css](../../assets/css/prose.css)、[code.css](../../assets/css/code.css)、各render hook、copy.ts | 見出し・段落・引用・表・脚注、ラベル・行番号・強調・コピー状態               |
| 画像・動画               | media.css、media partial群、image/link hook、figure/video/speakerdeck shortcode                        | cover/Markdown/figureの解決・変換・寸法・比率、原形式境界、動画の著者寸法    |
| 共有・反応               | sharing.css、sharing-config/share-link/engagement/sharing-head、sharing.ts                             | 設定からの順序・URL・スター有効化、JS無効と失敗時、preview停止               |

同じ数値であっても、body／heading／label／table／codeの行高、本文組版とUI寸法は役割を分けている。CSSを分割してもHugo Pipesで結合し、本番はminifyとfingerprintを行う。配色の初期適用はhead内の同期スクリプト、コピーとスターは別の遅延実行で、初期描画との責務を混ぜない。

`single.html`はヘッダー・日付・カバー・本文・共有を組み立てる。画像データ生成とHTML出力を分け、カバー／Markdown／figureで処理を複製しない。SNS画像への適用はT011で同じ解決規則を使う予定。記事集合・日付・要約も、T010/T011のArchives・前後記事・RSSで共有する。

## 合意済みの差分と内部是正

- 小さい画像は原寸までとする（資料4 Q32）。モックのカバーwidth:100%をそのまま小画像へ広げない。複数幅、PNG可逆WebP／JPEG WebP品質80、lazy/eager、寸法と元比率を付与する。画素変換の透明部分の丸めは[メディア検証](media.md)で圧縮方式と分けて記録した。
- 配色はpref-themeを使い、モック専用queryや保存キーを採用しない（Q25）。JS無効でも本文・ナビ・購読を利用できる。
- 設定・記事集合・要約・日付・公開URLをHugoから生成する。モックの仮URL・固定件数・診断UIは本番機能にしない。
- previewはnoindex、共有ボタンは操作不可、スターは読み込まない（Q33）。本文埋め込みすべてを止めるものではない。
- 図柄や表示を変えず、ARIA名を持つ枠のgroup化、合法なHugo脚注ID、表のスクロール名、コード番号除外などの内部構造を是正した。
- 今回の比較で見つかった単独Markdown画像の余白とCSS重複はF008/F009・T019で修正済み。[詳細](representative-corrections.md)

## 今回の比較に含めないもの

- 記事末尾のタグ／前後記事、About／Archives／分類／404等の全画面展開はT010。実記事画像の末尾は、この未実装分だけモックと異なる。
- 本文部品は、モック専用のpadding比較・フォント診断を除外し、生HTMLの入力をMarkdown／figureへ変換した。通常の固定ページとして共有枠も表示するため、全体の高さはモックと一致しない。部品の外観・境界条件を確認する対象で、全体座標の一致は要求していない。
- 外部Xは固定shortcode、スターは比較撮影時に空の固定応答を使う。公式ウィジェットの実接続・実表示・アクセシビリティはT017で確認する。投稿・スター追加は行っていない。
- RSS・canonical/OGP/構造化データ等はT011。既存サイトの設定・全コンテンツ移行はT012以降。移行照合、実機、性能、Cloudflare Pagesでの配信検証も未完了。本番PaperModと凍結モックは維持している。

## 画像への直接リンク

### ホーム

| 条件           | shsh                                         | 凍結モック                                   |
| -------------- | -------------------------------------------- | -------------------------------------------- |
| 1440px・ライト | [画像](r001/images/home-1440-light-shsh.png) | [画像](r001/images/home-1440-light-mock.png) |
| 1440px・ダーク | [画像](r001/images/home-1440-dark-shsh.png)  | [画像](r001/images/home-1440-dark-mock.png)  |
| 390px・ライト  | [画像](r001/images/home-390-light-shsh.png)  | [画像](r001/images/home-390-light-mock.png)  |
| 390px・ダーク  | [画像](r001/images/home-390-dark-shsh.png)   | [画像](r001/images/home-390-dark-mock.png)   |

### 一覧

| 条件           | shsh                                          | 凍結モック                                    |
| -------------- | --------------------------------------------- | --------------------------------------------- |
| 1440px・ライト | [画像](r001/images/posts-1440-light-shsh.png) | [画像](r001/images/posts-1440-light-mock.png) |
| 1440px・ダーク | [画像](r001/images/posts-1440-dark-shsh.png)  | [画像](r001/images/posts-1440-dark-mock.png)  |
| 390px・ライト  | [画像](r001/images/posts-390-light-shsh.png)  | [画像](r001/images/posts-390-light-mock.png)  |
| 390px・ダーク  | [画像](r001/images/posts-390-dark-shsh.png)   | [画像](r001/images/posts-390-dark-mock.png)   |

### 実記事

| 条件           | shsh                                            | 凍結モック                                      |
| -------------- | ----------------------------------------------- | ----------------------------------------------- |
| 1440px・ライト | [画像](r001/images/article-1440-light-shsh.png) | [画像](r001/images/article-1440-light-mock.png) |
| 1440px・ダーク | [画像](r001/images/article-1440-dark-shsh.png)  | [画像](r001/images/article-1440-dark-mock.png)  |
| 390px・ライト  | [画像](r001/images/article-390-light-shsh.png)  | [画像](r001/images/article-390-light-mock.png)  |
| 390px・ダーク  | [画像](r001/images/article-390-dark-shsh.png)   | [画像](r001/images/article-390-dark-mock.png)   |

### 本文部品

| 条件           | shsh                                             | 凍結モック                                       |
| -------------- | ------------------------------------------------ | ------------------------------------------------ |
| 1440px・ライト | [画像](r001/images/specimen-1440-light-shsh.png) | [画像](r001/images/specimen-1440-light-mock.png) |
| 1440px・ダーク | [画像](r001/images/specimen-1440-dark-shsh.png)  | [画像](r001/images/specimen-1440-dark-mock.png)  |
| 390px・ライト  | [画像](r001/images/specimen-390-light-shsh.png)  | [画像](r001/images/specimen-390-light-mock.png)  |
| 390px・ダーク  | [画像](r001/images/specimen-390-dark-shsh.png)   | [画像](r001/images/specimen-390-dark-mock.png)   |

[homeの条件・axe記録](r001/images/home-evidence.json)

[postsの条件・axe記録](r001/images/posts-evidence.json)

[articleの条件・axe記録](r001/images/article-evidence.json)

[specimenの条件・axe記録](r001/images/specimen-evidence.json)
