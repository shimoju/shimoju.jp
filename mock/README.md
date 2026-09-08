# 静的HTMLモック

[視覚要件](../docs/04-theme-visual-requirements.md)の配置・組版・操作を確認するためのHTML。Hugoテーマの完成実装ではなく、本番の設定・テンプレート・記事は変更していません。

## 開く

リポジトリ直下で実行します。生成済みHTMLの閲覧にはNode.jsだけを使い、ビルドや依存パッケージのインストールは不要です。

```sh
node mock/serve.mjs
```

[入口](http://127.0.0.1:4173/)から画面と配色を選べます。[ホーム](http://127.0.0.1:4173/home.html)、[実記事](http://127.0.0.1:4173/article.html)、[本文部品](http://127.0.0.1:4173/specimen.html)へ直接移動もできます。

サーバーは127.0.0.1だけで待ち受け、mock/site/だけを配信します。停止はCtrl+C。別ポートは`MOCK_PORT=4174 node mock/serve.mjs`。ファイルを直接開いても文章は表示できますが、コピー・設定保存の検証はlocalhost経由で行ってください。

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

| 条件 | 指定 |
| --- | --- |
| 配色 | `?theme=light`／`?theme=dark` |
| コピー失敗 | `specimen.html?copy=failure#code` |
| 組版・日本語コード | specimen.html。palt、フォールバック、paddingの診断用サンプル |
| 文字拡大の一時ビルド | `node mock/build.mjs --text-scale=1.25`／`--text-scale=2`。確認後は通常ビルドへ必ず戻す |

配色パラメーターは保存済み設定より優先しますが、それだけでは保存内容を変えません。配色ボタンでモック専用キー`shimoju-mock-theme`に保存し、明示選択がなければOS設定に追従します。システム設定への復帰UIはありません。

- 配色、コードコピー、ページ送り、ローカルな画面遷移は動作します。コピーは実際のクリップボードへ書き込み、入口の貼り付け欄で照合できます。欄の内容は送信・保存しません。
- コピーはCopy → Copied → 3秒後にCopy。失敗はCopy failedとなり再試行できます。ブロック下部の可視メッセージは出しません。
- シェア3サービスとはてなスターはローカルな表示デモ。実投稿・反応・ログイン・サービス連携は行いません。
- 実記事の外部リンク、プロフィール、RSSは実サイトへ移動します。
- 記事本文は実記事を使い、X埋め込みだけリンクへ置き換えています。記事・分類件数とページ数は収録分です。ホーム紹介文は仮文、部品ページの日付は検証用です。
- 入口と診断サンプルはテーマ本来のUIではありません。読者向けUIは現在のモックでは英語表記で、記事本文と説明は日本語です。
