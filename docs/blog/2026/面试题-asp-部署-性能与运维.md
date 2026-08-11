---
tags: ["aspnetcore"]
category: .NET Core
categories:
  - 面试
  - 后端开发
date: 2026-05-07T16:19:00
banner: /images/aspnetcore1.webp
title: ASP.NET Core 面试题 部署、性能与运维
description: 系统梳理 ASP.NET Core 应用中部署、性能优化、监控、安全及高级特性的核心知识点，涵盖托管模型、健康检查、缓存、分布式追踪、SignalR 及后台任务等。
---

# ASP.NET Core 面试题 部署、性能与运维

> 写好代码只是第一步——如何部署、如何调优、如何监控，才是生产环境真正的考验。

在 ASP.NET Core 面试中，**部署、性能优化和运维**相关的问题是**区分中级和高级开发者的分水岭**。这些问题考察的不仅是框架知识，更是对生产环境的理解：应用如何运行、如何应对高并发、如何快速定位问题。

本文将系统梳理部署、性能、监控、安全及高级特性的核心知识点，从托管模型到生产级最佳实践，一网打尽。

---

## 第一部分：托管与部署篇

### 托管：Kestrel、IIS、反向代理

#### Kestrel：ASP.NET Core 的 Web 服务器

**Kestrel** 是 ASP.NET Core 的**默认跨平台 Web 服务器**，基于 `libuv`（.NET Core 1.x-2.x）或托管套接字（.NET Core 3.0+），具有以下特点：

| 特性 | 说明 |
|------|------|
| **跨平台** | 支持 Windows、Linux、macOS |
| **轻量快速** | 专为 ASP.NET Core 优化，性能卓越 |
| **支持 TLS** | 原生支持 HTTPS |
| **可独立运行** | 可直接暴露给互联网（但生产环境推荐反向代理） |

**Kestrel 独立运行**：

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();
app.MapGet("/", () => "Hello Kestrel!");
app.Run();  // 默认监听 http://localhost:5000
```

#### 反向代理场景

生产环境通常将 Kestrel 放在**反向代理**之后，原因如下：

| 优势 | 说明 |
|------|------|
| **安全性** | 代理层处理 SSL 终止、请求过滤 |
| **负载均衡** | 可将请求分发到多个 Kestrel 实例 |
| **静态文件服务** | 代理层（如 Nginx）可高效提供静态文件 |
| **故障隔离** | 应用崩溃时，代理可返回友好错误页 |
| **统一入口** | 多个应用共享同一域名/端口 |

**常见反向代理组合**：

| 操作系统 | 反向代理 | 端口转发方式 |
|---------|---------|-------------|
| Windows | IIS / IIS Express | HTTP 转发或 ACNM（ASP.NET Core Module） |
| Linux | Nginx / Apache | HTTP 转发到 Kestrel 端口（如 5000） |
| 容器 | Traefik / Envoy / YARP | 容器编排层面的反向代理 |

**Nginx 配置示例**：

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

### InProcess vs OutOfProcess 托管模式

在 IIS 托管场景下，存在两种托管模式：

| 模式 | 说明 | 性能 | 适用场景 |
|------|------|------|----------|
| **InProcess** | 应用在 IIS 工作进程（`w3wp.exe`）中运行 | 更高（无进程间通信开销） | .NET Core 3.0+ 默认 |
| **OutOfProcess** | 应用在独立进程（`dotnet.exe`）中运行，IIS 作为反向代理 | 较低（需进程间通信） | 旧版本或特定兼容性需求 |

#### 配置方式

```xml
<!-- .csproj 或发布配置 -->
<PropertyGroup>
    <AspNetCoreHostingModel>InProcess</AspNetCoreHostingModel>
