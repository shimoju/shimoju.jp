# 自作テーマの実装ドキュメント

合意した要件と静的HTMLモックを基準に、自作Hugoテーマの実装に必要な情報をまとめる。見た目の仕様は資料4、詳細な値は[モックのCSS](../mock/src/theme.css)、実際の配置・操作は[HTMLモック](../mock/README.md)を参照する。本番テーマの完成・公開・全記事移行を完了したものではない。

| 資料 | 役割 |
| --- | --- |
| [1. 画面とテンプレート](01-hugo-theme-structure.md) | 対象画面をHugoのKind・テンプレートに対応付ける。構成・最小例・ページ送りの注意 |
| [2. Hugo本体とテーマの責務](02-hugo-core-vs-theme.md) | アセット、画像、ハイライト、shortcode、SEO、配信の担当を区別する |
| [3. PaperModからの移行](03-papermod-analysis.md) | 既存URL・コンテンツ・外部サービス・SEO・性能の移行時の注意 |
| [4. 視覚要件](04-theme-visual-requirements.md) | 画面、情報、書体、サイズ、配色、本文部品、操作の仕様 |
| [5. 実装上の判断理由](05-theme-implementation.md) | コードの欧文等幅性、OS別フォールバック、palt・等幅性、相対サイズ、コード生成 |
| [6. 検証手順](06-theme-validation.md) | 自動テスト、幅・配色・文字拡大、フォント、操作、本実装で残る確認 |

[モックREADME](../mock/README.md)には閲覧・再生成方法、収録画面、動く操作と表示デモの境界を記載する。モックのUI表記やサンプルデータを、本番のコンテンツ仕様と混同しない。

## 技術情報の前提

- Hugoの確認環境：v0.165.0 Extended。Node.js：v24.20.0。
- PaperModの移行元調査：[`d3768854d00ad003b0a8dbdba254ce9224377a01`](https://github.com/adityatelange/hugo-PaperMod/tree/d3768854d00ad003b0a8dbdba254ce9224377a01)。最新リリースを意味しない。
- Hugo・PaperModは公式仕様、固定リビジョンのソース、サイト設定を照合した。フォント情報の確認基準日は2026-09-08。対応バージョンや提供状況を変更するときは再確認する。
- Hugo v0.146以降の命名を使い、`layouts/_partials/`、`_markup/`、`_shortcodes/`を基本とする。旧テンプレート構成をそのまま新実装へ持ち込まない。[Hugoのテンプレートシステム](https://gohugo.io/templates/new-templatesystem-overview/)
- 可視UIと移行前の機能は区別する。検索・Profile・目次・読了時間等は作らない。SEO・性能・公開範囲は見た目だけでは確定できないため、資料2・3・6を参照する。
