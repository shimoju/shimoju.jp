# T038 必須CIと独立Pages previewの検証完了

対象コミット: `65d32a6861bdb5a8903bd47cd642d3fdde424017`。

- [GitHub Actions](https://github.com/shimoju/shimoju.jp/actions/runs/35319638046): **success**。整形・型付きlint・CSS・進捗・tooling・生成物・移行検査、Chromium/Firefox/WebKitの**240 passed (11.0m)**。ジョブ全体は13分16秒（07:29:48–07:43:04 UTC）。
- `shsh-check`の提供元Appは15368（GitHub Actions）。[master保護の取得結果](../t036/master-protection.json)の必須条件と一致。
- 同じSHAの[Pages preview](https://f2132c00.shimoju.pages.dev/)もsuccess。deployment IDは`f2132c00-5713-4b17-b768-82d0fc9d6d61`。initial-checks.jsonにはPages成功時点でActionsが実行中だったことが残り、CI待機なしのpreview配信を確認できる。
- F020の横幅等値比較による誤判定は解消。過去の失敗ログはT035/T036に保存し、削除・成功への書き換えはしない。
- F018の本番必須CIは設定と実成功結果の照合を完了。本番はPR・最新ベース・必須CI・管理者適用、Pagesはmaster本番/全非本番branch previewの自動配信を維持する。
- 本番masterへの統合は行っていない。実機確認・本番応答・旧テーマ整理は残件。

実機確認は利用者へ案内済みの[固定preview59e83710](https://59e83710.shimoju.pages.dev/)（6f100d5）を継続使用する。65d32a6で変更したのは検査・文書だけ。後続T037/T039と本記録も文書・検証記録だけであり、実CIを検証したコードとの差を明示する。これらの記録コミットは本番更新や追加のCI実行を伴わないローカルコミットとする。
