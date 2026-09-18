# CI成功後の配信方式の比較（T033）

2026-09-18、ユーザーの「Cloudflare Pages側の設定でCI成功を待ってからデプロイするような設定ができるか」「Workers Static Assetsならできるのであれば、Workersへの切り替えも視野」という依頼に基づく調査。方式選択は未承認。T030のActions経由配信はローカルに準備した提案であり、唯一の方式ではない。

## 標準設定について

PagesのGit連携はpushを契機に配信する。branch controlsは本番自動配信の有効/無効、previewのall/none/custom、対象ブランチの指定を提供する。実dashboardと公開APIのsource.configにも、外部のGitHub Actionsのcheck名を指定し成功を待つ設定は見つからなかった。「GitHub check runs」はCloudflareのビルド結果をGitHubへ報告する機能であり、外部検査への依存設定ではない。これは調査した標準機能についての結論であり、独自スクリプトによる実装の不可能性を意味しない。

- [Pages Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/)
- [Pages GitHub integration](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/)
- [Branch deployment controls](https://developers.cloudflare.com/pages/configuration/branch-build-controls/)
- [Pages Update project API](https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/edit/)

Workers Static AssetsをWorkers Buildsで配信する場合も、pushからbuild command、deploy commandの順に進む。公開された設定に外部GitHub Actions成功待ちは確認できない。previewでは既定でversions uploadとなり、本番へ昇格させず版を作るが、これ自体はCI待機ではない。この条件だけを解決するためのWorkers移行は不要と判断する。

- [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Workers GitHub check runs](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/#check-run)

## Pagesを継続する選択肢

| 方式                                                        | 成功条件と配信の関係                        | 設定変更・留意点                                                                                                                           |
| ----------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| GitHubの必須チェック → masterへマージ → 現状のPages自動配信 | PRの検査成功を本番へのマージ条件にする      | Pages設定を維持できる。GitHubの保護設定が必要。previewはCIを待たず、マージ後のpush CIを待つ保証にもならない。直接push/bypassの扱いも定める |
| Actionsのcheck → deploy → 既存PagesへWrangler upload        | 同じworkflowのcheck成功をdeployの前提にする | 独立したPages自動配信を停止する必要がある。既存プロジェクト・ドメインを維持でき、T030で準備済み                                            |
| Actionsのcheck → Pages Deploy Hook                          | CI成功後にCloudflare側のビルドを起動する    | 自動配信停止が必要。hookはブランチを対象とし、公式の設定項目にSHA固定はない。検査したコミットとの一致に追加の設計が必要                    |
| Pagesのbuild commandで検査してからHugo生成                  | Cloudflare内の検査失敗をビルド失敗にする    | Actionsの結果を待つ方式とは異なる。検査の重複とPlaywrightのブラウザ・OS依存導入が必要で、この環境での実行可否は未検証                      |

[GitHub required status checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-status-checks-before-merging)はマージ前の条件である。[GitHubの注意点](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)にも、条件を満たしたPRのローカルマージ・pushでマージコミット自体の検査を必要としない場合が示されている。したがって、本番ブランチのpush CI成功後配信と同一視しない。

[Pages公式手順](https://developers.cloudflare.com/pages/configuration/git-integration/#disable-automatic-deployments)は、Git連携プロジェクトの自動配信を停止し同じプロジェクトへWranglerで配信する方法を説明している。Direct Upload型プロジェクトへの変更や作り直しは必要ない。

[Deploy Hooks](https://developers.cloudflare.com/pages/configuration/deploy-hooks/)はPOSTによる外部起動と対象ブランチ設定を提供する。上表のコミット一致の懸念は、このブランチ指定の仕様からの推論であり、実プロジェクトで競合を再現した結果ではない。

[Build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/#build-commands-and-directories)では非ゼロ終了コードがビルド失敗になる。独自スクリプトでGitHub APIを待機する実装も考えられるが、タイムアウト・認証・対象SHA・失敗時の扱いを自作する必要があり、標準設定での連携とは区別する。

## 推奨と現在の状態

本番・previewとも対象コミットのGitHub Actions成功後にだけ配信するなら、既存Pagesを維持してActionsからアップロードする案を推奨する。本番へのマージ前検査が目的なら、GitHubの必須チェックだけでも選択肢となり、Pages側の停止は必須ではない。Workers移行はこの条件に追加の利点を確認できないため、今回の推奨には含めない。

Cloudflareの自動配信停止を保存する操作は、自動承認レビューが「本番影響のある設定変更への明示許可がない」として拒否した（F019）。ユーザーの追加依頼は調査であり許可ではない。未保存ダイアログをキャンセルし、masterの自動デプロイ有効を確認した。設定変更・push・新規配信は未実施。R002承認とSecret登録は有効なまま。

ローカル統合検査は静的検査と340 HTML検査に成功し、sandboxのlisten EPERM後にブラウザ検査のみ権限付きで再実行して3エンジン240件成功。これは実GitHub CI・Cloudflare配信の合格ではない。証拠は同ディレクトリのログとdeployment-switch.jsonを参照。
