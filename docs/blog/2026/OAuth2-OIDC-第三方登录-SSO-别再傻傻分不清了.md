---
tags:
  - OAuth2
  - OIDC
  - SSO
  - 第三方登录
  - 身份认证
  - 授权
category: 后端开发
categories:
  - 身份认证
  - 技术科普
  - Web安全
banner: /images/oauth2-oidc.webp
title: OAuth2、OIDC、第三方登录、SSO：别再傻傻分不清了
date: 2026-09-15T11:02:00
description: OAuth2 管授权，OIDC 管认证，第三方登录管“用谁的身份登录”，SSO 管“登录一次能进几个应用”。四个概念，两个维度，一篇文章彻底理清。
pub-blog: true
ai: true
status: published
---

# 高清粗 OAuth2、OIDC、第三方登录、SSO：别再傻傻分不清了

第一次接触这几个词的时候，我很晕。

OAuth2、OIDC、SSO、第三方登录、社交登录、联合登录、SAML、CAS……它们好像都跟“登录”有关，又好像不是一回事。有人说“OIDC 就是 OAuth2 加了个 OpenID”，有人说“SSO 就是单点登录”，但拼在一起就全乱了。

今天我们把它们彻底拆开。

## 别记成一条继承链

很多人会把它们理解成一条线：

```
OAuth2 → OIDC → SSO   ❌ 不准确
```

**这不是上下级关系。**

更准确的理解是分成两层：

```
协议层：OAuth2、OIDC、SAML、CAS……
场景层：第三方登录、SSO、单应用登录……
```

它们不在同一个维度上，而且可以自由组合。

一句话记住四个概念的分工：

> **OAuth2 管授权，OIDC 管认证，第三方登录管“用谁的身份登录”，SSO 管“登录一次能进几个应用”。**

## 四个概念，一张表看清

| 概念 | 本质 | 解决什么 | 产物 |
|:---|:---|:---|:---|
| **OAuth2** | 授权框架 | 应用能代表用户访问什么资源 | Access Token |
| **OIDC** | 基于 OAuth2 的认证协议 | 用户是谁 | ID Token + Access Token |
| **第三方登录** | 登录场景 | 用外部身份登录应用 | 本地会话 / Token |
| **SSO** | 登录架构场景 | 一次登录，多应用通行 | 共享会话 / 断言 |

## OAuth2：它真的不是登录协议

这是最大的一个坑。

**OAuth2 的核心是授权，不是登录。**

典型角色有四个：

- **用户**：资源所有者
- **你的应用**：客户端 Client
- **微信 / GitHub / Google**：授权服务器，也常是 IdP
- **微信 API / GitHub API**：资源服务器

典型流程长这样：

```
用户点“用 GitHub 登录”
→ 应用跳转 GitHub 授权页
→ 用户同意授权
→ GitHub 回调应用，给 code
→ 后端用 code 换 access_token
→ 后端用 access_token 调 GitHub API 拿用户信息
→ 应用自己建立本地登录态
```

关键点在这里：

> **Access Token 是给资源服务器用的，代表授权，不标准地代表用户身份。**

所以 OAuth2 本身不直接解决“认证”。你拿它硬做登录，很容易踩安全坑。

## OIDC：给 OAuth2 加了一层认证

OIDC = OpenID Connect。

它是在 OAuth2 的基础上加了一层**标准身份认证**。相比 OAuth2 多了什么？

- `openid` scope
- **ID Token**
- UserInfo 接口
- 标准 claims：`sub`、`iss`、`aud`、`exp`、`email`、`name`
- `nonce`
- 发现文档、JWKS 等

最关键的区别：

```
OAuth2：Access Token → 你能访问什么
OIDC：ID Token + Access Token → 你是谁 + 你能访问什么
```

- **ID Token 给客户端用**：验证用户身份
- **Access Token 给资源服务器用**：调用 API

所以：

> **OIDC 才是标准的认证协议。**

### 从返回结果就能看出来

OAuth2 换 token 后：

