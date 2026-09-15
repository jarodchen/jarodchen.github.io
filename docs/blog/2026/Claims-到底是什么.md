---
tags:
  - OIDC
  - JWT
  - Claims
  - 身份认证
  - 安全
category: 后端开发
categories:
banner: /images/科技4.webp
title: Claims 到底是什么？用“点菜”的方式理解 OIDC 里的用户断言
date: 2026-09-15T11:02:00
description: ID Token 的 payload 就是一组 claims——这句话到底什么意思？从 Scope 和 Claim 的区别，到哪些 claims 必须验证，一篇讲清楚 OIDC 里最容易混淆的核心概念。
pub-blog: true
ai: true
status: published
---

# Claims 到底是什么？用“点菜”的方式理解 OIDC 里的用户断言

你第一次看到 ID Token 的 payload 时，可能觉得还挺直观的：

```json
{
  "sub": "1234567890",
  "name": "Alice",
  "email": "alice@example.com",
  "email_verified": true
}
```

不就是几个键值对吗？能有什么问题？

但当你遇到 Scope、Claim、Access Token、ID Token、UserInfo 这些词混在一起的时候，就开始晕了。尤其是有人问你“Scope 和 Claim 什么区别”，你大概会卡壳三秒。

今天我们就用“点菜”这个场景，把这些概念一次性理清楚。

## Claim 是什么？签发者的一句“断言”

先把定义说清楚。

**Claim = 签发者关于某个实体（通常是用户）的一条声明。**

英文 Claim 可以翻译成“声明”“断言”“信息字段”。在 OIDC 语境里，它就是 IdP（身份提供方）告诉你的一件事。

比如上面那段 JSON：

- `sub` 是一个 claim，意思是“这个用户的唯一标识是 1234567890”
- `name` 是一个 claim，意思是“这个用户叫 Alice”
- `email` 是一个 claim，意思是“这个用户的邮箱是 alice@example.com”
- `email_verified` 是一个 claim，意思是“这个邮箱已经验证过了”

**每一个键值对，都是一个 claim。**

## Claim 出现在哪里？

它主要出现在这几个地方：

| 位置 | 说明 |
|:---|:---|
| ID Token 的 payload | OIDC 标准身份凭证里的 claims |
| UserInfo 端点返回的 JSON | 更多用户信息 claims |
| Access Token（如果是 JWT） | 也可能有 claims，但一般不用于身份认证 |
| JWT 本身 | JWT 的 payload 就是一组 claims |

最重要的一句话：

> **ID Token 的 payload 就是一组 claims。**
> **UserInfo 返回的 JSON 也是一组 claims。**

## OIDC 标准里，哪些 Claim 必须要有？

OIDC Core 1.0 定义了一批标准 claims。其中 ID Token 必须包含这五个：

| Claim | 含义 |
|:---|:---|
| `iss` | Issuer，谁签发的 |
| `sub` | Subject，用户唯一标识 |
| `aud` | Audience，发给哪个客户端 |
| `exp` | 过期时间 |
| `iat` | 签发时间 |

**这里面最重要的是 `sub`。**

> **`sub` 才是 OIDC 标准里的用户唯一标识。**

别用 `email` 或 `preferred_username` 当唯一 ID。邮箱可以变，用户名可以改，但 `sub` 是稳定的。

除了这五个，还有一些条件性 claims，比如 `nonce`（请求带了就必须原样返回）、`auth_time`（请求了 `max_age` 就需要）、`acr`、`amr` 等。

还有一些常见的用户信息 claims，比如 `name`、`given_name`、`family_name`、`picture`、`email`、`phone_number`、`address`、`locale`。

注意：**ID Token 里不一定包含所有用户信息。** 更多信息可以通过 `access_token` 调 UserInfo 端点获取。

## Scope 和 Claim 的关系：点菜和上菜

这是最容易混的地方。

一句话：

> **Scope 是“我要哪类信息”，Claim 是“实际拿到的信息字段”。**

Scope 是请求参数。你在授权请求里写 `scope=openid email profile`，意思是“我要走 OIDC，给我邮箱和基本资料”。

Claim 是返回结果。IdP 收到请求后，返回 ID Token 和 UserInfo，里面装着具体的字段——`sub`、`email`、`email_verified`、`name`、`picture` 等等。

| Scope | 通常对应的 Claims |
|:---|:---|
| `openid` | 必须，表示走 OIDC，ID Token 里至少有 `sub` |
| `profile` | `name`、`picture`、`locale` 等 |
| `email` | `email`、`email_verified` |
| `phone` | `phone_number`、`phone_number_verified` |
| `address` | `address` |

用点菜来比喻：

```text
Scope：点菜时说要“饮料”
Claim：服务员实际端上来的“可乐”
```

Scope 是请求，Claim 是结果。Scope 是类别，Claim 是具体字段。

## Claims 需要验证吗？必须的

这是安全层面最关键的一点。

**Claim 是签发者的断言，不是绝对真理。** 你信任 IdP，并验证通过后，才信任这些 claims。

客户端拿到 ID Token 后，必须验证：

- 验证签名（确认是 IdP 签的，没被篡改）
- 验证 `iss` 是不是预期 IdP
- 验证 `aud` 是否包含自己的 `client_id`
- 验证 `exp` 未过期
- 验证 `iat` 合理
- 如果请求带了 `nonce`，验证 `nonce` 一致
- 如果存在 `azp`、`at_hash`、`c_hash`，按规范验证

全部通过之后，你才能信任 `sub` 这些 claims。

跳过验证直接信 claims，等于把门钥匙交给任何一个自称是 IdP 的人。

## Claim 和 Access Token 的关系

Access Token 如果是 JWT，也可能有 claims，比如：

```json
{
  "sub": "123",
  "scope": "read:user",
  "client_id": "my-client",
  "exp": 1710000000
}
```

但要注意：

> **Access Token 的 claims 主要是给资源服务器做授权判断用的。**
> **不要直接拿 Access Token 的 claims 当用户身份凭证。**

OIDC 里的标准分工是这样的：

| 凭证 | 用途 |
|:---|:---|
| ID Token 的 claims | 客户端认证用户 |
| Access Token | 调资源 API |
| UserInfo 返回的 claims | 补充用户信息 |

三条线各有各的用途，别搞混了。

## 六个常见误区

**误区一：Claim 就是 Scope？**
不是。Scope 是请求类别，Claim 是返回字段。

**误区二：所有 claims 都在 ID Token 里？**
不一定。更多信息可能在 UserInfo 端点。

**误区三：拿到 ID Token 就能直接信 claims？**
不行。必须验证签名、`iss`、`aud`、`exp`、`nonce` 等。

**误区四：用 `email` 当用户唯一 ID？**
不推荐。用 `sub`。

**误区五：Access Token 里的 `sub` 能当身份吗？**
不标准。OIDC 认证身份主要看 ID Token 的 `sub`。

**误区六：Claim 一定可信？**
不一定。它只是 IdP 的断言，客户端要验证并信任 IdP。

## 最后记三句话

> **Claim 是 JWT / OIDC 里的键值对断言，描述用户或上下文。**
> **ID Token 的 payload 就是一组 claims。**
> **Scope 是“我要什么类别”，Claim 是“实际拿到什么字段”。**

再浓缩成一个比喻：

**ID Token 是身份证，Claims 是身份证上的字段。Scope 是你去办证时说要办哪种证。**

搞清楚这个，再看 OIDC 的文档，就不会晕了。
