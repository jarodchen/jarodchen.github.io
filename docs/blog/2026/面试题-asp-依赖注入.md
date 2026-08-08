---
tags: ["aspnetcore"]
category: .NET Core
categories:
  - 面试
 
date: 2026-05-07T16:19:00
banner: /images/aspnetcore1.webp
title: ASP.NET Core 面试题 -  依赖注入
description: 系统梳理 ASP.NET Core 依赖注入的核心知识点，从生命周期到高级用法，涵盖常见陷阱、Options 模式、后台任务及单元测试。
---

# ASP.NET Core 面试题 -  依赖注入

> 理解依赖注入，就是理解 ASP.NET Core 应用程序的“血管”如何运作。

几乎每个 ASP.NET Core 面试都会问到依赖注入（DI）。它不仅是框架的底层基础设施，更是实现松耦合、可测试代码的关键。本文将系统性地梳理 ASP.NET Core DI 的方方面面，从基础概念到面试高频陷阱，一网打尽。

---

## 第一部分：认知篇（必答送分题）

### 什么是依赖注入？为什么要使用？

#### 定义

**依赖注入（Dependency Injection, DI）** 是一种设计模式，核心思想是：**将类所依赖的对象（服务/依赖项）通过外部传递（注入）给它，而不是在类内部自行创建。**

用一句通俗的话概括：**“别找我要，我给你。”** 类不再主动去 `new` 依赖对象，而是被动接收已经创建好的实例。

#### 对比：不采用 DI vs 采用 DI

**❌ 不采用 DI（紧耦合）**

```csharp
public class OrderService
{
    private readonly EmailSender _emailSender = new EmailSender(); // 直接 new
    
    public void ProcessOrder()
    {
        _emailSender.Send("订单已处理");
    }
}
```

问题：`OrderService` 与 `EmailSender` 强耦合，更换邮件实现时需修改 `OrderService` 代码，难以单元测试。

**✅ 采用 DI（松耦合）**

```csharp
public class OrderService
{
    private readonly IEmailSender _emailSender; // 依赖接口
    
    public OrderService(IEmailSender emailSender) // 依赖从外部注入
    {
        _emailSender = emailSender;
    }
}
```

#### 三大优点

| 优点        | 说明                                 |
| --------- | ---------------------------------- |
| **松耦合**   | 类依赖于抽象（接口），而非具体实现，更换实现无需修改类本身      |
| **可测试性**  | 单元测试时可注入 Mock/Stub 替换真实依赖，隔离测试目标逻辑 |
| **关注点分离** | 对象的创建和管理由 DI 容器负责，业务类专注自身职责        |

> 💡 **面试金句**
>
> “DI 让我的类依赖于抽象而非具体实现，从而实现了松耦合。在单元测试中，我可以轻松注入 Mock 对象来隔离测试，同时对象的生命周期由容器统一管理，避免了手动管理依赖的混乱。”

---

## 第二部分：生命周期篇（核心考点）

### 三种服务生命周期

ASP.NET Core 内置 DI 容器提供三种生命周期，理解它们的差异是面试中的核心考点：

| 生命周期              | 实例创建时机                      | 生命周期长度 | 适用场景                         |
| ----------------- | --------------------------- | ------ | ---------------------------- |
| **Transient（瞬态）** | 每次请求解析都创建新实例                | 最短     | 轻量级、无状态服务                    |
| **Scoped（作用域）**   | 每个作用域（通常是一个 HTTP 请求）内共享一个实例 | 每个请求一个 | DbContext、工作单元（Unit of Work） |
| **Singleton（单例）** | 首次请求时创建，之后复用                | 应用生命周期 | 配置、日志、缓存服务                   |

#### 代码示例

```csharp
// 在 Program.cs / ConfigureServices 中注册
builder.Services.AddTransient<ITransientService, TransientService>();
builder.Services.AddScoped<IScopedService, ScopedService>();
builder.Services.AddSingleton<ISingletonService, SingletonService>();
```

#### 🚨 致命陷阱：Singleton 引用 Scoped

```csharp
public class BadService
{
    private readonly MyDbContext _dbContext; // ❌ 危险！

    public BadService(MyDbContext dbContext) // Singleton 注入 Scoped
    {
        _dbContext = dbContext;
    }
}
```

**报错信息：**

> `System.InvalidOperationException: Cannot resolve scoped service 'MyDbContext' from root provider.`

**原因**：Singleton 由根容器创建，根容器中没有 Scoped 服务的实例。Scoped 服务由每个请求的子容器提供。

