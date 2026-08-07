---
tags: ["aspnetcore"]
category: aspnetcore
categories:
  - 面试
  - aspnetcore
date: 2026-05-07T16:19:00
banner: /images/aspnetcore1.webp
title: ASP.NET Core 面试题 高级主题与扩展知识
description: 系统梳理 ASP.NET Core 中 ActionResult、Minimal API、Endpoint Routing、OpenAPI、内容协商、ProblemDetails、响应压缩、JSON 序列化等高级主题及扩展知识，涵盖从基础概念到生产实践的完整指南。
---

# ASP.NET Core 面试题 高级主题与扩展知识

> 除了核心概念，ASP.NET Core 还有许多“隐藏的宝藏”——从 Minimal API 到 Endpoint Routing，从标准化错误响应到响应压缩，掌握它们能让你从“会用”走向“精通”。

在 ASP.NET Core 面试中，除了常规的核心概念，面试官还会考察一些**高级主题和扩展知识**：IActionResult vs ActionResult`<T>`、Minimal API 的应用场景、Endpoint Routing 的设计理念、标准化错误响应格式等。这些问题往往是区分“知其然”和“知其所以然”的关键。

本文将继续补充 ASP.NET Core 的高阶知识点，覆盖从基础到进阶，帮助你在面试中展现更完整的技术视野。

---

## 第一部分：控制器与结果篇

### IActionResult 与 ActionResult`<T>` 的区别

在 ASP.NET Core 控制器中，Action 方法的返回类型有两种常见选择：`IActionResult` 和 `ActionResult<T>`。

#### IActionResult（非泛型）

`IActionResult` 是一个接口，表示 Action 方法可返回任意类型的 HTTP 响应。

```csharp
[HttpGet("{id}")]
public IActionResult GetProduct(int id)
{
    var product = _service.GetProduct(id);
    if (product == null)
        return NotFound();
    return Ok(product);
}
```

**特点**：
- 灵活：可返回任意结果类型（`OkResult`、`NotFoundResult`、`RedirectResult` 等）
- 无类型信息：返回值的类型对框架不可见，需要额外的 `[ProducesResponseType]` 特性辅助 Swagger

#### ActionResult`<T>`（泛型）

`ActionResult<T>` 是一个泛型类型，将 HTTP 响应和强类型数据结合在一起。

```csharp
[HttpGet("{id}")]
public ActionResult<Product> GetProduct(int id)
{
    var product = _service.GetProduct(id);
    if (product == null)
        return NotFound();
    return Ok(product);
}
```

**特点**：
- 强类型：返回的数据类型明确
- Swagger 友好：可自动推断返回类型，无需 `[ProducesResponseType]`
- 可读性更好：在代码中清楚表达 Action 的返回类型

#### 对比总结

| 对比维度 | `IActionResult` | `ActionResult<T>` |
|---------|----------------|-------------------|
| **类型信息** | ❌ 无类型信息 | ✅ 强类型 `T` |
| **Swagger/OpenAPI** | 需要 `[ProducesResponseType]` 手动标注 | 可自动推断 |
| **灵活性** | ✅ 高，可返回任意类型 | ⚠️ 中等，适合单一返回类型 |
| **可读性** | ⚠️ 返回类型不明确 | ✅ 清晰表达返回类型 |
| **适用场景** | 多种返回类型、复杂逻辑 | 简单 CRUD、类型明确的场景 |

#### 推荐原则

```csharp
// ✅ 简单 API → ActionResult<T>
[HttpGet]
public ActionResult<List<Product>> GetProducts()
{
    return Ok(_service.GetAll());
}

// ✅ 复杂场景（多种返回类型）→ IActionResult
[HttpPost]
public IActionResult Create([FromBody] Product product)
{
    if (product == null)
        return BadRequest();

    if (_service.Exists(product.Name))
        return Conflict("产品名称已存在");

    var created = _service.Create(product);
    return CreatedAtAction(nameof(GetProduct), new { id = created.Id }, created);
}
```

---

## 第二部分：托管与迁移篇

### Startup 角色的演变

#### .NET 5 及更早：双文件模式

