# iPhone横回転の文字自動拡大修正（T046）

Android Chromeは報告された表示・コピー・画像・動画・回転に問題なし。iPhone Safariの横回転時の文字拡大はF025として記録した。

[現行WebKitと仕様の調査](research.md)に基づき、bodyへ-webkit-text-size-adjust:100%を復元し、標準名の100%も併記。凍結モックが持つ指定をテーマで落としていたことを是正した。viewportでズームを制限しない。

生成CSSの回帰検査は修正前の欠落を検出し、修正後はproduction/preview/developmentすべて成功。HTMLが参照するCSSを検証対象とする（出力ディレクトリに残る古いハッシュのCSSは対象外）。型付きlint・CSS lint・整形・進捗検査も成功。

Playwright Chromium/Firefox/WebKitの関連54検査が成功（29.4秒）。縦390×844→横844×390→縦の幅変更、100/125/200%の組版拡大、両配色、代表画面比較、コピー等を含む。Mac版WebKitはtext autosizingのプロパティ自体をサポートせず、これを実iPhoneの症状再現・解消の証拠とは扱わない。

証拠: [原報告](mobile-report.json)、[欠落検出](before.log)、[ブラウザ検査](browser-tests.log)。配信・全CI・実機再確認はT047で継続する。
