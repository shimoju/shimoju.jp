# テーマ実装・移行作業

Hugoテーマshshの実装・移行・修正を行うときは、開始時・再開時に以下を読む。

- `docs/03-theme-visual-requirements.md`：デザインと情報設計の判断理由。
- `docs/04-theme-implementation-requirements.md`：対象・構成・検証・移行完了条件。
- `docs/05-theme-implementation-discipline.md`：実装中に守る規律と進捗JSONのフォーマット。
- `docs/06-theme-implementation-progress.json`：現在の状態・判断・検証結果・再開地点。

表示・操作の比較には`mock/README.md`と`mock/`を参照する。資料5に従って、凍結モックと承認済みの変更を区別する。

進捗は資料5の更新時点に従ってJSONへ記録し、再開時はリポジトリの実際の状態と照合する。規律の詳細はここへ複製せず、資料5を参照する。
