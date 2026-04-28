---
title: EF Core 性能优化技巧
date: 2026-04-20
tags: [EF Core, .NET, Performance, Database]
category: .NET 开发
description: 掌握 EF Core 性能优化的关键技巧，提升数据库访问效率
---

# EF Core 性能优化技巧

Entity Framework Core 是 .NET 生态中最流行的 ORM 框架。虽然它提供了便捷的开发体验，但不当的使用方式可能导致严重的性能问题。本文将分享经过实战验证的优化技巧。

## 1. 避免 N+1 查询问题

### 问题示例

```csharp
// ❌ 糟糕：每次循环都会执行一次数据库查询
var blogs = context.Blogs.ToList();
foreach (var blog in blogs)
{
    Console.WriteLine(blog.Name);
    foreach (var post in blog.Posts) // N+1 查询！
    {
        Console.WriteLine($"  - {post.Title}");
    }
}
```

### 解决方案：使用 Include 预加载

```csharp
// ✅ 优秀：一次性加载所有相关数据
var blogs = context.Blogs
    .Include(b => b.Posts)
    .ToList();

foreach (var blog in blogs)
{
    Console.WriteLine(blog.Name);
    foreach (var post in blog.Posts) // 内存中访问，无额外查询
    {
        Console.WriteLine($"  - {post.Title}");
    }
}
```

### 投影优化：只选择需要的字段

```csharp
// ✅ 最佳：只查询必要的字段，减少数据传输
var blogDtos = context.Blogs
    .Select(b => new BlogDto
    {
        Id = b.Id,
        Name = b.Name,
        PostCount = b.Posts.Count,
        LatestPostTitle = b.Posts
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => p.Title)
            .FirstOrDefault()
    })
    .ToList();
```

## 2. 合理使用异步操作

### 正确的异步模式

```csharp
// ✅ 推荐：全程异步
public async Task<List<Post>> GetPostsAsync(int blogId)
{
    return await context.Posts
        .Where(p => p.BlogId == blogId)
        .OrderByDescending(p => p.CreatedAt)
        .ToListAsync();
}

// 控制器中使用
[HttpGet("posts/{blogId}")]
public async Task<ActionResult<List<Post>>> GetPosts(int blogId)
{
    var posts = await GetPostsAsync(blogId);
    return Ok(posts);
}
```

### 避免同步阻塞

```csharp
// ❌ 错误：在异步上下文中使用同步方法
var posts = context.Posts.ToList(); // 阻塞线程

// ❌ 错误：使用 .Result 或 .Wait()
var posts = context.Posts.ToListAsync().Result; // 可能导致死锁

// ✅ 正确：始终使用 await
var posts = await context.Posts.ToListAsync();
```

## 3. 批量操作优化

### 批量插入

```csharp
// ❌ 低效：逐条插入
foreach (var post in posts)
{
    context.Posts.Add(post);
    await context.SaveChangesAsync(); // 每次都提交！
}

// ✅ 高效：批量插入后一次性提交
context.Posts.AddRange(posts);
await context.SaveChangesAsync(); // 只提交一次
```

### 使用第三方库提升性能

