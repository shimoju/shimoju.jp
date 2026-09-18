# R004: 旧上書き撤去と実装レビューへの回答

R003への追加指摘をT022で対応した。表示を変更する修正はなく、[R003の比較ページ](http://127.0.0.1:4184/r003/)と[共通設計の説明](r001-review.md)を引き続き参照する。今回の差分と確認結果は本資料にまとめる。代表画面・共通設計は承認済み（T023）。ユーザーはR001で提示したホーム・一覧・実記事・本文部品のPC／モバイル・両配色を、残りの画面へ展開する土台として明示承認した。R001→R003→R004の修正履歴を保持し、最新のR004へ承認を記録する。移行完了の承認は含まない。ユーザー指示により今回は承認記録のみを行い、続きの実装は別セッションのT010から再開する。

## 旧上書きとコメント（F012）

- サイトルートの`assets/css/extended/override.css`、`layouts/_partials/extend_head.html`、`layouts/_partials/share_icons.html`を削除した。shshはCSSを明示的なimportで組み立て、これらのpartialも呼ばないため、現在の生成結果には影響しない。
- サイト側の同名ファイルがテーマを上書きするHugoの構造を踏まえ、今後の意図しない干渉を避けるため、ユーザー指示により撤去時期を前倒しした。資料4 Q34とT018の残件も更新した。
- `bin/update-theme`から削除したpartialとのdiffを除いた。PaperMod submoduleと更新スクリプト自体は移行確認後の撤去対象として残す。
- `theme.ts`の`no mock query parameters or key migration.`を削除した。初期描画と切替の規則を揃えるという機能上の説明は残した。

ルートの`hugo.yml`はまだPaperMod指定なので、その設定で今後生成する場合は今回削除した独自CSS・共有部品・著者リンクの上書きが外れる。配信済みサイトへのデプロイは行っていない。shsh本番切替とコンテンツ移行はT012の対象。

## CSSの互換性

`min-height: 100vh`の後に`100dvh`を置くのはフォールバック。対応ブラウザでは後者だけが採用され、未対応ならその宣言を無視して前者を使う。両方を加算したり、最大値を取ったりする指定ではない。dvhはモバイルのアドレスバーなどで変わる表示領域の高さに追従する。[MDNのviewport単位の説明](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length#relative_length_units_based_on_viewport)。現行安定版だけならvhのフォールバックは必須ではないが、現在の指定に競合はなく維持した。

`display: -webkit-box`、`-webkit-box-orient: vertical`、`-webkit-line-clamp: 3`は互換性のためFirefoxを含む他エンジンにも実装されている組み合わせ。[CSS Overflow Level 4草案の互換性規定](https://drafts.csswg.org/css-overflow-4/#webkit-line-clamp)と[MDNの説明](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/line-clamp#description)にも記載がある。今回の3エンジンでは接頭辞なしの`line-clamp`は未対応のため、置換せず現状を維持する。

## single.htmlと新テンプレートシステム

Hugo 0.166.0の`hugo new theme`で生成したスケルトンは`page.html`を含み、`single.html`を含まない。しかし[新テンプレートシステムの公式説明](https://gohugo.io/templates/new-templatesystem-overview/)は、`single`を標準レイアウトとして定義している。廃止済みの構文を使っているわけではない。

shshの`single.html`は記事と通常の固定ページに共通の詳細画面で、現在の適用範囲に合っているため維持した。`page.html`はpage kindを指定する名前で、同じ条件なら`single.html`より優先される。最小サイトでも記事・Aboutの両方がsingleを選び、pageを追加すると両方がpageを選ぶことを確認した。

## 検証

[実測値](t022-probes.json)に次を記録した。

- 代表fixtureのコピーに旧上書き3ファイルを追加し、削除前後をHugo 0.166.0・production・固定clockで別々に生成。全129ファイルのパスとSHA-256が一致した。
- Playwright 1.63.0のChromium 153.0.8010.12、Firefox 155.0、WebKit 26.6で、幅390/1440px・高さ900pxの実テーマを使用。長い要約をDOMに入れ、制限時の高さが行高の3倍、制限解除時はそれより長くなることを確認した。全環境でdvhと接頭辞付きの指定に対応し、bodyの計算済みmin-heightは900pxだった。
- 上記はデスクトップ自動化エンジンでの確認であり、モバイル実機のブラウザUI開閉やSafari実機の確認は予定どおりT015で行う。
- Hugo最小サイトでsingleのみの場合とpage追加後の選択結果を照合。`bin/update-theme`は`sh -n`で構文検査し、実行はしていない。

初回は39件中37件が成功し、Chromiumの横溢れ検査2件が失敗した（[初回ログ](t022-check-initial.log)）。`scrollbar-gutter: stable`で15pxが確保され、幅1440pxに対してscrollWidthが1425pxになる正常状態を、完全一致の条件が誤判定していた（F013）。検査を`scrollWidth <= clientWidth`へ修正し、2000pxの要素を追加すると不合格になる負例も確認した。テーマの表示・寸法比較の期待値は変更していない。

整形・型lint・Hugo生成・テーマ/一覧の静的検証が成功し、配色・一覧・代表画面のブラウザ検査は再実行で**39件成功（30.2秒）**した（[再検証ログ](t022-check.log)）。残りの画面展開、本番移行、全件照合、実機・性能・Cloudflare Pagesの検証は未完了。
