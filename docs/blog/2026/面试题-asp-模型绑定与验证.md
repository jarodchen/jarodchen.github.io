---
tags: ["aspnetcore"]
category: aspnetcore
categories:
  - 面试
  - aspnetcore
date: 2026-05-07T16:19:00
banner: /images/aspnetcore1.webp
title: ASP.NET Core 面试题 模型绑定与验证
description: 系统梳理 ASP.NET Core 中模型绑定和验证的完整知识体系，从基础数据源到自定义绑定器，从数据注解到 FluentValidation，涵盖 API 与 MVC 的差异和最佳实践。
---

# ASP.NET Core 面试题 模型绑定与验证

> 模型绑定和验证是 ASP.NET Core 请求处理的“守门员”——它们负责把原始 HTTP 请求转化为强类型对象，并确保数据质量后再进入业务逻辑。

在 ASP.NET Core 的面试中，模型绑定和验证几乎是每个 API/MVC 相关岗位的必考题。它们不仅是框架的核心机制，更直接关系到系统的安全性、数据完整性和开发效率。

本文将系统梳理模型绑定与验证的核心知识点，从基础原理到高级用法，从内置机制到第三方扩展，一网打尽。

---

## 第一部分：模型绑定基础篇

### 模型绑定如何工作？会用哪些数据源？

**模型绑定（Model Binding）** 是 ASP.NET Core 的自动映射机制：将 HTTP 请求中的原始数据（字符串、文件等）转换为控制器 Action 参数或模型对象的强类型值。

```csharp
[HttpGet("{id}")]
public IActionResult Get([FromRoute] int id, [FromQuery] int page = 1)
{
    // id 从路由中绑定，page 从查询字符串中绑定
    return Ok();
}
```

#### 默认数据源优先级

模型绑定按以下顺序尝试从各种数据源获取值：

```
Route → Query → Form → Body
```

| 数据源 | 说明 | 对应特性 | 示例 |
|--------|------|----------|------|
| **路由** | URL 模板中的占位符 | `[FromRoute]` | `/api/products/5` → `id=5` |
| **查询字符串** | `?` 后的键值对 | `[FromQuery]` | `?page=2&size=10` |
| **表单** | `application/x-www-form-urlencoded` 或 `multipart/form-data` | `[FromForm]` | HTML 表单提交 |
| **请求体** | JSON/XML 等序列化格式 | `[FromBody]` | REST API 的 POST 请求体 |
| **请求头** | HTTP 头部信息 | `[FromHeader]` | `Authorization: Bearer xxx` |
| **服务容器** | DI 容器中的服务 | `[FromServices]` | 注入 `IMyService` |

> **核心原则**：模型绑定只做“数据填充”，不做“数据验证”。验证是独立的一步，在模型绑定完成后执行。

---

### 简单类型 vs 复杂类型的绑定规则

#### 简单类型

**简单类型**包括：`int`、`string`、`bool`、`DateTime`、`decimal`、`Guid`、`Enum` 等。

**默认绑定来源**：`[FromRoute]` 或 `[FromQuery]`（优先从路由查找，再从查询字符串查找）

```csharp
// 不指定来源时
[HttpGet("{id}")]
public IActionResult Get(int id, string filter, int page = 1)
{
    // id → 从路由绑定（优先）
    // filter → 从查询字符串绑定
    // page → 从查询字符串绑定（有默认值）
}
```

**显式指定来源**：

```csharp
public IActionResult Get(
    [FromRoute] int id,       // 强制从路由
    [FromQuery] string filter, // 强制从查询字符串
    [FromForm] string status,  // 强制从表单
    [FromHeader] string auth)  // 强制从请求头
{
    // ...
}
```

#### 复杂类型

**复杂类型**是指自定义类、DTO 或 ViewModel。

**默认绑定来源**：取决于控制器是否标记 `[ApiController]`

| 控制器类型 | 默认来源 | 说明 |
|-----------|---------|------|
| **带 `[ApiController]`** | `[FromBody]` | 从请求体 JSON 自动反序列化 |
| **不带 `[ApiController]`（MVC）** | `[FromRoute]` / `[FromQuery]` / `[FromForm]` | 从表单或查询字符串绑定 |

```csharp
[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    // 有 [ApiController] → product 默认从 Body 绑定
    [HttpPost]
    public IActionResult Create(Product product) { ... }
    
    // 无 [ApiController] → product 从 Form/Query 绑定
    [HttpPost]
    public IActionResult Create(Product product) { ... }  
}
```

