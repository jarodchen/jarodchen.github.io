---
tags: ["aspnetcore"]
category: .NET Core
categories:
  - 面试
 
date: 2026-05-07T16:19:00
banner: /images/aspnetcore1.webp
title: ASP.NET Core 面试题 Web API
description: 系统梳理 ASP.NET Core 构建 RESTful API 的核心知识点，涵盖路由、模型绑定、版本管理、内容协商、安全、测试及性能优化等。
---

# ASP.NET Core 面试题 Web API

> 从 REST 基础到生产级 API 设计，一套完整的 ASP.NET Core Web API 知识体系。

在如今的开发环境中，Web API 已成为前后端分离架构的核心枢纽。无论是为 SPA 应用提供数据接口，还是构建微服务体系的通信基础，ASP.NET Core Web API 都是 .NET 开发者的必备技能。本文将系统性地梳理 Web API 的核心知识点，从 REST 理论基础到生产级最佳实践，一网打尽。

---

## 第一部分：REST 基础篇（必答送分题）

### 什么是 REST？如何在 ASP.NET Core 中设计 RESTful API？

#### REST 定义

**REST（Representational State Transfer，表述性状态转移）** 是 Roy Fielding 在 2000 年博士论文中提出的一种**分布式系统架构风格**。它不是一个协议，而是一组设计约束。

**REST 的六大约束**：

| 约束 | 说明 |
|------|------|
| **客户端-服务器** | 关注点分离，客户端负责 UI，服务器负责数据存储和业务逻辑 |
| **无状态** | 每个请求必须包含所有必要信息，服务器不保存客户端上下文 |
| **可缓存** | 响应应标明是否可缓存，以提高性能 |
| **分层系统** | 客户端不应关心它直接连接的是最终服务器还是中间代理 |
| **统一接口** | 统一的资源操作方式（URI + HTTP 方法 + 状态码） |
| **按需代码（可选）** | 服务器可向客户端返回可执行代码（如 JavaScript） |

#### RESTful API 设计原则

**1. 使用 HTTP 方法表达操作**

| HTTP 方法 | 操作 | 幂等性 | 安全性 | 说明 |
|-----------|------|--------|--------|------|
| `GET` | 查询资源 | ✅ 是 | ✅ 是 | 不应修改服务器状态 |
| `POST` | 创建资源 | ❌ 否 | ❌ 否 | 非幂等，多次创建会产生多个资源 |
| `PUT` | 全量更新 | ✅ 是 | ❌ 否 | 幂等，相同请求多次执行结果一致 |
| `PATCH` | 部分更新 | ❌ 否 | ❌ 否 | 非幂等（取决于实现），RFC 5789 |
| `DELETE` | 删除资源 | ✅ 是 | ❌ 否 | 幂等，删除不存在的资源返回 404 |

> **幂等性**：相同请求重复执行多次，产生的结果相同。`PUT` 请求无论执行多少次，资源的最终状态一致。

**2. URI 使用名词表示资源**

```
✅ 好的设计
GET    /api/users              → 查询用户列表
GET    /api/users/{id}         → 查询单个用户
POST   /api/users              → 创建用户
PUT    /api/users/{id}         → 更新用户
DELETE /api/users/{id}         → 删除用户

❌ 不好的设计（RPC 风格）
GET    /api/GetUsers
POST   /api/CreateUser
POST   /api/UpdateUser
```

**3. 使用合适的 HTTP 状态码**

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| `200 OK` | 成功 | GET、PUT、PATCH 成功 |
| `201 Created` | 资源已创建 | POST 成功创建资源，应返回 `Location` 头 |
| `204 No Content` | 成功但无返回体 | DELETE 成功 |
| `400 Bad Request` | 请求无效 | 参数验证失败 |
| `401 Unauthorized` | 未认证 | 缺少或无效的认证凭证 |
| `403 Forbidden` | 无权限 | 已认证但无权访问 |
| `404 Not Found` | 资源不存在 | URI 对应的资源不存在 |
| `409 Conflict` | 资源冲突 | 并发冲突、唯一键冲突 |
| `500 Internal Server Error` | 服务器错误 | 未预期的服务端异常 |

**4. 无状态通信**

每个请求必须包含处理所需的全部信息，服务器不保存任何客户端状态。认证信息（如 JWT）应在每个请求中携带。

**5. HATEOAS（超媒体驱动，可选）**

在响应中包含相关资源的链接，使客户端可以通过这些链接发现 API 能力，降低耦合度。

