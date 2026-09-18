# T061: Mac実機ブラウザの安定版照合

2026-09-18時点の公式リリース情報と、実機検証で使用した版を照合した。`local-versions.json`は同日のローカルアプリ情報を再取得したもの。macOS 27.0（26A428）。

| ブラウザ | 実機記録・再取得した版                   | 公式安定版情報                                              | 判定                                              |
| -------- | ---------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------- |
| Chrome   | 153.0.8010.53（T050以降）                | 9月17日のWindows/Mac Stable更新は153.0.8010.52/.53          | 版一致                                            |
| Firefox  | 156.0（T048）                            | 9月15日からRelease channelへ提供、リリース一覧の先頭も156.0 | 版一致                                            |
| Safari   | 27.0、build22625.1.29.11.27（T015/T050） | 9月17日のSafari27.0リリース記事、macOS27に同梱              | 公開バージョン一致。記事は詳細build番号を示さない |

一次情報：

- [Chrome Desktop Stable更新](https://chromereleases.googleblog.com/2026/09/stable-channel-update-for-desktop_0194356994.html)と[Stable更新一覧](https://chromereleases.googleblog.com/search/label/Stable%20updates)。段階配信の記載あり。Mac実機の.53が公表されたStable版に含まれることを確認した。
- [Firefox156.0 Release Notes](https://www.firefox.com/en-US/firefox/156.0/releasenotes/)と[リリース一覧](https://www.firefox.com/en-US/releases/)。Beta/Developer Edition/Nightlyとは区別する。
- [WebKit Features for Safari27.0](https://webkit.org/blog/18325/webkit-features-for-safari-27-0/)と[WebKitトップ](https://webkit.org/)。Technology Previewとは区別する。

この照合でMacの実機記録に残していた「現行安定版との照合未実施」を補う。Chromeの以前の.48でのみ行った検証を.53で再実施したとは扱わず、各証拠の元の版を保持する。Safariの詳細build一致を公式記事から推定しない。Windows/モバイルの未取得の詳細版や、将来の公開日における最新版は別途照合する。実機操作・実フォント等の未確認項目も残す。