**重要限制**：一个 Action 中**只能有一个** `[FromBody]` 参数。

```csharp
// ❌ 错误：两个 FromBody 参数
[HttpPost]
public IActionResult Create([FromBody] Product product, [FromBody] Order order) { ... }

// ✅ 正确：封装为一个 DTO
[HttpPost]
public IActionResult Create([FromBody] CreateOrderRequest request) { ... }

public class CreateOrderRequest
{
    public Product Product { get; set; }
    public Order Order { get; set; }
}
```

---

### 多源绑定特性详解

常用绑定源特性一览：

| 特性 | 数据来源 | 适用场景 |
|------|---------|----------|
| `[FromBody]` | 请求体（JSON/XML） | POST/PUT 请求的复杂数据 |
| `[FromQuery]` | 查询字符串（URL 参数） | GET 请求的筛选、分页参数 |
| `[FromRoute]` | 路由参数 | URL 中的资源标识符 |
| `[FromForm]` | 表单字段 | HTML 表单提交、文件上传 |
| `[FromHeader]` | HTTP 请求头 | 认证令牌、客户端信息 |
| `[FromServices]` | DI 容器 | 注入服务到 Action 方法 |

```csharp
[HttpPost("{id}")]
public IActionResult Update(
    [FromRoute] int id,                         // /api/orders/5
    [FromQuery] bool force,                    // ?force=true
    [FromBody] OrderUpdateRequest request,     // JSON body
    [FromHeader] string token,                 // Authorization header
    [FromForm] IFormFile file)                 // 表单文件
{
    // ...
}
```

---

### 绑定嵌套对象和集合

ASP.NET Core 原生支持嵌套对象和集合的模型绑定，无论是 JSON 还是表单格式。

#### JSON 格式（`[FromBody]`）

```csharp
public class Order
{
    public Customer Customer { get; set; }
    public List<Product> Products { get; set; }
}

public class Customer
{
    public string Name { get; set; }
}

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
}
```

```json
{
    "customer": { "name": "Alice" },
    "products": [
        { "id": 1, "name": "Pen" },
        { "id": 2, "name": "Book" }
    ]
}
```

#### 表单格式（`[FromForm]`）

```
Customer.Name=Alice
Products[0].Id=1
Products[0].Name=Pen
Products[1].Id=2
Products[1].Name=Book
```

**关键点**：属性名匹配 + 索引标记 `[0]`、`[1]` 即可完成集合绑定。

---

### 处理缺失或无效数据

#### 必填与可选

| 场景 | 方式 | 说明 |
|------|------|------|
| **必填值** | `[Required]` 特性 | 模型验证，非模型绑定 |
| **必填绑定（值必须存在）** | `[BindRequired]` | 如果绑定失败，增加模型状态错误 |
| **可选值** | 使用可空类型 `int?`、`string?` | 允许值为空 |
| **默认值** | 方法参数默认值 `int page = 1` | 当值未提供时使用 |

```csharp
public class Product
{
    [Required]               // 验证：值不能为空
    public string Name { get; set; }
    
    [BindRequired]           // 绑定：必须能从请求中获取值
    public int CategoryId { get; set; }
    
    public string? Description { get; set; }  // 可选
}
```

#### `[BindRequired]` vs `[Required]`

| 特性 | 作用阶段 | 失败时 |
|------|---------|--------|
| `[Required]` | **验证**阶段 | `ModelState` 添加错误 |
| `[BindRequired]` | **绑定**阶段（值未从请求中找到） | `ModelState` 添加错误 |

**典型场景**：
- `[Required]`：字段必须有值（如用户名、邮箱）
- `[BindRequired]`：防止恶意请求省略字段（如 `Id` 字段被省略）

---

## 第二部分：进阶绑定篇

### 自定义模型绑定器

当内置绑定方式无法满足需求时（如从请求头解析复杂值、多源合并、特殊格式解析），可实现自定义模型绑定器。

#### 实现步骤

1. 实现 `IModelBinder` 接口
2. 用 `[ModelBinder]` 特性标注参数
3. （可选）全局注册 `IModelBinderProvider`

#### 示例：从请求头绑定用户 ID

