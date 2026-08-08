---
tags: ["设计模式", "建造者模式", "ASP.NET Core", "依赖注入", "中间件", "配置系统"]
category: 设计模式
categories:
  - .NET Core
title: ASP.NET Core 中的建造者模式：从 Host 到 Middleware，无处不在的构建艺术
date: 2026-08-08T11:02:00
banner: /images/aspnetcore1.webp
description: 深入剖析建造者模式在 ASP.NET Core 框架中的实际应用，从 IHostBuilder、WebApplicationBuilder 到中间件管道和配置系统，带你理解微软为何如此钟爱这个模式。
---

# ASP.NET Core 中的建造者模式：从 Host 到 Middleware，无处不在的构建艺术

你在使用 ASP.NET Core 的时候，肯定写过这样的代码：

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
var app = builder.Build();
app.MapControllers();
app.Run();
```

你有没有想过：为什么是 `builder`？为什么先 `Add` 再 `Build`？这套熟悉的 API 背后，其实藏着一个经典的设计模式——**建造者模式**。

它贯穿了整个 ASP.NET Core 框架的启动流程：从 `IHostBuilder` 到 `WebApplicationBuilder`，从中间件管道到配置系统。可以说，不理解建造者模式，你就没法真正看懂 ASP.NET Core 的启动过程。

今天，我们就来拆解这套“Build 模式”背后的设计逻辑。

## 建造者模式是干什么的？

先说定义：**建造者模式将复杂对象的构建过程与它的表示分离，使得同样的构建过程可以创建不同的表示。**

翻译成人话：如果一个对象太复杂，要一堆参数、一堆步骤才能造出来，那就把“怎么造”单独拎出来。用户只管告诉建造者“我要什么”，建造者一步步组装，最后交出一个成品。

| 角色 | 职责 |
|------|------|
| 产品 | 最终被构建的复杂对象 |
| 建造者接口 | 定义构建各个部件的步骤 |
| 具体建造者 | 实现步骤，组装产品 |
| 指挥者 | 控制构建顺序（通常被简化为链式调用） |
| 客户端 | 调用建造者，获取产品 |

在 ASP.NET Core 中，指挥者角色常常被省略——我们直接链式调用建造者方法，最后调 `Build()` 收工。

## `IHostBuilder`：经典年代的建造者

在 .NET Core 早期版本中，`IHostBuilder` 就是建造者模式的典范。它负责构建一个完整的 `IHost` 应用宿主。

```csharp
public interface IHostBuilder
{
    IHostBuilder ConfigureHostConfiguration(Action<IConfigurationBuilder> configureDelegate);
    IHostBuilder ConfigureAppConfiguration(Action<HostBuilderContext, IConfigurationBuilder> configureDelegate);
    IHostBuilder ConfigureServices(Action<HostBuilderContext, IServiceCollection> configureDelegate);
    IHost Build();
}
```

使用起来是这样的：

```csharp
var host = Host.CreateDefaultBuilder(args)
    .ConfigureHostConfiguration(config => config.AddCommandLine(args))
    .ConfigureAppConfiguration((ctx, config) => config.AddJsonFile("appsettings.json"))
    .ConfigureServices((ctx, services) => services.AddHostedService<MyBackgroundService>())
    .Build();

await host.RunAsync();
```

这里的角色映射非常清晰：

- **产品**：`IHost` —— 一个包含配置、服务容器、生命周期管理的复杂对象
- **建造者接口**：`IHostBuilder`
- **具体建造者**：`HostBuilder`（框架内部实现）
- **构建算法**：`Build()` 内部按固定顺序加载配置 → 注册服务 → 创建服务提供程序 → 创建宿主
- **指挥者**：被省略了，客户端直接链式调用

同一个 `Build()` 流程，通过不同的配置委托可以产生完全不同的 `IHost` 实例——这正是建造者模式的精髓。

## `WebApplicationBuilder`：现代化的一站式建造者

从 .NET 6 开始，微软推出了更简洁的 `WebApplicationBuilder`。它把配置、服务、日志等子系统的建造过程聚合到一起，API 更紧凑：

```csharp
public sealed class WebApplicationBuilder
{
    public ConfigurationManager Configuration { get; }
    public IServiceCollection Services { get; }
    public ILoggingBuilder Logging { get; }
    public IWebHostEnvironment Environment { get; }
    public WebApplication Build();
}
```

使用起来更直观：

```csharp
var builder = WebApplication.CreateBuilder(args);

// 配置各个子系统
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Configuration.AddJsonFile("custom.json", optional: true);
builder.Logging.AddConsole();

var app = builder.Build();   // 产品诞生

// 使用产品
app.MapControllers();
app.Run();
```

`WebApplicationBuilder` 本质上是建造者模式的现代化演进——利用 C# 的属性语法，把各个子建造者直接暴露为属性，让配置过程更加自然。

## `IApplicationBuilder`：中间件管道的“建造者”

严格来说，`IApplicationBuilder` 不完全符合建造者模式的经典定义（它不产生一个独立的对象，而是构建一个委托链），但它的设计逻辑和建造者模式如出一辙：

```csharp
public interface IApplicationBuilder
{
    IApplicationBuilder Use(Func<RequestDelegate, RequestDelegate> middleware);
    RequestDelegate Build();
}
```

使用起来是这样的：

```csharp
var appBuilder = new ApplicationBuilder(serviceProvider);

