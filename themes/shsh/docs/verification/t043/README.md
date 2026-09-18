# Windows実機報告とコード行高変更（T043）

- 対象: ff52ca6に対するT043差分。実機報告の対象は案内済み211f19d6/05d2064。
- Windows Chrome/Edge: 両配色のホーム・About・Archives、コピー、画像、動画再生停止、Tab、文字拡大に問題なしとの報告。
- Firefox: 見出し500がSegoe UI通常書体になる差異F022は、ユーザーが許容した見送り方針を採用。サイズによる階層を維持する。サイト名300は3ブラウザともLight。
- F023: ユーザー承認によりコード専用トークンを1.3→1.4。インラインコードは変更しない。凍結mockは変更せず、テスト内の比較ページだけにF023を適用する。
- 検証: Playwright Chromium/Firefox/WebKitのprose・全画面比較144件成功（1.9分）。両配色・PC/モバイル幅・125/200%拡大・axe・コピー・JS無効を含む。これはmacOSでの自動検査であり、Windowsの実書体や変更後の実機確認を代替しない。
- 実記事の最初のコードブロックは14px / 19.6px。light/dark画像を目視し、文字の欠け・重なりなし。
- 型付きlint・CSS lint・整形・進捗検査成功。レポート生成は過去のT010証拠を上書きせず.cache/full-review/reportへ保存する。
- 証拠: [実機報告](windows-report.json)、[検査ログ](browser-tests.log)、[行高実測](code-metrics.json)、[light](code-light.png)、[dark](code-dark.png)。
- 配信・CIと新URLの案内はT044。Androidと各環境の詳細実機残件はT015。