```csharp
public class UserIdFromHeaderBinder : IModelBinder
{
    public Task BindModelAsync(ModelBindingContext context)
    {
        var headerValue = context.HttpContext.Request.Headers["X-User-Id"];
        
        if (string.IsNullOrEmpty(headerValue))
        {
            context.ModelState.AddModelError(
                context.FieldName, 
                "缺少 X-User-Id 请求头"
            );
            return Task.CompletedTask;
        }
        
        if (!long.TryParse(headerValue, out var userId))
        {
            context.ModelState.AddModelError(
                context.FieldName, 
                "X-User-Id 格式无效，应为数字"
            );
            return Task.CompletedTask;
        }
        
        context.Result = ModelBindingResult.Success(userId);
        return Task.CompletedTask;
    }
}
```

**使用方式**：

```csharp
[HttpGet("me")]
public IActionResult GetMe(
    [ModelBinder(BinderType = typeof(UserIdFromHeaderBinder))] long userId)
{
    return Ok(new { UserId = userId });
}
```

#### 自定义绑定器的应用场景

| 场景 | 说明 |
|------|------|
| 头部解析 | 从请求头解析复杂格式的数据 |
| 多源合并 | 将多个来源的值合并到一个对象 |
| 加密值解密 | 接收加密参数后先解密再绑定 |
| 特殊格式解析 | 处理自定义的日期、编码格式 |

---

### 文件绑定（IFormFile）

使用 `IFormFile` 处理文件上传，必须使用 `[FromForm]`（而非 `[FromBody]`）。

```csharp
[HttpPost("upload")]
public async Task<IActionResult> Upload([FromForm] IFormFile file)
{
    if (file == null || file.Length == 0)
        return BadRequest("未选择文件或文件为空");

    var uploads = Path.Combine(Environment.ContentRootPath, "uploads");
    Directory.CreateDirectory(uploads);

    var safeName = Path.GetRandomFileName() + Path.GetExtension(file.FileName);
    var path = Path.Combine(uploads, safeName);

    await using var fs = System.IO.File.Create(path);
    await file.CopyToAsync(fs);

    return Ok(new { file = safeName, size = file.Length });
}
```

#### 多文件上传

```csharp
[HttpPost("upload-multiple")]
public async Task<IActionResult> UploadMultiple([FromForm] List<IFormFile> files)
{
    foreach (var file in files)
    {
        // 处理每个文件
    }
    return Ok();
}
```

#### 文件上传安全最佳实践

| 安全措施 | 说明 |
|---------|------|
| **扩展名白名单** | 只允许特定扩展名（如 `.jpg`、`.png`、`.pdf`） |
| **MIME 类型校验** | 检查 `file.ContentType` 是否与扩展名一致 |
| **文件大小限制** | 配置 `FormOptions.MultipartBodyLengthLimit` |
| **随机文件名** | 使用 `Path.GetRandomFileName()` 避免覆盖和路径遍历 |
| **存储位置** | 存储在非 Web 根目录，避免直接访问 |
| **病毒扫描** | 大文件场景建议异步扫描（如 ClamAV） |

---

## 第三部分：模型验证篇

### 数据注解验证（Data Annotations）

数据注解是 ASP.NET Core 内置的声明式验证方式，通过在模型属性上添加特性来定义验证规则。

```csharp
public class User
{
    [Required(ErrorMessage = "邮箱必填")]
    [EmailAddress(ErrorMessage = "邮箱格式不正确")]
    [StringLength(50, MinimumLength = 5, ErrorMessage = "邮箱长度 5~50 位")]
    public string Email { get; set; }

    [Required]
    [Range(18, 60, ErrorMessage = "年龄必须在 18~60 岁之间")]
    public int Age { get; set; }

    [RegularExpression(@"^[A-Z]+$", ErrorMessage = "仅允许大写字母")]
    public string Code { get; set; }
}
```

#### 常用验证特性速查表

| 特性 | 说明 | 适用类型 |
|------|------|----------|
| `[Required]` | 值不能为 `null` 或空字符串 | 任意类型 |
| `[StringLength(max, Min)]` | 字符串长度限制 | `string` |
| `[Range(min, max)]` | 数值/日期范围 | 数值类型、`DateTime` |
| `[EmailAddress]` | 邮箱格式校验 | `string` |
| `[Phone]` | 电话号码格式校验 | `string` |
| `[Url]` | URL 格式校验 | `string` |
| `[RegularExpression]` | 正则表达式匹配 | `string` |
| `[Compare("Other")]` | 与另一个属性值相等 | 任意类型 |
| `[CreditCard]` | 信用卡号校验（Luhn 算法） | `string` |
| `[Required]` + `[AllowedValues]` | 枚举值/白名单校验（.NET 8+） | 任意类型 |

#### `.NET 8+ 新增特性`

