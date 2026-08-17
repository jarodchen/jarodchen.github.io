---
tags: ["aspnetcore"]
category: .NET Core
categories:
  - 面试
  - 后端开发
date: 2026-05-07T16:19:00
banner: /images/aspnetcore1.webp
title: ASP.NET Core 面试题 配置与日志
description: 系统梳理 ASP.NET Core 中配置管理和日志记录的核心知识点，涵盖多环境配置、Options 模式、机密管理、配置提供程序、日志级别及最佳实践。
---

# ASP.NET Core 面试题 配置与日志

> 配置和日志是 ASP.NET Core 应用程序的“眼睛”——配置让应用在不同环境中灵活运行，日志让运行状态清晰可见。

在 ASP.NET Core 的面试中，配置管理和日志记录几乎是每个岗位的必考内容。它们不仅是框架的基础设施，更直接关系到应用的安全性、可维护性和可观测性。

本文将系统梳理配置与日志的核心知识点，从多环境配置到 Options 模式，从机密管理到日志级别，一网打尽。

---

## 第一部分：配置基础篇

### appsettings.json 与 appsettings.{Environment}.json 的作用

ASP.NET Core 默认使用 JSON 文件作为主要配置源，并提供**环境级别覆盖**机制。

| 配置文件 | 作用 | 加载时机 |
|---------|------|----------|
| `appsettings.json` | **基础配置**，所有环境通用 | 始终加载（必需） |
| `appsettings.{Environment}.json` | **环境专属配置**，覆盖基础配置 | 根据当前环境加载 |

#### 加载顺序

```
appsettings.json（基础）
    ↓
appsettings.Development.json（开发环境覆盖）
    ↓
appsettings.Staging.json（预发布环境覆盖）
    ↓
appsettings.Production.json（生产环境覆盖）← 最终生效
```

**核心规则**：后加载的配置会**覆盖**先加载的，相同键以后者为准。

#### 设置运行环境

```bash
# Linux / macOS
export ASPNETCORE_ENVIRONMENT=Development

# Windows PowerShell
$env:ASPNETCORE_ENVIRONMENT = "Development"

# Windows CMD（持久化，需新开终端生效）
setx ASPNETCORE_ENVIRONMENT Development
```

> **注意**：未设置环境变量时，默认使用 `Production`。

---

### 基于环境的配置（Development / Staging / Production）

#### 环境名称约定

| 环境名称 | 说明 | 典型用途 |
|---------|------|----------|
| `Development` | 开发环境 | 本地开发，启用详细错误页、Swagger |
| `Staging` | 预发布环境 | 上线前验证，接近生产配置 |
| `Production` | 生产环境 | 正式运行，优化性能和安全性 |

> 环境名称**不限于**这三个，可以自定义（如 `Test`、`Demo` 等），但需与配置文件名保持一致。

#### 在代码中判断环境

```csharp
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
}
else if (app.Environment.IsStaging())
{
    app.UseSwagger();  // 预发布可保留 Swagger
}
else  // Production
{
    app.UseExceptionHandler("/error");
    app.UseHsts();
}

// 通用判断方法
if (app.Environment.IsEnvironment("Staging")) { ... }
```

#### 典型环境差异配置

| 配置项 | Development | Staging | Production |
|--------|-------------|---------|------------|
| **数据库连接串** | 本地数据库 | 预发布数据库 | 生产数据库（高可用） |
| **日志级别** | Debug/Information | Information | Warning/Error |
| **Swagger** | ✅ 启用 | ✅ 可选 | ❌ 禁用 |
| **异常详情** | DeveloperExceptionPage | 友好错误页 | 友好错误页 |
| **HSTS** | ❌ 禁用 | ❌ 禁用 | ✅ 启用 |

---

### 通过环境变量与命令行覆盖配置

ASP.NET Core 支持多层配置覆盖，优先级从低到高依次为：

#### 配置优先级（由低到高）

```
① appsettings.json
    ↓
② appsettings.{Environment}.json
    ↓
③ User Secrets（仅开发环境）
    ↓
④ 环境变量（Environment Variables）
    ↓
⑤ 命令行参数（Command Line Arguments）← 最高优先级
```

#### 环境变量覆盖配置

使用**双下划线 `__`** 表示配置层级：

