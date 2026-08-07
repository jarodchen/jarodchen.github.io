---
tags: ["aspnetcore"]
category: aspnetcore
categories:
  - 面试
  - aspnetcore
date: 2026-05-07T16:19:00
banner: /images/aspnetcore1.webp
title: ASP.NET Core  面试题 MVC 与 Razor Pages
description: 系统梳理 ASP.NET Core 中 MVC 和 Razor Pages 的核心知识点，涵盖路由、模型绑定、验证、过滤器、视图组件等，附带面试避坑清单。
---

# ASP.NET Core  面试题 MVC 与 Razor Pages 

> 从经典 MVC 到现代化 Razor Pages，一套完整的 ASP.NET Core UI 开发知识体系。

在 ASP.NET Core 的面试中，MVC 和 Razor Pages 是仅次于依赖注入和中间件的高频考点。它们不仅是构建 Web 应用的主要方式，更承载着路由、模型绑定、验证、过滤器等核心机制。

本文将系统性地梳理 MVC 和 Razor Pages 的方方面面，从基础概念到高级用法，一网打尽。

---

## 第一部分：认知篇（必答送分题）

### ASP.NET Core 中的 MVC 是什么？

#### 定义

**MVC（Model-View-Controller）** 是一种经典的架构模式，将应用程序分为三个核心组件：

| 组件 | 职责 | 示例 |
|------|------|------|
| **Model（模型）** | 封装数据与业务逻辑 | `User`、`Order` 类，DbContext |
| **View（视图）** | 负责 UI 渲染 | `Index.cshtml`，生成 HTML |
| **Controller（控制器）** | 处理请求，协调 Model 和 View | `HomeController`，接收输入、返回输出 |

**核心优势**：实现**关注点分离**，便于维护、测试和团队协作。

#### MVC 请求处理流程

```
用户请求 → 路由 → 控制器 → 模型绑定/验证 → Action 执行 → 视图渲染 → 响应
```

#### ASP.NET Core MVC 与 ASP.NET MVC 的主要区别

| 特性 | ASP.NET MVC（旧版） | ASP.NET Core MVC |
|------|-------------------|------------------|
| **平台** | 仅限 Windows / .NET Framework | 跨平台 (.NET Core/.NET 5+) |
| **依赖注入** | 需第三方容器或手动实现 | **内置依赖注入**（一等公民） |
| **MVC & Web API** | 两套独立框架（`Controller` vs `ApiController`） | **已统一**为一个管道，控制器可同时服务于 UI 和 API |
| **请求处理** | 基于 `System.Web` / HttpHandler | 基于 **中间件管道**（Middleware） |
| **性能** | 较重，依赖 IIS | 轻量级，高性能（Kestrel） |
| **配置** | `Web.config`（XML） | `appsettings.json` + 强类型配置 |
| **部署** | IIS 为主 | Kestrel，自托管，容器化（Docker），跨平台部署 |
| **视图引擎** | 支持 Razor、WebForms（ASPX）、第三方引擎 | **仅内置 Razor**，但可通过 `IViewEngine` 扩展 |

> 💡 **面试金句**
>
> “ASP.NET Core MVC 是经典 MVC 模式的现代化实现，它统一了 MVC 和 Web API 的编程模型，基于中间件管道处理请求，并原生集成依赖注入，性能更优、更轻量、更跨平台。”

---

### Razor Pages：基于页面的编程模型

#### 什么是 Razor Pages？

**Razor Pages** 是 ASP.NET Core 2.0 引入的**基于页面的编程模型**。每个页面由一对文件组成：

- `Index.cshtml`：视图模板（UI）
- `Index.cshtml.cs`：`PageModel` 类（逻辑处理）

可以理解为**控制器 + 视图的轻量级合并版**，但更聚焦于单个页面的处理逻辑。

#### 推荐使用场景对比

| 场景类型 | 推荐选择 | 原因 |
|---------|---------|------|
| CRUD 后台管理系统 | ✅ Razor Pages | 每个页面独立，代码内聚，样板代码少 |
| 表单驱动的 UI | ✅ Razor Pages | 使用 `[BindProperty]` 简化表单绑定 |
| 中小型项目，快速开发 | ✅ Razor Pages | 结构简单，上手快 |
| 大型复杂应用 | ✅ MVC | 控制器/视图分离更彻底，便于分层和复用 |
| 需要同时提供 API 和 UI | ✅ MVC | `Controller` 可同时返回 `View` 和 `JsonResult` |
| 团队协作，严格分层 | ✅ MVC | 职责边界清晰 |
| 需要复用视图逻辑 | ✅ MVC | 部分视图、视图组件在 MVC 中更成熟 |

#### Razor Pages 与 MVC 的关系

```
ASP.NET Core 框架
    └── ASP.NET Core MVC 框架
            ├── Controllers + Views（MVC 模式）
            └── Razor Pages（基于 MVC 框架的轻量级封装）
```