</PropertyGroup>
```

```json
// launchSettings.json（开发环境）
{
  "profiles": {
    "IIS Express": {
      "commandName": "IISExpress",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

#### 性能差异

```
InProcess：客户端 → IIS（w3wp.exe，直接托管应用）
           性能损耗：几乎为零

OutOfProcess：客户端 → IIS → ASP.NET Core Module → Kestrel（独立进程）
             性能损耗：约 5-10%（进程间通信）
```

> **建议**：.NET Core 3.0+ 项目默认使用 InProcess 模式，无需显式配置。

---

### 部署（Deployment）

#### 部署方式对比

| 部署方式 | 适用场景 | 优势 |
|---------|---------|------|
| **传统部署** | 物理机/VM | 简单直接，完全控制 |
| **容器化（Docker）** | 现代应用 | 环境一致性、可移植性、弹性伸缩 |
| **云平台 PaaS** | 快速上线，减少运维 | 托管服务、自动扩展、内置监控 |
| **Kubernetes** | 大规模微服务 | 容器编排、自动恢复、滚动更新 |

#### Docker 容器化示例

```dockerfile
# Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["MyApp/MyApp.csproj", "MyApp/"]
RUN dotnet restore "MyApp/MyApp.csproj"
COPY . .
WORKDIR "/src/MyApp"
RUN dotnet build "MyApp.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "MyApp.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "MyApp.dll"]
```

#### CI/CD 流水线（GitHub Actions 示例）

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: 8.0.x
    - name: Restore dependencies
      run: dotnet restore
    - name: Build
      run: dotnet build --no-restore -c Release
    - name: Test
      run: dotnet test --no-build -c Release
    - name: Publish
      run: dotnet publish -c Release -o ./publish
    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'myapp-prod'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: './publish'
```

---

### 健康检查（Health Checks）

健康检查提供用于报告应用运行状态的 HTTP 端点，广泛用于 Kubernetes、负载均衡器、服务发现等场景。

#### 安装与配置

```bash
dotnet add package Microsoft.AspNetCore.Diagnostics.HealthChecks
```

#### 基础健康检查

```csharp
// Program.cs
builder.Services.AddHealthChecks();

app.MapHealthChecks("/health");
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = _ => false  // 仅检查"就绪"状态
});
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => true   // 检查所有
});
```

#### 高级健康检查

```csharp
// 1. 自定义健康检查
public class DatabaseHealthCheck : IHealthCheck
{
    private readonly AppDbContext _context;

    public DatabaseHealthCheck(AppDbContext context)
    {
        _context = context;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _context.Database.ExecuteSqlRawAsync("SELECT 1", cancellationToken);
            return HealthCheckResult.Healthy("数据库连接正常");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy($"数据库连接失败: {ex.Message}");
        }
    }
}

// 2. 注册
builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("Database")
    .AddCheck<RedisHealthCheck>("Redis")
    .AddCheck<ExternalApiHealthCheck>("External API")
    .AddCheck("HTTP", new HttpHealthCheck(new Uri("https://example.com")));

// 3. 启用
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        var result = new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                description = e.Value.Description,
                duration = e.Value.Duration
            })
        };
        await context.Response.WriteAsJsonAsync(result);
    }
});
```

#### Kubernetes 健康检查配置

```yaml
# Kubernetes deployment.yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
```

---

## 第二部分：性能优化篇

### 性能调优：缓存

#### 内存缓存（In-Memory Caching）

内存缓存将数据存储在服务器内存中，适合单机场景。

```csharp
builder.Services.AddMemoryCache();

public class ProductService
{
    private readonly IMemoryCache _cache;
    private readonly AppDbContext _context;

    public ProductService(IMemoryCache cache, AppDbContext context)
    {
        _cache = cache;
        _context = context;
    }

    public async Task<Product> GetProductAsync(int id)
    {
        var cacheKey = $"product_{id}";
        
        // 尝试从缓存获取
        if (_cache.TryGetValue(cacheKey, out Product product))
        {
            return product;
        }
        
        // 从数据库获取
        product = await _context.Products.FindAsync(id);
        if (product != null)
        {
            _cache.Set(cacheKey, product, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5),
                SlidingExpiration = TimeSpan.FromMinutes(1)
            });
        }
        
        return product;
    }
}
```

#### 分布式缓存（Distributed Caching）

多服务器场景下使用 `Redis` 或 `SQL Server` 作为共享缓存。

```csharp
// 1. 安装包
// dotnet add package Microsoft.Extensions.Caching.StackExchangeRedis

// 2. 配置 Redis 缓存
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "MyApp_";
});

// 3. 使用（与内存缓存接口类似）
public class ProductService
{
    private readonly IDistributedCache _cache;
    private readonly AppDbContext _context;

    public async Task<Product> GetProductAsync(int id)
    {
        var cacheKey = $"product_{id}";
        var cached = await _cache.GetStringAsync(cacheKey);
        
        if (!string.IsNullOrEmpty(cached))
        {
            return JsonSerializer.Deserialize<Product>(cached);
        }
        
        var product = await _context.Products.FindAsync(id);
        if (product != null)
        {
            await _cache.SetStringAsync(cacheKey, 
                JsonSerializer.Serialize(product),
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
                });
        }
        