```bash
# Linux / macOS
export MyApp__Logging__LogLevel__Default=Warning
export ConnectionStrings__DefaultConnection="Server=prod;..."

# Windows PowerShell
$env:MyApp__Logging__LogLevel__Default = "Warning"
```

#### 命令行参数覆盖配置

使用**冒号 `:`** 表示层级：

```bash
# 启动时覆盖配置
dotnet run --Logging:LogLevel:Default=Debug

# 或启动已编译的应用
dotnet MyApp.dll --ConnectionStrings:Default="Host=127.0.0.1;..."
```

> **规则总结**：环境变量用 `__`，命令行参数用 `:`，两者都能映射到配置树的对应层级。

---

### 使用 IConfiguration 读取配置

通过依赖注入获取 `IConfiguration` 实例，支持多种读取方式：

```csharp
public class MyService
{
    private readonly IConfiguration _config;

    public MyService(IConfiguration config)
    {
        _config = config;
    }

    public void DoWork()
    {
        // 1. 直接读取（返回 string?）
        var apiKey = _config["MySettings:ApiKey"];
        
        // 2. 读取并指定类型 + 默认值
        var timeout = _config.GetValue<int>("MySettings:Timeout", 30);
        var enabled = _config.GetValue<bool>("MySettings:Enabled", false);
        
        // 3. 获取配置节（子节点）
        var section = _config.GetSection("MySettings");
        
        // 4. 读取连接字符串（专用方法）
        var conn = _config.GetConnectionString("DefaultConnection");
        
        // 5. 获取绑定到强类型对象
        var settings = _config.GetSection("MySettings").Get<MySettings>();
    }
}
```

#### 常用方法速查

| 方法 | 说明 | 示例 |
|------|------|------|
| `config["Key:SubKey"]` | 读取字符串值 | `config["ApiKey"]` |
| `config.GetValue<T>("Key", defaultValue)` | 读取指定类型的值 | `config.GetValue<int>("Timeout", 30)` |
| `config.GetSection("Key")` | 获取配置子节 | `config.GetSection("MySettings")` |
| `config.GetConnectionString("Name")` | 读取连接字符串 | `config.GetConnectionString("Default")` |
| `config.GetChildren()` | 获取所有子节 | 遍历配置树 |

---

### 连接字符串管理

#### 配置文件中的连接字符串

```json
{
    "ConnectionStrings": {
        "DefaultConnection": "Server=localhost;Database=AppDb;Trusted_Connection=True;",
        "RedisConnection": "localhost:6379"
    }
}
```

#### 读取连接字符串

```csharp
var defaultConn = builder.Configuration.GetConnectionString("DefaultConnection");
```

#### 注册 DbContext

```csharp
// SQL Server
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
```

#### 环境变量覆盖连接字符串

```bash
# Linux/macOS
export ConnectionStrings__DefaultConnection="Server=prod;..."

# Windows PowerShell
$env:ConnectionStrings__DefaultConnection="Server=prod;..."
```

---

## 第二部分：Options 模式篇

### 将配置节绑定到 POCO（Options 模式）

Options 模式是 ASP.NET Core 推荐的**强类型配置访问方式**。

#### 定义 POCO 类

```csharp
public class MySettings
{
    public string ApiKey { get; set; } = string.Empty;
    public int Timeout { get; set; } = 30;
    public bool Enabled { get; set; } = true;
}
```

#### 注册与绑定

```csharp
// Program.cs
builder.Services.Configure<MySettings>(
    builder.Configuration.GetSection("MySettings"));

// 或使用 AddOptions（支持更多功能）
builder.Services.AddOptions<MySettings>()
    .Bind(builder.Configuration.GetSection("MySettings"));
```

#### 使用配置

```csharp
public class MyService
{
    private readonly MySettings _settings;

    public MyService(IOptions<MySettings> options)
    {
        _settings = options.Value;
    }

    public void DoWork()
    {
        var apiKey = _settings.ApiKey;
        var timeout = _settings.Timeout;
    }
}
```

---

### IOptions / IOptionsSnapshot / IOptionsMonitor 对比

