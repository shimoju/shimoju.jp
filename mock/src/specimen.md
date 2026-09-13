---
title: 日本語の技術文書を読むための組版サンプル — 見出し、リンク、表とコードの調和
date: 2026-09-05
lastmod: 2026-09-06
---

このページはモックの部品確認用です。実記事とは別に、深い見出しや長い表などの境界条件をまとめています。日本語の文章にRuby、PostgreSQL、HTTP/3、2026年といった英数字が混ざったときも、字面やベースラインが自然につながることを目指します。

## 文章とリンクの読みやすさ {#reading}

「日本語」、カタカナ。（括弧の余白）を確認します。本文・見出しは`palt`を有効にし、欧文のRuby on Rails、HTTP/3と自然につながる組版を比較します。括弧と句読点だけでなく、仮名の字幅も変わり得るため、長文で読み心地を確認してください。

技術記事では、[Hugoのドキュメント](https://gohugo.io/documentation/)、[Catppuccinのパレット](https://catppuccin.com/palette/)、[Rubyのリファレンス](https://docs.ruby-lang.org/ja/)のように、根拠や背景へのリンクが連続します。リンクを発見できることと、文章全体に落ち着きがあることの両方を確認します。

`config.toml`を編集して`hugo server`を実行する。日本語の中に`very_long_configuration_identifier_without_spaces`が入っても、文章全体の行間は変えません。**大切な語句は太字**にし、*補足的な強調*も同じ階調で扱います。脚注は本文の流れを妨げない位置に置きます。[^note]

通常の日本語とEnglish 0123に対して、<strong>重要な日本語とEnglish 0123（strong）</strong>、<b>注目する日本語とEnglish 0123（b）</b>を同じ700で表示します。<strong>強調の中の<b>入れ子の太字</b></strong>も700を維持し、<strong><code>inline_code</code></strong>は強調の太さを継承します。

> 読みやすさは文字サイズだけでは決まらない。行の長さ、前後の余白、見出しの強さが揃って、長い文章を読み進められる。
>
> これは表示確認のための例文です。

### 設定を小さく分ける {#heading-three}

見出しの前には十分な余白を取り、続く本文との間は狭くします。背景や下線を付けず、文字そのものの強さで構造を表現します。

#### フォントと文字サイズを定義する {#heading-four}

欧文と和文の候補を順番に指定します。端末ごとに異なる書体が選ばれても、本文以上のサイズで見出しの階層を維持します。

##### H5：日本語コメントのある場合 {#heading-five}

小さな階層でも、本文より文字を小さくしません。H5は本文の1.099倍、太さ500です。この段落と次のH6を続けて読み、差が十分かを確認します。

###### H6：折り返した行の扱いと、長い日本語見出しが続くときの読みやすさ {#heading-six}

H6は本文と同じサイズで、太さ500です。わずかなサイズ差だけで十分かどうかは継続検討の対象です。通常の段落と混同しないことも確認します。

## 連続する見出しの余白確認 {#consecutive-headings}

### 本文を挟まないH3

#### 続けて配置したH4

見出しは基本の前2.121em・後0.687emに対し、連続する下位見出しの前を0.910emにします。直後の段落の上marginは0とし、見出しの下marginで距離を決めます。親子の階層と続く本文のまとまりを確認します。

## リストと手順 {#lists}

- 本文に集中できる一列構成
  - ナビゲーションは折り返して表示する
  - コードブロックは内側で横スクロールする
    - 日本語コメントを含める
    - コピー操作はホバー・フォーカス・タップで表示する
- 写真やスクリーンショットは切り抜かない

1. 色と文字サイズの基本案を確認する。
2. 同じ文章で比較案を確認する。
   1. 一度に変える項目を絞る。
   2. モバイルでも読み比べる。
3. 気になった点をMarkdownに記録する。

### 本文部品の組み合わせ {#combinations}

#### 複数段落を含むリスト項目

- 最初の段落では、手順の目的を説明します。項目内の文章が複数行に折り返す場合も、字下げと行間を確認します。

  同じ項目の補足段落です。通常の本文段落より狭い0.35emの間隔で、同じ手順に属することを示します。

  - 補足の入れ子リストです。
  - `config.toml`などのインラインコードも確認します。

- 次の項目です。段落間隔と項目間隔が重なったときのまとまりを確認します。

#### 引用内のリストとコード

> 引用の中にも、複数の段落とリストが含まれます。
>
> - 最初の項目は通常の文章です。
> - 次の項目には`bundle exec`というインラインコードがあります。
>   - 入れ子でも本文幅の内側に収まることを確認します。
>
> ```ruby
> # 引用の字下げ・コードの左右余白・局所スクロールを確認
> puts "日本語のコメントとRubyのコード"
> ```
>
> コードの後に続く段落です。引用の左罫線が全体をまとめ、コピー操作とフォーカス枠も利用できます。

### インラインコードの余白確認 {#inline-spacing}

上下のpaddingを増やしても、以下の改行位置を揃えた2段落で行送りが変わらないことを確認します。最初が採用案、次がpaddingなしの診断用です。通常の本文には採用案だけを使います。

<p class="inline-probe">本文と<code>config.toml</code>を読む。<br>本文と<code>日本語の設定</code>を読む。<br>続く行にも十分な余白を残す。</p>
<p class="inline-probe unpadded">本文と<code>config.toml</code>を読む。<br>本文と<code>日本語の設定</code>を読む。<br>続く行にも十分な余白を残す。</p>

## 表と長い識別子 {#tables}

ブラウザの既定文字サイズが16pxの場合の換算値です。既定サイズを変えると文字・余白・操作部品も追従し、本文の最大幅720pxは維持します。

| 項目 | デスクトップ | モバイル |
| --- | --- | --- |
| ルート | 62.5%（10px） | 62.5%（10px） |
| 本文 | 1.7rem（17px） | 1.7rem（17px） |
| 記事タイトル | 本文×1.6（27.2px） | 本文×1.6（27.2px） |
| H2 | 本文×1.456（約24.75px） | 本文×1.456（約24.75px） |
| H3 | 本文×1.326（約22.54px） | 本文×1.326（約22.54px） |
| H4 | 本文×1.207（約20.52px） | 本文×1.207（約20.52px） |
| H5 | 本文×1.099（約18.68px） | 本文×1.099（約18.68px） |
| H6 | 1.7rem（17px） | 1.7rem（17px） |
| サイト名 | 本文×1.931（約32.83px） | 本文×1.931（約32.83px） |
| 一覧タイトル | 本文×1.207 | 本文×1.207 |
| 補助文字・小 | 本文×0.910 | 本文×0.910 |
| 日付・タグ | 本文×0.829 | 本文×0.829 |
| 小さなラベル | 本文×0.754 | 本文×0.754 |
| 行高 | 1.9 | 1.9 |
| コード | 1.4rem（14px） / 1.3 | 1.4rem（14px） / 1.3 |

<table class="wide-table"><thead><tr><th scope="col">設定項目</th><th scope="col">識別子</th><th scope="col">内容</th><th scope="col">備考</th></tr></thead><tbody><tr><th scope="row">APIエンドポイント</th><td><code>GET /api/v1/projects/:project_id/deployments</code></td><td>デプロイ履歴の一覧を取得</td><td>ローカルな横スクロールの検証</td></tr><tr><th scope="row">環境変数</th><td><code>APPLICATION_DATABASE_CONNECTION_TIMEOUT</code></td><td>接続を待つ最大時間</td><td>長い英数字を含む表</td></tr></tbody></table>

## コードと日本語コメント {#code}

### 日本語フォールバックの診断

採用した指定はMenlo, Consolas, monospaceです。欧文はMacでMenlo、WindowsでConsolasを優先し、その他の環境と和文はブラウザのmonospace・不足文字のフォールバックに委ねます。本文との書体の統一は求めず、palt・合字・自動カーニングは無効にします。欧文のiiii／WWWW／0000が同じ幅であること、日本語と約物の字幅・混植の読みやすさを確認します。和欧文の厳密な2:1の幅比や、字幅だけからの実フォントの特定は保証しません。

<div class="font-probe-scroll">
<p>採用：<code data-code-probe="adopted"><span>日本語あいうえお「設定」、。</span> <span>iiWW00 // config.toml</span></code></p>
<p>欧文の字幅：<code data-code-probe="width"><span>iiii</span> <span>WWWW</span> <span>0000</span></code></p>
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