**解决方法**：

1. 将 Scoped 服务的获取延迟到方法调用时（通过 `IServiceProvider` 或工厂）
2. 使用 `IServiceScopeFactory` 创建子作用域（适合后台任务）
3. 将服务注册改为 Scoped（如果业务允许）

---

## 第三部分：核心用法篇（常规操作）

### 如何注册服务？

在 `Program.cs`（.NET 6+）或 `ConfigureServices`（旧版）中注册：

```csharp
var builder = WebApplication.CreateBuilder(args);

// 注册服务
builder.Services.AddTransient<IMyService, MyService>();   // 瞬态
builder.Services.AddScoped<IRepository, Repository>();   // 作用域
builder.Services.AddSingleton<ILoggerService, LoggerService>(); // 单例

// 注册泛型
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

var app = builder.Build();
```

#### 注册方式速查表

| 注册方式    | 代码示例                                                              | 说明         |
| ------- | ----------------------------------------------------------------- | ---------- |
| 接口 + 实现 | `services.AddScoped<IUserService, UserService>()`                 | 最常用        |
| 仅实现类    | `services.AddScoped<UserService>()`                               | 无需接口时使用    |
| 工厂模式    | `services.AddScoped(provider => new UserService(config))`         | 需要额外逻辑创建实例 |
| 开放泛型    | `services.AddScoped(typeof(IRepository<>), typeof(Repository<>))` | 泛型类型映射     |

---

### 在控制器、Razor Pages、中间件中解析依赖

| 组件 | 注入方式 | 注意事项 |
|------|---------|----------|
| **控制器** | 构造函数注入（推荐） | 最常用，ASP.NET Core 原生支持 |
| **Razor Pages** | PageModel 构造函数注入 | 与控制器类似 |
| **视图** | `@inject` 指令 | 适用于视图层，但尽量少用 |
| **中间件（约定类）** | 构造函数注入（Singleton/Transient） + `InvokeAsync` 参数注入（Scoped） | Scoped 必须在方法参数中注入 |
| **中间件（IMiddleware）** | 构造函数注入（所有生命周期） | 需先注册为 Scoped/Transient 服务 |

**中间件注入示例：**

```csharp
public class CustomMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<CustomMiddleware> _logger; // ✅ Singleton/Transient

    public CustomMiddleware(RequestDelegate next, ILogger<CustomMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, MyDbContext dbContext) // ✅ Scoped 放这里
    {
        _logger.LogInformation("请求开始");
        await _next(context);
    }
}
```

---

### 构造函数注入 vs 属性注入

| 对比维度 | 构造函数注入 | 属性注入 |
|---------|------------|---------|
| **ASP.NET Core 原生支持** | ✅ 是 | ❌ 不直接支持 |
| **依赖是否明确** | ✅ 类所需依赖一目了然 | ❌ 依赖隐藏，不易发现 |
| **依赖是否可变** | ✅ 不可变（readonly） | ❌ 可被外部修改 |
| **可测试性** | ✅ 创建对象时必须传入所有依赖，强制完整初始化 | ⚠️ 需要额外设置属性值 |
| **适用场景** | **官方推荐，绝大多数场景** | 特定情况（如可选依赖） |

> **结论**：优先使用构造函数注入，这是 ASP.NET Core 官方推荐的最佳实践。

---

### 使用 IServiceProvider 手动解析

在极少数场景下需要手动从容器中解析服务：

```csharp
public class MyService
{
    private readonly IServiceProvider _serviceProvider;
    
    public MyService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }
    
    public void DoWork()
    {
        // 手动解析服务
        var service = _serviceProvider.GetRequiredService<IMyService>();
        // 或使用 GetService（不存在时返回 null）
        var optional = _serviceProvider.GetService<IOptionalService>();
    }
}
```

**⚠️ 注意**：手动解析通常视为**反模式**，应尽量通过构造函数注入替代。仅在无法使用构造函数注入时（如动态解析、运行时条件选择）使用。

---

## 第四部分：进阶篇（拉开差距）

### 使用 IServiceScopeFactory 创建作用域

在**后台任务**、**定时任务**或**没有 HTTP 请求上下文**的场景中，无法直接使用 Scoped 服务。此时需要通过 `IServiceScopeFactory` 手动创建作用域：

```csharp
public class BackgroundTask : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    
    public BackgroundTask(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }
    
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            // 手动创建作用域
            using (var scope = _scopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<MyDbContext>();
                // 使用 dbContext 执行数据库操作
            }
            
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }
}
```

