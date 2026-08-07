---
tags:
  - aspnetcore
category: aspnetcore
categories:
  - 面试
  - aspnetcore
date: 2026-05-07T16:19:00
banner: /images/aspnetcore1.webp
title: ASP.NET Core 面试题 - 中间件管道
related:
  - "[[单例到底能不能依赖 Scoped 和 Transient？—— 构造函数注入的硬性限制与 IServiceProvider 的安全解法]]"
  - "[[aspnetcore-依赖注入三生命周期完全指南]]"
  - "[[为什么在约定型中间件中只有-InvokeAsync-的参数能注入-Scoped-服务-而构造函数却不能]]"
---

# ASP.NET Core 面试题 - 中间件管道


> 一份系统性的中间件知识地图，从“是什么”到“为什么”，再到“怎么用”，帮助你在面试中游刃有余。

在 ASP.NET Core 的面试中，**中间件（Middleware）** 几乎是必考的核心主题。它不仅是请求管道的基石，更承载着认证、授权、日志、异常处理、静态文件等关键横切关注点。

理解中间件，意味着理解整个 ASP.NET Core 请求处理流程的骨架。

---

## 第一部分：基石与基础（必答送分题）

### 什么是中间件？

**中间件是构成 ASP.NET Core 请求处理管道的核心组件**。整个管道由一系列中间件**按顺序串联**而成，每个请求都会像流水线一样依次流经每一个中间件。

> [!summary]
> **中间件是构成 HTTP 请求管道的组件**，具备以下特征：
> - 可处理入站请求和出站响应。
> - 可选择将请求传递给管道中的**下一个**中间件，或**短路**（终止）管道。
> - 执行顺序严格按照在 `Program.cs` 中**注册的顺序**。
> - 每个中间件可在 `next` 前后执行代码（前置处理请求，后置处理响应）。

#### 核心模型：责任链 + 洋葱

可以把中间件管道想象成一个**洋葱结构**：

```
        ┌─────────────────────────────────────────────┐
        │  中间件 A（最外层）                         │
        │  ┌─────────────────────────────────────┐    │
        │  │  中间件 B                           │    │
        │  │  ┌─────────────────────────────┐    │    │
        │  │  │  中间件 C                   │    │    │
        │  │  │  ┌─────────────────────┐    │    │    │
        │  │  │  │  终结点（核心）      │    │    │    │
        │  │  │  └─────────────────────┘    │    │    │
        │  │  └─────────────────────────────┘    │    │
        │  └─────────────────────────────────────┘    │
        └─────────────────────────────────────────────┘
             请求方向 →  →  →  →  →  →  →  →  →  
             响应方向 ←  ←  ←  ←  ←  ←  ←  ←  ←  
```

#### 执行时机（面试核心考点）

每个中间件有 **3 个关键执行时机**：

| 时机 | 代码位置 | 对应阶段 |
|------|---------|---------|
| **① 前置逻辑** | `await next()` **之前** | 请求**进入**阶段（可读请求、改请求头、日志、认证） |
| **② 核心逻辑** | `await next()` 的**内部** | 请求**流转**到下一个中间件，直至终结点 |
| **③ 后置逻辑** | `await next()` **之后** | 响应**返回**阶段（可改响应头、日志、异常处理） |

**代码映射：**

```csharp
app.Use(async (context, next) => 
{
    // ① 前置逻辑：请求刚进来
    Console.WriteLine("请求开始");
    
    await next(); // ② 核心逻辑：调用后续中间件，直至终结点
    
    // ③ 后置逻辑：响应要出去了
    Console.WriteLine("响应结束");
});
```

#### 三个关键特性

| 特性 | 说明 |
|------|------|
| **① 顺序可控** | 执行顺序 = `Program.cs` 中 `app.UseXxx()` 的**注册顺序**（先注册先执行） |
| **② 短路能力** | 任何中间件都可通过**不调用 `next`** 来终止管道，直接返回响应 |
| **③ 双向可见** | 中间件可同时操作**入站请求**（前置）和**出站响应**（后置） |