Razor Pages **不是替代 MVC**，而是建立在 MVC 框架之上的另一种编程模型。它们的底层基础设施（路由、模型绑定、过滤器、Razor 引擎）是完全相同的。

> 💡 **一句话总结**
>
> “如果我的页面逻辑相对独立、不需要复杂的控制器分层，我会选择 Razor Pages，它让代码更内聚。如果应用规模较大、需要严格的控制器/视图分离，或者需要同时提供 Web UI 和 API，我会选择 MVC。”

---

## 第二部分：路由篇（核心机制）

### MVC 路由机制

#### 两种路由方式

**1. 传统路由（约定路由）**

在 `Program.cs` 中配置：

```csharp
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");
```

- `{controller=Home}`：默认控制器为 `HomeController`
- `{action=Index}`：默认 Action 为 `Index`
- `{id?}`：可选参数 `id`

**2. 属性路由（推荐）**

使用 `[Route]`、`[HttpGet]` 等特性直接在控制器/Action 上指定路由：

```csharp
[Route("api/[controller]")]
[ApiController]
public class ProductsController : ControllerBase
{
    [HttpGet("{id}")]
    public IActionResult GetProduct(int id) { ... }
    
    [HttpGet("search/{keyword}")]
    public IActionResult Search(string keyword) { ... }
}
```

**属性路由与传统路由的优先级**：

- 如果控制器/Action 使用了 `[Route]` 特性，则**属性路由优先**
- 未使用属性路由的 Action 仍会匹配传统路由
- **推荐**：Web API 用属性路由，MVC 页面用传统路由（或混合使用）

#### Razor Pages 路由机制

Razor Pages 默认路由**基于文件夹结构**：

| 文件路径 | 对应 URL |
|---------|----------|
| `/Pages/Index.cshtml` | `/` |
| `/Pages/Products/Index.cshtml` | `/Products` |
| `/Pages/Products/Edit.cshtml` | `/Products/Edit` |

**覆盖默认路由**：通过 `@page` 指令指定路由模板

```cshtml
@page "/products/{id:int}"
@model Products.EditModel
```

此时 URL `/products/5` 会映射到这个页面。

**路由参数传递**：在 `PageModel` 中使用 `[BindProperty(SupportsGet = true)]` 或通过 `RouteData` 获取：

```csharp
public class EditModel : PageModel
{
    [BindProperty(SupportsGet = true)]
    public int Id { get; set; }
    
    public void OnGet()
    {
        // Id 会从路由中自动绑定
    }
}
```

---

## 第三部分：核心组件篇

### Controller、Action、View 和 ViewComponent

#### Controller（控制器）

- 继承自 `Controller`（MVC）或 `ControllerBase`（Web API）
- 负责处理 HTTP 请求，调用业务逻辑，返回响应
- 命名约定：以 `Controller` 结尾（如 `HomeController`）

#### Action（操作方法）

- 控制器中的**公共方法**
- 返回类型通常为 `IActionResult` 或 `ActionResult<T>`
- 支持同步和异步（`async Task<IActionResult>`）

```csharp
public class HomeController : Controller
{
    // 同步 Action
    public IActionResult Index()
    {
        return View();
    }
    
    // 异步 Action
    public async Task<IActionResult> Details(int id)
    {
        var item = await _service.GetByIdAsync(id);
        return View(item);
    }
}
```

#### 常见 Action 返回值

| 返回类型                    | 方法示例                        | 说明            |
| ----------------------- | --------------------------- | ------------- |
| `ViewResult`            | `View()`、`View(model)`      | 返回 Razor 视图   |
| `PartialViewResult`     | `PartialView()`             | 返回部分视图        |
| `JsonResult`            | `Json(data)`                | 返回 JSON 格式数据  |
| `RedirectResult`        | `Redirect(url)`             | 重定向到指定 URL    |
| `RedirectToRouteResult` | `RedirectToAction("Index")` | 重定向到指定 Action |
| `StatusCodeResult`      | `StatusCode(404)`           | 返回 HTTP 状态码   |
| `NotFoundResult`        | `NotFound()`                | 返回 404        |
| `BadRequestResult`      | `BadRequest()`              | 返回 400        |
| `OkResult`              | `Ok()`、`Ok(data)`           | 返回 200        |
| `FileResult`            | `File(bytes, "text/plain")` | 返回文件          |
| `ChallengeResult`       | `Challenge()`               | 触发认证质询        |
| `SignInResult`          | `SignIn(principal)`         | 登录            |
| `SignOutResult`         | `SignOut()`                 | 登出            |

#### View（视图）

- `.cshtml` 文件，位于 `Views/{ControllerName}/` 或 `Views/Shared/`
- 使用 Razor 语法（`@` 符号）混合 HTML 和 C#
- 通过 `@model` 指令声明视图绑定的模型类型

```cshtml
@model IEnumerable<Product>
<h1>产品列表</h1>
@foreach (var item in Model) {
    <div>@item.Name</div>
}
```

