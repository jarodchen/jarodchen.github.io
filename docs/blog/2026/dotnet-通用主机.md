---
tags:
  - 通用主机
  - Generic Host
  - .NET
  - 依赖注入
  - 生命周期
  - WPF
  - Worker Service
category: 后端开发
categories:
  - .NET Core
  - 架构设计
banner: /images/aspnetcore1.webp
title: 通用主机：.NET 世界里那个默默撑起一切的东西
date: 2026-09-15T11:02:00
description: 控制台、Worker、ASP.NET Core、WPF、WinForms——它们的启动代码看起来千差万别，但底座是同一个东西。搞懂通用主机，你就搞懂了现代 .NET 应用的统一启动模型。
pub-blog: true
ai: true
status: published
---

# 通用主机：.NET 世界里那个默默撑起一切的东西

控制台程序、后台服务、Web API、桌面应用。

这四类东西，写起来感觉完全不一样。一个跑完就退出，一个常驻后台，一个监听 HTTP，一个弹窗口。

但如果你把它们的启动代码拆开来看，会发现一个惊人的事实：**它们用的是同一个底座。**

这个底座叫**通用主机（Generic Host）**。

## 它到底是什么？

你可以把通用主机理解为一个**应用容器 + 生命周期管理器**。

它干的活分四个阶段：

- **构建时**：收集服务、配置、日志
- **启动时**：启动所有 `IHostedService`
- **运行时**：提供 `IServiceProvider` 解析服务
- **停止时**：优雅停止后台任务、释放资源

说白了，它把依赖注入、配置、日志、生命周期这些基础设施全部打包好，让不同类型的应用可以复用同一套启动模型。

涉及的核心类型不多，认全这几个就够了：

| 类型 | 作用 |
|:---|:---|
| `IHost` | 主机本身，提供 `Services` 和 `StartAsync`/`StopAsync` |
| `IHostBuilder` / `HostApplicationBuilder` | 构建主机 |
| `IServiceCollection` | 注册服务 |
| `IConfiguration` | 配置 |
| `ILoggerFactory` / `ILogger<T>` | 日志 |
| `IHostEnvironment` | 环境信息 |
| `IHostedService` | 后台服务 |
| `IHostApplicationLifetime` | 应用生命周期事件 |

## 它是怎么统一 .NET 的？

这件事不是一步到位的。

**.NET Core 2.1**，`Microsoft.Extensions.Hosting` 被引入，通用主机主要用于控制台和 Worker。那时候它还是个配角。

**.NET Core 3.0**，ASP.NET Core 默认改为基于通用主机，`WebHost` 逐渐被 `IHost` 取代。官方文档也开始介绍在 WPF/WinForms 中使用通用主机。这一步很关键——它意味着通用主机从“控制台专用”变成了“全平台底座”。

**.NET 6/7+**，`WebApplication.CreateBuilder` 和 `Host.CreateApplicationBuilder` 进一步简化了 API，但底层仍然是通用主机。

所以现在可以这么说：

- **ASP.NET Core** = 通用主机 + HTTP 工作负载
- **WPF/WinForms** = 通用主机 + UI 工作负载
- **控制台/Worker** = 通用主机 + 后台任务负载

底座是同一个，区别只在最上层跑什么。

## 生命周期：从生到死

通用主机的生命周期很清晰：

1. 创建 builder
2. 注册服务、配置、日志
3. `Build()` 得到 `IHost`
4. `StartAsync()` 启动主机和 `IHostedService`
5. 应用运行
6. `StopAsync()` 优雅停止
7. `Dispose()` 释放

想在某一步做点额外的事，可以注册生命周期回调：

```csharp
host.Services.GetRequiredService<IHostApplicationLifetime>()
    .ApplicationStarted.Register(() => Console.WriteLine("Started"));
```

`ApplicationStarted`、`ApplicationStopping`、`ApplicationStopped` 三个事件，够你在关键节点插入逻辑了。

