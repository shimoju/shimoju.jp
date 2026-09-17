# T007: カバー・画像・動画

カバー、Markdown画像、figureで画像解決と変換を共有した。T005の一覧先頭（各ページ）とT006の記事カバーはeager、本文はlazyにする。R001の代表画面全体の承認は未実施。サイト設定・既存本文・凍結モックは変更していない。

## 責務と配信

`media/resolve.html`はpage bundle→assets→staticの順にローカル参照を解決する。先頭が`/`のパスはstatic、http(s)とプロトコル相対URLは外部として扱う。外部画像を取得せず、ローカル参照切れと明らかな入力型違いはビルドエラーにする。サイト共通画像を解決するためのglobal指定も用意した。実際のSNS既定画像の適用と絶対URL化はT011で検証する。

`image-data.html`は寸法・候補幅・形式、`image.html`と`img.html`はpicture/imgとsizes、`cover.html`はfront matterのカバーを扱う。PNGは同じ幅に縮小したPNGから可逆WebPを作り、JPEGは原画像から幅指定の非可逆WebP・品質80を作る。代替PNG/JPEGを同じ候補幅で出す。360/720/1080/1440px以下の候補と、上限未満の原寸を含め、切り抜き・拡大をしない。[Hugo画像処理](https://gohugo.io/content-management/image-processing/)、[形式別設定](https://gohugo.io/configuration/imaging/)

static・外部・SVG・アニメーションは加工しない。GIFはブロック境界をたどって2フレーム目を検出し、静止GIFは原形式の幅候補を生成する。PNGはacTLチャンク、WebPはVP8Xのアニメーションフラグ、AVIFはシーケンスブランドを調べる。SVGはルートのpx寸法／viewBoxを読み、取得できない寸法には著者指定を使う。画像に付けた`--image-width`は元の寸法であり、CSSの幅上限と併用して小さい画像の拡大を防ぐ。HTML-validateの既定許可範囲であるカスタムプロパティだけを使い、inline style検査を緩めていない。

`media.css`は既存の本文余白・キャプション・角丸トークンを使う。モックのカバーwidth:100%に対し、小画像は原寸までとする点は資料4 Q32の合意済み差分。figureはaltとcaptionを別々に扱い、captionのインラインMarkdownを維持する。

videoは著者のwidth/heightを必須とし、controls・playsinline・preload=metadata、既定でautoplay/loop/mutedなし。posterとフラグは必要時に指定できる。MP4の変換は行わない。Speaker Deckは32桁のIDと正の比率を受け取り、公式埋め込みスクリプトを使い、読み込み前の領域を比率で確保する。プレビューでも本文の埋め込みを維持する。[公式埋め込み案内](https://help.speakerdeck.com/help/how-do-i-share-a-deck)

## 検証と検出した問題

`pnpm check:media`は元記事のスクリーンショット・写真・MP4と、小さい透明PNG・SVG・GIF/APNG/WebPのfixtureを隔離生成する。生成そのものはHugoのみ。可逆VP8L／非可逆VP8の実チャンク、原形式素材のバイト一致、production/preview全HTML、到達不能な外部画像を取得しないこと、参照切れ・型・寸法・動画・Speaker Deckの負例を検査する。WASM画像エンコーダーのキャッシュは検査時に`.cache/hugo`へ隔離する。

`tests/media.spec.ts`は3エンジンで候補幅・寸法・eager/lazy・figure・動画既定値・小画像非拡大・DPR 1/2・JS無効・axeを確認する。1280/400px・両配色のカバー寸法を凍結モックと比較する。PNGの各幅と代替WebPは不透明RGBとalphaが一致し、半透明RGBは合成後の8bit値で1段階以内に収まることを確認する。これは可逆圧縮形式の確認と、変換／ブラウザでの透明画素の丸めを区別するためである。

初回検証では、Hugoのslice関数を文字列のバイト範囲と誤解したアニメーション判定、SVG MediaTypeのsuffix扱い、カバーの読み込み前の拡大を検出し修正した。PNGとWebPの縮小を別々に行うと、パレットPNGで結果が異なったため、縮小PNGから可逆WebPへ変換する順序に統一した。

半透明の実スクリーンショットでは、WebKitのCanvas出力は一致し、Chromium/Firefoxにはunpremultiply後のRGB差があった。ImageMagickによる追加切り分けでもalphaは一致し、透明でない画素のRGB差は最大1、完全透明部分は非表示RGBが変わっていた。可逆形式であることは実ファイルのVP8Lチャンクを独立に検査している。画素全体を無条件に許容する検査にはせず、不透明RGB・alphaの完全一致と半透明の合成後の上限を検査する。

比較画像は`t007-media-images/`、統合結果は`t007-check.log`を参照。PNG文字と写真の表示、縦横比、キャプション、両配色を目視確認した。外部画像の失敗はfixtureで意図的に発生させている。Speaker Deckの実通信と動画の配信環境・実機確認は後続の外部接続／配信検証に残る。この検証は全画面の完成・R001承認を意味しない。