| 接口 | 生命周期 | 配置更新 | 适用场景 |
|------|---------|---------|----------|
| **`IOptions<T>`** | 单例（Singleton） | ❌ 启动时读取一次，不会热更新 | 配置在应用生命周期内不变 |
| **`IOptionsSnapshot<T>`** | Scoped | ✅ **每个请求**重新读取最新值 | Web 应用需要按请求获取最新配置 |
| **`IOptionsMonitor<T>`** | 单例（Singleton） | ✅ 支持变更通知（`OnChange`） | 后台服务、长生命周期组件需响应配置变化 |

#### 代码示例

```csharp
// 1. IOptions：启动时快照（适合配置不变的场景）
public class ServiceWithOptions
{
    private readonly MySettings _settings;
    public ServiceWithOptions(IOptions<MySettings> options)
    {
        _settings = options.Value;  // 应用启动时读取，之后不变
    }
}

// 2. IOptionsSnapshot：每个请求最新（适合需要热更新的场景）
public class ServiceWithSnapshot
{
    private readonly MySettings _settings;
    public ServiceWithSnapshot(IOptionsSnapshot<MySettings> snapshot)
    {
        _settings = snapshot.Value;  // 每个请求重新读取
    }
}

// 3. IOptionsMonitor：支持变更回调（适合后台任务）
public class ServiceWithMonitor : IDisposable
{
    private readonly IOptionsMonitor<MySettings> _monitor;
    private readonly IDisposable _subscription;

    public ServiceWithMonitor(IOptionsMonitor<MySettings> monitor)
    {
        _monitor = monitor;
        _subscription = monitor.OnChange(newSettings =>
        {
            Console.WriteLine($"配置已更新：ApiKey = {newSettings.ApiKey}");
            // 执行配置变更后的处理逻辑
        });
    }

    public void Dispose() => _subscription?.Dispose();
}
```

#### 选型决策树

```
配置是否需要在运行时变更？
├── ❌ 不需要变化 → 使用 IOptions<T>（单例服务）
└── ✅ 需要变化
    ├── 服务是 Scoped/Transient？ → 使用 IOptionsSnapshot<T>
    └── 服务是 Singleton？ → 使用 IOptionsMonitor<T>
```

#### ⚠️ 常见陷阱

```csharp
// ❌ 错误：在 Singleton 服务中使用 IOptionsSnapshot（会报错）
public class BadService
{
    public BadService(IOptionsSnapshot<MySettings> snapshot)  // Singleton 注入 Scoped
    {
        // 运行时抛出异常：Cannot resolve scoped service
    }
}

// ✅ 正确：Singleton 用 IOptionsMonitor
public class GoodService
{
    public GoodService(IOptionsMonitor<MySettings> monitor) { ... }
}
```

---

### 配置验证

#### 方式一：数据注解验证

```csharp
public class MySettings
{
    [Required(ErrorMessage = "ApiKey 不能为空")]
    public string ApiKey { get; set; } = string.Empty;
    
    [Range(1, 120, ErrorMessage = "Timeout 必须在 1~120 之间")]
    public int Timeout { get; set; } = 30;
    
    [Url(ErrorMessage = "Endpoint 必须是有效的 URL")]
    public string Endpoint { get; set; } = string.Empty;
}

// 注册时启用验证
builder.Services.AddOptions<MySettings>()
    .Bind(builder.Configuration.GetSection("MySettings"))
    .ValidateDataAnnotations()      // 数据注解验证
    .ValidateOnStart();             // 启动时验证（失败则抛异常）
```

#### 方式二：自定义 IValidateOptions`<T>`

```csharp
public class MySettingsValidator : IValidateOptions<MySettings>
{
    public ValidateOptionsResult Validate(string? name, MySettings options)
    {
        if (options is null)
            return ValidateOptionsResult.Fail("Options instance is null.");

        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(options.ApiKey))
            errors.Add("ApiKey is required.");

        if (options.Timeout < 1 || options.Timeout > 120)
            errors.Add("Timeout must be between 1 and 120.");

        if (!Uri.IsWellFormedUriString(options.Endpoint, UriKind.Absolute))
            errors.Add("Endpoint must be a valid absolute URL.");

        return errors.Count == 0
            ? ValidateOptionsResult.Success
            : ValidateOptionsResult.Fail(errors);
    }
}

// 注册
builder.Services.AddSingleton<IValidateOptions<MySettings>, MySettingsValidator>();
```

#### 方式三：内联委托验证

