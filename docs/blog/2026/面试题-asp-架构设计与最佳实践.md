---
tags: ["aspnetcore"]
category: .NET Core
categories:
  - 面试
  - 后端开发
date: 2026-05-07T16:19:00
banner: /images/aspnetcore1.webp
title: ASP.NET Core 面试题 架构设计与最佳实践
description: 系统梳理 ASP.NET Core 大型应用架构设计、SOLID 原则、数据访问、测试策略、安全防护及工程化最佳实践，涵盖从代码组织到生产运维的全方位指南。
---

# ASP.NET Core 面试题 架构设计与最佳实践

> 写好代码是基础，设计好架构才是区分程序员与工程师的分水岭。

在 ASP.NET Core 面试的高级阶段，问题不再局限于“如何使用某个特性”，而是转向“**如何设计一个可维护、可测试、可扩展的大型系统**”。这些问题考察的是架构思维、工程化能力和对生产环境的理解。

本文将系统梳理 ASP.NET Core 应用架构设计的核心知识点，从分层架构到 SOLID 原则，从数据访问到测试策略，从安全防护到生产级最佳实践，一网打尽。

---

## 第一部分：架构设计篇

### 如何构建大型 ASP.NET Core 解决方案

大型 ASP.NET Core 解决方案需要合理的架构设计来保证**可维护性、可测试性和可扩展性**。以下是三种主流架构模式的对比：

| 架构模式 | 核心思想 | 依赖方向 | 适用场景 |
|---------|---------|---------|----------|
| **分层架构** | 按职责分层（Presentation → Application → Domain → Infrastructure） | 上层依赖下层 | 传统企业应用 |
| **整洁架构** | 业务逻辑独立于基础设施，依赖指向领域层 | 所有依赖指向 Domain | 复杂业务逻辑 |
| **洋葱架构** | 以领域核心为中心，外层依赖内层 | 外层依赖内层 | DDD 复杂领域 |

#### 分层架构（Layered Architecture）

```
┌─────────────────────────────────────────────┐
│              Presentation 层                 │  ← Controllers / Razor Pages / API
│              (API / UI)                     │
├─────────────────────────────────────────────┤
│              Application 层                  │  ← Services / Use Cases / DTOs
│           (业务逻辑与服务)                    │
├─────────────────────────────────────────────┤
│               Domain 层                     │  ← Entities / Value Objects / Interfaces
│           (领域实体与业务规则)                │
├─────────────────────────────────────────────┤
│            Infrastructure 层                │  ← DbContext / Repositories / External APIs
│        (数据访问与外部服务集成)               │
└─────────────────────────────────────────────┘
```

#### 整洁架构（Clean Architecture）

整洁架构强调**关注点分离**，所有依赖关系指向**领域层**：

```
┌─────────────────────────────────────────────────────────────┐
│                    External Interfaces                     │
│                 (Web API / UI / Console)                    │
├─────────────────────────────────────────────────────────────┤
│                    Application Layer                       │
│               (Use Cases / DTOs / Mappers)                 │
├─────────────────────────────────────────────────────────────┤
│                     Domain Layer                           │
│          (Entities / Value Objects / Interfaces)           │
└─────────────────────────────────────────────────────────────┘
                     ↑ 所有依赖指向内层
```

#### 项目结构示例

```text
MyApp.sln
├── MyApp.Domain/                    # 领域层（核心）
│   ├── Entities/
│   │   ├── Product.cs
│   │   └── Order.cs
│   ├── ValueObjects/
│   │   └── Money.cs
│   ├── Interfaces/
│   │   ├── IProductRepository.cs
│   │   └── IUnitOfWork.cs
│   └── Services/
│       └── IProductService.cs
├── MyApp.Application/               # 应用层
│   ├── UseCases/
│   │   ├── GetProductQuery.cs
│   │   └── CreateOrderCommand.cs
│   ├── DTOs/
│   │   └── ProductDto.cs
│   ├── Mappers/
│   │   └── ProductMapping.cs
│   └── Services/
│       └── ProductService.cs
├── MyApp.Infrastructure/            # 基础设施层
│   ├── Data/
│   │   ├── ApplicationDbContext.cs
│   │   └── Repositories/
│   │       └── ProductRepository.cs
│   ├── External/
│   │   └── PaymentGateway.cs
│   └── Configurations/
│       └── ServiceCollectionExtensions.cs
├── MyApp.Presentation/              # 表现层
│   ├── Controllers/
│   │   └── ProductsController.cs
│   ├── Views/
│   └── Program.cs
└── MyApp.Tests/                     # 测试项目
    ├── UnitTests/
    ├── IntegrationTests/
    └── Helpers/
```

