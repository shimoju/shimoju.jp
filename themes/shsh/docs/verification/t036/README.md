# T036 再検証と横はみ出し検査の修正

対象: `6f100d5e2c9f585d4117755966528bf542b39455`。

- [GitHub run](https://github.com/shimoju/shimoju.jp/actions/runs/35318217746): 239成功・1失敗。静的・生成検査は成功。
- 前回のclientWidthへの変更だけでは不十分だった。Linux ChromiumでscrollWidth 1265 / clientWidth 1280となり、等値比較が内容の狭いケースを誤判定した。テーマにはscrollbar-gutter: stableがある。
- `scrollWidth <= clientWidth`へ修正。他の横はみ出し検査と同じで、超過の許容幅は設けない。[MDNの判定例](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollWidth#detecting_overflowing_content)もscrollWidthがclientWidthを超える場合をoverflowとする。
- 修正後の対象検査は3エンジンで3 passed (6.3s)。人工的な幅1600pxの要素を1280pxのviewportに置く対照実験でも、3エンジンすべて超過を検出した。Linux全CIはT038へ継続する。
- [Pages preview](https://59e83710.shimoju.pages.dev/)はCI待機なしに42秒で成功。互換ビルドコマンドの実行、7HTML・4RSS・noindex・共有/スター無効・404/feed301・3assetsのfingerprint確認成功。
- masterはfb3a9bbのまま。shsh-check提供元App15368、strict、PR必須、管理者適用、force/deletion禁止をGETで再確認。本番テーマ移行は未実施。

詳細は同ディレクトリのJSON・ログ。実機確認用の固定URLはこのpreviewを維持する。今回の修正は検査だけでテーマ表示は変わらない。
