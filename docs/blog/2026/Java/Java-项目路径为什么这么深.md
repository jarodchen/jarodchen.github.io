---
tags:
  - Java
  - Maven
  - 项目结构
  - 包管理
  - .NET
  - 工程化
category: 后端开发
categories:
  - Java
  - 工程化
  - 技术科普
banner: /images/java.webp
title: Java 项目路径为什么这么深
date: 2026-09-22T11:02:00
description: modules/module-auth/src/main/java/com/mysite/module/auth/config——一条路径里叠了三件事。搞懂它们，你就不会再觉得 Java 反人类了。
pub-blog: true
ai: true
status: published
---
# Java 项目路径为什么这么深？

我最近再看Java的东西，第一次看到 Java 项目的目录结构，我想很多人脑子里都会冒出同一个念头：

```text
modules/module-auth/src/main/java/com/mysite/module/auth/config
```

这也太深了吧？点开一个文件，IDEA 左边的目录树都快装不下了。太反人类了！！！

如果你是从 .NET 或者 Node.js 转过来的，这种感觉会更强烈。.NET 里一个文件放哪都行，命名空间和目录根本不绑定。Java 凭什么要搞得这么麻烦？

我问了一下AI， 有了答案。这条路径其实是**三件事叠在一起**的结果，拆开看，每一件都挺合理。

## 一条路径，三件事

把这条路径拆开：

| 路径部分 | 是什么 | 谁决定的 |
|:---|:---|:---|
| `modules/module-auth` | 多模块项目的子模块 | 你的项目架构选择 |
| `src/main/java` | Maven/Gradle 的主 Java 源码根目录 | 构建工具约定 |
| `com/mysite/module/auth/config` | Java 包名映射成目录 | Java 包机制 |

关键来了：**一个模块本身根本不需要这么深。**

`module-auth` 模块根下面通常只有这些东西：

```text
module-auth/
├── pom.xml
└── src/
    ├── main/
    │   ├── java/
    │   └── resources/
    └── test/
        └── java/
```

你看到的 `com/mysite/module/auth/config`，**不是模块结构，是 Java 包路径。**

因为你的 Java 文件里写了：

```java
package com.mysite.module.auth.config;
```

所以文件必须放在：

```text
src/main/java/com/mysite/module/auth/config/
```

> **Java 语言有一条硬性要求：包名和目录结构必须对应。包名多长，目录就多深。**

这跟 .NET 完全不一样。

## 为什么 Maven 要搞个 `src/main/java`？

因为一个模块里不只有 Java 代码，还要区分：

- 主代码：`src/main/java`
- 主资源：`src/main/resources`
- 测试代码：`src/test/java`
- 测试资源：`src/test/resources`

这样 Maven、Gradle、IDE、CI 不用任何额外配置就能识别。你当然可以改，但改了之后所有工具和插件都得跟着配，一点都不划算。

## 为什么包名要写这么长？

Java 包名的习惯是“域名倒写 + 项目 + 模块 + 功能”：

```text
com.mysite.module.auth.config
```

拆解一下：

- `com.mysite`：组织 / 域名倒写，保证全局唯一
- `module.auth`：业务模块
- `config`：功能子包

这套命名规则的目的是**唯一性和分层**。域名倒写保证你的包名不会和别人的冲突，业务模块和功能子包保证代码组织清晰。

但你的路径里确实有重复：

```text
modules/module-auth
com/mysite/module/auth
```

`module-auth` 已经在模块目录上表示过一次了，包名里又出现 `module.auth`，确实冗余。可以简化成：

```text
modules/auth/src/main/java/com/mysite/auth/config
```

如果项目不大，甚至连 `modules/` 这一层都可以省掉：

```text
src/main/java/com/mysite/auth/config
```

所以结论是：

**模块本身可以很浅。深的是 Maven 标准目录 `src/main/java` 加上 Java 包名。**

`src/main/java` 不建议动，包目录必须和 `package` 一致。但多模块层级和包名里的重复部分，是可以优化的。

## 那能不能像 .NET 一样？

能，但 Java 生态默认不这么干。

核心区别在于：

**.NET：**
- 命名空间和文件夹**不强制绑定**
- `.csproj` 显式列出或通配包含哪些 `.cs` 文件
- 你可以这样写：

```text
MyApp/
  MyApp.csproj
  Program.cs
  Auth/
    AuthService.cs
```

命名空间写 `MyApp.Auth`，文件放哪都行，MSBuild 能找到就行。

**Java：**
- 包名和目录结构**强绑定**
- 类加载器加载 `com.mysite.auth.AuthService` 时，会去类路径下找 `com/mysite/auth/AuthService.class`
- Maven/Gradle 默认源码根是 `src/main/java`

所以源码自然就变成了：

```text
src/main/java/com/mysite/auth/AuthService.java
```

然后路径就一路加深：

```text
模块根/src/main/java/包名倒写/功能子包/文件.java
```

## 一个容易被忽略的细节

其实 **Java 语言本身并没有强制源文件必须放在包目录下。**

`javac` 编译时，源文件位置可以不完全匹配包名。但编译输出 `.class` 时，仍然会按包名生成目录。

真正让你难受的是：**IDE、Maven、Gradle、Spring 扫描、CI 全都默认按这套约定工作。** 你非要改，就得处处配置，得不偿失。

## 那 Java 能不能模仿 .NET？

可以。比如：

```text
src/main/java/
  auth/
    AuthService.java
```

包名写：

```java
package auth;
```

这样目录确实浅多了。但问题也不少：

- 包名太短，容易和第三方库冲突
- Spring Boot 默认从主类所在包往下扫描，包名太短可能扫到不该扫的东西
- 大项目里包名没有唯一性，维护会乱
- 很多工具和插件默认假设包名是倒写域名

所以 Java 圈子的共识是：**包名倒写域名 + 目录对应包名。**

`com.mysite.module.auth.config` 里，`com.mysite` 是为了唯一，`module.auth.config` 是业务分层。这套规则在大项目、多团队、依赖管理上更稳，代价就是路径看起来啰嗦。

## 五条实用建议

如果你实在受不了这个路径深度，可以试试这几招：

**1. 别跟生态硬刚。**
保留 `src/main/java` 和包名目录对应，这是 Java 世界最省事的做法。

**2. 缩短包名。**
个人项目没必要 `com.mysite.module.auth.config`，可以简化成 `com.mysite.auth.config`。

**3. 少拆模块。**
小项目别搞 `modules/module-auth`，直接单模块就行。

**4. IDE 折叠。**
IntelliJ IDEA 开启 `Compact Middle Packages`，`com.mysite.auth.config` 会显示成一行，视觉上立刻清爽。

**5. 真受不了，可以用 Kotlin。**
Kotlin 不强制包名和目录对应，写 Spring Boot 时可以扁平一些。但生态还是推荐对应，只是语言层面更宽松。

## 总结

Java 不是不能像 .NET 那样扁平，而是整个 Java 生态默认选择了“包名 = 目录”的强约定。

这套约定在大项目、多团队、依赖管理上更稳，但代价就是路径深、看起来啰嗦。

**个人项目可以适当简化，但完全改成 .NET 风格，会跟 Maven、Gradle、IDE、Spring 打架，通常不划算。**

所以下次再看到那条深不见底的路径，别骂 Java 反人类了。它不是故意折磨你，它只是选了另一条路——一条看起来笨重，但在大型项目里更稳的路。
