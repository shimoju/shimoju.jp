# T072: 整理後の統合と最終配信

T071でshsh本番移行、T018で旧テーマ整理・全要件監査・撤去後246テストを完了した。ここでは整理用PR [#6](https://github.com/shimoju/shimoju.jp/pull/6)の必須CIとmaster統合、最終配信を照合する。

## 対象

- PR head: `6b82005621a408526365fb9327f8478599f3be2c`（T018）、base: `a442780f8644ba32f88fb31b58dde192502c99d1`（shsh初回本番移行）。
- [監査と制約](../t018/README.md)、[5代表実機の対応](../t070/README.md)、[初回本番のURL/RSS・共有・スター・埋め込み](../t071/README.md)、[切り戻し手順](../rollback.md)。
- この確認中の文書更新は、配信・実機・切り戻し手順の現在の状態を揃えるもの。過去の未確認や不採用の手順は履歴として保持する。

## 整理後preview

[Cloudflare直接確認](preview-deployment.json)では`2d53dd57-0367-4b2d-bc54-18ddf3a26c26`が上記headを配信。Hugo 0.166.0、preview環境、固定preview自身のbaseURLで成功。旧submoduleのcloneなし、警告・エラーなし。[HTTP検査](preview.json)でnoindex・共有無効・スターなし・RSS・feed301・不存在404・実機版と同じアセットを確認した。

## 最終統合・本番

[CI](ci-pr.json) / [run 35362944858](https://github.com/shimoju/shimoju.jp/actions/runs/35362944858)は成功、[統合検査ログ](ci-check.log)は246 passed（10.9分）。[マージ直前](pr-before-merge.json)の正確なhead/baseとCLEANを確認し、通常のmergeで[PR #6を統合](pr-merged.json)した。mergeは`bc14804d245f811723777c23740aa9a52647c67d`。

[Cloudflare本番](production-deployment.json)は`0057adc1-22ce-4c0d-8259-a7485f7cc409`で上記mergeを配信。Hugo 0.166.0、production/master/https://shimoju.jp/、旧submoduleなし、警告・エラーなし、371アセットはすべて既存内容だった。

[本番HTTP再照合](production-http.json)は170 HTML・48 RSS・テーマ4アセット・feed301・不存在404の全項目合格。[初回本番との比較](production-comparison.json)で169/170 HTML・全RSS・全テーマアセットのレスポンスSHA-256一致を記録した。Aboutの生応答は不同で、[追加2応答](about-edge-transformation.json)はCloudflareメール保護のトークンだけが変わり、それを除くと完全一致した。配信ログの全371アセット一致と併せ、Cloudflare変換による差と判断した。初回のAbout本文を正規化比較したとは扱わない。検査スクリプトの条件はT071を引き継ぎ、証拠出力を本フォルダーへ分離した。共有/スター・外部4種のブラウザ確認はT071の結果を保持し、生成ソース/設定/記事/素材の無変更を照合した。

資料4の全要件・補足・完了条件、資料5のレビュー/修正/再検証はT018監査とこの本番結果で満たした。5代表環境の範囲外・未取得・未実施は承認済み制約として保持し、未確認を合格へ変更していない。移行は完了。今回の残る差分は検証記録と文書の現在の状態のみで、配信ソースは変更しない。
