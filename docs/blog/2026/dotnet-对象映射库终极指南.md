---
tags: [".NET Core"]
related: []
category: .NET Core
aliases:
date: 2026-08-03
title: .NET Core 对象映射库选型指南
banner: /images/banner-csharp.webp
description: .NET Core 开发中，对象映射库技术选型
---

# .NET Core 对象映射库选型指南

在 .NET Core 开发中，对象映射（Object Mapping）是连接分层架构（DTO、ViewModel、Entity）的“刚需”胶水层。手动逐属性赋值不仅枯燥，且极易因字段变更引发运行时异常。本文将系统梳理 .NET 生态中**全部 8 款**主流对象映射库，并结合 2026 年最新的生态变化（商业化、NativeAOT）给出终极选型建议。

---

### 一、为什么需要对象映射库？

在分层架构中，我们不直接暴露领域实体，而是通过 DTO 隔离关注点。手动赋值不仅重复性极高，且难以维护：

```csharp
// 令人崩溃的手动赋值
var dto = new UserDto {
    Id = user.Id,
    FullName = user.FirstName + " " + user.LastName,
    Email = user.Email,
    // ... 几十个属性
};
```

映射库通过自动化规则，将这类代码缩减为一行，并支持复杂的深拷贝、扁平化、条件映射等操作。

---

### 二、8 大主流对象映射库深度剖析（全部保留）

#### 1. AutoMapper —— 生态最成熟的"老功臣"
- **定位**：.NET 生态中最老牌、文档最丰富的库，适合复杂企业级映射（条件映射、事件钩子 `BeforeMap/AfterMap`、深度扁平化）。
- **核心用法**：
  ```csharp
  var config = new MapperConfiguration(cfg => {
      cfg.CreateMap<Source, Dest>()
          .ForMember(dest => dest.DestId, opt => opt.MapFrom(src => src.Id));
  });
  var mapper = config.CreateMapper();
  var dest = mapper.Map<Dest>(source);
  ```
- **⚠️ 2026 重要现状**：作者已宣布转向**商业化维护模式**（RPL 协议），原有 MIT 版本虽可用，但新项目需谨慎评估未来更新限制。
- **劣势**：依赖运行时反射，首次调用有冷启动开销，大数据量下性能疲软。

#### 2. Mapster —— 现代项目的"六边形战士"
- **定位**：轻量、高性能，公认的 AutoMapper 最佳免费平替（MIT 协议）。
- **杀手锏**：支持 **Source Generator（编译时生成代码）**，彻底消除运行时反射开销。
- **核心用法**（极简 API）：
  ```csharp
  // 零配置映射
  var dest = source.Adapt<Dest>();
  
  // Fluent 自定义配置
  TypeAdapterConfig<Source, Dest>.NewConfig()
      .Map(dest => dest.FullName, src => $"{src.FirstName} {src.LastName}");
  ```
- **生态**：与 EF Core 的 `ProjectToType` 配合极佳，社区异常活跃。

#### 3. EasyMapper —— .NET 8/9 时代的"极速新秀"
- **定位**：专为 .NET 8/9 及 **NativeAOT** 发布模型打造的极致性能映射器。
- **底层黑科技**：采用 **IL 发射（IL emit） + 表达式树** + 运行时缓存，实现零反射。
- **性能表现**：基准测试显示比 AutoMapper 快 **2-3 倍**，内存分配极低。
- **AOT 兼容性**：**完美兼容 NativeAOT**，这是 AutoMapper 无法逾越的硬伤。
- **API 风格**：支持静态扩展或依赖注入（DI）调用，配置简单。

#### 4. EggMapper —— AutoMapper 的"高性能无缝替代品" 🥚
- **定位**：从 AutoMapper 最后一个开源 MIT 版本 Fork 而来，API **完全兼容**，可无缝迁移。
- **迁移成本**：更换 NuGet 包，并将 `using AutoMapper;` 替换为 `using EggMapper;` 即可。
- **性能飞跃**：通过内联嵌套映射和静态泛型缓存，实现**零反射、零额外内存分配**。
- **详细基准数据（.NET 10）**：

| 场景 | EggMapper | AutoMapper | 性能提升 | 内存分配对比 |
| :--- | :--- | :--- | :--- | :--- |
| 扁平映射 (10属性) | 15 ns | 35 ns | **2.3x** | 104 B vs 232 B |
| 嵌套对象 (2层) | 25 ns | 70 ns | **2.8x** | 248 B vs 504 B |
| 集合 (100项) | 1.5 µs | 5 µs | **3.3x** | 10,824 B vs 14,424 B |
  
