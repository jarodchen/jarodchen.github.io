---
tags: ["aspnetcore"]
category: aspnetcore
categories:
  - 面试
  - aspnetcore
date: 2026-05-07T16:19:00
banner: /images/aspnetcore1.webp
title: ASP.NET Core 面试题 认证与授权
description: 系统梳理 ASP.NET Core 中身份验证和授权的核心知识点，涵盖 Identity、JWT、Cookie 认证、角色/策略授权、Claims、自定义授权处理器、2FA 及安全最佳实践。
---

# ASP.NET Core 面试题 认证与授权

> 认证（Authentication）确认“你是谁”，授权（Authorization）决定“你能做什么”——它们是应用安全的两道核心防线。

在 ASP.NET Core 面试中，认证与授权是**最高频的考点之一**。无论你是构建 Web API、传统 MVC 应用，还是微服务架构，安全都是无法回避的课题。本文将系统梳理认证与授权的核心知识点，从基础概念到生产级实践，一网打尽。

---

## 第一部分：基础概念篇

### 什么是身份验证（Authentication）与授权（Authorization）？

这两个术语经常被混淆，但它们的职责完全不同：

| 概念 | 英文 | 核心问题 | 通俗解释 |
|------|------|---------|----------|
| **身份验证** | Authentication | “你是谁？” | 验证用户身份，确认其真实存在 |
| **授权** | Authorization | “你能做什么？” | 根据身份判断其是否有权执行操作 |

**类比理解**：

```
身份验证 = 进机场安检时出示身份证 + 机票（确认你是本人）
授权     = 登机牌上写着"商务舱" → 允许进入商务舱休息室（基于身份给予权限）
```

在 ASP.NET Core 中：

```csharp
// Authentication：中间件负责验证身份
app.UseAuthentication();

// Authorization：中间件负责检查权限
app.UseAuthorization();

// 控制器中使用特性控制访问
[Authorize]                           // 要求登录（身份验证通过）
[Authorize(Roles = "Admin")]          // 要求角色为 Admin（授权检查）
[Authorize(Policy = "CanEdit")]       // 要求满足自定义策略（授权检查）
[AllowAnonymous]                      // 允许匿名访问（跳过认证）
```

---

### 认证与授权的执行流程

```
客户端请求
    ↓
① Authentication 中间件执行
    ↓
    解析请求中的凭证（Cookie / JWT / API Key）
    ↓
    验证凭证有效性 → 创建 ClaimsPrincipal（用户身份）
    ↓
② Authorization 中间件执行
    ↓
    [Authorize] 检查用户是否已认证
    ↓
    [Authorize(Roles)] / [Authorize(Policy)] 检查权限
    ↓
③ 进入 Controller / Action
```

---

## 第二部分：ASP.NET Core Identity篇

### 什么是 ASP.NET Core Identity？

ASP.NET Core Identity 是微软官方提供的**完整的用户管理框架**，开箱即用，包含：

| 功能模块 | 说明 |
|---------|------|
| 用户注册/登录 | 支持用户名/密码、外部登录 |
| 角色管理 | 创建/分配角色 |
| 声明管理 | 为用户附加 Claims |
| 密码管理 | 哈希存储、重置密码、强制修改 |
| 双因素认证（2FA） | 支持 TOTP、短信、邮件 |
| 令牌生成 | 密码重置令牌、邮箱确认令牌 |
| 外部登录 | Google、Facebook、Microsoft、Twitter、OIDC 等 |

#### 安装与配置

```bash
dotnet add package Microsoft.AspNetCore.Identity.EntityFrameworkCore
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
```

**配置 DbContext 和 Identity**：

