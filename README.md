# Codex 场景导航器

一个面向 Codex 新用户的场景式引导工具。用户不需要先学习功能名，只需描述想完成的事情，即可获得推荐入口、操作步骤、可复制任务描述、成功标准和失败恢复。

公开仓库：<https://github.com/fzy2012/ruhang365-codex-scenario-guide>

## 本地运行

```bash
python3 -m http.server 4173
```

然后访问 `http://localhost:4173`。

## 验证

```bash
python3 scripts/validate.py
```

需要联网建立或更新官方变更基线时，单独运行：

```bash
python3 scripts/check_official_updates.py
```

第一次运行只记录基线；后续发现 RSS 条目新增、修改或移除时，才生成被 Git 忽略的 `content/update-candidate.json`。候选始终需要人工核验，不会进入页面或自动发布。

## 内容来源边界

- 种子研究材料：[Serena 的 Codex 从 0 到 1 教程](https://x.com/369serena/status/2090051691819221248?s=46)
- 官方更新源：[ChatGPT & Codex Changelog](https://learn.chatgpt.com/docs/changelog)

研究材料只用于识别用户问题和场景，不原样复制。官方更新由脚本检测变化后生成待人工确认候选，不会自动发布。

## 文档入口

- [产品规格](docs/PRODUCT_SPEC.md)：目标用户、核心路径、V1 验收与非目标。
- [来源研究说明](docs/SOURCE_NOTES.md)：来源、核验日期、使用边界与不能证明什么。
- [维护与发布](docs/OPERATIONS.md)：更新候选人工审核、RHZL 快照同步和分层发布门禁。
- [开源许可](LICENSE)：MIT License。

## 当前状态

- 本地 MVP：已建立
- 更新检测：已提供官方 RSS 差异与场景影响候选脚本，尚未形成发布内容
- GitHub 远程仓库：V1 已公开发布，可克隆后按本页步骤本地运行
- RHZL：接入已通过 [PR #66](https://github.com/fzy2012/rhzl/pull/66) 合并至 `main`，合并提交为 `ed4be32`
- 部署与发布：已于 2026-08-22 从 RHZL `main` 完成生产发布并验证正式入口
