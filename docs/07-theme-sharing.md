# 7. シェア・はてなスターとフッターアイコン

## 採用する構成

X・Facebook・Bluesky・はてなブックマークは自作SVGと通常のリンクを使う。共有用SDKは読み込まない。はてなスターのみ、現行サイトと同じ公式ウィジェットを使用する。

実記事5件とAboutでは公開URLを共有・スターの対象にする。Aboutの対象URLは`https://shimoju.jp/about/`。一覧・レビュー入口・公開URLのない本文部品ページではスターのスクリプトを読み込まない。投稿確定・スター追加は実サービスへ反映される。

## リンクと公式ウィジェット

| 対象 | 指定 |
| --- | --- |
| X | `https://x.com/intent/tweet`へ`url`・`text`を渡す。ハッシュタグ・viaは付けない |
| Bluesky | `https://bsky.app/intent/compose`へ`text`として記事タイトル・改行・公開URLを渡す。投稿確定は利用者が行う |
| Facebook | `https://www.facebook.com/sharer/sharer.php`へ`u`を渡す |
| はてなブックマーク | 記事・Aboutのブックマークページへ直接リンクする。HTTPS記事は`https://b.hatena.ne.jp/entry/s/`にホスト名以降を続ける |
| はてなスター | `https://s.hatena.ne.jp/js/widget/star.js`。`data-hatena-star-container`に公開URL・タイトル・`profile-icon`とプロフィールURLテンプレートを指定する |

例：`https://b.hatena.ne.jp/entry/s/shimoju.jp/2023/06/22/hugo-and-cloudflare-pages/`

共有リンクは別タブで開き、`rel="noopener noreferrer"`を指定する。クエリーはURLSearchParams、HTML属性はHTMLエスケープを使う。本番Hugoでは記事・AboutのPermalinkを渡す。モックは収録記事のパスと現行permalinks設定から公開URLを作る簡易実装なので、将来のslug変更まで一般化した処理ではない。共有対象には公開URLを使う。

設定の参照先：[X Web Intents](https://docs.x.com/x-for-websites/web-intents/overview)、[Bluesky公式の共有URL案内](https://bsky.app/profile/bsky.app/post/3kmjboaopvn2f)、[Facebook Share Button](https://developers.facebook.com/docs/plugins/share-button/)、[スター公式スクリプト](https://s.hatena.ne.jp/js/widget/star.js)。スターの属性は現行の`layouts/_partials/share_icons.html`と共通にする。

## 配色と配置

共有・フッターのSVGはサービスの特徴を線画に簡略化した自作アイコンとし、塗りつぶしは使わない。共通の`viewBox="0 0 24 24"`に最終座標を保持し、個別viewBox・transformによる拡大補正は行わない。線の色は`currentColor`を共用し、ライトではLatte Text、ダークではMocha Textに追従する。SVGの表示領域は幅・高さ2.4remとし、`preserveAspectRatio="xMidYMid meet"`で縦横比を保つ。丸い線端・角と線幅1.5を使い、縦横比を保ちながら線幅込みの長辺を24px相当いっぱいに合わせ、短辺を中央配置する（既定文字サイズ16px）。表示上の線幅は1.5px相当で、配色・コピーの小アイコンと揃える。

リンクは両方とも幅・高さ4.8remの正方形。flex-shrink: 0で横方向だけの縮小を防ぎ、フッター側で高さを上書きしない。ボタン間隔は0.8rem、スターとの間隔は1.6remとする。シェアはX・Facebook・Bluesky・はてなブックマークの順に置く。フッターはXの直後にBlueskyを置く。シェアボタンとはてなスターはモバイル・デスクトップとも横並びを基本とし、幅に収まらない場合のみ折り返す。スター専用の左マージンは設けない。

ホバーによる背景・境界線・色・サイズの変化は付けず、キーボード操作時は共通のフォーカス輪郭を使う。アイコンリンクには下線を付けない。aria-labelとtitleでサービス名を付け、SVG自身はaria-hiddenにする。はてなブックマークは「View on」とし、投稿パネルへ直接進むリンクと区別する。

記事・Aboutのシェア列は、操作領域とSVGの片側差分12px相当を基準にshare-mountを左へ寄せ、SVG表示領域を本文に揃える。補正量はガター内に制限し、リンクの操作領域48pxと列内gap8px・スターとのgap16px相当は維持する。シェアのフォーカス輪郭は内側に描く。サービスごとの図柄補正とフッターの位置補正は行わない。

はてなスターにはサイト側の背景・枠線・paddingを付けない。外側のcolor-scheme: lightは、公式iframeとの配色方式の不一致によってブラウザが不透明な背景を補うのを防ぐため維持する。公式スクリプト・iframe・Shadow DOM内部を改変せず、そのまま描画する。

フッターのX・Bluesky・GitHub・RSSはSVGアイコンとし、同一タブで開く。BlueskyプロフィールはHugo設定のsocialIconsから取得する（`https://bsky.app/profile/shimoju.jp`）。本文リンクには本文の装飾を使う。RSSの自動検出用link rel=alternateも維持する。

## 検証

- `node mock/test-sharing.mjs`で共有URLのエンコード、記事・Aboutの共有先、ブックマークページへの直接リンク、スターだけを一度読み込むこと、読み込み失敗時の通知、一覧・レビュー等の非接続を検査する。
- `verify.mjs`で全33ページのフッターに4つのSVGとサービス名があることを検査する。
- ブラウザで両配色・モバイル幅のアイコンとスターの視認性、横スクロール、キーボードフォーカスを確認する。投稿確定・スター追加は自動検証で行わない。
- JavaScript無効でも共有・プロフィール・RSSリンクは使える。スターは利用不可と案内する。スクリプト取得失敗は通知するが、公式SDK内部のAPI／iframe失敗をすべて検出するものではない。非表示をスター0件と断定しない。
- Safari・Firefox・Windows・モバイル実機、追跡防止、文字拡大、多数のスター、ログイン・投稿完了・スター追加の成否は別途確認する。本番では外部通信の扱い・CSP・性能・サービス側の変更も確認する。
