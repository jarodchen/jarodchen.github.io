---
tags: ["aspnetcore"]
category: .NET Core
categories:
  - 面试
  - 后端开发
date: 2026-05-07T16:19:00
banner: /images/aspnetcore1.webp
title: ASP.NET Core 面试题  过滤器（Filters）
description: 系统梳理 ASP.NET Core 中过滤器的核心知识点，涵盖五大过滤器类型、与中间件的区别、执行顺序、自定义过滤器、全局/局部注册、短路机制及最佳实践。
---

# ASP.NET Core 面试题 过滤器

> 过滤器是 MVC/Razor Pages 管道的“钩子”——让你在 Action 执行的不同阶段插入自定义逻辑，实现关注点分离。

在 ASP.NET Core 面试中，过滤器是 MVC 相关的**高频考点**。理解过滤器的类型、执行顺序、与中间件的区别，以及如何自定义过滤器，是构建高质量 Web 应用的关键。

本文将系统梳理过滤器的核心知识点，从基础概念到高级用法，从内置过滤器到自定义实现，一网打尽。

---

## 第一部分：基础认知篇

### 什么是过滤器（Filters）？

过滤器（Filters）是 **MVC 或 Razor Pages 管道中的组件**，允许在控制器 Action 执行的不同阶段插入自定义逻辑。它们是实现**横切关注点**（Cross-cutting Concerns）的理想方式。

#### 五大过滤器类型

ASP.NET Core 提供 **5 大类过滤器**，按执行顺序排列：

| 类型 | 执行阶段 | 核心接口 | 典型用途 |
|------|---------|---------|----------|
| **① Authorization Filter** | 管道最早执行 | `IAuthorizationFilter` / `IAsyncAuthorizationFilter` | 身份验证、权限检查 |
| **② Resource Filter** | 模型绑定之前/之后 | `IResourceFilter` / `IAsyncResourceFilter` | 缓存、请求短路、性能监控 |
| **③ Action Filter** | Action 方法执行前后 | `IActionFilter` / `IAsyncActionFilter` | 日志、参数校验、性能监控 |
| **④ Exception Filter** | Action/Result 出现异常时 | `IExceptionFilter` / `IAsyncExceptionFilter` | 统一异常处理（MVC 管道内） |
| **⑤ Result Filter** | Result 执行前后 | `IResultFilter` / `IAsyncResultFilter` | 结果包装、响应格式化 |

#### 过滤器执行顺序（完整流程图）

```
请求进入
    ↓
① Authorization Filter（授权过滤器）
    ├── OnAuthorization
    │   └── 可短路（设置 Result）
    ↓ （授权通过）
② Resource Filter（资源过滤器）
    ├── OnResourceExecuting（执行前）
    │   └── 可短路
    ↓
    ├── 模型绑定
    ↓
③ Action Filter（操作过滤器）
    ├── OnActionExecuting（执行前）
    │   └── 可短路
    ↓
    ├── Action 方法执行
    ↓
    ├── OnActionExecuted（执行后）
    ↓
    ├── 执行 Result（如 View() / Json()）
    ↓
④ Result Filter（结果过滤器）
    ├── OnResultExecuting（执行前）
    │   └── 可短路
    ↓
    ├── 结果输出（如渲染 HTML / 序列化 JSON）
    ↓
    ├── OnResultExecuted（执行后）
    ↓
② Resource Filter（资源过滤器）
    ├── OnResourceExecuted（执行后）
    ↓
    （如果 Action 或 Result 中抛出异常）
    ↓
⑤ Exception Filter（异常过滤器）
    ├── OnException
    ↓
响应返回
```

#### 过滤器执行顺序的关键规则

| 规则 | 说明 |
|------|------|
| **类型顺序固定** | Authorization → Resource → Action → Result → Exception |
| **同类型按注册顺序** | 可通过 `Order` 属性控制优先级 |
| **嵌套执行** | `OnActionExecuting` → Action → `OnActionExecuted` |
| **短路终止** | 设置 `context.Result` 可提前终止，后续过滤器不再执行 |