```csharp
[AllowedValues("Draft", "Published", "Archived")]
public string Status { get; set; }

[DeniedValues("Admin")]
public string Role { get; set; }
```

---

### 服务端验证与客户端验证

#### 服务端验证（强制安全基线）

**始终执行**，是数据安全的核心防线。

```csharp
// API 场景（带 [ApiController]）：自动处理
[ApiController]
public class UsersController : ControllerBase
{
    [HttpPost]
    public IActionResult Create(User user)
    {
        // 验证失败自动返回 400，无需手动判断
        return Ok();
    }
}

// MVC 场景：手动检查
[HttpPost]
public IActionResult Create(User user)
{
    if (!ModelState.IsValid)
    {
        return View(user);  // 回显表单并显示错误
    }
    // 处理有效数据
}
```

#### 客户端验证（提升用户体验）

在浏览器端即时反馈，**不能替代服务端验证**。

```html
<!-- 非侵入式客户端验证自动生成 data-val-* 属性 -->
<input asp-for="Email" />
<span asp-validation-for="Email"></span>
```

**前提条件**：
- 页面包含 `jquery` + `jquery-validation` + `jquery-validation-unobtrusive`
- 模型属性使用数据注解特性

```html
<!-- 布局中引用 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-validate/1.19.5/jquery.validate.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-validation-unobtrusive/3.2.12/jquery.validate.unobtrusive.min.js"></script>
```

**远程验证**：调用服务端 API 进行实时校验

```csharp
// 模型
[Remote("CheckEmail", "Account", HttpMethod = "POST")]
public string Email { get; set; }

// 控制器
public IActionResult CheckEmail(string email)
{
    return Json(!_userService.EmailExists(email));
}
```

---

### 自定义验证特性

当内置特性无法满足需求时，继承 `ValidationAttribute` 创建自定义验证规则。

#### 示例：偶数校验

```csharp
public class MustBeEvenAttribute : ValidationAttribute
{
    public MustBeEvenAttribute()
    {
        ErrorMessage = "数值必须为偶数";
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext context)
    {
        if (value is null) return ValidationResult.Success;  // 交给 [Required]
        
        if (value is int i && i % 2 == 0)
            return ValidationResult.Success;
        
        if (int.TryParse(value.ToString(), out var n) && n % 2 == 0)
            return ValidationResult.Success;
        
        return new ValidationResult(ErrorMessage);
    }
}

// 使用
public class Product
{
    [MustBeEven]
    public int Quantity { get; set; }
}
```

#### 示例：日期范围校验

```csharp
public class DateInPastAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext context)
    {
        if (value is DateTime date && date >= DateTime.Today)
        {
            return new ValidationResult("日期必须在今天之前");
        }
        return ValidationResult.Success;
    }
}
```

---

### IValidatableObject 接口（跨字段验证）

`IValidatableObject` 用于需要**多个属性参与**的复杂业务校验，在数据注解验证之后执行。

```csharp
public class Order : IValidatableObject
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal TotalAmount { get; set; }
    public string? CouponCode { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext context)
    {
        // 跨字段验证
        if (EndDate <= StartDate)
        {
            yield return new ValidationResult(
                "结束日期必须晚于开始日期",
                new[] { nameof(EndDate), nameof(StartDate) }
            );
        }
        
        // 业务规则验证
        if (TotalAmount < 0)
        {
            yield return new ValidationResult(
                "订单金额不能为负数",
                new[] { nameof(TotalAmount) }
            );
        }
        
        // 条件依赖验证
        if (!string.IsNullOrEmpty(CouponCode) && TotalAmount < 100)
        {
            yield return new ValidationResult(
                "使用优惠码时订单金额必须大于 100 元",
                new[] { nameof(CouponCode), nameof(TotalAmount) }
            );
        }
    }
}
```

**执行顺序**：数据注解特性（如 `[Required]`）→ `IValidatableObject.Validate()` → 进入 Action

---

### FluentValidation（高级验证库）

FluentValidation 是 .NET 中最流行的第三方验证库，提供更灵活、可维护的验证方式。

#### 安装

```bash
dotnet add package FluentValidation.AspNetCore
```

#### 定义验证器

