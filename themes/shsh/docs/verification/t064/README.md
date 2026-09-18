# T064: 5代表環境への変更と残る実機確認

2026-09-18、ユーザーがF026の案を引用して「5代表環境で進める（推奨）」と回答した。Mac Chrome・Mac Safari・Windows Chrome・iPhone Safari・Android Chromeを移行完了判定の代表環境とする。[提案時の比較と影響](../t063/README.md)を参照。

Windows Edge/Firefox・Mac Firefox・iPadの未確認項目、Safariの実フォント未取得は制約として残す。これらを合格へ変更しない。以前依頼したMac Firefoxの文字32/和文コード/JS無効、Safari実フォントの追加回答は必須ではなくなった。得られた追加結果は補助証拠として扱う。

## 現在の状態

T070でWindows追加報告とF028のiPhone実フォント制約を反映し、5代表環境の承認済み必須範囲は確認完了。[最終対応表](../t070/README.md)。Android/iPhoneの実フォント未取得、Androidの文字のみ拡大未実施、Mac Safari実フォント未取得と補助環境の未確認は承認済み制約として保持する。

対象は固定preview6f52990f（268bbb0）と各既存報告に記録した版。以下は依頼時の手順として保持し、追加試験の一律依頼ではない。本番配信と旧テーマ整理は引き続き別工程。

## 手順

1. ブラウザ/OSのバージョン情報と更新画面で、詳細版・更新可否を確認する。iPhoneはiOS詳細版、Chromeは「Chromeについて」。過去の試験時の版が不明なら「現在の版」として区別する。更新が提供されない場合も、その状況を記録する。
2. コピー未照合の環境では[開発環境記事](https://6f52990f.shimoju.pages.dev/2026/09/01/development-environment-2026/)の最初のコードをコピーし、端末のメモ等へ貼り付ける。原文と一致し、ラベルや行番号が混ざらないことを確認する。メモを外部送信する必要はない。
3. iPhone/Androidの実フォントは[About](https://6f52990f.shimoju.pages.dev/about/)の和欧文を含む本文段落と、開発環境記事の欧文コード・和文コメントで使用フォント名を確認する。端末を開発者ツールで調べられる場合のみ実施し、CSSのfont-family候補を実フォントとして報告しない。取得手段がない・パネルが空の場合はその旨を報告する。未取得を合格にはしない。
4. iPhoneは既に確認したSafariの文字拡大設定の値を補足する。Androidは文字設定を拡大しAboutの本文/ナビ/表と記事のコードが読めることを確認し、方法・値・問題の有無を記録する。ページズームやピンチ操作とは区別し、終了後は元へ戻す。
5. 外部埋め込みは[Xの記事](https://6f52990f.shimoju.pages.dev/2016/07/30/tochijisen/)・[Instagramの記事](https://6f52990f.shimoju.pages.dev/2016/08/01/tiritiri-curry/)・[YouTubeの記事](https://6f52990f.shimoju.pages.dev/2016/08/31/hiphop-music-video/)・[Speaker Deckの記事](https://6f52990f.shimoju.pages.dev/2017/11/11/twelve-factor-app-on-heroku/)を開き、カード/写真/映像/スライドが見え、周囲の本文を読めることを確認する。YouTubeは再生・一時停止、Speaker Deckは次ページも操作する。外部サービスが制限を表示した場合はその表示を記録する。
6. JS無効時、Windows Chromeは[ホーム](https://6f52990f.shimoju.pages.dev/)の一覧からNextで[2ページ目](https://6f52990f.shimoju.pages.dev/page/2/)へ進めるかを追加確認する。iPhone/Androidはこれに加えAboutと記事本文、ヘッダーナビ、フッターRSSを利用でき、配色/コピーボタンが非表示かを確認する。設定変更後は対象ページを再読込し、終了後はJSを有効に戻す。無効化する手段がなければ未実施と報告する。

結果は「端末・現在または試験時の版／確認した項目／結果／取得できない項目」の形式で、分かる項目から報告できる。取得不能な必須項目があれば、制約と影響を示して別途判断する。

本番のURL/RSS/共有/スター/HTTP検証と、PaperMod整理・最終監査は引き続き別工程で行う。