---

### 过滤器的执行上下文（Filter Context）

过滤器通过上下文对象访问请求信息和控制执行流程：

| 上下文类型 | 接口 | 可访问内容 | 可控制行为 |
|-----------|------|-----------|-----------|
| `AuthorizationFilterContext` | `IAuthorizationFilter` | HttpContext、路由数据、Action 描述 | 设置 `Result` 短路 |
| `ResourceExecutingContext` | `IResourceFilter` | HttpContext、Action 描述、模型状态 | 设置 `Result` 短路 |
| `ResourceExecutedContext` | `IResourceFilter` | HttpContext、Action 描述、异常信息 | 设置 `ExceptionHandled` |
| `ActionExecutingContext` | `IActionFilter` | HttpContext、Action 参数、控制器实例 | 设置 `Result` 短路 |
| `ActionExecutedContext` | `IActionFilter` | HttpContext、Action 返回值、异常信息 | 设置 `ExceptionHandled` |
| `ResultExecutingContext` | `IResultFilter` | HttpContext、Result 实例 | 设置 `Cancel` 取消执行 |
| `ResultExecutedContext` | `IResultFilter` | HttpContext、Result 实例、异常信息 | 设置 `ExceptionHandled` |
| `ExceptionContext` | `IExceptionFilter` | HttpContext、异常信息 | 设置 `Result` 和 `ExceptionHandled` |

---

## 第二部分：过滤器 vs 中间件

### Filters 与 Middleware 的区别

这是面试中的**高频对比题**：

| 对比维度 | 中间件（Middleware） | 过滤器（Filter） |
|---------|---------------------|------------------|
| **执行层级** | 全局 HTTP 管道 | MVC/Razor Pages 管道内部 |
| **作用范围** | 所有请求 | 仅控制器 / Action |
| **能否访问路由数据** | ❌ 只能操作 `HttpContext` | ✅ 可访问 `ActionContext`、路由数据、模型状态 |
| **适用场景** | 跨领域横切关注点（认证、CORS、静态文件、全局异常） | MVC 特定关注点（授权、模型验证、结果处理） |
| **依赖注入** | 构造函数注入（Singleton） | 支持多种生命周期，但需注意作用域 |
| **短路能力** | 不调用 `next` 即可终止整个请求管道 | 设置 `context.Result` 终止 MVC 管道 |
| **精细化程度** | 粗粒度（请求级别） | 细粒度（Action 级别） |

#### 选型决策

```
需要处理的逻辑是否与 MVC 强相关？
├── ❌ 否 → 使用中间件（认证、CORS、HTTPS、静态文件）
└── ✅ 是
    ├── 需要访问控制器、路由数据、Action 参数、ModelState？
    │   └── ✅ 使用过滤器
    ├── 需要处理 Action 返回结果？
    │   └── ✅ 使用 Result Filter
    └── 需要处理 MVC 管道中的异常？
        └── ✅ 使用 Exception Filter
```

#### 代码示例：中间件 vs 过滤器访问路由数据

```csharp
// ❌ 中间件：无法访问路由数据
app.Use(async (context, next) =>
{
    // context.GetRouteData() 在中间件中不可用
    await next();
});

// ✅ 过滤器：可访问路由数据
public class RouteLogFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        var routeData = context.RouteData;
        var controller = routeData.Values["controller"];
        var action = routeData.Values["action"];
        var id = routeData.Values["id"];
        
        Console.WriteLine($"访问：{controller}/{action}/{id}");
    }
}
```

---

## 第三部分：内置过滤器

ASP.NET Core 提供多个内置过滤器特性，开箱即用：

