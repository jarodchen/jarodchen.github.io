---
tags: [Git]
category: Git
title: 彻底删除 Git 历史中的文件夹
date: 2026-08-06T11:02:00
banner: /images/git.webp
description: 详解如何从Git仓库的历史中彻底删除一个文件夹，包括两种场景的完整操作步骤、文件与文件夹的区别、常见问题及注意事项。
---

# 彻底删除 Git 历史中的文件夹

> 以文件夹 `docs/blog/tags` 为例

> 📖 **前置阅读**：如果你要删除的是单个文件，请参考《[[blog-git-彻底从历史删除文件|彻底删除 Git 历史中的文件]]》。本文专门针对**文件夹**场景，核心区别在于需要给 Git 命令加上 `-r`（递归）参数。

在 Git 中，一个常见的认知误区是：**Git 追踪的是文件内容，而不是文件夹本身**。当你删除一个文件夹里的所有文件，这个空文件夹自然也就不存在了——因为 Git 根本不记录空目录。

但这并不意味着文件夹无法从历史中抹除。只要你理解了原理，操作起来和删除单个文件几乎一样简单。

---

## 前置：查看文件夹在历史中的出现情况

首先确认该文件夹在历史中是否有记录：

```bash
git log --all --full-history --oneline -- docs/blog/tags
```

- **有输出** → 文件夹存在于历史中，需要继续操作
- **无输出** → 文件夹从未被提交过，无需操作

同时检查当前最新提交中是否还追踪该文件夹内的文件：

```bash
git ls-files | grep "docs/blog/tags/"
```

- 有输出 → 当前仍在追踪该文件夹下的文件
- 无输出 → 当前已未被追踪

---

## 核心操作：两种场景，按需选择

---

### 场景 A：彻底删除，并且以后不再追踪（推荐）

适合**临时缓存目录、编译输出、日志文件夹**等不再需要的目录。彻底清除历史的同时，防止未来再次误提交。

**第一步：更新 `.gitignore`**

在 `.gitignore` 末尾添加一行（注意末尾的斜杠）：

```
docs/blog/tags/
```

如果项目中没有 `.gitignore`，新建一个。

**第二步：停止追踪当前文件夹**

- 保留本地文件夹：

```bash
git rm -r --cached docs/blog/tags
```

> ⚠️ **注意**：与文件不同，文件夹必须加上 **`-r`**（recursive）参数。

- 同时删除本地文件夹：

```bash
git rm -r docs/blog/tags
```

**第三步：提交本次变更**

```bash
git commit -m "chore: stop tracking docs/blog/tags"
```

**第四步：重写整个历史**

这是核心步骤，会遍历所有提交，从每个提交中移除该文件夹：

```bash
git filter-branch --force --index-filter \
  "git rm -r --cached --ignore-unmatch docs/blog/tags" \
  --prune-empty --tag-name-filter cat -- --all
```

> ⚠️ **注意**：这里的 `git rm -r` 同样加了 `-r` 参数。

执行时会显示进度，类似 `Rewrite 123abc... (1/100)`。出现 `Ref 'refs/heads/...' was rewritten` 即表示成功。

**第五步：删除备份引用**

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
git log --all --full-history --oneline -- docs/blog/tags
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

### 场景 B：删除历史，但以后可能重新使用

适用于你想**抹掉历史痕迹**，但后续可能重新创建该目录并提交（比如目录结构调整后重建）。

**第一步：直接重写历史**

```bash
git filter-branch --force --index-filter \
  "git rm -r --cached --ignore-unmatch docs/blog/tags" \
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
git log --all --full-history --oneline -- docs/blog/tags
```

应无输出。

**第五步：强制推送到远程**

```bash
git push origin --force --all
git push origin --force --tags
```

**第六步：（可选）重新创建并追踪该文件夹**

如果你后续需要重新使用该文件夹：

```bash
mkdir -p docs/blog/tags
git add docs/blog/tags/
git commit -m "重新添加 docs/blog/tags"
git push origin <分支名>
```

---

## 文件 vs 文件夹：操作对比一览

| 操作点 | 针对文件 | 针对文件夹 |
|--------|---------|-----------|
| 停止追踪 | `git rm --cached <文件>` | **`git rm -r --cached <文件夹/`** |
| 历史过滤命令 | `git rm --cached ... <文件>` | **`git rm -r --cached ... <文件夹/`** |
| `.gitignore` 写法 | `docs/public/images/auth.png` | **`docs/blog/tags/`**（末尾加斜杠） |
| 验证命令 | `git log ... -- <文件>` | `git log ... -- <文件夹/`（同上） |

**核心区别只有两处**：
1. `git rm` 加上 `-r` 参数
2. `.gitignore` 中文件夹路径末尾加上 `/`

其余操作完全一致。

---

## 常见问题排查

| 问题现象 | 可能原因 | 解决办法 |
|---------|---------|---------|
| `filter-branch` 执行后只显示一行，无进度 | 路径错误，未匹配到文件夹 | 用 `git ls-files \| grep "docs/blog/tags/"` 确认路径，修正后重试 |
| 删除备份引用时报错“No such file or directory” | `refs/original` 不存在 | 忽略，继续执行后续命令 |
| 强制推送被拒绝（protected branch） | 分支受保护 | 在仓库设置中临时关闭保护，或联系管理员 |
| 本地已删除，但远程网页仍显示 | 远程缓存未刷新 | 等待几分钟，或手动清理远程缓存 |
| `filter-branch` 报错“already exists” | 上次执行未清理 | 命令已包含 `--force`，重试即可 |
| 删除后本地文件夹仍然存在 | 用了 `--cached` 参数 | 这是预期行为，`--cached` 只删除索引不删本地文件；如需删除本地，改用 `git rm -r` |

---

## 注意事项

- **操作前务必备份仓库**（复制整个文件夹），以防万一。
- 操作会**改变所有提交的哈希值**，团队成员必须**重新克隆**，直接 `git pull` 会报错。
- 所有命令中的路径请使用**正斜杠 `/`**，即使在 Windows 下也是如此。
- `git filter-branch` 执行时间取决于仓库大小和历史长度，请耐心等待。
- 如果你需要同时删除多个文件夹，可以重复执行 `filter-branch`，但注意备份引用需要重新删除。

---

## 小结

通过本文的操作，`docs/blog/tags` 文件夹将彻底从 Git 的历史记录中消失。

回顾一下核心要点：
1. Git 追踪的是文件，不是文件夹本身
2. 删除文件夹时，所有相关命令都要加上 **`-r`** 参数
3. `.gitignore` 中文件夹路径末尾要加 **`/`**
4. 其他操作与删除单个文件完全一致

如果你需要删除的是单个文件，请参考本博客的 《[[blog-git-彻底从历史删除文件|彻底删除 Git 历史中的文件]]》 一文，里面有更详细的场景分析和故障排查。