```json
{
    "id": 1,
    "name": "Product A",
    "links": [
        { "rel": "self", "href": "/api/products/1" },
        { "rel": "reviews", "href": "/api/products/1/reviews" }
    ]
}
```

> 💡 **面试金句**
>
> “REST 是一种架构风格而非协议，其核心是资源导向。我设计 RESTful API 时，会遵循：使用名词作为 URI、通过 HTTP 方法表达操作意图、合理使用状态码、保持无状态通信。在 ASP.NET Core 中，结合 `[ApiController]`、`[Route]` 特性和强类型 `ActionResult<T>` 可以很好地实现这些原则。”

---

## 第二部分：控制器与路由篇

### [ApiController] 特性及其优势

`[ApiController]` 是 ASP.NET Core 2.1 引入的特性，专为 Web API 控制器设计，提供了一系列智能默认行为。**强烈建议在所有 API 控制器上使用此特性**。

```csharp
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    // ...
}
```

#### 主要优势

**1. 自动模型验证**

控制器执行前自动检查 `ModelState`，验证失败时自动返回 `400 Bad Request`，无需手动编写 `if (!ModelState.IsValid)`。

```csharp
// ❌ 不再需要这样写
[HttpPost]
public IActionResult Create(User user)
{
    if (!ModelState.IsValid)  // [ApiController] 已自动处理
    {
        return BadRequest(ModelState);
    }
    // ...
}

// ✅ [ApiController] 自动处理验证失败
[HttpPost]
public IActionResult Create(User user)
{
    // 如果验证失败，请求根本不会进入这个方法
}
```

**2. 自动参数来源推断**

根据参数类型自动推断绑定来源，减少冗余特性标注：

| 参数类型 | 默认绑定来源 | 示例 |
|---------|------------|------|
| 简单类型（int, string, bool 等） | `[FromQuery]` 或 `[FromRoute]` | `int id` |
| 复杂类型（自定义类） | `[FromBody]` | `User user` |
| `IFormFile` | `[FromForm]` | `IFormFile file` |
| 特殊类型（CancellationToken 等） | 框架自动注入 | `CancellationToken ct` |

```csharp
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    // id → 从路由或查询字符串自动绑定
    [HttpGet("{id}")]
    public IActionResult Get(int id) { ... }
    
    // product → 从请求体 JSON 自动绑定
    [HttpPost]
    public IActionResult Create(Product product) { ... }
}
```

> ⚠️ **注意**：自动推断也有陷阱——如果复杂类型同时从多个来源绑定，可能导致歧义。推荐在**复杂场景**中**显式标注** `[FromXxx]` 特性。

**3. 标准化错误响应**

验证失败时返回 `ProblemDetails` 格式（RFC 7807），客户端可统一解析错误信息：

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

**4. 多体参数限制**

`[ApiController]` 会限制 `[FromBody]` 参数最多只能有一个，避免了传统 ASP.NET MVC 中多个复杂参数从同一个请求体绑定的混乱。

#### 典型用法

```csharp
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    [HttpPost]
    public ActionResult<User> Create(User input)
    {
        // 验证失败会自动返回 400，代码更简洁
        return CreatedAtAction(nameof(GetUser), new { id = input.Id }, input);
    }

    [HttpGet("{id}")]
    public ActionResult<User> GetUser(int id)
    {
        var user = new User { Id = id, Name = "Alice" };
        return Ok(user);
    }
}
```

> **最佳实践**：`[ApiController]` + `ControllerBase` + `ActionResult<T>` 是 ASP.NET Core Web API 的标准组合。

---

### Web API 路由约定

ASP.NET Core Web API **强烈推荐使用属性路由**（Attribute Routing），而非传统集中式路由。

#### 属性路由基础

```csharp
[ApiController]
[Route("api/[controller]")]  // [controller] 替换为控制器名（去掉 Controller 后缀）
public class ProductsController : ControllerBase
{
    [HttpGet]  // GET api/products
    public IActionResult GetAll() => Ok(new[] { new { Id = 1 } });
    
    [HttpGet("{id:int}")]  // GET api/products/5
    public IActionResult GetById(int id) => Ok(new { Id = id });
}
```

#### 路由模板语法

| 语法 | 说明 | 示例 |
|------|------|------|
| `{参数}` | 基本占位符 | `/products/{id}` → `/products/5` |
| `{参数:类型}` | 类型约束 | `/products/{id:int}` → 仅匹配整数 |
| `{参数?}` | 可选参数 | `/products/{id?}` → 可省略 |
| `{参数=默认值}` | 默认值 | `/products/{page=1}` → 默认 1 |
| `{*参数}` | 捕获所有 | `/files/{*path}` → 匹配剩余路径 |
| `[controller]` | 控制器名占位符 | 自动替换为 `ProductsController` → `Products` |
| `[action]` | 操作名占位符 | 自动替换为方法名 `GetById` |