```csharp
// 1. 定义 ApplicationUser（可扩展 IdentityUser）
public class ApplicationUser : IdentityUser
{
    public string? FullName { get; set; }  // 添加自定义属性
    public DateTime? DateOfBirth { get; set; }
}

// 2. DbContext
public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }
}

// 3. Program.cs 注册服务
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders()
    .AddRoles<IdentityRole>();  // 启用角色管理

// 4. 配置 Identity 选项（可选）
builder.Services.Configure<IdentityOptions>(options =>
{
    // 密码策略
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 8;
    
    // 锁死策略
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
    
    // 用户选项
    options.User.RequireUniqueEmail = true;
});

// 5. 启用认证中间件
app.UseAuthentication();
app.UseAuthorization();
```

#### Identity 的默认表结构

Identity 使用 EF Core 生成以下核心表：

| 表名 | 用途 |
|------|------|
| `AspNetUsers` | 用户信息 |
| `AspNetRoles` | 角色信息 |
| `AspNetUserRoles` | 用户-角色关联（多对多） |
| `AspNetUserClaims` | 用户声明 |
| `AspNetRoleClaims` | 角色声明 |
| `AspNetUserLogins` | 外部登录关联 |
| `AspNetUserTokens` | 用户令牌（如 2FA、重置密码） |

#### 常用 Identity API

```csharp
// UserManager<T>：用户管理
var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

// 创建用户
var result = await userManager.CreateAsync(user, password);

// 添加角色
await userManager.AddToRoleAsync(user, "Admin");

// 添加声明
await userManager.AddClaimAsync(user, new Claim("Permission", "Edit"));

// SignInManager<T>：登录管理
var signInManager = serviceProvider.GetRequiredService<SignInManager<ApplicationUser>>();

// 登录
await signInManager.SignInAsync(user, isPersistent: false);

// 外部登录
await signInManager.ExternalLoginSignInAsync(loginInfo, isPersistent: false);

// RoleManager<T>：角色管理
var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

// 创建角色
await roleManager.CreateAsync(new IdentityRole("Admin"));
```

> **注意**：`SignInManager` 依赖 Cookie 认证。对于无状态 API（如 JWT），推荐使用 `UserManager` + JWT 签发，而非 `SignInManager`。

---

### 基于 Cookie 的身份验证

Cookie 认证是传统 MVC 应用的默认认证方式，通过浏览器 Cookie 维持登录状态。

#### 配置 Cookie 认证

```csharp
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Account/Login";           // 未登录时跳转的路径
        options.LogoutPath = "/Account/Logout";
        options.AccessDeniedPath = "/Account/AccessDenied";
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;               // 滑动过期
        options.Cookie.HttpOnly = true;                 // 防止 XSS 读取 Cookie
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always; // 仅 HTTPS
        options.Cookie.SameSite = SameSiteMode.Strict;  // 防止 CSRF
    });
```

#### 登录与登出

```csharp
public class AccountController : Controller
{
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly UserManager<ApplicationUser> _userManager;

    [HttpPost]
    public async Task<IActionResult> Login(LoginViewModel model)
    {
        if (!ModelState.IsValid) return View(model);
        
        var result = await _signInManager.PasswordSignInAsync(
            model.Email, model.Password, 
            model.RememberMe, lockoutOnFailure: true);
        
        if (result.Succeeded)
        {
            return RedirectToAction("Index", "Home");
        }
        
        ModelState.AddModelError(string.Empty, "登录失败");
        return View(model);
    }

    [HttpPost]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return RedirectToAction("Index", "Home");
    }
}
```

#### Cookie 认证 vs JWT 认证

| 对比维度 | Cookie 认证 | JWT 认证 |
|---------|-----------|----------|
| **状态** | 有状态（服务器需维护 Session） | 无状态（令牌自包含） |
| **存储位置** | Cookie（浏览器自动发送） | 通常存储在 localStorage / HTTP-only Cookie |
| **适用场景** | 传统 MVC / Razor Pages | Web API / SPA / 微服务 |
| **跨域** | 需要 CORS 配置 | 天然支持跨域 |
| **安全性** | 受 Cookie 安全策略保护 | 需注意 XSS 和 CSRF 防护 |

---

## 第三部分：JWT 认证篇

### JWT Bearer Token：是什么及如何配置

JWT（JSON Web Token）是一种**轻量级、URL 安全的令牌格式**，由三部分组成：

