# Macの追加実機確認（T050）

2026-09-18、CodexがCUAのネイティブアプリ操作で確認。対象は固定preview `https://6f52990f.shimoju.pages.dev/`、テーマのコミットは `268bbb0ef102f1379efbcfb62f53d2e643a7c79e`。macOS 27.0（26A428）、Chrome 153.0.8010.53、Safari 27.0（22625.1.29.11.27）。現行安定版との照合は未実施。

## Chromeの実フォント（詳細手順3）

Aboutと開発環境記事の対象要素をDevToolsで選択し、ComputedのRendered Fontsを取得した。候補のfont-familyとは区別する。各 `chrome-*-fonts.txt` に選択要素・計算値・PostScript名・グリフ数を保存した。

| 対象                    | weight | 実フォント                                            | 証拠                                      |
| ----------------------- | ------ | ----------------------------------------------------- | ----------------------------------------- |
| About本文               | 400    | 和文Hiragino Sans W3、欧文.SF NS                      | [本文](chrome-body-fonts.txt)             |
| サイト名                | 300    | .SF NS（wght300）                                     | [サイト名](chrome-site-name-fonts.txt)    |
| About h1                | 500    | .SF NS（wght500）                                     | [欧文見出し](chrome-heading-en-fonts.txt) |
| プロフィールh2          | 500    | Hiragino Sans W4                                      | [和文見出し](chrome-heading-ja-fonts.txt) |
| 業務経験th              | 700    | Hiragino Sans W6                                      | [表見出し](chrome-table-fonts.txt)        |
| 記事の最初のstrong      | 700    | .SF NS（wght700）                                     | [強調](chrome-strong-fonts.txt)           |
| 記事コード最初の行      | 400    | Menlo-Regular                                         | [欧文コード](chrome-code-fonts.txt)       |
| `# ctrl-s: herdrを起動` | 400    | 欧文Menlo-Italic、和文MoralerspaceArgonHWJPDOC-Italic | [和文コード](chrome-code-ja-fonts.txt)    |

コードは14px・行高19.6px。和文を含むコメントはハイライトによる斜体。ブラウザの固定幅フォント設定はMoralerspace Argon HWJPDOCだった。選択した要素の結果として扱う。

## Chromeの文字設定変更（詳細手順4）

`chrome://settings/fonts` で既定文字サイズを16から32へ変更。ページズームは変更していない。本文は17pxから34px、rootは10pxから20pxになった。[設定前](chrome-font-setting-before.txt)・[32の設定](chrome-font-setting-32.txt)・[計算値](chrome-32-metrics.txt)を記録。

Aboutのナビ・見出し・本文（ダーク）、表（ライト）、実記事のコード（ライト）で重なりや欠けは見られなかった。[About](chrome-about-32.jpg)・[表](chrome-table-32-light.jpg)・[コード](chrome-code-32-light.jpg)。page/2の測定ではページ全体の横溢れなし。測定時はInspectorが開いており、CSS viewport 855×688、DPR 2。[環境値](chrome-environment.txt)のvisualViewport.scaleは1だが、ページズーム設定値そのものの証拠とはしない。

終了時に既定文字サイズ16、最小文字サイズ0へ戻した（[復元](chrome-font-setting-restored.txt)）。配色もダークへ戻し、専用タブを閉じた。全ページ・両配色の拡大確認へは一般化しない。

## SafariとChromeのJS無効（詳細手順8）

SafariはInspectorのデバイス設定、ChromeはDevToolsのコマンドメニューからJavaScriptを無効にし再読み込み。本文・コード、ナビ、ホームの一覧・RSSリンクが表示され、Nextで `/page/2/` へ移動できた。SafariではAboutからArchivesへのナビ遷移も確認した。記事の配色ボタンとコピーボタンは非表示。

証拠は `safari-nojs-*` と `chrome-nojs-*`。RSSはリンクの存在と `/index.xml` への参照を確認した範囲であり、RSSリーダーへの登録試験はしていない。

JSを有効へ戻し再読み込み後、配色ボタンが再表示された（[Safari復元](safari-js-restored.txt)、[Chrome復元](chrome-js-restored.txt)）。専用タブとInspectorを閉じた。

## Safariの未確認事項

実フォント欄では和欧文の実フェイスを取得できなかった（[パネル](safari-font-panel.jpg)）。CSS候補から推定して合格にしない。

動画はネイティブの再生ボタン操作後に一時停止ボタンが表示された。診断値では再生中、14.44秒、readyState 4、動画寸法1440×1076、errorなし（[診断](safari-media-diagnostic.json)）。ただし[取得画像](safari-video-capture.jpg)では動画領域の描画を確認できず、映像の視認・停止操作を含む全体は未確認。画面取得の制約か表示の問題かを判定できていない。

Safariの文字拡大、各ブラウザのキーボード操作一式、外部埋め込み、Firefoxの追加確認は今回未実施。T050/T015は未完了を維持する。Chromeの追加フォント取得によりT028/T031の限定範囲は確認済み。