#### ViewComponent（视图组件）

**视图组件**是 MVC 中**带逻辑的可复用 UI 组件**，类似于“迷你控制器 + 部分视图”的组合。

**创建视图组件**：

```csharp
public class CartViewComponent : ViewComponent
{
    private readonly ICartService _cartService;
    
    public CartViewComponent(ICartService cartService)
    {
        _cartService = cartService;
    }
    
    public async Task<IViewComponentResult> InvokeAsync(int userId)
    {
        var cart = await _cartService.GetCartAsync(userId);
        return View(cart); // 视图路径：Components/Cart/Default.cshtml
    }
}
```

**调用视图组件**：

```cshtml
<!-- 方式一：使用 Component.InvokeAsync -->
@await Component.InvokeAsync("Cart", new { userId = 1 })

<!-- 方式二：使用 Tag Helper（需注册） -->
<vc:cart user-id="1"></vc:cart>
```

**视图组件 vs 部分视图**：

| 对比 | 部分视图（Partial View） | 视图组件（ViewComponent） |
|------|-------------------------|--------------------------|
| 是否包含业务逻辑 | ❌ 仅包含 HTML 渲染逻辑 | ✅ 包含独立业务逻辑 |
| 依赖注入 | ❌ 不支持（通过 `@inject` 可以但通常不推荐） | ✅ 支持构造函数注入 |
| 异步支持 | ❌ 有限 | ✅ 原生支持异步 |
| 适用场景 | 纯 UI 片段复用 | 有逻辑的独立组件（购物车、侧边栏、导航菜单） |

---

### Tag Helper 与 HTML Helper 的区别

**Tag Helper** 是 HTML 风格的服务器端渲染辅助工具，在 Razor 中**看起来像 HTML 标签/属性**：

```html
<form asp-controller="Home" asp-action="Login">
    <input asp-for="Email" class="form-control" />
    <span asp-validation-for="Email"></span>
</form>
```

**HTML Helper** 是 Razor 中的 C# 方法：

```csharp
@Html.BeginForm("Login", "Home") {
    @Html.TextBoxFor(m => m.Email, new { @class = "form-control" })
    @Html.ValidationMessageFor(m => m.Email)
}
```

| 对比维度 | Tag Helper | HTML Helper |
|---------|-----------|-------------|
| **语法风格** | HTML 风格，贴近前端 | C# 方法风格 |
| **可读性** | ✅ 对前端开发者友好 | ⚠️ 混合 C#，学习曲线略陡 |
| **智能提示** | ✅ 支持属性级别的 IntelliSense | ✅ 支持方法级别的 IntelliSense |
| **扩展性** | ✅ 自定义 Tag Helper 灵活 | ✅ 自定义 Helper 方法也灵活 |
| **推荐度** | ✅ **现代 ASP.NET Core 官方推荐** | ⚠️ 存在但不再是主要推荐方式 |

> **建议**：新项目优先使用 **Tag Helper**，它更符合前端开发者的直觉，且与 Bootstrap 等 CSS 框架结合更自然。

---

### ViewData、ViewBag、TempData

| 类型 | 生命周期 | 是否动态 | 跨请求 | 类型安全 | 用途 |
|------|---------|---------|--------|---------|------|
| **ViewData** | 当前请求 | ❌（字典） | ❌ | ❌ | 向当前视图传递键值对数据 |
| **ViewBag** | 当前请求 | ✅（动态） | ❌ | ❌ | ViewData 的 `dynamic` 包装器，语法更简洁 |
| **TempData** | **跨请求**（一次读取后清除） | ❌（字典） | ✅（依赖 Session/Cookie） | ❌ | 重定向后传递临时数据（如提示消息） |

**代码示例**：

```csharp
// 控制器中
ViewData["Count"] = 5;
ViewBag.Message = "操作成功";
TempData["Success"] = "保存成功";
return RedirectToAction("Index");

// 视图中
<p>@ViewData["Count"]</p>
<p>@ViewBag.Message</p>
<p>@TempData["Success"]</p>
```

**重要特性**：

| 特性 | 说明 |
|------|------|
| **ViewData 和 ViewBag 本质相同** | `ViewBag` 是 `ViewData` 的 `dynamic` 包装器，两者共享同一底层数据 |
| **TempData 的读取机制** | 默认在**读取后自动标记为删除**，第二次读取时已不存在 |
| **保留 TempData** | 使用 `TempData.Peek("key")` 读取但不删除；使用 `TempData.Keep("key")` 保留到下一次请求 |
| **TempData 存储方式** | 默认使用 **Session**（需启用 `app.UseSession()`），也可替换为 Cookie 存储 |

**ViewBag 的局限**：

```csharp
// ❌ 编译时不会报错，但运行时可能抛出异常
var value = ViewBag.NonExistent; // 返回 null，不会报错，导致隐藏的 bug

// ✅ ViewData 同理
var value2 = ViewData["NonExistent"]; // 返回 null

// ✅ 强类型 Model 则安全得多
@model UserViewModel
@Model.Name  // 编译时检查
```

