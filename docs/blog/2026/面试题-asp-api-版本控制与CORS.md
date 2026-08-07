---
tags:
  - aspnetcore
  - CORS
category: aspnetcore
categories:
  - 面试
  - aspnetcore
date: 2026-05-07T16:19:00
banner: /images/aspnetcore1.webp
title: ASP.NET Core 面试题 API 版本控制与 CORS
description: 系统梳理 ASP.NET Core 中 API 版本控制与跨域资源共享（CORS）的核心知识点，涵盖版本标识方式、语义化版本、弃用策略、CORS 配置、预检请求及安全最佳实践。
---

# ASP.NET Core 面试题 API 版本控制与 CORS

> API 版本控制让接口平滑演进，CORS 让跨域安全可控——两者是现代 Web API 走向生产环境的关键能力。

在构建 Web API 时，有两个问题几乎必然会遇到：**如何管理 API 的版本演进？** 以及**如何让前端应用安全地跨域访问？** 这两个问题分别对应 API 版本控制和 CORS（跨域资源共享）。它们是 API 可维护性和安全性的重要组成部分，也是面试中的高频考点。

本文将系统梳理 API 版本控制与 CORS 的核心知识点，从基础概念到生产级实践，一网打尽。

---

## 第一部分：API 版本控制篇

### 什么是 API 版本控制？为什么需要它？

API 版本控制（API Versioning）是一种允许 API 同时提供多个版本的技术手段，其核心目标是：**在 API 演进过程中，保持向后兼容，使客户端能够平滑迁移。**

#### 为什么需要 API 版本控制？

| 场景 | 说明 |
|------|------|
| **破坏性变更** | 修改请求/响应结构、重命名属性、删除字段 |
| **新增功能** | 在新版本中增加功能，但不影响旧版本用户 |
| **技术升级** | 更换底层实现、序列化方式或第三方服务 |
| **客户端差异** | 不同客户端（Web App、移动 App、第三方集成）需要不同版本 |
| **灰度发布** | 新版本逐步放量，降低上线风险 |

> **核心原则**：永远不要直接修改已发布 API 的合约（Contract），应通过**新增版本**来引入变更。

---

### 实现 API 版本控制

在 ASP.NET Core 中，通过 `Microsoft.AspNetCore.Mvc.Versioning` 包实现 API 版本管理。

#### 安装 NuGet 包

```bash
dotnet add package Microsoft.AspNetCore.Mvc.Versioning
```

#### 基础配置

```csharp
builder.Services.AddApiVersioning(options =>
{
    // 未指定版本时使用默认版本
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.DefaultApiVersion = new ApiVersion(1, 0);
    
    // 在响应头中返回支持的版本信息
    options.ReportApiVersions = true;
    
    // 声明 API 版本已弃用
    // 可通过 options.ApiVersionReader 自定义版本读取方式
});
```

#### 四种版本标识方式

ASP.NET Core API 版本控制支持四种常见的版本标识方式：

| 方式 | 示例 | 特点 | 推荐度 |
|------|------|------|--------|
| **URL 路径** | `/api/v1/products` | 最直观，REST 风格，易于调试 | ⭐⭐⭐⭐⭐ 强烈推荐 |
| **查询字符串** | `/api/products?api-version=1.0` | 实现简单，URL 结构不变 | ⭐⭐⭐⭐ 推荐 |
| **请求头** | `api-version: 1.0` | 隐藏版本信息，URI 干净 | ⭐⭐⭐ 适用 |
| **媒体类型** | `Accept: application/vnd.company.v1+json` | 符合 REST 理念，但实现复杂 | ⭐⭐ 特定场景 |

#### 配置多种版本读取方式

```csharp
builder.Services.AddApiVersioning(options =>
{
    options.ApiVersionReader = ApiVersionReader.Combine(
        new UrlSegmentApiVersionReader(),           // URL 路径：/api/v1/products
        new QueryStringApiVersionReader("api-version"), // 查询字符串：?api-version=1.0
        new HeaderApiVersionReader("X-API-Version"),    // 请求头：X-API-Version: 1.0
        new MediaTypeApiVersionReader("v")              // 媒体类型：application/json;v=1.0
    );
});
```

---

### 在控制器中使用 API 版本

