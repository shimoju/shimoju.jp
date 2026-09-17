# 自作テーマのドキュメント

現在の表示・操作仕様は[HTMLモック](../mock/README.md)を正とし、その判断理由を資料3に記録する。資料1・2はHugoとPaperMod・現サイトの仕組みを調べた資料であり、自作テーマの採用方針とは分けて読む。実装は資料4の合意事項に基づく。移行完了後は、表示・操作仕様の正をテーマ・検査用ページ・文書へ移す。

実装要件は2026-09-17に確定。記事・固定ページなどの用語は[CONTEXT.md](../CONTEXT.md)にまとめる。

| 資料 | 役割 |
| --- | --- |
| [1. Hugoのテーマ構造と責務](01-hugo-theme-structure.md) | ページ種別、テンプレート、Hugo本体・テーマ・サイト・配信側の責務分担 |
| [2. PaperModと現サイトの調査](02-papermod-analysis.md) | 対象版の表示・RSS・SEO・画像処理と、現サイトの設定・独自の上書き |
| [3. デザインの軸と情報設計](03-theme-visual-requirements.md) | コンセプト、情報の役割、書体・組版・配色・操作性の判断理由 |
| [4. Hugoテーマの実装要件](04-theme-implementation-requirements.md) | 合意した対象・設定・出力・開発ツール・移行要件と、判断の依存関係 |

[モックREADME](../mock/README.md)には閲覧・再生成・検査方法と収録画面を記載する。寸法や配色の詳細は[モックのCSS](../mock/src/theme.css)、配置と操作は生成された画面を参照する。収録記事・件数・レビュー用UIは、デザインを確認するためのサンプルである。

## 技術情報の前提

- Hugo構造の調査・モックの確認環境：Hugo v0.166.0 Extended、Node.js v24.21.0。PaperModの初回調査環境は資料2に記載。
- PaperModの移行元調査：[`d3768854d00ad003b0a8dbdba254ce9224377a01`](https://github.com/adityatelange/hugo-PaperMod/tree/d3768854d00ad003b0a8dbdba254ce9224377a01)。最新リリースを意味しない。
- Hugo・PaperModの調査は公式仕様、固定リビジョンのソース、サイト設定を照合したもの。対応バージョンを変更するときは再確認する。
- 資料1はHugo v0.146以降のテンプレート命名を扱う。[Hugoのテンプレートシステム](https://gohugo.io/templates/new-templatesystem-overview/)