        return product;
    }
}
```

#### 内存缓存 vs 分布式缓存

| 对比维度      | 内存缓存           | 分布式缓存            |
| --------- | -------------- | ---------------- |
| **适用场景**  | 单机、低并发         | 多服务器、集群          |
| **性能**    | 极快（本地内存）       | 较快（网络 I/O）       |
| **数据一致性** | 各服务器独立         | 共享一致             |
| **重启影响**  | 缓存丢失           | 缓存保留             |
| **典型实现**  | `IMemoryCache` | Redis、SQL Server |
|           |                |                  |

#### 响应缓存（Response Caching）

**Response Caching** 根据 HTTP 响应头缓存整个响应。

```csharp
// 1. 启用缓存服务
builder.Services.AddResponseCaching();

// 2. 使用中间件
app.UseResponseCaching();

// 3. 在控制器上使用特性
[ResponseCache(Duration = 60, Location = ResponseCacheLocation.Client)]
[HttpGet("product/{id}")]
public IActionResult GetProduct(int id)
{
    return Ok(new { Id = id, Name = "Product" });
}
```

#### 输出缓存（Output Caching，.NET 7+）

**Output Caching** 是 ASP.NET Core 7 新增的缓存机制，可缓存整个端点输出内容。

```csharp
// 1. 启用
builder.Services.AddOutputCache();

app.UseOutputCache();

// 2. 使用
[OutputCache(Duration = 60)]
[HttpGet("product/{id}")]
public IActionResult GetProduct(int id) { ... }

// 3. 带变体的缓存
[OutputCache(Duration = 60, VaryByQueryKeys = new[] { "page", "size" })]
[HttpGet("products")]
public IActionResult GetProducts(int page, int size) { ... }
```

#### 响应压缩（Response Compression）

使用 Gzip 或 Brotli 压缩响应，减少带宽消耗。

```csharp
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});

app.UseResponseCompression();

// 配置压缩级别
services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});
```

---

### 多线程与并发（Threading & Concurrency）

#### async/await 最佳实践

```csharp
// ❌ 错误：同步阻塞异步方法（可能导致死锁）
[HttpGet]
public IActionResult GetData()
{
    var result = _service.GetDataAsync().Result;  // 阻塞
    return Ok(result);
}

// ❌ 错误：使用 Task.Run 包装同步方法
[HttpGet]
public async Task<IActionResult> GetData()
{
    var result = await Task.Run(() => ComputeData());  // 无意义，浪费线程
    return Ok(result);
}

// ✅ 正确：I/O 操作使用 async/await
[HttpGet]
public async Task<IActionResult> GetData()
{
    var result = await _service.GetDataAsync();
    return Ok(result);
}
```

#### 避免死锁的原则

| 原则 | 说明 |
|------|------|
| **一路 async** | 从控制器到数据库，全链路使用异步 |
| **不使用 .Result/.Wait()** | 避免同步阻塞异步方法 |
| **配置 ConfigureAwait(false)** | 在库代码中使用，避免上下文捕获 |
| **避免混合同步/异步** | 不要在异步方法中调用同步方法 |

```csharp
// 推荐：库代码中使用 ConfigureAwait(false)
public async Task<Product> GetProductAsync(int id)
{
    return await _context.Products.FindAsync(id).ConfigureAwait(false);
}
```

#### 线程安全的数据结构

| 场景 | 推荐使用 | 说明 |
|------|---------|------|
| 字典 | `ConcurrentDictionary<TKey, TValue>` | 线程安全的字典 |
| 集合 | `ConcurrentBag<T>` / `ConcurrentQueue<T>` | 线程安全的集合 |
| 列表 | `ImmutableList<T>` / 使用 `lock` | 不可变列表或手动锁定 |
| 计数器 | `Interlocked.Increment` | 原子操作 |
| 缓存 | `MemoryCache` | 内置线程安全 |

```csharp
// 使用 ConcurrentDictionary
private static readonly ConcurrentDictionary<int, Product> _cache = new();

public Product GetProduct(int id)
{
    return _cache.GetOrAdd(id, key => LoadProductFromDb(key));
}

