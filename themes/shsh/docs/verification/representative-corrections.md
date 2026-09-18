# T019: 代表画面比較からの是正

T009の比較準備で検出したT007の画像配置と、T004/T005のCSS重複を、元タスクから分けて修正した。仕様の変更ではなく、凍結モックの表示と資料5の共通化規律へ揃える是正である。

## F008: 単独画像

凍結モックの`mock/build.mjs`は単独のMarkdown画像をfigureへ変換していた。最初の実装ではp内のpictureとして出力し、インラインの行ボックスと段落余白によって約10pxの高さの差や前後位置の差が生じた。

Hugoの`markup.goldmark.parser.wrapStandAloneImageWithinParagraph: false`をサイト側で明示し、画像hookのIsBlockでfigureと文中画像を分ける。この設定はテーマのhugo.tomlから既定では取り込まれないため、検査fixtureに明示した。本番設定への追加はT012の移行作業に含める。[Hugo画像render hook](https://gohugo.io/render-hooks/images/)、[設定のマージ](https://gohugo.io/configuration/introduction/)

Goldmarkはリンク内の単独画像にもIsBlockを返す一方、そのリンクの外側にはpを残す。そのままfigureを入れるとブラウザのHTML修復により空リンクが生じ、axeがlink-name違反を検出した。リンクhookで直下のfigureラッパーだけを除き、リンク内の画像をinlineで保持した。リンク文字列とtitle、文中画像の前後の空白を保つ。生成HTMLだけでなくブラウザのDOMとアクセシビリティを検証する。

画像候補の整数丸めでレイアウトが動かないよう、元画像のwidth/heightからCSS aspect-ratioを与える。寸法なしの外部画像はautoのまま。PNG/JPEGの変換・候補幅・読み込み優先度の規則はT007と共通。

## F009: 操作列の重複

`footer-links`のdisplay/flex-wrap/gap/font-sizeがcontrols.cssとlist.cssで重複していたため、操作列の所有箇所であるcontrols.cssに残した。layout.cssのjustify-contentはフッター内の配置を担当する別の宣言として保持する。宣言の値や画面上の配置は変えていない。

## 再現用の検査

`build-review-fixture.ts`はモックと同じ5記事と紹介文から隔離サイトを作る。既存の動画shortcodeに寸法を足すのは隔離コピーだけで、本番本文は変更しない。本文部品の入力もMarkdownとfigureへ変換し、モック専用のpadding/font診断だけを除く。unsafe=falseで生成する。外部取得は固定shortcodeへ置き換える。検査HTTPサーバーは動画metadataを各エンジンで読めるようRangeに対応する。

`tests/review.spec.ts`は1440×1000／390×844・両配色でホーム、一覧、実記事、本文部品を比較する。ホーム／一覧はヘッダー・main・カード・ページ送り・フッター、実記事はヘッダーと全本文ブロックの寸法・位置を0.06px未満の差で確認する。記事末尾のタグ／前後記事はT010の範囲のため比較対象に含めない。本文部品は診断UIを除いた入力のため全体の座標一致は要求せず、既存T006の部品比較と合わせて確認する。

125%／200%の文字拡大はルート文字サイズを条件として変更し、ページ全体が横へあふれないことを確認する。Firefoxのフォント量子化を考慮し、理論値との差を0.06px以内で確認する。実機の既定フォント設定やOSの拡大はT016で別途確認する。

メディアfixtureには単独画像、前後に文字のある画像、画像だけのリンクを追加し、figureの配置・文中の空白保持・空リンクなし・axeを検査する。最終結果は`t019-check.log`を参照。R001の画像とレビュー説明はT009で提出する。