#### 方式一：URL 路径版本（推荐）

```csharp
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
public class ProductsController : ControllerBase
{
    [HttpGet]
    public IActionResult Get(ApiVersion version)
    {
        return Ok($"当前 API 版本：{version}");
    }
}

// 请求示例：
// GET /api/v1/products  → 版本 1.0
// GET /api/v2/products  → 版本 2.0
```

#### 方式二：使用 `[ApiVersion]` 特性

```csharp
[ApiController]
[Route("api/[controller]")]
[ApiVersion("1.0")]
[ApiVersion("2.0")]
public class ProductsController : ControllerBase
{
    // 版本 1.0
    [HttpGet]
    [MapToApiVersion("1.0")]
    public IActionResult GetV1() => Ok("V1");

    // 版本 2.0
    [HttpGet]
    [MapToApiVersion("2.0")]
    public IActionResult GetV2() => Ok("V2");

    // 所有版本共享
    [HttpGet("health")]
    public IActionResult Health() => Ok("OK");
}
```

#### 方式三：不同版本使用不同控制器

```csharp
// ProductsV1Controller.cs
[ApiController]
[Route("api/v1/[controller]")]
[ApiVersion("1.0")]
public class ProductsV1Controller : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new { Version = "1.0", Products = new[] { "Product A" } });
}

// ProductsV2Controller.cs
[ApiController]
[Route("api/v2/[controller]")]
[ApiVersion("2.0")]
public class ProductsV2Controller : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new { Version = "2.0", Products = new[] { "Product A", "Product B" } });
}
```

#### 请求示例

```
GET /api/v1/products  → 返回 v1 数据格式
GET /api/v2/products  → 返回 v2 数据格式
```

---

### 语义化版本（Semantic Versioning）

语义化版本（SemVer）是一种标准化的版本号格式：**MAJOR.MINOR.PATCH**

| 版本号部分 | 含义 | 示例 | 升级影响 |
|-----------|------|------|----------|
| **MAJOR（主版本）** | 破坏性变更，不兼容旧版本 | `2.0.0` | 客户端需修改代码 |
| **MINOR（次版本）** | 新增功能，保持向后兼容 | `1.2.0` | 客户端无需修改 |
| **PATCH（修订版）** | 缺陷修复，完全向后兼容 | `1.1.1` | 客户端完全不受影响 |

#### API 版本与语义化版本

```csharp
// 主版本号对应 API Major 版本
[ApiVersion("2.0")]  // 对应 MAJOR = 2

// 可同时支持主版本和次版本
[ApiVersion("1.0")]
[ApiVersion("1.1")]  // 小版本更新（新增可选字段）
[ApiVersion("2.0")]  // 大版本更新（破坏性变更）
```

#### 版本协商（Version Negotiation）

客户端与服务器通过版本标识方式协商使用的 API 版本：

```
客户端请求：
GET /api/products?api-version=1.5

服务器行为：
1. 解析 api-version=1.5
2. 查找是否存在 1.5 版本
3. 如果存在 → 使用 1.5 版本
4. 如果不存在 → 使用最近的匹配版本（取决于配置）
```

**重要配置**：

```csharp
services.AddApiVersioning(options =>
{
    // 是否允许客户端请求不存在的版本时使用默认版本
    options.AssumeDefaultVersionWhenUnspecified = true;
    
    // 是否使用"最新可用版本"作为默认
    options.UseApiBehavior = ApiBehaviorOptions.Default;
});
```

---

### 弃用策略（Deprecation Strategy）

当 API 版本下线时，需要让客户端平滑过渡。良好的弃用策略可以避免客户端"突然死亡"。

#### 1. 标记 API 版本为已弃用

```csharp
[ApiVersion("1.0", Deprecated = true)]  // 标记为已弃用
[ApiVersion("2.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class ProductsController : ControllerBase
{
    // ...
}
```

#### 2. 响应头中返回弃用信息

启用 `ReportApiVersions = true` 后，响应头会自动包含：

```
api-supported-versions: 2.0
api-deprecated-versions: 1.0
```

#### 3. 自定义弃用响应信息

