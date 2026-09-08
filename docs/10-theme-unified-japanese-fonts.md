# 10. 本文・コードの日本語フォント統一

第6案の履歴。この後、SF Monoの名前指定をui-monospaceへ変更し、游ゴシックの明示指定を削除した。現行方針とSF Monoの利用方法の再調査は[資料11](11-theme-system-monospace.md)を優先する。

2026-09-08、第6案。SF Monoの採用は維持し、不要と判断した互換名を外す。コードの日本語は本文と同じ候補順へ統一する。[現行要件](04-theme-visual-requirements.md)、[モック入口](http://127.0.0.1:4173/)、[コードの診断](http://127.0.0.1:4173/specimen.html#code)を参照。

## 確定した指定

```css
--font-body: "Helvetica Neue", Arial, var(--font-ja);
--font-ja: "Hiragino Sans", "Noto Sans JP", "Noto Sans CJK JP",
  "Yu Gothic", sans-serif;
--font-code: "SF Mono", Menlo, Consolas, "Hiragino Sans",
  "Noto Sans JP", "Noto Sans CJK JP", "Yu Gothic", monospace;
--font-site: "Avenir Next", var(--font-body);
```

欧文コードはSF Mono → Menlo → Consolas、日本語候補は本文と共通。最後の一般ファミリーはコードではmonospaceとする。本文用の`var(--font-ja)`をそのまま流用するとsans-serifがmonospaceより前に来るため、今回の定義では候補を明記した。日本語の選択もOS判定ではなく、フォントの存在と文字の収録状況による。

## SFMono-Regularを外す理由

SF Monoはファミリー名、SFMono-RegularはRegularフェイスのPostScript名。前回「互換候補」と説明して残したが、SF Monoでは解決せずSFMono-Regularだけが必要になる対象環境は確認できていなかった。必要な指定だけを残す方針に従い、削除する。「必要な環境がないことを全環境で実証した」という意味ではない。[CSSのファミリーとフェイス](https://drafts.csswg.org/css-fonts-4/#family-vs-face)、[Mozillaの説明](https://bugzilla.mozilla.org/show_bug.cgi?id=1545350)

SF Monoの採用と、全Macブラウザからその名前で利用できることは別。解決しなければMenloへ戻す。Safariにはシステム書体を選ぶui-monospaceもあるが、今回の合意は指定の整理であり、その追加や日本語フォールバックとの組み合わせ変更は行わない。[WebKitの説明](https://webkit.org/blog/10247/new-webkit-features-in-safari-13-1/)

## Notoをコードにも採用する理由

通常のNoto Sans JP／Noto Sans CJK JPは欧文まで含めた等幅書体ではないが、日本語の全角文字は基本的に等幅。公開版2.004のファイル検査では、漢字・ひらがな・カタカナ・全角括弧・句読点のサンプルは1em、半角カナは0.5em、欧文は文字ごとに異なる名目送り幅だった。

Noto Sans Mono CJK JPは、ASCIIなどを半角固定幅にした別バリエーション。今回は欧文を先行するSF Mono／Consolas等で描くため、日本語の代替として通常のNotoを使う。ヒラギノをMacの日本語候補にする判断とも整合する。[Noto公式のMono版の説明](https://github.com/notofonts/noto-cjk/blob/main/Sans/HISTORY.md)

BIZ UDGothicに可読性上の問題が見つかったためではなく、本文との統一を優先して候補から外す。Notoがない場合はYu Gothicで受ける。コードのpalt・合字・自動カーニングは無効を維持し、和欧文の混植で厳密な幅比2:1や罫線図の桁揃えは保証しない。

[ファイル検査結果](../mock/verification/noto-code-font-files.json)に版・SHA-256・名目送り幅を保存した。Noto Sans JP可変版の値はデフォルト軸（Thin）、Noto Sans CJK JPはRegularの値であり、欧文の数値差をファミリーの違いだけに帰属させない。実際のシェーピング、Windows同梱版の全バージョン、ブラウザの選択フォントを検査したものではない。

## 変更と検証

- 共通CSS、コードの診断サンプル、レビュー入口の説明、現行要件、README、静的テストを更新。
- 本文・記事見出しのHelvetica系とサイト名のAvenir Nextは維持。文字サイズ・行高・余白・配色・操作は変更しない。
- 全33ページを再生成し、静的検査（416ローカル参照）、配色状態、コピー成功／失敗・再試行の既存テストを実施。
- Chromeで入口・ホーム・実記事・部品の4画面×5幅（320・360・400・768・1280px）×両配色の40条件を確認。横あふれ・画像欠落はなく、診断段落はpaddingあり／なしで同じ行送りを維持。

今回の範囲はフォント変更の代表画面確認であり、前回の全33画面×両配色×5幅を再実施したとは扱わない。[第6案の記録](../mock/verification/browser-checks-v6.json)、[第5案の記録](../mock/verification/browser-checks-v5.json)を分けて保存する。Windows・iOS・Androidでの実機描画、Safari／FirefoxでのSF Monoの解決、ネイティブズームは未確認。Webフォント配信・フォントのインストール・本番テーマへの反映は行っていない。