| 内置特性 | 类型 | 用途 |
|---------|------|------|
| `[Authorize]` | Authorization Filter | 身份验证和授权 |
| `[AllowAnonymous]` | Authorization Filter | 允许匿名访问 |
| `[ServiceFilter]` | 通用 | 从 DI 容器解析过滤器 |
| `[TypeFilter]` | 通用 | 从 DI 容器解析过滤器（支持参数） |
| `[ResponseCache]` | Resource/Action Filter | 响应缓存控制 |
| `[ValidateAntiForgeryToken]` | Authorization Filter | 防 CSRF 攻击 |

#### 使用示例

```csharp
// Authorize：身份验证
[Authorize(Roles = "Admin")]
public IActionResult AdminPanel() => View();

// AllowAnonymous：跳过认证
[AllowAnonymous]
public IActionResult Login() => View();

// ResponseCache：响应缓存
[ResponseCache(Duration = 60, Location = ResponseCacheLocation.Client)]
public IActionResult GetProduct(int id) => View();

// ServiceFilter：从 DI 容器解析
[ServiceFilter(typeof(LogFilter))]
public IActionResult Dashboard() => View();

// TypeFilter：从 DI 容器解析（支持传参）
[TypeFilter(typeof(LogFilter), Arguments = new object[] { "参数值" })]
public IActionResult Settings() => View();
```

---

## 第四部分：自定义过滤器

### 自定义 Action Filter

#### 同步实现

```csharp
public class LogActionFilter : IActionFilter
{
    private readonly ILogger<LogActionFilter> _logger;

    public LogActionFilter(ILogger<LogActionFilter> logger)
    {
        _logger = logger;
    }

    public void OnActionExecuting(ActionExecutingContext context)
    {
        var controller = context.RouteData.Values["controller"];
        var action = context.RouteData.Values["action"];
        
        _logger.LogInformation("Action 开始：{Controller}/{Action}", controller, action);
        
        // 可访问请求参数
        var parameters = context.ActionArguments;
        foreach (var param in parameters)
        {
            _logger.LogDebug("参数：{Key} = {Value}", param.Key, param.Value);
        }
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
        var controller = context.RouteData.Values["controller"];
        var action = context.RouteData.Values["action"];
        
        if (context.Exception != null && !context.ExceptionHandled)
        {
            _logger.LogError(context.Exception, "Action 异常：{Controller}/{Action}", controller, action);
            context.ExceptionHandled = true;  // 标记已处理
        }
        else
        {
            _logger.LogInformation("Action 完成：{Controller}/{Action}", controller, action);
        }
    }
}
```

#### 异步实现

```csharp
public class AsyncLogActionFilter : IAsyncActionFilter
{
    private readonly ILogger<AsyncLogActionFilter> _logger;

    public AsyncLogActionFilter(ILogger<AsyncLogActionFilter> logger)
    {
        _logger = logger;
    }

    public async Task OnActionExecutionAsync(
        ActionExecutingContext context,
        ActionExecutionDelegate next)
    {
        // Action 执行前
        _logger.LogInformation("Action 开始：{Action}", context.ActionDescriptor.DisplayName);
        
        var resultContext = await next();  // 调用下一个过滤器或 Action
        
        // Action 执行后
        if (resultContext.Exception != null && !resultContext.ExceptionHandled)
        {
            _logger.LogError(resultContext.Exception, "Action 异常");
            resultContext.ExceptionHandled = true;
        }
        else
        {
            _logger.LogInformation("Action 完成");
        }
    }
}
```

#### 同步 vs 异步

| 对比 | 同步（`IActionFilter`） | 异步（`IAsyncActionFilter`） |
|------|------------------------|----------------------------|
| **方法** | `OnActionExecuting` / `OnActionExecuted` | `OnActionExecutionAsync` |
| **适用场景** | 简单逻辑 | I/O 操作、数据库查询、HTTP 调用 |
| **性能** | 无异步开销 | 适合 I/O 密集型操作 |

---

### 自定义 Authorization Filter