#### 可用约束类型

| 约束 | 说明 | 示例 |
|------|------|------|
| `int` | 整数 | `{id:int}` |
| `bool` | 布尔值 | `{active:bool}` |
| `datetime` | 日期时间 | `{date:datetime}` |
| `decimal` | 小数 | `{price:decimal}` |
| `guid` | GUID | `{id:guid}` |
| `long` | 长整数 | `{id:long}` |
| `minlength(n)` | 最小长度 | `{name:minlength(3)}` |
| `maxlength(n)` | 最大长度 | `{name:maxlength(20)}` |
| `length(n,m)` | 长度范围 | `{name:length(3,20)}` |
| `regex(表达式)` | 正则匹配 | `{id:regex(^[a-zA-Z0-9]+$)}` |

#### 传统路由（集中式）

```csharp
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");
```

对应的 URL：`/Products/Get/5`

> **选型建议**：
> - **Web API** → 属性路由（灵活、直观、与资源绑定紧密）
> - **传统 MVC 页面** → 集中路由 + 属性路由混合
> - **大小写**：路由匹配不区分大小写，但 REST 社区推荐统一使用小写 URI

---

### API 版本管理

API 版本管理允许 API 在演进时保持向后兼容。通过 `Microsoft.AspNetCore.Mvc.Versioning` 包实现。

**安装**：

```bash
dotnet add package Microsoft.AspNetCore.Mvc.Versioning
```

#### 配置

```csharp
services.AddApiVersioning(options =>
{
    options.ReportApiVersions = true;  // 响应头返回支持的版本
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.DefaultApiVersion = new ApiVersion(1, 0);
    
    // 支持多种版本读取方式
    options.ApiVersionReader = ApiVersionReader.Combine(
        new HeaderApiVersionReader("X-API-Version"),
        new QueryStringApiVersionReader("api-version")
    );
});
```

#### 四种版本管理方式

| 方式 | 示例 | 特点 |
|------|------|------|
| **URL Path** | `/api/v1/products` | 最直观，推荐 REST API |
| **Query String** | `/api/products?api-version=1.0` | 简单，URL 不变 |
| **Header** | `X-API-Version: 1.0` | 隐藏版本信息，URI 干净 |
| **Media Type** | `Accept: application/vnd.company.v1+json` | 符合 REST 理念，但复杂 |

#### 在控制器中使用

```csharp
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
public class ProductsController : ControllerBase
{
    [HttpGet]
    public IActionResult Get(ApiVersion version) { ... }
}

// 或使用 [ApiVersion] 特性
[ApiVersion("1.0")]
[ApiVersion("2.0")]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    [HttpGet, MapToApiVersion("1.0")]
    public IActionResult GetV1() { ... }
    
    [HttpGet, MapToApiVersion("2.0")]
    public IActionResult GetV2() { ... }
}
```

---

## 第三部分：数据交互篇

### 内容协商（Content Negotiation）

内容协商让 API 根据客户端的 `Accept` 请求头返回不同格式的响应（JSON、XML 等）。

#### 默认行为

- 默认仅支持 **JSON**（基于 `System.Text.Json`）
- 客户端请求 `Accept: application/json` 时返回 JSON
- 如果请求的格式不支持，默认返回 JSON（除非配置 `ReturnHttpNotAcceptable`）

#### 启用 XML 支持

```csharp
services.AddControllers()
    .AddXmlSerializerFormatters();  // 使用 XmlSerializer
    // 或 .AddXmlDataContractSerializerFormatters();  // 使用 DataContractSerializer
```

#### 配置严格内容协商

```csharp
services.AddControllers(options =>
{
    options.ReturnHttpNotAcceptable = true;  // 不支持时返回 406
});
```

#### 请求示例

```
GET /api/products/1
Accept: application/json    → 返回 JSON
Accept: application/xml     → 返回 XML
Accept: text/plain          → 返回 406（如果配置了严格模式）
```

#### 选择序列化器

| 序列化器 | 使用方式 | 特点 |
|---------|---------|------|
| `System.Text.Json` | 默认 | 性能好，.NET Core 3.0+ 默认 |
| `Newtonsoft.Json` | `AddNewtonsoftJson()` | 功能丰富，兼容性好 |
| `XmlSerializer` | `AddXmlSerializerFormatters()` | 传统 XML 序列化器 |
| `DataContractSerializer` | `AddXmlDataContractSerializerFormatters()` | 支持 `[DataContract]` 特性控制 |

