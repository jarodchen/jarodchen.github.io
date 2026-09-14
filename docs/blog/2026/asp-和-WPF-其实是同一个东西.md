---
tags:
  - .NET
  - ASP.NET Core
  - WPF
  - WinForms
  - 依赖注入
  - 通用主机
  - 架构设计
category: 后端开发
categories:
  - .NET Core
  - 架构设计
banner: /images/aspnetcore1.webp
title: ASP.NET Core 和 WPF，Winform 其实是同一个东西
date: 2026-09-14T11:02:00
description: 把两段启动代码并排放一起，你会发现除了 UI 和触发方式，底层几乎是同一套东西。这不是巧合，这是微软想要的效果。
ai: false
pub-blog: true
status: published
---

# ASP.NET Core 和 WPF，Winform 其实是同一个东西

> 最近稍微看了一下 Winform 和 WPF 的东西，因为已经有10年没接触了，发现微软将 Winform 和 WPF  的基座和 asp.net core 是一样的还有点惊讶！说他们完全一样那是太夸张， 更合适的说，是微软统一了他们的基座。应该是从.Net5  开始的。

把这两段代码放在一起看。

**ASP.NET Core：**

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
var app = builder.Build();
app.MapControllers();
app.Run();
```

**WPF / WinForms：**

```csharp
var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddSingleton<MainWindow>();
builder.Services.AddSingleton<MainViewModel>();
builder.Services.AddSingleton<IGreetingService, GreetingService>();

var host = builder.Build();
await host.StartAsync();

var mainWindow = host.Services.GetRequiredService<MainWindow>();
Application.Run(mainWindow);

await host.StopAsync();
```

结构几乎一模一样：创建 builder，注册服务，build，启动，停止。

这不是巧合。这是微软统一 .NET 平台之后，想要的效果。

## 同一套底座，两个工作负载

更准确地说：

> **现代 .NET 桌面应用 = 通用主机 + DI + 配置 + 日志 + Options + 后台服务 + UI**
> **ASP.NET Core = 同一套底座 + HTTP 工作负载**

除了 UI 和应用触发方式不同，底层基础设施非常接近。

## 相同的地方

这些几乎和 ASP.NET Core 一模一样：

- `Microsoft.Extensions.DependencyInjection` 依赖注入
- `appsettings.json`、环境变量、命令行配置
- `ILogger<T>` 日志
- `IOptions<T>` 配置绑定
- `IHostedService` / `BackgroundService` 后台任务
- `IHostEnvironment` 环境判断
- `HttpClientFactory` 也能用
- 生命周期：`Singleton`、`Scoped`、`Transient`
- 启动、停止、优雅关闭

同一个 `Microsoft.Extensions.*` 包体系，同一套编程模型。

## 不同的地方

差异集中在“应用模型”上：

**入口触发不同。** ASP.NET Core 由 HTTP 请求驱动，桌面由消息循环、事件、命令驱动。

**作用域模型不同。** ASP.NET Core 有天然的请求作用域，每个请求一个 Scope。桌面没有天然的请求边界，通常要自己定义“窗口作用域”“导航作用域”，关闭窗口时释放。

**线程模型不同。** ASP.NET Core 主要跑在线程池。桌面 UI 是单线程，后台服务更新界面要 `Dispatcher.Invoke` 或 `Control.Invoke`。

**中间件不同。** ASP.NET Core 有 HTTP 中间件管道。桌面没有直接对应物，但可以用 MediatR、消息管道、导航服务来模拟类似分层。

**模板默认集成程度不同。** ASP.NET Core 模板默认就是 Host + DI + 配置 + 日志。WPF/WinForms 模板默认不一定集成，需要自己加 `Microsoft.Extensions.Hosting`。

## 所以可以这么理解

ASP.NET Core 是**通用主机上跑了一个 HTTP 工作负载**。

WPF/WinForms 是**同一个通用主机上跑了一个 UI 工作负载**。

底层基础设施统一，UI 和宿主触发方式不同。这就是 .NET 统一平台后的结果。

## 但别过度设计

小工具、简单窗体程序没必要硬上 Host + DI，容易把自己绕进去。

中大型桌面项目用这套，模块化、可测试性、配置日志统一性都会好很多，代码风格也能和 Web 端保持一致。

**看项目规模决定，别为了“统一”而统一。**
