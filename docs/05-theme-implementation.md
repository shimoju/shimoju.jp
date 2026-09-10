# 5. テーマ実装上の判断理由

[視覚要件](04-theme-visual-requirements.md)と[モックのCSS](../mock/src/theme.css)を実装へ移す際の注意点。書体の提供情報・実装の調査基準日は2026-09-09。対応状況は更新され得るため、対象ブラウザを変更するときは出典と実機で再確認する。

## フォント候補の役割

```css
--font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Noto Sans JP", "Noto Sans CJK JP", sans-serif;
--font-code: Menlo, Consolas, monospace;
--font-site: var(--font-body);
```

Webフォントを配信せず、閲覧者への追加インストールも要求しない。候補をむやみに増やさず、末尾の一般ファミリーで未導入環境・不足文字を受ける。CSSはOS判定や半角／全角判定ではなく、フォントの存在と文字収録状況に従って選ぶ。[CSS Fontsの選択規則](https://www.w3.org/TR/css-fonts-4/#font-family-prop)

| 環境 | 本文の想定 | コードの想定 |
| --- | --- | --- |
| macOS・iOS／iPadOS | 欧文はApple標準のSan Francisco、和文はApple側の選択とHiragino Sansによる補完 | 欧文Menloを優先。和文はmonospace・不足文字のフォールバックに委ねる |
| Windows | 欧文Segoe UI、和文Noto Sans JP → Noto Sans CJK JP → sans-serif（ヒラギノ導入時は和文ヒラギノが優先） | 欧文Consolasを優先。和文はmonospace・不足文字のフォールバックに委ねる |
| Linux／Android | 利用可能なNoto候補、なければsans-serif。欧文を特定の書体に固定しない | 利用できる明示候補がなければmonospaceとシステムの日本語フォールバック |

この表は通常の搭載状況からの想定であり、任意導入フォント、OEM変更、ブラウザ設定による差は許容する。HTMLの`lang="ja"`を維持する。[Apple System Fonts](https://developer.apple.com/fonts/system-fonts/)、[Windows 11 font list](https://learn.microsoft.com/en-us/typography/fonts/windows_11_font_list)、[AOSP fonts.xml](https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/data/fonts/fonts.xml)

- 本文・見出し・サイト名は共通の候補順とする。環境間で字形を統一せず、各環境に適した書体とウェイトの階層を優先する。通常版Segoe UIで要件を満たすことをユーザーが実機確認したため、Variable Textは追加しない。
- Apple標準はSan Franciscoを使うための指定。MacのChrome／Firefoxで和文がNotoへ落ちる実測を踏まえ、Hiragino Sansを明示する。Windowsにヒラギノがあっても欧文はSegoe UIを優先する順序とし、その場合の和文はヒラギノになる。MacにSegoe UIがあるとApple標準にない文字がSegoe UIへ落ちる可能性は許容する。[Apple標準の指定](https://webkit.org/blog/3709/using-the-system-font-in-web-content/)
- system-uiはWindowsでYu Gothic UIが選ばれた実測を踏まえ、明示指定しない。MacのChromeでBlinkMacSystemFontが計算済みスタイル上system-uiへ変換されても、Windows向けに指定したことにはならない。[Chromiumの互換名変換](https://raw.githubusercontent.com/chromium/chromium/main/third_party/blink/renderer/core/css/resolver/style_builder_converter.cc)
- Noto Sans JPとNoto Sans CJK JPは別配布のファミリー名。いずれか一方だけ導入された環境も受けるため両方残す。
- Notoは手動導入だけでなく、Windowsの更新でも提供される。Windows 11 22H2／23H2のKB5053657、Windows 10 22H2のKB5053643はNoto CJK追加を告知している。ただし全Windowsへの存在は保証しない。[Windows 11の更新](https://support.microsoft.com/en-us/servicing/os/windows-11/2025/03/march-25-2025-kb5053657-os-builds-22621-5126-and-22631-5126-preview)、[Windows 10の更新](https://support.microsoft.com/en-us/servicing/os/windows-10/2025/03/march-25-2025-kb5053643-os-build-19045-5679-preview)
- 游ゴシックはWindowsでのかすれを避けたいという要件から明示指定しない。MS Gothicもコードの日本語候補として指定しない。Notoの後は一般ファミリーに任せるため、結果としてそれらが選ばれないことまでは保証しない。[参考となったICS MEDIAの記事](https://ics.media/entry/200317/)
- コードは本文の和文候補を共有しない。Noto Sans JP／Noto Sans CJK JPは欧文も収録しており、Menlo・Consolasがない環境で欧文をプロポーショナル表示にしてしまうため。コードはmonospaceへ直接フォールバックさせる。

## ウェイトと実際に選ばれるフェイス

サイト名300、本文400、記事見出し500、strong／b・表のthは700とする。strong／bは相対値bolderではなく700を指定し、入れ子でも太さを増やさない。Archivesの月は補助情報として400のままにする。シンタックスハイライトのboldは700を維持する。

ユーザーのWindows実機では、通常版Segoe UIの500でSemiboldが選ばれ、意図した和欧文のバランスを確認した。この実測を採用根拠とするが、すべてのOS版・フォント版・ブラウザで同じフェイスが選ばれる保証とはしない。CSSのウェイト探索規則と実フォントのマッピングを区別し、200・300・400・500・700の同文サンプルで実際のフェイスと階層を確認する。サイト名は本文と共通の書体を使い、サイズや字間を変えずウェイト300の軽さでリズムをつくる。特定フェイスへの別名割り当てや、OS別のウェイト補正は行わない。[CSSのウェイト選択規則](https://www.w3.org/TR/css-fonts-4/#font-style-matching)

## コードはMenlo, Consolas, monospace

コードブロック・インラインコードともにこの指定を採用確定とする。MacではMenlo、WindowsではConsolasを欧文候補にし、いずれもない環境ではブラウザのmonospaceへ委ねる。Linux／Androidに適切な等幅書体がないという意味ではなく、サイト側で特定の追加候補を選ばない方針である。[Consolasの説明](https://learn.microsoft.com/en-us/typography/font-list/consolas)、[CSSのmonospace](https://www.w3.org/TR/css-fonts-4/#monospace-def)

和文は明示指定せず、monospace・不足文字のフォールバックに任せる。本文と同じ書体であることより、コードとしての字幅・読みやすさを重視する。通常のNoto Sans JP／Noto Sans CJK JPは欧文を含む完全な等幅書体ではないため、コードの候補に入れない。公開版2.004の検査でも、日本語の全角文字は基本的に1emだが、欧文の送り幅は文字ごとに異なった。Menlo・ConsolasがなくNotoだけがある環境で、欧文がプロポーショナルになるのを防ぐ。

ui-monospaceは採用しない。対応ブラウザでOSのUI用等幅書体を選ぶ仕組みであり、将来の対応拡大を含めてサイトが選んだMenlo／Consolasより優先させないため。SF Mono／SFMono-Regularの名前指定やローカル別名定義も追加しない。ブラウザの対応状況に依存して指定を切り替える実装にはしない。

## 日本語コードの等幅性とpalt

Noto Sans Mono CJK JPは通常版とは別の等幅向けバリエーションだが、今回はこれも明示追加しない。[Noto公式のMono版の説明](https://github.com/notofonts/noto-cjk/blob/main/Sans/HISTORY.md)

混植では「欧文が等幅」「日本語が等幅」「日本語1文字＝欧文2文字」は別条件。monospaceを指定しても最終的な書体はブラウザ・言語・ユーザー設定に依存するため、和文の字幅と読みやすさは実機で確認する。罫線図や端末表の厳密な2:1の桁揃えは保証しない。CSSのcomputed styleは候補順の確認にしか使えず、実際の字形に選ばれたフォント名の証拠にはならない。

本文・見出しでは`font-feature-settings: "palt"`を有効にする。paltは括弧・句読点だけでなく仮名などの送り幅にも作用し得るGPOS機能で、フォント側の対応が必要。字形置換のpwidとは異なる。欧文候補自体にpaltがなくても、後続の和文フォントへの適用は可能。[OpenType palt](https://learn.microsoft.com/en-us/typography/opentype/spec/features_pt#tag-palt)

| 確認したフォント | 版・範囲 | 確認結果 |
| --- | --- | --- |
| Hiragino Sans W3・W6 | macOSの実ファイル、20.0d1e1 | GPOS paltあり。W3の日本語サンプルは非適用時1em |
| Noto Sans JP | 公開可変版2.004 | GPOS paltあり。日本語サンプルは名目1em |
| Noto Sans CJK JP | 公開Regular版2.004 | GPOS paltあり。日本語サンプルは名目1em |

公開ファイルは[Noto Sans JP](https://github.com/notofonts/noto-cjk/blob/main/Sans/Variable/TTF/Subset/NotoSansJP-VF.ttf)・[Noto Sans CJK JP](https://github.com/notofonts/noto-cjk/blob/main/Sans/OTF/Japanese/NotoSansCJKjp-Regular.otf)を検査した。可変版の検査値は既定軸であり、Windows同梱版の全バージョンやブラウザのシェーピング結果を実測したものではない。

コード・インラインコードは`font-feature-settings: normal`、`font-variant-ligatures: none`、`font-kerning: none`にする。これは混植の字幅を2:1に補正する指定ではない。paltとフォールバックの再確認方法は[検証手順](06-theme-validation.md)を参照。

## 相対サイズと文字拡大

見出しは本文・H6の1remからH1の1.6remまでを5区間の等比で分ける。1段の倍率は`1.6^(1/5)`、サイト名は7段目の`1.6^(7/5)`とする。H6→H1は1、1.099、1.207、1.326、1.456、1.6rem、サイト名は1.931rem。各値は丸める前の式から独立に算出し、小数第3位に丸めてCSSへ定数として記載する。丸め済みの倍率を繰り返し掛けたり、実行時に累乗を計算したりしない。

補助文字は同じスケールの−1／−2／−3段を用い、0.910／0.829／0.754remに揃える。一覧タイトルは＋2段の1.207rem。要約・ナビ・ページ送り・脚注・表・Archivesの月は0.910rem、日付・タグ・キャプションは0.829rem、小さなラベル・著作権表示は0.754rem。要約とナビの文字サイズはモバイルでも共通とする。

大きな余白は役割別トークンにする。本文画像・表・コードの前後は1.931em、カバーの上は1.931rem。記事一覧の区切り・ページ見出しの下は2.560rem、年別アーカイブ・脚注の上は3.089rem、記事末尾・デスクトップヘッダーの下は3.394rem、デスクトップヘッダーの上・ページ送りの上は4.096rem。モバイルヘッダーは上下2.560rem。記事一覧は罫線の前後にgapとpaddingの両方があるため、合計の間隔で評価する。段落1em・引用1.6em、コード内部・インラインコードの余白、操作対象の最小寸法は維持する。

本文内のH2〜H6の余白は前2.121em・後0.687emを採用する。スケールの＋8段／−4段から算出して小数第3位に丸めた値で、見出し自身の文字サイズに追従する。CSSは階層別ではなく共通セレクターにまとめ、記事タイトルは対象外とする。最初の本文要素は上余白0を維持する。マージン相殺があるため、隣接する段落・連続見出しとの空白は指定値の単純な合計にはならない。行高・コードサイズ・操作対象の寸法にスケールを強制しない。

ルートは全画面幅で106.25%。ブラウザの既定文字サイズが16pxなら本文のCSSサイズは17pxになる。bodyを1remにし、見出し・サイト名・コードを同じルートに対する比率で指定することで、画面幅が変わっても階層を維持できる。ルートをpxで固定しない。[W3Cの相対サイズの説明](https://www.w3.org/WAI/tutorials/page-structure/styling/)

Safariでは-apple-system使用時の和文が約1px小さく見え、iPhone Safariでも再現したとユーザーが確認している。モバイルも106.25%にし、ヒラギノが見た目上約16px相当になることを狙う。これはCSSの計算値を16pxにする指定ではなく、他ブラウザを含めた一律の1px補正の保証でもない。OS判定やSafari限定CSSは追加しない。

コードブロックは`font-size: calc(14 / 17 * 1rem)`、行高1.3。既定文字サイズ16pxでは両幅とも14px・行送り18.2pxとなる。px固定ではないため、既定文字サイズ20pxなら17.5px、32pxなら28pxへ拡大する。インラインコードは周囲の0.85emを維持する。

- rem：本文・見出し・補助文字、ヘッダーや一覧の余白、操作部品の最小寸法。
- em：インラインコードの文字とpadding、段落・本文見出しの余白、リストの字下げ。周囲の文字サイズに追従させる。
- 単位なし：行高。本文1.9、コード1.3。
- px：本文最大幅720px、左右ガター24px／20px、ブレークポイント640px、細い罫線・角丸。

固定heightで文字を切らず、min-heightと折り返しを使う。コードのラベルとボタンは必要なら縦に並べ、コード本文だけを横スクロールさせる。インラインコードのpaddingは行高を不自然に押し広げないようにする。paddingの有無で折り返し位置が変わる場合、段落全体の高さだけを比較して行高の増加と判定しない。

## コード生成・コピー

本文の単独Markdown画像はモックのdecorate処理で`<p><img></p>`から`<figure><img></figure>`へ変換し、部品ページと同じ前後余白を適用する。文章中に混在する画像の段落は変換しない。本番でも画像レンダーフック等で同じ構造を生成するか、単独画像のラッパーに共通のブロック余白を適用する。figureだけを装飾して通常のMarkdown画像を取り残さない。

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