// 使用 Interlocked
private int _counter;
public int IncrementCounter() => Interlocked.Increment(ref _counter);
```

#### 线程池配置

```csharp
// 调整线程池参数（在 Program.cs 早期配置）
ThreadPool.SetMinThreads(100, 100);
ThreadPool.SetMaxThreads(2000, 2000);
```

---

### 内存泄漏与资源释放

#### 常见内存泄漏原因

| 原因 | 说明 | 解决方案 |
|------|------|----------|
| **未释放 IDisposable** | 数据库连接、Stream、HttpClient | 使用 `using` 或 `await using` |
| **事件未解绑** | 订阅事件后未取消订阅 | 确保在 `Dispose` 中解绑 |
| **静态引用** | 静态集合持有对象引用 | 限制静态集合的使用 |
| **DI 生命周期不匹配** | Singleton 引用 Scoped | 确保生命周期兼容 |
| **大对象分配** | 频繁分配大对象（> 85KB） | 对象池复用 |

#### 正确释放资源

```csharp
// ✅ 使用 using 自动释放
public async Task ProcessFileAsync(string path)
{
    using var stream = File.OpenRead(path);
    using var reader = new StreamReader(stream);
    // 处理...
}

// ✅ 实现 IDisposable 释放托管资源
public class MyService : IDisposable
{
    private readonly HttpClient _client;
    private readonly IEventSubscription _subscription;

    public MyService(HttpClient client, IEventAggregator events)
    {
        _client = client;
        _subscription = events.Subscribe<MyEvent>(OnEvent);
    }

    public void Dispose()
    {
        _subscription?.Dispose();
        _client?.Dispose();
    }
}
```

#### 内存分析工具

| 工具 | 平台 | 用途 |
|------|------|------|
| **dotMemory** | JetBrains | .NET 内存分析 |
| **PerfView** | 微软 | ETW 性能分析 |
| **Visual Studio Diagnostic Tools** | 微软 | 内置内存和 CPU 分析 |
| **BenchmarkDotNet** | 开源 | 性能基准测试 |
| **Application Insights** | Azure | 生产环境监控 |

---

## 第三部分：监控与可观测性篇

### 日志记录（Logging）

#### 内置日志提供程序

```csharp
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();
builder.Logging.AddEventLog();  // Windows 事件日志
builder.Logging.AddEventSourceLogger();
```

#### 结构化日志（Serilog）

```bash
dotnet add package Serilog.AspNetCore
dotnet add package Serilog.Sinks.Console
dotnet add package Serilog.Sinks.File
dotnet add package Serilog.Sinks.ElasticSearch
```

```csharp
// Program.cs
builder.Host.UseSerilog((context, config) =>
{
    config.ReadFrom.Configuration(context.Configuration)
          .Enrich.FromLogContext()
          .Enrich.WithMachineName()
          .Enrich.WithThreadId()
          .WriteTo.Console()
          .WriteTo.File("logs/myapp-.txt", 
              rollingInterval: RollingInterval.Day,
              retainedFileCountLimit: 30)
          .WriteTo.Elasticsearch(new ElasticsearchSinkOptions(new Uri("http://localhost:9200"))
          {
              IndexFormat = "myapp-{0:yyyy.MM.dd}"
          });
});
```

#### 日志级别配置

```json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft": "Warning",
        "Microsoft.AspNetCore": "Warning",
        "System.Net.Http.HttpClient": "Warning"
      }
    }
  }
}
```

---

### 监控、指标与追踪（Monitoring, Metrics, Tracing）

#### OpenTelemetry 分布式追踪

```bash
dotnet add package OpenTelemetry
dotnet add package OpenTelemetry.Extensions.Hosting
dotnet add package OpenTelemetry.Exporter.Jaeger
dotnet add package OpenTelemetry.Instrumentation.AspNetCore
dotnet add package OpenTelemetry.Instrumentation.Http
dotnet add package OpenTelemetry.Instrumentation.SqlClient
```

```csharp
builder.Services.AddOpenTelemetry()
    .WithTracing(tracerProviderBuilder =>
    {
        tracerProviderBuilder
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddSqlClientInstrumentation()
            .AddJaegerExporter(options =>
            {
                options.AgentHost = "localhost";
                options.AgentPort = 6831;
            })
            .AddConsoleExporter();
    })
    .WithMetrics(meterProviderBuilder =>
    {
        meterProviderBuilder
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddPrometheusExporter();
    });
```

#### Application Insights 集成

```csharp
builder.Services.AddApplicationInsightsTelemetry(
    builder.Configuration["ApplicationInsights:ConnectionString"]);
