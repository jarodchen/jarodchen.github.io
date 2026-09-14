---
tags:
  - Vite
  - 环境变量
  - 前端构建
  - 安全
  - 工程化
category: 前端开发
categories:
banner: /images/vue3.webp
title: Vite 的 VITE_ 环境变量，到底被编译到哪去了？
date: 2026-09-14T11:02:00
description: 你以为改了 .env 线上就会变？不，值早在 build 那一刻就焊死在 JS 里了。搞懂 Vite 环境变量的构建期替换机制，以及为什么密钥绝不能放进去。
ai: true
pub-blog: true
status: published
---

# Vite 的 VITE_ 环境变量，到底被编译到哪去了？

先问一个问题：

你在 `.env` 里改了一个 `VITE_API_BASE` 的值，重新部署了一下——没重新 build，只是把新的 `.env` 文件扔到服务器上。

然后你发现，线上根本没变。

为什么？

因为 **Vite 的 `VITE_` 环境变量，在 build 的时候就已经被写死进产物了。**

## 只有 VITE_ 前缀的才进产物

Vite 默认只把 `VITE_` 开头的变量暴露给 `import.meta.env`。

不带这个前缀的，比如 `DB_PASSWORD`、`API_SECRET`——对不起，`import.meta.env` 里根本看不到它们。这是 Vite 的第一道隔离。

所以第一个结论很简单：**你不加 `VITE_` 前缀，它就不会被打进代码。**

但加了前缀的，就一定会。

## build 时干的是“文本替换”，不是“运行时读取”

这是最关键的一点。

你以为 `import.meta.env.VITE_API_BASE` 是运行时去读环境变量？不是。

**Vite 在构建阶段做的是一次词法级的字符串替换。**

源码里写：

```js
const base = import.meta.env.VITE_API_BASE;
fetch(`${base}/users`);
```

build 之后，产物里变成：

```js
fetch("https://api.mysite.com/users");
```

`import.meta.env.VITE_API_BASE` 这串东西消失了。取而代之的是一个**硬编码的字符串字面量**。然后经过压缩、混淆，这个值就焊死在 JS chunk 里了。

产物里找不到 `import.meta.env`，只剩一段写死的值。

这也解释了一件事：**构建后改 `.env` 不会生效。** 因为值早在 build 那一刻就固化了，跟你后面放什么 `.env` 文件没关系。

如果你需要“运行时可改”的配置，得绕开 env——用 `/config.js` 动态下发，或者后端接口返回。env 解决的是构建期注入，不是运行时配置。

## 值进了产物，就等于公开了

这是安全层面的事，但很多人不当回事。

既然 `VITE_` 变量的值被硬编码进了 JS 文件，那它就能被任何人看到——打开 DevTools 看源码、抓包、甚至直接搜 bundle 文件，都能找到。

所以：

- **密钥、Token、数据库地址、私有 API Key**——绝对不能放 `VITE_` 变量
- 前端能放的，只有“本来就不保密”的东西：公开 API 地址、特性开关、统计 ID

有人可能会想：“那我混淆一下不就行了？”

混淆只是让代码难读，不是加密。值就在那里，想找的人一定能找到。把密钥放前端，等于把家门钥匙插在门锁上。

## 一句话总结

**`VITE_` 变量 = build 期文本替换 + 硬编码进产物 + 对外可见。**

需要运行时可改的配置？别用 env，走运行时下发。

需要保密的？别放前端，放后端。

就这么简单。