# T018: 旧テーマ整理と移行監査

本番移行は[T071](../t071/README.md)で確認済み。PaperMod submodule・`.gitmodules`・`bin/update-theme`を撤去し、MIT全文を[licenses/PaperMod-MIT.txt](../../../licenses/PaperMod-MIT.txt)へ保存した。テーマ・設定・記事・素材の生成ソースは変更していない。旧上書きはF012に基づきT022で撤去済み。

資料4 Q34に従い、表示・操作仕様の正をテーマ・検査fixture・文書へ移した。`mock/README.md`は参考資料であることを示す先頭の注記だけを追加。検査はその固定注記の完全一致を要求したうえで、元のREADME本文と他の67ファイルを従来のSHA-256で検査する。モックの表示・操作・生成ソース、移行基準JSONは変更していない。

## 要件と証拠の対応

参照IDの詳細・実施条件・成果物パスは[進捗JSON](../../../../../docs/06-theme-implementation-progress.json)を正とする。以下は全要件の対応監査であり、古い失敗・未確認記録を合格へ書き換えない。T071の必須CIは最終生成ソースで全246テスト成功。撤去後の検査結果は本タスクで追加する。

| 資料4                      | 成果物・確認範囲                                                                                              | 有効な証拠                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Q1/Q6/Q7/Q15/Q28/Q31       | 別サイトfixture、themes/shshへの責務集約、設定既定値・型/参照の正負検査、単一言語と英語UI                     | T003/T004/T008/T021、V005/V009/V016/V025、theme/tooling検査、R004/R002   |
| Q2/Q3/Q11/Q34              | 59記事・About・Archivesの入力/出力照合、7許可変更、shortcode化、unsafe=false、全画面、旧テーマ整理            | T009/T012/T013/T026/T018、V032/V035/V043、R004/R002                      |
| Q4/Q12/Q13/Q22/Q24/Q29/Q30 | Hugo単独生成、Pipes/Chroma、TS、固定版、formatter意味保存と冪等性、型付きlint統合と負例probe、必須CI→PR→Pages | T003/T021/T034/T071、V005/V025/V053/V062/V119/V121                       |
| Q8/Q9/Q16/Q17/Q18          | 共通記事集合、固定ページ、Date/公開制御/暦日比較、要約、10件/日付パス順、分類/Archives                        | T005/T006/T008/T010/T011、V011/V013/V016/V022/V030、collection/prose検査 |
| Q10/Q19/Q20                | 全48RSSの役割・URL/GUID/要約、ホームAbout除外、feed301、各ページcanonical/OGP/構造化データ/sitemap/robots     | T011/T013/T071、V022/V037/V121、metadata検査                             |
| Q14/Q21/Q32                | ローカル画像寸法/複数幅/srcset/sizes/WebP/目視、Markdown・コード・コピー・メディア境界とローカル動画          | T006/T007/T024/T015、V013/V015/V034/V043/V118                            |
| Q5/Q23/Q25                 | 3エンジン操作・JS無効、axe、両幅/両配色比較、5代表実機、固定モバイル性能、pref-theme/OS配色                   | T004/T013/T015/T016、V009/V038/V077/V084/V107/V118/V119、F026/F027/F028  |
| Q26/Q27/Q33                | 設定順の共有/反応、組込shortcode実取得、offline CI/実接続、preview隔離、fingerprint/map/404                   | T008/T012/T017/T071、V016/V017/V033/V119/V121/V122                       |

資料4の補足（日付、空の分類RSS、各環境の公開URL、SNS画像、全入力件数）はprose/collections/metadata/migrationの検査で対応。開始時確認（版、formatter意味保存、型検査の全パス、視覚/性能の条件、Cloudflare実設定）はV005/V025/V038/V119と各手順に記録済み。

資料5 Q1〜Q3は役割ごとのCSS/TS/layouts分割と構造レビュー、Q4/Q7はR001→R003→R004およびR002の承認、Q5は実機・本番の証拠と未確認制約の保持、Q6はタスク・判断・検証JSONと日本語タスクコミット、Q8はF014/F023/F025等の要件反映と再検証、Q9はAGENTSと資料5/開始用プロンプトからの参照で対応。`verify-progress.mjs`でQ1〜34/規律Q1〜9の割当、参照、依存DAGを検査する。

## 承認した差分と制約

- Q25の本番配色キー、Q33のpreview制限、Q32のMarkdown対応など、当初から合意したモックとの差分は資料4が基準。
- F014: Aboutの空見出しを「技術」「経験年数」に変更。F023: コード行高1.3→1.4。F021のiPhoneコピーとF025のSafari回転は合意動作を実現する修正。期待値・全自動検査・必要な実機再確認はT040〜T047で完了。
- F022: Windows Firefoxの見出し500が通常Segoe UIになる差異を許容。Mac Safari/iPhone/Androidの実フォント未取得、Android文字のみ拡大未実施（150%ページズーム採用）、Windows Edge/Firefox・Mac Firefox・iPadの未確認項目はF026/F027/F028の制約として残す。意図した実フェイスを取得したとは扱わない。
- 公式Catppuccinのコード色には承認済みコントラスト制約がある。axeの例外は該当コード色に限定。サイト全体のWCAG適合保証ではない。
- 性能は固定モバイル条件で埋め込みあり/なし各5回のLCP/CLS測定（V038）。実ユーザー全環境の達成保証ではない。外部サービスの表示は検証時点の接続結果。

T033はF019で配信切替案が不採用になった履歴、T053/T059はMac Firefox追加検査の取得制約、T062はSafari実フォント未取得であり、`implemented/blocked`を保持する。前者はT034〜T038の採用経路、後者はF026の対象範囲変更で今回の移行必須条件を阻害しなくなった。失敗記録・過去レビューのchanges_requestedも履歴として保持し、後続の承認・合格に対応付ける。未解決の必須判断はない。

## 切り戻しと旧基準の再現

[切り戻し手順](../rollback.md)の旧production成果物、または旧コミット全体とPaperModの固定SHAを復元する。テーマ名だけを戻さない。T054の隔離復元は合格、本番の切り戻し操作は未実施。

旧移行基準を再取得するスクリプトはPaperMod撤去後も別checkoutを指定できる。

```sh
python3 themes/shsh/scripts/capture-migration-baseline.py --papermod-repository /tmp/shsh-rollback-papermod
```

これは固定旧コミットの再生成であり、通常の期待値更新に使用しない。既存`tests/baseline/migration.json`は不変のまま保持した。旧テーマの著作権/許諾/免責全文も固定SHAのLICENSEとバイト一致で保持した。

## 撤去後の検証

`pnpm check`は全静的検査・Hugo/入力/出力/HTML/XML照合・3エンジン246テスト成功（2.5分）。[ログ](check.log)。Node 24.21.0、pnpm 12.4.1、Hugo 0.166.0、macOS arm64。pnpmの指定版確認にネットワークが必要でsandbox内起動は停止したため、sandbox外で指定版を確認して実行した。

[Hugo単独の本番同等ビルド](live-build.json)は組込shortcodeのまま成功、stderrなし。既存のHugo取得キャッシュを使用。[整合性検査](integrity.json)でモック68ファイルの元バイト、基準JSON不変、ライセンス全文、生成ソース不変、旧3要素の撤去を確認。旧基準スクリプトの追加引数は`--help`と構文解析で確認した。

T018の整理・監査・撤去後検証は完了。後続PRの必須CIとmaster統合・最終Pages配信はT072で確認する。