---

### 参数绑定：Body、Query、Route、Form

ASP.NET Core 支持从多种来源绑定参数，可通过特性显式指定：

```csharp
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    [HttpPost("{id}")]
    public IActionResult Update(
        [FromRoute] int id,                    // 路由：/api/orders/5
        [FromQuery] string status,             // 查询字符串：?status=paid
        [FromBody] OrderUpdateRequest request, // 请求体 JSON
        [FromHeader] string authorization,     // 请求头：Authorization: Bearer xxx
        [FromForm] IFormFile file)             // 表单文件
    {
        // ...
    }
}
```

#### 参数来源推断规则

| 参数类型 | 默认来源 | 说明 |
|---------|---------|------|
| 简单类型（int, string, bool, DateTime 等） | `[FromQuery]` / `[FromRoute]` | 优先从路由，其次查询字符串 |
| 复杂类型（自定义类） | `[FromBody]` | JSON 请求体 |
| `IFormFile` | `[FromForm]` | 表单文件上传 |
| `CancellationToken`, `HttpContext` | 框架自动注入 | 不需要指定来源 |

> **最佳实践**：复杂场景下**显式标注**来源特性，代码可读性更高，避免歧义。

---

### 大文件上传与下载

#### 上传大文件

**小文件（< 28MB）**：使用 `IFormFile`

```csharp
[HttpPost("upload")]
public async Task<IActionResult> Upload(IFormFile file)
{
    // 文件已加载到内存/临时文件
    using var stream = file.OpenReadStream();
    // 处理...
}
```

**大文件（GB 级）**：使用流式上传，避免内存溢出

```csharp
[HttpPost("large-upload")]
[DisableFormValueModelBinding]  // 禁用模型绑定缓冲
public async Task<IActionResult> LargeUpload(CancellationToken ct)
{
    var request = HttpContext.Request;
    if (!request.HasFormContentType)
        return BadRequest("仅支持表单上传");

    var boundary = request.GetMultipartBoundary();
    var reader = new MultipartReader(boundary, request.Body);
    
    while (await reader.ReadNextSectionAsync(ct) is MultipartSection section)
    {
        if (string.IsNullOrEmpty(section.ContentDisposition))
            continue;
        
        using var stream = section.Body;
        // 流式处理：每次读取一块写入磁盘/云存储
        await ProcessStreamAsync(stream, ct);
    }
    
    return Ok();
}
```

**注意事项**：

- 配置 `FormOptions.MultipartBodyLengthLimit` 控制最大上传大小
- 禁用默认缓冲：避免整个文件加载到内存
- 生产环境建议使用 **分块上传 + 断点续传**

#### 下载大文件

```csharp
[HttpGet("download/{id}")]
public async Task<IActionResult> Download(string id)
{
    var filePath = Path.Combine("files", id);
    if (!System.IO.File.Exists(filePath))
        return NotFound();
    
    // FileStreamResult 流式返回，不加载到内存
    var stream = System.IO.File.OpenRead(filePath);
    var contentType = "application/octet-stream";
    return File(stream, contentType, Path.GetFileName(filePath));
}
```

**最佳实践**：

| 下载场景 | 推荐方式 | 说明 |
|---------|---------|------|
| 小文件（< 10MB） | `File(byte[], contentType, fileName)` | 一次性加载到内存 |
| 大文件（> 10MB） | `File(Stream, contentType, fileName)` | 流式写出 |
| 支持断点续传 | 实现 `Range` 请求 | 返回 `206 Partial Content` |

---

## 第四部分：错误处理与状态码篇

### 全局异常处理

#### 生产 vs 开发环境

```csharp
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();  // 开发环境：显示详细堆栈
}
else
{
    app.UseExceptionHandler("/error"); // 生产环境：返回友好错误
}
```

#### 统一返回 ProblemDetails（RFC 7807）

```csharp
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var feature = context.Features.Get<IExceptionHandlerFeature>();
        var ex = feature?.Error;

        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/problem+json";

        var problem = new ProblemDetails
        {
            Status = 500,
            Title = "An unexpected error occurred",
            Detail = "Please contact support with the trace ID",
            Instance = context.Request.Path
        };
        problem.Extensions["traceId"] = context.TraceIdentifier;

        await context.Response.WriteAsJsonAsync(problem);
    });
});
```

**返回示例**：

