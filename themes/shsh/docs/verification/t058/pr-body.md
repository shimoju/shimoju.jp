PaperModから自作Hugoテーマshshへ移行し、日本語の長文・コードを中心にした表示、両配色、記事探索・RSS・共有を共通の構成へ揃えます。サイト生成はHugo 0.166.0だけで完結し、テーマの開発依存・fixture・検査は`themes/shsh/`に集約しています。

全59記事・About・Archivesと派生一覧の移行照合、代表画面・全画面レビューは実施済みです。実機確認の残件があるためdraftとし、本番へのマージは保留しています。

## 変更

- 本文組版、記事・一覧・分類・Archives・404、配色保存、キーボード/タッチ操作、コードコピーを実装。
- 画像の寸法・レスポンシブ候補、動画・外部埋め込みshortcode、SEO・構造化データ・RSSを整備。旧テーマ専用のサイト上書きを撤去。
- 既存URL・見出しID・本文・元素材・RSS識別子を照合。ホームRSSは合意済みの記事集合へ統一。
- GitHubの必須`shsh-check`成功後にPRをmasterへマージし、Cloudflare PagesのGit連携で本番配信する構成。previewはpushから自動配信し、noindex・共有無効・スター非表示。

## レビューと検証

- 代表画面R004と全画面R002をユーザー承認済み。About表の列見出し、コード行高1.4、iPhoneコピー初回タップ修正、Safari回転時の文字自動拡大抑止を反映・再確認済み。
- テーマ実装`268bbb0`の[GitHub統合検査](https://github.com/shimoju/shimoju.jp/actions/runs/35338044497)は246件成功。以後の差分は検証資料・証拠のみ。現在のPR headの成否はChecksで別途確認する。
- 170 HTML・48 RSSのURL集合、全59記事とAboutの内容・素材、内部参照・画像・RSS・メタ情報を検査。Chromium/Firefox/WebKitの操作・axe・視覚比較を実施。
- モバイル相当の固定負荷条件で、外部埋め込みあり/なし各5回ともLCP 2.5秒以下・CLS 0.1以下。実端末や本番CDNの性能保証とは区別する。
- Windows Chrome/Edge/Firefox、Mac Safari/Chrome/Firefox、iPhone/iPad Safari、Android Chromeで報告範囲の実機確認を実施。未確認は[実機記録表](https://github.com/shimoju/shimoju.jp/blob/hugo-theme/themes/shsh/docs/verification/real-devices.md)に明記。
- 確認用固定preview：[6f52990f](https://6f52990f.shimoju.pages.dev/)（268bbb0）。実機報告の対象版は各記録に保持する。

## マージ前後の残件

- マージ前：Safari実フォントとYouTube映像、Firefoxの追加確認、Windows/モバイルの未申告項目など、実機記録表にある残件を解消する。現在のPR headで必須CIを確認する。
- 公開後：本番の公開URL・RSS GUID・canonical、共有/スターの対象、外部埋め込み、HTTP 404・feed転送・noindex適用先を確認する。投稿の確定やスター追加はしない。
- 移行確認後：PaperMod submoduleの整理、仕様の正をテーマ/fixture/文書へ移す作業、全要件の最終監査を行う。

切り戻しは設定・コンテンツを含む旧master `fb3a9bb` とPaperModの指定コミット、または旧production配信成果物の復元を単位とします。旧ソースの隔離生成でURL/RSS一致等9検査を通過しています。[切り戻し手順](https://github.com/shimoju/shimoju.jp/blob/hugo-theme/themes/shsh/docs/verification/rollback.md)と[進捗JSON](https://github.com/shimoju/shimoju.jp/blob/hugo-theme/docs/06-theme-implementation-progress.json)を参照。

既知の制約として、公式Catppuccinコード色のコントラスト差と、Windows Firefoxの見出し500が通常フェイスになる差を承認済みです。未確認項目をこの例外へ追加していません。
