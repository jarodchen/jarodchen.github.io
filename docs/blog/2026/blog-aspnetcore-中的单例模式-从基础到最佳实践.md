---
tags: [设计模式, 单例模式, ASP.NET Core, 依赖注入, 线程安全]
category: 设计模式
categories: [设计模式, .NET Core]
title: ASP.NET Core 中的单例模式：从基础到最佳实践
date: 2026-08-06T11:02:00
banner: /images/aspnetcore1.webp
description: 深入解析 ASP.NET Core 中单例模式的应用，涵盖 DI 容器注册、框架内置服务、中间件集成及线程安全等核心要点，帮助开发者正确使用单例模式。
---

# ASP.NET Core 中的单例模式：从基础到最佳实践

作为开发者，我们总会遇到这样一种场景：某个服务需要在整个应用中共享同一份状态，或者某个工具的初始化成本很高，我们希望它只被创建一次。

这正是单例模式发挥作用的地方。在 GoF 的 23 种设计模式中，[[blog-单例模式|单例模式]] 可能是最常被提及、也最容易被误用的一种。而在 ASP.NET Core 中，得益于依赖注入容器的存在，单例模式被赋予了全新的生命力——它不再需要手动编写双重锁检查的样板代码，而是变成了一次简单的服务注册。

今天，我们就来聊聊在 ASP.NET Core 中如何正确地使用单例模式，以及那些不得不注意的坑。

## 什么是单例模式

单例模式的核心目标非常朴素：**确保一个类在整个应用程序生命周期内只有一个实例**，并提供一个全局访问点。它主要解决两类问题：一是资源共享，比如配置对象、日志工厂；二是资源节约，比如数据库连接池、HttpClient 工厂。

在 ASP.NET Core 中，单例模式的管理交给了 DI 容器，而不是像传统那样由类自身通过私有构造函数和静态属性来强制保证唯一性。这种“反转”带来了更好的可测试性和更灵活的生命周期控制。

## DI 容器中的单例注册

在 ASP.NET Core 中，将一个服务注册为单例非常简单——调用 `AddSingleton` 方法即可：

```csharp
// 注册接口与实现
builder.Services.AddSingleton<IMyService, MyService>();

// 直接注册一个现成的实例
builder.Services.AddSingleton<IMyService>(new MyService());

// 使用工厂委托，实现更复杂的创建逻辑
builder.Services.AddSingleton<IMyService>(sp => 
    new MyService(sp.GetRequiredService<ILogger<MyService>>()));
```

单例的生命周期由容器全权管理：它在首次被解析时创建（或者在注册时直接提供实例），然后一直存活到应用程序关闭。所有请求、所有线程共享这同一个实例。这种“全局唯一性”非常强大，但也意味着我们必须对线程安全问题保持高度警惕。

来看一个简单的计数器服务。如果你用普通的 `_count++` 来实现增量操作，在多线程环境下会出现竞争条件。正确的做法是使用 `Interlocked.Increment`：

```csharp
public class CounterService
{
    private int _count;
    public int Increment() => Interlocked.Increment(ref _count);
}
```

一个更稳妥的建议是：**单例服务最好设计为无状态或不可变**。如果确实需要可变状态，务必使用线程安全机制——比如锁、`ConcurrentDictionary` 或 `Interlocked` 系列方法。

## 框架内置的单例服务

ASP.NET Core 内部大量使用了单例模式，很多我们日常开发中频繁打交道的服务，实际上都是以单例形式存在的。

**日志系统**就是一个典型例子。`ILoggerFactory` 通常注册为单例，因为日志提供程序和配置在整个应用生命周期中很少变动。每次我们通过 `ILogger<T>` 获取日志实例时，底层复用的都是同一个工厂实例。

**配置对象** `IConfiguration` 同样是单例。配置在整个应用中本质上是只读的全局状态，非常适合这种生命周期。`CreateDefaultBuilder` 在启动时就已经帮我们把它注册好了。

**`IHttpClientFactory`** 则是一个更有意思的例子。它被注册为单例，内部维护了一个 `HttpMessageHandler` 池，所有 `HttpClient` 实例复用这些处理程序。这能有效避免频繁创建 HttpClient 带来的端口耗尽和 DNS 刷新问题。

**内存缓存** `IMemoryCache` 也作为单例使用，因为缓存数据天然需要在整个应用程序中共享，而不是每个请求都创建一份独立缓存。

此外，`IHostApplicationLifetime`（应用生命周期通知）和 `IWebHostEnvironment`（主机环境信息）也是常见的单例服务。

## 单例模式与中间件