```json
{
    "type": "about:blank",
    "title": "An unexpected error occurred",
    "status": 500,
    "detail": "Please contact support with the trace ID",
    "instance": "/api/products",
    "traceId": "00-abc123def456-789"
}
```

> **位置建议**：异常处理中间件应放在管道**前部**（`UseRouting` 之前），确保能捕获后续所有中间件的异常。

---

### 返回合适的 HTTP 状态码

| 状态码 | 方法 | 使用场景 |
|--------|------|----------|
| `200 OK` | `return Ok(data)` | GET 成功返回数据 |
| `201 Created` | `return CreatedAtAction(nameof(Get), new { id }, data)` | POST 创建成功，带 Location |
| `204 No Content` | `return NoContent()` | PUT/DELETE 成功但无返回体 |
| `400 Bad Request` | `return BadRequest(message)` | 参数验证失败 |
| `401 Unauthorized` | `[Authorize]` 自动触发 | 未认证（缺少/无效令牌） |
| `403 Forbidden` | `[Authorize(Roles="...")]` 自动触发 | 已认证但无权限 |
| `404 Not Found` | `return NotFound()` | 资源不存在 |
| `409 Conflict` | `return Conflict()` | 并发冲突、唯一键冲突 |
| `412 Precondition Failed` | `return StatusCode(412)` | ETag/If-Match 不满足 |

#### 标准方法速查

```csharp
// 200 OK
return Ok(result);

// 201 Created
return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);

// 204 No Content
return NoContent();

// 400 Bad Request（自动包含验证错误）
return ValidationProblem(ModelState);
// 或
return BadRequest("参数无效");

// 404 Not Found
return NotFound();

// 409 Conflict
return Conflict(new { message = "资源名称已存在" });

// 412 Precondition Failed
return StatusCode(StatusCodes.Status412PreconditionFailed);
```

---

## 第五部分：类型选择与性能优化篇

### ActionResult`<T>` vs IActionResult

| 对比维度 | `ActionResult<T>` | `IActionResult` |
|---------|-------------------|-----------------|
| **类型安全性** | ✅ 强类型，返回类型明确 | ❌ 弱类型，可返回任意内容 |
| **Swagger/OpenAPI** | ✅ 自动推断返回类型 | ⚠️ 需要 `[Produces]` 特性辅助 |
| **灵活性** | ⚠️ 中等，适合单一类型 | ✅ 高，适合多类型混合 |
| **可读性** | ✅ 返回类型清晰 | ⚠️ 类型不够明确 |
| **适用场景** | 简单 CRUD API | 复杂逻辑、多种返回类型 |

#### 示例对比

```csharp
// ActionResult<T>：类型明确，Swagger 自动生成 200 和 404
[HttpGet("{id}")]
public ActionResult<Product> Get(int id)
{
    var product = _service.Find(id);
    if (product == null) return NotFound();
    return Ok(product);
}

// IActionResult：需要额外特性标注返回类型
[HttpGet("{id}")]
[ProducesResponseType(typeof(Product), 200)]
[ProducesResponseType(404)]
public IActionResult Get(int id)
{
    var product = _service.Find(id);
    if (product == null) return NotFound();
    return Ok(product);
}
```

**推荐原则**：

- **简单 CRUD API** → `ActionResult<T>`（更清晰，文档更好）
- **复杂场景**（可能返回多种类型） → `IActionResult`（更灵活）

---

### 异步 API（async/await）

ASP.NET Core 对异步 I/O 提供了**一等支持**。使用 `async/await` 时，线程在等待 I/O 期间会被释放回线程池，从而提升服务器的并发吞吐能力。

```csharp
[HttpGet("{id:int}")]
public async Task<ActionResult<Product>> GetAsync(int id, CancellationToken ct)
{
    // 数据库/HTTP/文件 I/O → 使用异步 API
    var product = await _repo.GetAsync(id, ct);
    if (product == null) return NotFound();
    return Ok(product);
}
```

#### 核心原则

| 原则 | 说明 |
|------|------|
| **I/O 场景用异步** | 数据库查询、HTTP 调用、文件读写 → 使用 `async/await` |
| **CPU 场景用同步** | 纯计算操作 → 使用同步方法 |
| **避免阻塞** | ❌ 不要用 `.Result`、`.Wait()`、`Task.Run()` 包装 I/O |
| **传递取消令牌** | 将 `CancellationToken` 传递给所有可取消的操作 |

#### 常见反模式

