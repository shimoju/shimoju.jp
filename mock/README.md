# 静的HTMLモック

[視覚要件](../docs/04-theme-visual-requirements.md)の配置・組版・操作を確認するためのHTML。Hugoテーマの完成実装ではなく、本番の設定・テンプレート・記事は変更していません。

## 開く

リポジトリ直下で実行します。生成済みHTMLの閲覧にはNode.jsだけを使い、ビルドや依存パッケージのインストールは不要です。

```sh
node mock/serve.mjs
```

[入口](http://127.0.0.1:4173/)から画面と配色を選べます。[ホーム](http://127.0.0.1:4173/home.html)、[実記事](http://127.0.0.1:4173/article.html)、[本文部品](http://127.0.0.1:4173/specimen.html)へ直接移動もできます。

サーバーは既定で`0.0.0.0`（すべてのIPv4インターフェース）で待ち受け、mock/site/だけを配信します。同じネットワークの別マシンでは`http://<このMacのLANアドレス>:4173/`を開きます。認証なしのHTTP配信なので、信頼できるネットワーク内での検証に限定してください。停止はCtrl+C。ローカル限定に戻す場合は`MOCK_HOST=127.0.0.1 node mock/serve.mjs`、別ポートは`MOCK_PORT=4174 node mock/serve.mjs`です。

LANアドレス経由のHTTPは通常secure contextにならないため、Clipboard APIによるコードコピーは失敗することがあります。フォント・配色・レイアウトは検証できますが、コピー機能の検証はlocalhostまたはHTTPSで行ってください。

## 収録画面とソース

レビュー入口を含む33ページ。同じHTMLを各幅・両配色で表示します。

| 画面 | ファイル |
| --- | --- |
| ホーム・記事一覧とページ送り | home.html、home-2.html、home-3.html、posts.html、posts-2.html、posts-3.html |
| 実記事5件 | article.html、article-hugo.html、article-diary.html、article-bgm.html、article-pasmo.html |
| About・Archives・404 | about.html、archives.html、404.html |
| タグ・カテゴリ一覧と個別分類 | tags.html、categories.html、tag-1〜11.html、category-1〜2.html |
| 0件・1件・要約なし | empty.html、single-item.html |
| 本文部品とレビュー入口 | specimen.html、index.html |

- [src/theme.css](src/theme.css)：配色・フォント候補・サイズ・余白・レスポンシブ。
- [src/theme.js](src/theme.js)：配色、コピー、レビュー用条件、外部送信しない操作デモ。
- [src/specimen.md](src/specimen.md)：H2〜H6、表、脚注、コード・画像の境界条件。
- [src/render-codeblock.html](src/render-codeblock.html)：Hugoのコード生成・言語・ファイル名・行番号。
- [build.mjs](build.mjs)：実記事をHTML化し、共通枠を付けてsite/へ生成。素材のパスはsite/manifest.jsonにも記録。
- [inspect-fonts.mjs](inspect-fonts.mjs)：必要時にフォントファイルのpalt・名目送り幅等を再確認するツール。

生成済みファイルは直接編集せず、src/とbuild.mjsを変更して再生成します。

## 再生成と検査

```sh
node mock/build.mjs
node mock/verify.mjs
node mock/test-theme.mjs
node mock/test-copy.mjs
```

再生成時だけHugoが必要です。確認環境はHugo v0.165.0、Node.js v24.20.0。Hugo付属ChromaのLatte／Mochaを生成し、モード別セレクター以外のハイライト宣言は変更しません。Markdown変換は一時ディレクトリで行い、本番のpublic/や設定には触れず、外部埋め込みも取得しません。

文字拡大・OS別フォント・キーボード等の確認は[検証手順](../docs/06-theme-validation.md)、書体と単位の理由は[実装上の判断理由](../docs/05-theme-implementation.md)を参照してください。

## 表示条件と操作の境界

コードブロック・インラインコードは`Menlo, Consolas, monospace`に確定しています。和文候補とui-monospaceは指定せず、palt・合字・自動カーニングを無効化します。MacではMenlo、WindowsではConsolasを優先し、それ以外と和文はブラウザへ委ねます。本文との書体の一致ではなく、欧文の等幅性と和文混植の読みやすさを確認します。specimen.htmlのコード診断でiiii／WWWW／0000の字幅を比較できます。

| 条件 | 指定 |
| --- | --- |
| 配色 | `?theme=light`／`?theme=dark` |
| コピー失敗 | `specimen.html?copy=failure#code` |
| 組版・日本語コード | specimen.html。palt、フォールバック、paddingの診断用サンプル |
| 文字拡大の一時ビルド | `node mock/build.mjs --text-scale=1.25`／`--text-scale=2`。確認後は通常ビルドへ必ず戻す |

配色パラメーターは保存済み設定より優先しますが、それだけでは保存内容を変えません。配色ボタンでモック専用キー`shimoju-mock-theme`に保存し、明示選択がなければOS設定に追従します。システム設定への復帰UIはありません。

本文・記事見出し・サイト名は`-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Noto Sans JP", "Noto Sans CJK JP", sans-serif`で確定しています。旧案・Variable版の選択UIは撤去し、古い`?typography=`パラメーターも無視します。見出しは500・サイト名は300、本文は400、strong／b・thは700です。

Macの和文がNotoへフォールバックするのを避けるため、Hiragino SansをNotoより前に明示します。Windowsにヒラギノがあっても欧文はSegoe UIを優先するため、その後ろに置きます。通常版Segoe UIの500でSemiboldになることはユーザーがWindows実機で確認済みです。別環境では入口の200・300・400・500・700サンプルで実際のフェイスを確認できます。選定理由・フォールバックの注意点は[実装上の判断理由](../docs/05-theme-implementation.md)を参照してください。

サイトタイトルはウェイト300に確定しました。本文と同じ書体のまま軽くすることでリズムをつくります。サイズ1.931rem・字間、本文400・記事見出し500・強調700は維持します。比較UIは撤去し、古い`?site-weight=`パラメーターは無視します。実フォント確認欄の200・300・400・500・700は診断用に残します。実フェイスは開発者ツールで確認し、CSSの計算値と区別してください。

ルートは全幅で106.25%、本文1rem・記事タイトル1.6rem・サイト名1.931remです。既定文字サイズ16pxでは本文のCSSサイズは17px。Safariの和文が小さく描画される実測を踏まえ、モバイルにも同じ割合を採用しました。コードブロックは`calc(14 / 17 * 1rem)`（標準設定で14px）・行高1.3。インラインコードは0.85emを維持します。ブラウザの既定文字サイズ変更にすべて追従します。

見出しは`1rem × 1.6^(n / 5)`を小数第3位に丸めて指定します。H6からH1をn=0〜5、サイト名をn=7とします。補助文字は同じスケールの−1／−2／−3段を用い、0.910／0.829／0.754remに揃える。一覧タイトルは＋2段の1.207rem。要約・ナビ・ページ送り・脚注・表・Archivesの月は0.910rem、日付・タグ・キャプションは0.829rem、小さなラベル・著作権表示は0.754rem。要約とナビの文字サイズはモバイルでも共通とする。

大きな余白は役割別トークンにする。本文画像・表・コードの前後は1.931em、カバーの上は1.931rem。記事一覧の区切り・ページ見出しの下は2.560rem、年別アーカイブ・脚注の上は3.089rem、記事末尾・デスクトップヘッダーの下は3.394rem、デスクトップヘッダーの上・ページ送りの上は4.096rem。モバイルヘッダーは上下2.560rem。記事一覧は罫線の前後にgapとpaddingの両方があるため、合計の間隔で評価する。段落1em・引用1.6em、コード内部・インラインコードの余白、操作対象の最小寸法は維持する。

### 本文見出しの余白

本文内のH2〜H6は前2.121em・後0.687emを採用確定とします。同じスケールの＋8段／−4段から算出し、各見出し自身の文字サイズに追従させます。記事タイトルは対象外で、本文の先頭要素は上余白0を維持します。マージン相殺を含む実際の間隔と、CSSの計算値を分けて確認します。

比較用の選択UIは撤去しました。古い`?heading-space=`パラメーターは無視し、常に確定値を適用します。

- 配色、コードコピー、ページ送り、ローカルな画面遷移は動作します。コピーは実際のクリップボードへ書き込み、入口の貼り付け欄で照合できます。欄の内容は送信・保存しません。
- コピーはCopy → Copied → 3秒後にCopy。失敗はCopy failedとなり再試行できます。ブロック下部の可視メッセージは出しません。
- シェア3サービスとはてなスターはローカルな表示デモ。実投稿・反応・ログイン・サービス連携は行いません。
- 実記事の外部リンク、プロフィール、RSSは実サイトへ移動します。
- 記事本文は実記事を使い、X埋め込みだけリンクへ置き換えています。記事・分類件数とページ数は収録分です。ホーム紹介文は仮文、部品ページの日付は検証用です。
- 入口と診断サンプルはテーマ本来のUIではありません。読者向けUIは現在のモックでは英語表記で、記事本文と説明は日本語です。