```csharp
public class CustomApiVersioningProvider : IApiVersionProvider
{
    public void AddVersions(ApiVersionDescriptionCollection versions)
    {
        // 可在响应中额外添加 Sunset 头
    }
}

// 或在响应体中返回提示
[ApiController]
[Route("api/v1/[controller]")]
[ApiVersion("1.0", Deprecated = true)]
public class ProductsV1Controller : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        Response.Headers.Add("Warning", "299 - API version 1.0 is deprecated. Please migrate to v2.0.");
        Response.Headers.Add("Sunset", "Fri, 31 Dec 2026 23:59:59 GMT");  // 下线时间
        
        return Ok(new { Message = "此版本即将下线，请迁移到 v2.0" });
    }
}
```

#### 4. 弃用策略最佳实践

| 阶段 | 行动 | 时间建议 |
|------|------|----------|
| **通知阶段** | 发布公告，更新文档，添加弃用警告头 | 下线前 3-6 个月 |
| **过渡阶段** | 新版本发布，保留旧版本，引导迁移 | 下线前 1-3 个月 |
| **下线阶段** | 旧版本返回 `410 Gone`，明确告知客户端 | 正式下线时 |
| **清理阶段** | 移除旧版本代码 | 下线后 1-3 个月 |

```csharp
// 旧版本下线时返回 410 Gone
[HttpGet]
public IActionResult Get()
{
    return StatusCode(StatusCodes.Status410Gone, new
    {
        Title = "API 版本 1.0 已下线",
        Detail = "请迁移至 v2.0，迁移指南：https://docs.example.com/migration",
        MigrationDeadline = "2026-12-31"
    });
}
```

---

## 第二部分：CORS 篇

### CORS：什么是跨域资源共享？

**CORS（Cross-Origin Resource Sharing，跨域资源共享）** 是一种浏览器安全机制，用于在遵守**同源策略**的前提下，受控地放行跨域资源访问。

#### 同源策略（Same-Origin Policy）

浏览器的同源策略规定：**协议、域名、端口**完全相同的页面才能相互访问资源。

| URL A | URL B | 是否同源 | 原因 |
|-------|-------|---------|------|
| `https://example.com` | `https://example.com/page` | ✅ 同源 | 协议、域名、端口相同 |
| `https://example.com` | `https://api.example.com` | ❌ 跨域 | 子域名不同 |
| `https://example.com` | `http://example.com` | ❌ 跨域 | 协议不同（HTTPS vs HTTP） |
| `https://example.com:443` | `https://example.com:8080` | ❌ 跨域 | 端口不同 |

#### CORS 的作用

CORS 允许服务器声明哪些来源可以访问其资源，在遵守安全策略的前提下**受控地突破同源限制**。

```
前端（https://frontend.com）
    ↓ 发起跨域请求
API（https://api.example.com）
    ↓ 返回 CORS 响应头
Access-Control-Allow-Origin: https://frontend.com
    ↓
浏览器放行响应
```

> **重要认知**：CORS 是**浏览器层面的安全机制**，不是服务器层面的防火墙。对于非浏览器客户端（如 Postman、服务间调用），CORS 不生效。

---

### 跨域请求的两种类型

#### 1. 简单请求（Simple Requests）

**满足以下所有条件**的请求属于简单请求：

- HTTP 方法为：`GET`、`HEAD`、`POST` 之一
- 请求头仅包含：`Accept`、`Accept-Language`、`Content-Language`、`Content-Type`（值为 `application/x-www-form-urlencoded`、`multipart/form-data`、`text/plain`）

**简单请求流程**：

```
浏览器 → 直接发送请求 → 服务器返回响应 + CORS 头 → 浏览器检查 CORS 头 → 放行/拦截
```

#### 2. 需要预检的请求（Preflighted Requests）

**满足以下任一条件**的请求需要预检：

- 使用 `PUT`、`DELETE`、`PATCH`、`OPTIONS` 等方法
- 携带自定义请求头（如 `Authorization`、`X-Requested-With`）
- `Content-Type` 为 `application/json`、`application/xml` 等

**预检请求流程**：

```
浏览器 → 发送 OPTIONS 预检请求 → 服务器返回 CORS 允许策略 → 
浏览器检查 → 发送实际请求 → 服务器返回响应
```

#### 简单请求 vs 预检请求