```csharp
// Program.cs
public class Program
{
    public static void Main(string[] args)
    {
        CreateHostBuilder(args).Build().Run();
    }

    public static IHostBuilder CreateHostBuilder(string[] args) =>
        Host.CreateDefaultBuilder(args)
            .ConfigureWebHostDefaults(webBuilder =>
            {
                webBuilder.UseStartup<Startup>();
            });
}

// Startup.cs
public class Startup
{
    public Startup(IConfiguration configuration)
    {
        Configuration = configuration;
    }

    public IConfiguration Configuration { get; }

    public void ConfigureServices(IServiceCollection services)
    {
        services.AddControllers();
    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        if (env.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
        }
        app.UseRouting();
        app.UseEndpoints(endpoints =>
        {
            endpoints.MapControllers();
        });
    }
}
```

#### .NET 6+ Minimal Hosting：单文件模式

```csharp
// Program.cs（顶层语句）
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
app.UseRouting();
app.MapControllers();
app.Run();
```

#### 核心变化

| 对比维度 | .NET 5（Startup） | .NET 6+（Minimal Hosting） |
|---------|------------------|---------------------------|
| **代码组织** | Program.cs + Startup.cs | 单文件 Program.cs |
| **配置方式** | 使用 `Startup` 类中的 `ConfigureServices` / `Configure` | 直接在 `Program.cs` 中使用 `builder` 和 `app` |
| **冗余度** | 较高 | 精简 |
| **灵活性** | 结构清晰，适合复杂项目 | 更灵活，适合快速开发 |

> **结论**：`Startup` 在 .NET 6+ 中不再是必需的，但仍可用于组织结构。大多数新项目推荐使用 Minimal Hosting 模式。

---

### 从 .NET 5 迁移到 .NET 8（或更新版本）

#### 迁移步骤

```bash
# 1. 更新目标框架
# 在 .csproj 中修改
<TargetFramework>net8.0</TargetFramework>

# 2. 升级 NuGet 包
dotnet list package --outdated
dotnet update package

# 3. 迁移至 Minimal Hosting（可选）
# 将 Startup 逻辑移动到 Program.cs
```

#### 迁移检查清单

| 检查项 | 说明 | 操作 |
|--------|------|------|
| **目标框架** | 更新为 `net8.0` | 修改 `.csproj` |
| **NuGet 包** | 升级到兼容版本 | 更新所有包 |
| **Startup 迁移** | 合并到 Minimal Hosting | 移至 `Program.cs` |
| **弃用 API** | 检查已弃用的 API | 阅读迁移指南，替换为推荐方式 |
| **中间件顺序** | 检查中间件顺序是否正确 | 参考新版本最佳实践 |
| **路由模式** | 检查属性路由和传统路由 | 验证路由是否正确 |
| **测试** | 充分测试 | 运行单元测试和集成测试 |

#### 常见迁移问题

| 问题 | 解决方案 |
|------|----------|
| `UseSwaggerUI` 位置变化 | 在 .NET 6+ 中直接调用 `app.UseSwaggerUI()` |
| `IHostingEnvironment` 已弃用 | 使用 `IWebHostEnvironment` |
| `IApplicationBuilder` 替代 | Minimal Hosting 中直接使用 `WebApplication` |
| `Startup` 中 `ConfigureServices` | 使用 `builder.Services` 注册服务 |

---

## 第三部分：Minimal API 篇

### 什么是 Minimal API？

Minimal API 是 ASP.NET Core 6 引入的轻量级 API 开发模式。

#### Minimal API 示例

```csharp
var app = WebApplication.Create(args);

app.MapGet("/", () => "Hello World!");

app.MapGet("/products", async (AppDbContext db) =>
    await db.Products.ToListAsync());

app.MapGet("/products/{id}", async (int id, AppDbContext db) =>
    await db.Products.FindAsync(id) is Product product
        ? Results.Ok(product)
        : Results.NotFound());

app.MapPost("/products", async (Product product, AppDbContext db) =>
{
    db.Products.Add(product);
    await db.SaveChangesAsync();
    return Results.Created($"/products/{product.Id}", product);
});

app.Run();
```

#### Minimal API vs Controllers

| 对比维度 | Minimal API | Controllers |
|---------|-------------|-------------|
| **仪式感** | 极低（仅需最少量代码） | 高（需 Controller 类、Action 方法、特性标注） |
| **适用场景** | 微服务、简单 API、快速原型 | 大型应用、复杂业务逻辑、MVC 项目 |
| **功能支持** | 基础功能（路由、依赖注入、模型绑定） | 完整功能（过滤器、模型验证、视图、区域） |
| **OpenAPI 文档** | 需通过 `WithOpenApi()` 或 `OpenApi` 包 | 内置支持 Swashbuckle |
| **代码组织** | 较难组织大型项目 | 良好支持分层和模块化 |
| **测试难度** | 较难测试（需使用 `WebApplicationFactory`） | 较易测试（可直接实例化控制器） |

