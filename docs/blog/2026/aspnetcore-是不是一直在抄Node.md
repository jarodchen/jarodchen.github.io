---
tags:
  - ASP.NET Core
  - Node.js
  - Express
  - NestJS
  - Web框架
  - 架构设计
category: 后端开发
categories:
  - .NET Core
  - 架构设计
banner: /images/aspnetcore1.webp
title: ASP.NET Core 是不是一直在抄 Node.js？
date: 2026-09-15T11:02:00
description: 中间件管道长得像 Express，DI 容器像 NestJS——ASP.NET Core 真的是在抄 Node 吗？不，是大家解决同一类问题，最后长成了差不多的样子。
pub-blog: true
ai: true
status: published
---

# ASP.NET Core 是不是一直在抄 Node.js

先看两段代码。

**ASP.NET Core：**

```csharp
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
```

**Express / Koa：**

```js
app.use(auth);
app.use(routes);
```

是不是很像？

我第一次看到这个对比的时候，也愣了一下。再加上后来的 DI 容器、模块化设计、Host 生命周期……越看越觉得 ASP.NET Core 像在“抄”Node 那一套。

但后来我把这事想明白了。

**不是抄。是趋同。**

## 大家都解决同一类问题，长成这样不奇怪

现代 Web 框架，不管什么语言，要解决的问题基本是同一批：

- 路由
- 中间件
- 依赖注入
- 配置
- 日志
- 异步 I/O
- 生命周期管理

这几个问题解决了，框架的骨架就长出来了。你解决它，我也解决它，最后大家都长得有点像。这不是抄袭，这叫**趋同演化**。

就像鱼和海豚，一个是鱼，一个是哺乳动物，进化路径完全不同，但因为在同一个环境里做同一件事，最后都长成了流线型。你能说海豚抄了鱼吗？

## 中间件管道：不是 Express 独创

先聊这个最容易被误会的点。

`app.use(...)` 这种中间件管道，确实在 Express 里被发扬光大。但它不是 Node.js 发明的。

**.NET 自己就有 OWIN / Katana**，在 ASP.NET Core 之前就提出了 `Func<AppFunc, AppFunc>` 的管道模型。这是 ASP.NET Core 中间件设计的直接前身。

**Node 的 Connect / Express** 让 `req, res, next` 这个模式流行起来，这没错。

但在这之前，**Ruby 有 Rack，Python 有 WSGI**。这些管道模型都早于 Express。

所以 ASP.NET Core 的中间件设计，本质上是 **OWIN/Katana 的延续 + 现代 Web 框架的共性沉淀**。Express 只是这个共性里的一个代表，不是源头。

## DI 和通用主机：这块 ASP.NET Core 反而更像 Spring

再聊一个反直觉的点。

ASP.NET Core 内置了 DI、配置、日志、Host——很多人觉得这是从 Node 学来的。但你去看看 Express 和 Koa：**它们根本不内置 DI。** 你要用依赖注入，自己找第三方库去。

真正的 Node 框架里，是 **NestJS** 才把 DI、模块、装饰器做进框架的。而 NestJS 借鉴的是谁？

**Angular 和 Spring。**

所以这块的真相是反过来的：**不是 ASP.NET Core 抄 Node，而是 Node 生态的 NestJS 在借鉴 .NET/Java 那套企业级架构。**

## 异步模型：目标一样，实现完全不同

这一块最容易混淆。

Node.js 是**单线程事件循环 + 回调 / Promise**。

.NET 是**多线程 + async/await + 线程池 + IOCP/epoll**。

两者都在追求高并发、非阻塞 I/O，目标一致。但底层机制完全是两回事。

Kestrel 的性能来自哪里？来自 `System.IO.Pipelines`、内存池、Socket 传输层优化、GC 优化。这些都是 .NET 自研的底层东西，跟 Node 没有半毛钱关系。

## Node 生态其实也借了 .NET / Java 很多东西

如果你真的去对比，会发现“借鉴”是双向的：

- **NestJS**：DI、模块、装饰器、AOP，这套设计明显像 Spring / Angular
- **TypeScript**：强类型设计，目标非常接近 C#
- **Fastify**：schema 验证、插件系统，思路和 ASP.NET Core 的中间件 / 过滤器很像
- **Prisma / TypeORM**：受 Entity Framework 影响很深

所以与其说谁抄谁，不如说：**大家互相学，各自演化。**

## 为什么你会觉得像？

因为现代 Web 框架都在做这几件事，最后长成了差不多的样子：

| 能力 | ASP.NET Core | Node 框架 |
|:---|:---|:---|
| 中间件管道 | 有 | Express / Koa / Fastify 有 |
| 依赖注入 | 内置 | NestJS 内置，Express 无 |
| 配置系统 | 内置 | 多数靠第三方 |
| 日志 | 内置 | 多数靠第三方 |
| 异步 I/O | async/await | 事件循环 / Promise |
| 路由 | 内置 | Express / Fastify 内置 |
| 生命周期 | Host | NestJS 有 |

看出来了吗？相似的是**能力矩阵**，不是实现方式。

同样是“中间件”，ASP.NET Core 的中间件管道的底层是 `Func<RequestDelegate, RequestDelegate>` 委托链，Express 的中间件是 JavaScript 函数数组。长得像，但根本不是一套东西。

## 结论

ASP.NET Core 不是一直在抄 Node.js 框架。

更准确的说法是：

- **中间件管道**：受 OWIN/Katana 和现代 Web 框架共性影响，Express 只是其中一个代表
- **DI / Host / 配置 / 日志**：ASP.NET Core 更接近 Spring 和企业级 .NET 自身的演进
- **异步高性能**：.NET 走的是自己的 Kestrel + Pipelines + GC 优化路线
- **Node 生态的 NestJS 等**：反而在借鉴 Spring / Angular / .NET 的架构

一句话：

**现代 Web 框架在趋同，互相借鉴。ASP.NET Core 不是 Node 的复制品。**

下次再看到两段代码长得像，别急着说“抄”。先想想：它们是不是在解决同一个问题？
`