```csharp
builder.Services.AddOptions<MySettings>()
    .Bind(builder.Configuration.GetSection("MySettings"))
    .Validate(settings =>
        Uri.IsWellFormedUriString(settings.Endpoint, UriKind.Absolute),
        "Endpoint must be a valid absolute URL.");
```

#### 验证方式对比

| 方式 | 适用场景 | 优点 | 缺点 |
|------|---------|------|------|
| **数据注解** | 字段级简单校验 | 声明式、简洁 | 跨字段验证困难 |
| **IValidateOptions** | 复杂业务规则验证 | 灵活、可注入服务、可测试 | 代码量较多 |
| **内联委托** | 单条简单规则 | 快捷 | 复杂逻辑难以维护 |

---

### 配置提供程序（Configuration Providers）

ASP.NET Core 支持多种配置源，按添加顺序依次加载，**后添加的覆盖先添加的**。

#### 内置配置提供程序

| 提供程序 | 来源 | 热重载 | 典型场景 |
|---------|------|--------|----------|
| **JSON 文件** | `appsettings.json` | ✅ 支持 | **默认推荐**，最常用 |
| **环境变量** | OS 环境变量 | ❌ 不支持 | 生产环境覆盖敏感配置 |
| **命令行** | 命令行参数 | ❌ 不支持 | CI/CD 部署时动态覆盖 |
| **User Secrets** | 本地 `secrets.json` | ✅ 支持 | **开发环境**存储机密 |
| **Azure Key Vault** | Azure 密钥库 | ❌ 不支持（需重启） | **生产环境**安全管理机密 |
| **Azure App Configuration** | Azure 配置服务 | ✅ 支持 | 集中管理应用配置 |
| **INI 文件** | `.ini` 文件 | ✅ 支持 | 传统配置格式 |
| **XML 文件** | `.xml` 文件 | ✅ 支持 | 兼容旧系统 |
| **内存配置** | 代码中 `Dictionary` | ❌ 不支持 | 单元测试、临时数据 |

#### 自定义配置源

可通过实现 `IConfigurationSource` 和 `IConfigurationProvider` 创建自定义配置源，如从数据库、Redis 或远程服务读取配置。

#### 加载顺序示例

```csharp
var builder = WebApplication.CreateBuilder(args);

// 默认加载顺序
builder.Configuration
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables()
    .AddCommandLine(args);

// 后加载的优先级更高
// 例如：环境变量会覆盖 JSON 中的配置
```

---

### 配置变更自动重载

#### 哪些配置源支持热重载？

| 配置源 | 热重载支持 | 说明 |
|--------|-----------|------|
| JSON 文件 | ✅ 支持 | 需要设置 `reloadOnChange: true` |
| INI 文件 | ✅ 支持 | 需要设置 `reloadOnChange: true` |
| XML 文件 | ✅ 支持 | 需要设置 `reloadOnChange: true` |
| 环境变量 | ❌ 不支持 | 需重启应用 |
| 命令行参数 | ❌ 不支持 | 需重启应用 |
| User Secrets | ✅ 支持 | 修改后自动重载 |
| Azure App Configuration | ✅ 支持 | 支持配置刷新 |

#### 配置热重载的使用

```csharp
// 添加 JSON 文件时启用热重载
builder.Configuration
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", 
                 optional: true, reloadOnChange: true);

// 使用 IOptionsMonitor 自动感知变更
public class MyService
{
    public MyService(IOptionsMonitor<MySettings> monitor)
    {
        // 每次读取都获取最新值
        var current = monitor.CurrentValue;
        
        // 注册变更回调
        monitor.OnChange(newSettings => 
        {
            Console.WriteLine("配置已更新");
        });
    }
}
```

#### ⚠️ 重要提醒

- `IOptions<T>` 不会感知配置变更（启动时读取一次）
- `IOptionsSnapshot<T>` 每个请求重新读取（需配置热重载支持）
- `IOptionsMonitor<T>` 支持变更回调（需配置热重载支持）
- 并非所有配置源都支持热重载

---

### 默认值与可选配置

#### POCO 中设置默认值

```csharp
public class MySettings
{
    // ✅ 基础配置：设置合理默认值
    public int Timeout { get; set; } = 30;
    public bool Enabled { get; set; } = true;
    
    // ✅ 可选配置：使用可空类型
    public string? Region { get; set; }
    
    // ⚠️ 敏感配置：不要设置硬编码默认值
    public string ApiKey { get; set; } = string.Empty;  // 应由外部提供
}
```