#### 什么时候使用 Minimal API？

```text
推荐 Minimal API：
├── 微服务架构
├── 简单 CRUD API
├── 快速原型开发
├── 无状态、无复杂业务逻辑
└── 团队已熟悉 Minimal API

推荐 Controllers：
├── 大型企业应用
├── 复杂的业务逻辑
├── 需要过滤器、模型验证等完整功能
├── MVC + API 混合应用
└── 团队更熟悉传统 MVC 模式
```

---

## 第四部分：路由与端点篇

### Endpoint Routing

Endpoint Routing 是 ASP.NET Core 3.0 引入的**集中式路由系统**，将路由匹配与中间件解耦。

#### 核心设计理念

```text
传统路由：中间件 → 路由匹配 → 执行 Action
Endpoint Routing：中间件 → 端点选择 → 执行端点
```

**关键优势**：

| 优势 | 说明 |
|------|------|
| **解耦** | 路由逻辑从 MVC 中分离 |
| **统一** | MVC、Razor Pages、Minimal API 使用同一路由系统 |
| **灵活性** | 中间件可在路由选择前后执行 |
| **性能** | 路由匹配优化，支持更多端点场景 |

#### 使用 Endpoint Routing

```csharp
// .NET 6+ Minimal Hosting
app.MapGet("/", () => "Hello");
app.MapControllers();  // MVC 端点
app.MapRazorPages();   // Razor Pages 端点

// .NET 5（使用 Endpoint）
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();
    endpoints.MapRazorPages();
});
```

#### 中间件与端点路由的交互

```csharp
app.Use(async (context, next) =>
{
    // 路由选择前执行
    await next();
});

app.UseRouting();

app.Use(async (context, next) =>
{
    // 路由选择后，端点执行前
    var endpoint = context.GetEndpoint();  // ✅ 可访问选中的端点
    await next();
});

app.MapGet("/api/products", () => new[] { "Product1", "Product2" });
```

---

### 传统路由 vs 特性路由

#### 传统路由（Conventional Routing）

在 `Program.cs` 或 `Startup.cs` 中集中定义路由模板。

```csharp
// .NET 6+
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

// .NET 5（UseEndpoints）
endpoints.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");
```

**特点**：
- 集中管理，全局应用
- 易于维护（所有路由在一个地方）
- 适合传统 MVC 项目

#### 特性路由（Attribute Routing）

在控制器或 Action 上使用 `[Route]`、`[HttpGet]`、`[HttpPost]` 等特性。

```csharp
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    [HttpGet("{id:int}")]
    public IActionResult GetById(int id) { ... }
    
    [HttpGet("search")]
    public IActionResult Search([FromQuery] string keyword) { ... }
}
```

**特点**：
- 灵活性高，可精确控制每个端点的路由
- 更直观，与代码结构对应
- Web API 推荐使用

#### 对比总结

| 对比维度 | 传统路由 | 特性路由 |
|---------|---------|----------|
| **定义方式** | 集中定义在 `Program.cs` | 分散在控制器/Action 上的特性 |
| **灵活性** | 低（全局模板） | 高（精确控制每个端点） |
| **可维护性** | 便于集中管理 | 便于按模块管理 |
| **适用场景** | 传统 MVC | Web API、RESTful API |
| **优先级** | 低（先匹配传统路由，再匹配特性路由） | 高（特性路由优先） |

#### 混合使用

```csharp
// 混用传统路由和特性路由
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

[Route("admin/[controller]")]
public class DashboardController : Controller
{
    [Route("stats")]
    public IActionResult Stats() { ... }
}
```

---

## 第五部分：API 文档与错误处理篇

### 启用与自定义 OpenAPI / Swagger UI

#### 配置 Swagger

```bash
dotnet add package Swashbuckle.AspNetCore
```

