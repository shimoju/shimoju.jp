# T016: モバイル条件の性能測定

`measure-performance.ts`は通常CIから独立した実接続の測定。外部埋め込みなしの開発環境記事（カバー・本文画像・ローカルMP4あり）と、最初の画面内にX投稿がある東京都知事選の記事を比較する。はてなスターは双方とも本番設定のまま。測定のためにテーマや画像の品質を変更していない。

## 固定条件

- macOS arm64上のPlaywright Chromium。正確なOS・CPU・ブラウザ版は各結果JSONに記録する。
- 390×844 CSS px、DPR 3、タッチ・モバイルレイアウト、ライト配色。User-AgentはAndroid 13／Pixel 7と実行中Chromium版を指定したエミュレーションであり、Android実機ではない。
- ページのCDPセッションでCPU 4倍低速、遅延150ms、下り1.6Mbps・上り750Kbps。各試行に新しいブラウザとコンテキストを作り、HTTPキャッシュとService Workerを使わない。
- 同じ本番同等のHugo生成物をlocalhostで配信。圧縮HTTPを加えない検証サーバーで、Cloudflare CDNの応答を計測するものではない。ビルドはHugoだけで成功し、警告・入力エラーは0件。[ビルド記録](t016-build.log)。
- 各記事5回を交互に測定し、ナビゲーション開始から20秒観測する。測定を並列化せず、スクロール・クリック・再生・スター追加をしない。各回のHTTP応答、外部接続エラー、最初の画面の画像とCDP traceを保存する。

LCPは初期化時からPerformanceObserverで最終候補と要素を記録する。CLSはCDP traceの全フレームの`weighted_score_delta`を使い、1秒を超える間隔または5秒を超える継続で区切ったセッションの最大値を算出する。入力を行わない観測なので、viewportエミュレーションに起因するフラグ付き移動も保守的に含める。メインフレームの値とPerformanceObserverの値も併記する。初回表示後にページを開き続けた場合や、操作後の値を保証する測定ではない。

算出方法の根拠: [CLSとiframe／session window](https://web.dev/articles/cls)、[Chromium traceを使うLighthouseの集計](https://github.com/GoogleChrome/lighthouse/blob/main/core/computed/metrics/cumulative-layout-shift.js)、[LCP](https://web.dev/articles/lcp)、[CDPプロトコル](https://github.com/ChromeDevTools/devtools-protocol)。標準化されたCPU実機校正ではなく、このホストのページtargetへCDPで指定した相対的な負荷条件である。外部iframeを含む配信環境・実機の結果とは区別する。

## 再現

テーマディレクトリから実行する。通常CIの固定埋め込みは使用しない。

```sh
node scripts/build-site-fixture.ts --live --production-only
node scripts/measure-performance.ts
```

各試行のJSON、画面画像、`.trace.json.gz`は`t016/`へ出力する。gzipを展開したtraceはChrome DevToolsのPerformance画面で読み込める。`--pilot`は計測方法確認用の各1回で、本測定とは別フォルダーへ出力する。

予備測定ではLCP候補・移動・X表示・traceの取得を確認した。予備測定のUser-Agentは既定値だったため、本測定の5回集計へ混ぜない。[予備記録](t016-pilot/results.json)。動画の`net::ERR_ABORTED`はmetadataプリロードの中断として記録された。動画そのものの寸法・metadata読込はT012/T024の3ブラウザ検査で確認している。

## 本測定の結果

10試行すべてでLCP 2.5秒以下・CLS 0.1以下の目標を満たした。Xありの5試行すべてで実投稿のiframeと本文表示を確認した。2記事の内容は異なるため、記事ごとの測定値として扱う。[全結果](t016/results.json)・[集計](t016/summary.json)・[実行ログ](t016-measure.log)。

| 記事                       | LCP全5回（ms）                   | LCP中央値／最大 | CLS全5回     |
| -------------------------- | -------------------------------- | --------------- | ------------ |
| 開発環境・外部埋め込みなし | 1180 / 1196 / 1196 / 1188 / 1196 | 1196 / 1196 ms  | 0.0000000 ×5 |
| 東京都知事選・Xあり        | 524 / 528 / 536 / 532 / 552      | 532 / 552 ms    | 0.0063968 ×5 |

CLSは全フレームのtrace集計、メインフレームのtrace集計、PerformanceObserverのメインフレーム集計が一致した。各試行のtraceと画面画像は同じ`t016/`に保存した。ここでの測定目標は達成し、性能のための追加実装修正は不要と判断した。公開後の実ユーザー値を保証するものではなく、Safari／OS固有フォントの実機確認とCloudflareの配信確認はT015/T017に残る。