## 四种用法，一个底座

### 控制台 / Worker Service

```csharp
var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddSingleton<IMyService, MyService>();
builder.Services.AddHostedService<Worker>();

var host = builder.Build();
await host.RunAsync();
```

`Worker` 继承 `BackgroundService`，适合跑定时任务、消息消费这类常驻后台的活。

### ASP.NET Core

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddHostedService<MyBackgroundService>();

var app = builder.Build();
app.MapControllers();
app.Run();
```

注意：`WebApplication` 本身就是 `IHost`。你可以通过 `builder.Host` 和 `builder.Services` 访问底层，但平时用不到——`WebApplication` 已经帮你封装好了。

### WPF

```csharp
public partial class App : Application
{
    private readonly IHost _host;

    public App()
    {
        var builder = Host.CreateApplicationBuilder();
        builder.Services.AddSingleton<MainWindow>();
        builder.Services.AddSingleton<IGreetingService, GreetingService>();
        _host = builder.Build();
    }

    protected override async void OnStartup(StartupEventArgs e)
    {
        await _host.StartAsync();
        _host.Services.GetRequiredService<MainWindow>().Show();
        base.OnStartup(e);
    }

    protected override async void OnExit(ExitEventArgs e)
    {
        await _host.StopAsync();
        _host.Dispose();
        base.OnExit(e);
    }
}
```

有个小坑：记得去掉 `App.xaml` 里的 `StartupUri`，否则 WPF 会自己去创建窗口，绕过了你的 DI 容器。

### WinForms

```csharp
static class Program
{
    [STAThread]
    static void Main()
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        var builder = Host.CreateApplicationBuilder();
        builder.Services.AddSingleton<MainForm>();
        builder.Services.AddSingleton<IGreetingService, GreetingService>();

        var host = builder.Build();
        host.Start();

        Application.Run(host.Services.GetRequiredService<MainForm>());

        host.StopAsync().GetAwaiter().GetResult();
        host.Dispose();
    }
}
```

和 WPF 大同小异，只是启动消息循环换成了 `Application.Run`。

## 和 WebHost 的区别

这是老生常谈的问题。

**WebHost**：专为 HTTP 设计，配置和启动都围绕 Web。

**Generic Host**：通用宿主，不绑定 HTTP，可以承载控制台、桌面、Worker、Web。

ASP.NET Core 3.0+ 的 `WebHost` 实际上是建立在通用主机之上的。现在推荐直接用 `IHost` 或 `WebApplication`，别再碰 `WebHost` 了。

## 桌面端的几个坑

在桌面应用里用通用主机，有几个地方需要额外注意：

**作用域**：ASP.NET Core 有天然的请求作用域，每个请求一个 Scope。桌面应用没有这个边界，通常要为每个窗口或导航创建 `IServiceScope`，关闭时释放。

**UI 线程**：后台服务要更新界面，不能直接操作控件。必须用 `Dispatcher.Invoke`（WPF）或 `Control.Invoke`（WinForms）切回 UI 线程。

**设计器**：WinForms/WPF 设计器经常需要无参构造函数，构造函数注入可能报错。可以用设计时数据或服务定位器兜底。

**退出**：窗口关闭时记得调 `StopAsync`，让后台任务优雅结束，别留下半拉子状态。

**不要过度设计**：小工具直接 `new` 一个窗体更简单，硬上通用主机只会把自己绕进去。中大型项目用通用主机，收益才明显。

## 一句话总结

**通用主机是 .NET 统一平台后的“应用启动框架”。**

它让 WinForms、WPF、控制台、Worker、ASP.NET Core 共享同一套 DI、配置、日志和生命周期模型。区别只在于最上层跑的是 UI、HTTP 还是后台任务。

下次你再写启动代码的时候，不妨想一想：你正在用的，其实就是同一个底座的不同皮肤。
`