#### 读取时设置回退值

```csharp
// 方式一：使用 GetValue
var timeout = config.GetValue<int>("MySettings:Timeout", 30);

// 方式二：使用 null 合并运算符
var apiKey = config["MySettings:ApiKey"] ?? "fallback-key";

// 方式三：使用 POCO + Options 模式（推荐）
builder.Services.Configure<MySettings>(
    config.GetSection("MySettings"));
// 在 POCO 中已设置默认值
```

#### 最佳实践

| 配置类型 | 处理方式 | 示例 |
|---------|---------|------|
| **合理默认值** | 在 POCO 中直接设置 | `Timeout = 30` |
| **必填配置** | 数据注解 `[Required]` | `[Required] public string ApiKey` |
| **可选配置** | 使用可空类型 | `string? Region` |
| **敏感配置** | 外部提供，不设默认值 | `string.Empty` + `[Required]` |
| **环境差异配置** | 环境配置文件覆盖 | `appsettings.Production.json` |

---

## 第三部分：机密与安全篇

### 机密管理（User Secrets / Azure Key Vault）

#### 本地开发：User Secrets

User Secrets 在开发环境存储敏感信息，**不会提交到版本库**。

```bash
# 1. 初始化（项目目录下）
dotnet user-secrets init

# 2. 设置机密
dotnet user-secrets set "MySettings:ApiKey" "your-api-key-here"
dotnet user-secrets set "MySettings:Secret" "super-secret-value"

# 3. 查看已设置的机密
dotnet user-secrets list

# 4. 移除特定机密
dotnet user-secrets remove "MySettings:ApiKey"

# 5. 清除所有机密
dotnet user-secrets clear
```

**读取机密**：

```csharp
// User Secrets 会在开发环境中自动加载
// 与 appsettings.json 中的配置合并（User Secrets 优先级更高）
var apiKey = builder.Configuration["MySettings:ApiKey"];
```

> **注意**：User Secrets **仅用于本地开发**，不要在生产环境使用。

#### 生产环境：Azure Key Vault

```csharp
using Azure.Identity;
using Azure.Security.KeyVault.Secrets;

// 配置 Azure Key Vault 作为配置源
var kvUri = new Uri(builder.Configuration["KeyVaultUri"] 
                     ?? "https://my-keyvault.vault.azure.net/");

var client = new SecretClient(kvUri, new DefaultAzureCredential());
builder.Configuration.AddAzureKeyVault(client, 
    new AzureKeyVaultConfigurationOptions());
```

#### 最佳实践对比

| 环境 | 机密存储方式 | 说明 |
|------|------------|------|
| **本地开发** | User Secrets | 存储在用户本地，不入库 |
| **CI/CD** | 环境变量 / 密钥管理 | 在 CI 系统中配置 |
| **Azure 应用** | Azure Key Vault + 托管身份 | 最安全，无凭据存储 |
| **容器/K8s** | K8s Secrets / 环境变量 | 通过容器编排注入 |

---

### 屏蔽敏感配置数据

#### 原则：敏感信息不出现在日志、响应和版本库中

**1. 使用 `[JsonIgnore]` 忽略序列化**

```csharp
public class MySettings
{
    [JsonIgnore]
    public string ApiKey { get; set; } = string.Empty;
    
    public string Endpoint { get; set; } = string.Empty;
}
```

**2. 日志输出时脱敏**

```csharp
public static string MaskSensitiveData(string? value)
{
    if (string.IsNullOrEmpty(value)) return "";
    if (value.Length <= 4) return new string('*', value.Length);
    return new string('*', value.Length - 4) + value[^4..];
}

// 使用示例
_logger.LogInformation("连接字符串: {ConnectionString}", 
    MaskSensitiveData(connectionString));
_logger.LogInformation("API Key: {ApiKey}", 
    MaskSensitiveData(apiKey));
```

**输出示例**：
```
连接字符串: ******localhost;Database=Test
API Key: **************xyz1
```

**3. 禁止直接记录 Configuration 对象**

```csharp
// ❌ 危险：将整个配置写入日志
_logger.LogInformation("配置: {@Config}", 
    configuration.AsEnumerable());

// ✅ 只记录非敏感的键名
_logger.LogInformation("配置键: {Keys}", 
    string.Join(", ", configuration.AsEnumerable().Select(x => x.Key)));
```