> 💡 **面试开场白（一句话总结）**
>
> “中间件是 ASP.NET Core 请求管道的**基本单元**，所有中间件按注册顺序构成一条**双向流转的链**。请求从最外层流向最内层，响应反向返回。每个中间件都能在请求进/出时执行逻辑，也可随时中止整个管道。”

---

### 如何配置中间件管道？（.NET 6+ 与旧版差异）

**.NET 6+（最小主机模型）**

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseMiddleware<CustomMiddleware>();
app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers(); // 推荐隐式路由

// ⚠️ 注意区分：这里 app.Run() 是启动应用，非注册终止中间件！
app.Run(); 
```

> **面试重点**：若想注册**终止中间件**作为兜底（如 404），必须传委托：`app.Run(async context => { await context.Response.WriteAsync("404"); });`，无参重载不存在，写错会编译报错！

**.NET Core 3.1（Startup.cs 风格）**

```csharp
public void Configure(IApplicationBuilder app)
{
    app.UseRouting();
    app.UseEndpoints(endpoints => { endpoints.MapControllers(); });
    
    // 终止中间件必须带委托
    app.Run(async context => { context.Response.StatusCode = 404; });
}
```

---

### `app.Use`、`UseMiddleware<T>`、`app.Run`、`app.Map` 的区别

| 方法 | 类型 | 说明 |
|------|------|------|
| `app.Use` | 非终止 | 可调用 `next` 的匿名中间件 |
| `app.UseMiddleware<T>` | 非终止 | 注册自定义中间件类（支持依赖注入） |
| `app.Run` | **终止** | **必须接收委托**，不调用 `next`，终结管道 |
| `app.Map` | 分支 | 基于 URL 路径前缀创建**分支子管道**（如 `/api`） |

**代码示例：**

```csharp
app.Use(async (context, next) => {
    await next(); // 调用下一个
});

app.Run(async context => {
    await context.Response.WriteAsync("Terminal"); // 不调用 next
});
```

---

### 如何编写自定义中间件？

> [!summary]
> - 类名通常以 `Middleware` 结尾。
> - 构造函数注入 `RequestDelegate _next` 及**单例/瞬态**服务。
> - 核心方法 `InvokeAsync` 或 `Invoke`。
> - **🚨 致命陷阱**：中间件是**单例（Singleton）**。若需使用 `DbContext` 等 **Scoped 服务**，**绝不能**在构造函数注入（会运行时异常），必须写在 `InvokeAsync` 参数中！

实现自定义中间件有 **三种方式**，它们的适用场景、生命周期和实例化机制完全不同。面试官常会追问：“除了写类，还有别的方式吗？”以及“为什么不能构造注入 Scoped 服务？报错原理是什么？”

#### 方式一：内联匿名中间件（`app.Use`）

- **写法**：直接在 `Program.cs` 中用 Lambda 注册，无需新建类。
- **适用场景**：逻辑极简单（如单次请求日志打印）、或临时测试，不需要复用。
- **特点**：**无法进行构造函数依赖注入**（因为它是委托，不是由 DI 容器实例化的）。如果需要服务，只能通过闭包捕获，或通过 `context.RequestServices` 手动解析。

```csharp
app.Use(async (context, next) => 
{
    // 前置逻辑
    Console.WriteLine("请求进来了");
    
    // 手动解析 Scoped 服务（不推荐，但可行）
    var dbContext = context.RequestServices.GetRequiredService<MyDbContext>();
    
    await next(); // 调用下一个中间件
    
    // 后置逻辑
    Console.WriteLine("响应要出去了");
});
```

#### 方式二：基于约定的中间件类（`UseMiddleware<T>`）

- **写法**：创建一个公开类，构造函数接收 `RequestDelegate`，并包含 `Invoke` 或 `InvokeAsync` 方法。
- **适用场景**：逻辑复杂、需要复用、或需要利用依赖注入（**主流生产写法**）。
- **关键面试点**：这个类**本身由 DI 容器实例化**，但它的生命周期是 **Singleton（单例）**。这是所有 DI 陷阱的根源！

```csharp
public class CustomMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<CustomMiddleware> _logger; // ✅ 瞬态/单例可构造注入

    public CustomMiddleware(RequestDelegate next, ILogger<CustomMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // 核心逻辑
        await _next(context);
    }
}

