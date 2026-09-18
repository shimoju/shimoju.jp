# T058 本番移行用draft PR

[PR #5](https://github.com/shimoju/shimoju.jp/pull/5)を`hugo-theme`から`master`へのdraftとして作成した。[作成時の状態](pr-created.json)と[説明文](pr-body.md)を保存した。テーマ実装後の実機証拠・切り戻し資料を作業ブランチへpush済み。本番マージはしていない。

説明文には実装結果、R004/R002承認、承認済みの表示変更、246件成功の対象コミット、移行照合・性能・実機の証拠と制約、マージ前/公開後/旧テーマ整理の残件を分けて記載した。過去CIの成功を現在のPR headの成功へ置き換えていない。

作成直後は`isDraft: true`、`state: OPEN`、`baseRefName: master`、`mergeStateStatus: BLOCKED`。GitHubの2つの`shsh-check`とCloudflare Pagesのpreview配信が実行中だった。T058の記録コミットもpushするため、再開時はPR headのSHAで最新runを取得し、実行中なら同じrun IDを追跡する。古いrunを最新headの証拠にしない。

マージ前の実機残件は[実機記録表](../real-devices.md)、本番検証は[配信確認手順](../cloudflare-pages.md)、切り戻しは[復元手順](../rollback.md)に従う。

ローカルの`node scripts/format.mjs`は子プロセス`pnpm exec oxfmt`で約1分39秒出力がなく、対象PIDを確認して停止した。同じ一般ファイル対象をローカルのoxfmtへ直接渡すと268ファイルが整形済みで成功。進捗JSONを整形し、58タスクの進捗参照検査と`git diff --check`も成功した。テンプレートの再整形検査・統合検査全体の代替とは扱わず、最新GitHub CIで確認する。