**4. 环境变量避免存储明文**

```bash
# ❌ 不推荐：环境变量中明文存储
export ApiKey="your-secret-key-here"

# ✅ 推荐：使用 Key Vault 等机密服务
export KeyVaultUri="https://my-keyvault.vault.azure.net/"
# ApiKey 由应用从 Key Vault 读取
```

#### 敏感数据防护清单

| 防护措施 | 说明 |
|---------|------|
| **不入版本库** | 使用 User Secrets / Key Vault / 环境变量 |
| **日志脱敏** | 只记录部分内容或完全隐藏 |
| **序列化忽略** | 使用 `[JsonIgnore]` 避免意外泄露 |
| **不整体输出** | 避免将整个配置对象写入日志 |
| **传输加密** | 生产环境必须使用 HTTPS |
| **最小权限** | 密钥按最小权限原则分配 |

---

## 第四部分：日志篇

### 日志配置（设置日志级别）

#### 配置文件中的日志级别

```json
{
    "Logging": {
        "LogLevel": {
            "Default": "Information",
            "Microsoft": "Warning",
            "Microsoft.Hosting.Lifetime": "Information",
            "Microsoft.AspNetCore": "Warning",
            "System.Net.Http.HttpClient": "Warning"
        }
    }
}
```

#### 日志级别说明

| 级别 | 说明 | 使用场景 |
|------|------|----------|
| **Trace** | 最详细的调试信息 | 开发时追踪极端细节 |
| **Debug** | 调试信息 | 开发时定位问题 |
| **Information** | 常规信息 | 记录业务流程（默认级别） |
| **Warning** | 警告信息 | 非致命问题，需要关注 |
| **Error** | 错误信息 | 运行时异常，需要处理 |
| **Critical** | 严重错误 | 系统崩溃，需要立即响应 |
| **None** | 不记录任何日志 | 完全禁用日志 |

#### 环境级别配置

在 `appsettings.Development.json` 中覆盖开发环境的日志级别：

```json
{
    "Logging": {
        "LogLevel": {
            "Default": "Debug",
            "Microsoft.AspNetCore": "Information"
        }
    }
}
```

在 `appsettings.Production.json` 中设置生产环境更严格的级别：

```json
{
    "Logging": {
        "LogLevel": {
            "Default": "Warning",
            "Microsoft.AspNetCore": "Warning"
        }
    }
}
```

#### 在代码中配置日志

```csharp
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();
builder.Logging.AddEventLog();  // Windows 事件日志

// 添加筛选
builder.Logging.AddFilter("System.Net.Http.HttpClient", LogLevel.Warning);
builder.Logging.AddFilter("Microsoft", LogLevel.Error);
builder.Logging.AddFilter<ConsoleLoggerProvider>("Microsoft", LogLevel.Information);
```

---

### 使用 ILogger 记录日志

#### 基本用法

```csharp
public class OrderService
{
    private readonly ILogger<OrderService> _logger;

    public OrderService(ILogger<OrderService> logger)
    {
        _logger = logger;
    }

    public async Task ProcessOrderAsync(Order order)
    {
        // 结构化日志（推荐）
        _logger.LogInformation("处理订单 {OrderId}，金额 {Amount}，用户 {UserId}",
            order.Id, order.Amount, order.UserId);

        try
        {
            await _repository.SaveAsync(order);
            _logger.LogInformation("订单 {OrderId} 保存成功", order.Id);
        }
        catch (Exception ex)
        {
            // 记录异常
            _logger.LogError(ex, "订单 {OrderId} 处理失败", order.Id);
            throw;
        }
    }
}
```

#### 常用日志方法

| 方法 | 用途 |
|------|------|
| `LogTrace` | 最详细的跟踪信息 |
| `LogDebug` | 调试信息 |
| `LogInformation` | 常规信息（最常用） |
| `LogWarning` | 警告 |
| `LogError` | 错误（带异常对象） |
| `LogCritical` | 严重错误 |

#### 结构化日志的优势

```csharp
// ❌ 字符串拼接（不推荐）
_logger.LogInformation("用户 " + userId + " 登录成功");

// ✅ 结构化日志（推荐）
_logger.LogInformation("用户 {UserId} 登录成功", userId);
```