---

## 第四部分：模型绑定与验证篇（面试高频）

### 模型绑定（Model Binding）

#### 定义

ASP.NET Core 的模型绑定自动将 **HTTP 请求中的数据** 映射到控制器方法的参数或模型对象的属性上。

```csharp
public IActionResult Submit(User user) { ... }  // user 自动从请求中绑定
```

#### 数据来源与绑定源属性

| 属性 | 数据来源 | 示例 |
|------|---------|------|
| `[FromQuery]` | 查询字符串（URL 中的 `?key=value`） | `/user?id=5` |
| `[FromRoute]` | 路由参数 | `/user/5`（路由模板 `{id}`） |
| `[FromForm]` | 表单字段（`application/x-www-form-urlencoded`） | `<input name="Email" />` |
| `[FromBody]` | 请求体（JSON/XML） | `{"Email":"test@example.com"}` |
| `[FromHeader]` | 请求头 | `Authorization: Bearer xxx` |

**绑定源优先级规则**：

当**未指定** `[FromXxx]` 属性时，模型绑定按以下顺序尝试匹配：

1. **路由参数**（`[FromRoute]`）
2. **查询字符串**（`[FromQuery]`）
3. **请求体**（`[FromBody]`，仅当参数为复杂类型时）
4. **表单字段**（`[FromForm]`）

⚠️ **注意**：对于复杂类型参数（自定义类），默认会尝试**从路由/查询字符串/表单**中绑定，但**不会自动从 JSON 请求体绑定**。如需从 JSON 请求体绑定，必须使用 `[FromBody]`。

#### 绑定行为示例

```csharp
[HttpPost]
public IActionResult Submit(
    [FromForm] User user,                    // 从表单绑定
    [FromQuery] int? page,                  // 从查询字符串绑定
    [FromRoute] int id,                     // 从路由参数绑定
    [FromBody] UpdateRequest request,       // 从 JSON 请求体绑定
    [FromHeader] string userAgent)          // 从请求头绑定
{
    // ...
}
```

#### 模型绑定的高级场景

**绑定集合/数组**：

```html
<!-- 表单提交：选中多个项目 -->
<input name="selectedIds" value="1" />
<input name="selectedIds" value="2" />
<input name="selectedIds" value="3" />
```

```csharp
public IActionResult Submit(List<int> selectedIds) { ... } // 自动绑定为 [1, 2, 3]
```

**绑定前缀**：

```csharp
public IActionResult Submit([Bind(Prefix = "User")] User user) { ... }
```

---

### 数据注解验证（Data Annotation Validation）

#### 基本用法

在模型属性上添加验证特性：

```csharp
public class User
{
    [Required(ErrorMessage = "邮箱必填")]
    [EmailAddress(ErrorMessage = "邮箱格式不正确")]
    public string Email { get; set; }

    [Range(18, 60, ErrorMessage = "年龄必须在 18~60 岁之间")]
    public int Age { get; set; }

    [StringLength(50, MinimumLength = 3, ErrorMessage = "用户名长度 3~50 位")]
    public string UserName { get; set; }

    [RegularExpression(@"^[A-Z]+$", ErrorMessage = "仅允许大写字母")]
    public string Code { get; set; }
}
```

#### 常见验证特性速查表

| 特性 | 说明 | 适用类型 |
|------|------|---------|
| `[Required]` | 必填字段（值不能为 null/空） | 任意类型 |
| `[StringLength(max, Min)]` | 字符串长度限制 | `string` |
| `[Range(min, max)]` | 数值范围限制 | 数值类型 |
| `[EmailAddress]` | 检查是否为合法邮箱格式 | `string` |
| `[Phone]` | 检查是否为合法电话号码格式 | `string` |
| `[Url]` | 检查是否为合法 URL 格式 | `string` |
| `[RegularExpression]` | 正则表达式匹配 | `string` |
| `[Compare("OtherProperty")]` | 比较两个属性的值是否相等 | 任意 |
| `[CreditCard]` | 检查是否为信用卡号格式 | `string` |

#### 验证触发与检查

```csharp
public IActionResult Submit(User user)
{
    // 检查验证是否通过
    if (!ModelState.IsValid)
    {
        // 验证失败：返回视图，错误信息会自动显示在视图的验证摘要中
        return View(user);
    }
    
    // 验证通过：执行业务逻辑
    return RedirectToAction("Success");
}
```

#### 客户端验证（前端自动验证）

配置 `services.AddControllersWithViews()` 后，ASP.NET Core 会自动在页面中生成 `data-val-*` 属性：

```html
<input data-val="true" 
       data-val-required="邮箱必填" 
       data-val-email="邮箱格式不正确" 
       id="Email" name="Email" />
```

配合以下前端库实现即时验证：