```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

OIDC 换 token 后：

```json
{
  "access_token": "...",
  "id_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

多出来的那个 `id_token`，就是关键。

解析 ID Token，大概长这样：

```json
{
  "iss": "https://idp.example.com",
  "sub": "1234567890",
  "aud": "my-client-id",
  "exp": 1710000000,
  "email": "a@b.com",
  "name": "Alice"
}
```

其中：

- `sub`：用户唯一标识，**这才是标准里的“用户 ID”**
- `iss`：谁签发的
- `aud`：发给哪个客户端的
- `exp`：什么时候过期

### 容易混淆的几个词

| 词 | 是什么 | 注意 |
|:---|:---|:---|
| **OpenID** | 早期的一套登录协议 | 和 OIDC 不是一回事 |
| **OpenID Connect / OIDC** | 基于 OAuth2 的现代认证协议 | 就是我们现在说的这层 |
| **`openid`** | OIDC 请求里的 scope 值 | 表示“我要走 OIDC”，不是用户 ID |
| **ID Token** | OIDC 新增的核心令牌 | 给客户端验证用户身份 |
| **`sub`** | ID Token 里的用户唯一标识 | 这才是标准里的“用户 ID” |
| **`openid` / `unionid`** | 微信体系里的用户标识 | 不是 OIDC 的标准字段 |

所以最准确的说法是：

> **OAuth2 多出来的不是简单一个叫 “Open ID” 的字段，而是 OpenID Connect 这一层认证能力。它最核心的产物是 ID Token。ID Token 里的 `sub` 才是用户唯一标识。**

## 第三方登录：用谁的身份进你的门

微信登录、GitHub 登录、Google 登录——这些是**第三方登录场景**，也叫社交登录、联合登录、联邦登录（Federated Login）。

底层通常是：

```
OAuth2 授权 + 调用户信息 API + 应用自己建立登录态
```

但不同的平台，底层实现不一样：

| 登录方式 | 底层 | 是否标准 OIDC |
|:---|:---|:---|
| 微信登录 | 微信自己的 OAuth2 变体 | 通常不是 |
| GitHub 登录 | OAuth2 | 通常不是 |
| Google 登录 | OIDC | 通常是 |

**微信登录**的要点：拿 code → 换 access_token → 拿 openid/unionid → 拿用户信息 → 应用自己建立登录态。UnionID 可以识别同一开放平台下的同一用户，但**不等于自动 SSO**。

**GitHub 登录**的要点：拿 code → 换 access_token → 调 `https://api.github.com/user` → 拿用户 ID/用户名 → 应用自己建立登录态。

> **微信/GitHub 登录是第三方登录场景，底层多是 OAuth2，不是标准 OIDC。**

## SSO：一次登录，多应用通行

SSO = Single Sign-On，单点登录。

核心就一句话：

> **多个应用共享同一个认证中心，用户登录一次，就能访问多个互信应用。**

典型流程：

```
访问 Jira
→ 重定向到公司 IdP
→ 输入账号密码
→ IdP 发断言/token
→ Jira 登录成功

访问 Wiki
→ 重定向到同一个 IdP
→ IdP 发现已登录
→ 直接发断言/token
→ Wiki 登录成功
```

**SSO 不是协议，是一种场景/能力。** 它可以用这些来实现：

- OIDC
- SAML
- CAS
- Kerberos

所以：

> **OIDC 可以用来实现 SSO，但 OIDC ≠ SSO。SSO 也不一定用 OIDC，企业里很多用 SAML。**

## 关系图：一张图看清所有

```
协议层
├─ OAuth2：授权框架
│   └─ 产物：Access Token
├─ OIDC：基于 OAuth2 的认证协议
│   └─ 产物：ID Token + Access Token
├─ SAML：企业 SSO 常用认证协议
└─ CAS：另一种 SSO 协议

场景层
├─ 第三方登录 / 社交登录
│   ├─ 微信登录：OAuth2 变体，非 OIDC
│   ├─ GitHub 登录：OAuth2，非标准 OIDC
│   └─ Google 登录：通常是 OIDC
└─ SSO 单点登录
    ├─ 可用 OIDC 实现
    ├─ 可用 SAML 实现
    ├─ 可用 CAS 实现
    └─ 也可以把微信/GitHub 作为上游身份源
```

## 它们可以自由组合

- OIDC 做第三方登录：Sign in with Google
- OAuth2 做第三方登录：微信登录、GitHub 登录
- OIDC 做 SSO：Keycloak、Entra ID、Okta
- SAML 做 SSO：传统企业应用
- **第三方登录 + SSO**：用 Keycloak 接微信/GitHub，再给内部多个应用发 OIDC/SAML，实现统一登录

## 六个常见误区

**误区一：OAuth2 就是登录协议？**
不是。OAuth2 是授权框架，直接拿它做登录容易有安全坑。

**误区二：有 Access Token 就代表用户已登录？**
不一定。Access Token 代表授权，不标准地代表身份。

**误区三：微信登录是 OIDC？**
通常不是。它是微信自己的 OAuth2 变体。

**误区四：GitHub 登录是 OIDC？**
普通 Sign in with GitHub 是 OAuth2，不是标准 OIDC。

**误区五：OIDC 就是 SSO？**
不是。OIDC 可以实现 SSO，但 SSO 也可以用 SAML、CAS。

**误区六：第三方登录就是 SSO？**
不一定。单个应用接微信登录，只是第三方登录。多个应用都接同一个 IdP，并共享登录态，才形成 SSO 效果。

## 最后记三句话

> **OAuth2 管授权，OIDC 管认证。**
> **微信/GitHub 登录是第三方登录场景，底层多是 OAuth2，不是标准 OIDC。**
> **SSO 是一次登录多应用通行，是场景，可用 OIDC/SAML/CAS 实现。**

再用一个比喻收尾：

```
OAuth2：发门禁卡 → 你能进哪些门
OIDC：发身份证 + 门禁卡 → 你是谁 + 你能进哪些门
第三方登录：用微信/GitHub 的身份进你的门
SSO：园区一卡通 → 登记一次，食堂、图书馆、办公楼都能进
```

记住这几句，再看 OAuth2 和 OIDC 的文档，就不会晕了。