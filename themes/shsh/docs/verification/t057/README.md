# T057 Mac Chromeのキーボード・ローカル動画

2026-09-18、固定preview `6f52990f` / テーマ実装 `268bbb0` をこのMacの実Chromeで確認。環境はT050のmacOS 27.0（26A428）/ Chrome 153.0.8010.53と同じで、今回は版・viewport・DPRの再取得なし。CUAのChrome拡張接続で専用タブを操作した。Playwright検査用ブラウザの結果とは区別する。

## キーボード

- `/about/`を開き、Tabで配色ボタンへ移動。[ダークのフォーカス輪郭](theme-focus.png)を視認し、Spaceで[ライトへ切替](theme-light.png)。
- Tabを3回でArchivesへ、Shift+Tabで[Aboutへ逆移動](nav-reverse-focus.png)。続けてTab→Enterで[Archivesへ遷移](nav-enter.png)。配色も保持された。
- `/2026/09/01/development-environment-2026/`を開き、先頭からTabを12回で最初のCopy codeへ移動。[移動順序](copy-tab-sequence.json)と[フォーカス輪郭](copy-focus.png)を保存した。
- Enterで[Copied / Code copied.](keyboard-copy-result.txt)と[チェック表示](copy-result.png)を確認。貼り付け内容235文字一致はT049/V086の証拠を参照し、今回はキーボードからの実行確認に限定した。

## ローカル動画

同じ記事後半の`Zsh prompt demo`をクリックし、[再生中0:00/0:21の端末映像](video-initial.png)を視認。映像内容が進行した後、動画にフォーカスがある状態でSpaceを押し、[0:13/0:21の再生ボタンと停止映像](video-paused.png)を確認した。AXには再生状態の差分がなかったため、映像とコントロールの画像を根拠にする。

## 終了状態

配色を開始時のダークへ戻し、ボタンの`Switch to light mode`を確認した。専用タブを閉じ、タブ一覧からIDが消えたことを確認した。ブラウザ設定は変更していない。対象ページ・操作に限定した結果で、他のブラウザや他の未確認項目へ一般化しない。