#### 项目依赖关系

```
MyApp.Presentation
        ↓
MyApp.Application
        ↓
MyApp.Domain      ←─── MyApp.Infrastructure 依赖于 Domain
        ↑
MyApp.Infrastructure
```

**关键规则**：Infrastructure 层依赖于 Domain 层（接口），而非 Domain 依赖 Infrastructure（依赖反转）。

---

### 依赖反转与 SOLID 原则

#### 依赖反转原则（Dependency Inversion Principle）

```
❌ 传统三层：Presentation → Application → Infrastructure（具体实现）
✅ 依赖反转：Presentation → Application → Domain（接口）
              Infrastructure → Domain（接口）
```

**核心思想**：面向抽象（接口）编程，而非面向具体实现。

```csharp
// ❌ 错误：高层依赖具体实现
public class ProductService
{
    private readonly ProductRepository _repository;  // 具体类
    
    public ProductService()
    {
        _repository = new ProductRepository();  // 硬编码依赖
    }
}

// ✅ 正确：依赖抽象（接口）
public class ProductService
{
    private readonly IProductRepository _repository;  // 接口
    
    public ProductService(IProductRepository repository)
    {
        _repository = repository;
    }
}
```

#### SOLID 原则在 ASP.NET Core 中的应用

| 原则 | 定义 | ASP.NET Core 实现 |
|------|------|-------------------|
| **S** - 单一职责 | 一个类只做一件事 | Controller 只处理请求路由，Service 只处理业务逻辑，Repository 只处理数据访问 |
| **O** - 开放封闭 | 对扩展开放，对修改封闭 | 使用接口 + 依赖注入，新增功能通过新类实现而非修改现有类 |
| **L** - 里氏替换 | 子类能替代父类 | 接口实现可互换（如 `SqlRepository` → `InMemoryRepository`） |
| **I** - 接口隔离 | 小而专一的接口 | 拆分大接口（如 `IProductService` → `IProductReader` + `IProductWriter`） |
| **D** - 依赖反转 | 依赖抽象而非具体 | 构造函数注入接口，DI 容器提供具体实现 |

#### 实践示例

```csharp
// S - 单一职责：每个类只做一件事
public class ProductController : ControllerBase
{
    private readonly IProductService _productService;  // 只负责路由
    
    [HttpGet]
    public async Task<IActionResult> GetProducts()
    {
        var products = await _productService.GetAllAsync();
        return Ok(products);
    }
}

public class ProductService : IProductService  // 只负责业务逻辑
{
    private readonly IProductRepository _repository;
    
    public async Task<IEnumerable<Product>> GetAllAsync()
    {
        return await _repository.GetAllAsync();
    }
}

// O - 开放封闭：通过扩展而非修改
public interface IProductService
{
    Task<IEnumerable<Product>> GetAllAsync();
}

// 新增功能通过实现新接口扩展
public interface IProductServiceV2 : IProductService
{
    Task<IEnumerable<ProductDto>> GetAllWithDetailsAsync();
}

// D - 依赖反转：依赖接口而非实现
public class ProductService : IProductService
{
    private readonly IProductRepository _repository;
    // 构造函数注入接口，DI 容器注入具体实现
    public ProductService(IProductRepository repository)
    {
        _repository = repository;
    }
}
```

---

## 第二部分：数据访问篇

### EF Core 最佳实践

#### 1. 只读查询使用 No Tracking

```csharp
// ❌ 默认追踪（额外开销）
var products = await _context.Products
    .Where(p => p.IsActive)
    .ToListAsync();

// ✅ 只读查询使用 AsNoTracking
var products = await _context.Products
    .AsNoTracking()
    .Where(p => p.IsActive)
    .ToListAsync();

// ✅ 全局配置（DbContext 中）
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
        ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;
    }
}
```

#### 2. 谨慎使用 Lazy Loading

```csharp
// ❌ 不推荐：Lazy Loading 可能导致 N+1 问题
// 在 DbContext 配置中启用
optionsBuilder.UseLazyLoadingProxies();

// ✅ 推荐：显式加载
var product = await _context.Products
    .Include(p => p.Category)      // Eager Loading
    .FirstOrDefaultAsync(p => p.Id == id);

// 或 Explicit Loading
var product = await _context.Products.FindAsync(id);
await _context.Entry(product)
    .Collection(p => p.Reviews)
    .LoadAsync();
```