对于大量数据的批量操作，推荐使用 [EFCore.BulkExtensions](https://github.com/zzzprojects/EFCore.BulkExtensions)：

```csharp
// 安装：Install-Package EFCore.BulkExtensions

// 批量插入（比原生快 10-50 倍）
await context.BulkInsertAsync(posts);

// 批量更新
await context.BulkUpdateAsync(posts);

// 批量删除
await context.BulkDeleteAsync(postsToDelete);
```

## 4. 查询优化技巧

### 使用 AsNoTracking 提升读取性能

```csharp
// ✅ 只读场景：禁用变更追踪
var posts = await context.Posts
    .AsNoTracking()
    .Where(p => p.IsPublished)
    .ToListAsync();

// 适用于：报表、列表展示等不需要修改的场景
```

### 分页查询

```csharp
// ✅ 高效分页：避免 Skip 的性能问题
public async Task<PagedResult<Post>> GetPostsPagedAsync(
    int pageNumber, int pageSize)
{
    var totalItems = await context.Posts.CountAsync();
    
    var items = await context.Posts
        .OrderByDescending(p => p.CreatedAt)
        .Skip((pageNumber - 1) * pageSize)
        .Take(pageSize)
        .AsNoTracking()
        .ToListAsync();
    
    return new PagedResult<Post>
    {
        Items = items,
        TotalItems = totalItems,
        PageNumber = pageNumber,
        PageSize = pageSize
    };
}
```

### 使用 Raw SQL 处理复杂查询

```csharp
// 对于 EF Core 难以表达的复杂查询，使用原生 SQL
var popularPosts = await context.Posts
    .FromSqlRaw(@"
        SELECT p.* 
        FROM Posts p
        INNER JOIN (
            SELECT BlogId, COUNT(*) as PostCount
            FROM Posts
            GROUP BY BlogId
            HAVING COUNT(*) > @MinPostCount
        ) b ON p.BlogId = b.BlogId
        WHERE p.CreatedAt >= @StartDate
    ", parameters: new[] {
        new SqlParameter("@MinPostCount", 10),
        new SqlParameter("@StartDate", DateTime.UtcNow.AddMonths(-6))
    })
    .ToListAsync();
```

## 5. 索引与数据库设计

### 确保关键字段有索引

```csharp
// 在 DbContext 中配置索引
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // 单列索引
    modelBuilder.Entity<Post>()
        .HasIndex(p => p.Slug)
        .IsUnique();
    
    // 复合索引
    modelBuilder.Entity<Post>()
        .HasIndex(p => new { p.BlogId, p.CreatedAt });
    
    // 覆盖索引（包含常用查询字段）
    modelBuilder.Entity<Post>()
        .HasIndex(p => new { p.IsPublished, p.CreatedAt })
        .IncludeProperties(p => new { p.Title, p.Summary });
}
```

## 6. 连接池与生命周期管理

### 正确注册 DbContext

```csharp
// ✅ Web 应用：使用 Scoped 生命周期
builder.Services.AddDbContext<BlogDbContext>(options =>
    options.UseSqlServer(connectionString));

// ✅ 后台服务：使用 Pooling 提升性能
builder.Services.AddDbContextPool<BlogDbContext>(options =>
    options.UseSqlServer(connectionString),
    poolSize: 128); // 连接池大小
```

### 避免长时间持有的上下文

```csharp
// ❌ 错误：在单例服务中使用 DbContext
public class BadService
{
    private readonly BlogDbContext _context; // 不要注入到单例中！
    
    public BadService(BlogDbContext context)
    {
        _context = context;
    }
}

// ✅ 正确：使用工厂模式
public class GoodService
{
    private readonly IDbContextFactory<BlogDbContext> _factory;
    
    public GoodService(IDbContextFactory<BlogDbContext> factory)
    {
        _factory = factory;
    }
    
    public async Task DoWorkAsync()
    {
        await using var context = _factory.CreateDbContext();
        // 使用 context...
    }
}
```

## 7. 监控与诊断

### 启用查询日志

```csharp
// 在 appsettings.json 中配置
{
  "Logging": {
    "LogLevel": {
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
    }
  }
}
```

### 使用 MiniProfiler 分析性能

```csharp
// 安装：Install-Package MiniProfiler.EntityFrameworkCore

builder.Services.AddMiniProfiler(options =>
{
    options.RouteBasePath = "/profiler";
});

// 查看性能分析：https://yourapp/profiler
```

## 性能对比总结

| 优化技巧 | 改进幅度 | 难度 |
|---------|---------|------|
| 避免 N+1 查询 | 50-90% | ⭐ |
| 使用 AsNoTracking | 20-40% | ⭐ |
| 批量操作 | 60-95% | ⭐⭐ |
| 添加合适索引 | 70-99% | ⭐⭐ |
| 使用 BulkExtensions | 90-98% | ⭐⭐ |
| 连接池优化 | 10-30% | ⭐ |

## 实战建议

1. **先测量，再优化** - 使用 profiling 工具找到真正的瓶颈
2. **关注最常见场景** - 优化 20% 的代码解决 80% 的性能问题
3. **平衡开发效率与运行性能** - 不要过早优化
4. **定期审查生成的 SQL** - 确保 EF Core 生成了预期的查询
5. **考虑缓存策略** - 对于不常变化的数据，使用 Redis 等缓存

---

**相关资源：**
- [EF Core 知识库](https://jarodchen.github.io/ef-core-kb/)
- [EF Core 官方文档 - 性能](https://docs.microsoft.com/ef/core/performance/)
- [项目仓库](https://github.com/jarodchen/CSharp-LINQ-learn)