```csharp
// 1. 注册服务
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "My API",
        Version = "v1",
        Description = "API 文档示例",
        Contact = new OpenApiContact
        {
            Name = "Support",
            Email = "support@example.com"
        },
        License = new OpenApiLicense
        {
            Name = "MIT",
            Url = new Uri("https://opensource.org/licenses/MIT")
        }
    });
    
    // 添加 JWT 认证支持
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT 认证",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer"
    });
    
    // 添加 XML 注释（如启用）
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
        options.IncludeXmlComments(xmlPath);
});

// 2. 启用中间件
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "My API v1");
        options.RoutePrefix = string.Empty;  // 设为根路径
        options.DocExpansion(DocExpansion.None);
        options.DefaultModelsExpandDepth(-1);
    });
}
```

### 内容协商（Content Negotiation）

根据客户端 `Accept` 请求头自动选择响应格式。

#### 默认行为

```text
Accept: application/json → 返回 JSON
Accept: application/xml  → 返回 XML（需启用）
Accept: text/plain       → 返回 406（如配置）
```

#### 配置内容协商

```csharp
builder.Services.AddControllers(options =>
{
    // 严格模式：不支持的格式返回 406
    options.ReturnHttpNotAcceptable = true;
    
    // 添加 XML 格式化器
    options.OutputFormatters.Add(new XmlSerializerOutputFormatter());
});

// 或通过 AddControllers 添加
builder.Services.AddControllers()
    .AddXmlSerializerFormatters();
```

#### 自定义格式化器

```csharp
public class CustomOutputFormatter : IOutputFormatter
{
    public bool CanWriteResult(OutputFormatterCanWriteContext context)
    {
        // 判断是否支持此结果类型
        return context.ObjectType == typeof(Product);
    }

    public async Task WriteAsync(OutputFormatterWriteContext context)
    {
        // 自定义序列化逻辑
        var response = context.HttpContext.Response;
        response.ContentType = "application/custom+json";
        await response.WriteAsync(JsonSerializer.Serialize(context.Object));
    }
}

builder.Services.AddControllers(options =>
{
    options.OutputFormatters.Add(new CustomOutputFormatter());
});
```

### WebAPI 中的 ProblemDetails

`ProblemDetails` 是 **RFC 7807** 定义的标准化错误响应格式。

#### 默认使用

在启用 `[ApiController]` 的控制器中，验证失败会**自动返回** `ProblemDetails`。

```json
{
    "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
    "title": "One or more validation errors occurred.",
    "status": 400,
    "traceId": "00-abc123...",
    "errors": {
        "Email": ["邮箱格式不正确"],
        "Age": ["年龄必须在 18~60 岁之间"]
    }
}
```

#### 自定义 ProblemDetails

```csharp
[HttpPost]
public IActionResult Create([FromBody] Product product)
{
    if (string.IsNullOrEmpty(product.Name))
    {
        return Problem(
            title: "创建失败",
            detail: "产品名称不能为空",
            statusCode: 400,
            instance: HttpContext.Request.Path,
            extensions: new Dictionary<string, object?>
            {
                ["errorCode"] = "PROD_001",
                ["timestamp"] = DateTime.UtcNow
            });
    }
    // ...
}
```

#### 全局配置 ProblemDetails

```csharp
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState
            .Where(e => e.Value?.Errors.Count > 0)
            .ToDictionary(
                e => e.Key,
                e => e.Value?.Errors.Select(x => x.ErrorMessage).ToArray()
            );

        return new BadRequestObjectResult(new ProblemDetails
        {
            Status = 400,
            Title = "请求参数验证失败",
            Detail = "请检查请求参数",
            Instance = context.HttpContext.Request.Path,
            Extensions =
            {
                ["errors"] = errors,
                ["timestamp"] = DateTime.UtcNow
            }
        });
    };
});
```

---

### 自定义错误响应（中间件方式）

```csharp
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var exceptionHandlerFeature = context.Features
            .Get<IExceptionHandlerFeature>();
        var exception = exceptionHandlerFeature?.Error;

        context.Response.StatusCode = exception switch
        {
            ArgumentException => 400,
            KeyNotFoundException => 404,
            UnauthorizedAccessException => 401,
            _ => 500
        };
        
        context.Response.ContentType = "application/problem+json";

        var problem = new ProblemDetails
        {
            Status = context.Response.StatusCode,
            Title = exception?.GetType().Name.Replace("Exception", ""),
            Detail = exception?.Message,
            Instance = context.Request.Path,
            Extensions =
            {
                ["traceId"] = context.TraceIdentifier,
                ["timestamp"] = DateTime.UtcNow
            }
        };

        await context.Response.WriteAsJsonAsync(problem);
    });
});
```

---

## 第六部分：性能与序列化篇