#### 3. 使用异步查询

```csharp
// ❌ 同步阻塞
public IActionResult GetProducts()
{
    var products = _context.Products.ToList();  // 阻塞
    return Ok(products);
}

// ✅ 异步非阻塞
public async Task<IActionResult> GetProducts()
{
    var products = await _context.Products.ToListAsync();
    return Ok(products);
}
```

#### 4. 数据库迁移管理

```bash
# 创建迁移
dotnet ef migrations add AddProductTable

# 更新数据库
dotnet ef database update

# 生成 SQL 脚本（审查）
dotnet ef migrations script

# 回滚到指定迁移
dotnet ef database update PreviousMigrationName
```

#### 5. 在生产环境安全地执行数据库迁移

| 实践 | 说明 |
|------|------|
| **CI/CD 自动迁移** | 在 CI/CD 流程中自动执行迁移前，先进行数据库备份 |
| **事务性迁移** | 使用 `Migration` 的事务特性（多数数据库支持） |
| **维护窗口执行** | 在低峰期执行迁移，最小化用户影响 |
| **预发布环境验证** | 在 Staging 环境完全验证后再应用到 Production |

```csharp
// Program.cs - 安全迁移
app.MigrateDatabase();  // 自定义扩展方法

public static class DatabaseExtensions
{
    public static void MigrateDatabase(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider
            .GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider
            .GetRequiredService<ILogger<Program>>();

        try
        {
            if (app.Environment.IsProduction())
            {
                // 生产环境：先备份，再迁移
                logger.LogWarning("执行生产数据库迁移 - 请确保已备份");
                dbContext.Database.Migrate();
            }
            else
            {
                dbContext.Database.Migrate();
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "数据库迁移失败");
            throw;
        }
    }
}
```

---

### 资源清理与释放

#### DbContext 生命周期管理

```csharp
// ✅ DI 容器管理 DbContext（默认 Scoped）
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

// 容器自动在每个请求结束时 Dispose
```

#### 正确释放 IDisposable 资源

```csharp
// ✅ 使用 using 语句
public async Task ProcessFileAsync(string path)
{
    using var stream = File.OpenRead(path);
    using var reader = new StreamReader(stream);
    // 处理...
    // 自动释放
}

// ✅ 使用 await using（异步释放）
await using var connection = new SqlConnection(connectionString);
await connection.OpenAsync();

// ✅ 在类中实现 IDisposable
public class MyService : IDisposable
{
    private readonly HttpClient _client;
    private bool _disposed;

    public MyService(HttpClient client)
    {
        _client = client;
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;
        if (disposing)
        {
            _client?.Dispose();
        }
        _disposed = true;
    }
}
```

#### 常见泄漏场景及解决

| 泄漏源 | 解决方案 |
|--------|----------|
| 静态事件订阅 | 在 Dispose 中取消订阅 |
| 静态集合持有对象 | 使用弱引用或限制静态集合 |
| 未释放的 HttpClient | 使用 `IHttpClientFactory` |
| Singleton 引用 Scoped 服务 | 避免 Singleton 注入 Scoped |

---

## 第三部分：测试篇

### 可测试性设计

#### 设计原则

| 原则 | 说明 | 实践 |
|------|------|------|
| **依赖注入** | 依赖通过接口注入 | 构造函数注入，DI 容器管理 |
| **接口隔离** | 使用小而专一的接口 | `IProductReader` + `IProductWriter` |
| **避免静态方法** | 静态方法难以 Mock | 使用实例方法 + 接口 |
| **关注点分离** | 业务逻辑与基础设施分离 | Application 层不依赖 Infrastructure |

#### 单元测试（Unit Test）

```csharp
using Moq;

public class ProductServiceTests
{
    [Fact]
    public async Task GetProduct_ValidId_ReturnsProduct()
    {
        // Arrange
        var expectedProduct = new Product { Id = 1, Name = "Test Product" };
        
        var mockRepo = new Mock<IProductRepository>();
        mockRepo.Setup(r => r.GetByIdAsync(1))
            .ReturnsAsync(expectedProduct);
        
        var service = new ProductService(mockRepo.Object);
        
        // Act
        var result = await service.GetProductAsync(1);
        
        // Assert
        Assert.NotNull(result);
        Assert.Equal(expectedProduct.Name, result.Name);
        mockRepo.Verify(r => r.GetByIdAsync(1), Times.Once);
    }
}
```

