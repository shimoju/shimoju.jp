# T056 Mac実機の外部埋め込み確認

対象は固定preview `6f52990f`（テーマ実装 `268bbb0`）。2026-09-18にCodexがこのMacで確認した。Safari 27.0 / Chrome 153.0.8010.53 / macOS 27.0（26A428）はT050で取得した同一環境。今回は詳細版・CSS viewport・DPRを再測定していない。画像寸法をCSS viewportと見なさない。配色は開始時のダークを維持した。

SafariはCUAのネイティブUI、Chromeは最初に同じネイティブUIを使い、途中で `noWindowsAvailable` が返ったためCUAのChrome拡張接続で同じ実ブラウザの専用タブを継続した。Playwrightテスト用ブラウザではない。

## 確認結果

| 対象記事                                                                                                               | Safari                                                                                                | Chrome                                                                       |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [/2016/07/30/tochijisen/](https://6f52990f.shimoju.pages.dev/2016/07/30/tochijisen/)                                   | Xの投稿・著者・日時・操作リンクがカードとして表示                                                     | 同様に表示。読込直後のblockquoteからカードへ変化                             |
| [/2016/08/01/tiritiri-curry/](https://6f52990f.shimoju.pages.dev/2016/08/01/tiritiri-curry/)                           | Instagramのカレー写真・著者・キャプションが表示                                                       | 同様に表示                                                                   |
| [/2017/11/11/twelve-factor-app-on-heroku/](https://6f52990f.shimoju.pages.dev/2017/11/11/twelve-factor-app-on-heroku/) | Speaker Deckの表紙が表示。Next slideで自己紹介へ移動                                                  | 同様に表示・ページ送り                                                       |
| [/2016/08/31/hiphop-music-video/](https://6f52990f.shimoju.pages.dev/2016/08/31/hiphop-music-video/)                   | YouTubeプレーヤーと再生時間進行、一時停止後の「動画を再生」を確認。映像は取得画像で黒く写り視認未確認 | サムネイル・映像を視認。再生時間進行、一時停止後の再生ボタンと停止画面を確認 |

どのページも確認した埋め込み前後の本文が読め、重なり・横はみ出しは見られなかった。全画面・全配色・全幅へは一般化しない。投稿・コメント・共有の送信は行っていない。

## 証拠

- X：[Safari](safari-x.jpg)、[Chrome読込後](chrome-x-loaded.png)。`chrome-x.jpg`はカード読込前。
- Instagram：[Safari](safari-instagram.jpg)、[Chrome](chrome-instagram.png)。写真・キャプションと周囲の本文を確認。
- Speaker Deck：[Safari表紙](safari-speakerdeck-first.jpg)→[次ページ](safari-speakerdeck-next.jpg)、[Chrome表紙](chrome-speakerdeck-first.png)→[次ページ](chrome-speakerdeck-next.png)。SafariのAX差分は視覚上のページ変更を表現しなかったため画像を証拠とする。
- YouTube：[Safariの黒い取得画像](safari-youtube-result.jpg)、[再生24秒](safari-youtube-before-pause.txt)→[一時停止35秒](safari-youtube-paused.txt)。Safariの映像視認はユーザーへ実画面での確認を依頼中。
- YouTube：[Chrome初期画像](chrome-youtube-initial.png)、[映像](chrome-youtube-video.png)、[一時停止](chrome-youtube-paused.png)、[再生状態](chrome-youtube-before-pause.txt)→[停止状態](chrome-youtube-paused.txt)。`*-playing`画像は再生開始直後の読込中。AXの関連動画推薦行は検証に不要なため保存時に除いた。

## 終了状態と制約

両ブラウザの検証用タブを閉じた。Safariは開始時にユーザーが開いていた開発環境記事へ戻り、Chromeは専用タブIDが一覧から消えたことを確認した。ブラウザ設定・配色は変更していない。

Chromeの読取診断は制限されたevaluateスコープで`navigator`が提供されず失敗したため、新たな環境測定結果は作成していない。サイトの失敗とは扱わない。

SafariのYouTube映像は未確認。他の実機フォント・文字設定・JS無効等の残件は実機記録表に従う。