### 在 API 中使用 CancellationToken

`CancellationToken` 可用于取消长时间运行的异步操作。

```csharp
[HttpGet("slow-operation")]
public async Task<IActionResult> SlowOperation(CancellationToken cancellationToken)
{
    // 传递取消令牌给异步方法
    var result = await _service.LongRunningOperationAsync(cancellationToken);
    return Ok(result);
}

public class ProductService
{
    public async Task<IEnumerable<Product>> LongRunningOperationAsync(
        CancellationToken cancellationToken)
    {
        // 数据库查询支持取消
        return await _context.Products
            .Where(p => p.IsActive)
            .ToListAsync(cancellationToken);
    }
}
```

**关键点**：
- 当客户端断开连接或超时时，`CancellationToken` 会被触发
- 提升资源利用率（避免浪费资源处理已取消的请求）
- 需要将令牌传递给所有可取消的异步调用

### 默认文件上传大小限制

#### 默认值

| 环境 | 默认限制 |
|------|----------|
| Kestrel | 30 MB |
| IIS | 28.6 MB |
| IIS Express | 30 MB |

#### 配置方式

```csharp
// 1. 在控制器或 Action 上配置
[HttpPost]
[RequestSizeLimit(100_000_000)]  // 100 MB
public IActionResult Upload(IFormFile file) { ... }

[HttpPost]
[RequestFormLimits(MultipartBodyLengthLimit = 100_000_000)]
public IActionResult UploadLarge(IFormFile file) { ... }

// 2. 全局配置（Kestrel）
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 100_000_000;  // 100 MB
});

// 3. 使用配置（Program.cs）
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 100_000_000;
});

// 4. IIS 配置（web.config）
<system.webServer>
    <security>
        <requestFiltering>
            <requestLimits maxAllowedContentLength="104857600" /> <!-- 100 MB -->
        </requestFiltering>
    </security>
</system.webServer>
```

### 启用 Gzip 或 Brotli 压缩

#### 配置压缩中间件

```csharp
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    
    // Brotli 优先（压缩率更高）
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    
    // 仅压缩指定 MIME 类型
    options.MimeTypes = new[]
    {
        "application/json",
        "application/javascript",
        "text/css",
        "text/html",
        "text/json",
        "text/plain",
        "text/xml"
    };
});

// 配置压缩级别
builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;  // 或 Optimal, NoCompression
});

builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Optimal;
});

// 启用中间件
app.UseResponseCompression();
```

#### 压缩中间件位置

```csharp
// ⚠️ 重要：UseResponseCompression 应在静态文件之前
app.UseResponseCompression();  // 先启用压缩
app.UseStaticFiles();          // 后提供静态文件
```

#### 压缩效果对比

| 压缩算法 | 压缩率 | 压缩速度 | 解压速度 |
|---------|--------|---------|----------|
| Brotli | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| Gzip | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| 未压缩 | - | - | ⭐⭐⭐⭐⭐ |

**建议**：
- 静态文件用 Brotli（压缩率高）
- 动态内容用 Gzip（速度较快）

---

### JSON 选项：System.Text.Json vs Newtonsoft.Json

#### System.Text.Json（默认）

```csharp
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // 配置序列化
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.WriteIndented = true;
    });
```

**优点**：
- 内置，无需额外包
- 性能优秀（比 Newtonsoft 快 20-30%）
- 内存占用更低
- 原生支持 `async` 序列化

**缺点**：
- 功能相对精简
- 多态反序列化需要额外配置
- `JsonDocument` 为只读

#### Newtonsoft.Json（需安装包）

```bash
dotnet add package Microsoft.AspNetCore.Mvc.NewtonsoftJson
```

```csharp
builder.Services.AddControllers()
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore;
        options.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
        options.SerializerSettings.NullValueHandling = NullValueHandling.Ignore;
        options.SerializerSettings.Converters.Add(new StringEnumConverter());
        options.SerializerSettings.Formatting = Formatting.Indented;
    });
```

**优点**：
- 功能更丰富，支持高级场景
- 多态反序列化（`JsonConverter`）
- 更成熟的生态系统

**缺点**：
- 需要额外包
- 性能略逊于 System.Text.Json
- 更多内存开销

#### 选择建议

```text
推荐 System.Text.Json：
├── 新项目
├── 性能敏感的场景
├── 不需要复杂的高级特性
└── 标准 JSON 处理需求

推荐 Newtonsoft.Json：
├── 需要多态反序列化
├── 复杂类型转换
├── 迁移现有项目
└── 需要 Refit 或特定第三方库支持
```