#### 集成测试（Integration Test）

```csharp
public class ProductsApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ProductsApiTests(WebApplicationFactory<Program> factory)
    {
        // 使用 InMemory 或 Testcontainers
        _client = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // 替换为测试数据库
                services.RemoveAll<DbContextOptions<AppDbContext>>();
                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase("TestDb"));
            });
        }).CreateClient();
    }

    [Fact]
    public async Task GetProducts_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/products");
        response.EnsureSuccessStatusCode();
        
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("Product", content);
    }
}
```

#### 测试策略

| 测试类型 | 目标 | 工具 | 环境 |
|---------|------|------|------|
| **单元测试** | 验证业务逻辑 | xUnit + Moq | 内存，无外部依赖 |
| **集成测试** | 验证系统集成 | WebApplicationFactory | InMemory DB / Testcontainers |
| **端到端测试** | 验证完整流程 | Playwright / Selenium | 真实环境 |
| **性能测试** | 验证性能指标 | k6 / JMeter | 预发布环境 |

---

## 第四部分：可观测性篇

### 日志、追踪与异常报告

#### 三者的区别与联系

| 概念 | 说明 | 用途 |
|------|------|------|
| **Logging（日志）** | 记录应用事件和状态信息 | 日常监控、问题定位 |
| **Tracing（追踪）** | 追踪请求在系统中的执行路径 | 跨服务问题诊断、性能分析 |
| **Exception Reporting** | 捕获异常并告警 | 快速发现和响应错误 |

#### 结构化日志 + 分布式追踪

```csharp
// 结构化日志
_logger.LogInformation(
    "用户 {UserId} 在 {Timestamp} 创建了订单 {OrderId}，金额 {Amount}",
    userId, DateTime.UtcNow, orderId, amount);

// 分布式追踪（OpenTelemetry）
builder.Services.AddOpenTelemetry()
    .WithTracing(tracer => tracer
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddSqlClientInstrumentation()
        .AddJaegerExporter());
```

#### 异常报告

```csharp
// 全局异常处理 + 报告
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var feature = context.Features.Get<IExceptionHandlerFeature>();
        var ex = feature?.Error;
        
        // 记录到日志
        var logger = context.RequestServices
            .GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "未处理的异常：{Path}", context.Request.Path);
        
        // 发送到异常报告服务
        var exceptionReporter = context.RequestServices
            .GetRequiredService<IExceptionReporter>();
        await exceptionReporter.ReportAsync(ex, context);
        
        // 返回友好错误
        context.Response.StatusCode = 500;
        await context.Response.WriteAsJsonAsync(new
        {
            Message = "服务器发生错误，请稍后重试",
            TraceId = context.TraceIdentifier
        });
    });
});
```

---

## 第五部分：安全与可靠性篇

### 限流与节流策略（Rate Limiting / Throttling）

#### .NET 8+ 内置限流

```csharp
builder.Services.AddRateLimiter(options =>
{
    // 固定窗口
    options.AddFixedWindowLimiter("fixed", opt =>
    {
        opt.PermitLimit = 100;
        opt.Window = TimeSpan.FromMinutes(1);
    });
    
    // 滑动窗口
    options.AddSlidingWindowLimiter("sliding", opt =>
    {
        opt.PermitLimit = 60;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.SegmentsPerWindow = 6;
    });
    
    // 令牌桶（允许突发）
    options.AddTokenBucketLimiter("token", opt =>
    {
        opt.TokenLimit = 100;
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 10;
        opt.ReplenishmentPeriod = TimeSpan.FromSeconds(10);
        opt.TokensPerPeriod = 20;
    });
    
    // 并发限制
    options.AddConcurrencyLimiter("concurrency", opt =>
    {
        opt.PermitLimit = 10;
    });
});

app.UseRateLimiter();

// 在端点使用
[HttpGet]
[EnableRateLimiting("fixed")]
public IActionResult GetProducts() { ... }

[HttpPost]
[DisableRateLimiting]
public IActionResult AdminAction() { ... }
```

#### 基于 IP 或用户的限流