---

### Options 模式：IOptions / IOptionsSnapshot / IOptionsMonitor

Options 模式用于将配置绑定为强类型对象，三种接口的生命周期和行为各不相同：

| 接口 | 生命周期 | 配置读取时机 | 支持热更新 | 适用场景 |
|------|---------|------------|-----------|---------|
| `IOptions<T>` | Singleton | 应用启动时读取一次 | ❌ 不支持 | 配置在应用生命周期内不变 |
| `IOptionsSnapshot<T>` | Scoped | **每个请求**重新读取 | ✅ 支持（每次请求） | Web 应用中需要按请求获取最新配置 |
| `IOptionsMonitor<T>` | Singleton | 首次访问时读取，可监听变更 | ✅ 支持（变更时回调） | 后台服务、长生命周期组件需要响应配置变化 |

**代码示例：**

```csharp
// 1. 注册配置
builder.Services.Configure<MySettings>(builder.Configuration.GetSection("MySettings"));

// 2. 使用方式
public class MyService
{
    private readonly IOptions<MySettings> _options;          // 固定值
    private readonly IOptionsSnapshot<MySettings> _snapshot; // 每次请求重新读取
    private readonly IOptionsMonitor<MySettings> _monitor;   // 可监听变化
    
    public MyService(
        IOptions<MySettings> options,
        IOptionsSnapshot<MySettings> snapshot,
        IOptionsMonitor<MySettings> monitor)
    {
        _options = options;
        _snapshot = snapshot;
        _monitor = monitor;
        
        // IOptionsMonitor 可以注册变更回调
        _monitor.OnChange(newSettings => 
        {
            Console.WriteLine($"配置已更新：{newSettings.Key}");
        });
    }
}
```

#### 🚨 面试高频陷阱

| 错误做法 | 正确做法 | 原因 |
|---------|---------|------|
| 在 Singleton 中使用 `IOptionsSnapshot<T>` | 使用 `IOptions<T>` 或 `IOptionsMonitor<T>` | `IOptionsSnapshot` 是 Scoped，Singleton 构造时无法解析 |
| 期望 `IOptions<T>` 支持热更新 | 使用 `IOptionsSnapshot` 或 `IOptionsMonitor` | `IOptions` 只在启动时读取一次 |
| 在后台任务中使用 `IOptionsSnapshot` | 使用 `IOptionsMonitor` 或 `IOptions` + 手动刷新 | 后台任务无 HTTP 请求上下文 |

> 💡 **面试金句**
>
> “我会根据服务的生命周期选择 Options 接口：Singleton 服务用 `IOptionsMonitor<T>` 支持热更新；Scoped 服务用 `IOptionsSnapshot<T>` 按请求获取最新值；如果配置在应用启动后不再变化，直接用 `IOptions<T>` 即可。”

---

### 注入 IConfiguration 和 ILogger

#### IConfiguration

`IConfiguration` 已在 ASP.NET Core 中自动注册，可直接注入：

```csharp
public class MyService
{
    private readonly IConfiguration _config;
    private readonly string _apiKey;
    
    public MyService(IConfiguration config)
    {
        _config = config;
        _apiKey = config["ApiKey"]; // 直接读取
        // 或读取特定节
        var dbConfig = config.GetSection("Database").Get<DatabaseOptions>();
    }
}
```

#### ILogger

内置日志框架支持结构化日志，通过 `ILogger<T>` 注入：

```csharp
public class OrderService
{
    private readonly ILogger<OrderService> _logger;
    
    public OrderService(ILogger<OrderService> logger)
    {
        _logger = logger;
    }
    
    public void ProcessOrder(Order order)
    {
        _logger.LogInformation("处理订单 {OrderId}，金额 {Amount}", order.Id, order.Amount);
        // 使用结构化日志（占位符用大括号）
    }
}
```

---

### 处理循环依赖

#### 什么是循环依赖？

当两个或多个服务直接或间接相互引用时，产生循环依赖：

```
ServiceA → ServiceB
ServiceB → ServiceA  （直接循环）

或

ServiceA → ServiceB → ServiceC → ServiceA（间接循环）
```

#### ASP.NET Core 容器的行为

ASP.NET Core 内置容器在检测到循环依赖时，会抛出 `InvalidOperationException`，而不是无限递归。

#### 解决方法

**方法一：重构代码（推荐）**

将相互依赖的逻辑抽取到第三个服务中：

