# 来源研究说明

核验日期：2026-08-23

## Serena 教程

- 来源：<https://x.com/369serena/status/2090051691819221248?s=46>
- 用途：只作为新手常见问题、入口困惑和教程结构的种子研究材料。
- 边界：本仓库没有复制长文正文、截图或大段表达；所有场景、步骤、任务描述、成功判断与恢复方法均按本产品目标原创重构。
- 当前限制：X 页面在无登录抓取环境中没有返回可复核正文，因此本轮没有根据不可见内容补写事实。

## OpenAI 官方资料

- 产品总览：<https://learn.chatgpt.com/>
  - 用于区分 Chat、ChatGPT Work 与 Codex 的主要任务类型。
- Use ChatGPT：<https://learn.chatgpt.com/docs/use-chatgpt>
  - 用于核验 Chat、ChatGPT Work 与 Codex 的任务分工。
- Prompting：<https://learn.chatgpt.com/docs/prompting>
  - 用于核验“结果、背景、输出、边界”的任务描述方法。
- Projects and chats：<https://learn.chatgpt.com/docs/projects>
  - 用于核验 Quick chat、Project、本地项目、共享资料和文件夹访问边界。
- Permissions：<https://learn.chatgpt.com/docs/permission-modes>
  - 用于核验桌面端权限模式、工作区边界和 Ask for approval 默认建议。
- Scheduled tasks：<https://learn.chatgpt.com/docs/automations>
  - 用于核验定时任务入口；产品仍要求先手动跑通流程。
- Troubleshooting：<https://learn.chatgpt.com/docs/reference/troubleshooting>
  - 用于失败诊断场景的官方入口。
- ChatGPT & Codex Changelog：<https://learn.chatgpt.com/docs/changelog>
  - 页面是内容证据入口；脚本读取页面声明的官方 RSS，以获得稳定的条目级差异。

## 已人工核验的更新说明

- 官方发布日期：2026-08-20
- 内容：ChatGPT macOS 桌面应用可以分享本地 Codex 线程的不可变只读快照；个人链接和工作区链接的访问范围不同。
- 本项目处理：原创改写为 `update-shared-thread-snapshots`，并明确提醒已知密钥模式遮盖不代表敏感内容一定清除。
- 当前不能证明：Windows、Web、CLI 或所有组织策略下存在相同入口；功能已对所有地区同时开放。

## 不能据此证明

- 某项功能已对所有套餐、地区、操作系统或工作区开放；
- Serena 教程中的界面名称与当前产品完全一致；
- RSS 条目变化一定要求修改某个场景；
- 本地实现、验证通过或更新候选等同于发布或真实用户验收。