```
Header.Payload.Signature
```

- **Header**：令牌类型和签名算法（如 HS256、RS256）
- **Payload**：用户身份信息（Claims）
- **Signature**：签名，用于验证令牌未被篡改

#### 配置 JWT 认证

```csharp
// 1. 定义 JWT 配置
public class JwtSettings
{
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpirationMinutes { get; set; } = 30;
}

// 2. 注册 JWT 认证
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>();
        var key = Encoding.UTF8.GetBytes(jwtSettings.Secret);
        
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            
            // 可选：容错
            ClockSkew = TimeSpan.FromSeconds(30)  // 允许 30 秒时间偏差
        };
        
        // 可选：从请求头以外的来源读取令牌
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                // 从查询字符串读取令牌（如 SignalR）
                var token = context.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(token))
                {
                    context.Token = token;
                }
                return Task.CompletedTask;
            }
        };
    });

// 3. 启用
app.UseAuthentication();
app.UseAuthorization();
```

#### 签发 JWT

```csharp
public class TokenService
{
    private readonly JwtSettings _settings;

    public TokenService(IOptions<JwtSettings> settings)
    {
        _settings = settings.Value;
    }

    public string GenerateToken(ApplicationUser user, IList<string> roles)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Name, user.UserName ?? user.Email)
        };

        // 添加角色作为 Claims
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_settings.ExpirationMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

#### 使用 JWT

```csharp
// 客户端请求时在 Authorization 头中携带
// Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

// 控制器中通过 [Authorize] 保护
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    // 获取当前用户信息
    [HttpGet("me")]
    public IActionResult GetCurrentUser()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        return Ok(new { UserId = userId, Email = email });
    }
}
```

---

### 刷新令牌（Refresh Tokens）

JWT 通常有效期较短（5-30 分钟），刷新令牌用于在 JWT 过期后**无需重新登录**即可获取新令牌。

#### 基本流程

```
客户端
    ↓
① 登录：获得 Access Token（短效）+ Refresh Token（长效，如 7 天）
    ↓
② 请求 API：携带 Access Token
    ↓
③ Access Token 过期 → 返回 401
    ↓
④ 客户端用 Refresh Token 请求 /api/auth/refresh
    ↓
⑤ 服务端验证 Refresh Token → 颁发新的 Access Token
    ↓
⑥ 客户端继续请求
```

#### 实现刷新令牌

```csharp
// 用户表扩展 Refresh Token 字段
public class ApplicationUser : IdentityUser
{
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }
}

// 刷新端点
[HttpPost("refresh")]
public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
{
    // 1. 验证 Refresh Token
    var user = await _userManager.Users
        .FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken);
    
    if (user == null || user.RefreshTokenExpiry < DateTime.UtcNow)
    {
        return Unauthorized("无效或过期的刷新令牌");
    }
    
    // 2. 生成新的 Access Token
    var roles = await _userManager.GetRolesAsync(user);
    var newToken = _tokenService.GenerateToken(user, roles);
    
    // 3. 可选：轮换刷新令牌
    var newRefreshToken = Guid.NewGuid().ToString();
    user.RefreshToken = newRefreshToken;
    user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
    await _userManager.UpdateAsync(user);
    
    return Ok(new
    {
        AccessToken = newToken,
        RefreshToken = newRefreshToken,
        ExpiresIn = _jwtSettings.ExpirationMinutes * 60
    });
}
```

#### 安全注意事项

| 注意事项 | 说明 |
|---------|------|
| **刷新令牌存储** | 存储在数据库，支持吊销 |
| **令牌轮换** | 每次刷新时生成新刷新令牌，使旧令牌失效 |
| **存储位置** | 不建议将刷新令牌暴露给前端，可存储在 HTTP-only Cookie |
| **过期时间** | 刷新令牌有效期通常为 7-30 天 |
| **一次性使用** | 建议刷新令牌仅可使用一次 |

---

## 第四部分：授权篇

### 角色授权（Role-based Authorization）

**基于角色的授权**是最简单的授权方式，通过 `[Authorize(Roles = "...")]` 控制访问。

```csharp
// 单个角色
[Authorize(Roles = "Admin")]
public IActionResult AdminPanel() => View();

