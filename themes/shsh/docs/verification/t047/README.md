# Safari文字自動拡大修正の配信と再確認（T047）

対象コミット：268bbb0ef102f1379efbcfb62f53d2e643a7c79e。

[固定preview](https://6f52990f.shimoju.pages.dev/)へのPages配信が成功。実記事HTTP200、HTML/HTTP noindex、bodyの接頭辞付き・標準名のtext-size-adjust:100%、CSS内容ハッシュ一致を確認した。viewportはwidth=device-width,initial-scale=1でズーム制限なし。

[全CI35338044497](https://github.com/shimoju/shimoju.jp/actions/runs/35338044497)が成功。246 passed (10.7m)、ジョブ12分50秒。同一SHAのshsh-checkとPagesがともに成功している。ローカル54検査と調査根拠は[T046](../t046/README.md)参照。

iPhone Safariでは、実記事を縦→横→縦と回転させても意図せず文字サイズが変わらないこと、Safariのページ文字拡大とピンチズームが使えることを依頼した。ユーザーが「回転時の問題は解消し、文字拡大・ピンチズームも使える」と回答し、F025の指摘範囲を合格にした。ローカルのMac WebKitによる幅変更検査とは区別する。

本番は未移行。Androidの報告範囲は問題なしとしてT046に記録済み。未申告の詳細実機項目はT015で継続する。

証拠：[全CI結果](ci-run.json)、[CIログ](ci-success.log)、[最終check照合](final-checks.json)、[Pagesの同一SHA確認](checks-preview.json)、[配信CSS/viewport確認](preview.json)、[iPhone実機再確認](iphone-retest.json)。
