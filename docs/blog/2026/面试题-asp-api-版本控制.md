---
tags: ["aspnetcore"]
category: .NET Core
categories:
  - 面试
 
date: 2026-05-07T16:19:00
banner: /images/aspnetcore1.webp
title: ASP.NET Core 面试题 API 版本控制
description: 系统梳理 ASP.NET Core 中 API 版本控制的核心知识点，涵盖版本标识方式、语义化版本、弃用策略及最佳实践。
---

# ASP.NET Core 面试题 API 版本控制

> API 版本控制让接口平滑演进，是 Web API 走向生产环境的关键能力。

在构建 Web API 时，**如何管理 API 的版本演进？** 这是一个几乎必然会遇到的问题。API 版本控制是 API 可维护性的重要组成部分，也是面试中的高频考点。

本文将系统梳理 API 版本控制的核心知识点，从基础概念到生产级实践，一网打尽。

---

## 什么是 API 版本控制？为什么需要它？

API 版本控制（API Versioning）是一种允许 API 同时提供多个版本的技术手段，其核心目标是：**在 API 演进过程中，保持向后兼容，使客户端能够平滑迁移。**

### 为什么需要 API 版本控制？

| 场景 | 说明 |
|------|------|
| **破坏性变更** | 修改请求/响应结构、重命名属性、删除字段 |
| **新增功能** | 在新版本中增加功能，但不影响旧版本用户 |
| **技术升级** | 更换底层实现、序列化方式或第三方服务 |
| **客户端差异** | 不同客户端（Web App、移动 App、第三方集成）需要不同版本 |
| **灰度发布** | 新版本逐步放量，降低上线风险 |

> **核心原则**：永远不要直接修改已发布 API 的合约（Contract），应通过**新增版本**来引入变更。

---

## 实现 API 版本控制

在 ASP.NET Core 中，通过 `Microsoft.AspNetCore.Mvc.Versioning` 包实现 API 版本管理。

### 安装 NuGet 包

```bash
dotnet add package Microsoft.AspNetCore.Mvc.Versioning
```

### 基础配置

```csharp
builder.Services.AddApiVersioning(options =>
{
    // 未指定版本时使用默认版本
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.DefaultApiVersion = new ApiVersion(1, 0);

    // 在响应头中返回支持的版本信息
    options.ReportApiVersions = true;
});
```

### 四种版本标识方式

ASP.NET Core API 版本控制支持四种常见的版本标识方式：

| 方式 | 示例 | 特点 | 推荐度 |
|------|------|------|--------|
| **URL 路径** | `/api/v1/products` | 最直观，REST 风格，易于调试 | ⭐⭐⭐⭐⭐ 强烈推荐 |
| **查询字符串** | `/api/products?api-version=1.0` | 实现简单，URL 结构不变 | ⭐⭐⭐⭐ 推荐 |
| **请求头** | `api-version: 1.0` | 隐藏版本信息，URI 干净 | ⭐⭐⭐ 适用 |
| **媒体类型** | `Accept: application/vnd.company.v1+json` | 符合 REST 理念，但实现复杂 | ⭐⭐ 特定场景 |

### 配置多种版本读取方式

```csharp
builder.Services.AddApiVersioning(options =>
{
    options.ApiVersionReader = ApiVersionReader.Combine(
        new UrlSegmentApiVersionReader(),               // URL 路径：/api/v1/products
        new QueryStringApiVersionReader("api-version"), // 查询字符串：?api-version=1.0
        new HeaderApiVersionReader("X-API-Version"),    // 请求头：X-API-Version: 1.0
        new MediaTypeApiVersionReader("v")              // 媒体类型：application/json;v=1.0
    );
});
```

---

## 在控制器中使用 API 版本

### 方式一：URL 路径版本（推荐）

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

### 方式二：使用 `[ApiVersion]` 特性

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

### 方式三：不同版本使用不同控制器

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

---

## 语义化版本（Semantic Versioning）

语义化版本（SemVer）是一种标准化的版本号格式：**MAJOR.MINOR.PATCH**

| 版本号部分 | 含义 | 示例 | 升级影响 |
|-----------|------|------|----------|
| **MAJOR（主版本）** | 破坏性变更，不兼容旧版本 | `2.0.0` | 客户端需修改代码 |
| **MINOR（次版本）** | 新增功能，保持向后兼容 | `1.2.0` | 客户端无需修改 |
| **PATCH（修订版）** | 缺陷修复，完全向后兼容 | `1.1.1` | 客户端完全不受影响 |

### API 版本与语义化版本

```csharp
// 主版本号对应 API Major 版本
[ApiVersion("2.0")]  // 对应 MAJOR = 2

// 可同时支持主版本和次版本
[ApiVersion("1.0")]
[ApiVersion("1.1")]  // 小版本更新（新增可选字段）
[ApiVersion("2.0")]  // 大版本更新（破坏性变更）
```

### 版本协商（Version Negotiation）

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

## 弃用策略（Deprecation Strategy）

当 API 版本下线时，需要让客户端平滑过渡。良好的弃用策略可以避免客户端"突然死亡"。

### 1. 标记 API 版本为已弃用

```csharp
[ApiVersion("1.0", Deprecated = true)]  // 标记为已弃用
[ApiVersion("2.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class ProductsController : ControllerBase
{
    // ...
}
```

### 2. 响应头中返回弃用信息

启用 `ReportApiVersions = true` 后，响应头会自动包含：

```
api-supported-versions: 2.0
api-deprecated-versions: 1.0
```

### 3. 自定义弃用响应信息

```csharp
[ApiController]
[Route("api/v1/[controller]")]
[ApiVersion("1.0", Deprecated = true)]
public class ProductsV1Controller : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        Response.Headers.Add("Warning", "299 - API version 1.0 is deprecated. Please migrate to v2.0.");
        Response.Headers.Add("Sunset", "Fri, 31 Dec 2026 23:59:59 GMT");

        return Ok(new { Message = "此版本即将下线，请迁移到 v2.0" });
    }
}
```

### 4. 弃用策略最佳实践

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

## 面试避坑清单

| 序号 | ❌ 常见错误 | ✅ 正确理解 |
|------|-----------|-----------|
| 1 | 直接修改已发布的 API 接口 | 通过新增版本引入变更 |
| 2 | 忘记在响应头中返回支持的版本信息 | 启用 `ReportApiVersions = true` |
| 3 | 旧版本立即下线，不给客户端过渡期 | 提供 3-6 个月过渡期，标记弃用 |
| 4 | 所有版本使用同一个控制器 | 不同版本可分离到不同控制器 |
| 5 | 忽略版本协商配置 | 配置 `AssumeDefaultVersionWhenUnspecified` |

---

## 小结

API 版本控制是现代 Web API 开发中不可回避的主题：

- 通过 `Microsoft.AspNetCore.Mvc.Versioning` 实现
- 支持 URL 路径、查询字符串、请求头、媒体类型四种版本标识方式
- 语义化版本（SemVer）规范：MAJOR.MINOR.PATCH
- 弃用策略应提供清晰的迁移指引和过渡期

**核心原则**：版本演进不破坏兼容性，用新版本引入变更，旧版本保留过渡期。