| 对比 | 简单请求 | 预检请求 |
|------|---------|----------|
| **预检阶段** | ❌ 无 | ✅ 先发 OPTIONS |
| **请求头** | 仅标准请求头 | 可携带自定义请求头 |
| **HTTP 方法** | GET/HEAD/POST | 所有方法 |
| **Content-Type** | 表单格式 | JSON 等格式 |
| **性能** | 较快 | 较慢（多一次往返） |

---

### 在 ASP.NET Core 中配置 CORS

#### 基础配置

```csharp
// 1. 注册 CORS 服务
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin", policy =>
    {
        policy.WithOrigins("https://frontend.com")  // 允许的源
              .AllowAnyHeader()                      // 允许所有头
              .AllowAnyMethod();                     // 允许所有方法
    });
    
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 2. 启用 CORS 中间件
app.UseCors("AllowSpecificOrigin");

// 3. 必须在 UseRouting 之后、UseAuthorization 之前
app.UseRouting();
app.UseCors();  // 重要：在 UseAuthorization 之前
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
```

#### CORS 策略配置选项

| 方法 | 说明 | 示例 |
|------|------|------|
| `WithOrigins(params string[])` | 允许的来源（白名单） | `WithOrigins("https://a.com", "https://b.com")` |
| `AllowAnyOrigin()` | 允许所有来源 | ⚠️ 生产环境慎用 |
| `WithMethods(params string[])` | 允许的 HTTP 方法 | `WithMethods("GET", "POST", "PUT")` |
| `AllowAnyMethod()` | 允许所有 HTTP 方法 | |
| `WithHeaders(params string[])` | 允许的请求头 | `WithHeaders("Content-Type", "Authorization")` |
| `AllowAnyHeader()` | 允许所有请求头 | |
| `WithExposedHeaders(params string[])` | 暴露给客户端的响应头 | `WithExposedHeaders("X-Total-Count")` |
| `AllowCredentials()` | 允许携带凭据（Cookie/Authorization） | ⚠️ 不能与 `AllowAnyOrigin()` 同时使用 |
| `SetPreflightMaxAge(TimeSpan)` | 预检结果缓存时长 | `SetPreflightMaxAge(TimeSpan.FromMinutes(10))` |

#### 完整安全策略示例

```csharp
services.AddCors(options =>
{
    options.AddPolicy("ProductionCors", policy =>
    {
        policy.WithOrigins(
                "https://frontend.com",
                "https://admin.frontend.com")
              .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
              .WithHeaders("Content-Type", "Authorization", "X-Requested-With")
              .WithExposedHeaders("X-Total-Count", "X-Pagination")
              .SetPreflightMaxAge(TimeSpan.FromMinutes(10))
              .AllowCredentials();  // 允许 Cookie
    });
});
```

---

### CORS 中间件的位置

CORS 中间件的位置至关重要，必须放在 `UseAuthorization` **之前**：

```csharp
// ✅ 正确顺序
app.UseRouting();
app.UseCors();           // CORS 必须在 UseAuthorization 之前
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ❌ 错误顺序（CORS 在授权之后）
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseCors();           // ❌ 此时可能已太晚
```

**为什么顺序重要？**

1. CORS 需要处理 OPTIONS 预检请求，而 OPTIONS 请求通常不携带认证信息
2. 如果 CORS 在 `UseAuthorization` 之后，预检请求会因未认证被拒绝

---

### 全局配置 vs 按端点配置 CORS

#### 全局配置（所有端点生效）

```csharp
// 注册
app.UseCors("AllowSpecificOrigin");

// 所有端点自动应用 CORS 策略
```

#### 按端点配置（仅特定 Controller/Action）

```csharp
// 启用 CORS
[EnableCors("PolicyName")]
[Route("api/[controller]")]
public class PublicController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok();
}

// 禁用 CORS（覆盖全局配置）
[DisableCors]
[Route("api/internal/[controller]")]
public class InternalController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok();
}
```

#### 配置优先级

```
端点级 [EnableCors] > 端点级 [DisableCors] > 控制器级 > 全局配置
```

---

### 处理跨域凭据（Credentials）

在跨域请求中携带 Cookie、Authorization 头等凭据时，需要进行特殊配置。

#### 服务器端配置

