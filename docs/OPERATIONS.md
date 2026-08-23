# 维护与发布

## 真相源边界

- 本仓库是 Codex Guide 使用手册、新功能说明、场景解决方案、来源核验和更新协议的真相源。
- RHZL 只消费带来源和核验日期的用户可见快照，不反向成为场景内容真相源。
- 独立项目、GitHub 仓库、RHZL 接入、提交、推送、部署和真实用户结果是不同状态，必须分别报告。

## 本地验收

```bash
python3 scripts/validate.py
python3 -m py_compile scripts/validate.py scripts/check_official_updates.py
node --check app.js
python3 -m http.server 4173
```

浏览器至少验证桌面默认视口和 390×844：

1. 搜索“怎么选择 Chat 或 Work”，打开使用手册并看到入口、步骤、成功判断和失败恢复。
2. 切换“最近更新”，打开“本地 Codex 线程可分享只读快照”，核对官方发布日期、适用范围和限制。
3. 搜索“我想修改网站”，打开“修改网站或开发功能”，复制任务描述并核对剪贴板。
4. 输入无法识别的描述，页面要求补充对象和结果，不静默猜入口。
5. manual、update、solution 三类内容均可筛选和打开，关闭详情后可继续浏览，控制台没有相关错误。

## 官方更新与人工审核

运行：

```bash
python3 scripts/check_official_updates.py
```

可能结果：

- `BASELINE_RECORDED`：首次建立官方 RSS 快照。
- `NO_CHANGE`：与上次快照没有条目级差异。
- `UPDATE_CANDIDATE .../content/update-candidate.json`：生成 `pending_review` 候选。
- `SOURCE_FETCH_FAILED`：联网、超时或解析失败；非零退出，不得解释为没有更新。

人工审核候选时必须：

1. 打开候选中每条官方原文，核对产品、平台和发布日期。
2. 把 `removed` 只理解为“当前 RSS 快照不再包含”，不能直接写成功能下线。
3. 核对套餐、地区、工作区、操作系统和灰度范围。
4. 判断是否需要新增更新说明，或改变相关手册、场景的入口、步骤、Prompt、成功标准或恢复方法。
5. 只在 `content/guide.json` 中新增或修改正式内容，并同时维护受影响的 manual、update 与 solution 关联和核验时间；`content/scenarios.json` 仅为旧场景契约兼容快照。
6. 运行完整内容、链接和交互验证后再进入发布流程。

候选文件被 Git 忽略，不能被页面读取，也不能自动发布。

## RHZL 快照同步

RHZL 当前投影位置：

```text
src/lib/tools/codex-scenario-guide.ts
src/app/(standard)/(main)/tools/lab/codex-scenario-guide/
```

当前 V1 同步前先比较场景 `id`、入口、步骤、Prompt、成功标准、恢复方法、官方来源和核验日期；只同步已人工确认的内容。完整 Codex Guide 落地后，同步范围还必须包括手册、更新说明、关联关系和稳定永久链接。同步后运行 RHZL `test:tools`、TypeScript、目标 ESLint及桌面/窄屏交互验证。不得让 RHZL 自动消费 `pending_review` 候选。

## 发布门禁

1. 本地实现和验证完成。
2. 明确授权后提交独立仓库的精确文件。
3. 明确授权后推送 GitHub；匿名读取确认仓库内容可用。
4. RHZL 在隔离分支完成投影和回归。
5. 明确授权后提交、推送或发起 PR。
6. 明确授权后部署，并分别验证 `/tools/lab`、`/tools` 和 `/tools/lab/codex-scenario-guide`。

任何一步失败，只报告当前层状态，不把后续层描述为完成。
