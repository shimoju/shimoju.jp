# T040 iPhoneのコードコピー初回タップ

ユーザーのiPhone 17 / iOS27実機報告を[iphone-report.json](iphone-report.json)に記録した。ホーム/About/Archivesの両配色、画像・動画・回転に別の問題の申告はない。共有無効・スター非表示はQ33のpreview仕様に一致。フォント・拡大・コピー内容の厳密一致等へ合格範囲を広げない。

新しい回帰検査で、コードをタップ→表示済みボタンを1回tapする手順をWebKitで再現した。従来のタッチ検査は表示・解除だけだった。

- 修正前: Chromium/Firefox成功、WebKit失敗。clipboard呼び出し0回。
- イベント順: svgのpointerdown/up → mousedown → preのfocusout(relatedTarget=null) → divのclick。Safariではボタンへフォーカスが移らず、focusout処理が表示を解除してクリックが外れる。
- 修正: 直前のpointerdownがtouchだった場合だけ、ボタンの互換mousedownの既定動作を抑止。コピー処理はclickに維持し、マウスとキーボードは既存の動作を保つ。タップ開始時にはコピーしない。見た目・凍結モックは変更なし。
- 検証: 回帰検査は3エンジン成功。再表示後の初回タップも確認。prose全21件成功(11.3s)、マウス/キーボード・失敗再試行・解除・組版/axeを含む。typed lint・整形・進捗JSON検査成功。

[Pointer Events仕様](https://www.w3.org/TR/pointerevents3/#compatibility-mapping-with-mouse-events)ではタッチの互換マウスイベントとclickを区別している。実装は互換mousedownによるblurを抑止する。最初にpointerdown自体をキャンセルする案を試したが、検証WebKitでclickが来なかったため採用していない。

これはPlaywrightでの修正検証であり、iPhone実機の合格ではない。T041の修正previewでユーザーによる再確認を待つ。F021はopenを維持する。