- **许可**：MIT 协议，永久免费商用。

#### 5. Riok.Mapperly —— 编译时生成的"性能偏执狂"
- **定位**：基于 **Source Generator（源生成器）**，在编译时直接生成纯 C# 映射代码。
- **核心用法**：
  ```csharp
  [Mapper]
  public partial class UserMapper {
      public partial UserDto MapToDto(User user);
  }
  ```
- **优势**：运行时零反射、零开销，性能甚至能**超越手写手动映射**，且生成的代码可调试。

#### 6. ExpressMapper —— 基于表达式树的轻量级方案
- **定位**：完全基于表达式树实现，轻量级、高性能。
- **特点**：支持属性忽略、构造函数映射、复合配置。曾是 AutoMapper 的高性能替代选项之一。

#### 7. TinyMapper —— 极简主义的"小快灵"
- **定位**：正如其名，体积小、API 极简。专注于按名称映射属性。
- **适用场景**：简单的小型项目或原型开发，功能相对有限。

#### 8. AgileMapper / ObjectCartographer —— 零配置与约定派
- **AgileMapper**：零配置、高度可配置，支持查询投影、深度克隆、ID 感知更新。
- **ObjectCartographer**：基于约定的高性能映射器，比 AutoMapper 快约 34%，自动注册转换器。

---

### 📊 核心维度终极对比表（全库收录）

| 对比维度 | AutoMapper | Mapster | EasyMapper | EggMapper | Mapperly |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **性能评级** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **底层机制** | 运行时反射 | 表达式树/SG | IL发射+缓存 | 静态泛型缓存 | 编译时 SG |
| **AOT 兼容** | ❌ 极差 | ✅ 良好 | ✅ **完美** | ✅ 优秀 | ✅ 优秀 |
| **配置复杂度** | 较高 | 极低 | 低 | 低（兼容AutoMapper） | 中 |
| **代码简洁度** | 较繁琐 | 极简 `.Adapt<T>()` | 简洁 | 简洁（兼容AutoMapper） | 简洁 |
| **API 兼容性** | 标准 | 独特 | 独特 | **100% 兼容 AutoMapper** | 独特 |
| **许可协议** | ⚠️ 商业维护 | MIT | MIT | **MIT** | MIT/Apache |

---

### 💡 2026 终极选型决策树（合并全部场景）

针对不同项目现状和诉求，请直接对号入座：

1. **启动全新的 .NET 项目（最稳妥首选）👉 选 Mapster**
   - 理由：它不是模仿 AutoMapper，而是重构了映射逻辑。综合体验最好——极高性能、支持编译时生成、API 极度简洁、MIT 免费。这是目前风险最低、收益最高的标准答案。

2. **项目基于 .NET 8/9，需要 NativeAOT 发布或极致性能 👉 选 EasyMapper**
   - 理由：这是 EasyMapper 的绝对主场。单文件原生 AOT 程序（启动极快、资源占用极低）只有它能完美 Hold 住。

3. **老项目已深度绑定 AutoMapper，想平滑升级性能且规避商业风险 👉 选 EggMapper**
   - 理由：这是专为你准备的“后悔药”。只需换包和改命名空间，API 完全不动，性能瞬间提升 2-3 倍，且内存分配更低。

4. **对性能有偏执要求，且喜欢手写般的可控性 👉 选 Mapperly**
   - 编译时直接生成纯 C# 代码，运行效率约等于手写，且代码透明可调试，无任何黑盒开销。

5. **小型工具、原型验证或极简需求 👉 选 TinyMapper 或 AgileMapper**
   - 零配置上手，快速验证想法。

---

### 三、总结

2026 年的 .NET 对象映射生态已经彻底分化：
- **过去**属于 AutoMapper（请优雅地将其归档为“历史功臣”）。
- **现在**属于 **Mapster**（最具普适性的六边形战士）。
- **未来**属于 **EasyMapper** 和 **Mapperly**（代表了 NativeAOT 和零开销抽象的方向）。
- **迁移救星**属于 **EggMapper**（老 AutoMapper 项目的完美逃生舱）。

建议在新项目中优先尝试 **Mapster**，若遇 AOT 场景则直上 **EasyMapper**，若需迁移老旧代码则拥抱 **EggMapper**。