```csharp
public class CustomAuthorizationFilter : IAuthorizationFilter
{
    private readonly ILogger<CustomAuthorizationFilter> _logger;

    public CustomAuthorizationFilter(ILogger<CustomAuthorizationFilter> logger)
    {
        _logger = logger;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;
        
        // 检查是否已认证
        if (!user.Identity?.IsAuthenticated ?? true)
        {
            _logger.LogWarning("未认证用户访问");
            context.Result = new UnauthorizedResult();
            return;
        }
        
        // 自定义权限检查
        var canAccess = user.HasClaim("Permission", "AdminAccess");
        if (!canAccess)
        {
            _logger.LogWarning("用户 {User} 无权限访问", user.Identity.Name);
            context.Result = new ForbidResult();  // 403
        }
    }
}
```

### 自定义 Resource Filter

```csharp
public class CustomResourceFilter : IResourceFilter
{
    private readonly IMemoryCache _cache;

    public CustomResourceFilter(IMemoryCache cache)
    {
        _cache = cache;
    }

    public void OnResourceExecuting(ResourceExecutingContext context)
    {
        var cacheKey = context.HttpContext.Request.Path;
        
        // 尝试从缓存获取响应
        if (_cache.TryGetValue(cacheKey, out string cachedResponse))
        {
            context.Result = new ContentResult
            {
                Content = cachedResponse,
                ContentType = "text/html"
            };
            // 短路：后续管道不再执行
        }
    }

    public void OnResourceExecuted(ResourceExecutedContext context)
    {
        // 缓存响应（如果未出错）
        if (context.Result is ContentResult contentResult && 
            context.Exception == null)
        {
            var cacheKey = context.HttpContext.Request.Path;
            _cache.Set(cacheKey, contentResult.Content, TimeSpan.FromMinutes(5));
        }
    }
}
```

### 自定义 Exception Filter

```csharp
public class CustomExceptionFilter : IExceptionFilter
{
    private readonly ILogger<CustomExceptionFilter> _logger;

    public CustomExceptionFilter(ILogger<CustomExceptionFilter> logger)
    {
        _logger = logger;
    }

    public void OnException(ExceptionContext context)
    {
        var ex = context.Exception;
        _logger.LogError(ex, "MVC 管道异常：{Path}", context.HttpContext.Request.Path);

        // 根据异常类型返回不同状态码
        var problem = new ProblemDetails
        {
            Title = "请求处理失败",
            Status = ex switch
            {
                ArgumentException => 400,
                KeyNotFoundException => 404,
                UnauthorizedAccessException => 403,
                _ => 500
            },
            Detail = ex.Message,
            Instance = context.HttpContext.Request.Path
        };

        context.Result = new ObjectResult(problem)
        {
            StatusCode = problem.Status
        };
        
        context.ExceptionHandled = true;  // 标记异常已处理
    }
}
```

### 自定义 Result Filter

```csharp
public class CustomResultFilter : IResultFilter
{
    private readonly ILogger<CustomResultFilter> _logger;

    public CustomResultFilter(ILogger<CustomResultFilter> logger)
    {
        _logger = logger;
    }

    public void OnResultExecuting(ResultExecutingContext context)
    {
        _logger.LogInformation("Result 生成开始");
        
        // 检查响应类型
        if (context.Result is ViewResult viewResult)
        {
            // 在视图渲染前添加数据
        }
    }

    public void OnResultExecuted(ResultExecutedContext context)
    {
        if (context.Exception != null && !context.ExceptionHandled)
        {
            _logger.LogError(context.Exception, "Result 生成异常");
            context.ExceptionHandled = true;
        }
        else
        {
            _logger.LogInformation("Result 生成完成");
        }
    }
}
```

---

## 第五部分：过滤器注册方式

### 三种注册方式

| 注册方式 | 作用范围 | 是否支持 DI | 示例 |
|---------|---------|------------|------|
| **全局注册** | 所有 Controller/Action | ✅ | `options.Filters.Add<LogFilter>()` |
| **特性应用（Attribute）** | 特定 Controller/Action | ❌（需继承 Attribute） | `[LogFilter]` |
| **ServiceFilter** | 特定 Controller/Action | ✅ | `[ServiceFilter(typeof(LogFilter))]` |
| **TypeFilter** | 特定 Controller/Action | ✅ | `[TypeFilter(typeof(LogFilter))]` |

