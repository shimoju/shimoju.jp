# 8. Helvetica系の採用とOS別フォールバック

第4案の調査・判断の履歴。サイト名のAvenir Nextはその後採用され、コード用のSF Mono・日本語候補も再整理した。現行の指定は[資料9](09-theme-code-fonts.md)を優先する。

2026-09-07。本文をHelvetica系に確定し、OS別の役割を説明できる候補へ整理した。サイト名だけAvenir Nextにする案は、採用確定とは分けてモックの比較案にした。インラインコードは文字と背景を少し縮めた。[現行要件](04-theme-visual-requirements.md)、[モック入口](http://127.0.0.1:4173/)を参照。

## 結論とサイト名への意見

本文と記事見出しはHelvetica系を採用。Trebuchet／Avenir／Arial／Franklinの本文比較を終了し、旧`font`パラメーターは無効にした。

サイト名だけAvenir Nextにする案には賛成。長文とインラインコードの親和性を保ったまま、短い欧文のサイト名にリズムを加えられる。サイズ34px／32px・太さ600は変えず、書体だけを比較する。記事見出し・ナビゲーション・本文には適用しない。

ただしWindows／AndroidでAvenir Nextの標準搭載を前提にできない。今回は`"Avenir Next", var(--font-body)`とし、なければ本文書体へ戻す。AvenirやCentury Gothicを追加して似た雰囲気を追うことはしない。全OSで同じロゴを保証する案ではない。[Appleのフォント一覧](https://developer.apple.com/fonts/system-fonts/)

## OS別の提供状況と採用順

以下は公式の提供情報・AOSP設定に基づく想定。フォントが存在することと、各ブラウザがその文字に選ぶことは別である。実機描画を確認したのはmacOSのChromeのみ。

| 環境 | 欧文本文の第一候補 | 日本語本文の第一候補 → 代替 | Avenir案のサイト名 | コード |
| --- | --- | --- | --- | --- |
| macOS | Helvetica Neue | Hiragino Sans → 後続候補／OSのsans-serif | Avenir Next → 本文書体 | Menlo、日本語の不足文字はOSのフォールバック |
| iOS／iPadOS | Helvetica Neue | Hiragino Sans → 後続候補／OSのsans-serif | Avenir Next → 本文書体 | Menlo、日本語の不足文字はOSのフォールバック |
| Windows 11、Windows 10の関連更新適用環境 | Arial | Noto Sans JP。別配布形態のNoto Sans CJK JPがあれば次に優先 → Yu Gothic → sans-serif | Avenir Nextが導入されていれば使用、なければArial等 | 欧文Consolas、日本語MS Gothic → monospace |
| WindowsでNotoがない環境 | Arial | Yu Gothic → sans-serif | 本文書体 | 同上 |
| Android（AOSP設定を基準） | Arialの別名解決先であるsans-serif、通常Roboto | 言語jaのフォールバックでNoto CJK | 本文書体 | monospace、AOSPではDroid Sans Mono。不足文字はNoto CJK等 |
| その他のOS／カスタム環境 | 利用できる候補、最後はsans-serif | 利用できる候補、最後はsans-serif | Avenir Nextがあれば使用、なければ本文書体 | 利用できる候補、最後はmonospace |

Appleの一覧は、単に名前が掲載されているだけでなく、Helvetica Neue、Hiragino Sans W3／W6、Avenir Next Regular／Demi Bold、MenloがiOS／macOSで「system font」に分類されていることもHTMLで確認した。SF／SF ProをOSのUI書体として使う指定とは区別する。[Apple System Fonts](https://developer.apple.com/fonts/system-fonts/)

Windowsの一覧にはArial、Segoe UI、Yu Gothic、Consolas、MS Gothicがある。BIZ UDPGothicとメイリオは日本語補助フォントの区分で、追加機能・言語環境に依存する。[Windows 11 font list](https://learn.microsoft.com/en-us/typography/fonts/windows_11_font_list)

### 前回からの訂正：WindowsのNoto

前回はNotoを任意導入の候補として説明したが、それだけでは不十分だった。MicrosoftはWindows 11 22H2／23H2向けKB5053657とWindows 10 22H2向けKB5053643（2025-03-25）で、Noto CJKの導入を告知している。KB5053657の公式ファイル一覧にも`NotoSansJP-VF.ttf`を確認した。[Windows 11の更新](https://support.microsoft.com/en-us/servicing/os/windows-11/2025/03/march-25-2025-kb5053657-os-builds-22621-5126-and-22631-5126-preview)、[Windows 10の更新](https://support.microsoft.com/en-us/servicing/os/windows-10/2025/03/march-25-2025-kb5053643-os-build-19045-5679-preview)、[公式ファイル一覧CSV](https://download.microsoft.com/download/ab281826-7f79-4c4f-a26e-aeed7508515f/5053657.csv)

したがって「Notoは手動導入のみ」とも「すべてのWindowsで必ずある」とも扱わない。更新状況・提供経路の違いを考慮してNotoを優先し、未提供環境のためのYu Gothicを残す。24H2以降を含む全ビルドでの導入時期を、今回確認した更新情報から一律に推定しない。

同じMicrosoftの更新ページには、96 DPIのChromium系ブラウザでNoto CJKが不鮮明になる報告も載っている。Notoを優先する方針は維持するが、「Notoなら常に游ゴシックより読みやすい」とは断定しない。Windows実機での見え方は今後の確認事項。[Microsoftの既知の問題](https://support.microsoft.com/en-us/servicing/os/windows-11/2025/03/march-25-2025-kb5053657-os-builds-22621-5126-and-22631-5126-preview)

### Android：ファイル名とCSSファミリー名を区別する

AOSPの`fonts.xml`では、`sans-serif`がRoboto、`arial`は`sans-serif`への別名、`lang="ja"`の無名フォールバック群がNoto Sans CJKになっている。`monospace`はDroidSansMono。本文のHTMLは`lang="ja"`を維持する。独立したCSS候補としてRobotoやDroid Sans Monoを列挙せず、プラットフォームの選択に任せる。[AOSP fonts.xml](https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/data/fonts/fonts.xml)

Android端末のOEM変更やブラウザのフォント設定まではAOSPから保証できない。端末未確認で「どのAndroidでも同じファイルが使われる」とは言わない。Arialという指定がAndroidでもArialの字形になる、という意味でもない。

## 残す候補・外す候補の理由

```css
--font-ja: "Hiragino Sans", "Noto Sans JP", "Noto Sans CJK JP",
  "Yu Gothic", sans-serif;
--font-body: "Helvetica Neue", Arial, var(--font-ja);
--font-code: Menlo, Consolas, "MS Gothic", monospace;

/* 比較案。サイト名だけに使用する */
--font-site: "Avenir Next", var(--font-body);
```

| 候補 | 判断と役割 |
| --- | --- |
| Helvetica Neue | Apple環境の欧文主役として残す |
| Arial | Windowsの欧文を明示するため残す。Helvetica系の落ち着いた表情に寄せる設計判断で、Helveticaと同一の字形ではない |
| Segoe UI | 外す。前回の順序はWindowsのUI書体を優先したもので、ArialよりHelveticaに近いと検証した順序ではなかった。今回はOSのUIらしさより本文の方向性を優先する |
| Roboto | 明示指定を外す。Androidのsans-serif／Arial別名解決でカバーする。Windowsで追加導入されたRobotoがArialを追い越すことも防ぐ |
| Hiragino Sans | 現行のmacOS／iOS用に残す |
| Hiragino Kaku Gothic ProN | 外す。現行Apple環境でHiragino Sansと役割が重なる。非常に古いOS専用の明示的互換指定は増やさない |
| Noto Sans JP | 更新済みWindowsを含む日本語主候補として残す |
| Noto Sans CJK JP | Notoの別配布ファミリーを優先するため残す。前回、JPと別のファミリー名を実ファイルで確認済み。単なる別表記ではなく、こちらだけ導入された環境をYu Gothicへ落とさないため |
| BIZ UDPGothic／日本語名 | 外す。ただしNotoとの同時存在を理由にするのではない。今回はNoto→OS標準のYu Gothicという最小構成を採用するため |
| Yu Gothic | NotoのないWindowsの明示的な救済として残す。Notoより先には置かない |
| Meiryo | 外す。日本語補助フォントの候補を追加せず、Noto→Yu Gothicでカバーする方針 |
| SFMono-Regular／Liberation Mono／BIZ UDGothic | コード候補から外す。今回の主要OSはMenlo／Consolas／MS Gothic／monospaceで役割を分け、追加導入候補を増やさない |
| sans-serif／monospace | 最終フォールバックとして必須。想定外の環境や不足文字をOSへ委ねる |

Segoe UIはMicrosoftがUI用途として説明している書体。今回のArial選択は形の好みに基づく提案であり、両者の近似度を数値評価した結果ではない。[Windowsのタイポグラフィ](https://learn.microsoft.com/en-us/windows/apps/design/signature-experiences/typography)

### BIZ削除の論点

Notoが表示対象の文字を持つ環境では、後ろのBIZ候補には通常到達しない。フォールバックの存在理由は、前の候補がない／対象文字がないケースへの対応である。「Notoがある環境ならBIZもある」だけでは、BIZを消す根拠にはならない。

またNotoのWindows更新・個別導入とBIZの日本語補助フォントは提供経路が異なるため、常に同時に存在するという保証は置かない。今回削除するのは、Notoのない環境でBIZを選ぶことより、少数のOS標準候補へ整理することを優先したため。古いWindowsでBIZの見え方を積極的に採用したい場合には、戻す理由が生じる。

## インラインコードの微調整

| 項目 | 第3案 | 今回 |
| --- | --- | --- |
| 文字サイズ | 0.875em（14.875px／14px） | 0.85em（14.45px／13.6px） |
| 上下padding | 0.3em | 0.25em |
| 左右padding | 0.4em | 0.35em |

背景色・角丸・コードの等幅指定・palt非適用は維持。コードブロックは14px・行高1.5のまま。文字サイズは約2.9%縮小し、余白の拡大で得た読みやすさを残しつつ、日本語本文に対して背景が大きく見える点を抑える。

400pxのChromeで、背景の高さは約24.89px→22.30px、文字は14px→13.6px。診断用3行段落はpaddingあり／なしとも約91.20pxで、行送りの増加はない。背景の縮小量には、文字サイズ減少に伴うフォントの描画メトリクスの変化も含まれる。

## 検証・未確認事項

静的HTML、配色状態、コードコピーの既存テストに、本文比較の廃止、サイト名だけの書体指定、採用フォールバック、縮小値を追加した。OS別の提供情報の調査と、実ブラウザの描画確認は区別する。macOS以外の実機描画、メーカー固有Android設定、Windows 96 DPIは未確認。

Chromeで全33画面を5幅（320・360・400・768・1280px）・両配色、計330条件で確認した。サイト名のAvenir案はホーム・記事・部品の3画面を同条件、計30条件で追加確認。合計360条件で横あふれ・画像欠落はなく、本文のpalt、コードへの非継承、診断段落の行送り維持も確認した。代表画面は目視し、サイト名だけAvenir、記事タイトルと本文はHelveticaのままであることを確認した。

レビューUIからのフォーム送信と条件保持も確認。CSSがDOMContentLoadedより遅れて読み込まれると候補順が空欄になる問題を修正し、load後にも表示を更新するテストを追加した。静的検査は33ページ・416ローカル参照、配色／比較状態・コピーの既存テストも通過。

今回の描画結果は[第4案のブラウザ検証記録](../mock/verification/browser-checks-v4.json)に保存した。第3案は[browser-checks-v3.json](../mock/verification/browser-checks-v3.json)に履歴として残す。フォントのインストール・Webフォントの配信・本番テーマへの反映は行っていない。