```csharp
options.AddPolicy("AllowCredentials", policy =>
{
    policy.WithOrigins("https://frontend.com")  // ❌ 不能使用 AllowAnyOrigin()
          .AllowCredentials()                    // ✅ 允许凭据
          .AllowAnyHeader()
          .AllowAnyMethod();
});
```

#### ⚠️ 关键限制

```
❌ 以下组合会导致浏览器阻止请求：
.AllowAnyOrigin() + .AllowCredentials()

✅ 必须使用明确的来源：
.WithOrigins("https://frontend.com") + .AllowCredentials()
```

#### 客户端配置

```javascript
// Fetch API
fetch('https://api.example.com/data', {
    credentials: 'include',  // 携带 Cookie
    headers: {
        'Authorization': 'Bearer token'
    }
});

// Axios
axios.get('https://api.example.com/data', {
    withCredentials: true
});
```

#### 服务器端验证凭据

```csharp
[Authorize]
[HttpPost("secure-data")]
public IActionResult GetSecureData()
{
    // 只有携带 Cookie 或 Authorization 头的请求才能访问
    var user = User.Identity?.Name;
    return Ok($"Hello, {user}");
}
```

---

### CORS 的安全影响

#### 常见安全风险

| 风险 | 说明 | 后果 |
|------|------|------|
| **过宽的来源策略** | `AllowAnyOrigin()` | 任意网站可访问 API |
| **凭据 + 任意来源** | `AllowAnyOrigin()` + `AllowCredentials()` | 🔴 严重：凭证可被任意网站窃取 |
| **过宽的方法/头** | `AllowAnyMethod()` + `AllowAnyHeader()` | 允许恶意方法或注入头 |
| **缺乏 HTTPS** | 不使用 HTTPS | 跨域通信可被中间人攻击 |
| **不校验 Origin 头** | 信任所有来源 | 可被伪造的 Origin 头攻击 |

#### 安全配置清单

| 检查项 | 推荐配置 | 说明 |
|--------|---------|------|
| 来源白名单 | `WithOrigins("https://trusted.com")` | 使用 **明确** 的来源，而非通配符 |
| 凭据配置 | 使用 `WithOrigins()` + `AllowCredentials()` | 永远不要和 `AllowAnyOrigin()` 组合 |
| HTTP 方法 | `WithMethods("GET", "POST")` | 只允许必要的方法 |
| 请求头 | `WithHeaders("Content-Type", "Authorization")` | 只允许必要的头 |
| 预检缓存 | `SetPreflightMaxAge(TimeSpan.FromMinutes(10))` | 减少预检请求次数 |
| HTTPS | 生产环境强制 HTTPS | 使用 `UseHttpsRedirection()` |
| Origin 头校验 | 服务器应校验 Origin 头 | 防止伪造来源 |

#### CORS 策略最小授权原则

```csharp
// ❌ 生产环境应避免
options.AddPolicy("TooPermissive", policy =>
{
    policy.AllowAnyOrigin()
          .AllowAnyMethod()
          .AllowAnyHeader();
});

// ✅ 生产环境推荐
options.AddPolicy("Production", policy =>
{
    policy.WithOrigins("https://frontend.com", "https://admin.frontend.com")
          .WithMethods("GET", "POST", "PUT", "DELETE")
          .WithHeaders("Content-Type", "Authorization", "X-Requested-With")
          .WithExposedHeaders("X-Total-Count")
          .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
});
```

---

### 自定义 CORS 策略

#### 基于环境动态配置

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("DynamicCors", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
        if (builder.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
        else
        {
            policy.WithOrigins(allowedOrigins ?? Array.Empty<string>())
                  .WithMethods("GET", "POST", "PUT", "DELETE")
                  .WithHeaders("Content-Type", "Authorization")
                  .AllowCredentials();
        }
    });
});
```

#### 自定义 CORS 策略服务

```csharp
public class DynamicCorsPolicyProvider : ICorsPolicyProvider
{
    private readonly IConfiguration _config;

    public DynamicCorsPolicyProvider(IConfiguration config)
    {
        _config = config;
    }