- `jquery-validation`（验证引擎）
- `jquery-validation-unobtrusive`（将 `data-val-*` 属性转换为验证规则）

#### 验证执行顺序

```
用户请求 → 模型绑定 → 属性级验证（ValidationAttribute）→ 
IValidatableObject.Validate() → ModelState.IsValid 检查
```

---

### 自定义验证

#### 方式一：IValidatableObject（跨属性验证）

适用于**需要多个属性共同决定的验证逻辑**：

```csharp
public class OrderModel : IValidatableObject
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext context)
    {
        if (EndDate <= StartDate)
        {
            yield return new ValidationResult(
                "结束日期必须大于开始日期",
                new[] { nameof(EndDate), nameof(StartDate) }
            );
        }
    }
}
```

#### 方式二：自定义 ValidationAttribute（单属性验证）

适用于**单个属性的自定义验证规则**：

```csharp
public class StartsWithAAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext context)
    {
        if (value is string str && !string.IsNullOrEmpty(str))
        {
            if (!str.StartsWith("A"))
            {
                return new ValidationResult("必须以字母 A 开头");
            }
        }
        return ValidationResult.Success;
    }
}

public class Product
{
    [StartsWithA]
    public string Code { get; set; }
}
```

#### 使用场景区分

| 对比 | IValidatableObject | ValidationAttribute |
|------|-------------------|--------------------|
| **适用层级** | 模型类级别 | 单个属性 |
| **能否访问其他属性** | ✅ 可以 | ❌ 只能访问当前属性值 |
| **复用性** | ❌ 逻辑绑定在模型类上 | ✅ 可应用到多个模型的不同属性 |
| **适用场景** | 跨属性验证（如日期比较） | 单属性格式验证（如自定义格式） |

---

## 第五部分：过滤器篇（深入底层）

### 五大过滤器类型

ASP.NET Core MVC 提供 **5 大类过滤器**，按执行顺序排列：

#### 执行顺序（完整流程图）

```
请求进入
    ↓
① Authorization Filter（授权过滤器）
    ↓ （授权通过后）
② Resource Filter（资源过滤器）—— OnResourceExecuting
    ↓
    ↓ 模型绑定
    ↓
③ Action Filter（操作过滤器）—— OnActionExecuting
    ↓
    ↓ Action 方法执行
    ↓
③ Action Filter（操作过滤器）—— OnActionExecuted
    ↓
    ↓ 执行 Result（如 View()）
    ↓
④ Result Filter（结果过滤器）—— OnResultExecuting
    ↓
    ↓ 结果输出（如渲染 HTML）
    ↓
④ Result Filter（结果过滤器）—— OnResultExecuted
    ↓
② Resource Filter（资源过滤器）—— OnResourceExecuted
    ↓
    ↓ （如果 Action 或 Result 中抛出异常）
    ↓
⑤ Exception Filter（异常过滤器）
    ↓
响应返回
```

#### 各过滤器详解

| 过滤器类型 | 执行阶段 | 核心接口 | 典型用途 |
|-----------|---------|---------|----------|
| **① Authorization Filter** | Action 执行**之前**（最早） | `IAuthorizationFilter` / `IAsyncAuthorizationFilter` | 身份认证、权限检查（如 `[Authorize]`） |
| **② Resource Filter** | 授权之后，Model Binding 之前 / 之后 | `IResourceFilter` / `IAsyncResourceFilter` | 缓存、请求短路 |
| **③ Action Filter** | Action 方法执行**前后** | `IActionFilter` / `IAsyncActionFilter` | 日志、参数校验、性能监控 |
| **④ Result Filter** | Result 执行**前后** | `IResultFilter` / `IAsyncResultFilter` | 包装响应结果、修改输出 |
| **⑤ Exception Filter** | Action/Result 出现未捕获异常时 | `IExceptionFilter` / `IAsyncExceptionFilter` | 统一异常处理（MVC 管道内） |

#### ⚠️ 重要细节

**1. Exception Filter 的局限**

Exception Filter **只处理 MVC 管道内**（Action/Result 执行期间）的异常，**不处理中间件层的异常**。

```
✅ 能捕获：Action 方法内、ActionResult 执行期间抛出的异常
❌ 不能捕获：中间件（如 UseAuthentication）中抛出的异常
```

如需全局异常捕获（含中间件层），应使用 `app.UseExceptionHandler()` 中间件。

**2. 过滤器的 Short-Circuit（短路）**

在 Authorization Filter 或 Resource Filter 中，可以通过设置 `context.Result = new UnauthorizedResult()` 来终止管道，后续过滤器不再执行。

#### 过滤器的注册方式

| 注册方式 | 作用范围 | 是否支持 DI | 示例 |
|---------|---------|------------|------|
| **全局注册** | 所有 Controller/Action | ✅ | `options.Filters.Add<LogFilter>()` |
| **特性应用** | 特定 Controller/Action | ❌（需继承 Attribute） | `[LogFilter]` |
| **ServiceFilter** | 特定 Controller/Action | ✅ | `[ServiceFilter(typeof(LogFilter))]` |
| **TypeFilter** | 特定 Controller/Action | ✅ | `[TypeFilter(typeof(LogFilter))]` |