// 注册：app.UseMiddleware<CustomMiddleware>();
```

#### 方式三：实现 `IMiddleware` 接口（基于工厂的中间件）

> 这种方式在官方文档中被称为 **“基于工厂的中间件”** ，它最大的特点是**完美解决了传统方式无法在构造函数中注入 Scoped 服务的痛点**。

- **写法**：类实现 `Microsoft.AspNetCore.Http.IMiddleware` 接口，只需实现一个 `InvokeAsync` 方法。
- **核心机制**：`UseMiddleware<T>()` 扩展方法会检查注册类型是否实现了 `IMiddleware` 接口。如果是，则**不再使用基于约定的激活逻辑**，而是通过容器中注册的 `IMiddlewareFactory` 来解析实例。
- **生命周期**：中间件在 DI 容器中注册为 **Scoped 或 Transient** 服务，**按每个请求激活**，因此 **Scoped 服务可以直接注入构造函数**。

```csharp
// 1. 实现 IMiddleware 接口
public class FactoryActivatedMiddleware : IMiddleware
{
    private readonly MyDbContext _dbContext;  // ✅ Scoped 服务，直接构造注入！

    public FactoryActivatedMiddleware(MyDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        // 业务逻辑，可直接使用 _dbContext
        await next(context);
    }
}
```

```csharp
// 2. 在 DI 容器中注册（必须！）
builder.Services.AddScoped<FactoryActivatedMiddleware>();

// 3. 在管道中使用（与之前完全一样）
app.UseMiddleware<FactoryActivatedMiddleware>();
```

**核心优势（为什么需要这种方式？）**

| 优势 | 说明 |
|------|------|
| **构造函数可注入 Scoped 服务** | 按请求激活，Scoped 服务可直接在构造函数中注入 |
| **强类型** | 实现接口而非依赖方法签名约定，IDE 智能提示更友好 |
| **与第三方 DI 容器集成更灵活** | 可通过自定义 `IMiddlewareFactory` 接管中间件的实例化过程 |

**⚠️ 重要限制（面试坑点）**

与约定方式不同，工厂激活的中间件**不支持**在 `UseMiddleware<T>` 中传递参数。以下写法会在**运行时**抛出 `NotSupportedException`：

```csharp
// ❌ 这样写会报错！
app.UseMiddleware<FactoryActivatedMiddleware>(someOption);
```

如果需要传递配置参数，应通过 `IOptions<T>` 等方式在构造函数中注入。

**💡 面试加分点**

当被问到“什么时候应该用 `IMiddleware` 方式？”时，可以这样回答：

> “当我的自定义中间件需要注入 `DbContext`、`IOptionsSnapshot` 等 Scoped 服务时，我会选择实现 `IMiddleware` 接口。因为这种方式下中间件是**按请求激活**的，Scoped 服务可以直接在构造函数中注入，代码更简洁，也避免了在 `InvokeAsync` 方法中通过参数注入的写法。不过需要注意，这种方式**必须先在 DI 容器中注册**，而且**不能通过 `UseMiddleware<T>` 传递参数**。”

#### 🚨 致命陷阱：基于约定的中间件构造函数中注入 Scoped 服务会发生什么？

**1. 具体报错信息（运行时）**

当你这样写时：

```csharp
public class BadMiddleware
{
    private readonly RequestDelegate _next;
    private readonly MyDbContext _dbContext; // ❌ 危险！

