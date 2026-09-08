# 7. 書体・palt・余白の第3案

第3案の履歴です。Helvetica系の採用、OS別フォールバック、WindowsのNoto提供状況の補足・訂正は[資料8](08-theme-font-fallbacks.md)を参照してください。

2026-09-07。再レビューの7項目と追加の`palt`指定を、既存の`mock/`へ反映した。構成・収録記事・操作は引き継ぎ、本番テーマや原記事は変更していない。[現行要件](04-theme-visual-requirements.md)、[閲覧方法](../mock/README.md)、[レビュー入口](http://127.0.0.1:4173/)を参照。

## レビューへの対応

| 項目 | 反映した内容 |
| --- | --- |
| 全ページ共通のサイトタイトル | 全ページ34px／32px。記事タイトル27.2px／25.6pxの1.25倍。ホームだけ大きくする条件を削除。ヘッダー上余白も64px／40pxに統一 |
| font-familyの比較 | 基準＋4案。欧文を先に指定し、全案で共通の日本語候補順を使用。Notoを游ゴシック・メイリオより優先 |
| カバーをタイトルの上へ | 共通一覧のDOM順もカバー→文字に変更。切り抜き・高さ制限なし。記事詳細のタイトル→日付→カバーは維持 |
| 中央フッターとリンク集約 | X・GitHub・RSSを1段目、著作権を2段目に配置。ホーム紹介からX・GitHubを除去。Aboutへの導線とAbout内の全リンクは維持 |
| コピーボタンの余白統一 | 言語あり／なしでツールバー上下4px、コピー高さ36px・padding 6px 8px、コード本文上12pxを共通化。ラベルなしでは右寄せのみ変更 |
| ul／olの項目間 | 0.35em→0.15em（2.55px／2.4px）。入れ子リストの前後は0.25em。複数段落を含む項目内も0.35emに抑える |
| インラインコードの余白 | 文字サイズ0.875emを維持。paddingを上下0.1em→0.3em、左右0.3em→0.4emに拡大。行送りは変更しない |
| palt | 本文・見出し・UIに`font-feature-settings: "palt"`。コードは`normal`に戻す。フォントファイルと実ブラウザの両方で確認 |

`cover-position`、`masthead`、`footer`の比較UI・CSS条件・URL適用処理を除去。今回の比較対象は書体であり、採用済みのレイアウトへ戻す選択肢は残していない。

## 書体の比較案と意見

サイズや行高を変えずに読み比べる。分類名は排他的な分類の断定ではなく、比較する表情の目安とする。

| URLのfont値 | 欧文指定（後ろに共通の日本語候補） | 評価の視点 |
| --- | --- | --- |
| baseline／省略 | Helvetica Neue, Segoe UI, Roboto, Arial | 現状との比較基準。控えめな表情 |
| humanist | Trebuchet MS, Segoe UI, Roboto, Arial | 第一候補。欧文のg・Mや数字に個性があり、見出しと技術本文の両方で試しやすい |
| geometric | Avenir Next, Avenir, Century Gothic, Trebuchet MS, Segoe UI, Arial | 丸みと穏やかな印象を試す案。サイト名との相性を重視するなら有力 |
| arial | Arial, Roboto, Segoe UI | 違いを控えめにし、共通性を優先する案。Helveticaからの変化量も比較する |
| grotesque | Franklin Gothic Book, Franklin Gothic, Arial, Roboto | 導入環境を限定する実験案。未導入時はArialへ戻る。Mediumを全本文へ強制して欧文だけ太くする指定は避けた |

おすすめはまずTrebuchet案と基準案の実記事を比較すること。MicrosoftはTrebuchetを画面向けに設計し、HumanistとGeometricの両方の影響を持つ書体と説明している。単純に「Humanistだけ」とは扱わない。[MicrosoftのTrebuchet解説](https://learn.microsoft.com/en-us/typography/font-list/trebuchet-ms)

### OSをまたいだ近さと限界

- TrebuchetはWindowsの提供フォントに含まれ、AppleのmacOS Sequoia向け一覧にもある。Mac／Windowsをまたぐ候補として扱いやすいが、Android・Linuxを含む全端末での導入は保証しない。[WindowsのTrebuchet提供情報](https://learn.microsoft.com/en-us/typography/font-list/trebuchet-ms)、[Appleのフォント一覧](https://support.apple.com/en-us/120414)
- Avenir Next／AvenirはAppleの一覧にある。Century GothicはOfficeでの提供情報があり、Windowsで必ず利用できるOS標準フォントとは扱わない。代替後も同じ幾何学的な印象になるとは保証できない。[Appleの一覧](https://support.apple.com/en-us/120414)、[Century Gothicの提供情報](https://learn.microsoft.com/en-us/typography/font-list/century-gothic)
- Franklin Gothic BookもOfficeなど導入環境に依存する。このMacに該当フォントは確認できておらず、今回のChromeではフォールバック状態として検証する。実書体の採用判断には、導入済み環境での追加確認が必要。[Franklin Gothicの提供情報](https://learn.microsoft.com/en-us/typography/font-list/franklin-gothic)
- 日本語はMacのヒラギノを維持。WindowsではNoto Sans JP／Noto Sans CJK JPがあればそれを使い、BIZ UDPGothic、游ゴシック、メイリオへ続ける。NotoはCSSに書くだけで導入されるわけではない。BIZ UDPGothicも日本語補助フォントの導入状態に依存する。[Windows 11のフォント一覧](https://learn.microsoft.com/en-us/typography/fonts/windows_11_font_list)

Webフォントを配信せず、閲覧者にフォント導入を要求しない条件では、すべてのOSで同じ書体・同じpaltの効果を保証できない。「主候補がある場合の狙い」と「ない場合も読める代替」を分けている。新しいフォントをインストールしたり、モックへフォントファイルを同梱したりはしていない。

## paltの対応確認

`palt`は全角幅を前提とするグリフの配置・送り幅を調整するOpenType機能。括弧・句読点の余白を整えるが、仮名などにも作用し得る。半角英数字やASCII括弧まで一律に詰める仕組みではなく、実際に選ばれたフォントの定義に従う。字形置換の`pwid`とは別の機能。[OpenTypeのpalt仕様](https://learn.microsoft.com/en-us/typography/opentype/spec/features_pt#tag-palt)

確認は次の2段階で行った。

1. `inspect-fonts.mjs`で指定したフォントファイルのnameテーブルとGPOS／GSUBのFeatureListを読み、paltの有無、版、SHA-256を記録。
2. Chromeのレビュー画面で、同じ短文をpalt有効／無効にして実寸を比較。CSSのcomputed styleだけを根拠に「フォントが対応した」とは判定しない。

| フォントと確認した版 | GPOS palt | 判断 |
| --- | --- | --- |
| Hiragino Sans／Hiragino Kaku Gothic ProN W3・W6、20.0d1e1 | あり | このMacの実ファイルを確認 |
| Noto Sans JP、2.004（可変フォント） | あり | Noto公式リポジトリの公開ファイルを確認。nameの既定スタイル名Thinは、可変範囲全体をThinに限定する意味ではない |
| Noto Sans CJK JP Regular、2.004 | あり | Noto公式リポジトリの公開ファイルを確認 |
| BIZ UDPGothic Regular、1.051 | なし | 公開版を確認。プロポーショナルな設計であることと、追加のpalt機能があることは別。palt対応の主候補にはしない |
| Trebuchet MS Regular 5.00x、Arial Regular 5.01.2x、Avenir Next 13.0d1e10 | なし | このMacのファイルを確認。もともとプロポーショナルな欧文なので、paltがないことを不採用理由にはしない |

日本語文字が後続のヒラギノ／Notoで描画されれば、そのフォントのpaltが作用する。欧文候補自身にpaltがある必要はない。フォールバックは半角／全角分類ではなく、文字の収録状況に基づく。[CSS Fontsの選択規則](https://www.w3.org/TR/css-fonts-4/#font-family-prop)

詳細な結果と取得元は[font-features.json](../mock/verification/font-features.json)に保存した。公開版の検査は一時ディレクトリへの取得のみで、OSへのインストール・ブラウザでの読み込み・配信は行っていない。Windows同梱BIZの版はこの公開版と同一とは断定しない。Windowsの游ゴシック・メイリオ、Segoe UI、Officeフォントなどの実ファイルは未確認。

再確認は次のコマンドで、確認したい端末のファイルを明示する。

```sh
node mock/inspect-fonts.mjs /path/to/font.ttf /path/to/font.ttc
```

レビュー入口の同一文`「日本語」、カタカナ。（余白）`では、基準案・17pxで有効192.87px、無効236.64pxを測定した。これはこのMac／Chrome／サンプルの結果であり、全フォントや本文全体の圧縮率ではない。

## 余白に関する判断

サイトタイトルは34px／32pxにして、記事タイトルの1.25倍を両幅で保った。全ページ共通にすることで、ホームから記事へ進んだときにサイトの位置づけが変わらない。

インラインコードは、行高いっぱいまで背景を厳密に広げると、隣接行の背景が接近し、異なるフォントのメトリクスにも影響される。今回は文字を縮めず、上下0.3emで背景と文字の間に余裕を足し、行間の隙間は残した。400pxの部品ページでは背景の高さ約24.89pxに対して本文行高30.4px。paddingあり／なしの3行段落は両方約91.20pxで、paddingによる行送りの増加はなかった。

コードの言語ラベルあり／なしは、どちらもツールバー高さ44px、コピー高さ36pxになった。ラベルなしの余白を削ることより、コードブロックが並んだときの統一感を優先した。

## 検証

既存の静的検査・配色状態テスト・コピー状態テストを更新して実行。33画面・418のローカル参照、Hugoの言語／ファイル名表示、コピーの成功・3秒後の復帰・失敗・再試行が通過した。採用済み比較条件の除去、フッターの順序、一覧カバーのDOM順、paltのコードへの非継承も検査対象に追加した。

Chromeでは全33画面を320・360・400・768・1280pxと両配色、計330条件で確認。追加4書体はホーム・実記事・部品・レビューの4画面を同じ5幅・両配色、計160条件で確認した。合計490条件でページ全体の横あふれ・画像欠落はなく、本文のpalt有効、コードの非継承、共通サイト名サイズ、診断段落の行送り維持も検証した。[第3案のブラウザ検証記録](../mock/verification/browser-checks-v3.json)に保存している。

比較フォームの初期値、配色ボタンとの同期、フォーム送信、Aboutへのキーボード遷移でも条件保持を確認。実コピーの成功表示と復帰、失敗表示、本文色を維持するホバー、2pxのフォーカス輪郭を確認した。代表画面はスクリーンショットでも目視した。全490条件を個別に目視評価したという意味ではない。

Windows／Android／iOSや別ブラウザでの実描画は未確認。ネイティブな200%／400%ズーム、今回の実クリップボードへの貼り付け往復、WCAG適合性は新たに検証したとは扱わない。320 CSS pxでのリフローとネイティブズームは区別する。第2案の記録は[browser-checks-v2.json](../mock/verification/browser-checks-v2.json)へ退避した。
