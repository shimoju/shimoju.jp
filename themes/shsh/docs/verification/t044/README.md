# コード行高変更の配信・CI・実機確認（T044）

- 最初の配信: 92cacd8 / [b7eecc69](https://b7eecc69.shimoju.pages.dev/)。記事HTTP200、HTML/HTTP noindex、行高1.4のCSSと内容ハッシュ一致を確認。
- Windows再確認: ユーザーが上記previewで「読みやすくなった・問題なし」と回答。再確認ブラウザ名の再指定はなく、3ブラウザすべての再検証とは断定しない。
- 初回CI35335359283: T045で独立した代表画面比較の期待値未反映を発見したため取消。ローカル再現と修正後12検査の結果はT045参照。
- 検査修正後: a7789aab338a3aee0817a5eb84362c813b155fbf / [0b9a36a0](https://0b9a36a0.shimoju.pages.dev/)。Pages成功。配信CSSのSHA256は先の実機確認対象と同一。テーマ本体は92cacd8から変更なし。
- 必須CI: [35335882614](https://github.com/shimoju/shimoju.jp/actions/runs/35335882614)成功。243件成功（ブラウザ検査10.4分、ジョブ12分36秒）。同一SHAでshsh-check/App15368とPages/App85455の成功を照合済み。
- 本番移行は未実施。Androidと未申告の詳細実機項目はT015で継続する。

証拠: [初回配信](preview.json)、[後続配信のCSS照合](preview-corrected.json)、[Pagesの同一SHA確認](checks-corrected-preview.json)、[Windows再確認](windows-retest.json)、[CI結果](ci-run.json)、[CIログ](ci-success.log)、[同一SHAの最終checks](final-checks.json)。