    public BadMiddleware(RequestDelegate next, MyDbContext dbContext)
    {
        _next = next;
        _dbContext = dbContext;
    }
}
```

应用启动后，第一个请求进来时，会抛出以下异常：

> **`System.InvalidOperationException: Cannot resolve scoped service 'MyDbContext' from root provider.`**

**2. 底层原理（为什么报错？）**

- **中间件实例化机制**：当调用 `app.UseMiddleware<BadMiddleware>()` 时，框架内部会通过 **`ActivatorUtilities`** 从 DI 容器中解析构造函数参数。
- **作用域溯源**：由于中间件在应用启动时就被注册，它是由 **根服务提供者（Root Service Provider）** 实例化的。根作用域（Root Scope）的生命周期等同于应用生命周期。
- **Scoped 服务的约束**：Scoped 服务被设计为**每个请求一个实例**。根作用域**根本不拥有** Scoped 服务的实例。
- **运行时报错**：当 `ActivatorUtilities` 尝试从根作用域中提取 `MyDbContext` 时，容器发现该服务注册为 Scoped，但当前作用域是 Root，于是抛出异常。

> 💡 **面试标准答案**
>
> **“单例（Singleton）不能直接引用 Scoped 服务，因为单例由根容器提供，生命周期与应用同长；而 Scoped 服务每个请求新建一次，由请求子容器提供。若强行注入，根容器无法解析，会抛出 `InvalidOperationException`。正确做法是将 Scoped 服务注入到中间件的 `InvokeAsync` 方法参数中，由框架从当前请求作用域自动解析。”**

#### 💡 进阶：扩展方法注册（生产级写法）

为了让 `Program.cs` 更整洁，通常会给自定义中间件封装一个静态扩展方法：

```csharp
public static class CustomMiddlewareExtensions
{
    public static IApplicationBuilder UseCustomMiddleware(this IApplicationBuilder app)
    {
        return app.UseMiddleware<CustomMiddleware>();
    }
}