```csharp
// ❌ 反模式：同步阻塞异步方法
[HttpGet]
public IActionResult Get()
{
    var data = _repo.GetAsync().Result;  // 阻塞线程
    return Ok(data);
}

// ❌ 反模式：异步无 I/O（无意义）
[HttpGet]
public async Task<IActionResult> Get()
{
    var data = await Task.FromResult(ComputeData());  // CPU 计算包了异步壳
    return Ok(data);
}
```

---

### CORS（跨域资源共享）

CORS 是浏览器安全策略的一部分，允许服务器声明哪些来源可以访问其资源。

#### 配置示例

```csharp
// 1. 注册 CORS 服务
services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", builder =>
        builder.WithOrigins("https://frontend.com")  // 只允许指定域
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials());  // 允许携带 Cookie
});

// 2. 启用 CORS
app.UseCors("AllowFrontend");
```

#### 安全注意事项

| 原则 | 说明 |
|------|------|
| **最小授权** | 只开放必要的域名、方法和头信息 |
| **禁止危险组合** | ❌ **不能**同时使用 `.AllowAnyOrigin()` 和 `.AllowCredentials()`（会运行时错误） |
| **环境区分** | 开发用宽松策略，生产用严格策略 |

---

### 限流（Rate Limiting）

#### .NET 8 之前的方案

ASP.NET Core 无内置限流，常用第三方库：

- **AspNetCoreRateLimit**：功能完善，支持 IP、ClientId 等策略
- **YARP** / **Azure API Management**：网关层实现

#### .NET 8+ 内置方案

```csharp
// 配置限流
services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("fixed", opt =>
    {
        opt.PermitLimit = 5;               // 每窗口最多 5 次请求
        opt.Window = TimeSpan.FromSeconds(10);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 2;                // 排队等待的请求数
    });
    
    options.AddSlidingWindowLimiter("sliding", opt =>
    {
        opt.PermitLimit = 10;
        opt.Window = TimeSpan.FromSeconds(30);
        opt.SegmentsPerWindow = 3;         // 滑动窗口段数
    });
});

// 启用限流中间件
app.UseRateLimiter();
```

**限流策略类型**：

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| `FixedWindowLimiter` | 固定窗口，窗口期结束后重置 | 简单限流，每 10 秒 5 次 |
| `SlidingWindowLimiter` | 滑动窗口，更平滑 | 需要更均匀的限流 |
| `TokenBucketLimiter` | 令牌桶，允许突发 | 允许短时间突发流量 |
| `ConcurrencyLimiter` | 并发限制 | 限制同时处理的请求数 |

---

## 第六部分：API 文档与测试篇

### Swagger / OpenAPI

使用 **Swashbuckle.AspNetCore** 或 **NSwag** 自动生成 OpenAPI 文档。

```csharp
// 1. 安装：dotnet add package Swashbuckle.AspNetCore

// 2. 配置
services.AddEndpointsApiExplorer();
services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "My API",
        Version = "v1",
        Description = "示例 API 文档"
    });
    
    // 添加 JWT 认证支持
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer"
    });
});

// 3. 启用
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "My API v1");
});
```

---

### Web API 测试

#### 单元测试

验证控制器逻辑，依赖项通过 Mock 替代。

```csharp
[Fact]
public void Get_ValidId_ReturnsOk()
{
    // Arrange
    var mockRepo = new Mock<IProductRepository>();
    mockRepo.Setup(r => r.Get(1)).Returns(new Product { Id = 1, Name = "Book" });
    var controller = new ProductsController(mockRepo.Object);
    
    // Act
    var result = controller.Get(1) as OkObjectResult;
    
    // Assert
    Assert.NotNull(result);
    Assert.Equal(200, result.StatusCode);
    var product = result.Value as Product;
    Assert.Equal("Book", product?.Name);
}
```

#### 集成测试

使用 `WebApplicationFactory` 验证端到端行为。

```csharp
public class ProductsApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ProductsApiTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetProducts_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/products");
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("Book", body);
    }
}
```

#### 测试最佳实践

| 测试类型 | 目标 | 工具 | 特点 |
|---------|------|------|------|
| **单元测试** | 验证业务逻辑 | xUnit + Moq | 快、隔离、无外部依赖 |
| **集成测试** | 验证整体流程 | WebApplicationFactory | 接近真实环境，内存运行 |
| **端到端测试** | 验证完整系统 | Testcontainers + 真实数据库 | 最全面，耗时最长 |

**命名约定**：`{MethodName}_{Scenario}_{ExpectedResult}`，如 `GetUser_InvalidId_ReturnsNotFound`

---

## 第七部分：安全篇

### API 认证与授权

#### 核心概念