```

#### Prometheus + Grafana 指标

```bash
dotnet add package OpenTelemetry.Exporter.Prometheus.AspNetCore
```

```csharp
app.UseOpenTelemetryPrometheusScrapingEndpoint();
```

---

## 第四部分：高级特性篇

### SignalR（实时通信）

SignalR 实现客户端与服务器的**实时双向通信**，支持多种传输方式。

| 传输方式 | 说明 | 适用场景 |
|---------|------|----------|
| **WebSockets** | 全双工、低延迟 | 最佳选择，现代浏览器支持 |
| **Server-Sent Events** | 服务器推送到客户端 | 仅需服务器推送 |
| **Long Polling** | 长轮询 | 降级方案 |

#### SignalR 配置

```csharp
// 1. 注册 SignalR
builder.Services.AddSignalR();

// 2. 配置
app.MapHub<ChatHub>("/chatHub");
app.MapHub<NotificationHub>("/notificationHub");
```

#### Hub 实现

```csharp
public class ChatHub : Hub
{
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(ILogger<ChatHub> logger)
    {
        _logger = logger;
    }

    public async Task SendMessage(string user, string message)
    {
        _logger.LogInformation("{User} 发送消息: {Message}", user, message);
        await Clients.All.SendAsync("ReceiveMessage", user, message);
    }

    public async Task JoinGroup(string groupName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        await Clients.Group(groupName).SendAsync("UserJoined", Context.ConnectionId);
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("客户端连接: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }
}
```

#### 客户端示例

```javascript
// JavaScript 客户端
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/chatHub")
    .withAutomaticReconnect()
    .build();

connection.on("ReceiveMessage", (user, message) => {
    console.log(`${user}: ${message}`);
});

await connection.start();
await connection.invoke("SendMessage", "Alice", "Hello!");
```

---

### 后台任务与托管服务（Background Tasks / Hosted Services）

#### IHostedService 与 BackgroundService

```csharp
// 1. 实现后台服务
public class EmailBackgroundService : BackgroundService
{
    private readonly ILogger<EmailBackgroundService> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public EmailBackgroundService(
        ILogger<EmailBackgroundService> logger,
        IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("后台服务运行中...");
            
            // 使用作用域解析 Scoped 服务
            using (var scope = _scopeFactory.CreateScope())
            {
                var emailService = scope.ServiceProvider
                    .GetRequiredService<IEmailService>();
                await emailService.ProcessPendingEmailsAsync();
            }
            
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
        
        _logger.LogInformation("后台服务停止");
    }
}

// 2. 注册
builder.Services.AddHostedService<EmailBackgroundService>();
```

#### 常用后台任务场景

| 场景   | 实现方式                               | 说明      |
| ---- | ---------------------------------- | ------- |
| 定时任务 | `BackgroundService` + `Timer`      | 定期执行    |
| 队列消费 | `BackgroundService` + `Channel`    | 处理消息队列  |
| 长连接  | `IHostedService`                   | 保持持久连接  |
| 启动任务 | `IHostedService` 在 `StartAsync` 执行 | 应用启动时运行 |

#### 使用 Channel 实现队列

```csharp
// 1. 创建队列
public class BackgroundTaskQueue
{
    private readonly Channel<Func<CancellationToken, Task>> _queue;

    public BackgroundTaskQueue(int capacity = 100)
    {
        var options = new BoundedChannelOptions(capacity)
        {
            FullMode = BoundedChannelFullMode.Wait
        };
        _queue = Channel.CreateBounded<Func<CancellationToken, Task>>(options);
    }

    public async Task QueueAsync(Func<CancellationToken, Task> workItem)
    {
        await _queue.Writer.WriteAsync(workItem);
    }

    public async Task<Func<CancellationToken, Task>> DequeueAsync(
        CancellationToken cancellationToken)
    {
        return await _queue.Reader.ReadAsync(cancellationToken);
    }
}

// 2. 后台服务消费队列
public class QueueBackgroundService : BackgroundService
{
    private readonly BackgroundTaskQueue _queue;
    private readonly ILogger<QueueBackgroundService> _logger;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var workItem = await _queue.DequeueAsync(stoppingToken);
            try
            {
                await workItem(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "队列任务执行失败");
            }
        }
    }
}

