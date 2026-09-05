# Hugo自作テーマの調査

調査日: 2026-09-05。モック作成、要件定義、PaperModからの移行判断に使うための資料。

| 資料 | 主な用途 |
| --- | --- |
| [1. 必要な画面とテンプレート](01-hugo-theme-structure.md) | モックの画面・状態一覧、ディレクトリ構成、Go templateの実装例 |
| [2. Hugo本体とテーマの責務](02-hugo-core-vs-theme.md) | minify、画像、SRI、ハイライト、shortcode、SEOなどの要件分担 |
| [3. PaperModの機能・品質・性能](03-papermod-analysis.md) | 実装と有効化条件、採否の提案、現サイトとの差分、性能比較の手順 |

## 調査対象と根拠

- 作業ブランチ: `hugo-theme`。テーマ・サイトの実装変更は行わず、調査資料を追加。
- サイト側の調査開始時コミット: `fb3a9bb0b0a943afb5e666520f82be7414c2fd75`。開始時の追跡ファイルに未コミット差分なし。
- ローカルHugo: `v0.165.0+extended+withdeploy`（darwin/arm64）。以降の新規テンプレート例はこのバージョンを基準とする。
- PaperMod: サブモジュールに固定された [`d3768854d00ad003b0a8dbdba254ce9224377a01`](https://github.com/adityatelange/hugo-PaperMod/tree/d3768854d00ad003b0a8dbdba254ce9224377a01)（2026-08-02、`v8.0-139-gd376885`）。これは調査対象の固定リビジョンであり、最新リリースを意味しない。
- Hugoの仕様は公式ドキュメント、PaperModの挙動は固定リビジョンのソース、現サイトの設定はリポジトリ内の実ファイルを優先した。WikiとREADMEの機能名は実装と照合した。
- 「採用推奨」「目標案」は要件定義への提案であり、採用決定や性能の達成報告ではない。

Hugo v0.146.0ではテンプレート構造が変わっている。旧記事にある`_default/`、`partials/`、ホーム用`index.html`を新規設計にそのまま持ち込まない。現行の命名は[公式の移行説明](https://gohugo.io/templates/new-templatesystem-overview/)を参照し、今回のPaperModも`_partials/`等を使っている。

## 確認範囲

資料1の4つのテンプレート例はそのまま取り出して最小サイトをビルドし、home・一覧2ページ目・section・記事・固定ページ・taxonomy・term・空sectionの8出力を確認した。資料内の相対リンク、アンカー、参照形式リンク、固定PaperModリビジョンの参照パスも確認した。

公式資料・テーマソース・現サイト設定の調査に加え、一時ディレクトリにproductionビルドし、生成HTMLの画像属性、CSSとSRI、JSON-LD、出力ファイルを確認した。静的ファイルのサイズは[資料3](03-papermod-analysis.md#ローカルビルドで確認した基準値)に記録した。

ビルドは成功したが、ネットワーク制限によりX埋め込みの取得警告が出た。埋め込みを含む本番相当の性能測定には使えない。PageSpeed Insights / Lighthouseのブラウザー計測、実ユーザーのCore Web Vitals計測、WCAG適合性評価は実施していない。資料3のベンチマーク手順は自作テーマ完成時の比較に使う。

PaperMod調査で判明した責務の補足は[資料2のフィードバック一覧](02-hugo-core-vs-theme.md#papermod調査からのフィードバック)に集約し、同資料の各説明にも反映した。