| 术语 | 含义 | 关键问题 |
|------|------|----------|
| **Authentication（认证）** | 验证“你是谁” | 提供凭证（用户名/密码、令牌、证书） |
| **Authorization（授权）** | 决定“你能做什么” | 基于身份或角色的访问控制 |

#### JWT Bearer 配置

```csharp
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "your-issuer",
            ValidAudience = "your-audience",
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes("your-secret-key"))
        };
    });

app.UseAuthentication();
app.UseAuthorization();
```

#### 端点保护

```csharp
// 要求登录
[Authorize]
public IActionResult Profile() { ... }

// 要求特定角色
[Authorize(Roles = "Admin")]
public IActionResult AdminPanel() { ... }

// 要求特定策略
[Authorize(Policy = "Scope.Read")]
public IActionResult GetData() { ... }
```

#### OAuth2 / OIDC 支持

| 授权方式 | 适用场景 | 说明 |
|---------|---------|------|
| **授权码流 + PKCE** | SPA / 移动应用 | 最安全，推荐 |
| **Client Credentials** | 服务间调用 | 适用于后台 API 通信 |
| **隐式流** | 传统 SPA | 已被授权码流替代 |

**常见身份提供方**：IdentityServer4/Duende、Azure AD（Entra ID）、Auth0、Okta

---

### API 安全最佳实践

#### HTTPS 强制 + HSTS

```csharp
app.UseHttpsRedirection();
app.UseHsts();  // 仅生产环境启用
```

#### CORS 最小授权原则

```csharp
services.AddCors(o => o.AddPolicy("api", b =>
    b.WithOrigins("https://example.com")
     .WithMethods("GET", "POST", "PUT", "DELETE")
     .WithHeaders("Content-Type", "Authorization")
     .AllowCredentials()));  // 不能和 AllowAnyOrigin 同时使用
```

#### CSRF（跨站请求伪造）

- **JWT/Bearer 认证**：一般**不需要** CSRF 防护（令牌存储在 Header 中，不受 Cookie 自动发送影响）
- **Cookie 认证**：需要启用 CSRF 防护

```csharp
[ValidateAntiForgeryToken]  // 用于 Cookie 认证的 Action
public IActionResult Submit() { ... }
```

#### 安全配置检查清单

| 项目 | 建议 |
|------|------|
| 传输安全 | 生产环境强制 HTTPS + HSTS |
| 认证 | 使用 JWT Bearer 或 OAuth2/OIDC |
| 授权 | 基于角色/策略，最小权限原则 |
| CORS | 只允许受信任来源，禁止 `AllowAnyOrigin` + `AllowCredentials` 组合 |
| 敏感数据 | 不在日志、响应或 URL 中暴露敏感信息 |
| 输入验证 | 使用数据注解验证，防止注入攻击 |

---

## 第八部分：数据映射与版本管理篇

### DTO 与对象映射（AutoMapper）

#### 为什么使用 DTO

| 问题 | DTO 的解决方案 |
|------|---------------|
| 暴露数据库实体 | 隐藏敏感字段（密码、内部 ID 等） |
| 传输过多数据 | 只返回客户端需要的字段 |
| API 变更影响大 | 实体变更不影响 API 合约 |
| 循环引用 | 扁平化结构，避免循环引用问题 |

#### AutoMapper 使用示例

```csharp
// 1. 配置映射（通常在 Profile 中）
public class ProductProfile : Profile
{
    public ProductProfile()
    {
        CreateMap<Product, ProductDto>()
            .ForMember(dest => dest.FullName, 
                       opt => opt.MapFrom(src => src.Name + " (" + src.Code + ")"));
        CreateMap<CreateProductDto, Product>();
    }
}

// 2. 注册
services.AddAutoMapper(typeof(Program));

// 3. 使用
public class ProductsController : ControllerBase
{
    private readonly IMapper _mapper;
    
    [HttpGet]
    public ActionResult<IEnumerable<ProductDto>> Get()
    {
        var products = _productService.GetAll();
        return Ok(_mapper.Map<IEnumerable<ProductDto>>(products));
    }
}
```

#### 替代方案

| 方案 | 适用场景 | 说明 |
|------|---------|------|
| AutoMapper | 复杂映射、大量对象 | 配置灵活，社区成熟 |
| 手动映射 | 简单场景 | 性能最好，最可控 |
| Mapster | 高性能需求 | 性能优于 AutoMapper，配置方式简洁 |
| 表达式树映射 | 动态映射 | 灵活但实现复杂 |

---

### 版本管理陷阱与兼容性

