# 9. コード用フォントと日本語フォールバック

第5案の履歴。2026-09-08にSFMono-Regularを削除し、コードの日本語候補も本文のNoto系へ統一した。現行の指定と前回説明の訂正は[資料10](10-theme-unified-japanese-fonts.md)を優先する。

2026-09-07、第5案。本文・記事見出しのHelvetica系は維持。サイト名だけAvenir Nextを採用し、コード用フォントを再整理した。[現行要件](04-theme-visual-requirements.md)、[モック入口](http://127.0.0.1:4173/)、[日本語コードの診断](http://127.0.0.1:4173/specimen.html#code)を参照。

## 採用する指定と役割

```css
--font-code: "SF Mono", "SFMono-Regular", Menlo, Consolas,
  "Hiragino Sans", "BIZ UDGothic", "Yu Gothic", monospace;
--font-site: "Avenir Next", var(--font-body);
```

| 環境・役割 | 優先 → 代替 | 残す理由 |
| --- | --- | --- |
| Appleの欧文コード | SF Mono（CSSから使える場合）→ Menlo | SF Monoの選択肢を戻す。新しいMacで必ずその名前が解決するとは仮定しない |
| Windowsの欧文コード | Consolas | 日本語候補より前に置き、ASCIIの等幅書体を保つ |
| Appleの日本語コード | Hiragino Sans | 省略せず明示。本文との字形の統一と、日本語候補の予測可能性を優先する |
| Windowsの日本語コード | BIZ UDGothic → Yu Gothic | UDを優先。BIZ未導入時に直ちに汎用monospaceへ落とさないため游ゴシックを残す |
| Android等 | 上記がなければmonospace | AOSPの等幅指定と日本語フォールバックを使う。メーカー・ブラウザ差は許容する |

OS別の表は通常の搭載状況に基づく想定で、OSを検出して分岐するCSSではない。任意導入されたフォントや不足文字によって選択は変わる。CSSは半角／全角ではなく、候補ごとの文字収録状況を見て選択する。[CSS Fontsの選択規則](https://drafts.csswg.org/css-fonts-4/#font-family-prop)

本文用のBIZ **UDP**を外す判断は維持する。コード用のBIZ **UD**は別の役割があり、候補数だけを理由に削除しない。Webフォントやフォントのインストールは不要。

## SF Mono：システム内の実体とCSS名を分ける

SF Monoはコード用途の欧文等幅書体として残す。Appleが示す対応文字体系はLatin・Greek・Cyrillicで、日本語は別フォントが必要。[Apple Fonts](https://developer.apple.com/fonts/)

`"SF Mono"`をファミリー名として先に置く。`"SFMono-Regular"`は個別フェイスのPostScript名で、対応するブラウザ向けの互換候補として残す。両者は別デザインのフォントを増やすための指定ではない。ただしCSS仕様が要求するのはファミリー名による選択であり、PostScript名だけに依存しない。[CSSのファミリーとフェイス](https://drafts.csswg.org/css-fonts-4/#family-vs-face)、[Mozillaの実装上の説明](https://bugzilla.mozilla.org/show_bug.cgi?id=1545350)

今回のMacには`/System/Library/Fonts/SFNSMono.ttf`があり、内部のファミリー名は`.SF NS Mono`だった。この存在だけでは公開名`SF Mono`／`SFMono-Regular`のCSS解決を保証できない。内部名の直接指定は採用せず、利用できなければMenloへ戻す。Menlo・Hiragino Sansの提供は[Appleの一覧](https://developer.apple.com/fonts/system-fonts/)でも確認できる。

`ui-monospace`はOSのUI等幅書体を選ぶ別の方法だが、特定のSF Monoフェイス名ではない。一般ファミリーは複数書体を組み合わせた日本語の代替も含み得るため、今回は明示した和文候補より前に置かない。SF Monoを全Appleブラウザで強制する要件は設けない。[CSSの一般ファミリー](https://drafts.csswg.org/css-fonts-4/#generic-font-families)

## Windows：MS GothicからBIZ UDへ

BIZ UDGothicはWindows 10 version 1809の日本語補助フォントとして導入され、Windows 11でも同区分にある。日本語環境では期待できる候補だが、言語・追加機能の構成に依存するため、すべてのWindowsに必ずあるとはしない。Notoの更新配布とも別経路である。[MicrosoftのBIZ UDGothic情報](https://learn.microsoft.com/en-us/typography/font-list/biz-udgothic)、[Windows 11のフォント一覧](https://learn.microsoft.com/en-us/typography/fonts/windows_11_font_list#japanese-supplemental-fonts)

MS Gothicの問題は「アウトラインがない」ことではなく、小さいサイズで内蔵ビットマップが使われ得ること。Microsoftも小サイズ用の埋め込みビットマップを説明している。今回の意図には合わないため明示指定を外す。[Microsoftの日本語フォント説明](https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/winpe-add-packages--optional-components-reference#winpe-optional-components)、[RicohのTrueType説明](https://industry.ricoh.com/en/-/Media/Ricoh/Sites/industry/font/pdf/built_in/en/TrueType_Ctlg.pdf)

公開版BIZ UDGothic Regular 1.051を検査すると、TrueTypeアウトラインの`glyf`があり、検査対象のビットマップテーブルはなかった。サンプルのASCII・空白・半角カナは0.5em、漢字・かな・括弧・句読点は1emだった。BIZ UDPGothicではなく、この等幅版を指定する。[Morisawa／Google Fontsの公開リポジトリ](https://github.com/googlefonts/morisawa-biz-ud-gothic)

この検査は公開TTF版についてであり、Windows同梱TTCの全バージョンを検査した結果ではない。Windows実機のClearType・表示倍率・96 DPIでの美しさは未確認。BIZ未導入時のYu Gothicも日本語代替としての救済であり、コード全体を游ゴシックにする指定ではない。最終のOSフォールバックや不足文字までMS Gothicの不使用を保証するものでもない。

## Mac：日本語候補は明示する

省略しても日本語は通常OSのフォールバックで表示できる。しかし、そのことと、意図した日本語ゴシック・字幅が選ばれることは別である。このモックでは`Hiragino Sans`を欧文候補の後ろに明示する方がよいと判断した。

ヒラギノ自体は欧文等幅書体ではない。検査したW3では、日本語サンプルはpalt非適用時に1em、半角カナは0.5emだった。欧文は先行するSF Mono／Menloに任せるため、ヒラギノのプロポーショナルなASCIIは通常使わない。Mac専用にOsaka-Monoなど別の候補を追加するより、既に本文で使うヒラギノとの統一感を優先する設計判断である。

部品ページに「日本語候補を明示／省略」の診断を追加した。今回のChrome・400px・13.6pxでは、同じ日本語14文字の幅が明示時176.80px、省略時199.92pxと異なり、欧文21文字のサンプルは両方171.95pxで一致した。少なくとも、この環境で明示を省略しても同じ結果になるわけではない。幅と目視の比較であり、実際に選ばれたフォント名を特定した結果ではない。

## 等幅性と混植の限界

「ASCIIが等幅」「日本語の全角文字が等幅」「日本語1文字＝ASCII2文字」は別条件。フォントを混ぜると3番目は保証できない。例として検査したMenloのASCIIは約0.60205em、ヒラギノの日本語は1emで、比は約1.661倍。BIZ単体の0.5em：1emを、Consolasとの混植にもそのまま適用してはいけない。

コードでは`font-feature-settings: normal`・`font-variant-ligatures: none`を維持し、`font-kerning: none`も明示する。ただし、これらで混植の幅を2:1へ補正できるわけではない。名目送り幅とブラウザの約物処理等を含む組版結果も区別する。今回はコメント・識別子の読みやすさを優先する。和欧文を含む罫線図や端末表の厳密な桁揃えが必要なら、両方を同じCJK等幅フォントで描くなど、別途設計する。

## 変更・検証の範囲

- サイト名のAvenir Nextを固定し、旧`masthead`選択UI・状態処理・リンクへの引き継ぎを撤去。
- 本文・見出しのHelvetica系、コードブロック14px／行高1.5、インラインコード0.85em・padding 0.25em 0.35emは維持。
- フォント検査スクリプトを拡張し、ファミリー／PostScript名、アウトライン・ビットマップテーブル、サンプルの名目送り幅を記録。シェーピング・可変軸・ブラウザ選択の検査とは区別する。
- [フォントファイル検査結果](../mock/verification/code-font-files.json)に版とSHA-256を保存。公開フォントは一時フォルダーへの取得のみで、インストール・改変・配信はしていない。

Chromeで全33画面×5幅（320・360・400・768・1280px）×両配色の330条件を確認し、横あふれ・画像欠落はなかった。フォント候補順、paltとコードへの非継承、旧masthead状態の不適用も確認。診断段落はpaddingあり／なしで同じ高さ（モバイル約91.20px、デスクトップ約96.89px）を維持した。入口のページ・配色フォームからの遷移と、CSS読み込み後の候補順表示も確認した。

静的検査は33ページ・416ローカル参照、配色状態・コピーの既存テストも通過。代表画面のコードとホームは目視した。[第5案の記録](../mock/verification/browser-checks-v5.json)にCSS／JS／部品HTMLのSHA-256と結果を保存し、[第4案の記録](../mock/verification/browser-checks-v4.json)も履歴として保持した。Windows・iOS・Androidの実機描画、Safari／FirefoxでのSF Monoの解決、ネイティブズームは未確認。
