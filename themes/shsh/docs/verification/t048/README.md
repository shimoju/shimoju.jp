# T048 macOS Firefox実機確認

2026-09-18、CodexがmacOS 27.0（26A428）のネイティブFirefox 156.0を操作。版はsw_versとアプリのInfo.plistで取得。現行安定版との照合は未実施。対象は固定preview `https://6f52990f.shimoju.pages.dev/`（268bbb0）。PlaywrightのFirefoxとは別の実機結果。

## 使用フォント

開発者ツールのインスペクターで選択要素を確認し、「フォント」の使用中のフォントを取得した。CSS候補名だけの記録ではない。SFの表示は可変フォントの`.SF NS / System Font`で、Weight軸を併記する。日本語見出しのSFは見出しリンクの記号を含む可能性があるため、日本語グリフのSF使用を意味しない。

| 対象                              | 使用フォント             | サイズ・太さ          | 証拠                             |
| --------------------------------- | ------------------------ | --------------------- | -------------------------------- |
| About サイト名                    | .SF NS / System Font     | 32.8125px・wght 300   | site-name-fonts.txt              |
| About h1                          | .SF NS / System Font     | 27.1875px・wght 500   | heading-en-fonts.txt             |
| About プロフィールh2              | Hiragino Sans W4、.SF NS | 24.75px・wght 500     | heading-ja-fonts.txt             |
| About 最初の本文p                 | Hiragino Sans W3、.SF NS | 17px・wght 400        | body-fonts.txt                   |
| About 業務経験th                  | Hiragino Sans W6         | 15.4688px・700        | table-fonts.txt、table-fonts.jpg |
| About :nicetry:のインラインコード | Menlo Regular            | 0.85em・400           | inline-code-fonts.txt            |
| 開発環境記事 最初のコード         | Menlo Regular            | 14px・行高19.6px・400 | block-code-fonts.txt             |
| 開発環境記事 最初のstrong         | .SF NS / System Font     | 17px・wght 700        | strong-fonts.txt                 |

最初の検索で誤った要素が選択された取得は採用せず、CSSセレクターと選択中のパンくずを照合し直した。検査中の一時的なDevTools変更はリロードで解除してから再取得した。和文コードの実フェイスは未確認。

## 表示・操作

- Aboutのダーク→ライトを操作し、サイト名・ナビ・見出し・和欧文本文の表示を確認。about-dark.jpg、about-light.jpg。
- ライトを維持して開発環境記事へ移動できた。
- 実記事最初のCopy codeをクリックし「Code copied.」を確認。外部送信のない一時ローカルHTMLのtextareaへネイティブCmd+Vで貼り付け、入力値と記事Markdownのコード235文字が完全一致。clipboard.jsonには一致結果だけを保存し、クリップボード内容は出力しない。一時タブとHTMLは削除。
- Firefoxの表示→ズーム→拡大を使い、アドレスバーの200%表示を確認。途中の170%と200%の本文、および200%ダークのタイトル・ナビ・カバーを目視。観察範囲で文字の欠け・重なりなし。article-170-light.jpg、article-200-light.jpg、article-200-dark.jpg。これはページズームであり、既定文字サイズ変更の検証ではない。コード全体・表の200%確認には一般化しない。
- 終了時に200%リセットをクリックして倍率表示の消失を確認。配色を初期のダークへ戻し、専用タブを閉じた。

## 未確認・制約

viewport・DPRのコンソール測定はFirefoxの貼り付け保護警告で止まったため未取得。警告は解除せず、コンソールからの検証は実行していない。画像寸法をCSS viewportと扱わない。

和文コード、既定文字サイズ変更、キーボード操作の一式、動画・外部埋め込み、JS無効を含むFirefox全体の詳細項目は残る。Windows・モバイル・Safari・Chromeに本結果を一般化しない。T015の全体判定は未合格のまま。
