# Helmsman — 产品需求说明书(PRD)

> 工作名 **Helmsman**。理念:**agent 干活、人类掌舵**。
> 状态:研发测试阶段(未上线)。本文档随 Sprint 滚动更新;当前覆盖 **Sprint 1–3 已交付** + 后续规划。
> 事实来源:`SCRUM-BACKLOG.md`(backlog)、`docs/sprints/*`(逐 Sprint 验收记录)、`PRODUCT-RESEARCH.md`(竞品)、`GITHUB-INTEGRATION.md`(红线机制)。
> 最近更新:2026-06-13(Sprint 3 收尾)。

---

## 1. 执行摘要

Helmsman 是一款**轻量、AI 原生的 Scrum 协作工具**,面向小型创业软件团队。它把 **AI agent 当作正式的 Scrum 成员**——agent 领取 user story、开分支、写码、跑测、提 PR、自动回填看板;而**所有产出都汇聚到一个人类审批闸门**:没有人类点头,代码不能 push/合并。同时,Lead 能在一个面板里一眼看清**"哪个 agent 在做什么、卡在哪"**。

一句话:**让 Lead 把活派给一群 AI agent 并行干,自己只负责掌舵(定方向)和验收(把质量关),且这道关是服务端 + GitHub 双重强制的真红线,不是 UI 假动作。**

---

## 2. 问题陈述

### 谁的问题
小型创业软件团队的 **Lead / 创始工程师**——开始用多个 AI 编码 agent(Claude、Codex 等)并行干活,但缺一个把它们当"团队成员"来协作、观测、管控的地方。

