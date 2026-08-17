---
tags: [Git]
category: Git
title: 彻底删除 Git 历史中的文件
date: 2026-08-06T11:02:00
banner: /images/git.webp
description: 详解如何从Git仓库的历史中彻底删除一个文件，包括两种场景的完整操作步骤、文件与文件夹的区别、常见问题及注意事项。
---

# 彻底删除 Git 历史中的文件

> 以文件 `docs/public/images/auth.png` 为例

如果你曾经不小心把一个**不该提交的文件**推到了 Git 仓库里——比如密钥文件、编译产物、大体积图片——即使你后来删掉了它，它依然**永远存在**于 Git 的历史中。只要有人克隆仓库，就能翻出这个文件。

那有没有办法**从历史中彻底抹掉它**？答案是肯定的。本文将一步步带你完成这个操作。

---

## 前置：先确认文件的历史状态

在执行任何操作之前，先确认这个文件到底在不在历史里：

```bash
git log --all --full-history --oneline -- docs/public/images/auth.png
```

- **有输出** → 文件存在于历史中，需要继续操作
- **无输出** → 文件从未被提交过，无需操作

同时检查它在当前最新提交中的状态：

```bash
git ls-files | grep auth.png
```

- 有输出 → 当前仍在被追踪
- 无输出 → 当前已未被追踪

这一步能帮你确认当前状态，避免做无用功。

---

## 核心操作：两种场景，按需选择

根据你的后续需求，有两种不同的处理方式。

---

### 场景 A：彻底删除，并且以后不再追踪（推荐）

适合**密钥文件、大体积资源、编译产物**等不再需要的文件。彻底清除历史的同时，防止未来再次误提交。

**第一步：更新 `.gitignore`**

在 `.gitignore` 末尾添加一行：

```
docs/public/images/auth.png
```

如果项目中没有 `.gitignore`，新建一个。

**第二步：停止追踪当前文件**

- 保留本地文件：

```bash
git rm --cached docs/public/images/auth.png
```

- 同时删除本地文件：

```bash
git rm docs/public/images/auth.png
```

**第三步：提交本次变更**

```bash
git commit -m "chore: stop tracking docs/public/images/auth.png"
```

**第四步：重写整个历史**

这是核心步骤，会遍历所有提交，从每个提交中移除该文件：

```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch docs/public/images/auth.png" \
  --prune-empty --tag-name-filter cat -- --all
```

执行时会显示进度，类似 `Rewrite 123abc... (1/100)`。出现 `Ref 'refs/heads/...' was rewritten` 即表示成功。

**第五步：删除备份引用**

`filter-branch` 会备份旧引用，必须删掉才能回收空间：

```bash
rm -rf .git/refs/original
```

**第六步：清理日志并回收空间**

```bash
git reflog expire --expire=now --all
git gc --aggressive --prune=now
```

**第七步：验证历史是否删除成功**

```bash
git log --all --full-history --oneline -- docs/public/images/auth.png
```

应**无任何输出**。

**第八步：强制推送到远程**

```bash
git push origin --force --all
git push origin --force --tags
```

**第九步：（可选）清除远程缓存**

登录 GitHub/GitLab/Gitee，进入仓库设置，找到“清理缓存”或“Repository Cache”，手动执行清理。

---

### 场景 B：删除历史，但以后可能重新追踪

适用于你想**抹掉历史痕迹**，但后续可能重新提交该文件（比如重构后重新生成）。

**第一步：直接重写历史**

```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch docs/public/images/auth.png" \
  --prune-empty --tag-name-filter cat -- --all
```

**第二步：删除备份引用**

```bash
rm -rf .git/refs/original
```

**第三步：清理日志并回收空间**

```bash
git reflog expire --expire=now --all
git gc --aggressive --prune=now
```

**第四步：验证历史已删除**

```bash
git log --all --full-history --oneline -- docs/public/images/auth.png
```

应无输出。

**第五步：强制推送到远程**

```bash
git push origin --force --all
git push origin --force --tags
```

**第六步：（可选）重新追踪该文件**

```bash
git add docs/public/images/auth.png
git commit -m "重新添加 auth.png"
git push origin <分支名>
```

---

## 两种场景对比一览

| 操作点 | 场景 A（不再追踪） | 场景 B（可能重新追踪） |
|--------|-------------------|----------------------|
| 修改 `.gitignore` | ✅ 需要 | ❌ 不需要 |
| 执行 `git rm --cached` | ✅ 需要（提交一次） | ❌ 不需要 |
| 是否影响当前工作区 | 保留或删除（取决于参数） | 保留，但索引中移除 |
| 后续能否再次提交 | 被 `.gitignore` 阻止 | 可以，重新 add 即可 |

---

## 常见问题排查

| 问题现象 | 可能原因 | 解决办法 |
|---------|---------|---------|
| `filter-branch` 执行后只显示一行，无进度 | 路径错误，未匹配到文件 | 用 `git ls-files \| grep auth.png` 确认路径，修正后重试 |
| 删除备份引用时报错“No such file or directory” | `refs/original` 不存在 | 忽略，继续执行后续命令 |
| 强制推送被拒绝（protected branch） | 分支受保护 | 在仓库设置中临时关闭保护，或联系管理员 |
| 本地已删除，但远程网页仍显示 | 远程缓存未刷新 | 等待几分钟，或手动清理远程缓存 |
| `filter-branch` 报错“already exists” | 上次执行未清理 | 命令已包含 `--force`，重试即可 |

---

## 注意事项

- **操作前务必备份仓库**（复制整个文件夹），以防万一。
- 操作会**改变所有提交的哈希值**，团队成员必须**重新克隆**，直接 `git pull` 会报错。
- 所有命令中的路径请使用**正斜杠 `/`**，即使在 Windows 下也是如此。
- `git filter-branch` 执行时间取决于仓库大小和历史长度，请耐心等待。

---

## 小结

通过本文的操作，`docs/public/images/auth.png` 将彻底从 Git 的历史记录中消失。无论是为了清理敏感信息，还是为了瘦身仓库，这套流程都能帮你干净利落地完成任务。

如果你操作的是**文件夹**，原理完全相同，只需在 `git rm` 命令中加上 **`-r`** 参数即可。关于文件夹的完整操作，可以参考本博客的另一篇文章：《[[blog-git-彻底从历史删除文件夹|彻底删除 Git 历史中的文件夹]]》。
