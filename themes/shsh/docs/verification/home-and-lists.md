# T005: ホーム・記事一覧・共通記事集合

T005のテキスト部分とページ送りを実装・検証した。R001承認前のため状態は`implemented`とする。本番サイトはPaperModのまま。カバーの組み込みと画像処理はT007、実記事と同じ内容での完成形の表示比較・レビューはT009へ対応付ける。凍結モックは変更していない。

## 構造と生成規則

- `posts.html`がHugoの公開条件適用後の`site.RegularPages`を`site.MainSections`で絞る。日時をUTC・ナノ秒精度でまとめ、日時降順、同日時の中を公開パス昇順にする。タイトルや入力順へ依存しない。ホームと記事セクションが同じ集合を使用し、後続のArchives・RSS・前後記事からも参照できる。
- `home.html`は最初のページだけMarkdown紹介文を表示する。`post-list.html`がカードと空状態、`pagination.html`がPrev／Nextとページ番号を担当する。Hugo既定の10件と`pagination.pagerSize`を使う。
- `summary.html`は明示summary、more、Hugo自動要約の順でテキスト化する。明示空文字は要約を表示しない。descriptionを一覧へ流用しない。Markdownの装飾とリンクを除いたテキストをHTMLでエスケープし、リンクを入れ子にしない。Hugo標準の優先順はmoreが先なので、その違いを明示的に扱う。[Hugo Summary](https://gohugo.io/methods/page/summary/)
- `summaryLength: 140`と`hasCJKLanguage: true`は本番の既存設定を維持し、検証サイトにも指定する。Hugo自動要約の段落境界を維持し、独自の140文字切り詰めへ置き換えない。
- `local-time.html`はHugoの設定タイムゾーンを、オフセットのない日時の解析結果のLocationから取得する。表示する日付をそのIANAゾーンへ変換し、`date.html`で既定2006/01/02または`params.dateFormat`を使う。日付の並び順は表示文字列で決めない。[Hugo time.In](https://gohugo.io/functions/time/in/)
- `front-matter.html`が元ファイルからRawContentを除いてYAML/TOML/JSONを解析する。Hugoが補完する`.Params.date`や文字列へ変換するsummaryを入力検査の根拠にしない。`validate-post.html`で記事の明示dateを検査し、要約の明らかな型違いもビルドエラーにする。固定ページへの明示date必須条件の拡大はしない。
- `list.css`は一覧・紹介・ページ送りと、後続の記事ヘッダーでも使う日付表示の責務を持つ。既存の役割別トークンを使い、本文とUIの尺度を維持する。画像のCSSはT007で追加する。

## 検査と証拠

`pnpm check:collections`は隔離サイトを生成し、0件／1件／既定10件／変更2件、複数mainSections、固定ページ除外、同時刻の別オフセットとナノ秒差、draft／future／publishDate予約／expiryDate、summaryとmoreの競合、空summary、テキストのエスケープ、日本語自動要約、日付書式、明示date欠落・summary型不正・書式型不正を検査する。YAML・TOML・JSONのdate検査も通す。

`tests/collections.spec.ts`はChromium／Firefox／WebKitで次を確認する。

- 2件×3ページのホームと記事一覧を移動し、紹介文は初ページのみ、左Prevは新しいページ・右Nextは古いページ、最終ページ1件を確認。
- 1280px／400px／320pxと両配色で、凍結モック`home-2.html`との書式・余白・区切り・ページ送り寸法を照合。横はみ出しとaxe違反なし。
- JS無効時のページ送りと、見出しで名前が付いたカード全体のリンクが機能。

既存の共通枠・配色・formatter検査を含む全30ブラウザテストが成功した。最終の統合検査は`t005-check.log`を参照。実記事を揃えた画像・スクリーンショットによる完成形比較はT007／T009に残る。この段階の成功をR001承認や移行完了として扱わない。

## 発見事項と内部是正

F004: 凍結モックでは汎用spanにページ番号の`aria-label`があり、HTML-validateが`aria-label-misuse`を検出した。同じ表示・読み上げ文言を保持するため、そのspanを名前付きgroupにした。表示・操作仕様の変更ではなく、資料5 Q1の内部是正として扱う。

Hugo標準のpage/1エイリアスはDOCTYPEの表記と省略bodyがプロジェクトのHTML検査に合わなかった。テーマの`alias.html`で小文字DOCTYPEと明示bodyを出し、標準と同じcanonical／即時refreshを維持した。previewではnoindexを付ける。HTML検査の無効化・例外追加は行っていない。

開発途中に検出した誤りも修正した。Hugoには`site.TimeZone`がなく、テーマ直下のhugo.tomlではsummaryLengthの既定値を上書きできない。前者は上記のLocation取得、後者は既存サイト設定の維持とfixtureへの明示設定で対処し、無効なテーマ設定ファイルを残さなかった。
