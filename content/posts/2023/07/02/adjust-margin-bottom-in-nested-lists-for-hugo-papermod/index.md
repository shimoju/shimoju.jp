---
title: Hugo PaperModでネストしたリストのマージンが不揃いなのを調整する
date: 2023-07-02T14:21:50+09:00
categories:
  - 技術
tags:
  - Hugo
  - PaperMod
---

このブログではHugoのテーマとして[adityatelange/hugo-PaperMod](https://github.com/adityatelange/hugo-PaperMod)を利用している。

[以前書いたToDo](/2023/06/22/hugo-and-cloudflare-pages/#todo)で、`<ul><li><ul>`のようにリストをネストしたとき、子要素のulにmargin-bottomが適用されて、マージンが不揃いになってしまうのが気になっていたので直した。

もともと[.post-content内のul,ol要素にmargin-bottomが指定されている](https://github.com/adityatelange/hugo-PaperMod/blob/4a924cef54081b61530a30bd69d442ae95f16561/assets/css/common/post-single.css#L94)ため、以下のCSSを[カスタムCSSとして記述する](https://github.com/shimoju/shimoju.jp/blob/a57d12858c9e3b46e540c394fc8ceac3041fc77d/assets/css/extended/override.css#L34)。

```css
.post-content li ol,
.post-content li ul {
  margin-bottom: 0;
}
```

これで、ネストしたリストでもマージンが揃っていい感じになった。

- A
- B
  - C
  - D
- E

本家にコントリビュートしようとしたところ、Pull Requestを送る前にIssueで議論する雰囲気っぽかったので[Issueをしたためた](https://github.com/adityatelange/hugo-PaperMod/issues/1251)。
これはバグなのか？って感じはするけど、テンプレートがあるしひとまずBugとして報告してみた。

これが意図したデザインですって言われたら仕方ないけど、取り込まれるといいなー。
