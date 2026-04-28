---
title: Minimal API 认证授权最佳实践
date: 2026-04-25
tags: [.NET, Minimal API, Authentication, Authorization]
category: .NET 开发
description: 使用 ASP.NET Core Minimal API 实现现代化的认证授权方案
---

# Minimal API 认证授权最佳实践

在 ASP.NET Core 7+ 中，Minimal API 成为了构建轻量级 HTTP API 的首选方式。本文将介绍如何在 Minimal API 中实现安全、高效的认证授权机制。

## 为什么选择中间件而非 Filter？

在传统的 Controller 模式中，我们习惯使用 `[Authorize]` 属性进行授权控制。但在 Minimal API 中，推荐使用中间件的方式，原因如下：

1. **更符合 Minimal API 的设计理念** - 保持代码简洁和线性
2. **更好的性能** - 避免反射和属性处理的开销
3. **更灵活的管道控制** - 可以精确控制认证授权的执行时机

## 基础配置

### 1. 添加认证服务

```csharp
var builder = WebApplication.CreateBuilder(args);

// 添加 JWT 认证
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
    };
});

// 添加授权服务
builder.Services.AddAuthorization();
```

### 2. 配置认证中间件

```csharp
var app = builder.Build();

// 注意顺序：先认证，后授权
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => "Hello World!");
```

## 路由级别的授权控制

### 基础授权

```csharp
// 需要认证的路由
app.MapGet("/protected", [Authorize] () => 
{
    return "This is a protected endpoint";
});

// 需要特定角色的路由
app.MapGet("/admin", [Authorize(Roles = "Admin")] () => 
{
    return "Admin only content";
});

// 需要特定策略的路由
app.MapGet("/premium", [Authorize(Policy = "PremiumUser")] () => 
{
    return "Premium content";
});
```

### 自定义授权策略

```csharp
// 在 Program.cs 中定义策略
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("PremiumUser", policy =>
        policy.RequireClaim("SubscriptionType", "Premium"));
    
    options.AddPolicy("AtLeast21", policy =>
        policy.Requirements.Add(new MinimumAgeRequirement(21)));
});
```

## 获取当前用户信息

```csharp
app.MapGet("/profile", [Authorize] (HttpContext context) =>
{
    var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    var userName = context.User.Identity?.Name;
    var roles = context.User.Claims
        .Where(c => c.Type == ClaimTypes.Role)
        .Select(c => c.Value)
        .ToList();
    
    return new
    {
        UserId = userId,
        UserName = userName,
        Roles = roles
    };
});
```

## 实战案例：博客 API

```csharp
// 公开访问 - 获取文章列表
app.MapGet("/api/posts", async (BlogDbContext db) =>
{
    var posts = await db.Posts
        .Where(p => p.IsPublished)
        .OrderByDescending(p => p.CreatedAt)
        .ToListAsync();
    
    return Results.Ok(posts);
});

// 需要认证 - 创建文章
app.MapPost("/api/posts", [Authorize] async (PostCreateRequest request, BlogDbContext db, HttpContext context) =>
{
    var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    
    var post = new Post
    {
        Title = request.Title,
        Content = request.Content,
        AuthorId = userId,
        CreatedAt = DateTime.UtcNow
    };
    
    db.Posts.Add(post);
    await db.SaveChangesAsync();
    
    return Results.Created($"/api/posts/{post.Id}", post);
});

// 需要授权 - 删除文章（仅作者或管理员）
app.MapDelete("/api/posts/{id}", [Authorize] async (int id, BlogDbContext db, HttpContext context) =>
{
    var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    var isAdmin = context.User.IsInRole("Admin");
    
    var post = await db.Posts.FindAsync(id);
    if (post == null)
        return Results.NotFound();
    
    // 只有作者或管理员可以删除
    if (post.AuthorId != userId && !isAdmin)
        return Results.Forbid();
    
    db.Posts.Remove(post);
    await db.SaveChangesAsync();
    
    return Results.NoContent();
});
```

## 自定义中间件实现全局认证

对于需要统一处理认证的场景，可以创建自定义中间件：

```csharp
public class AuthenticationMiddleware
{
    private readonly RequestDelegate _next;

    public AuthenticationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // 可以在这里添加统一的认证逻辑
        // 例如：日志记录、速率限制等
        
        await _next(context);
    }
}

// 扩展方法
public static class AuthenticationMiddlewareExtensions
{
    public static IApplicationBuilder UseCustomAuthentication(
        this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<AuthenticationMiddleware>();
    }
}
```

## 最佳实践总结

1. ✅ **使用中间件而非 Filter** - 更符合 Minimal API 的设计哲学
2. ✅ **明确的服务注册顺序** - 先 AddAuthentication，再 AddAuthorization
3. ✅ **正确的中间件顺序** - UseAuthentication 必须在 UseAuthorization 之前
4. ✅ **细粒度的授权控制** - 根据业务需求选择合适的授权级别
5. ✅ **统一的错误处理** - 提供清晰的 401/403 错误响应
6. ✅ **避免硬编码** - 使用配置和策略管理授权规则

## 常见陷阱

❌ **忘记调用 UseAuthentication()**
```csharp
// 错误：只调用了 UseAuthorization
app.UseAuthorization(); // ❌

// 正确：两者都需要
app.UseAuthentication();
app.UseAuthorization(); // ✅
```

❌ **中间件顺序错误**
```csharp
// 错误：授权在认证之前
app.UseAuthorization(); // ❌
app.UseAuthentication();

// 正确：认证在授权之前
app.UseAuthentication(); // ✅
app.UseAuthorization();
```

## 参考资料

- [ASP.NET Core 官方文档 - 认证](https://docs.microsoft.com/aspnet/core/security/authentication/)
- [Minimal API 授权指南](https://docs.microsoft.com/aspnet/core/fundamentals/minimal-apis/security)
- [JWT 认证完整示例](https://github.com/dotnet/AspNetCore.Docs/tree/main/aspnetcore/security/authentication)

---

**相关资源：**
- [项目仓库](https://github.com/jarodchen/CSharp-LINQ-learn)
- [EF Core 知识库](https://jarodchen.github.io/ef-core-kb/)