// 3. 使用
[HttpPost("send-email")]
public async Task<IActionResult> SendEmail([FromBody] EmailRequest request)
{
    await _queue.QueueAsync(async ct =>
    {
        await _emailService.SendAsync(request);
    });
    return Accepted();
}
```

---

### 文件与流处理（Files & Streaming）

#### 大文件下载

```csharp
[HttpGet("download/{id}")]
public async Task<IActionResult> Download(string id)
{
    var filePath = Path.Combine("uploads", id);
    if (!System.IO.File.Exists(filePath))
        return NotFound();

    // 使用 FileStreamResult 流式返回，不加载到内存
    var stream = System.IO.File.OpenRead(filePath);
    var contentType = MimeTypes.GetMimeType(Path.GetExtension(filePath));
    return File(stream, contentType, Path.GetFileName(filePath));
}
```

#### 大文件上传（流式）

```csharp
[HttpPost("upload")]
[RequestSizeLimit(1_073_741_824)]  // 1 GB
public async Task<IActionResult> Upload([FromForm] IFormFile file)
{
    if (file == null || file.Length == 0)
        return BadRequest("文件为空");

    var uploads = Path.Combine(Environment.ContentRootPath, "uploads");
    Directory.CreateDirectory(uploads);

    // 流式写入，避免内存占用
    var path = Path.Combine(uploads, 
        $"{Path.GetRandomFileName()}{Path.GetExtension(file.FileName)}");
    
    using var fileStream = System.IO.File.Create(path);
    await file.CopyToAsync(fileStream);

    return Ok(new { file = path, size = file.Length });
}
```

#### 异步流式响应（IAsyncEnumerable）

```csharp
[HttpGet("stream-products")]
public async IAsyncEnumerable<Product> GetProductsStream()
{
    await foreach (var product in _context.Products.AsAsyncEnumerable())
    {
        yield return product;
    }
}
```

---

### .NET 版本与新特性

| 版本 | 关键新特性 |
|------|-----------|
| **.NET Core 3.0** | Windows Forms、WPF、EF Core 3.0 |
| **.NET 5** | C# 9、Source Generators |
| **.NET 6 (LTS)** | Minimal APIs、DateOnly/TimeOnly、异步流 |
| **.NET 7** | 输出缓存、限流中间件、类型转换器 |
| **.NET 8 (LTS)** | 原生 AOT、Keyed Services、Blazor 增强 |

```csharp
// .NET 6+ Minimal API 示例
var app = WebApplication.Create(args);

app.MapGet("/", () => "Hello, Minimal API!");

app.MapGet("/products/{id}", async (int id, AppDbContext db) =>
{
    var product = await db.Products.FindAsync(id);
    return product is null ? Results.NotFound() : Results.Ok(product);
});

app.Run();
```

---

## 第五部分：面试避坑清单

| 序号 | ❌ 常见错误 | ✅ 正确理解 |
|------|-----------|-----------|
| 1 | 生产环境直接将 Kestrel 暴露给互联网 | 使用反向代理（Nginx/IIS）增加安全层 |
| 2 | 忘记配置健康检查 | Kubernetes/负载均衡器依赖健康检查进行服务发现 |
| 3 | 使用 `HttpClient` 不重用实例 | 使用 `IHttpClientFactory` 管理生命周期 |
| 4 | 异步方法中使用 `.Result` 或 `.Wait()` | 全链路使用 `await` |
| 5 | 内存缓存用于多服务器场景 | 多服务器使用分布式缓存（Redis） |
| 6 | 不释放 `IDisposable` 资源 | 使用 `using` 或依赖注入生命周期管理 |
| 7 | 忽略后台任务中的 `CancellationToken` | 传递取消令牌，支持优雅关机 |
| 8 | 所有部署都手动操作 | 建立 CI/CD 流水线（GitHub Actions/Azure DevOps） |
| 9 | 生产环境不配置监控和日志聚合 | 使用 Application Insights/Prometheus + Grafana |
| 10 | SignalR 不使用 WebSocket 降级 | 配置多种传输方式，保证兼容性 |

---

## 小结

ASP.NET Core 的部署、性能优化和运维是生产环境的关键能力：

- **托管与部署**：Kestrel + 反向代理是推荐的生产架构，容器化是现代应用的趋势
- **性能优化**：合理使用缓存（内存/分布式/响应/输出）、压缩、异步编程
- **监控与可观测性**：健康检查、结构化日志、分布式追踪、指标聚合是生产必备
- **高级特性**：SignalR 实时通信、BackgroundService 后台任务、流式文件处理

回顾全文，记住三个核心原则：

1. **生产环境用反向代理**：Kestrel + Nginx/IIS 是标准架构
2. **监控优先**：健康检查 + 日志 + 追踪 + 指标，缺一不可
3. **异步贯穿始终**：从控制器到数据库，全链路使用 async/await