```csharp
// 基于用户 ID 限流
options.AddPolicy("user", context =>
    RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: context.User.Identity?.Name ?? "anonymous",
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromSeconds(10)
        }));
```

### 异常与错误处理模式

#### 全局异常处理策略

```csharp
app.UseExceptionHandler();  // 捕获并处理异常

// 自定义异常处理
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (BusinessException ex)
    {
        context.Response.StatusCode = 400;
        await context.Response.WriteAsJsonAsync(new
        {
            Code = ex.ErrorCode,
            Message = ex.Message
        });
    }
    catch (NotFoundException ex)
    {
        context.Response.StatusCode = 404;
        await context.Response.WriteAsJsonAsync(new
        {
            Message = ex.Message
        });
    }
});
```

#### 重试策略（Polly）

```bash
dotnet add package Polly
dotnet add package Microsoft.Extensions.Http.Polly
```

```csharp
builder.Services.AddHttpClient<ExternalApiService>(client =>
{
    client.BaseAddress = new Uri("https://api.example.com");
})
.AddTransientHttpErrorPolicy(policy =>
    policy.WaitAndRetryAsync(
        3,  // 重试次数
        retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),  // 指数退避
        onRetry: (outcome, timespan, retryCount, context) =>
        {
            _logger.LogWarning("重试 {RetryCount} 次，等待 {Delay}ms", 
                retryCount, timespan.TotalMilliseconds);
        }));
```

### 优雅关闭（Graceful Shutdown）

#### 配置优雅关闭

```csharp
// .NET 6+ 默认支持，可自定义
builder.Services.Configure<HostOptions>(options =>
{
    options.ShutdownTimeout = TimeSpan.FromSeconds(30);  // 等待时间
});

// 监听关闭事件
public class MyHostedService : BackgroundService
{
    private readonly IHostApplicationLifetime _lifetime;
    private readonly ILogger<MyHostedService> _logger;

    public MyHostedService(IHostApplicationLifetime lifetime, ILogger<MyHostedService> logger)
    {
        _lifetime = lifetime;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _lifetime.ApplicationStarted.Register(() =>
            _logger.LogInformation("应用已启动"));
        
        _lifetime.ApplicationStopping.Register(() =>
            _logger.LogInformation("应用正在停止..."));
        
        _lifetime.ApplicationStopped.Register(() =>
            _logger.LogInformation("应用已停止"));
        
        // 执行后台任务...
    }
}
```

#### Kubernetes 优雅关闭

```yaml
# Kubernetes deployment.yaml
spec:
  template:
    spec:
      containers:
      - name: myapp
        # Kubernetes 会先发送 SIGTERM，等待 terminationGracePeriodSeconds
        terminationGracePeriodSeconds: 30
        lifecycle:
          preStop:
            exec:
              command: ["sh", "-c", "sleep 5"]  # 等待负载均衡器更新
```

### 安全地管理机密信息（Secrets）

#### 开发环境：User Secrets

```bash
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:Default" "Server=localhost;..."
dotnet user-secrets set "ApiKey" "your-secret-key"
```

#### 生产环境：Azure Key Vault

```csharp
builder.Configuration.AddAzureKeyVault(
    new Uri(builder.Configuration["KeyVaultUri"]),
    new DefaultAzureCredential());
```

#### 安全原则

| 原则 | 说明 |
|------|------|
| **不在代码中存储** | 不将密钥写入代码或配置文件 |
| **使用托管身份** | Azure 应用使用 Managed Identity 访问 Key Vault |
| **最小权限** | 只授予必要的密钥访问权限 |
| **定期轮换** | 定期更换密钥 |

---

### 国际化与本地化（I18N / L10N）

#### 配置本地化

```csharp
builder.Services.AddLocalization(options =>
    options.ResourcesPath = "Resources");

builder.Services.AddControllersWithViews()
    .AddViewLocalization(LanguageViewLocationExpanderFormat.Suffix)
    .AddDataAnnotationsLocalization();

var supportedCultures = new[] { "zh-CN", "en-US", "ja-JP" };
app.UseRequestLocalization(new RequestLocalizationOptions
{
    DefaultRequestCulture = new RequestCulture("zh-CN"),
    SupportedCultures = supportedCultures,
    SupportedUICultures = supportedCultures
});
```

#### 资源文件

```text
Resources/
├── Views/
│   └── Home/
│       ├── Index.zh-CN.resx
│       └── Index.en-US.resx
└── Controllers/
    ├── HomeController.zh-CN.resx
    └── HomeController.en-US.resx
```

