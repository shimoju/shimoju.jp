# 11. ui-monospaceと標準フォールバック

2026-09-08、第7案。SF Monoを名前指定で選ぶ方針を改め、Safariではui-monospaceを利用し、他のブラウザでは後続の等幅書体で受ける。本文・コードとも游ゴシックの明示指定をやめる。[現行要件](04-theme-visual-requirements.md)、[モック入口](http://127.0.0.1:4173/)を参照。

この資料は第7案の記録。以後、ユーザーがSafariでSF Mono（.AppleSystemUIFontMonospaced）の適用を確認し、書体を確定した。相対サイズへの移行は[資料12](12-theme-relative-sizing.md)を参照。

## 結論と採用したCSS

```css
--font-ja: "Hiragino Sans", "Noto Sans JP", "Noto Sans CJK JP", sans-serif;
--font-body: "Helvetica Neue", Arial, var(--font-ja);
--font-code: ui-monospace, Menlo, Consolas, "Hiragino Sans",
  "Noto Sans JP", "Noto Sans CJK JP", monospace;
--font-site: "Avenir Next", var(--font-body);
```

ui-monospaceは一般ファミリーなので引用符で囲まない。SF Mono／SFMono-Regularの名前指定は残さない。サイト名のAvenir Next、本文のHelvetica系、文字サイズ・行高・余白・配色は変更しない。コードのpalt・合字・自動カーニングの無効化も維持する。

## SF Monoの調査結果

標準搭載のSF Monoを、追加インストールやフォント配信なしでChrome／Firefoxから名前指定で利用する、移植性のある方法は確認できなかった。ユーザーの「SF Mono／SFMono-RegularではMenloになり、Safariのui-monospaceでSF Monoになる」という観察と、確認した実装・対応情報は一致する。

前回までの「SF Monoを採用」という説明は、CSSの候補順に名前を入れたことと、実際にその書体が描画されることを十分に区別できていなかった。過去のChrome検証はレイアウトとcomputed styleの確認であり、SF Monoの描画を実証したものではない。

| 方法 | 今回の判断 |
| --- | --- |
| font-familyにSF Mono／SFMono-Regular | 標準搭載の内部書体へのアクセスを保証しない。指定を削除 |
| ui-monospace | Safariでシステムの等幅書体を利用する入口として採用 |
| .SF NS Monoなど内部名の直接指定 | 公開インターフェースではなく、WebKitにも拒否処理があるため不採用 |
| @font-faceのlocal指定 | ブラウザから見えない書体を公開する仕組みではなく、全ブラウザでの解決策として確認できないため不採用 |
| フォントの追加導入・配信 | 閲覧者への導入依頼やWebフォントを使わない今回の範囲外 |

Mozillaの実装者は、macOS Big SurのSF Monoが`.SF NS Mono`という内部システム書体で、通常のコンテンツからアクセスできないこと、Safariではui-monospaceが入口になることを説明している。古いコメント単独で現在の全環境を断定せず、現行の対応データと併せて判断した。[Mozilla Bug 1342741](https://bugzilla.mozilla.org/show_bug.cgi?id=1342741#c5)

調査時のMDN Browser Compat Dataでは、ui-monospaceはSafari 13.1以降で対応、Chrome・Firefoxは未対応。EdgeもChromeの情報を引き継ぐ。Safariの追加時期はWebKitのリリース説明でも確認できる。ブラウザ名が同じでもiOS版などエンジンの異なる製品をデスクトップと一律に扱わない。[対応データ](https://github.com/mdn/browser-compat-data/blob/main/css/properties/font-family.json)、[WebKitのSafari 13.1説明](https://webkit.org/blog/10247/new-webkit-features-in-safari-13-1/)

WebKitのFontCacheCoreText.cppには内部名の拒否処理と、ui-monospaceをUIMonospaceとしてシステム書体へ解決する処理がある。単なるフォント名の別表記ではなく、システム用の経路が必要なことを裏付ける。これは調査時のmainブランチの実装であり、全リリース版の一致を保証するものではない。[WebKitの実装](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/cocoa/FontCacheCoreText.cpp)

## 日本語フォールバックへの影響

ui-monospaceはSF Monoの欧文だけを選ぶ指定ではなく、システム側のフォールバック群を持ち得る。WebKitではシステムファミリーをCore Textの候補リストへ展開してから後続のCSSファミリーへ進む。このためSafariでヒラギノ／Notoを後ろに書いても、日本語の描画先を必ず固定できるとは限らない。[WebKitの候補展開](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/cocoa/FontDescriptionCocoa.cpp)

今回はSafariでシステムの等幅書体を使う方針を優先し、この差を許容する。ui-monospace未対応のデスクトップChrome／Firefoxでは、Menlo（Mac）・Consolas（Windows）、不足する日本語はヒラギノ・Notoの明示候補へ進む想定。任意導入フォントやブラウザ設定による違いはあり得る。部品ページの「日本語候補を明示／省略」の診断にも注意書きを更新した。

日本語1文字と欧文2文字の幅が厳密に一致することは、引き続き保証しない。

## 游ゴシックの明示指定を削除

ユーザーの希望に従い、本文・コードのどちらからもYu Gothicを削除する。Notoがない場合は、本文ではsans-serif、コードではmonospaceへ委ねる。これらは固定のフォント名ではなく、OS・ブラウザ・ユーザー設定によって解決先が変わる。結果として游ゴシックやMS系書体が選ばれないことまで保証する方針ではない。

参考のICS MEDIA記事（2026-01-13更新）は、游ゴシックのWindowsでのかすれを理由に候補から外し、本文をHelvetica Neue／Arial／ヒラギノ／Noto／sans-serifとする設計を提示している。今回の方向性は近い。こちらでは既存の合意を維持してHiragino Sansに絞り、Notoの別配布形態を受けるNoto Sans CJK JPを残す。参考記事の全指定を機械的にコピーするものではない。[ICS MEDIAの調査・提案](https://ics.media/entry/200317/)

かすれの発生条件を今回Windows実機で再検証したわけではない。明示候補から外すのはユーザーの指定と設計判断に基づくもので、すべてのWindows・表示倍率で同じ描画になるとの断定はしない。

## 変更と確認範囲

- 共通CSS、入口の説明、部品の診断文、現行要件、README、静的テストを更新。游ゴシックとSF Mono名がCSSへ戻らない検査を追加。
- 全33ページを再生成。静的検査（416ローカル参照）、配色状態、コードコピーの成功／失敗・再試行テストを実施。
- Chrome操作スキルで、入口・ホーム・実記事・部品の4画面×5幅（320・360・400・768・1280px）×両配色の40条件を確認。横あふれ・画像欠落・診断段落の行送り増加はなかった。

今回の描画検証はChromeのみ。SafariでのSF Monoと日本語の混植、Windows・iOS・Android実機、Firefox、ネイティブズームは未確認。computed styleにui-monospaceが含まれることを、Chromeがそれを実装している証拠や実際のフォント名の証拠としては扱わない。[第7案の記録](../mock/verification/browser-checks-v7.json)と[第6案の記録](../mock/verification/browser-checks-v6.json)を分けて保存する。
