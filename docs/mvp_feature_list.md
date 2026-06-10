# AI Scrum Lite MVP 功能清单

## 1. 产品定位

AI Scrum Lite 是一个 light 级 Scrum 项目管理工具，专门服务 AI 公司、OPC 项目交付、创业项目和多 AI Agent 协作场景。

MVP 目标不是替代 Jira、Linear 或飞书项目，而是先解决一个核心问题：

> 让项目负责人能够用 Scrum 管理 AI/OPC 项目的 Sprint 执行，并让任务、进度、阻塞、提交物、决策和验收都可追踪。

## 2. MVP 核心闭环

```text
创建项目
→ 配置角色
→ 创建 Backlog
→ 创建 Sprint
→ 将 Story/Task 加入 Sprint
→ 角色或 AI Agent 更新进度
→ 记录阻塞和决策
→ 关联 GitHub 提交物
→ Review
→ PO Accepted
→ 生成 Sprint Summary
```

## 3. 用户角色

| 角色 | 类型 | MVP 权限 |
|---|---|---|
| Owner / Product Owner | Human | 创建项目、管理角色、管理 Backlog、创建 Sprint、调整优先级、验收 Accepted、记录最终决策 |
| Scrum Master | Human / AI | 维护 Sprint 节奏、生成日报/复盘、识别阻塞、推动状态更新 |
| Product Agent | AI | 拆需求、补用户故事、补验收标准、提交产品更新 |
| Design Agent | AI | 补页面说明、交互说明、设计检查、提交设计更新 |
| Dev Agent | AI / Human | 领取任务、更新开发进度、提交 GitHub refs、推动任务到 Review |
| QA Agent | AI / Human | 写测试点、提交测试结果、提出 Bug、推动验收建议 |
| Viewer | Human | 只读查看项目、Sprint、任务和 Summary |

## 4. MVP 模块清单

### 4.1 认证与基础账号

必须支持：

- GitHub OAuth 登录。
- 首次登录后创建用户记录。
- 用户可以看到自己参与的项目。

暂不支持：

- 企业 SSO。
- 多组织计费。
- 邀请邮件系统。

### 4.2 项目管理

必须支持：

- 创建项目。
- 编辑项目名称、项目描述、项目目标。
- 记录项目 GitHub Repo URL。
- 查看项目 Dashboard。

核心字段：

- 项目名称。
- 项目描述。
- 项目目标。
- GitHub Repo URL。
- 当前 Sprint。
- 项目状态。

### 4.3 角色与成员管理

必须支持：

- 为项目添加成员或 AI Agent。
- 设置成员类型：`human` 或 `ai`。
- 设置项目角色。
- 控制基本权限。

MVP 权限原则：

- 只有 Owner 可以验收为 `Accepted`。
- Agent 可以提交更新，但不能删除项目、删除 Sprint、修改已验收任务。
- Dev/QA 可以将任务推进到 `Review` 或 `Done`，但不能直接 `Accepted`。

### 4.4 Product Backlog

必须支持：

- 创建 Epic、Story、Task、Bug。
- 设置优先级：`P0`、`P1`、`P2`、`P3`。
- 设置状态。
- 编写用户故事。
- 编写验收标准。
- 关联到 Sprint。

建议状态：

```text
Backlog
Ready
In Sprint
Done
Archived
```

### 4.5 Sprint 管理

必须支持：

- 创建 Sprint。
- 设置 Sprint Goal。
- 设置起止日期。
- 将 Backlog 条目加入 Sprint。
- 查看 Sprint 当前状态。

Sprint 状态：

```text
Planning
Active
Closed
Cancelled
```

### 4.6 Sprint Board

必须支持固定工作流：

```text
Todo
In Progress
Blocked
Review
Done
Accepted
```

说明：

- `Done` 表示执行者认为完成。
- `Accepted` 表示 Owner / PO 已验收。
- `Blocked` 必须说明阻塞原因和下一步需要谁处理。

暂不支持：

- 自定义看板列。
- 多团队 Capacity。
- 复杂燃尽图。

