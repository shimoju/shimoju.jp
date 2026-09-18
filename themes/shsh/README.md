# shsh

Hugo 0.166.0で生成する日本語ブログテーマ。テーマの開発・検査はこのディレクトリをルートに行う。サイト生成そのものはHugoだけで完結する。

## 開発

リポジトリのルートから移動する。

```sh
cd themes/shsh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium firefox webkit
pnpm check
```

Node.jsは`.node-version`、pnpmと依存版は`package.json`・`pnpm-lock.yaml`で固定する。`pnpm check`は整形、型付きlint、CSS、進捗、Hugo生成、HTML/XML、3ブラウザの表示・操作検査を実行する。

```sh
pnpm format
pnpm lint
pnpm check:tooling:types
pnpm exec playwright test tests/review.spec.ts
pnpm review:report
pnpm review
```

`pnpm review`は代表画面を隔離生成してローカルサーバーを起動する。[修正版の比較](http://127.0.0.1:4184/r003/)、[実装](http://127.0.0.1:4185/)、[preview](http://127.0.0.1:4186/)、[凍結モック](http://127.0.0.1:4187/home.html)を開ける。比較画像を更新する場合は`pnpm check`または必要なfixture生成後の代表画面検査を先に実行し、その後`pnpm review:report`で提出物を作る。

## 配置

- `assets/`・`layouts/`: Hugoテーマの実装。
- `scripts/`・`tests/`: 開発・検査・fixtureと移行前の基準データ。
- `docs/verification/`: 検証記録・レビュー資料・比較画像。
- `.cache/`・`test-results/`・`playwright-report/`・`node_modules/`: Git管理しない開発生成物。
- 設定ファイル: formatter、linter、TypeScript、Playwright、HTML検証をこのルートで管理。

実記事を使う検査だけは、サイトルートの`content/`・`hugo.yml`を読み取る。凍結比較用の`mock/`も読み取り専用。サイト全体の設計・移行要件・規律・進捗は[サイトの資料](../../docs/README.md)を参照する。サイトの設定や記事を検査中に書き換えない。

検証ログ中の古いパス・実行コマンドは実施時点の記録。T021でこの配置へ移動した。現在の実行手順とリンクは[開発環境](docs/verification/toolchain.md)および[修正レビュー](docs/verification/r003-review.md)に従う。

全画面の途中成果は[T010の比較と残件](docs/verification/full-screen-expansion.md)を参照する。`pnpm check`後に`node scripts/build-full-review-report.ts`で40画面の提出物を生成できる。F014のAbout表見出しはユーザー承認後に反映し、[T026](docs/verification/about-headings.md)で再検証する。

全画面レビューR002は[レビュー手順](docs/verification/r002-review.md)と[入口](http://127.0.0.1:4210/r002/)を参照する。`pnpm review:full`で全記事の本番同等previewと、承認後のAbout比較用fixtureを起動する。F014修正前の証拠は履歴として残し、入口に承認・反映後の結果を示す。

実機確認は[確認手順と記録表](docs/verification/real-devices.md)を参照する。ネイティブSafariの限定確認と、未確認のOS・端末・実フォント・文字拡大を区別している。