// 多个角色（或关系）
[Authorize(Roles = "Admin, Manager")]
public IActionResult Management() => View();

// 多个角色（与关系）— 需要同时拥有两个角色
[Authorize(Roles = "Admin")]
[Authorize(Roles = "Manager")]
public IActionResult SuperAdmin() => View();

// 控制器级别 + Action 级别组合
[Authorize(Roles = "Admin")]
public class AdminController : Controller
{
    [Authorize(Roles = "SuperAdmin")]  // 需要 Admin AND SuperAdmin
    public IActionResult SuperOnly() => View();
}
```

### 策略授权（Policy-based Authorization）

**基于策略的授权**更灵活，支持复杂规则组合：

```csharp
// 1. 注册策略
builder.Services.AddAuthorization(options =>
{
    // 单一声明
    options.AddPolicy("CanEdit", policy =>
        policy.RequireClaim("Permission", "Edit"));
    
    // 多条件组合
    options.AddPolicy("EditOrAdmin", policy =>
        policy.RequireAssertion(ctx =>
            ctx.User.IsInRole("Admin") ||
            ctx.User.HasClaim("Permission", "Edit")));
    
    // 复杂策略
    options.AddPolicy("StrictPolicy", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireClaim("Tenant");
        policy.RequireRole("Admin");
    });
});

// 2. 使用策略
[Authorize(Policy = "CanEdit")]
public IActionResult Edit() => View();

[Authorize(Policy = "EditOrAdmin")]
public IActionResult Manage() => View();
```

### 基于声明（Claims）的授权

声明（Claims）是用户属性的键值对，可用于精细化授权：

#### 添加声明

```csharp
// 创建用户时添加声明
await userManager.AddClaimAsync(user, new Claim("Permission", "Edit"));
await userManager.AddClaimAsync(user, new Claim("Department", "Sales"));
await userManager.AddClaimAsync(user, new Claim("DateOfBirth", "1990-01-01"));
```

#### 在代码中访问声明

```csharp
[HttpGet]
public IActionResult Profile()
{
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    var email = User.FindFirst(ClaimTypes.Email)?.Value;
    var permission = User.FindFirst("Permission")?.Value;
    var department = User.FindFirst("Department")?.Value;
    
    return Ok(new { userId, email, permission, department });
}
```

#### 声明授权策略

```csharp
// 基于声明值
options.AddPolicy("SalesOnly", policy =>
    policy.RequireClaim("Department", "Sales"));

// 基于声明存在性
options.AddPolicy("HasEditPermission", policy =>
    policy.RequireClaim("Permission"));
```

---

### 自定义授权策略与处理程序

当内置授权方式无法满足需求时（如“年满 18 岁”、“工作日在职员工”），可自定义授权策略。

#### 示例：年龄限制授权

**步骤 1：定义 Requirement**

```csharp
public class MinimumAgeRequirement : IAuthorizationRequirement
{
    public int MinimumAge { get; }
    
    public MinimumAgeRequirement(int minimumAge)
    {
        MinimumAge = minimumAge;
    }
}
```

**步骤 2：实现 Handler**

```csharp
public class MinimumAgeHandler : AuthorizationHandler<MinimumAgeRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        MinimumAgeRequirement requirement)
    {
        // 从声明中获取出生日期
        var dobClaim = context.User.FindFirst("DateOfBirth")?.Value;
        
        if (string.IsNullOrEmpty(dobClaim))
        {
            return Task.CompletedTask;  // 无声明 → 验证失败（无 Success）
        }
        
        if (DateTime.TryParse(dobClaim, out var dateOfBirth))
        {
            var age = DateTime.UtcNow.Year - dateOfBirth.Year;
            if (dateOfBirth.Date > DateTime.UtcNow.AddYears(-age))
            {
                age--;
            }
            
            if (age >= requirement.MinimumAge)
            {
                context.Succeed(requirement);  // ✅ 满足条件
            }
        }
        
        return Task.CompletedTask;
    }
}
```

**步骤 3：注册策略与 Handler**

```csharp
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Age18Policy", policy =>
        policy.Requirements.Add(new MinimumAgeRequirement(18)));
});