结构化日志的好处：
- 日志聚合系统（如 ELK、DataDog）可按字段查询
- 便于统计和分析（如按 UserId 统计登录次数）
- 避免字符串拼接的性能开销

#### 日志上下文

```csharp
// 使用 BeginScope 为一段代码添加统一的上下文信息
using (_logger.BeginScope(new { OrderId = order.Id, UserId = order.UserId }))
{
    _logger.LogInformation("开始处理订单");
    // 所有日志都会包含 OrderId 和 UserId
    await ProcessOrder(order);
    _logger.LogInformation("订单处理完成");
}
```

---

### 常见日志提供程序

| 提供程序 | NuGet 包 | 适用场景 |
|---------|---------|----------|
| **Console** | 内置 | 控制台应用、开发调试 |
| **Debug** | 内置 | Visual Studio 输出窗口 |
| **EventLog** | 内置 | Windows 事件日志 |
| **EventSource** | 内置 | ETW（Windows 性能监控） |
| **Azure Application Insights** | `Microsoft.ApplicationInsights.AspNetCore` | Azure 应用监控 |
| **Serilog** | `Serilog.AspNetCore` | 第三方灵活日志库 |
| **NLog** | `NLog.Web.AspNetCore` | 第三方传统日志库 |
| **Elasticsearch** | `Serilog.Sinks.Elasticsearch` | 集中式日志聚合 |

#### 使用 Serilog 示例

```csharp
// 1. 安装：dotnet add package Serilog.AspNetCore

// 2. 配置
builder.Host.UseSerilog((context, services, config) =>
{
    config.ReadFrom.Configuration(context.Configuration)
          .Enrich.FromLogContext()
          .WriteTo.Console()
          .WriteTo.File("logs/log-.txt", rollingInterval: RollingInterval.Day);
});

// 3. 使用
public class MyService
{
    private readonly ILogger<MyService> _logger;
    // 与使用内置 ILogger 方式相同
}
```

---

## 第五部分：面试避坑清单

| 序号 | ❌ 常见错误 | ✅ 正确理解 |
|------|-----------|-----------|
| 1 | 将机密写在 `appsettings.json` 中入库 | 使用 User Secrets（开发）/ Key Vault（生产） |
| 2 | 在 Singleton 服务中使用 `IOptionsSnapshot` | Singleton 用 `IOptions` 或 `IOptionsMonitor` |
| 3 | 忘记设置环境变量，导致误用生产配置 | 明确设置 `ASPNETCORE_ENVIRONMENT` |
| 4 | 认为 `IOptions` 会自动热重载 | `IOptions` 是启动时快照，不会热重载 |
| 5 | 未启用配置验证，启动后才发现配置错误 | 使用 `ValidateOnStart()` 启动时验证 |
| 6 | 使用 `IOptionsSnapshot` 但不启用 `reloadOnChange` | 需要设置 `reloadOnChange: true` |
| 7 | 将 `IConfiguration` 注入到每个服务 | 推荐使用 Options 模式，更类型安全 |
| 8 | 日志中使用字符串拼接而非结构化日志 | 使用占位符 `{Key}` 记录结构化日志 |
| 9 | 生产环境仍使用 `UseDeveloperExceptionPage` | 生产环境用 `UseExceptionHandler` |
| 10 | 不加验证，导致配置缺失时应用异常启动 | 添加 `ValidateDataAnnotations()` 或自定义验证器 |

---

## 小结

配置和日志是 ASP.NET Core 应用程序的基石：

- **配置系统**：提供多环境、多来源、层级化的配置管理能力，支持 JSON 文件、环境变量、命令行、Key Vault 等多种来源，并通过 Options 模式实现强类型访问。
- **日志系统**：提供结构化、分级别的日志记录能力，支持多种输出目标，便于应用监控和问题诊断。

回顾全文，记住三个核心原则：

1. **配置分层**：基础配置（`appsettings.json`）+ 环境覆盖（`appsettings.{Environment}.json`）+ 运行时覆盖（环境变量/命令行）
2. **Options 模式优先**：使用 `IOptions<T>` / `IOptionsSnapshot<T>` / `IOptionsMonitor<T>` 实现强类型配置访问
3. **机密安全管理**：开发用 User Secrets，生产用 Key Vault，敏感信息绝不入库