    public async Task<CorsPolicy?> GetPolicyAsync(HttpContext context, string? policyName)
    {
        var origin = context.Request.Headers.Origin.ToString();
        if (string.IsNullOrEmpty(origin))
            return null;

        // 动态决定是否允许该来源
        var allowedOrigins = _config.GetSection("Cors:AllowedOrigins").Get<string[]>();
        if (allowedOrigins?.Contains(origin) == true)
        {
            return new CorsPolicyBuilder()
                .WithOrigins(origin)
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials()
                .Build();
        }

        return null;  // 不允许跨域
    }
}
```

---

### 解决常见 CORS 问题

#### 问题 1：OPTIONS 预检请求返回 404 或 405

**原因**：CORS 中间件未正确配置或顺序错误。

**解决方案**：

```csharp
// ✅ 检查中间件顺序
app.UseRouting();
app.UseCors();  // 必须在此位置
app.UseAuthorization();
app.MapControllers();

// ✅ 检查是否注册了 CORS 服务
builder.Services.AddCors();
```

#### 问题 2：预检请求返回 401（未认证）

**原因**：CORS 中间件在 `UseAuthentication` 之后。

**解决方案**：调整中间件顺序为 `UseRouting` → `UseCors` → `UseAuthentication`。

#### 问题 3：`Access-Control-Allow-Origin` 头丢失

**原因**：未正确配置 CORS 策略，或未调用 `UseCors()`。

**解决方案**：

```csharp
// 确保注册并启用
builder.Services.AddCors();  // 注册
app.UseCors("PolicyName");   // 启用
```

#### 问题 4：跨域请求无法携带 Cookie

**原因**：未配置 `AllowCredentials()` 或客户端未设置 `credentials`。

**解决方案**：

```csharp
// 服务器
policy.WithOrigins("https://frontend.com")
      .AllowCredentials();

// 客户端
fetch(url, { credentials: 'include' });
```

---

## 第三部分：面试避坑清单

| 序号 | ❌ 常见错误 | ✅ 正确理解 |
|------|-----------|-----------|
| 1 | 直接修改已发布的 API 接口 | 通过新增版本引入变更 |
| 2 | 忘记在响应头中返回支持的版本信息 | 启用 `ReportApiVersions = true` |
| 3 | 旧版本立即下线，不给客户端过渡期 | 提供 3-6 个月过渡期，标记弃用 |
| 4 | 认为 CORS 能阻止恶意请求攻击服务器 | CORS 是**浏览器安全机制**，不能替代服务器端防护 |
| 5 | `AllowAnyOrigin()` + `AllowCredentials()` 同时使用 | ❌ 浏览器会阻止，必须用明确的来源 |
| 6 | 忘记处理 OPTIONS 预检请求 | `AddCors` + `UseCors` 自动处理 |
| 7 | CORS 中间件放在 `UseAuthorization` 之后 | 必须在 `UseAuthorization` 之前 |
| 8 | 生产环境使用过于宽松的 CORS 策略 | 遵循最小授权原则 |
| 9 | 在非浏览器客户端（如服务间调用）配置 CORS | CORS 仅对浏览器生效，服务间调用走其他安全机制 |
| 10 | 忽略预检请求缓存 | 使用 `SetPreflightMaxAge` 减少不必要的预检请求 |

---

## 小结

API 版本控制和 CORS 是现代 Web API 开发中不可回避的两个主题：

**API 版本控制**：
- 通过 `Microsoft.AspNetCore.Mvc.Versioning` 实现
- 支持 URL 路径、查询字符串、请求头、媒体类型四种版本标识方式
- 语义化版本（SemVer）规范：MAJOR.MINOR.PATCH
- 弃用策略应提供清晰的迁移指引和过渡期

**CORS**：
- 浏览器安全机制，受控地放行跨域资源访问
- 简单请求 vs 预检请求（OPTIONS）
- 通过 `AddCors` + `UseCors` 配置
- 遵循最小授权原则：明确来源、限制方法和头、使用 HTTPS

回顾全文，记住三个核心原则：

1. **版本演进不破坏兼容性**：用新版本引入变更，旧版本保留过渡期
2. **CORS 最小授权**：明确允许的来源、方法和头，绝不使用 `AllowAnyOrigin()` + `AllowCredentials()` 组合
3. **中间件顺序正确**：`UseCors` 必须在 `UseAuthorization` 之前
