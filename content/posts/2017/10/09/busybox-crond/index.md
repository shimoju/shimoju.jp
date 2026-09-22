---
title: DockerでcronしたいときはBusyBox crondが便利
date: 2017-10-09T20:45:52+09:00
categories:
  - 技術
tags:
  - BusyBox
  - cron
---

Dockerコンテナでプログラムを定期実行したいとき、それぞれの言語で実装されたタスクスケジューラを使うほか、手っ取り早くcronを使ってしまう方法もあります。しかしDockerで使うにはやや面倒な点があります。

- cronで実行するプログラムにコンテナに設定した環境変数を渡したい
  - 環境変数が独立しているのはcronのよくあるハマりどころですね
  - [ファイルに書き出して読み込んで](https://qiita.com/rerofumi/items/fc0126c4e985b78f769b)、とやるのは面倒
- ログは標準出力・標準エラー出力に書き出したい
  - 標準出力に出せば`docker logs`で扱えるし、ファイルだとローテートが面倒

このようなとき、[BusyBox](https://busybox.net/)に含まれるcrondを使うと、以上の課題を解決してシンプルに定期実行することができます。

## インストール

Debian系では`apt-get install busybox-static`でインストールし、`busybox crond`で起動します。
Alpine LinuxであればそのままBusyBoxなので`crond`で起動できます。

## オプション

`-d`オプションは比較的最近追加されたようで、Debian jessie(BusyBox v1.22.1)には含まれていませんでした。stretchでもv1.22.1のままのようです。

### Alpine Linux 3.6 / BusyBox v1.26.2

```sh
# crond --help
BusyBox v1.26.2 (2017-06-11 06:38:32 GMT) multi-call binary.

Usage: crond -fbS -l N -d N -L LOGFILE -c DIR

	-f	Foreground
	-b	Background (default)
	-S	Log to syslog (default)
	-l N	Set log level. Most verbose:0, default:8
	-d N	Set log level, log to stderr
	-L FILE	Log to FILE
	-c DIR	Cron dir. Default:/var/spool/cron/crontabs
```

### Debian jessie / BusyBox v1.22.1

```sh
# busybox crond --help
BusyBox v1.22.1 (Debian 1:1.22.0-9+deb8u1) multi-call binary.

Usage: crond -fbS -l N -L LOGFILE -c DIR

	-f	Foreground
	-b	Background (default)
	-S	Log to syslog (default)
	-l	Set log level. 0 is the most verbose, default 8
	-L	Log to file
	-c	Working dir
```

### ログレベル

ログレベルが0から8まであってよくわからなかったので[ソース](https://git.busybox.net/busybox/tree/miscutils/crond.c#n171)を読んだところ、

```c {filename="miscutils/crond.c"}
/* Log levels:
 * 0 is the most verbose, default 8.
 * For some reason, in fact only 5, 7 and 8 are used.
 */
```

とのことでした。`For some reason`とは一体……という感じですが、デフォルトの`8`でもコマンドの実行ログは出るので特に問題なさそうです。

というわけで、Dockerで使う場合は以下のコマンドにすればよいでしょう。新しく追加された`-d`オプションが標準エラーに出力しているので、Debianの場合でもこれに統一しています。

```dockerfile {filename="Dockerfile"}
# Alpine
# crond -f -d 8
CMD ["crond" "-f", "-d", "8"]

# Debian
# busybox crond -f -L /dev/stderr
CMD ["busybox", "crond", "-f", "-L", "/dev/stderr"]
```

## 実行する

`/var/spool/cron/crontabs/root`にいつものようにcrontabを書いて実行します。

```sh
$ cat crontab
* * * * * echo '=== environment variables ===' && env

$ docker run --rm -e FOO=BAR -v $(pwd)/crontab:/var/spool/cron/crontabs/root alpine:3.6 crond -f -d 8
crond: crond (busybox 1.26.2) started, log level 8
crond: USER root pid   7 cmd echo '=== environment variables ===' && env
=== environment variables ===
USER=root
no_proxy=*.local, 169.254/16
HOSTNAME=eac1d9f28400
SHLVL=1
HOME=/root
LOGNAME=root
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
FOO=BAR
SHELL=/bin/sh
PWD=/root
```

このように、コンテナに設定した環境変数`FOO=BAR`が実行コマンドからも見えること、ログが標準エラー出力に書き出されていることを確認できました。

## タイムゾーン

cronと直接関係はありませんが、タイムゾーンを日本時間にしておかないと意図した時刻に動かなくてハマるので注意しましょう……(1時間無駄にしました😇)。

```dockerfile {filename="Dockerfile"}
ENV TZ=Asia/Tokyo
```

## 参考記事

- [debian ベースの Docker コンテナで busybox の cron を実行 - ngyukiの日記](http://ngyuki.hatenablog.com/entry/2017/04/18/195254)
- [alpine linuxでcron用コンテナを作る - Qiita](https://qiita.com/shufo/items/9def5e9a6f44996312b8)