### 4.7 Task Detail

每个任务详情页必须包含：

- 标题。
- 类型。
- 优先级。
- 当前状态。
- 所属 Sprint。
- 负责人。
- 描述。
- 用户故事。
- 验收标准。
- 进度更新历史。
- 阻塞记录。
- 决策记录。
- GitHub refs。
- 关键时间：创建、更新、开始、完成、验收。

### 4.8 Progress Updates

必须支持结构化更新。

标准更新格式：

```json
{
  "actor": "dev_agent",
  "role": "Dev",
  "task_id": "TASK-001",
  "status": "review",
  "progress": "已完成登录页、表单校验和基础错误提示",
  "blockers": [],
  "next_step": "等待 PO 验收",
  "artifacts": ["src/pages/Login.tsx"],
  "github": {
    "branch": "feature/TASK-001-login",
    "commits": ["a13f9c2"],
    "pull_request_url": "https://github.com/org/repo/pull/1"
  },
  "needs_human_decision": false
}
```

必须记录：

- 谁更新。
- 何时更新。
- 更新前状态。
- 更新后状态。
- 进度说明。
- 下一步。
- 是否需要人工决策。

### 4.9 Blockers

必须支持：

- 创建阻塞记录。
- 关联任务。
- 标记阻塞原因。
- 标记需要谁处理。
- 关闭阻塞。

阻塞状态：

```text
Open
Resolved
Ignored
```

### 4.10 Decision Log

必须支持：

- 记录产品、技术、范围、验收相关决策。
- 关联项目或任务。
- 记录决策原因。
- 记录影响范围。
- 标记是否可逆。

为什么 MVP 就要做：

AI/OPC 项目最容易混乱的地方不是任务本身，而是“当时为什么这么定”。Decision Log 是项目事实源的一部分。

### 4.11 GitHub Trace

MVP 只做轻集成。

必须支持手动或 Agent 提交：

- Branch。
- Commit hash。
- Pull Request URL。
- Checks 状态文本。

暂不支持：

- GitHub App。
- Webhook 自动同步。
- 自动读取全部 commits。
- 自动代码 Review。

### 4.12 Summary

必须支持生成或手动维护：

- Daily Scrum Summary。
- Sprint Review Summary。
- Sprint Retro Summary。

Daily Summary 至少包含：

- 昨天/最近完成了什么。
- 今天建议推进什么。
- 当前阻塞。
- 待 Owner 决策事项。
- 待验收任务。

## 5. MVP 页面清单

| 页面 | 用途 | 优先级 |
|---|---|---|
| Login | GitHub 登录 | P0 |
| Project List | 查看参与项目、创建项目 | P0 |
| Project Dashboard | 当前 Sprint、阻塞、待验收、最近更新 | P0 |
| Project Settings | 项目信息、Repo URL、成员角色 | P0 |
| Backlog | 管理 Epic/Story/Task/Bug | P0 |
| Sprint Board | Todo 到 Accepted 的执行看板 | P0 |
| Task Detail | 查看任务详情、提交更新、记录 GitHub refs | P0 |
| Summary | Daily/Sprint Review/Retro 摘要 | P1 |

## 6. MVP 不做清单

第一版明确不做：

- 多组织和复杂租户。
- 付费系统。
- 企业 SSO。
- GitHub webhook。
- MCP Server。
- 自动 Agent 调度。
- 自定义工作流。
- 甘特图。
- 复杂报表。
- 绩效统计。
- 内置聊天系统。

## 7. MVP 成功标准

MVP 完成后，应能支持一个真实项目完成至少一个 Sprint：

- Owner 能创建项目和 Sprint。
- Owner 能创建 Backlog 并加入 Sprint。
- Agent 或成员能提交结构化任务更新。
- 任务状态能从 Todo 推进到 Accepted。
- 阻塞和决策能被追踪。
- GitHub 提交物能关联到任务。
- Sprint 结束时能看到完成项、未完成项、阻塞项和待决策事项。