builder.Services.AddSingleton<IAuthorizationHandler, MinimumAgeHandler>();
```

**步骤 4：使用策略**

```csharp
[Authorize(Policy = "Age18Policy")]
[HttpGet("adult-content")]
public IActionResult GetAdultContent()
{
    return Ok("您已年满 18 岁，可访问此内容");
}
```

#### 多个 Requirement 组合

```csharp
// 所有 Requirement 必须全部满足
options.AddPolicy("Strict", policy =>
{
    policy.RequireAuthenticatedUser();
    policy.RequireClaim("Tenant");
    policy.Requirements.Add(new MinimumAgeRequirement(21));
});
```

---

### [Authorize] 与 [AllowAnonymous] 的使用

| 特性 | 作用 | 使用场景 |
|------|------|----------|
| `[Authorize]` | 要求用户已登录 | 所有需要登录的页面/API |
| `[Authorize(Roles = "Admin")]` | 仅允许特定角色 | 管理后台 |
| `[Authorize(Policy = "CanEdit")]` | 满足自定义策略 | 精细化权限控制 |
| `[AllowAnonymous]` | 允许匿名访问 | 登录页面、注册页面、公开 API |

```csharp
[Authorize]  // 整个控制器需要登录
public class DashboardController : Controller
{
    public IActionResult Index() => View();
    
    [AllowAnonymous]  // 此 Action 允许匿名访问
    public IActionResult PublicInfo() => View();
}
```

---

## 第五部分：高级特性篇

### 外部登录（OAuth / OpenID Connect）

ASP.NET Core 支持多种外部登录提供程序：

```csharp
builder.Services.AddAuthentication()
    .AddGoogle(options =>
    {
        options.ClientId = builder.Configuration["Authentication:Google:ClientId"];
        options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
    })
    .AddMicrosoftAccount(options =>
    {
        options.ClientId = builder.Configuration["Authentication:Microsoft:ClientId"];
        options.ClientSecret = builder.Configuration["Authentication:Microsoft:ClientSecret"];
    })
    .AddFacebook(options =>
    {
        options.AppId = builder.Configuration["Authentication:Facebook:AppId"];
        options.AppSecret = builder.Configuration["Authentication:Facebook:AppSecret"];
    })
    .AddOpenIdConnect(options =>
    {
        options.Authority = "https://your-identity-server";
        options.ClientId = "your-client-id";
        options.ClientSecret = "your-client-secret";
        options.ResponseType = "code";
        options.Scope.Add("openid");
        options.Scope.Add("profile");
        options.Scope.Add("email");
    });
```

#### 外部登录集成 Identity

使用 ASP.NET Core Identity 时，外部登录可自动关联到用户账户：

```csharp
// 1. 配置外部登录
builder.Services.AddAuthentication()
    .AddGoogle(options => { /* ... */ });

// 2. 在登录页面中添加外部登录按钮
<a asp-action="ExternalLogin" asp-route-provider="Google">登录 Google</a>