```csharp
using FluentValidation;

public class UserValidator : AbstractValidator<User>
{
    public UserValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("邮箱不能为空")
            .EmailAddress().WithMessage("邮箱格式不正确")
            .MaximumLength(50);
            
        RuleFor(x => x.Age)
            .InclusiveBetween(18, 60)
            .WithMessage("年龄必须在 18 到 60 岁之间");
            
        RuleFor(x => x.Password)
            .MinimumLength(8)
            .MaximumLength(20)
            .Matches("[A-Z]").WithMessage("密码必须包含大写字母")
            .Matches("[a-z]").WithMessage("密码必须包含小写字母")
            .Matches("[0-9]").WithMessage("密码必须包含数字");
            
        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.Password)
            .WithMessage("两次输入的密码不一致");
    }
}
```

#### 注册

```csharp
// Program.cs
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<UserValidator>();
```

#### 数据注解 vs FluentValidation

| 对比维度 | 数据注解 | FluentValidation |
|---------|---------|------------------|
| **定义位置** | 模型类内部（特性） | 独立的验证器类 |
| **跨字段验证** | `IValidatableObject` | `RuleFor` + 条件 |
| **可测试性** | 较难测试 | ✅ 易于单元测试 |
| **条件验证** | 有限 | ✅ 丰富的 `When`、`Unless` |
| **规则集** | 不支持 | ✅ 支持多个规则集 |
| **复杂嵌套** | 有限 | ✅ 支持复杂嵌套验证 |
| **代码量** | 较少，声明式 | 较多，但更灵活 |
| **适用场景** | 简单验证 | **复杂业务验证** |

**推荐**：
- **简单场景**：数据注解 + `[ApiController]` 自动处理
- **复杂场景**：FluentValidation（规则集、条件验证、可测试性）

---

### API 与 MVC 的验证差异

#### Web API（带 `[ApiController]`）

| 特性 | 行为 |
|------|------|
| **验证触发** | 自动执行（Action 执行前） |
| **验证失败响应** | 自动返回 `400 Bad Request` |
| **响应格式** | `ValidationProblemDetails`（RFC 7807） |
| **手动检查** | 不需要 `if (!ModelState.IsValid)` |

```csharp
[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    [HttpPost]
    public IActionResult Create(User user)
    {
        // ModelState 已自动验证
        // 无效时请求不会进入此方法
        return Ok();
    }
}
```

#### MVC / Razor Pages（无 `[ApiController]`）

| 特性 | 行为 |
|------|------|
| **验证触发** | 需手动触发（默认不会自动检查） |
| **验证失败响应** | 需手动处理 |
| **响应格式** | 通常返回视图（含错误信息） |
| **手动检查** | 必须使用 `if (!ModelState.IsValid)` |

```csharp
public class UsersController : Controller
{
    [HttpPost]
    public IActionResult Create(User user)
    {
        if (!ModelState.IsValid)
        {
            return View(user);  // 回显表单，显示错误
        }
        // 处理有效数据
        return RedirectToAction("Index");
    }
}
```

#### 验证错误响应格式

**API 自动返回的 `ValidationProblemDetails`**：

```json
{
    "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
    "title": "One or more validation errors occurred.",
    "status": 400,
    "traceId": "00-abc123...",
    "errors": {
        "Email": ["邮箱格式不正确"],
        "Age": ["年龄必须在 18 到 60 岁之间"],
        "Password": ["密码必须包含大写字母"]
    }
}
```

---

### ModelState 详解

`ModelState` 是模型绑定和验证结果的容器，包含：

- 每个属性的绑定状态
- 验证错误列表
- 原始值（用于回显）

```csharp
// 手动检查
if (!ModelState.IsValid)
{
    // 获取所有错误
    var errors = ModelState
        .Where(x => x.Value?.Errors.Count > 0)
        .SelectMany(x => x.Value.Errors)
        .Select(e => e.ErrorMessage);
}
```

#### ModelState 常用 API

| API | 说明 |
|-----|------|
| `ModelState.IsValid` | 所有属性是否通过验证 |
| `ModelState.AddModelError(key, message)` | 手动添加错误 |
| `ModelState.Remove(key)` | 移除特定属性的错误 |
| `ModelState.Clear()` | 清除所有错误 |
| `ModelState.Keys` | 所有属性键 |
| `ModelState.Values` | 所有属性状态 |

#### 手动添加错误

```csharp
[HttpPost]
public IActionResult Create(Product product)
{
    // 业务层验证失败时手动添加错误
    if (product.Price < 0)
    {
        ModelState.AddModelError(nameof(product.Price), "价格不能为负数");
    }
    
    if (!ModelState.IsValid)
    {
        return BadRequest(ModelState);
    }
    
    // 处理...
}
```

---

## 第四部分：安全与数据清理篇

### 输入数据的清理（防 XSS、注入）

