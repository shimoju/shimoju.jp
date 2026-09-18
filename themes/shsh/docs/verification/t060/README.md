# T060: 移行PRのCIと最新preview

対象はPR #5のhead `9f173698093ef0c0e773c840859b6246c2bb656a`。後続のローカル証拠コミットはこのCIの対象外。

## CI

[PR CI run 35351594030](https://github.com/shimoju/shimoju.jp/actions/runs/35351594030) は2026-09-18 13:51:01 UTCに成功。`pnpm check`の整形・lint・型検査・進捗・生成物・移行照合・ブラウザ検査を通過し、PlaywrightはChromium/Firefox/WebKitで246件成功（8.4分）。ジョブは約10分29秒。`ci-final.json`と検証stepを抜粋し行末空白を除去した`ci-check.log`を保存した。

同一headのpush CI run35351587605も成功（`push-ci-final.json`）。`pr-final.json`でPRがOPEN/draft、両shsh-checkとCloudflare Pagesが成功していることを確認した。CIは実機未確認項目や本番配信の合格を意味しない。

## 配信

[preview 919f4ced](https://919f4ced.shimoju.pages.dev/) は同じheadのPages deployment。対応は`checks-initial.json`、実応答は`preview.json`、再現手順は`python3 themes/shsh/docs/verification/t060/verify-preview.py`に記録。

- ホーム・About・page/2・開発環境記事のHTTP 200、HTTP/HTML noindex、自己canonical/OGP URL。
- About・記事の共有4ボタンdisabled、対象4ページのスター要素なし。
- RSS 59件、channel/item linkとGUIDがpreview URL。feed.xmlは301でindex.xmlへ転送。存在しないページはHTTP 404。
- CSSと2つのJSはfingerprintと内容ハッシュが一致。source map参照なし、同名.mapへの応答404。
- 3資産は実機確認用6f52990fとバイト単位で一致。実機結果は元の対象URL・環境のまま保持する。

初回のPython urllibではCloudflareからHTTP 403・`error code: 1010`が返りRSS解析に進めなかった。同URLをcurlで取得するとHTTP 200だったため、検査スクリプトをcurlへ変更して全項目成功を確認した。クライアントによる応答差の原因は断定しない。

本番の共有・スター、実機残件、本番移行と旧テーマ整理は未完了。
