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

- 本文・見出し・サイト名は共通の候補順とする。環境間で字形を統一せず、各環境に適した書体とウェイトの階層を優先する。Segoe UIは通常版を使う。
- Apple標準はSan Franciscoを使うための指定。MacのChrome／FirefoxではApple標準指定だけで和文がヒラギノになるとは限らないため、Hiragino Sansを明示する。Windowsにヒラギノがあっても欧文はSegoe UIを優先する順序とし、その場合の和文はヒラギノになる。MacにSegoe UIがあるとApple標準にない文字がSegoe UIへ落ちる可能性は許容する。[Apple標準の指定](https://webkit.org/blog/3709/using-the-system-font-in-web-content/)
- system-uiはWindowsでYu Gothic UIを選ぶ場合があるため、明示指定しない。MacのChromeでBlinkMacSystemFontが計算済みスタイル上system-uiへ変換されても、Windows向けに指定したことにはならない。[Chromiumの互換名変換](https://raw.githubusercontent.com/chromium/chromium/main/third_party/blink/renderer/core/css/resolver/style_builder_converter.cc)
- Noto Sans JPとNoto Sans CJK JPは別配布のファミリー名。いずれか一方だけ導入された環境も受けるため両方残す。
- Notoは手動導入だけでなく、Windowsの更新でも提供される。Windows 11 22H2／23H2のKB5053657、Windows 10 22H2のKB5053643はNoto CJK追加を告知している。ただし全Windowsへの存在は保証しない。[Windows 11の更新](https://support.microsoft.com/en-us/servicing/os/windows-11/2025/03/march-25-2025-kb5053657-os-builds-22621-5126-and-22631-5126-preview)、[Windows 10の更新](https://support.microsoft.com/en-us/servicing/os/windows-10/2025/03/march-25-2025-kb5053643-os-build-19045-5679-preview)
- 游ゴシックはWindowsでのかすれを避けたいという要件から明示指定しない。MS Gothicもコードの日本語候補として指定しない。Notoの後は一般ファミリーに任せるため、結果としてそれらが選ばれないことまでは保証しない。[参考となったICS MEDIAの記事](https://ics.media/entry/200317/)
- コードは本文の和文候補を共有しない。Noto Sans JP／Noto Sans CJK JPは欧文も収録しており、Menlo・Consolasがない環境で欧文をプロポーショナル表示にしてしまうため。コードはmonospaceへ直接フォールバックさせる。

## ウェイトと実際に選ばれるフェイス

サイト名300、本文400、記事見出し500、strong／b・表のthは700とする。strong／bは相対値bolderではなく700を指定し、入れ子でも太さを増やさない。Archivesの月は補助情報として400のままにする。シンタックスハイライトのboldは700を維持する。

ユーザーのWindows実機では、通常版Segoe UIの500でSemiboldが選ばれ、意図した和欧文のバランスを確認した。この実測を採用根拠とするが、すべてのOS版・フォント版・ブラウザで同じフェイスが選ばれる保証とはしない。CSSのウェイト探索規則と実フォントのマッピングを区別し、200・300・400・500・700の同文サンプルで実際のフェイスと階層を確認する。サイト名は本文と共通の書体を使い、ウェイト300の軽さでリズムをつくる。特定フェイスへの別名割り当てや、OS別のウェイト補正は行わない。[CSSのウェイト選択規則](https://www.w3.org/TR/css-fonts-4/#font-style-matching)

## コードはMenlo, Consolas, monospace

コードブロック・インラインコードともにこの指定を使う。MacではMenlo、WindowsではConsolasを欧文候補にし、いずれもない環境ではブラウザのmonospaceへ委ねる。Linux／Androidに適切な等幅書体がないという意味ではなく、サイト側で特定の追加候補を選ばない方針である。[Consolasの説明](https://learn.microsoft.com/en-us/typography/font-list/consolas)、[CSSのmonospace](https://www.w3.org/TR/css-fonts-4/#monospace-def)

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

ルートは全幅で62.5%、本文基準は`--body-size: 1.7rem`とする。見出しは本文・H6からH1の1.6倍までを5区間の等比で分ける。1段の倍率は`1.6^(1/5)`、サイト名は7段目の`1.6^(7/5)`とする。H6→H1は本文の1、1.099、1.207、1.326、1.456、1.6倍、サイト名は1.931倍。各倍率は元の式から独立に算出し、小数第3位に丸めた定数を使う。`--text-h1: calc(var(--body-size) * 1.6)`等のトークンに集約し、各セレクターはトークンを参照する。H6は`var(--body-size)`とする。

補助文字は同じスケールの−1／−2／−3段を用い、本文サイズの0.910／0.829／0.754倍に揃える。一覧タイトルは＋2段の1.207倍。要約・ナビ・ページ送り・脚注・表・Archivesの月は0.910倍、日付・タグ・キャプションは0.829倍、小さなラベル・著作権表示は0.754倍。本文基準トークンで指定し、モバイルでも共通とする。

大きな余白は本文基準の役割別トークンにする。本文画像・表・コードの前後は1.931em、カバーの上は本文サイズの1.931倍。記事一覧の区切り・ページ見出しの下は2.560倍、年別アーカイブ・脚注の上は3.089倍、記事末尾・デスクトップヘッダーの下は3.394倍、デスクトップヘッダーの上・ページ送りの上は4.096倍。モバイルヘッダーは上下2.560倍。記事一覧は罫線の前後にgapとpaddingの両方があるため、合計の間隔で評価する。段落間隔は1em、引用の前後余白は1.6emとする。コード内部・インラインコードの余白、操作対象の最小寸法は各部品の仕様に従う。

本文内のH2〜H6の余白は前2.121em・後0.687emを採用する。スケールの＋8段／−4段から算出して小数第3位に丸めた値で、見出し自身の文字サイズに追従する。CSSは階層別ではなく共通セレクターにまとめ、記事タイトルは対象外とする。最初の本文要素は上余白0を維持する。マージン相殺があるため、隣接する段落・連続見出しとの空白は指定値の単純な合計にはならない。行高・コードサイズ・操作対象の寸法にスケールを強制しない。

ブラウザの既定文字サイズが16pxならルートは10px、本文は17pxになる。本文基準トークンは本文サイズ変更に追従し、素のremで指定したコード・操作部品の寸法は本文サイズから独立する。ブラウザの既定文字サイズ変更では、どちらも同じ倍率で拡大する。ルートをpxで固定しない。[W3Cの相対サイズの説明](https://www.w3.org/WAI/tutorials/page-structure/styling/)

Safariでは-apple-system使用時の和文が約1px小さく見え、iPhone Safariでも再現したとユーザーが確認している。モバイルも本文1.7remにし、ヒラギノが見た目上約16px相当になることを狙う。これはCSSの計算値を16pxにする指定ではなく、他ブラウザを含めた一律の1px補正の保証でもない。OS判定やSafari限定CSSは追加しない。

コードブロックは`--code-size: 1.4rem`を`font-size`で参照し、行高1.3。既定文字サイズ16pxでは両幅とも14px・行送り18.2pxとなる。px固定ではないため、既定文字サイズ20pxなら17.5px、32pxなら28pxへ拡大する。インラインコードは周囲の0.85emを維持する。

- 本文基準トークン：見出し・補助文字・モジュラースケールの余白。`calc(var(--body-size) * 倍率)`で本文サイズに追従する。
- rem：本文基準値、コードサイズ、本文から独立したUIの寸法・間隔。既定文字サイズ16pxでは1rem＝10px相当。直接指定するrem値は小数第2位を四捨五入して小数第1位までとし、整数px相当に揃える。本文基準トークンの倍率とem指定は丸めず維持する。
- 外部部品：iframe内のremは別文書のルートに従う。ページへ直接挿入する部品やShadow DOM内のremはページのルートの影響を受けるため、公式ウィジェットを改変せず表示を確認する。
- em：インラインコードの文字とpadding、段落・本文見出しの余白、リストの字下げ。周囲の文字サイズに追従させる。
- 単位なし：行高。本文1.9、コード1.3。
- px：本文最大幅720px、左右ガター24px／16px、ブレークポイント640px、細い罫線・角丸。

固定heightで文字を切らず、min-heightと折り返しを使う。コードのラベルとボタンは必要なら縦に並べ、コード本文だけを横スクロールさせる。インラインコードのpaddingは行高を不自然に押し広げないようにする。paddingの有無で折り返し位置が変わる場合、段落全体の高さだけを比較して行高の増加と判定しない。

## UIの余白・寸法

UIの余白・寸法は4px相当を単位とし、8px刻みを中心にする。`--ui-space-N`は既定文字サイズ16pxで4×N px相当のrem値とする。コード本文の左右と言語ラベルの左余白は`--code-inset`（1.6rem）、シェア・プロフィールのgapは`--icon-gap`（1.2rem）を共用する。操作領域は`--control-size`（4.8rem）、コピー幅は8rem、アイコンは小2rem・標準2.4remとする。角丸は大8px（コード・画像・動画）、小4px（アイコン・ボタン・インラインコード等）に分け、配色切り替えの円形は別扱いにする。ページ左右ガターはデスクトップ24px・モバイル16px。本文基準のスケール・em指定・インラインコードの文字サイズとpaddingは変更しない。

## 操作領域

独立した操作部品の最小高さは`--control-size`（4.8rem）（既定文字サイズ16pxで48px相当）に揃える。ヘッダーナビ・記事末尾のタグ・タグ／カテゴリ一覧は最小幅を指定せず、内容幅と横gapで文字間隔を整える。ページ送り・配色・シェア・プロフィールは最小幅も4.8remとし、アイコン操作領域は正方形にする。コピーは最小高さ4.8rem、幅は8remを基本としてコンテナ幅を上限にする。サイト名は最小幅・高さ4.8rem、記事一覧・前後記事・Archivesは最小高さ4.8remを確保し、幅と高さは内容に応じて伸ばす。文字を含むリンク・ボタンに固定高さを設定しない。本文内リンク・脚注は組版を維持し、はてなスターは公式ウィジェットとして別途確認する。

ヘッダーナビの横gapはデスクトップ2.4rem・モバイル1.6rem、記事末尾タグとタグ／カテゴリ一覧の横gapは`--term-gap`（0.8rem）、リンクの左右paddingは`--term-inset`（0.4rem）を共用する。分類名と件数の内部gapは0.4remとし、項目間より狭くする。ページ送りは上下padding 0.8remと中央揃えで通常時の高さを4.8remとし、拡大時は伸びる。

## コード生成・コピー

本文の単独Markdown画像はモックのdecorate処理で`<p><img></p>`から`<figure><img></figure>`へ変換し、部品ページと同じ前後余白を適用する。文章中に混在する画像の段落は変換しない。本番でも画像レンダーフック等で同じ構造を生成するか、単独画像のラッパーに共通のブロック余白を適用する。figureだけを装飾して通常のMarkdown画像を取り残さない。

[コードブロックのレンダーフック](../mock/src/render-codeblock.html)はHugo v0.166.0で確認済み。`layouts/_markup/render-codeblock.html`に配置する。言語は`.Type`、ファイル名は`.Attributes.filename`、行番号・強調行は`.Options`を使い、本文からファイル名を推測しない。

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

ページ送りと記事間移動は、左のPreviousが新しい記事、右のNextが古い記事を指す。記事配列は新しい順とし、リンク先・DOM順・rel属性もこの順序に揃える。Hugoの取得メソッド名を画面ラベルと直接対応させず、返る記事の日付で方向を検証する。

ルートに`scrollbar-gutter: stable`を指定し、通常型スクロールバーの有無によるページ間の横移動を抑える。コード本文は`pre:focus-visible`の`outline-offset: -2px`で共通の2px輪郭を内側に描き、親の角丸とoverflowによる切れを防ぐ。コピーのフォーカスは独立して維持する。単独の本文動画はブロック表示と`--space-block`の前後余白を使い、figure内では動画自身のmarginを0にして二重化を避ける。Archivesの日付は`--text-meta`を使う。

下線の有無は`text-decoration-line`だけで切り替える。太さは`a`と、下線を直接描く子要素（`.entry-title`・`.post-nav-title`・`.term-name`・`.archive-title`）をまとめた共通ルールで`text-decoration-thickness: 1px`にする。太さは継承されないため、子要素にも明示する。`text-decoration`の一括指定は太さを`auto`へ戻すため、非表示時を含め使用しない。`a`の`text-underline-offset: 0.26em`と、その子要素への継承は維持する。

一覧は一記事を一つのネイティブリンクで囲み、`aria-labelledby`で記事タイトルをリンク名にする。長い要約全体の読み上げや重複したTab停止を避け、新しいタブで開く操作を保つ。別ボタンを追加するときはリンクの入れ子を作らない。Archivesもタイトルと日付を同じリンクにする。リンクは縦方向flex・行高1.5・gapに`--title-meta-gap`を使い、日付のmarginは0とする。タイトルを`.archive-title`で囲み、ホバー下線はタイトルだけに付ける。月のgridは`align-items: first baseline`、月見出しはmargin 0とし、先頭記事のベースラインに合わせる。記事リストは縦方向flexと`--ui-space-6`（24px）のgapを使い、月末の記事にも余白が付くliのmarginは設けない。月間隔は`--ui-space-8`（32px）、最後の月はmargin-bottom 0。年の間隔は`--space-group`を維持する。記事詳細・About・一覧・Archivesのタイトルと日付の間隔は`--title-meta-gap`（0.8rem）を共用する。分類一覧は名称を`.term-name`で囲み、ホバー下線はこの要素だけに付ける。件数も含むリンク全体のクリック範囲とフォーカスを維持する。前後記事は`rel="prev"`／`rel="next"`で役割を明示し、全画面幅で左列／右列の1行目へ配置する。列は`repeat(2, minmax(0, 1fr))`で同幅とし、列間はデスクトップ24px・モバイル16px。DOM上の順番や隣接要素の有無を役割判定に使わない。ページ送りと前後記事の方向ラベルは共通の`.nav-label`で生成し、`display: inline-block; white-space: nowrap`で記号と文字の半角スペースを保持する。Previous／Nextにpostは付けない。

配色は保存済みの明示選択を優先し、なければOS設定に追従する。初回描画前の設定でちらつきを防ぎ、ストレージの読み書きが失敗しても本文と切り替えを使えるようにする。モックの`?theme=`・`?copy=failure`、レビュー入口、文字拡大用ビルドは検証専用で、本番テーマに必要な機能ではない。

シェア・はてなスターはモックでも実サービスへ接続する。自作SVG＋通常リンクを採用し、はてなスターのみ公式スクリプトを読み込む。フッターのX・Bluesky・GitHub・RSSも同じSVGの仕組みを使う。Xへのタグ由来ハッシュタグは付けない。本実装では共有対象に記事・AboutのPermalinkを用い、location.hrefやモック専用パラメーターを使わない。[公式設定と実装上の注意](07-theme-sharing.md)を参照する。モックの固定年・記事件数・分類件数や`noindex,nofollow`を本番へそのままコピーしない。

## 紹介文・更新日・一覧のデータ

ホーム紹介文は`site.Params.homeInfoParams.content`から取得し、初ページにのみ表示する。モックは`hugo config --format json`で取得する。Aboutは現行`content/about.md`をHugoでレンダリングした本文を使う。

`lastmod`はHugo標準の更新日フィールド。既定の`.Lastmod`はGit・記事日付等へフォールバックする。現行サイトでは`enableGitInfo`を有効化しておらず、`date`だけを指定した記事では`.Lastmod`も同じ日付になる。Hugo標準の日付補完を使用し、`.Date`と`.Lastmod`をそれぞれ`2006-01-02`で整形して比較し、年月日が異なる場合だけ更新日を表示する。同日の時刻差だけでは表示しない。`.Lastmod`がゼロ時刻の場合も表示しない。[Lastmod](https://gohugo.io/methods/page/lastmod/)、[日付設定](https://gohugo.io/configuration/front-matter/)

モックもHugo標準の`.Lastmod`を取得して年月日で比較する。部品ページの更新日はfront matterから取得する。本実装での表示条件は`and (not .Lastmod.IsZero) (ne (.Date.Format "2006-01-02") (.Lastmod.Format "2006-01-02"))`とする。公開日・更新日の横gapは1.6rem、タグの横gapは0.8rem、縦gapはそれぞれ0.4rem・0.8rem。

タグ・カテゴリの名称順にはHugoの`Taxonomy.Alphabetical`を用いる。分類一覧テンプレートでは`range .Data.Terms.Alphabetical`とし、表示名・URLは各要素の`.Page`から取得する。独自の日本語照合・読み仮名対応は行わない。[Alphabetical](https://gohugo.io/methods/taxonomy/alphabetical/)

一覧は本実装で`pagination.pagerSize: 10`を維持する。モックはページ送り検証のため2件×3ページのままとする。補助UIは英語ラベル・日本語説明とする。

## RSSとOGPの互換性

RSSに含める項目・本文・対象ページの選択はテンプレート、どのページ種別でRSSを生成するかは`outputs`等の設定が担当する。テーマのテンプレートだけでなく、サイト設定も一緒に維持する。[RSS templates](https://gohugo.io/templates/rss/)、[Outputs](https://gohugo.io/configuration/outputs/)

PaperModの現行`layouts/rss.xml`を基準に、以下を踏襲する。

- home/sectionはRegularPages、taxonomy/termはPagesを対象にする。
- `hiddenInRss`、search/archivesレイアウトの除外など、現行の条件を維持する。
- Descriptionがあれば優先し、なければSummaryを使う要約形式。全文のcontent:encodedは追加しない。
- 件数制限なし（`services.rss.limit: -1`）。home・section・taxonomy・termにHTMLとRSSを維持する。
- `/index.xml`、`/posts/index.xml`、`/tags/index.xml`、`/categories/index.xml`、各タグ・カテゴリ配下の`index.xml`と`/feed.xml`からの既存リダイレクトを維持する。
- headの自動検出はページのRSS出力からURLを取得する。モックの全画面共通`/index.xml`指定をそのまま移植せず、分類一覧・個別分類では各フィードを参照する。
- RSSのlastBuildDateには従来どおり補完後の`.Lastmod`を使用する。画面上で更新日を非表示にする条件はRSS・OGP・構造化データに適用せず、日付の出力を現行と比較する。
- PaperModのコードをコピー・改変する場合はMITライセンスの表示を保持する。

RSS生成は本実装の対象とする。本実装で各フィードの対象・項目・URL・自動検出を比較する。

OGP画像はカバーのある記事だけに設定する。共通の代替画像やタイトル入り画像の自動生成は行わない。カバーを絶対URLとして解決し、カバーのない記事では画像メタ情報を省略する。

外部埋め込み（X・YouTube・Instagram・Speaker Deck等）の動作・余白・配色・失敗時表示は本実装時の確認対象とする。モックでは外部埋め込みを取得しない。