模型绑定**不会自动清洗或编码**输入数据，它只是将原始数据填充到模型中。

#### 安全防护策略

| 防护层级 | 措施 | 说明 |
|---------|------|------|
| **输出编码（最重要）** | Razor 默认 HTML 编码 | ✅ 安全基线，不要滥用 `@Html.Raw` |
| **输入校验** | 长度限制、格式校验 | 使用 `[StringLength]`、正则表达式 |
| **输入规范化** | 去除前后空格、转换大小写 | `string.Trim()`、标准化 |
| **防 SQL 注入** | 参数化查询 / ORM | **绝不拼接 SQL 字符串** |
| **防 XSS** | 上下文编码（HTML/JS/URL） | 使用 `HtmlEncoder`、`JavaScriptEncoder` |
| **CSP（内容安全策略）** | 限制内联脚本和加载源 | 降低 XSS 影响 |
| **Cookie 安全** | `HttpOnly`、`SameSite`、`Secure` | 防止 Cookie 被脚本读取 |

#### 输入清理示例

```csharp
public class User
{
    [Required]
    [StringLength(50)]
    [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "仅允许字母、数字和下划线")]
    public string Username { get; set; }  // 白名单校验
    
    [Required]
    [StringLength(100)]
    public string DisplayName { get; set; }  // 前端显示前编码
    
    [EmailAddress]
    [StringLength(100)]
    public string Email { get; set; }
}
```

#### 编码与解码

```csharp
using System.Text.Encodings.Web;
using System.Text.Unicode;

// HTML 编码
var htmlEncoded = HtmlEncoder.Default.Encode(userInput);

// JavaScript 编码
var jsEncoded = JavaScriptEncoder.Default.Encode(userInput);

// URL 编码
var urlEncoded = UrlEncoder.Default.Encode(userInput);
```

#### 文件上传安全注意事项

| 检查项 | 方法 |
|--------|------|
| 扩展名 | 白名单校验（`Path.GetExtension(file.FileName)`） |
| MIME 类型 | 检查 `file.ContentType` |
| 文件大小 | 配置 `MultipartBodyLengthLimit` |
| 文件名 | 使用随机文件名（`Path.GetRandomFileName()`） |
| 存储路径 | 存放在非 Web 根目录 |
| 病毒扫描 | 调用病毒扫描服务（ClamAV、Windows Defender） |

---

## 第五部分：面试避坑清单

| 序号 | ❌ 常见错误 | ✅ 正确理解 |
|------|-----------|-----------|
| 1 | 在 API 中手动检查 `ModelState.IsValid` | `[ApiController]` 会自动处理，无需手动判断 |
| 2 | 在 MVC 中忘记检查 `ModelState.IsValid` | MVC 必须手动检查，否则无效数据可能进入业务层 |
| 3 | 在同一个 Action 中使用多个 `[FromBody]` | 只能有一个 `[FromBody]` 参数 |
| 4 | 认为 `[Required]` 能防止空字符串 | 对于 `string`，`[Required]` 同时校验 `null` 和空字符串 |
| 5 | 忽略嵌套对象和集合的绑定 | 嵌套对象需要正确的属性路径（如 `Customer.Name`） |
| 6 | 在文件上传时使用 `[FromBody]` | 文件上传必须用 `[FromForm]` |
| 7 | 在生产环境依赖客户端验证 | 客户端验证仅提升体验，**永远**依赖服务端验证 |
| 8 | 在服务端直接输出用户输入 | 必须进行输出编码（Razor 默认编码） |
| 9 | 拼接 SQL 字符串 | 始终使用参数化查询或 ORM |
| 10 | 文件上传到 Web 根目录 | 使用非 Web 根目录 + 随机文件名 |

---

## 小结

模型绑定和验证是 ASP.NET Core 请求处理的两个关键环节：

- **模型绑定**：将 HTTP 请求中的原始数据转换为强类型对象，支持多种数据源（路由、查询、表单、请求体、请求头、服务容器）。
- **模型验证**：验证绑定后的数据是否符合业务规则，支持数据注解、`IValidatableObject`、FluentValidation 等多种方式。

回顾全文，记住三个核心原则：

1. **绑定来源要明确**：复杂场景使用 `[FromXxx]` 特性显式指定数据源
2. **验证要分层**：属性验证（数据注解）→ 模型验证（`IValidatableObject`）→ 业务验证（服务层）
3. **安全永远是底线**：客户端验证只能提升体验，服务端验证是安全基线