### 什么问题
1. **多 agent 不可观测**:"当你有 10 个 agent,你根本不知道谁做了什么、谁卡住了"——没有"谁在做什么"的统一视图。(创始人访谈 #1 的首要痛点)
2. **派发→验收的闭环到处是手工活**:派任务、追状态、回填看板、收 PR,全靠人肉串。
3. **质量失控风险**:AI 吞吐高但缺陷率也高,若 agent 能自己合并/推送,人类就失去了对方向和质量的最终控制。

### 为什么痛
- agent 越多,"黑盒"越严重,Lead 反而更累、更不敢放手。
- 现有工具要么是**单人 agent 编排器**(没有团队层),要么是**重型 PM 工具加 agent**(贵、复杂、按额度计费惩罚高吞吐)。中间这块"小团队多人 × 多 agent 可观测 × 团队级审批仪式"没人做好。

### 证据 / 现状
- 用户发现访谈 #1(创始人本人,样本=1):核心痛点 = **规模化可观测**;硬红线 = **push 前必须人类批准**。⚠️ 仍需外部 3+ Lead 独立验证(见 §10)。
- 竞品深挖(`PRODUCT-RESEARCH.md`):Vibe Kanban / Conductor / Claude Squad = 单人、无团队层;Jira Rovo / Linear Agent = 重型、额度计费。

---

## 3. 目标用户与角色

### 主要用户:创业团队 Lead(人类)
- 角色:小团队(1–10 人)的 lead / 创始工程师,同时指挥多个 AI agent。
- 目标:把 story 派出去、并行高吞吐产出、自己只在关键闸门把关。
- 痛点:多 agent 黑盒、手工回填、怕失去质量与方向控制。
- 三个闸门(人类只做这三件):**需求确认 · 设计稿确认 · 二次验收 + push**。

### 一等成员:AI Agent(产品内的正式成员)
Helmsman 的差异化:**agent 不是工具,是看板上的成员**,有身份、被指派、留痕。当前 dogfood 角色:
- **agent-01(Codex)= 开发**:领取 → 分支 → 写码 → 自测(lint/tsc/build/单测)→ 提 PR。
- **agent-02(Claude)= QA**:独立写 e2e 覆盖每条验收标准,全绿才进人类二次验收。

---

## 4. 战略背景与差异化

### 为什么是现在
AI 编码 agent 已能独立完成 story 级工作(本产品自身 Sprint 1–3 即由 agent 写成),但"把多个 agent 当团队来协作+管控"的层缺位。时间窗口紧(Jira Rovo 3 个月内从助手做到 PR 级编码)。

### 竞争格局(详见 PRODUCT-RESEARCH.md)
- **单人 agent 编排器**(Vibe Kanban、Conductor、Claude Squad):有 agent 执行+review 环,但**无团队层**。
- **重型 PM + agent**(Jira Rovo、Linear Agent、Asana):有团队层,但重、贵、按额度计费惩罚高吞吐。

### Helmsman 的差异化 = 没人占住的"组合"
**小团队多人 Scrum × 多 agent 可观测("谁干了什么")× 团队级审批仪式(push 前人审红线)× 可预测的按席位定价。**

---

## 5. 解决方案概览

Helmsman = 一块把人类和 AI agent 放在同一张看板上的 Scrum 协作台:

1. **核心看板**:Project / Backlog / Sprint / Story / 看板列(To Do → Agent 执行中 → 待验收 → Done)。
2. **Agent 即成员**:注册 agent、把 story 指派给 agent、agent 活动自动回填看板。
3. **多 Agent 可观测面板**:机群视图(每个 agent 状态/当前 story/领取·提PR·打回 计数)+ 单 agent 活动流。
4. **两道验收闸门**:① QA agent 的 e2e 门(全绿=过,否则带证据打回)② 人类二次验收 + push。
5. **GitHub 红线**:agent 提 PR → 自动挂 `helmsman/human-approval` 合并锁(分支保护强制)→ 人类点「通过验收」才解锁 → 人类合并。**绕过合并 API 必失败。**

工作流闭环(细节见 `WORKFLOW.md`):
```
需求确认🧑 → 拆解/设计 → Codex(agent-01)写码+自测+提PR → QA(agent-02)e2e验收
   → 待验收(PR 自动挂锁) → 人类点通过验收🧑(解锁) → 人类 merge🧑(push 红线) → 部署
```

技术栈:Next.js(App Router)+ shadcn/ui + base-ui + Tailwind + Prisma + NextAuth(GitHub OAuth,DB session)+ PostgreSQL/Neon + Playwright(e2e)。

---

## 6. 已交付功能(Sprint 1–3)

### 🟢 Sprint 1 — Walking Skeleton(单 agent 完整闭环)
目标:跑通"派发一个 story → agent 干活提 PR → 人类验收/打回 → 看板自动更新"。

| Story | Epic | 交付 |
|---|---|---|
| US-1 | E1 | 核心看板:Project / Backlog / Story / 看板列基础 |
| US-2 | E2 | Agent 作为一等成员:注册 agent、把 story 指派给 agent |
| US-3 | E3 | Agent 执行流水线(领取→分支→写码→跑测→提 PR)的看板表达 |
| US-4 | E5 | **人类验收闸门(红线雏形)**:通过 / 打回 + 反馈 |
| US-5 | E4 | 状态自动回填:agent 活动 → 看板列 |

配套:**e2e 验收测试框架**(`scripts/seed-e2e.mjs` + Playwright,session 旁路登录);修复运行时红线崩溃(approve/submit-PR 的 `formData.get()` null → ZodError),由 QA e2e 抓到。

### 🟢 Sprint 2 — 掌舵看得清(闭环加固 + 可观测首切片)
| Story | Epic | 交付 |
|---|---|---|
| US-8 | E1 | **Sprint 菜单**:切换历史 Sprint + 一键导入(粘贴固定格式 Sprint Spec JSON → 落库) |
| US-9 | E1 | **Story 详情只读抽屉**:标题/用户故事/验收标准/状态历史/关联 PR/审批记录;Esc/遮罩/X 关闭、保留视图 |
| US-10 | E6 | **多 Agent 可观测面板**:机群表格(状态/当前 Story/领取·提PR·打回 计数)+ 点 agent 看其活动流,**真实数据聚合** |
| US-11 | E1 | **Sprint 生命周期页**:列出所有 Sprint + 状态,激活/关闭/归档,**保证唯一 active** |
| US-12 | E1 | **看板拖拽流转**:合法流转落库,非法流转(如跳过待验收直达 Done)拦截 + 提示 |

配套:`DESIGN-SPEC.md`「弹层规范」(z 层级 / max-h / 内部滚动 / 防误关丢输入);US-8 弹窗溢出 S 级 bug 由人类二次验收抓到 → 沉淀「布局/弹层三道防线」。

### 🟢 Sprint 3 — 红线走骨架(人审前不许合并,服务端强制)
目标:把"人类批准前不许 push/合并"做成**真红线**——GitHub 分支保护 + commit status 强制。

| Story | Epic | 交付 |
|---|---|---|
| US-13 | E5 | 任务进「待验收」→ 自动在 PR head 挂 `helmsman/human-approval=pending`,分支保护使其**无法合并** |
| US-14 | E5 | 人类点「通过验收」→ status=success → **PR 解锁**;任务 in-place 转 done + 留痕 + 审批记录 |
| US-15 | E5 | 人类「打回」→ status=failure → **合并锁不松**,任务回 in_progress + 反馈 |
| US-16 | E5 | **绕过必败**:未批直接调 merge API → GitHub 拒(HTTP 405);**只有人类成员能翻 success**,agent 执行路径无自批通道;分支保护含管理员 |

配套:`GITHUB-INTEGRATION.md`(机制+安全模型);看板卡片/抽屉的**合并锁三态徽标**(待批/已解锁/已打回,接真实数据);**清除写死的假数据**(原"测试运行中 14/22"等 mock,改为真实数据/诚实空状态);`agent-pr.mjs`(模拟 agent 提 PR 来验红线)。验收方式:对**真 GitHub** 跑红线状态机,全部通过。

> 实现/安全要点:用 **Commit Statuses API**(细粒度 PAT 可写)而非 Check Runs(需 GitHub App);context = `helmsman/human-approval`;翻 success 仅经人类校验(`requireHumanProjectMember`),worker 只能挂 pending。

---

## 6.5 路线图(riskiest-first 重排版 · 2026-06-14)

> 北极星愿景 = "AI 交付控制平面"(对象模型 Story / Agent Run / Evidence / Gate / Release;两层红线)。
> **MVP 目标不变**;S1–S3 已完成、稳固,**不返工**。下面只重排前进顺序:**真 agent 先打 → 差异化(Evidence/成本)提前 → 外部验证并行 → 发布治理延后。**

| 阶段 | 目标 | 关键交付 | 备注 |
|---|---|---|---|
| ✅ **S1–S3 已完成** | 看板 + agent 成员 + 可观测 v1 + **人审红线(服务端+GitHub 强制)** | 见 §6 | 地基扎实,继续往上盖,不重来 |
| **S4 真 agent 自动执行**(make-or-break) | 证明真 agent 能端到端闭环 | 真 agent 领活 → 隔离 workspace/branch → 写真实代码 → 开真 PR → 回填;接上已建的红线挂锁 | MVP 核心,最高风险先打 |
| **S5 Evidence + 成本/Token 可观测**(最强差异化) | 把"谁干了什么、花多少、可不可信"做实 | Agent Run 对象(模型/prompt/branch/log/token/成本/结果)、Evidence registry、机群面板加 token/成本/成功率 | 直击第 1 痛点;**MVP 在此闭合** |
| 🔬 **外部验证 probe(贯穿 S4–S5,不等 v1)** | 解 sample=1 | 3+ 外部 Lead 看 demo/访谈:痛点真伪 + 验收会否成瓶颈 + 付费意愿 | **验证 gate 建造,不拖在后面** |
| **S6 CI 证据门 + QA 升级** | 质量门做全 | GitHub Actions 作 required checks(CI 绿 + QA pass + 人审 三门齐)、CI 失败 agent 自动修复回路、visual/AC 证据 | 补 §9 那个"只强制了人审"的缺口 |
| ⏸ **发布治理 / 红线 2(延后,优先集成外部)** | 生产发布风险控制 | release readiness、feature flag、灰度、监控、回滚 | **保留为原则**,近期不自建;优先集成 LaunchDarkly/Vercel 等;**不进 MVP** |
| **v1 团队化与商业化**(需外部验证通过) | 上规模 + 收费 | 多仓库 GitHub App、RBAC、usage/cost、按席位定价 | 由验证 gate 放行 |

**两层红线**(保留为产品原则):红线 1 = 未经人审不许 merge 到 main(**已强制**);红线 2 = 未经 release approval 不许生产 rollout(**原则保留,实现延后**)。

## 7. 成功指标(待上线后校准)

> 当前未上线,以下为**目标指标框架**,数值待真实使用校准。

- **主指标 — 闭环吞吐**:单位时间内"派发 → agent 产出 → 人类验收通过 → 合并"的 story 数。
- **可观测有效性**:Lead 能在 ≤1 屏内看清所有 agent 在做什么(定性:第 1 痛点是否缓解)。
- **红线可靠性**:**0** 例未经人类批准的合并/ push(硬性,必须 100%)。
- **验收负担(护栏指标)**:人类审批不应成为新瓶颈——验收点击次数 ≈ PR 数(按 PR 批,非按 task);需监控等待验收的积压。
- **agent 缺陷拦截率**:QA e2e 门在到达人类前拦下的缺陷比例。

---

## 8. 不在范围内 / 尚未交付

- **真 agent 端到端自动执行**:当前 Sprint 1–3 的代码仍由 Codex 像传统方式写在分支上;`agent-pr.mjs` 只是**验红线的模拟器**。让真 agent 自动领活→写真实代码→开 PR(轻量自管编排 → Anthropic Managed Agents)= **Sprint 4+**。
- **GitHub App / 多仓库 / webhook**:当前是单仓库 + 细粒度 PAT + Commit Statuses 的 MVP;产品化升级为 GitHub App + Check Runs + webhook 自动挂锁。
- **发布治理 / 红线 2(release readiness、feature flag、灰度、监控、回滚)**:**保留为产品原则,但近期不自建**——那是 LaunchDarkly/Vercel/Argo 的成熟红海,自建会稀释"多 agent 可观测 × 审批仪式"的楔子。需要时**优先集成外部 flag 平台**,不进 MVP。
- **多人协作 / 权限 / 计费**:R4(v1 GTM)再做。
- **结构化反馈返工增强(E7)**、燃尽图等仪表盘深化:后续。
- **移动端**:暂桌面优先。

---

## 9. 依赖与风险

### 依赖
- GitHub:细粒度 PAT(Contents/PR/Commit statuses)+ 目标分支的分支保护(required check `helmsman/human-approval` + include administrators)。生产需在 Vercel 配 `GITHUB_TOKEN`,生产库需跑 migration。
- 数据库:PostgreSQL/Neon(支持分支隔离做研发测试)。

### 风险与缓解
| 风险 | 缓解 |
|---|---|
| **时间窗口**:Rovo 等快速逼近 | 聚焦无人占住的"组合"差异化,先把红线+可观测做扎实 |
| **人类验收变新瓶颈** | 按 PR 批量验收;QA e2e 自动门前置拦缺陷;监控积压 |
| **红线被绕过 = 产品破功** | 分支保护(GitHub 强制)+ 服务端人类校验 + worker 无 success 路径;已用真 GitHub 验证绕过必败 |
| **研发环境陷阱** | 改 Prisma schema 后必须重启 dev server(旧 client 致诡异不一致),已入 `WORKFLOW.md` |
| **AI 高缺陷率** | 每 story 配守护任务(测试/边界/门禁);两道验收门 |

---

## 10. 开放问题(开发/上线前需验证)

- [ ] 外部 **3+ Lead** 独立确认「多 agent 可观测」是真痛(目前样本=1,创始人本人)。
- [ ] 验证「人类验收会不会变成新瓶颈」(真实多 agent 并发下)。
- [ ] 验证付费意愿与**按席位定价**模型。
- [ ] 真 agent 运行时选型:轻量自管编排 vs Managed Agents 的成本/可观测权衡(Sprint 4 讨论)。

---

## 附:Epic 索引

| Epic | 名称 | 状态 |
|---|---|---|
| E1 | 核心 Scrum 看板 | 🟢 S1–S2 交付 |
| E2 | Agent 作为一等成员 | 🟢 S1 交付 |
| E3 | Agent 执行流水线 | 🟡 看板表达已交付;**真自动执行待 S4** |
| E4 | 状态自动回填 | 🟢 S1–S2 交付 |
| E5 | 人类审批闸门(红线) | 🟢 S1 雏形 → S3 服务端强制 |
| E6 | 多 Agent 可观测面板 | 🟢 S2 首切片交付 |
| E7 | 反馈返工闭环增强 | ⚪ 未做(S3+) |