// Program.cs 中使用：app.UseCustomMiddleware();
```

面试时提及此点，能体现你对代码优雅性的追求。

#### 三种方式对比总结

| 对比维度 | 内联匿名 (`app.Use`) | 约定类 (`UseMiddleware<T>`) | **`IMiddleware` 接口** |
|---------|---------------------|----------------------------|----------------------|
| **实现方式** | Lambda 委托 | 鸭子类型（约定方法名） | 实现 `IMiddleware` 接口 |
| **是否由 DI 实例化** | ❌ | ✅（由 `ActivatorUtilities`） | ✅（由 `IMiddlewareFactory`） |
| **实例生命周期** | 无 | **Singleton**（构造一次） | **Scoped / Transient**（每请求激活） |
| **构造函数能否注入 Scoped 服务** | N/A | ❌ 会报错 | ✅ **可以** |
| **能否传参给 `UseMiddleware<T>`** | N/A | ✅ 支持 | ❌ **不支持**，会抛异常 |
| **适用场景** | 极简临时逻辑 | 大部分生产场景 | 需要使用 Scoped 服务的中间件 |

---

### `RequestDelegate` 是什么？

- 它是管道中**下一个中间件**的委托定义：`public delegate Task RequestDelegate(HttpContext context);`
- 它负责将控制权从当前中间件传递给下一个，是构成委托链的核心。

---

## 第二部分：流转、顺序与底层原理（考察内功）

### 中间件顺序为什么重要？（经典排序题）

管道按注册顺序执行，顺序错了**不会编译报错，但功能会乱**。

**标准推荐顺序**（从外到内）：

```
UseExceptionHandler / UseDeveloperExceptionPage
→ UseHttpsRedirection
→ UseStaticFiles
→ UseRouting
→ UseCors
→ UseAuthentication
→ UseAuthorization
→ MapControllers / UseEndpoints
```

> **特别注意**：`UseCors` 必须在 `UseRouting` **之后**，`UseAuthorization` **之前**，这样 CORS 预检请求才能精准匹配终结点。

---

### 什么是“洋葱模型”？请求/响应如何流转？

- 请求按注册顺序**正向**穿过所有中间件（像剥洋葱），到达终结点。
- 响应则按**相反顺序**反向流回（像包洋葱）。
- **代码体现**：`await _next(context)` 之前的代码处理**请求**，之后的代码处理**响应**。

---

### 如何短路管道？

在中间件中**不调用 `await next()`** 即可终止。

```csharp
if (!context.User.Identity.IsAuthenticated)
{
    context.Response.StatusCode = 401;
    return; // 短路
}
await _next(context);
```

---

### `builder.Build()` 之后为什么不能再注册服务或中间件？

- `Build()` 是**分水岭**。之前通过 `builder.Services` 注册服务；之后 ASP.NET Core 核心管道及 `IServiceProvider` 已固化，试图再注册会抛出异常。

---

## 第三部分：生命周期与依赖注入（避坑重灾区）

### 中间件里用 `IOptionsSnapshot` 为什么会报错？

- `IOptionsSnapshot<T>` 是 **Scoped** 服务，中间件是 **Singleton**。构造函数中注入 Scoped 服务会冲突。
- **解决方案**：用 `IOptionsMonitor<T>`（Singleton）替代，或在 `InvokeAsync` 中注入 `IOptionsSnapshot<T>`。

### 为什么 `Cannot consume scoped service from singleton`？

- 正是由于中间件生命周期是单例，若强行注入 `DbContext` 等 Scoped 服务会触发此异常。
- **铁律**：**只有 `InvokeAsync` 的参数可以注入 Scoped 服务**，构造函数只允许 Singleton/Transient。

---

## 第四部分：内置中间件实战与调优（高频场景）

### `UseStaticFiles` 的位置与优化

- **作用**：提供 `wwwroot` 下的静态文件（CSS/JS/图片）。
- **位置**：必须放在 `UseRouting` **之前**（最好放管道最前面），这样静态文件请求可直接**短路**管道，跳过认证、日志等不必要的中间件，大幅提升性能。
- **自定义选项**：可配置缓存、文件提供程序、目录浏览等。

### 异常处理中间件

- `UseDeveloperExceptionPage()`：仅开发环境，显示详细堆栈。
- `UseExceptionHandler("/Error")`：生产环境，跳转到自定义错误页。
- 也可内联：`app.UseExceptionHandler(errorApp => { ... });`

### 认证与授权

- `UseAuthentication()`：验证身份（解析 Cookie/JWT）。
- `UseAuthorization()`：应用策略/角色权限。
- 必须在 `UseRouting` 之后，`UseEndpoints` 之前。

### CORS 跨域（精确顺序）

```csharp
builder.Services.AddCors(options => { /* 配置策略 */ });
app.UseRouting();
app.UseCors("MyPolicy"); // ✅ 正确位置：Routing 之后，Auth 之前
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
```

### HTTPS 重定向与转发头（反向代理场景）

- `UseHttpsRedirection()` 强制跳转 HTTPS。
- **反向代理场景**（Nginx/IIS）：必须使用 `UseForwardedHeaders` 中间件，从 `X-Forwarded-For` 头中还原真实客户端 IP，否则获取到的是代理内网 IP。

### 限流中间件（.NET 7+）

- 使用内置 `UseRateLimiter()`，可基于 IP、用户或并发数限制请求频率，防止服务过载。

---

## 第五部分：高级管道能力与架构认知（拉开差距）

### 终止中间件 vs 非终止中间件

| 类型 | 是否调用 `next` | 代表方法 |
|------|---------------|---------|
| 非终止 | 是 | `Use`, `UseMiddleware` |
| 终止 | **否** | `app.Run(委托)` |

### 分支管道：`Map` 与 `MapWhen` 的区别

- **`Map`**：按**路径前缀**硬匹配。

```csharp
app.Map("/api", branch => {
    branch.UseMiddleware<ApiMiddleware>();
});
```

- **`MapWhen`**：按**条件**（如 QueryString、Header）动态匹配。

```csharp
app.MapWhen(ctx => ctx.Request.Query.ContainsKey("token"), branch => { ... });
```

- **注意**：分支内的中间件**只对该分支生效**，且分支是独立子管道。

### `UseWhen` 与 `MapWhen` 有何不同？

- `MapWhen` 会**分支**管道，分支内的中间件执行完**不会**回到主管道。
- `UseWhen` 只是**有条件地**执行一个中间件，执行完后**会回到主管道**继续执行后续中间件。

### Kestrel 是什么？它在管道中的位置？

- Kestrel 是 ASP.NET Core 的**跨平台 Web 服务器**，是请求进入应用的**第一站**。它监听端口，将 HTTP 请求封装为 `HttpContext`，随后交给**中间件管道**处理。

### 中间件与 `IHostedService` / `BackgroundService` 如何协作？

- 两者**独立且互补**：中间件处理**每个请求**；后台服务处理**长时后台任务**（如消费消息队列）。
- **协作场景**：中间件将耗时任务入队，`BackgroundService` 异步消费；或后台服务更新缓存，中间件读取缓存响应请求。

---

## 第六部分：横向对比（迁移与选型必问）

### 中间件 vs 过滤器 (Filter) 有什么区别？

| 对比维度 | 中间件 (Middleware) | 过滤器 (Filter) |
|---------|-------------------|----------------|
| **作用层级** | 全局管道（底层） | MVC 控制器层（上层） |
| **适用场景** | 跨领域横切关注点（日志、异常、跨域、限流） | 控制器逻辑（模型验证、Action 拦截、结果格式化） |
| **能否访问路由数据** | ❌ 只能操作 `HttpContext` | ✅ 可访问 `ActionContext`、`ModelState`、路由参数 |
| **执行时机** | 终结点执行前/后 | 更精细（Action 执行前/后、结果执行前/后） |

### 中间件 vs 传统 ASP.NET 的 HttpModule 有什么区别？

- **本质**：`HttpModule` 基于事件订阅（IIS 生命周期）；中间件基于 `RequestDelegate` 委托链（更现代直观）。
- **顺序控制**：`HttpModule` 顺序复杂（依赖事件和 IIS）；中间件顺序**完全由代码注册顺序决定**，清晰可控。
- **平台**：`HttpModule` 依赖 IIS 仅限 Windows；中间件**跨平台**（Linux/macOS）。

---

## 第七部分：面试致命避坑清单（考前必看）

| 序号 | 避坑点 | 正确理解 |
|------|--------|----------|
| 1 | ❌ `app.Run()` 无参写法 | ✅ `app.Run` 必须传 `RequestDelegate` 委托；无参是 `WebApplication` 的启动方法，概念切勿混淆 |
| 2 | ❌ 中间件构造函数注入 Scoped 服务 | ✅ Scoped 服务（如 DbContext）必须在 `InvokeAsync` 参数中注入 |
| 3 | ❌ CORS 放在 `UseRouting` 之前 | ✅ 标准顺序：`UseRouting` → `UseCors` → `UseAuthentication` → `UseAuthorization` |
| 4 | ❌ `Map` 分支与主管道混淆 | ✅ `Map`/`MapWhen` 创建**独立分支**，分支内的中间件不影响主管道 |
| 5 | ❌ 把 `UseWhen` 当成 `MapWhen` | ✅ `UseWhen` 条件执行后**回归主管道**；`MapWhen` 分支执行后**不回归** |

---

## 小结

中间件是 ASP.NET Core 请求管道的核心骨架。理解它，就能理解整个框架的请求处理流程。

回顾全文，记住三个核心点：

1. **顺序决定一切**：中间件的注册顺序就是执行顺序，也是洋葱模型的外层到内层顺序。
2. **生命周期不可忽略**：单例中间件不能直接注入 Scoped 服务，这是面试中最常见的坑。
3. **短路与分支**：通过 `return` 可以随时终止管道；`Map` 和 `MapWhen` 可以创建独立的子管道。