#### 全局注册

```csharp
// Program.cs
services.AddControllers(options =>
{
    // 方式一：注册类型（DI 解析）
    options.Filters.Add<LogActionFilter>();
    
    // 方式二：注册实例（需手动创建）
    options.Filters.Add(new CustomActionFilter());
    
    // 方式三：注册特性类型
    options.Filters.Add(typeof(CustomAttributeFilter));
});
```

#### 局部注册（Attribute）

```csharp
// 特性实现（需继承 Attribute）
public class CustomAttributeFilter : Attribute, IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context) { }
    public void OnActionExecuted(ActionExecutedContext context) { }
}

// 使用
[CustomAttributeFilter]
public class HomeController : Controller
{
    [CustomAttributeFilter]
    public IActionResult Index() => View();
}
```

#### ServiceFilter

```csharp
// 1. 注册过滤器到 DI
services.AddScoped<LogActionFilter>();

// 2. 使用
[ServiceFilter(typeof(LogActionFilter))]
public IActionResult About() => View();
```

#### TypeFilter

```csharp
// TypeFilter 不需要在 DI 中显式注册，会自动解析
// 支持构造函数参数传递

[TypeFilter(typeof(LogActionFilter), Arguments = new object[] { "管理员" })]
public IActionResult Admin() => View();
```

#### ServiceFilter vs TypeFilter

| 对比 | ServiceFilter | TypeFilter |
|------|--------------|-----------|
| **DI 预注册要求** | ✅ 必须注册 | ❌ 无需预注册 |
| **构造函数参数传递** | ❌ 不支持 | ✅ 支持 |
| **性能** | 略快（已注册） | 略慢（需创建） |
| **适用场景** | 标准 DI 场景 | 需要传参或不想预注册 |

---

### 控制执行顺序（Order 属性）

```csharp
// 默认 Order = 0
[Authorize] // Order = 0
[ServiceFilter(typeof(LogFilter))] // Order = 0

// 指定 Order（值越小越先执行）
[Authorize(Order = 1)]
[ServiceFilter(typeof(LogFilter), Order = 0)] // 先执行
```

#### Order 规则

| 规则 | 说明 |
|------|------|
| **同一过滤器类型** | Order 值小的先执行 |
| **不同过滤器类型** | 类型顺序固定，Order 在类型内部排序 |
| **全局 vs 局部** | 全局过滤器先于局部过滤器（除非指定 Order） |

---

## 第六部分：高级特性篇

### 短路（Short-circuiting）过滤器

过滤器可通过设置 `Result` 属性提前终止执行，阻止后续管道运行。

#### Authorization Filter 中的短路

```csharp
public class CustomAuthFilter : IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        if (!context.HttpContext.User.Identity.IsAuthenticated)
        {
            // ✅ 短路：返回 401，后续过滤器不执行
            context.Result = new UnauthorizedResult();
        }
    }
}
```

#### Action Filter 中的短路

```csharp
public class ValidationFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (!context.ModelState.IsValid)
        {
            // ✅ 短路：返回验证错误，Action 不执行
            context.Result = new BadRequestObjectResult(context.ModelState);
        }
    }
}
```

#### Resource Filter 中的短路

```csharp
public class CacheFilter : IResourceFilter
{
    public void OnResourceExecuting(ResourceExecutingContext context)
    {
        var cachedData = GetFromCache();
        if (cachedData != null)
        {
            // ✅ 短路：直接返回缓存结果，跳过 Action 和 Result
            context.Result = new OkObjectResult(cachedData);
        }
    }
}
```

#### 短路后的执行路径