// 3. 外部登录回调处理
[HttpGet("ExternalLoginCallback")]
public async Task<IActionResult> ExternalLoginCallback(string returnUrl = null)
{
    var info = await _signInManager.GetExternalLoginInfoAsync();
    if (info == null)
    {
        return RedirectToAction(nameof(Login));
    }
    
    // 尝试使用外部登录信息登录
    var result = await _signInManager.ExternalLoginSignInAsync(
        info.LoginProvider, info.ProviderKey, isPersistent: false);
    
    if (result.Succeeded)
    {
        return RedirectToLocal(returnUrl);
    }
    
    // 如果用户不存在，跳转到注册页面关联
    ViewData["ReturnUrl"] = returnUrl;
    ViewData["LoginProvider"] = info.LoginProvider;
    return View("ExternalLoginConfirmation", new ExternalLoginConfirmationViewModel());
}
```

---

### 双因素认证（Two-Factor Authentication, 2FA）

ASP.NET Core Identity 原生支持 2FA，支持三种方式：

| 方式 | 说明 | 适用场景 |
|------|------|----------|
| **TOTP（身份验证器）** | 使用 Google Authenticator / Microsoft Authenticator | 最安全，推荐 |
| **短信（SMS）** | 发送验证码到手机 | 用户接受度较高 |
| **邮件（Email）** | 发送验证码到邮箱 | 备用方式 |

#### 启用 2FA

```csharp
// 1. 配置 Identity 支持 2FA
builder.Services.Configure<IdentityOptions>(options =>
{
    options.SignIn.RequireConfirmedAccount = true;
});

// 2. 为用户启用 2FA
[HttpPost("enable-2fa")]
public async Task<IActionResult> EnableTwoFactorAuthentication()
{
    var user = await _userManager.GetUserAsync(User);
    var isEnabled = await _userManager.SetTwoFactorEnabledAsync(user, true);
    return Ok(new { Enabled = isEnabled });
}

// 3. 生成验证码（TOTP）
[HttpGet("2fa-qr")]
public async Task<IActionResult> GetTwoFactorQrCode()
{
    var user = await _userManager.GetUserAsync(User);
    var key = await _userManager.GetAuthenticatorKeyAsync(user);
    if (string.IsNullOrEmpty(key))
    {
        await _userManager.ResetAuthenticatorKeyAsync(user);
        key = await _userManager.GetAuthenticatorKeyAsync(user);
    }
    
    var qrUrl = $"otpauth://totp/{Uri.EscapeDataString("MyApp")}:{user.Email}?secret={key}&issuer=MyApp";
    return Ok(new { QrUrl = qrUrl, Key = key });
}

// 4. 验证 2FA 码
[HttpPost("verify-2fa")]
public async Task<IActionResult> VerifyTwoFactor([FromBody] TwoFactorCodeDto dto)
{
    var user = await _userManager.GetUserAsync(User);
    var isValid = await _userManager.VerifyTwoFactorTokenAsync(
        user, _userManager.Options.Tokens.AuthenticatorTokenProvider, dto.Code);
    
    if (isValid)
    {
        await _userManager.SetTwoFactorEnabledAsync(user, true);
        return Ok(new { Success = true });
    }
    
    return BadRequest("验证码无效");
}
```

#### 登录时验证 2FA

```csharp
[HttpPost("login")]
public async Task<IActionResult> Login(LoginViewModel model)
{
    var user = await _userManager.FindByEmailAsync(model.Email);
    if (user == null)
    {
        return Unauthorized("用户不存在");
    }
    
    // 检查密码
    var isPasswordValid = await _userManager.CheckPasswordAsync(user, model.Password);
    if (!isPasswordValid)
    {
        return Unauthorized("密码错误");
    }
    
    // 检查是否启用了 2FA
    if (await _userManager.GetTwoFactorEnabledAsync(user))
    {
        // 要求用户提供 2FA 验证码
        var code = await _userManager.GenerateTwoFactorTokenAsync(
            user, _userManager.Options.Tokens.AuthenticatorTokenProvider);
        // 通过邮件/短信发送 code
        return Ok(new { RequiresTwoFactor = true, UserId = user.Id });
    }
    
    // 正常登录
    await _signInManager.SignInAsync(user, isPersistent: false);
    return Ok(new { Success = true });
}

