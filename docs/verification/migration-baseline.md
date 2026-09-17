# 移行前の照合基準（T002）

対象は移行開始前の `c266ebb` とPaperMod `d3768854d00ad003b0a8dbdba254ce9224377a01`。 [抽出スクリプト](../../scripts/capture-migration-baseline.py) はGitから隔離ディレクトリへ展開し、Hugo 0.166.0で生成する。本番の設定・コンテンツ・public・凍結モックには書き込まない。

```sh
python3 scripts/capture-migration-baseline.py
```

Python標準ライブラリは移行監査だけに使用する。サイト生成の依存にはしない。PaperMod撤去後に再生成する場合は、指定コミットのsubmoduleを別checkoutで復元して実行する。開始コミットの変更や期待値の自動更新にこのコマンドを転用しない。

[基準JSON](../../tests/baseline/migration.json) に、61件の入力情報、Markdown全文、素材のSHA-256、生成HTMLのURL・canonical・本文テキスト・見出しID・リンク・メディア、RSS全item、モックの全ファイルハッシュを保存した。

| 対象 | 記録結果 |
| --- | --- |
| 記事 / 固定・一覧用ページ | 59記事 / About・Archives |
| コンテンツファイルと同梱素材 | 80ファイル |
| HTML（ページ送り・alias含む） | 170ファイル |
| RSS | 48フィード |
| 見出し | 本文の215件 |
| 凍結モック | 68ファイル、現作業ツリーと全件ハッシュ一致 |
| ホームRSS / posts RSS | 60件 / 59件 |

旧ホームRSSにはAboutも含まれる。新ホームRSSはQ8・Q19の明示合意に従い59記事の集合へ揃える。これは承認済みの移行差分であり、単純な件数一致を合格条件にしない。分類一覧RSSが分類ページを配信する役割は維持する。

外部取得を再現可能にするため、Xだけを [検査用shortcode](../../tests/fixtures/offline/layouts/_shortcodes/x.html) に置換した。投稿URLと位置を保持する。この置換は隔離ビルドにのみ適用し、テーマには含めない。生Instagram/Speaker Deck、組込YouTubeは元のマークアップを保持するが、ブラウザ接続はこの工程では確認していない。外部サービスの実接続検証はT012・T017で別途行う。

固定時計は `2026-09-17T12:00:00+09:00`。同一環境で2回抽出し、JSONのSHA-256が `ae090d2cdfb6cf2e7dd2ac9f77188dda7a0f3052fa521e64be7b41890dd3f8e6` で一致した。生成は約0.3秒。旧テーマにLanguageDirection/LanguageCodeの非推奨警告が出るが生成は成功した。

抽出した本文は空白を正規化しているため、それだけで組版・コード空白の保存を証明しない。保存済みMarkdown全文と見出し・メディア・リンク、およびT009/T014の視覚比較とコードコピー検査を併用する。生埋め込みをshortcodeへ移行する差分は入力ID・URLと本文の対応を全件検証する。最終照合では新規記事の追加も対象に含める。