```
正常流程：Auth → Resource → Action → Result → 响应

短路（Auth Filter 设置 Result）：
Auth → Result（直接返回）→ 响应
（Resource、Action 均不执行）

短路（Action Filter 设置 Result）：
Auth → Resource → Action Filter（执行中短路）→ Result → 响应
（Action 本身不执行）
```

### 过滤器依赖注入（DI）

#### 支持 DI 的过滤器类型

| 过滤器类型 | 支持 DI | 说明 |
|-----------|---------|------|
| **Attribute 过滤器** | ❌ 不支持（构造函数需常量） | 特性构造参数必须是常量表达式 |
| **ServiceFilter** | ✅ 完全支持 | 从 DI 容器解析，可注入任何服务 |
| **TypeFilter** | ✅ 完全支持 | 自动从 DI 容器解析 |

#### 在 Attribute 过滤器中通过 `[FromServices]` 注入

```csharp
public class ServiceInjectedFilter : Attribute, IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        // 通过 ServiceLocator 手动解析（不推荐）
        var logger = context.HttpContext.RequestServices
            .GetRequiredService<ILogger<ServiceInjectedFilter>>();
        logger.LogInformation("执行中");
    }
}
```

#### 推荐做法：使用 ServiceFilter

```csharp
// 1. 定义过滤器（支持 DI）
public class LoggingFilter : IActionFilter
{
    private readonly ILogger<LoggingFilter> _logger;
    private readonly IMyService _service;

    public LoggingFilter(ILogger<LoggingFilter> logger, IMyService service)
    {
        _logger = logger;
        _service = service;
    }
    // ...
}

// 2. 注册到 DI
services.AddScoped<LoggingFilter>();

// 3. 使用
[ServiceFilter(typeof(LoggingFilter))]
public IActionResult Index() => View();
```

### 过滤器中的作用域服务（Scoped Services）

**关键问题**：过滤器默认生命周期与注册方式相关。

| 注册方式 | 过滤器生命周期 | 能否注入 Scoped 服务 |
|---------|---------------|---------------------|
| `services.AddScoped<MyFilter>()` + ServiceFilter | Scoped | ✅ 可以 |
| `services.AddSingleton<MyFilter>()` + ServiceFilter | Singleton | ❌ 不能注入 Scoped |
| 全局注册 `options.Filters.Add<MyFilter>()` | 与容器注册生命周期一致 | 取决于注册方式 |
| Attribute 过滤器 | 在 `OnActionExecuting` 中手动解析 | ✅ 可以（但需手动） |

#### 在 Attribute 过滤器中获取 Scoped 服务

```csharp
public class ScopedAwareFilter : Attribute, IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        // 从当前请求作用域解析
        var dbContext = context.HttpContext.RequestServices
            .GetRequiredService<AppDbContext>();
        // 使用 dbContext...
    }
}
```

---

### 全局过滤器 vs 局部过滤器

| 对比 | 全局过滤器 | 局部过滤器 |
|------|-----------|-----------|
| **作用范围** | 所有 Controller/Action | 特定 Controller/Action |
| **适用场景** | 日志、异常处理、全局验证 | 业务特定的权限、验证逻辑 |
| **执行顺序** | 先于局部过滤器 | 后于全局过滤器 |
| **维护** | 集中管理 | 按需应用 |

#### 实用示例：API 响应包装器

```csharp
// 全局异常处理
services.AddControllers(options =>
{
    options.Filters.Add<GlobalExceptionFilter>();
});

// 局部：仅在敏感操作使用
[ServiceFilter(typeof(AuditLogFilter))]
public IActionResult Delete(int id) => Ok();

// 局部：仅在管理后台使用
[TypeFilter(typeof(AdminAuthorizationFilter))]
public IActionResult AdminPanel() => View();
```

---

### Filters 与 Middleware 的最佳结合

