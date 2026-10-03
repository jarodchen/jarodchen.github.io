---
tags:
  - ASP.NET Core
  - HttpContext
  - 中间件
  - 请求管道
  - .NET
category: 后端开发
categories:
  - .NET Core
  - 架构设计
banner: /images/aspnetcore1.webp
title: ASP.NET Core 管道里，是谁在传递信息？
date: 2026-09-15T17:02:00
description: 管道是河道，请求和响应是水，HttpContext 是随水漂流的容器。搞懂这个比喻，你就搞懂了 ASP.NET Core 中间件最核心的载体。
pub-blog: true
ai: true
status: published
---
# ASP.NET Core 管道里，是谁在传递信息？

一个形象的比喻：**管道是河道，请求和响应数据是水，`HttpContext` 是装水漂流的容器——一个背包、船舱或者集装箱。中间件就是河道上的一个个关卡，它们检查水、加工水，也往容器里塞东西。**

`HttpContext` 不是水本身。水是 `Request` 和 `Response` 里的内容。`HttpContext` 是把这些内容，连同用户、终结点、服务、特性、会话等等，全部装在一起的那个上下文对象。

整个请求从进来到出去，始终是同一个 `HttpContext` 在中间件链里流动。每个中间件都能读它、改它、往它上面挂东西，然后调用下一个中间件。

```text
请求进来
   │
   ▼
创建 HttpContext
   │
   ▼
中间件1 → 中间件2 → 中间件3 → 端点
   │         │         │        │
   └─────────┴─────────┴────────┘
        同一个 HttpContext
```

它里面主要装这些东西：

- `Request`：请求方法、路径、头、查询、Body
- `Response`：状态码、头、Cookie、Body
- `User`：认证后的用户
- `GetEndpoint()`：路由匹配到的终结点
- `Request.RouteValues`：路由参数
- `RequestServices`：请求作用域的服务容器
- `Items`：请求内共享的临时字典
- `Features`：底层功能集合，很多能力挂在里面
- `Session`、`Connection`、`TraceIdentifier`、`RequestAborted` 等等

所以你完全可以这样记：

**`HttpContext` 是 ASP.NET Core 管道的核心载体。整个请求从进来到出去，都是同一个 `HttpContext` 在中间件链里流动，中间件不断往它上面读写信息，最终由服务器把响应发出去。**

再短一点：

**管道是链，`HttpContext` 是链上传递的上下文容器；请求和响应是水，`HttpContext` 是装水的容器。**
