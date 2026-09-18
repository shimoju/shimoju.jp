# Safariの文字自動拡大と接頭辞（F025 / T046）

調査日：2026-09-18。結論：このテーマでは接頭辞付き100%を復元する必要がある。凍結mock/src/theme.cssのbodyには既に存在するが、テーマbase.cssでは標準名だけに置換されていた。これは新しい文字サイズの設計ではなく、モックのSafari動作の再現漏れ。

- [WebKit現行CSS定義](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/css/CSSProperties.json)：`-webkit-text-size-adjust`を継承するプロパティとして定義し、初期値auto、auto/none/非負の百分率を受理する。標準名へのaliasはない。取得時点のmainを確認したもので、iOS 27のバイナリそのものの検証ではない。
- [WebKit課題229086](https://www2.webkit.org/show_bug.cgi?id=229086)：Unprefix -webkit-text-size-adjustは調査時点でNEW。接頭辞なしだけでSafariへ適用できるとは扱えない。
- [CSSWG仕様草案](https://drafts.csswg.org/css-size-adjust/#adjustment-control)：百分率は自動調整に代えてfont-sizeへ掛ける。100%は自動調整なしと同じ意味。ユーザー操作によるズームを禁止するための値ではない。
- [Apple旧ガイド](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/AdjustingtheTextSize/AdjustingtheTextSize.html)：自動文字調整と接頭辞付きプロパティの目的を説明。2016年の資料なので、現在の対応状況の根拠は上のWebKit定義・課題と併用する。

修正はbodyに接頭辞付き100%を追加し、標準名の100%も維持する。Stylelintはこの1宣言だけ理由付きで例外にする。viewportはwidth=device-width, initial-scale=1のままで、maximum-scaleやuser-scalable制限を追加しない。

ローカルのPlaywrightモバイルコンテキストでCSS.supportsを照合したところ、Chromium153は標準名・接頭辞ともtrueで計算値100%、WebKit（UA Safari26.6）は両方falseで計算値は空だった。このMac版WebKitではiOS固有のtext autosizingを直接試験できない。生成後CSSの両宣言、幅変更と125/200%の組版拡大、既存の表示・操作を自動検査し、実iPhoneの縦→横→縦とページ文字拡大・ピンチズームは別にユーザーへ再確認する。