默认情况下，中间件是瞬态的——每个请求都会创建一个新的实例。但如果中间件本身没有状态，注册为单例可以减少内存分配和对象创建的开销。

基于委托的中间件，其委托本身在应用启动时创建一次，之后每个请求复用，本质上就是单例行为：

```csharp
app.Use(async (context, next) =>
{
    await next();
});
```

如果你使用基于类的中间件，并且实现了 `IMiddleware` 接口，就可以将其注册为单例：

```csharp
public class MySingletonMiddleware : IMiddleware
{
    private readonly ILogger _logger;
    public MySingletonMiddleware(ILogger<MySingletonMiddleware> logger) => _logger = logger;
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        _logger.LogInformation("Processing request");
        await next(context);
    }
}

builder.Services.AddSingleton<MySingletonMiddleware>();
app.UseMiddleware<MySingletonMiddleware>();
```

需要注意的是，传统的基于 `Invoke` 方法加构造函数参数的中间件（不实现 `IMiddleware`）无法注册为单例，因为框架要求每个请求创建新实例来注入范围生命周期服务。

## 单例 vs 传统手动实现

为了方便对比，我们可以列一个表格：

| 方面 | 传统手动单例 | ASP.NET Core DI 单例 |
|------|-------------|---------------------|
| 实例控制 | 私有构造函数 + 静态字段 | 容器负责创建和管理 |
| 线程安全 | 需要自己实现双重锁检查 | 容器保证线程安全创建 |
| 可测试性 | 较差，静态依赖难以 Mock | 优秀，可通过替换服务实现 |
| 生命周期管理 | 手动调用 `Dispose` | 容器自动调用 `Dispose` |
| 全局访问点 | 静态属性 `Instance` | 构造函数注入 `IMyService` |

结论很明确：**除非有特殊原因，否则应该永远依赖 ASP.NET Core 的 DI 容器来管理单例服务**，而不是手动实现经典的单例类。

## 使用单例模式的注意事项

### 1. 避免从单例中注入范围服务

这是新手最容易踩的坑。下面的写法看起来没问题，但实际上很危险：

```csharp
public class MySingletonService
{
    private readonly MyScopedService _scopedService;
    public MySingletonService(MyScopedService scopedService) => _scopedService = scopedService;
}
```

问题在于：`MyScopedService` 是 Scoped 生命周期的，每个请求都有不同的实例。但单例服务只有一个，它捕获的 `MyScopedService` 实例可能不是当前请求的，甚至可能引发内存泄漏。

正确的做法是注入 `IServiceScopeFactory`，在需要时动态创建作用域：

```csharp
public class MySingletonService
{
    private readonly IServiceScopeFactory _scopeFactory;
    public MySingletonService(IServiceScopeFactory scopeFactory) => _scopeFactory = scopeFactory;

    public void DoWork()
    {
        using var scope = _scopeFactory.CreateScope();
        var scopedService = scope.ServiceProvider.GetRequiredService<MyScopedService>();
        // 使用 scopedService
    }
}
```

### 2. 注意内存泄漏

单例对象会一直存活到应用程序关闭。如果它引用了一些临时对象或注册了事件处理程序而没有正确取消订阅，这些对象将无法被 GC 回收，导致内存泄漏。

```csharp
public class BadSingleton
{
    private List<byte[]> _largeData = new();
    public void AddData(byte[] data) => _largeData.Add(data);
}
```

上面的代码中，`_largeData` 会随着每次调用 `AddData` 不断增长，最终耗尽内存。解决方案是避免在单例中累积状态，或者使用 `WeakReference` 和定期清理机制。

### 3. 线程安全

这一点在前文已经提到过。单例的方法会被多个线程并发调用，必须确保线程安全。无状态服务通常是安全的，而有状态服务需要额外保护措施。

## 总结

单例模式是 ASP.NET Core 中最常用的生命周期模式之一。合理使用可以提升性能、共享资源、减少开销；滥用则会导致线程安全问题、内存泄漏和测试困难。

| 应用场景 | 服务示例 |
|----------|----------|
| 全局配置 | `IConfiguration` |
| 日志系统 | `ILoggerFactory` |
| HTTP 客户端管理 | `IHttpClientFactory` |
| 内存缓存 | `IMemoryCache` |
| 无状态业务服务 | 各类无状态的业务逻辑服务 |
| 中间件（实现 `IMiddleware`） | 自定义中间件 |

最后，记住三个核心原则：**单例服务尽量无状态或线程安全**、**避免捕获 Scoped 服务**、**不要在单例中累积可变数据**。遵循这些原则，你就能在 ASP.NET Core 中游刃有余地运用单例模式，写出更健壮、更高效的代码。
