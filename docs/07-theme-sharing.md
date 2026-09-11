# 7. シェア・はてなスターとフッターアイコン

## 採用する構成

X・Facebook・はてなブックマークは自作SVGと通常のリンクを使う。共有用SDKは読み込まない。はてなスターのみ、現行サイトと同じ公式ウィジェットを使用する。公式シェアボタンの比較UI・スクリプトは撤去し、旧`?share=`パラメーターは無視する。

実記事5件では公開URLを共有・スターの対象にする。About・一覧・レビュー入口・公開URLのない本文部品ページではスターのスクリプトを読み込まない。投稿確定・スター追加は実サービスへ反映される。記事内に検証用の説明文は表示しない。

## リンクと公式ウィジェット

| 対象 | 指定 |
| --- | --- |
| X | `https://x.com/intent/tweet`へ`url`・`text`を渡す。ハッシュタグ・viaは付けない |
| Facebook | `https://www.facebook.com/sharer/sharer.php`へ`u`を渡す |
| はてなブックマーク | 投稿パネルではなく、記事のブックマークページへ直接リンクする。HTTPS記事は`https://b.hatena.ne.jp/entry/s/`にホスト名以降を続ける |
| はてなスター | `https://s.hatena.ne.jp/js/widget/star.js`。`data-hatena-star-container`に公開URL・タイトル・`profile-icon`とプロフィールURLテンプレートを指定する |

例：`https://b.hatena.ne.jp/entry/s/shimoju.jp/2023/06/22/hugo-and-cloudflare-pages/`

共有リンクは別タブで開き、`rel="noopener noreferrer"`を指定する。クエリーはURLSearchParams、HTML属性はHTMLエスケープを使う。本番Hugoでは記事のPermalinkを渡す。モックは収録記事のパスと現行permalinks設定から公開URLを作る簡易実装なので、将来のslug変更まで一般化した処理ではない。location.hrefや比較用パラメーターを共有対象にしない。

設定の参照先：[X Web Intents](https://docs.x.com/x-for-websites/web-intents/overview)、[Facebook Share Button](https://developers.facebook.com/docs/plugins/share-button/)、[スター公式スクリプト](https://s.hatena.ne.jp/js/widget/star.js)。スターの属性は現行の`layouts/_partials/share_icons.html`と共通で、旧HatenaStar.js用の設定を混用しない。

## 配色と配置

共有・フッターのSVGは24×24のviewBoxと`currentColor`を共用し、ライトではLatte Text、ダークではMocha Textに追従する。アイコンは1.456rem、リンクは両方とも幅・高さ2.560remの正方形。flex-shrink: 0で横方向だけの縮小を防ぎ、フッター側で高さを上書きしない。ボタン間隔は0.754rem、スターとの間隔は1.207remとし、狭い幅では折り返す。

ホバー時はBase背景と境界線、キーボード操作時は共通のフォーカス輪郭を使う。アイコンリンクには下線を付けない。aria-labelとtitleでサービス名を付け、SVG自身はaria-hiddenにする。はてなブックマークは「View on」とし、投稿パネルへ直接進むリンクと区別する。

はてなスターにはサイト側の背景・枠線・paddingを付けない。外側のcolor-scheme: lightは、公式iframeとの配色方式の不一致によってブラウザが不透明な背景を補うのを防ぐため維持する。公式スクリプト・iframe・Shadow DOM内部を改変せず、そのまま描画する。

フッターのX・GitHub・RSSはSVGアイコンに統一する。URLと同一タブで開く動作は変更しない。ホーム紹介文・Aboutのテキストリンクにはこの変更を適用しない。RSSの自動検出用link rel=alternateも維持する。

## 検証

- `node mock/test-sharing.mjs`で共有URLのエンコード、ブックマークページへの直接リンク、スターだけを一度読み込むこと、読み込み失敗時の通知、記事以外の非接続を検査する。
- `verify.mjs`で全33ページのフッターに3つのSVGとサービス名があることを検査する。`test-theme.mjs`で旧shareパラメーターが配色・画面遷移に影響しないことを確認する。
- ブラウザで両配色・モバイル幅のアイコンとスターの視認性、横スクロール、キーボードフォーカスを確認する。投稿確定・スター追加は自動検証で行わない。
- JavaScript無効でも共有・プロフィール・RSSリンクは使える。スターは利用不可と案内する。スクリプト取得失敗は通知するが、公式SDK内部のAPI／iframe失敗をすべて検出するものではない。非表示をスター0件と断定しない。
- Safari・Firefox・Windows・モバイル実機、追跡防止、文字拡大、多数のスター、ログイン・投稿完了・スター追加の成否は別途確認する。本番では外部通信の扱い・CSP・性能・サービス側の変更も確認する。