| 关注点 | 推荐使用 | 原因 |
|--------|---------|------|
| 认证（Authentication） | Middleware | 全局，所有请求都需要 |
| 授权（Authorization） | Filter（Authorization Filter） | 需要访问路由和控制器 |
| CORS | Middleware | 全局，HTTP 级别 |
| 全局异常处理 | Middleware | 覆盖所有请求（含静态文件） |
| MVC 异常处理 | Filter（Exception Filter） | 仅需处理 MVC 管道异常 |
| 日志 | Middleware + Filter | Middleware 记录请求，Filter 记录 Action 详情 |
| 缓存 | Filter（Resource Filter） | 需要控制器和路由信息 |
| 模型验证 | Filter（Action Filter） | 利用 ModelState |
| 响应格式化 | Filter（Result Filter） | 需要访问 ActionResult |

#### 日志的完整覆盖

```csharp
// Middleware：记录所有请求
app.Use(async (context, next) =>
{
    _logger.LogInformation("请求开始：{Method} {Path}", 
        context.Request.Method, context.Request.Path);
    await next();
    _logger.LogInformation("请求完成：{StatusCode}", context.Response.StatusCode);
});

// Action Filter：记录 Action 参数和执行时间
public class TimingFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        context.HttpContext.Items["StartTime"] = DateTime.UtcNow;
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
        var start = context.HttpContext.Items["StartTime"] as DateTime?;
        if (start.HasValue)
        {
            _logger.LogInformation("Action 执行耗时：{Elapsed}ms", 
                (DateTime.UtcNow - start.Value).TotalMilliseconds);
        }
    }
}

// Result Filter：记录响应大小
public class ResponseSizeFilter : IResultFilter
{
    public void OnResultExecuted(ResultExecutedContext context)
    {
        var response = context.HttpContext.Response;
        _logger.LogInformation("响应大小：{Size} bytes", response.ContentLength ?? 0);
    }
}
```

---

## 第七部分：面试避坑清单

| 序号 | ❌ 常见错误 | ✅ 正确理解 |
|------|-----------|-----------|
| 1 | 混淆 Middleware 和 Filter | Middleware 是全局 HTTP 管道，Filter 是 MVC 管道 |
| 2 | 忘记过滤器执行顺序 | Authorization → Resource → Action → Result → Exception |
| 3 | 在 Singleton Filter 中注入 Scoped 服务 | Singleton 不能注入 Scoped，使用 ServiceFilter + Scoped 注册 |
| 4 | 在 Attribute Filter 构造函数中注入服务 | Attribute 构造函数不支持 DI，用 ServiceFilter 或手动解析 |
| 5 | 短路时忘记设置 Result | 必须设置 `context.Result` 才能真正短路 |
| 6 | 在 Exception Filter 中不标记 `ExceptionHandled` | 标记 `true` 避免异常继续冒泡 |
| 7 | 全局过滤器过多导致性能问题 | 全局过滤器应用于所有请求，注意性能影响 |
| 8 | 在 Action Filter 中直接修改 Action 参数 | 可以修改，但需注意副作用 |
| 9 | 认为 `Order` 可跨类型排序 | Order 仅在同类过滤器内排序 |
| 10 | 过滤器中使用同步 I/O | 支持异步实现（如 `IAsyncActionFilter`），避免阻塞线程 |

---

## 小结

过滤器是 ASP.NET Core MVC 管道中强大的扩展点，让你在 Action 执行的各个阶段插入自定义逻辑：

- **五大类型**：Authorization、Resource、Action、Exception、Result，各有其执行时机和用途
- **执行顺序**：类型顺序固定，同类通过 Order 控制
- **注册方式**：全局注册、ServiceFilter、TypeFilter、Attribute
- **短路机制**：设置 Result 可提前终止管道执行

回顾全文，记住三个核心原则：

1. **选择合适的类型**：根据需求选择正确的过滤器类型（认证用 Authorization、缓存用 Resource、日志用 Action、异常用 Exception、格式化用 Result）
2. **注意执行顺序**：理解过滤器执行顺序，避免逻辑冲突
3. **DI 生命周期匹配**：Singleton 不能注入 Scoped，注意服务生命周期
