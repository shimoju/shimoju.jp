---
title: chezmoiでdotfilesを簡潔に管理する
date: 2025-12-07T22:10:12+09:00
categories: 技術
tags:
  - chezmoi
  - dotfiles
---

dotfilesの管理は永遠につきまとう課題です。
今までは[itamaeを用いて管理](https://github.com/shimoju/setup)し、さらにServerspecによるテストも記述していました。

当時は構成管理を学習していて、実践するためのちょうどいい題材がdotfilesだったという経緯なのですが、dotfiles管理としてはだいぶ重たい構成です。
ライブラリのバージョンなども古くなっていたため、この機会に一新することにしました。

今回は[chezmoi](https://www.chezmoi.io/)を採用しました。
itamaeではERBテンプレートやgitリポジトリ管理の機能を活用しており、類似の機能があることと、ドキュメントも充実していることから選びました。

ちなみに`/ʃeɪ mwa/`（シェモア、フランス語で「私の家」）と発音するそうです。チェズモイって読んでた……。

## 導入

任意の方法で[chezmoiをインストール](https://www.chezmoi.io/install/)し、[Quick start](https://www.chezmoi.io/quick-start/)の通りに進めていけばOKです。

`chezmoi init`を実行すると、`~/.local/share/chezmoi`にchezmoiの管理ディレクトリ（リポジトリ）が作成されます。
`chezmoi add`でファイルを管理対象に追加し、編集したら`chezmoi apply`で変更を適用します。
リポジトリへのコミットやプッシュは通常のgitコマンドを利用します。

別のマシンに導入するときは、`chezmoi init`にリモートリポジトリのURLを与えます。

```sh
# ~/.local/share/chezmoiに指定したリポジトリをcloneする
$ chezmoi init https://github.com/shimoju/dotfiles.git
$ chezmoi apply
```

リモートリポジトリの変更を取り込むには、`chezmoi update`が便利です。

```sh
$ chezmoi update
# 以下のコマンドと同等
$ cd ~/.local/share/chezmoi
$ git pull
$ chezmoi apply
```

## chezmoiの規約

ファイル名・ディレクトリ名は実際の`.foobar`ではなく、`dot_foobar`とプリフィックスを用いて管理されます。
パーミッションやシンボリックリンクもプリフィックスとして表現されます。

| 実際のファイル | chezmoiでの表現 |
| - | - |
| `~/.gitconfig` | `/dot_gitconfig` |
| `~/.config/starship.toml` | `/dot_config/starship.toml` |
| `~/.ssh/config`（パーミッション600） | `/private_dot_ssh/private_config` |
| `~/.symboliclink`（シンボリックリンク） | `/symlink_dot_symboliclink` |

この規約があることからファイルをそのままコピーしてくることはできず、常に`chezmoi add`を使う必要があります。
もちろん手で規約に沿ったファイル名にすることはできますが、ここは好みの分かれる点かもしれません。

## テンプレート

環境によってファイルの内容を変更するための[テンプレート](https://www.chezmoi.io/user-guide/templating/)がサポートされています。
ファイルの拡張子として`.tmpl`をつけるとテンプレートとして解釈されます。

たとえば、OSによる分岐は以下のように記述します。

```go-text-template
{{ if eq .chezmoi.os "darwin" }}
# macOS
{{ else if eq .chezmoi.os "linux" }}
# Linux
{{ else }}
# その他のOS
{{ end }}
```

## gitリポジトリ管理

[Prezto](https://github.com/sorin-ionescu/prezto)や[anyenv](https://github.com/anyenv/anyenv)といった、git cloneして利用するツールの管理には[chezmoiexternal.toml](https://www.chezmoi.io/user-guide/include-files-from-elsewhere/)を利用します。

以下のように書くことで、`chezmoi apply`実行時に外部のソースを取り込んでくれます。
gitリポジトリ以外に、[URLからのダウンロードにも対応しています](https://www.chezmoi.io/reference/special-files/chezmoiexternal-format/)。


```toml
# ~/.config/zsh/.zpreztoにcloneする
[".config/zsh/.zprezto"]
type = "git-repo"
url = "https://github.com/sorin-ionescu/prezto.git"
refreshPeriod = "168h"
clone.args = ["--recursive"]

# ~/.anyenvにcloneする
[".anyenv"]
type = "git-repo"
url = "https://github.com/anyenv/anyenv.git"
refreshPeriod = "168h"
```

applyすると毎回ダウンロードされるわけではなく、`refreshPeriod`で指定した期間が経過していたら再ダウンロードされます。サーバーに余計な負荷をかけずエコですね。

## スクリプト

`chezmoi apply`実行時に[任意のスクリプトを実行できる](https://www.chezmoi.io/user-guide/use-scripts-to-perform-actions/)仕組みがあります。

`run_`プリフィックスがついたファイルがスクリプトとして解釈されます。プリフィックスによってスクリプトの挙動が変わります。

| プリフィックス | 挙動 |
| - | - |
| `run_` | applyのたびに実行される |
| `run_onchange_` | 前回の実行時から内容が変化したときに実行される |
| `run_once_` | ファイルのハッシュ値をもとに一度だけ実行される |

`run_once_`はファイルのハッシュ値ごとに一度だけ実行します。そのため、以下のように操作したとき、3番目のapplyではハッシュ値が同一となるためスクリプトは実行されません。
`run_onchange_`であれば実行されます。

1. 内容Aでapply：スクリプトが実行される
2. 内容Bに変更してapply：スクリプトが実行される
3. 内容Aに戻してapply：スクリプトが実行されない

この機能を用いて、`brew bundle`でパッケージのインストールを実行するようにしました。
`run_once_install_homebrew.sh.tmpl`のように、スクリプトでも拡張子を`.tmpl`とすることでテンプレートが利用できます。

```bash
#!/bin/bash

set -e

{{ if eq .chezmoi.os "darwin" }}

read -p 'Install homebrew:'

if [[ ! -x "/opt/homebrew/bin/brew" ]]; then
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

brew bundle --file="$HOME/.Brewfile"

{{ end }}
```

## ファイルの除外

リポジトリには含めたいが適用したくないファイルは、[.chezmoiignore](https://www.chezmoi.io/reference/special-files/chezmoiignore/)で除外できます。

GitHub用に`README.md`を配置しつつ、適用対象からは除外するようにしています。

## まとめ

これらの機能を活用し、itamae時代とほぼ同等のdotfilesを、より簡潔に構築できました。
完成したリポジトリは[shimoju/dotfiles](https://github.com/shimoju/dotfiles)にあります。

他にも[パスワードマネージャー経由で秘匿情報を取得し、テンプレートに埋め込む機能](https://www.chezmoi.io/user-guide/password-managers/)もあります。
これを使えば秘匿情報を含むファイルも管理できるので、今度試してみたいです。