```csharp
// 全局注册
services.AddControllers(options =>
{
    options.Filters.Add<LogActionFilter>(); // 或 options.Filters.Add(new LogActionFilter())
});

// 特性应用
[ServiceFilter(typeof(LogActionFilter))]
public IActionResult About() => View();

// TypeFilter（支持构造函数参数）
[TypeFilter(typeof(LogActionFilter), Arguments = new object[] { "参数值" })]
public IActionResult Contact() => View();
```

**ServiceFilter vs TypeFilter**：

| 对比 | ServiceFilter | TypeFilter |
|------|--------------|-----------|
| 注册要求 | 过滤器必须在 DI 中注册 | 不需要预注册，由容器自动创建 |
| 性能 | 略快（已注册） | 略慢（需创建） |
| 参数支持 | ❌ 不支持 | ✅ 支持构造参数 |
| 使用场景 | 标准 DI 场景 | 需要传参或不想预注册 |

---

## 第六部分：Razor Pages 进阶篇

### Razor Page 处理器（Handlers）

Razor Pages 使用**处理器方法**（Handlers）来响应不同 HTTP 方法：

```csharp
public class IndexModel : PageModel
{
    // 同步处理器
    public void OnGet() { }
    public void OnPost() { }
    
    // 异步处理器（推荐）
    public async Task<IActionResult> OnGetAsync() { }
    public async Task<IActionResult> OnPostAsync() { }
}
```

#### 常用处理器方法对照表

| HTTP 方法 | 同步处理器 | 异步处理器 | 说明 |
|-----------|-----------|-----------|------|
| GET | `OnGet` | `OnGetAsync` | 加载页面 |
| POST | `OnPost` | `OnPostAsync` | 提交表单 |
| PUT | `OnPut` | `OnPutAsync` | 更新资源 |
| DELETE | `OnDelete` | `OnDeleteAsync` | 删除资源 |
| PATCH | `OnPatch` | `OnPatchAsync` | 部分更新 |

#### 自定义 Handler 名称

当同一种 HTTP 方法需要多个处理器时（如多个表单按钮），使用 `asp-page-handler` 区分：

```csharp
public class EditModel : PageModel
{
    public IActionResult OnPostUpdate() { ... }
    public IActionResult OnPostDelete() { ... }
    public IActionResult OnPostDraft() { ... }
}
```

```html
<form method="post" asp-page-handler="Update">
    <button type="submit">更新</button>
</form>

<form method="post" asp-page-handler="Delete">
    <button type="submit">删除</button>
</form>
```

**URL 映射**：`OnPostUpdate` → `/Products/Edit?handler=Update`

#### 处理器返回值

- `Page()`：返回当前页面
- `RedirectToPage("Success")`：重定向到另一个页面
- `RedirectToPage("./Edit")`：相对路径跳转
- `RedirectToPage("/Index")`：绝对路径跳转（以 `/` 开头）

---

### Razor Pages 的依赖注入

**方式一：构造函数注入（最常用）**

```csharp
public class IndexModel : PageModel
{
    private readonly IMyService _service;
    private readonly ILogger<IndexModel> _logger;
    
    public IndexModel(IMyService service, ILogger<IndexModel> logger)
    {
        _service = service;
        _logger = logger;
    }
}
```

**方式二：方法参数注入（使用 `[FromServices]`）**

```csharp
public IActionResult OnGet([FromServices] IMyService service)
{
    service.DoSomething();
    return Page();
}
```

**方式三：视图内注入（使用 `@inject`）**

```cshtml
@inject IMyService MyService
@inject ILogger<IndexModel> Logger

<p>@MyService.GetData()</p>
```

#### ⚠️ Razor Pages 中的 `[BindProperty]` 陷阱

```csharp
public class EditModel : PageModel
{
    [BindProperty]  // ✅ GET 请求时不会绑定，仅 POST
    public int Id { get; set; }
}
```

**问题**：如果需要在 GET 请求时也绑定 Id（如 `/Edit?id=5`），必须添加 `SupportsGet = true`：

```csharp
[BindProperty(SupportsGet = true)]
public int Id { get; set; }
```

**最佳实践**：

| 场景 | 推荐方式 |
|------|---------|
| POST 表单回传 | `[BindProperty]`（默认） |
| GET 查询参数 + POST 回传 | `[BindProperty(SupportsGet = true)]` |
| 路由参数（如 `/Edit/5`） | `[BindProperty(SupportsGet = true)]` + `@page "{id:int}"` |
| 仅在方法中使用的参数 | 直接在 OnGet 方法参数中接收 |

---

## 第七部分：可维护性与扩展篇

### Razor 类库（RCL）

**RCL（Razor Class Library）** 是 ASP.NET Core 支持的可复用类库，可包含：

