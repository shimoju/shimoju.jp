# 検査環境（T003）

サイト生成はHugo 0.166.0だけで行う。以下は開発・品質検査専用で、Node.js 24.21.0、pnpm 12.4.1を使用する。具体的依存版はルートのpackage.jsonとpnpm-lock.yamlを正とする。初回導入は次のとおり。

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium firefox webkit
pnpm check
```

CI用の `pnpm check` は整形、型付きlintと型検査の統合、CSS、進捗、Hugoとformatterの意味保存、3エンジンのブラウザ検査を実行する。単独の `pnpm check:types` は開発時の切り分け用。ブラウザTS・検査TS/JS・開発スクリプトはroot tsconfigのstrictとcheckJsの対象である。

[Oxlint公式仕様](https://oxc.rs/docs/guide/usage/linter/type-aware)に従い `--type-aware --type-check` を同時に使い、Promiseの扱いを含む正しさの規則を設定した。TypeScript 7.0.2のネイティブ `tsc` とoxlint-tsgolint 7.0.2001を固定。Oxfmt 0.67.0・Oxlint 1.82.0はpnpmの公開後待機期間を満たす版を採用した。ESLintや旧TypeScriptコンパイラーは追加していない。

## 整形範囲とHugoテンプレート

`scripts/format.mjs` が対象を分担する。一般ソースはOxfmt、`themes/shsh/layouts/**/*.html` と検査fixtureの `layouts/**/*.html` はPrettier＋Go template parserを使う。`.prettierrc.json` をエディタとコマンドで共有する。記事、凍結モック、PaperMod、移行前の証拠JSON、生成物、依存は除外する。開発文書は今回追加した `docs/verification/` と進捗JSONを対象とし、既存の仕様文書は一括整形しない。

RSS/XMLはGo HTML parserの対象にしない。生成HTMLはHTML-validateで別検証する。DOCTYPEの小文字を採用し、HTMLで意味が変わらないvoid要素末尾のスラッシュ有無は許容する。alt・構造・属性等の検査は維持し、不正HTMLが失敗することを検証した。

Prettier 3.9.6＋prettier-plugin-go-template 0.0.15では条件付き属性が2回目にも再整形される。`format-template.mjs` は最大5回で安定する結果を使い、振動または未収束なら失敗する。整形をもう一度実行しても変わらないことを検査する。inline render hookは末尾の空白制御で、隣接リンクや後続文字との間に改行由来の空白を挿入しない。

`verify-tooling.ts` と `tooling.spec.ts` は、空白制御・inline要素・属性内の式・render hook・隣接リンクを含むfixtureを整形前後でHugo生成する。DOMテキスト、属性、実レイアウトの高さ、CSS結合、TS生成後の操作、axeを3エンジンで比較する。これはテーマ全体の合格判定ではなく、採用ツールの検証である。テーマの構造やモック比較は後続タスクで行う。

## 型検査と検査時間

```sh
pnpm check:tooling:types
node scripts/measure-checks.mjs
```

最初のコマンドは実際のブラウザ用パスと検査用パスへ一時的に型不一致・未処理Promiseを置き、統合lintとネイティブ型検査の双方が各パスを検出することを確認する。自分で作成したファイルだけをfinallyで除去し、正常時の検査成功も確かめる。これは導入時・検査構成変更時の確認で、通常CIには単独型検査を重複して入れない。

計測コマンドは整形・lint/型検査・CSS・進捗・Hugo/formatter・ブラウザを分けて `.cache/check-timings.json` へ実測を保存する。Hugo単体の時間は `.cache/tooling/timings.json` に分ける。T003の記録は [実測結果](t003-toolchain.json) を参照。

## 確認環境とFirefoxの起動

macOS 27.0（26A428）arm64、Playwright 1.63.0のChromium 153.0.8010.12 / Firefox 155.0 / WebKit 26.6で確認。OSの実SafariやWindowsの実フォント確認とは区別する。

通常の作業サンドボックス内ではブラウザ起動が拒否されるため、ローカルブラウザ検査を許可された実行環境で行う。Firefoxの `Could not find profile folder` は [Mozilla bug 2060476](https://bugzilla.mozilla.org/show_bug.cgi?id=2060476#c7) のmacOS 27起動問題に該当する症状だった。`playwright.config.ts` は `MOZ_APP_DATA` を検査専用 `.cache/firefox-app-data` へ設定し、ユーザーの既存プロファイルを使わず起動する。これにより3エンジンがすべて検査を完了した。