#### 在代码中使用

```csharp
// 控制器
public class HomeController : Controller
{
    private readonly IStringLocalizer<HomeController> _localizer;

    public HomeController(IStringLocalizer<HomeController> localizer)
    {
        _localizer = localizer;
    }

    public IActionResult Index()
    {
        ViewBag.Message = _localizer["WelcomeMessage"];
        return View();
    }
}

// 视图
@using Microsoft.AspNetCore.Mvc.Localization
@inject IViewLocalizer Localizer

<h1>@Localizer["Title"]</h1>
```

---

### 输入验证与安全漏洞防护

#### 防护策略

| 攻击类型 | 防护措施 |
|---------|----------|
| **SQL 注入** | 参数化查询 / ORM（EF Core） |
| **XSS 跨站脚本** | 输入清理 + 输出编码（Razor 默认编码） |
| **CSRF 跨站请求伪造** | `[ValidateAntiForgeryToken]` + SameSite Cookie |
| **信息泄露** | 不在错误页暴露堆栈信息 |
| **文件上传攻击** | 白名单扩展名 + 随机文件名 + 大小限制 |
| **SQL 注入防护** | 使用参数化查询或 ORM |

#### 验证示例

```csharp
public class Product
{
    [Required]
    [StringLength(100, MinimumLength = 3)]
    public string Name { get; set; }
    
    [Range(0.01, 999999.99)]
    public decimal Price { get; set; }
    
    [RegularExpression(@"^[A-Z]{2}-\d{4}$")]
    public string Code { get; set; }
    
    [Url]
    public string ImageUrl { get; set; }
}
```

---

### 在 CI/CD 中使用配置与环境变量

#### 多环境配置

```text
appsettings.json            # 基础配置
appsettings.Development.json # 开发环境
appsettings.Staging.json    # 预发布环境
appsettings.Production.json # 生产环境
```

#### CI/CD 配置注入

```yaml
# GitHub Actions
- name: Deploy to Azure
  run: dotnet publish -c Release -o ./publish
  env:
    ASPNETCORE_ENVIRONMENT: Production
    ConnectionStrings__Default: ${{ secrets.DB_CONNECTION }}
    ApiKey: ${{ secrets.API_KEY }}
```

---

## 第六部分：面试避坑清单

| 序号 | ❌ 常见错误 | ✅ 正确理解 |
|------|-----------|-----------|
| 1 | 所有代码写在一个项目中 | 按职责分层，使用多项目组织 |
| 2 | 领域层依赖基础设施层 | 依赖反转：基础设施依赖领域层 |
| 3 | 只写单元测试，忽略集成测试 | 两者互补，确保代码正确性和系统整体行为 |
| 4 | 生产环境使用 Lazy Loading | 显式加载或 Eager Loading，避免 N+1 问题 |
| 5 | 直接在生产环境执行迁移 | 先在 Staging 验证，备份后再执行 |
| 6 | 不使用限流保护 API | 生产 API 必须配置限流 |
| 7 | 敏感信息存储在配置文件中 | 使用 User Secrets / Key Vault / 环境变量 |
| 8 | 异常信息直接返回给客户端 | 统一错误处理，避免暴露内部信息 |
| 9 | 忽略优雅关闭 | 确保请求完成、资源释放 |
| 10 | 不进行本地化和国际化 | 多语言支持从设计初期考虑 |

---

## 小结

ASP.NET Core 大型应用架构设计涉及多个方面：

- **架构设计**：分层架构、整洁架构、洋葱架构，核心原则是依赖反转
- **SOLID 原则**：单一职责、开放封闭、里氏替换、接口隔离、依赖反转
- **数据访问**：EF Core 最佳实践（No Tracking、显式加载、异步查询、迁移管理）
- **测试策略**：单元测试 + 集成测试，依赖注入提高可测试性
- **可观测性**：日志 + 追踪 + 异常报告，结构化日志和分布式追踪
- **安全与可靠性**：限流、异常处理、优雅关闭、机密管理、国际化

回顾全文，记住三个核心原则：

1. **依赖反转是架构设计的核心**：所有依赖指向领域层（Domain）
2. **测试是质量的保证**：单元测试验证逻辑，集成测试验证系统
3. **安全是底线**：输入验证、机密管理、限流、异常处理，缺一不可
