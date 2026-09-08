# 5. テーマ実装上の判断理由

[視覚要件](04-theme-visual-requirements.md)と[モックのCSS](../mock/src/theme.css)を実装へ移す際の注意点。書体の提供情報・実装の調査基準日は2026-09-08。対応状況は更新され得るため、対象ブラウザを変更するときは出典と実機で再確認する。

## フォント候補の役割

```css
--font-ja: "Hiragino Sans", "Noto Sans JP", "Noto Sans CJK JP", sans-serif;
--font-body: "Helvetica Neue", Arial, var(--font-ja);
--font-code: ui-monospace, Menlo, Consolas, "Hiragino Sans",
  "Noto Sans JP", "Noto Sans CJK JP", monospace;
--font-site: "Avenir Next", var(--font-body);
```

Webフォントを配信せず、閲覧者への追加インストールも要求しない。候補をむやみに増やさず、末尾の一般ファミリーで未導入環境・不足文字を受ける。CSSはOS判定や半角／全角判定ではなく、フォントの存在と文字収録状況に従って選ぶ。[CSS Fontsの選択規則](https://www.w3.org/TR/css-fonts-4/#font-family-prop)

| 環境 | 本文の想定 | コードの想定 |
| --- | --- | --- |
| macOS・iOS／iPadOS | 欧文Helvetica Neue、日本語Hiragino Sans | 対応ブラウザはui-monospace、それ以外はMenlo。日本語の明示候補はHiragino Sans |
| Windows | 欧文Arial、日本語Noto Sans JP → Noto Sans CJK JP → sans-serif | 欧文Consolas、日本語Noto Sans JP → Noto Sans CJK JP → monospace。ui-monospaceが解決すればそちらを優先 |
| Android | AOSPではArialはsans-serifへの別名。通常の欧文はRoboto、日本語は言語別のNoto CJKフォールバック | 利用できる明示候補がなければmonospaceとシステムの日本語フォールバック |

この表は通常の搭載状況からの想定であり、任意導入フォント、OEM変更、ブラウザ設定による差は許容する。HTMLの`lang="ja"`を維持する。[Apple System Fonts](https://developer.apple.com/fonts/system-fonts/)、[Windows 11 font list](https://learn.microsoft.com/en-us/typography/fonts/windows_11_font_list)、[AOSP fonts.xml](https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/data/fonts/fonts.xml)

- Helvetica系は本文の読みやすさとインラインコードとの親和性を優先した選択。ArialはWindowsの欧文候補であり、Helvetica Neueと同じ字形を保証するものではない。
- Avenir Nextはサイト名だけに使い、本文・記事見出しには使わない。未導入時は本文書体へ戻す。OSをまたいで同一のロゴ表現を保証しない。
- Noto Sans JPとNoto Sans CJK JPは別配布のファミリー名。いずれか一方だけ導入された環境も受けるため両方残す。
- Notoは手動導入だけでなく、Windowsの更新でも提供される。Windows 11 22H2／23H2のKB5053657、Windows 10 22H2のKB5053643はNoto CJK追加を告知している。ただし全Windowsへの存在は保証しない。[Windows 11の更新](https://support.microsoft.com/en-us/servicing/os/windows-11/2025/03/march-25-2025-kb5053657-os-builds-22621-5126-and-22631-5126-preview)、[Windows 10の更新](https://support.microsoft.com/en-us/servicing/os/windows-10/2025/03/march-25-2025-kb5053643-os-build-19045-5679-preview)
- 游ゴシックはWindowsでのかすれを避けたいという要件から明示指定しない。MS Gothicもコードの日本語候補として指定しない。Notoの後は一般ファミリーに任せるため、結果としてそれらが選ばれないことまでは保証しない。[参考となったICS MEDIAの記事](https://ics.media/entry/200317/)
- コードに`var(--font-ja)`をそのまま使わない。末尾のsans-serifがmonospaceより先に解決してしまうため、日本語候補だけを共通にし、一般ファミリーは用途別にする。

## SF Monoは名前ではなくui-monospaceから利用する

OS内にSF Monoが存在することと、Webページから`"SF Mono"`や`"SFMono-Regular"`で選べることは別。追加導入なしで標準搭載SF Monoを全ブラウザから名前指定する、移植性のある方法は確認できていない。内部名の直接指定や`@font-face`の`local()`で、この制限を解決できるとは仮定しない。

採用する公開の入口は引用符なしの`ui-monospace`。SafariではユーザーがSF Mono（.AppleSystemUIFontMonospaced）の適用を確認済み。内部の表示名をCSSへ書き戻さない。WebKitはSafari 13.1での対応を説明しており、調査時の互換データではデスクトップChrome／Firefoxは未対応だった。未対応時はMenlo／Consolasへ進む。[WebKitの説明](https://webkit.org/blog/10247/new-webkit-features-in-safari-13-1/)、[Mozillaの実装者による説明](https://bugzilla.mozilla.org/show_bug.cgi?id=1342741#c5)、[対応データ](https://github.com/mdn/browser-compat-data/blob/main/css/properties/font-family.json)

ui-monospaceは欧文だけを選ぶ指定ではなく、システムの日本語フォールバックを含み得る。Safariでは後続のHiragino Sans／Notoより先に日本語が解決する場合を許容する。CSSのcomputed styleは候補順の確認にしか使えず、実際の字形に選ばれたフォント名の証拠にはならない。[WebKitのシステム候補展開](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/cocoa/FontDescriptionCocoa.cpp)

## 日本語コードの等幅性とpalt

通常のNoto Sans JP／Noto Sans CJK JPは欧文を含む完全な等幅書体ではないが、日本語の全角文字は基本的に等幅。公開版2.004のファイル検査では漢字・かな・全角約物のサンプルが1em、半角カナが0.5emで、欧文の送り幅は文字ごとに異なった。欧文は先行するコード用書体に任せ、日本語を本文と共通の候補にする。

Noto Sans Mono CJK JPはASCIIなどを半角固定幅にした別バリエーション。今回の目的は和欧文コメントの読みやすさであり、通常のNotoを日本語候補として使う。混植では「欧文が等幅」「日本語が等幅」と「日本語1文字＝欧文2文字」は別条件。罫線図や端末表の厳密な2:1の桁揃えは保証しない。[Noto公式のMono版の説明](https://github.com/notofonts/noto-cjk/blob/main/Sans/HISTORY.md)

本文・見出しでは`font-feature-settings: "palt"`を有効にする。paltは括弧・句読点だけでなく仮名などの送り幅にも作用し得るGPOS機能で、フォント側の対応が必要。字形置換のpwidとは異なる。欧文候補自体にpaltがなくても、後続の和文フォントへの適用は可能。[OpenType palt](https://learn.microsoft.com/en-us/typography/opentype/spec/features_pt#tag-palt)

| 確認したフォント | 版・範囲 | 確認結果 |
| --- | --- | --- |
| Hiragino Sans W3・W6 | macOSの実ファイル、20.0d1e1 | GPOS paltあり。W3の日本語サンプルは非適用時1em |
| Noto Sans JP | 公開可変版2.004 | GPOS paltあり。日本語サンプルは名目1em |
| Noto Sans CJK JP | 公開Regular版2.004 | GPOS paltあり。日本語サンプルは名目1em |

公開ファイルは[Noto Sans JP](https://github.com/notofonts/noto-cjk/blob/main/Sans/Variable/TTF/Subset/NotoSansJP-VF.ttf)・[Noto Sans CJK JP](https://github.com/notofonts/noto-cjk/blob/main/Sans/OTF/Japanese/NotoSansCJKjp-Regular.otf)を検査した。可変版の検査値は既定軸であり、Windows同梱版の全バージョンやブラウザのシェーピング結果を実測したものではない。

コード・インラインコードは`font-feature-settings: normal`、`font-variant-ligatures: none`、`font-kerning: none`にする。これは混植の字幅を2:1に補正する指定ではない。paltとフォールバックの再確認方法は[検証手順](06-theme-validation.md)を参照。

## 相対サイズと文字拡大

ルートはモバイル100%、640px以上106.25%。ブラウザの既定文字サイズが16pxなら本文16px／17pxになる。bodyを1remにし、見出し・サイト名・コードを同じルートに対する比率で指定することで、画面幅が変わっても階層を維持できる。ルートをpxで固定しない。[W3Cの相対サイズの説明](https://www.w3.org/WAI/tutorials/page-structure/styling/)

- rem：本文・見出し・補助文字、ヘッダーや一覧の余白、操作部品の最小寸法。
- em：インラインコードの文字とpadding、段落・本文見出しの余白、リストの字下げ。周囲の文字サイズに追従させる。
- 単位なし：行高。本文1.9、コード1.5。
- px：本文最大幅720px、左右ガター24px／20px、ブレークポイント640px、細い罫線・角丸。

固定heightで文字を切らず、min-heightと折り返しを使う。コードのラベルとボタンは必要なら縦に並べ、コード本文だけを横スクロールさせる。インラインコードのpaddingは行高を不自然に押し広げないようにする。paddingの有無で折り返し位置が変わる場合、段落全体の高さだけを比較して行高の増加と判定しない。

## コード生成・コピー

[コードブロックのレンダーフック](../mock/src/render-codeblock.html)はHugo v0.165.0で確認済み。`layouts/_markup/render-codeblock.html`に配置する。言語は`.Type`、ファイル名は`.Attributes.filename`、行番号・強調行は`.Options`を使い、本文からファイル名を推測しない。

````markdown
```toml {filename="config.toml" linenos=inline hl_lines=[3]}
# 日本語コメント
[tools]
ruby = "3.4"
```
````

`transform.HighlightCodeBlock`で生成し、未指定・未対応の言語はプレーンテキストとして扱う。ファイル名バーは標準Markdownの自動機能ではなく、Hugo属性とカスタムHTMLの組み合わせ。[Hugoの仕様](https://gohugo.io/render-hooks/code-blocks/)

`noClasses: false`とLatte／MochaのCSSを使い、トークン・Base背景を公式のまま配色別セレクターで切り替える。色付けのためのクライアントJSは不要。

コピーはコード本文だけを対象とし、行番号の要素を除外して空白・改行を維持する。Clipboard APIのPromise成功後にのみCopiedを表示し、3秒後にCopyへ戻す。失敗時はCopy failed・再試行・手動選択を案内し、操作不能のままにしない。読み上げ通知は`role="status"`等で提供し、本文下に可視メッセージを増やしてレイアウトを動かさない。

## リンクと配色の実装境界

一覧は一記事を一つのネイティブリンクで囲み、`aria-labelledby`で記事タイトルをリンク名にする。長い要約全体の読み上げや重複したTab停止を避け、新しいタブで開く操作を保つ。別ボタンを追加するときはリンクの入れ子を作らない。Archivesもタイトルと日付を同じリンクにする。

配色は保存済みの明示選択を優先し、なければOS設定に追従する。初回描画前の設定でちらつきを防ぎ、ストレージの読み書きが失敗しても本文と切り替えを使えるようにする。モックの`?theme=`・`?copy=failure`、レビュー入口、文字拡大用ビルドは検証専用で、本番テーマに必要な機能ではない。

シェア・はてなスターはモックでは外部送信しない表示デモ。本実装ではX・Facebook・はてなブックマーク・はてなスターを接続し、Xへのタグ由来ハッシュタグは付けない。モックの固定年・記事件数・分類件数や`noindex,nofollow`を本番へそのままコピーしない。