```csharp
// 重构前：循环依赖
public class OrderService { public OrderService(IUserService userService) {} }
public class UserService { public UserService(IOrderService orderService) {} }

// 重构后：引入协调层
public interface IOrderCoordinator { /* 协调逻辑 */ }
public class OrderCoordinator : IOrderCoordinator { /* 注入两者，打破循环 */ }
```

**方法二：使用 `Lazy<T>` 延迟注入**

```csharp
public class ServiceA
{
    private readonly Lazy<IServiceB> _serviceB;
    
    public ServiceA(Lazy<IServiceB> serviceB) // 使用时才解析
    {
        _serviceB = serviceB;
    }
    
    public void DoWork()
    {
        _serviceB.Value.Process(); // 此时才真正解析 ServiceB
    }
}
```

**方法三：使用工厂模式**

```csharp
public interface IServiceBFactory
{
    IServiceB Create();
}

public class ServiceA
{
    private readonly IServiceBFactory _factory;
    
    public ServiceA(IServiceBFactory factory)
    {
        _factory = factory;
    }
    
    public void DoWork()
    {
        var serviceB = _factory.Create();
        serviceB.Process();
    }
}
```

> **最佳实践**：优先考虑重构设计消除循环依赖，`Lazy<T>` 和工厂模式是临时解决方案，不应成为常规做法。

---

### 覆盖默认 DI 行为（移除/替换服务）

#### 替换已注册的服务

```csharp
// 先移除原有注册
var descriptor = services.FirstOrDefault(x => x.ServiceType == typeof(IMyService));
if (descriptor != null)
{
    services.Remove(descriptor);
}
// 再注册新实现
services.AddSingleton<IMyService, NewImplementation>();
```

或使用 `Replace` 扩展方法：

```csharp
services.Replace(ServiceDescriptor.Singleton<IMyService, NewImplementation>());
```

#### 清除所有注册（移除所有实现）

```csharp
var descriptors = services.Where(x => x.ServiceType == typeof(IMyService)).ToList();
foreach (var descriptor in descriptors)
{
    services.Remove(descriptor);
}
```

---

## 第五部分：高级场景与避坑指南

### 作用域服务在后台任务中的行为

**问题**：后台任务（如 `BackgroundService`）没有 HTTP 请求上下文，无法直接注入 Scoped 服务。

**错误做法**：

```csharp
public class MyBackgroundService : BackgroundService
{
    private readonly MyDbContext _dbContext; // ❌ 编译通过，但运行时可能报错或行为异常

    public MyBackgroundService(MyDbContext dbContext)
    {
        _dbContext = dbContext;
    }
}
```

**正确做法**：使用 `IServiceScopeFactory` 手动创建作用域：

```csharp
public class MyBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<MyBackgroundService> _logger;

    public MyBackgroundService(IServiceScopeFactory scopeFactory, ILogger<MyBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<MyDbContext>();
                // 执行数据库操作
                await dbContext.ProcessPendingOrdersAsync();
            }
            
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }
}
```

---

### IHostedService / BackgroundService 与 DI

| 场景 | 注入方式 | 注意事项 |
|------|---------|----------|
| **Singleton/Transient 服务** | 构造函数直接注入 | ✅ 安全可用 |
| **Scoped 服务** | 通过 `IServiceScopeFactory` 创建作用域 | ⚠️ 必须手动管理作用域生命周期 |
| **IOptionsSnapshot** | 不适用 | 无请求上下文，用 `IOptionsMonitor` 替代 |

```csharp
public class MyHostedService : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IOptionsMonitor<MyOptions> _options; // ✅ 用 Monitor
    
    public MyHostedService(IServiceScopeFactory scopeFactory, IOptionsMonitor<MyOptions> options)
    {
        _scopeFactory = scopeFactory;
        _options = options;
    }
    
    // 需要 Scoped 服务时创建作用域
}
```

---

### 在单元测试中模拟依赖

使用 Mock 框架（如 Moq）模拟依赖，隔离测试目标：

```csharp
[Test]
public void ProcessOrder_Should_SendEmail()
{
    // Arrange：创建 Mock
    var mockSender = new Mock<IEmailSender>();
    mockSender.Setup(s => s.Send(It.IsAny<string>())).Returns(true);
    
    var mockLogger = new Mock<ILogger<OrderService>>();
    
    // Act：注入 Mock 依赖
    var service = new OrderService(mockSender.Object, mockLogger.Object);
    var result = service.ProcessOrder(new Order { Id = 1 });
    
    // Assert：验证行为
    mockSender.Verify(s => s.Send(It.IsAny<string>()), Times.Once);
    Assert.IsTrue(result);
}
```

