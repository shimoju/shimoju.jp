# T008: 共有・外部反応

記事と通常の固定ページで共通の共有リンクとはてなスターを実装した。固有のドメイン・著者IDはテーマへ埋め込んでいない。R001の代表画面全体の承認と、実サービス接続の確認は未実施。

## 設定と責務

`sharing-config.html`は順序付き`params.shareServices`（x/facebook/bluesky/hatena）と`params.hatenaStar.enabled`・`author`を検査する。共有未設定は非表示、スター未設定は無効。リスト／map／boolean／stringの明らかな型違いと未知のサービスはビルドエラーになる。`hatena`はモックと同じブックマーク閲覧リンクである。

`share-link.html`は各サービスのURL・名前を一元化する。Xはtitleとurl、Facebookはurl、Blueskyはtitle＋改行＋url、はてなは公開URLの閲覧先を使う。URLは`.Permalink`から作り、日本語・&・引用符・%・#・山括弧を含むタイトルをqueryとしてエスケープする。共有は通常のリンクで、JavaScriptに依存しない。新規タブを読み上げ名に明記し、noopener/noreferrerを付ける。[Bluesky公式Intent仕様](https://bsky.network/docs/intent-links/)

`engagement.html`は共有と反応の枠を分け、同じ同梱アイコンと操作領域をフッターのプロフィールリンクと共有する。`sharing.css`はモックの役割別トークン・光学的な左揃え・gap・スターのlight color-schemeを維持する。ARIA名のある汎用divはgroupとして意味付けした。記事タグ・前後記事はT010の範囲。

`sharing-head.html`は設定されたはてなIDからauthor linkを生成する。スター有効の本番記事／固定ページでのみ、Hugo Pipesのminify/fingerprint済み`sharing.ts`を読み込む。TSは対象containerがあるとき公式star.jsを一度だけ追加する。公式ウィジェットを改変せず、取得失敗時は本文と共有リンクを残してstatusで通知する。JS無効時はnoscriptの案内を表示する。スターのURLとtitleは共有と同じページから与える。

非production環境では、共有アイコンを同寸法のdisabled buttonとして表示し、外部共有先hrefを出さない。スターのcontainerとローダーを生成せず、共有操作とスター通信を止める。これは資料4 Q33の合意済みプレビュー差分。本文・日付・プロフィール・購読のリンクは従来どおり利用できる。

## 検証

`pnpm check:sharing`は別ドメイン・著者名のfixtureを生成し、既定値、共有だけ／スターだけ、順序、http/httpsのはてな閲覧URL、記事／固定ページ、設定エラー、author link、公開／preview HTMLを検査する。公開出力のスターはそのbaseURLのページURLを持ち、previewはnoindexと外部操作なしを確認する。

`tests/sharing.spec.ts`では公式スクリプトの取得を固定応答に置き換え、containerへのウィジェット挿入、二重取得なし、同一文書URL、特殊文字のround-trip、Tab移動、script取得失敗、JS無効、previewの外部通信なしを3エンジンで確認する。1280/400px・両配色で共有アイコンの寸法・色・線幅・gap・左インセットを凍結モックと照合する。成功・失敗fixtureはaxe違反なし。

初回統合検査は69件成功・3件失敗。失敗はJS無効時のnoscript案内に対してgetByTextを使った検査で、表示自体は正常だった。テキスト検索を使わずnoscriptの可視性とtextContentを直接確認するよう修正し、共有12件を再検証した。FirefoxのJS無効環境ではtoHaveJSPropertyによる評価も停止したため、DOM textContentの直接取得に切り替えた。最終のpnpm checkは全72件成功（25.3秒）。

統合ログは`t008-check.log`を参照。ここで使ったiframeは検査用固定応答であり、公式ウィジェットの実際の表示・アクセシビリティ・接続成功はT017の確認に残る。投稿やスター追加は実行していない。
