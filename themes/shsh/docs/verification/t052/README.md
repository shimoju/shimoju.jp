# Safariの文字拡大・キーボード・動画確認（T052）

2026-09-18、CodexがCUAのネイティブSafariで確認。環境はmacOS 27.0（26A428）・Safari 27.0（22625.1.29.11.27）。固定preview `https://6f52990f.shimoju.pages.dev/`、テーマのコミット `268bbb0ef102f1379efbcfb62f53d2e643a7c79e`。

## 文字拡大（詳細手順4）

表示メニューの「文字を拡大」を4回実行した。「拡大」（ページ全体）とは別の項目。[拡大前のメニュー](safari-zoom-menu-before.txt)では「実際のサイズ」が無効だった。

Inspectorコンソールの読み取り専用の寸法取得により、本文・段落は17px→35.251202px、rootは10px→20.736pxだった。本文の実測比は約207.36%。[拡大前](safari-size-before.json)・[拡大後](safari-size-enlarged.json)。測定はInspectorを開いたCSS viewport 1432×592、DPR 2で、ページ全体の横溢れなし。

Aboutのダーク配色でナビ・見出し・本文、ライト配色で表、実記事のライト配色でコードを目視し、重なりや欠けは見られなかった。表の長い文字は列内で折り返される。コード内の横スクロールは許容範囲。

- [Aboutとナビ](safari-about-text-enlarged.jpg)
- [表](safari-table-text-enlarged.jpg)
- [コード](safari-code-text-enlarged.jpg)

「実際のサイズ」で復元し、記事で本文・段落17px、root10pxに戻ったことを再測定した（[復元値](safari-size-restored.json)）。全ページの全配色・全倍率を確認したとは扱わない。

## キーボード（詳細手順5）

Safariの設定「Tabキーを押したときにウェブページ上の各項目を強調表示」はオフで、UIの説明は「Option+Tabキーで各項目を強調表示します」だった（[設定抜粋](safari-keyboard-setting.txt)）。設定は変更せず、Option+Tab・Option+Shift+Tabを使った。

- 配色ボタンにフォーカス輪郭が表示され、Spaceでライトからダークへ変わった（[配色フォーカス](safari-keyboard-theme-focus.jpg)）。
- Aboutへ進み、逆方向でサイト名へ戻れることを目視。再度Aboutへ進み、Enterで `/about/` に遷移した（[ナビ](safari-keyboard-nav-focus.jpg)・[逆方向](safari-keyboard-reverse-focus.jpg)・[遷移先](safari-keyboard-nav-result.txt)）。
- 実記事のコード領域とコピーボタンに逆順で移動し、コピーボタンの輪郭を確認。Enterで `Code copied.` が表示された（[コピーのフォーカス](safari-keyboard-copy-focus.jpg)・[通知](safari-keyboard-copy-result.txt)）。今回の確認はキーボードからの実行と通知まで。貼り付け内容の厳密一致はT049/V087の別検証を参照する。

最初のコピー試行ではコード領域にフォーカスが残り、Enterで通知が出なかった。次の見出しから逆順でコード領域・コピーボタンへ移動し、ボタンのフォーカスを目視してから再試行した。最終証拠画像は成功したボタン選択時のもの。

## 動画（詳細手順7）

再生をクリック後にAXの「一時停止」、続けて一時停止をクリック後に「再生」へ戻ることを約5秒の連続操作で確認した（[操作結果](safari-video-actions.json)）。前の単独試行では一時停止クリック後もラベルが変わらず、状態取得間隔も長かったため合格の証拠にしない（`safari-video-playing.txt` / `safari-video-paused.txt`）。

[画面取得](safari-video-capture.jpg)では動画領域が引き続き空白だった。T050の再生中の診断値と今回の操作状態から映像の視認まで断定しない。ユーザーへ実Safariで映像が見えるか・再生停止できるかの確認を依頼中。テーマ側の描画問題か取得側の制約かは未判定。

## 終了状態と残件

文字サイズを復元し、配色は開始時と同じダーク、Inspectorと専用タブを閉じた。キーボード設定は読み取りだけ。コンソール貼り付けは一部ツールのタイムアウトが出たが、入力済みのコマンドを確認してからReturnを押し、同じコマンドを重複して貼り付けなかった。

Safariの実フォント・映像視認・外部埋め込み、Chrome/Firefoxの残る項目は未確認のまま。文字拡大とSafariの上記キーボード操作に確認範囲を限定する。
