# 自作テーマのドキュメント

最新の表示・操作仕様は[HTMLモック](../mock/README.md)を正とする。資料4はその判断理由、資料1〜3はHugoと移行元PaperModの調査資料として読む。記述がモックと異なる場合は、モックを優先する。具体的なテーマ実装は実装フェーズで検討する。

| 資料 | 役割 |
| --- | --- |
| [1. 画面とテンプレート](01-hugo-theme-structure.md) | 対象画面をHugoのKind・テンプレートに対応付ける。構成・最小例・ページ送りの注意 |
| [2. Hugo本体とテーマの責務](02-hugo-core-vs-theme.md) | アセット、画像、ハイライト、shortcode、SEO、配信の担当を区別する |
| [3. PaperModからの移行](03-papermod-analysis.md) | 既存URL・コンテンツ・外部サービス・SEO・性能の移行時の注意 |
| [4. デザインの軸と情報設計](04-theme-visual-requirements.md) | コンセプト、情報の役割、書体・組版・配色・操作性の判断理由 |

[モックREADME](../mock/README.md)には閲覧・再生成・検査方法と収録画面を記載する。寸法や配色の詳細は[モックのCSS](../mock/src/theme.css)、配置と操作は生成された画面を参照する。収録記事・件数・レビュー用UIは、デザインを確認するためのサンプルである。

## 技術情報の前提

- モック・テンプレート例の確認環境：Hugo v0.166.0 Extended、Node.js v24.21.0。
- PaperModの移行元調査：[`d3768854d00ad003b0a8dbdba254ce9224377a01`](https://github.com/adityatelange/hugo-PaperMod/tree/d3768854d00ad003b0a8dbdba254ce9224377a01)。最新リリースを意味しない。
- Hugo・PaperModの調査は公式仕様、固定リビジョンのソース、サイト設定を照合したもの。対応バージョンを変更するときは再確認する。
- Hugo v0.146以降の命名を使い、`layouts/_partials/`、`_markup/`、`_shortcodes/`を基本とする。旧テンプレート構成をそのまま新実装へ持ち込まない。[Hugoのテンプレートシステム](https://gohugo.io/templates/new-templatesystem-overview/)
- SEO・性能・公開範囲の調査は資料2・3を参照する。
