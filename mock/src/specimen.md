---
title: 日本語の技術文書を読むための組版サンプル — 見出し、リンク、表とコードの調和
date: 2026-09-05
---

このページはモックの部品確認用です。実記事とは別に、深い見出しや長い表などの境界条件をまとめています。日本語の文章にRuby、PostgreSQL、HTTP/3、2026年といった英数字が混ざったときも、字面やベースラインが自然につながることを目指します。

## 文章とリンクの読みやすさ {#reading}

「日本語」、カタカナ。（括弧の余白）を確認します。本文・見出しは`palt`を有効にし、欧文のRuby on Rails、HTTP/3と自然につながる組版を比較します。括弧と句読点だけでなく、仮名の字幅も変わり得るため、長文で読み心地を確認してください。

技術記事では、[Hugoのドキュメント](https://gohugo.io/documentation/)、[Catppuccinのパレット](https://catppuccin.com/palette/)、[Rubyのリファレンス](https://docs.ruby-lang.org/ja/)のように、根拠や背景へのリンクが連続します。リンクを発見できることと、文章全体に落ち着きがあることの両方を確認します。

`config.toml`を編集して`hugo server`を実行する。日本語の中に`very_long_configuration_identifier_without_spaces`が入っても、文章全体の行間は変えません。**大切な語句は太字**にし、*補足的な強調*も同じ階調で扱います。脚注は本文の流れを妨げない位置に置きます。[^note]

> 読みやすさは文字サイズだけでは決まらない。行の長さ、前後の余白、見出しの強さが揃って、長い文章を読み進められる。
>
> これは表示確認のための例文です。

### 設定を小さく分ける {#heading-three}

見出しの前には十分な余白を取り、続く本文との間は狭くします。背景や下線を付けず、文字そのものの強さで構造を表現します。

#### フォントと文字サイズを定義する {#heading-four}

欧文と和文の候補を順番に指定します。端末ごとに異なる書体が選ばれても、本文以上のサイズで見出しの階層を維持します。

##### H5：日本語コメントのある場合 {#heading-five}

小さな階層でも、本文より文字を小さくしません。H5は本文の1.0625倍、太さ600を初期値としています。この段落と次のH6を続けて読み、差が十分かを確認します。

###### H6：折り返した行の扱いと、長い日本語見出しが続くときの読みやすさ {#heading-six}

H6は本文と同じサイズで、太さ600です。わずかなサイズ差だけで十分かどうかは継続検討の対象です。通常の段落と混同しないことも確認します。

## リストと手順 {#lists}

- 本文に集中できる一列構成
  - ナビゲーションは折り返して表示する
  - コードブロックは内側で横スクロールする
    - 日本語コメントを含める
    - コピー操作は常時見える位置に置く
- 写真やスクリーンショットは切り抜かない

1. 色と文字サイズの基本案を確認する。
2. 同じ文章で比較案を確認する。
   1. 一度に変える項目を絞る。
   2. モバイルでも読み比べる。
3. 気になった点をMarkdownに記録する。

### インラインコードの余白確認 {#inline-spacing}

上下のpaddingを増やしても、以下の改行位置を揃えた2段落で行送りが変わらないことを確認します。最初が採用案、次がpaddingなしの診断用です。通常の本文には採用案だけを使います。

<p class="inline-probe">本文と<code>config.toml</code>を読む。<br>本文と<code>日本語の設定</code>を読む。<br>続く行にも十分な余白を残す。</p>
<p class="inline-probe unpadded">本文と<code>config.toml</code>を読む。<br>本文と<code>日本語の設定</code>を読む。<br>続く行にも十分な余白を残す。</p>

## 表と長い識別子 {#tables}

ブラウザの既定文字サイズが16pxの場合の換算値です。既定サイズを変えると文字・余白・操作部品も追従し、本文の最大幅720pxは維持します。

| 項目 | デスクトップ | モバイル |
| --- | --- | --- |
| ルート | 106.25%（17px） | 100%（16px） |
| 本文 | 1rem（17px） | 1rem（16px） |
| 記事タイトル | 1.6rem（27.2px） | 1.6rem（25.6px） |
| サイト名 | 2rem（34px） | 2rem（32px） |
| 行高 | 1.9 | 1.9 |
| コード | 0.875rem（14.875px） / 1.5 | 0.875rem（14px） / 1.5 |

<table class="wide-table"><thead><tr><th scope="col">設定項目</th><th scope="col">識別子</th><th scope="col">内容</th><th scope="col">備考</th></tr></thead><tbody><tr><th scope="row">APIエンドポイント</th><td><code>GET /api/v1/projects/:project_id/deployments</code></td><td>デプロイ履歴の一覧を取得</td><td>ローカルな横スクロールの検証</td></tr><tr><th scope="row">環境変数</th><td><code>APPLICATION_DATABASE_CONNECTION_TIMEOUT</code></td><td>接続を待つ最大時間</td><td>長い英数字を含む表</td></tr></tbody></table>

## コードと日本語コメント {#code}

### 日本語フォールバックの診断

上段は採用した指定（ヒラギノ・Notoの候補を明示し、最後はmonospace）、下段は日本語候補を省いた診断用です。Safariでは先頭のui-monospaceによるシステム側の日本語選択が優先される可能性があり、両段が同じ書体になる場合もあります。字幅の測定だけで実際のフォント名を特定するものではありません。

<div class="font-probe-scroll">
<p>採用：<code data-code-probe="explicit"><span>日本語あいうえお「設定」、。</span> <span>iiWW00 // config.toml</span></code></p>
<p>省略：<code class="code-probe-auto" data-code-probe="automatic"><span>日本語あいうえお「設定」、。</span> <span>iiWW00 // config.toml</span></code></p>
</div>

### 複数行とシンタックスハイライト

行番号なしを基本とし、指定されたブロックだけ行番号と強調行を表示します。配色のトークンとBase背景はHugo付属のCatppuccinから生成しています。

```ruby
# 日本語コメントと英数字のベースラインを確認する
class Article
  def initialize(title:, tags: [])
    @title = title
    @tags = tags
  end

  def summary
    "#{@title} — #{@tags.join(', ')}"
  end
end

puts Article.new(title: "技術と日々の記録", tags: ["Ruby", "日本語"]).summary
```

```toml {filename="config.toml" linenos=inline hl_lines=[3]}
# config.toml — 行番号と強調行の確認
[tools]
ruby = "3.4"
node = "24"
```

```
言語指定なし / plain text
ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789
長い行：abcdefghijklmnopqrstuvwxyz/abcdefghijklmnopqrstuvwxyz/abcdefghijklmnopqrstuvwxyz/abcdefghijklmnopqrstuvwxyz/abcdefghijklmnopqrstuvwxyz
```

言語名とファイル名は、コード本文から推測せず、コードフェンスに指定した値をHugoで取得します。次は未対応の言語指定でも内容をプレーンテキストとして表示する例です。

```example-unknown {filename="example.txt"}
This language has no highlighter.
日本語の内容とファイル名は、そのまま表示します。
```

## 画像とキャプション {#images}

<figure><img src="assets/zsh-prompt-cover.png" width="1200" height="630" alt="自作Zshプロンプトを表示したターミナルの画面"><figcaption>幅1200 × 高さ630の元画像。本文幅720pxでは高さ378pxとなり、高さを制限しません。</figcaption></figure>

<figure><img src="assets/neovim-cheatsheet.png" alt="Neovimの操作一覧をまとめた縦長のチートシート"><figcaption>標準比率とは異なる画像も、縦横比をそのまま保ちます。</figcaption></figure>

---

本文末では脚注と、記事周辺の情報との余白を確認します。

[^note]: 脚注から参照元へ戻れます。長い補足であっても、本文と同じフォントを用いて整合性を保ちます。
