# T066: draft PRの実機範囲と残件を同期

[PR #5](https://github.com/shimoju/shimoju.jp/pull/5)の説明を、F026の5代表環境とT065のMac Chrome/Safari確認完了へ更新した。Windows Chrome/iPhone Safari/Android Chromeの必須残件はT064へリンクし、代表外とMac Safari実フォント未取得は合格にせず制約として明記した。

[更新原稿](pr-body.md)と[取得したPR](pr-updated.json)の本文完全一致、draft、base masterを検査した。T058の原稿は当時の記録として保存する。

[CIの観測](ci-observed.json)は更新時のリモートhead 33df5fe・run 35354251910に対するもの。この時点では進行中であり、合格記録ではない。T064/T065/T066をpushした後のheadは別実行として追跡し、マージ前にその必須CIを確認する。本番マージ・移行完了ではない。

文書整形・進捗参照/DAG・git diff --checkで記録を検査する。最初の整形呼び出しはリポジトリルートに実行ファイルがなく終了127。テーマ配下で再実行した。
