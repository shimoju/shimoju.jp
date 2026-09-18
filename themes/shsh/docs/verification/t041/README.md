# T041 iPhoneコピー修正版の実配信と検証

対象: `05d20643cd5f8c85c10028050c1fb423d611608a`。

- [修正版の実記事](https://211f19d6.shimoju.pages.dev/2026/09/01/development-environment-2026/)。Pages deployment `211f19d6-636d-4b9f-a7fc-4b1d9edcdf15`。Pagesの成功時点でGitHub CIは実行中だった。
- 記事はHTTP200、HTTP/HTMLともnoindex。配信されたcopy.jsのSHA256はURLのfingerprintと一致し、touch由来のmousedownの既定動作を抑止する修正を確認した（preview-fix.json）。
- [GitHub CI](https://github.com/shimoju/shimoju.jp/actions/runs/35321648185)は成功。静的・生成物・移行検査と、回帰テストを追加した全243件が成功（ブラウザ10.0分、ジョブ12分4秒）。GitHub必須チェックshsh-check/App15368とPages/App85455が同一SHAで成功。
- iPhone実機再確認は合格。ユーザーが1回目からコピーでき、貼り付け内容も一致すると回答した（iphone-retest.json）。F021はresolved。共有・スターのpreview仕様についても理解したとの回答。

共有アイコン無効とスター非表示はQ33のpreview仕様。修正対象に含めていない。本番masterにはマージしていない。他の実機の確認結果・OSフォント・拡大等の未確認事項も残る。

今回の検証記録だけを追加するT041コミットはローカルに保持する。配信・全CI・実機再確認の対象は上記05d2064であり、記録コミットによるテーマや検査実装の変更はない。
