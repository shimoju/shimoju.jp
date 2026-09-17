---
title: 日本語とEnglishの本文部品
date: 2026-09-01T23:30:00Z
lastmod: 2026-09-02T23:30:00Z
---

日本語とEnglish 0123。[文中リンク](https://example.org/)と`config.toml`、**太字**、*強調*を確認します。脚注も使います。[^note]

## 読みやすさ {#reading}

本文と`長い識別子_abcdefghijklmnopqrstuvwxyz_abcdefghijklmnopqrstuvwxyz`が混在します。

### 下位見出し

#### 続く下位見出し

##### H5

###### H6

- 親の項目
  - 子の項目
    - 孫の項目

1. 最初の手順
2. 次の手順

> 引用の文章です。
>
> - リストの項目。
> - `inline`の項目。

## 表

| 左の項目 |   中央   |  右 |
| :------- | :------: | --: |
| 長い値   |  日本語  | 123 |
| 内容     | **太字** | 456 |

### 幅のある表

| A   | B   | C   | D   | E   | F   | G   | H   |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 一  | 二  | 三  | 四  | 五  | 六  | 七  | 八  |

## コード {#code}

```ruby
# 日本語コメント
puts "Hello & <world>"
```

```toml {filename="config.toml" linenos=inline hl_lines=[3]}
# config.toml — 行番号と強調行の確認
[tools]
ruby = "3.4"
node = "24"
```

```text {filename="table.txt" linenos=table}
日本語の一行目
Second line
```

```
言語なし
ABCDEFGHIJKLMNOPQRSTUVWXYZ/abcdefghijklmnopqrstuvwxyz/ABCDEFGHIJKLMNOPQRSTUVWXYZ/abcdefghijklmnopqrstuvwxyz/ABCDEFGHIJKLMNOPQRSTUVWXYZ/abcdefghijklmnopqrstuvwxyz
```

```example-unknown {filename="example.txt"}
未知の言語 & <sample>
```

---

[^note]: 脚注の文章。[参照リンク](https://example.org/note)。