- Razor 视图（Views）
- Razor Pages（Pages）
- Blazor 组件
- 静态文件（放置于 `wwwroot` 文件夹）

**主要用途**：在多个项目间共享 **UI 组件、页面和静态资源**。

**创建命令**：

```bash
# .NET 6/7/8 通用命令
dotnet new razorclasslib --support-pages-and-views -n MyRCL

# 或创建 Blazor 组件库（不包含 MVC/Razor Pages 支持）
dotnet new razorclasslib -n MyBlazorRCL
```

**引用与使用**：

1. 在主项目中添加对 RCL 的项目引用
2. 静态文件访问路径：`_content/{库名}/{文件路径}`
3. 如果 RCL 包含页面/视图，主项目需调用 `builder.Services.AddRazorPages().AddRazorPagesOptions(options => {})` 确保 RCL 被发现

**版本兼容性**：RCL 的 .NET 版本应与主项目一致，否则可能产生编译错误。

---

### Areas（区域）

Area 用于将大型应用按功能模块划分，如 `Admin`、`Customer`、`Blog` 等。

**文件夹结构**：

```
Areas/
├── Admin/
│   ├── Controllers/
│   │   └── DashboardController.cs
│   ├── Models/
│   └── Views/
│       └── Dashboard/
│           └── Index.cshtml
└── Customer/
    └── ...
```

**控制器中的 Area 指定**：

```csharp
[Area("Admin")]
public class DashboardController : Controller
{
    public IActionResult Index() => View();
}
```

**路由配置**：

```csharp
app.MapControllerRoute(
    name: "areas",
    pattern: "{area:exists}/{controller=Home}/{action=Index}/{id?}");

// 默认路由（非 Area）
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");
```

**Area 视图查找路径**：

```
/Areas/{AreaName}/Views/{Controller}/{Action}.cshtml
/Areas/{AreaName}/Views/Shared/{View}.cshtml
/Views/Shared/{View}.cshtml（回退）
```

---

### 静态资源、打包与压缩

#### 静态资源存放

默认路径：`wwwroot/` 文件夹，通过 `app.UseStaticFiles()` 公开访问。

```csharp
app.UseStaticFiles(); // 默认 wwwroot
```

**自定义静态文件夹**：

```csharp
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "MyStaticFiles")),
    RequestPath = "/static"  // 访问路径：/static/xxx
});
```

#### 打包与压缩（Bundle & Minification）

**前端构建工具（推荐）**：

| 工具 | 说明 | 适用场景 |
|------|------|---------|
| **Webpack** | 现代化前端构建工具 | 复杂前端项目，与 SPA 框架配合 |
| **Vite** | 下一代前端构建工具 | 现代前端开发，快速热更新 |
| **Gulp** | 基于流的构建工具 | .NET Core 早期官方推荐 |

**后端压缩（传输层）**：

`UseResponseCompression` 中间件在传输时压缩响应，减少带宽占用：

```csharp
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<GzipCompressionProvider>();
    options.Providers.Add<BrotliCompressionProvider>();
});

app.UseResponseCompression();
```

⚠️ **注意**：`UseResponseCompression` 应在 `UseStaticFiles` 之后，因为静态文件通常已由 Web 服务器（如 IIS/Nginx）压缩，不用重复压缩。

---

### 支持多视图引擎

ASP.NET Core **仅内置 Razor 视图引擎**，不再支持 WebForms（ASPX）。如需使用其他模板引擎，可通过实现 `IViewEngine` 接口进行扩展。

**内置引擎**：仅 Razor 支持所有扩展点

**第三方引擎示例**：

```csharp
public class HandlebarsViewEngine : IViewEngine
{
    // 实现 FindView、GetView 等方法
    public ViewEngineResult FindView(ActionContext context, string viewName, bool isMainPage)
    {
        // 自定义查找逻辑：可从数据库、Redis 或自定义模板源获取视图
        return ViewEngineResult.NotFound(viewName, Array.Empty<string>());
    }
    // ... 其他方法
}
```

**注册自定义视图引擎**：

```csharp
services.Configure<MvcViewOptions>(options =>
{
    options.ViewEngines.Clear(); // 可选：移除默认 Razor
    options.ViewEngines.Add(new MyCustomViewEngine());
});
```

---

### 本地化（Localization）与全球化（Globalization）

#### 基础配置

```csharp
// 1. 注册服务
services.AddLocalization(options => options.ResourcesPath = "Resources");
services.AddControllersWithViews()
    .AddViewLocalization()  // 支持视图本地化
    .AddDataAnnotationsLocalization(); // 支持验证消息本地化

// 2. 配置支持的语言
var supportedCultures = new[] { "zh-CN", "en-US", "ja-JP" };
app.UseRequestLocalization(new RequestLocalizationOptions
{
    DefaultRequestCulture = new RequestCulture("zh-CN"),
    SupportedCultures = supportedCultures,
    SupportedUICultures = supportedCultures
});
```