appBuilder.UseMiddleware<ExceptionHandlerMiddleware>();
appBuilder.UseMiddleware<AuthenticationMiddleware>();
appBuilder.UseMiddleware<AuthorizationMiddleware>();
appBuilder.UseMiddleware<EndpointMiddleware>();

var requestDelegate = appBuilder.Build();
await requestDelegate(httpContext);
```

映射到建造者模式：

- **产品**：`RequestDelegate` —— 一个代表整个请求处理链的委托
- **建造者**：`IApplicationBuilder`
- **构建算法**：`Build()` 将添加的所有中间件委托反向组合成一个调用链

`IApplicationBuilder` 的巧妙之处在于：每一步 `Use` 都在“积累”中间件，而 `Build` 则把所有积累的东西组合成一个可执行的产品。这和建造者模式的“分步装配，最后产出”思想完全一致。

## `ConfigurationBuilder`：配置系统的建造者

ASP.NET Core 的配置系统同样采用了建造者模式：

```csharp
public interface IConfigurationBuilder
{
    IList<IConfigurationSource> Sources { get; }
    IConfigurationBuilder Add(IConfigurationSource source);
    IConfigurationRoot Build();
}
```

使用示例：

```csharp
var configBuilder = new ConfigurationBuilder()
    .AddJsonFile("appsettings.json")
    .AddEnvironmentVariables()
    .AddCommandLine(args);

var configuration = configBuilder.Build();
var connectionString = configuration.GetConnectionString("Default");
```

- **产品**：`IConfigurationRoot` —— 提供键值对配置访问的复杂对象
- **建造者**：`IConfigurationBuilder`
- **构建算法**：`Build()` 遍历所有添加的 `IConfigurationSource`，调用其 `Build` 方法获取提供程序，合并所有配置源

这使得配置源的添加和最终配置对象的构建完全分离——你可以灵活组合 json、环境变量、命令行等多种配置来源。

## 建造者模式 vs 工厂模式：区别在哪？

很多同学容易混淆这两个模式，我帮你理清：

| 方面 | 建造者模式 | 工厂模式 |
|------|-----------|----------|
| **目的** | 分步骤构建复杂对象 | 一步创建对象 |
| **复杂度** | 对象由多个部件组成 | 对象相对简单 |
| **构建过程** | 可控制顺序，支持多种表示 | 通常没有中间状态 |
| **典型应用** | `IHostBuilder`、`WebApplicationBuilder` | `IServiceProviderFactory` |

一句话总结：**工厂模式回答“创建什么”，建造者模式回答“怎么一步步创建”。**

## 为什么 ASP.NET Core 偏爱建造者模式？

背后的原因很简单：**ASP.NET Core 的启动过程本身就非常复杂。**

一个 `IHost` 需要包含配置系统、服务容器、日志系统、生命周期管理、中间件管道……这么多子系统，任何一个都不能“一键生成”。它们需要按顺序、分步骤地构建。

建造者模式完美适配了这种需求：
- **分步构建**：每一步只做一件事，清晰可控
- **灵活的配置委托**：用户可以随意插入自己的配置逻辑
- **最终产物不可变**：`Build()` 之后产出的对象通常是只读的，避免了运行时状态变化带来的混乱
- **流畅的 API 体验**：链式调用让代码读起来像英语句子

## 总结一览

| 建造者应用 | 建造者接口 | 产品 | 构建步骤 |
|------------|------------|------|----------|
| 宿主构建 | `IHostBuilder` | `IHost` | 配置 → 注册服务 → 构建服务提供程序 → 创建宿主 |
| Web 应用构建 | `WebApplicationBuilder` | `WebApplication` | 配置服务/配置/日志 → 构建 WebApplication → 配置中间件 |
| 中间件管道 | `IApplicationBuilder` | `RequestDelegate` | 添加中间件 → 反向组合为委托链 |
| 配置系统 | `IConfigurationBuilder` | `IConfigurationRoot` | 添加配置源 → 构建提供程序 → 创建配置根 |

---

建造者模式是 ASP.NET Core 启动基础设施的基石。无论你使用的是经典的 `IHostBuilder`、现代的 `WebApplicationBuilder`，还是中间件管道的 `IApplicationBuilder`，你都在和这个模式打交道。

理解它，你不仅会写出更好的 .NET 代码，还能在设计自己的 API 时，自然地采用这种“先配置、后构建”的流畅风格。毕竟，好的 API 不只是能用，还得用起来舒服。

---

**行动建议**：

1. 打开一个 ASP.NET Core 项目，把 `WebApplicationBuilder` 的源码翻出来看一遍（在 GitHub 上可以找到），观察它的内部是如何协调配置、服务和日志的。
2. 如果你在写一个需要复杂初始化的库，试试用建造者模式设计它的配置 API——用 `Builder` + `Build()` 的组合替代十几个参数的构造函数。
3. 思考一下：为什么 `IHostBuilder` 的 `ConfigureServices` 可以调用多次，而 `WebApplicationBuilder` 的 `Services` 属性却是一个集合？这两种设计各有什么优劣？
