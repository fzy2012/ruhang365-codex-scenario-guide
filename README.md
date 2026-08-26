# Codex Guide（当前公开版本：Codex 场景导航器）

一份持续更新、可核验、适合中文用户阅读的 Codex 使用指南。目标产品以结构化使用手册为内容底座，以经人工核验的新功能说明为持续更新层，并通过问题、场景、功能目录和搜索帮助用户快速找到解决方案。

当前本地版本已经完成 Codex Guide 基础闭环：一个搜索入口同时覆盖使用手册、已人工核验的官方更新和 8 个场景解决方案；每篇内容都展示操作步骤、成功判断、失败恢复、官方来源、核验日期、适用范围和限制。公开名称与已有永久入口仍保持“Codex 场景导航器”。

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

- 种子研究材料：[Serena 的 Codex 从 0 到 1 教程](https://x.com/369serena/status/2090051691819221248?s=46)、[Miles Ma 的《Codex 从入门到精通》](https://x.com/miles_mazy/status/2091339513134010554?s=46)、[Miles Ma 的《Codex 进阶应用教程》](https://x.com/miles_mazy/status/2092507861167567243?s=46)
- 官方更新源：[ChatGPT & Codex Changelog](https://learn.chatgpt.com/docs/changelog)

研究材料只用于识别用户问题和场景，不原样复制。官方更新由脚本检测变化后生成待人工确认候选，不会自动发布。

## 文档入口

- [产品规格](docs/PRODUCT_SPEC.md)：完整 Codex Guide 的产品定义、信息架构、内容模型、版本路线与验收标准。
- [来源研究说明](docs/SOURCE_NOTES.md)：来源、核验日期、使用边界与不能证明什么。
- [维护与发布](docs/OPERATIONS.md)：更新候选人工审核、RHZL 快照同步和分层发布门禁。
- [开源许可](LICENSE)：MIT License。

## 当前状态

- 产品需求：已校正为“使用手册 + 新功能说明 + 快速查找交互”的 Codex Guide
- 当前本地版本：`content/guide.json` 是 manual、update、solution 的统一内容源；`content/scenarios.json` 暂作既有场景契约兼容快照，并由校验脚本检查一致性
- 使用手册：已有十四篇，新增软件安装、材料与会议纪要、演示文稿、网页与桌面操作、资讯监控五类普通人工作场景
- 新功能说明：已把 2026-08-20 官方“本地 Codex 线程只读分享快照”变化人工核验为可浏览内容；RSS 差异脚本仍只生成 `pending_review` 候选
- 搜索与浏览：确定性搜索和类型筛选覆盖全部已发布手册、更新和 8 个场景；未知查询不猜答案
- GitHub 远程仓库：V1 已公开发布，可克隆后按本页步骤本地运行
- RHZL：接入已通过 [PR #66](https://github.com/fzy2012/rhzl/pull/66) 合并至 `main`，合并提交为 `ed4be32`
- 部署与发布：独立仓库、RHZL 入口和生产部署分层管理；独立仓库内容变化不会自动同步 RHZL 或生产，真实状态以各层 Git 与部署证据为准

下一阶段应先用代表性新手任务验证“查功能、看更新、解问题”三条路径，再根据真实无结果查询补内容；不以增加内容数量替代用户验证。