#### 主要陷阱

| 陷阱 | 后果 | 解决方案 |
|------|------|----------|
| 破坏性变更 | 客户端报错 | 新增版本而非修改 |
| 立即下线旧版本 | 客户端无法升级 | 提供过渡期，标记弃用 |
| 文档未更新 | 客户端使用错误 | 同步更新 Swagger/OpenAPI |
| 客户端未升级 | 调用失败 | 提供迁移指南和版本通知 |

#### 版本兼容性原则

```csharp
// 标记弃用
[ApiVersion("1.0")]
[ApiVersion("2.0", Deprecated = true)]  // 标记为弃用
public class ProductsController : ControllerBase
{
    // 响应头会返回 api-deprecated-versions: 2.0
}
```

**最佳实践**：

1. **避免破坏性变更**：不要修改已有字段的名称、类型或语义
2. **合约变更需新版本**：新增版本，保持旧版本可用
3. **提供过渡期**：旧版本标记弃用，给出下线时间
4. **同步更新文档和客户端**：Swagger 文档与版本保持一致

---

## 第九部分：并发处理篇

### 乐观并发控制

乐观并发控制**假设并发冲突较少**，通过版本号或时间戳检测数据是否被其他请求修改。

#### EF Core + RowVersion

```csharp
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
    public byte[] RowVersion { get; set; }  // 必须为 byte[]
}

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Product>()
        .Property(p => p.RowVersion)
        .IsRowVersion();  // 标记为并发令牌
}

// 更新时，EF Core 会在 WHERE 子句中包含 RowVersion
// 如果 RowVersion 不匹配，抛出 DbUpdateConcurrencyException
try
{
    await _context.SaveChangesAsync();
}
catch (DbUpdateConcurrencyException ex)
{
    // 处理并发冲突
    return Conflict("数据已被其他用户修改，请刷新后重试");
}
```

#### Web API + ETag

```csharp
[HttpGet("{id}")]
public IActionResult Get(int id)
{
    var product = _service.Get(id);
    if (product == null) return NotFound();
    
    // 生成 ETag
    var etag = $"\"v1-{product.RowVersion}\"";
    Response.Headers.ETag = etag;
    return Ok(product);
}

[HttpPut("{id}")]
public IActionResult Update(int id, [FromBody] Product input)
{
    // 客户端发送 If-Match: "v1-xxx"
    var ifMatch = Request.Headers.IfMatch.ToString();
    // 验证 ETag 是否匹配
    if (!VerifyETag(id, ifMatch))
        return StatusCode(StatusCodes.Status412PreconditionFailed);
    
    // 执行更新...
}
```

#### 并发处理状态码

| 状态码 | 场景 |
|--------|------|
| `409 Conflict` | RowVersion 不匹配，并发冲突 |
| `412 Precondition Failed` | ETag/If-Match 条件不满足 |
| `428 Precondition Required` | 客户端必须提供条件头（RFC 6585） |

---

## 第十部分：面试避坑清单

| 序号 | ❌ 常见错误 | ✅ 正确理解 |
|------|-----------|-----------|
| 1 | 认为 REST 是协议 | REST 是一种架构风格，不是协议 |
| 2 | `GET` 请求修改数据 | GET 应只读，不应产生副作用 |
| 3 | 所有 API 返回 200 OK | 使用合适的 HTTP 状态码表达结果语义 |
| 4 | 忘记加 `[ApiController]` | API 控制器应始终使用此特性以获得默认行为 |
| 5 | 忽略内容协商 | 根据 `Accept` 头返回不同格式 |
| 6 | 大文件上传到内存 | 使用流式处理，避免 OOM |
| 7 | 不处理并发冲突 | 使用 RowVersion/ETag 检测并发修改 |
| 8 | 版本管理中直接修改旧版本 | 旧版本应保留，新版本新增 |
| 9 | 生产环境使用 `UseDeveloperExceptionPage` | 用 `UseExceptionHandler` 避免泄露敏感信息 |
| 10 | CORS 配置过于宽松 | 遵循最小授权原则 |

---

## 小结

ASP.NET Core Web API 是现代 .NET 开发的核心技能之一。掌握 REST 设计原则、`[ApiController]` 特性、路由、版本管理、安全策略以及并发处理，是构建高质量 API 的关键。

回顾全文，记住三个核心原则：

1. **资源导向**：使用名词 URI + HTTP 方法表达操作意图
2. **状态码语义化**：用合适的 HTTP 状态码准确表达响应结果
3. **安全与性能并重**：合理使用 CORS、限流、缓存和并发控制