**优点**：
- 隔离测试目标，不依赖真实外部服务
- 可验证特定行为（如方法被调用次数、参数是否符合预期）
- 快速执行，无需数据库、网络等基础设施

---

### .NET 8 新特性：Keyed Services（键控服务）

在 .NET 8 之前，ASP.NET Core 内置 DI 容器**不支持命名注册**（即根据名称区分不同的实现），这是它相对于 Autofac 等第三方容器的明显短板。

.NET 8 引入了 **Keyed Services（键控服务）**，解决了这一痛点。

#### 注册键控服务

```csharp
builder.Services.AddKeyedScoped<IPaymentService, AlipayService>("alipay");
builder.Services.AddKeyedScoped<IPaymentService, WechatPayService>("wechat");
builder.Services.AddKeyedScoped<IPaymentService, CreditCardService>("creditcard");
```

#### 使用键控服务

**在构造函数中注入**：

```csharp
public class PaymentController : ControllerBase
{
    private readonly IServiceProvider _serviceProvider;
    
    public PaymentController(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }
    
    [HttpPost("{type}")]
    public IActionResult Pay(string type, decimal amount)
    {
        // 根据传入的类型动态获取对应实现
        var paymentService = _serviceProvider.GetRequiredKeyedService<IPaymentService>(type);
        var result = paymentService.Pay(amount);
        return Ok(result);
    }
}
```

**使用 `[FromKeyedServices]` 特性（更简洁）**：

```csharp
public class PaymentController : ControllerBase
{
    [HttpPost("{type}")]
    public IActionResult Pay(
        [FromKeyedServices("alipay")] IPaymentService alipay,
        [FromKeyedServices("wechat")] IPaymentService wechat,
        string type, 
        decimal amount)
    {
        var service = type switch
        {
            "alipay" => alipay,
            "wechat" => wechat,
            _ => throw new ArgumentException("不支持的支付方式")
        };
        
        return Ok(service.Pay(amount));
    }
}
```

> 💡 **面试加分点**
>
> “在 .NET 8 之前，如果需要根据名称区分不同实现，我通常会用工厂模式或第三方容器（如 Autofac）。.NET 8 引入 Keyed Services 后，内置 DI 容器已能原生支持这个场景，不再需要引入额外的依赖。”

---

## 第六部分：面试避坑清单

| 序号 | ❌ 错误理解 | ✅ 正确理解 |
|------|-----------|-----------|
| 1 | 中间件构造函数可以直接注入 DbContext | Scoped 服务必须在 `InvokeAsync` 参数中注入 |
| 2 | `IOptionsSnapshot` 是 Singleton | 它是 **Scoped**，每次请求重新计算 |
| 3 | 所有服务都推荐用 Singleton | 应根据服务的状态和使用场景选择合适的生命周期 |
| 4 | 可以在任意地方用 `new` 创建服务实例 | 应统一由 DI 容器管理，避免生命周期混乱 |
| 5 | 属性注入是 ASP.NET Core 原生支持的功能 | 内置容器不直接支持，需第三方容器或手工实现 |
| 6 | Singleton 可以自由引用 Scoped | **Singleton 不能引用 Scoped**，根容器无法解析 |
| 7 | 后台任务可以直接注入 Scoped 服务 | 需通过 `IServiceScopeFactory` 手动创建作用域 |
| 8 | `IConfiguration` 需要手动注册 | 已自动注册，可直接注入 |
| 9 | 内置 DI 支持命名注册 | .NET 8 之前不支持，.NET 8 后通过 Keyed Services 支持 |
| 10 | 循环依赖在运行时会被自动解决 | ASP.NET Core 容器会抛出 `InvalidOperationException` |

---

## 小结

依赖注入是 ASP.NET Core 的核心基础设施。掌握它，不仅是通过面试的关键，更是写出高质量、可维护代码的基础。

回顾全文，记住三个核心原则：

1. **生命周期匹配是底线**：Singleton 不能引用 Scoped，这是最常见的运行时错误来源。
2. **构造函数注入是首选**：明确、不可变、易测试，官方推荐。
3. **选择合适的 Options 接口**：`IOptions`（固定）、`IOptionsSnapshot`（按请求）、`IOptionsMonitor`（可监听变化），根据场景选择。

如果本文对你有帮助，欢迎收藏或分享给需要的朋友。如有任何疑问或补充，欢迎在评论区留言讨论。