[HttpPost("verify-2fa-login")]
public async Task<IActionResult> VerifyTwoFactorLogin(VerifyTwoFactorDto dto)
{
    var user = await _userManager.FindByIdAsync(dto.UserId);
    var isValid = await _userManager.VerifyTwoFactorTokenAsync(
        user, _userManager.Options.Tokens.AuthenticatorTokenProvider, dto.Code);
    
    if (!isValid)
    {
        return Unauthorized("验证码无效");
    }
    
    await _signInManager.SignInAsync(user, isPersistent: false);
    return Ok(new { Success = true });
}
```

---

### 令牌过期与吊销

#### 令牌过期

JWT 的过期时间由 `Expires` 字段控制：

```csharp
var token = new JwtSecurityToken(
    // ...
    expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes)
);
```

#### 令牌吊销

JWT 本身是无状态的，吊销需要额外机制：

**方案一：黑名单（Blacklist）**

```csharp
// 1. 维护一个 Redis/数据库黑名单
public class TokenBlacklistService
{
    private readonly IMemoryCache _cache;

    public TokenBlacklistService(IMemoryCache cache)
    {
        _cache = cache;
    }

    public void AddToBlacklist(string token, TimeSpan expiry)
    {
        _cache.Set($"blacklist:{token}", true, expiry);
    }

    public bool IsBlacklisted(string token)
    {
        return _cache.TryGetValue($"blacklist:{token}", out _);
    }
}

// 2. JWT 中间件中检查黑名单
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = context =>
            {
                var token = context.SecurityToken as JwtSecurityToken;
                var blacklist = context.HttpContext.RequestServices
                    .GetRequiredService<TokenBlacklistService>();
                
                if (blacklist.IsBlacklisted(token?.RawData ?? string.Empty))
                {
                    context.Fail("Token has been revoked");
                }
                return Task.CompletedTask;
            }
        };
    });
```

**方案二：版本号（Version）**

在用户表中存储 `TokenVersion`，每次登录/吊销时递增：

```csharp
public class ApplicationUser : IdentityUser
{
    public int TokenVersion { get; set; }
}

// 签发 JWT 时包含版本号
var claims = new List<Claim>
{
    new Claim("TokenVersion", user.TokenVersion.ToString())
};

// 验证时检查版本号
options.TokenValidationParameters = new TokenValidationParameters
{
    // ...
    ValidateTokenVersion = true  // 自定义验证
};

// 吊销用户的所有令牌
user.TokenVersion++;
await _userManager.UpdateAsync(user);
```

---

### 数据保护（Data Protection）

ASP.NET Core 内置 Data Protection API，用于加密敏感数据：

| 使用场景 | 说明 |
|---------|------|
| **认证 Cookie** | Cookie 中间件自动使用 Data Protection |
| **密码重置令牌** | Identity 的 `GeneratePasswordResetTokenAsync` |
| **邮箱确认令牌** | Identity 的 `GenerateEmailConfirmationTokenAsync` |
| **防伪令牌** | `[ValidateAntiForgeryToken]` |

#### 配置 Data Protection

```csharp
services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(@"\\server\keys\"))  // 密钥存储位置
    .SetApplicationName("MyApp")                                    // 应用隔离
    .SetDefaultKeyLifetime(TimeSpan.FromDays(90))                  // 密钥生命周期
    .ProtectKeysWithCertificate("path/to/certificate.pfx");        // 密钥加密
```

> **多服务器部署**：多个实例必须共享密钥存储路径，否则 Cookie/令牌无法跨实例解密。

---

### 多租户身份验证（Multi-tenant Auth）

多租户场景的常见策略：

```csharp
// 1. 在 Claims 中存储 Tenant ID
public class TenantClaimHandler : AuthorizationHandler<IAuthorizationRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        IAuthorizationRequirement requirement)
    {
        var tenantId = context.User.FindFirst("TenantId")?.Value;
        // 基于 TenantId 进行授权判断
        return Task.CompletedTask;
    }
}

// 2. 中间件解析当前租户
app.Use(async (context, next) =>
{
    var tenantId = context.Request.Headers["X-Tenant-Id"].FirstOrDefault();
    if (!string.IsNullOrEmpty(tenantId))
    {
        // 将租户信息存储到 HttpContext 中
        context.Items["TenantId"] = tenantId;
    }
    await next();
});

