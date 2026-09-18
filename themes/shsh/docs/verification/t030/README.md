# T030のローカル検証

対象は20474f0とT030の未コミット差分。生成物の`target.commit`はURL生成を検査するための引数であり、このSHAの実配信を意味しない。Hugoのproduction/preview生成は警告・エラーなし。各170 HTML（alias46含む）と48 RSSを監査した。CSS/JSは本番4個、preview3個（スターの読み込みなし）で、ファイル名ハッシュとSHA-256を保存した。

再現はリポジトリルートで`sh themes/shsh/scripts/build-pages.sh refs/heads/master "$(git rev-parse HEAD)"`を実行し、テーマルートで`python3 docs/verification/t030/verify.py`。次にrefを`refs/heads/hugo-theme`へ変えて繰り返す。生成物は同じ出力先を置き換えるため、それぞれ生成直後に監査する。実接続のHugoビルドは外部shortcodeを取得する。

`invalid-inputs.json`は引数なし・タグ・不正SHA・空ブランチ・短いSHAの拒否結果。`wrangler-help.txt`で固定版CLIの配信引数を確認し、`install.log`は`pnpm install --frozen-lockfile`の成功記録。初回の4.134.0導入は端末の最低公開経過時間制約で拒否され、制約を変更せず4.131.2を採用した。ネイティブ依存のbuild許可は版付きで明示した。

追加のoffline installはローカルstoreにtarballがなく失敗した。その処理中のformatterも一時的なmodule欠落で失敗。インストール完了後に整形・型付きlint・進捗・toolingを再実行し、すべて成功した。依存インストールと検査は同時実行せず順に実行する。

workflowのactionlintとスクリプトの`sh -n`が成功。`needs: check`、PR/fork/タグ除外、明示的有効化、リモート最新SHA照合、contents readだけの権限、引用した環境変数による入力を確認した。Secretはアップロードstepだけへ渡す。GitHubのSecret名とvariableの一覧は取得時ともに空だった。トークン値は取得していない。

テーマ・コンテンツ・ブラウザ操作の変更はないため、全240ブラウザ検査はT026の有効結果を維持する。今回の成功は配信準備のローカル検査であり、GitHub上の実行、Cloudflare設定変更、API認証、実配信の成功ではない。F018は未解決。ユーザーへSecret登録を依頼し、R002全画面レビューの判断も引き続き待つ。