---

### 版本冲突处理

当多个依赖引用同一库的不同版本时，可能会发生版本冲突。

#### .NET Framework 方案（Binding Redirects）

```xml
<configuration>
    <runtime>
        <assemblyBinding xmlns="urn:schemas-microsoft-com:asm.v1">
            <dependentAssembly>
                <assemblyIdentity name="Newtonsoft.Json" 
                    publicKeyToken="30ad4fe6b2a6aeed" culture="neutral" />
                <bindingRedirect oldVersion="0.0.0.0-13.0.0.0" newVersion="13.0.0.0" />
            </dependentAssembly>
        </assemblyBinding>
    </runtime>
</configuration>
```

#### .NET Core / .NET 5+ 方案

```xml
<!-- 使用中央包版本管理 -->
<PropertyGroup>
    <CentralPackageVersions>true</CentralPackageVersions>
</PropertyGroup>

<ItemGroup>
    <PackageVersion Include="Newtonsoft.Json" Version="13.0.3" />
    <PackageReference Include="Newtonsoft.Json" />
</ItemGroup>
```

#### 解决方案

| 方案 | 说明 |
|------|------|
| **升级依赖** | 将所有依赖升级到最新兼容版本 |
| **整合依赖** | 检查是否可以使用相同的库版本 |
| **中央包版本管理** | .NET 5+ 使用 `CentralPackageVersions` |
| **修改包引用** | 在项目文件中直接指定版本号 |

---

## 第七部分：面试避坑清单

| 序号 | ❌ 常见错误 | ✅ 正确理解 |
|------|-----------|-----------|
| 1 | 认为 `ActionResult<T>` 总比 `IActionResult` 好 | 复杂场景用 `IActionResult`，简单 API 用 `ActionResult<T>` |
| 2 | .NET 6+ 项目中仍强制使用 `Startup` | .NET 6+ 推荐 Minimal Hosting，`Startup` 非必需 |
| 3 | 迁移时忘记检查弃用 API | 检查 `IHostingEnvironment` → `IWebHostEnvironment` |
| 4 | 认为 Minimal API 会取代 Controllers | 两者互补，各有适用场景 |
| 5 | 未启用 Endpoint Routing 的中间件筛选 | 使用 `app.UseRouting()` 和 `app.UseEndpoints()` |
| 6 | 传统路由和特性路由混用时优先级不清 | 特性路由优先级更高 |
| 7 | 忘记配置 Swagger UI 的 XML 注释 | 启用 `IncludeXmlComments` 获得更好的文档 |
| 8 | 不配置响应压缩 | 启用 Gzip/Brotli 压缩可显著减少带宽 |
| 9 | 迁移到 System.Text.Json 时忘记处理多态 | 如需多态，使用 Newtonsoft 或自定义转换器 |
| 10 | 忽略文件上传大小限制 | 根据需求配置 `[RequestSizeLimit]` |

---

## 小结

本文涵盖了 ASP.NET Core 的高级主题和扩展知识：

- **IActionResult vs ActionResult<T>**：简单 API 用 `ActionResult<T>`，复杂场景用 `IActionResult`
- **Startup 角色的演变**：.NET 6+ 采用 Minimal Hosting，更精简灵活
- **Minimal API**：轻量级 API 开发模式，适合微服务和快速原型
- **Endpoint Routing**：集中式路由系统，将路由匹配与中间件解耦
- **传统 vs 特性路由**：特性路由更灵活，Web API 推荐使用
- **OpenAPI / Swagger**：自动生成 API 文档，支持自定义
- **内容协商**：根据 `Accept` 头自动选择响应格式
- **ProblemDetails**：RFC 7807 标准化错误响应
- **CancellationToken**：支持请求取消，提升资源利用率
- **响应压缩**：启用 Gzip/Brotli，减少带宽消耗
- **JSON 序列化**：System.Text.Json vs Newtonsoft.Json，根据需求选择

回顾全文，记住三个核心原则：

1. **选择合适的工具**：根据场景选择 Minimal API vs Controllers、ActionResult<T> vs IActionResult
2. **遵循标准化**：使用 ProblemDetails 标准化错误响应，使用 OpenAPI 标准化文档
3. **关注性能和用户体验**：启用响应压缩、支持请求取消、配置合理上传限制