#### 资源文件组织

```
Resources/
├── Views/
│   └── Home/
│       ├── Index.zh-CN.resx
│       ├── Index.en-US.resx
│       └── Index.ja-JP.resx
├── Controllers/
│   └── HomeController.zh-CN.resx
└── Models/
    └── User.zh-CN.resx
```

#### 在代码中使用

**控制器/服务**：

```csharp
public class HomeController : Controller
{
    private readonly IStringLocalizer<HomeController> _localizer;
    
    public HomeController(IStringLocalizer<HomeController> localizer)
    {
        _localizer = localizer;
    }
    
    public IActionResult Index()
    {
        ViewData["Message"] = _localizer["WelcomeMessage"];
        return View();
    }
}
```

**Razor 视图**：

```cshtml
@using Microsoft.AspNetCore.Mvc.Localization
@inject IViewLocalizer Localizer

<h1>@Localizer["Title"]</h1>
<p>@Localizer["Description"]</p>
```

#### 内容选择

- 使用 `IStringLocalizer<T>` 在控制器/服务层进行本地化
- 使用 `IViewLocalizer` 在视图中进行本地化（根据视图路径自动匹配 .resx）

---

### Razor Pages vs MVC 的性能与选型

#### 性能对比

| 对比维度 | Razor Pages | MVC |
|---------|-------------|-----|
| **底层框架** | 基于 MVC 框架 | 底层框架本身 |
| **请求处理性能** | 基本相同 | 基本相同 |
| **内存占用** | 基本相当 | 基本相当 |
| **实际影响因素** | 数据访问、业务逻辑 | 数据访问、业务逻辑 |

**结论**：两者的性能差异**可以忽略不计**，选择依据应基于**应用场景和团队偏好**。

#### 选型决策框架

**选择 Razor Pages 的信号**：
- 页面逻辑相对独立，页面间耦合度低
- 团队规模小，追求快速交付
- 开发人员习惯 WebForms 或页面驱动的模式
- CRUD 操作为主，业务逻辑简单

**选择 MVC 的信号**：
- 应用规模较大，需要严格的控制器/视图分离
- 需要同时提供 Web UI 和 Web API
- 团队规模大，需要清晰的分层边界
- 视图需要在多个控制器间复用
- 需要复杂的路由结构

#### 混合使用

ASP.NET Core **支持同时使用 MVC 和 Razor Pages**：

```csharp
builder.Services.AddControllersWithViews();
builder.Services.AddRazorPages();  // 同时启用 Razor Pages

// 路由配置
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");
app.MapRazorPages();  // 同时支持 Razor Pages
```

---

## 第八部分：面试避坑清单

| 序号 | ❌ 常见错误 | ✅ 正确理解 |
|------|-----------|-----------|
| 1 | 认为 Razor Pages 会取代 MVC | 两者是互补关系，各有适用场景 |
| 2 | 把 ViewBag 用于跨请求数据传递 | ViewBag 仅限当前请求，跨请求用 TempData |
| 3 | 在 Razor Pages 中直接用 `[BindProperty]` 处理 GET | GET 请求需加 `SupportsGet = true` |
| 4 | 认为 Exception Filter 能捕获所有异常 | 仅捕获 MVC 管道内异常，中间件异常需用 `UseExceptionHandler` |
| 5 | 在 Action 中手动重新验证 | 不需要，`ModelState.IsValid` 已包含验证结果 |
| 6 | 忽略模型绑定中的 `[FromXxx]` 属性 | 不指定时，复杂类型默认不从 JSON 请求体绑定 |
| 7 | 忘记在 RCL 中配置 `--support-pages-and-views` | 默认 RCL 是 Blazor 组件库，需加此参数才支持 MVC/Razor Pages |
| 8 | 认为 `ViewData` 和 `ViewBag` 作用域不同 | 它们共享同一底层数据，作用域完全一致 |
| 9 | 在视图中直接调用 `@inject` 过度使用 | 视图层注入用于 UI 辅助逻辑，不应包含复杂的业务逻辑 |
| 10 | 过滤器注册时忘记考虑执行顺序 | 多个过滤器之间顺序非常重要，顺序错误可能导致逻辑异常 |

---

## 小结

ASP.NET Core 的 MVC 和 Razor Pages 是一套完整的 Web UI 开发体系。它们共享相同的底层设施（路由、模型绑定、验证、Razor 引擎、过滤器），但提供了不同的编程模型以适应不同的应用场景。

回顾全文，记住三个核心原则：

1. **场景决定选型**：CRUD/页面驱动用 Razor Pages，大型/分层/API+UI 混合用 MVC。
2. **掌握数据流向**：请求 → 路由 → 模型绑定 → 验证 → 业务逻辑 → 视图渲染，每一步都是面试考点。
3. **灵活运用扩展点**：Tag Helper、视图组件、自定义验证、过滤器、RCL，这些是体现技术深度的关键点。