// 3. 按租户过滤数据
public class ProductService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly AppDbContext _context;

    public async Task<List<Product>> GetProductsAsync()
    {
        var tenantId = _httpContextAccessor.HttpContext?.Items["TenantId"] as string;
        return await _context.Products
            .Where(p => p.TenantId == tenantId)
            .ToListAsync();
    }
}
```

---

### 密码存储安全

ASP.NET Core Identity 默认使用 **PBKDF2** 算法进行密码哈希，是一种安全的密码存储方式。

#### Identity 默认哈希流程

```
用户密码 → 生成随机盐 → PBKDF2 迭代 → 存储 {盐 + 哈希结果}
```

#### 自定义密码哈希器

```csharp
public class CustomPasswordHasher<TUser> : IPasswordHasher<TUser>
    where TUser : class
{
    public string HashPassword(TUser user, string password)
    {
        // 使用 Argon2id 或 bcrypt
        return BCrypt.HashPassword(password, BCrypt.GenerateSalt());
    }

    public PasswordVerificationResult VerifyHashedPassword(
        TUser user, string hashedPassword, string providedPassword)
    {
        var isValid = BCrypt.Verify(providedPassword, hashedPassword);
        return isValid 
            ? PasswordVerificationResult.Success 
            : PasswordVerificationResult.Failed;
    }
}

// 注册自定义 PasswordHasher
services.AddScoped<IPasswordHasher<ApplicationUser>, CustomPasswordHasher<ApplicationUser>>();
```

#### 密码存储最佳实践

| 原则 | 说明 |
|------|------|
| **不存储明文** | 永远不以任何形式存储明文密码 |
| **使用盐** | 每个用户使用独立的随机盐 |
| **使用强哈希算法** | PBKDF2 / bcrypt / Argon2id |
| **增加迭代次数** | 随着硬件性能提升，适当增加迭代次数 |
| **密码强度策略** | 最小长度 8 位，包含大小写、数字、特殊字符 |

---

## 第六部分：面试避坑清单

| 序号 | ❌ 常见错误 | ✅ 正确理解 |
|------|-----------|-----------|
| 1 | 混淆 Authentication 和 Authorization | Authentication = 你是谁，Authorization = 你能做什么 |
| 2 | 忘记调用 `app.UseAuthentication()` | 认证中间件必须显式添加到管道 |
| 3 | 在无状态 API 中使用 Cookie 认证 | API 推荐使用 JWT Bearer 认证 |
| 4 | JWT Secret 硬编码在代码中 | 应存储在环境变量 / Key Vault / 配置中 |
| 5 | 刷新令牌与访问令牌存放在同一处 | 刷新令牌应安全存储（如 HTTP-only Cookie） |
| 6 | 忘记设置 JWT 过期时间 | 无过期时间 = 永久有效，存在安全风险 |
| 7 | 所有 Action 都加 `[Authorize]` | 登录/注册等公开端点加 `[AllowAnonymous]` |
| 8 | 角色授权过细或过粗 | 复杂权限用策略授权（Policy），简单用角色授权 |
| 9 | 不配置 Cookie 安全选项 | 生产环境设置 `HttpOnly`、`Secure`、`SameSite` |
| 10 | 多服务器不共享 Data Protection 密钥 | 多实例需共享密钥存储，否则 Cookie/令牌解密失败 |

---

## 小结

认证与授权是 ASP.NET Core 安全体系的核心：

- **认证**：确认用户身份，由 `Authentication` 中间件负责，支持 Cookie、JWT、外部 OAuth/OIDC 等多种方式。
- **授权**：判断用户权限，由 `Authorization` 中间件 + `[Authorize]` 特性控制，支持角色、策略、声明、自定义处理器。

回顾全文，记住三个核心原则：

1. **认证先行，授权随后**：认证中间件必须在授权中间件之前注册
2. **安全存储**：密码用强哈希，令牌用环境变量/KV，Cookie 配置安全选项
3. **最小权限原则**：只授予用户必要的最小权限
