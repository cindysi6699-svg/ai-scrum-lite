# Helmsman 产品调研报告(v2 · 修正版)

> 工作名 **Helmsman**(可改)。理念:**agent 干活、人类掌舵**。
> 本版修正了 v1 的关键错误——v1 称"竞争中间地带是空的",经深度调研证实**这是错的**:已有 Vibe Kanban、Conductor、Jira Rovo Dev 等直接竞品。本版给出更准确、更窄、更可防御的定位。
> 数据来源见文末,均为 2026 年公开资料。

---

## 0. 一句话定位

> **专为小型创业团队从零打造的多人协作 Scrum 工作台:AI agent 是一等执行成员(领 story、开分支、写码、测、提 PR、回填看板),人类掌舵是团队级仪式(统一审批闸门,push 前必须人类验收),定价对 AI 高吞吐友好且可预测。**

---

## 1. 市场背景:两条高增长曲线的交汇点

| 信号 | 数据 | 含义 |
|---|---|---|
| 项目管理软件大盘 | 2026 **$11.27B**,CAGR 15.4% | 基本盘大且高速 |
| 敏捷/Scrum 工具细分 | 2025 **$5.9B** → 2032 **$14.7B**,CAGR 13.9% | 你的直接战场 |
| Jira 一家独大 | 2026 占 PM 市场 **40%+** | 既是天花板,也是"太重"留下的机会 |
| AI agent 作为 Scrum 成员 | 行业已在讨论"半个团队是 agent"的运营模型;Jira Rovo 2026.5 已 GA"指派 issue 给 agent" | 方向已被验证,但**小团队的产品形态仍是空白** |

**判断:这不是一个"教育市场"的活——形态和痛点都已被竞品证明真实。问题已从"做不做"变成"能否在巨头补齐小团队体验前,先拿下这群被忽视的人"。**

---

## 2. 市场规模(TAM / SAM / SOM)

> 自上而下,每层标假设,可被替换。

| 层级 | 估算 | 假设 |
|---|---|---|
| **TAM** | **~$6.7B**(2026 敏捷 PM 软件) | 全球用敏捷/Scrum 工具的软件团队 |
| **SAM** | **~$1.0–1.5B** | 收窄到"中小创业研发团队 + 愿用 AI-agent 工作流",先聚焦北美/英语区(北美占 PM 市场 36%) |
| **SOM(1–3 年)** | **~$3–8M ARR** | 新进入者捕获 SAM 的 0.3–0.6%;~2,000–5,000 个付费小团队 × $80–150/团队/月 |

**结论:盘子够养活一家创业公司。赢法是吃"AI-agent 团队工作流"这个新增量,而非抢 Jira 存量。**

---

## 3. 目标用户 & JTBD

**主用户:** 3–15 人早期创业研发团队的 Lead / 技术合伙人 / Tech Lead,**已在用** Cursor/Claude Code/Copilot。人手紧、要交付快、agent 的活散落各处。

**他们"雇"这个产品完成的核心工作:**

| 类型 | Job |
|---|---|
| 功能性 | "用很小的人力跑出更大产出" |
| 功能性 | "让 agent 干可验证的活,我只审最终结果" |
| 功能性 | "看板永远反映真实进度,不靠手工回填" |
| 情感性 | "放心放手,但不失控" |

### 已验证痛点(发现访谈 #1,样本=1,创始人本人)

- 🔑 **多 agent 可观测性是第 1 痛**:"有 10 个 agent 时,你不知道谁做了什么"——痛随 agent 数量放大。
- 🔑 **派发 → 闭环的整段循环都痛**,不是单点。
- 🚧 **硬红线**:push 前必须经人类验收。

> ⚠️ 仍需 3+ 外部 Lead **独立**复述同样的痛,才算真验证。当前为创始人单点信号。

---

## 4. 竞品格局(修正版 —— 本报告的核心更新)

中间地带**不是空的**。真实存在两个威胁集群,中间留下一个更窄、但没人占住的交集。

### 集群 A:单人 agent 编排器(有执行闭环,无团队层)

| 工具 | 能力 | 致命短板 |
|---|---|---|
| **Vibe Kanban**(开源) | 看板派发 agent、隔离 worktree 并行、diff 审查打回、建 PR | 官方原文"**仅供个人使用,无团队功能**";无共享/权限/实时同步;可观测性仅基础历史;**已 sunsetting,母公司 Bloop 2026 初关停** |
| **Conductor**(Melty,$22M A) | Mac 应用,多 agent 并行,中央仪表盘审查/合并 PR | 单机单人,Mac 限定 |
| **Claude Squad / AgentsRoom / Crystal** | 终端/桌面多 agent 状态面板 | 单人,无 Scrum/团队协作 |

**情报价值:** ① 形态已被验证可行;② Vibe Kanban 的死法(单人 + 变现失败)恰好指向"团队版"才有付费理由;③ 它们最弱的三点(团队协作 / 正式审批 / 多 agent 可观测)与你已验证的痛点完全重合。

### 集群 B:传统 PM 工具加 agent(有团队层,人为先、重、贵)

| 工具 | 进展 | 软肋 |
|---|---|---|
| **Jira Rovo Dev**(最大威胁) | 从 Jira issue → 规划 → 生成代码 → 跑检查 → **开 PR**,对照验收标准审 PR;90%+ 企业云客户在用 | **credit 计费($20/dev/月 + 超额 $0.01/credit,"credit trap")——AI 吞吐越高账单越炸**;面向企业、重;agent 是"人为先"产品的嫁接物;绑 Atlassian 生态 |
| **Linear Agent** | beta,自主处理 issue | 早期 |
| **Asana AI Teammates / Monday / Dart** | 预制 agent、Sprint Accelerator | 偏管理助手,非自主编码成员 |

### 三方对位

| 能力 | Vibe Kanban | Jira Rovo Dev | **Helmsman 怎么打** |
|---|---|---|---|
| 看板 + 派给 agent | ✅ 单人 | ✅ 企业 | 团队 + 轻量 |
| agent 写码/提 PR | ✅ | ✅ | 对等,非差异点 |
| 人类审批闸门 | ⚠️ 非正式 | ✅ | **团队级 Scrum 仪式 + 硬门禁** |
| 团队多人协作 | ❌ | ✅ 但重 | ✅ **为小团队从零设计** |
| 多 agent 可观测 | ❌ 弱 | ⚠️ 偏审计 | ✅ **第 1 痛点,做深** |
| 定价对高吞吐友好 | 开源 | ❌ credit 计费 | ✅ **可预测席位制** |
| 目标客户 | 单人开发者 | 企业 | ✅ **小型创业团队(两边都忽视)** |

---

## 5. 差异化:一个交集,不是单个功能

**不是差异化(单拎都会被抄掉):** agent 会写码提 PR、有审批闸门、agent 当成员——这些竞品都有了。

**真正的差异化 = 四根支柱必须同时成立,缺一即塌:**

| 支柱 | 别人为何补不上 |
|---|---|
| **① 团队多人协作** | 单人工具做团队版是产品级转型,违背其简单哲学 |
| **② 多 agent 可观测性**("谁干了啥、卡在哪") | 你的第 1 痛点;单人工具只有基础历史,Jira 偏审计 |
| **③ 审批闸门 = 团队 Scrum 仪式** | 不是单人 diff review,而是团队的验收/打回返工制度化 |
| **④ 可预测席位定价** | Jira 的 credit trap 在高吞吐下反成痛点,你把它变卖点 |

**护城河性质:这是"定位 + 聚焦"护城河,不是技术护城河。** 真正的防御是:
1. **聚焦**——巨头不会为边缘的"小创业团队"优化,单人工具不会做团队,这个结构性缝隙就是时间窗。
2. **速度**——Jira 三个月从助手做到能提 PR,你必须更快把"小团队 Scrum 体验"做到极致。
3. **整体体验**——四件事捆成顺滑一体,抄你就得抄一整套定位。

---

## 6. 定位陈述(收紧版)

> **面向** 用得起、用得动的 3–15 人创业研发团队,
> **Helmsman 是** 一个多人协作的 AI-原生 Scrum 工作台,
> **它能** 让团队把 user story 派给一群 agent 自主执行,所有产出汇入团队级人类审批闸门,且全团队随时看清每个 agent 在做什么,
> **不同于** Vibe Kanban(单人、无团队层)和 Jira Rovo(重、企业向、credit 计费),
> **我们让** 小团队用很小的人力、可预测的成本,掌舵一群 agent——看得清、管得住。

---

## 7. 关键风险 & 待验证假设

| 风险/假设 | 为什么危险 | 怎么验证 |
|---|---|---|
| **时间窗**(最大风险) | Jira Rovo 三个月就补齐编码能力,随时可能下沉到小团队 | 抢速度;盯 Atlassian/Linear 路线图 |
| **人类审批会成新瓶颈** | AI 高吞吐 → 验收淹没人,只是把写码瓶颈换成审码瓶颈 | 访谈问 Lead 每天能审多少;产品里做批量验收/质量前置 |
| **多 agent 可观测痛是否普遍** | 目前样本=1(创始人) | 3+ 外部 Lead 独立复述 |
| **付费意愿与定价** | 小团队预算敏感,已在为 Cursor/Copilot 付费 | 测席位制 vs 用量制接受度 |
| **巨头顺手就做** | 功能无技术壁垒 | 靠聚焦 + 速度 + 整体体验,不在单功能硬刚 |

---

## 8. 下一步

1. **8–12 场外部发现访谈**(精简 5 问版已就绪),验证"多 agent 可观测"是否真痛。
2. **竞品实测**:亲手跑 Vibe Kanban / Conductor / Jira Rovo Dev,记录"团队场景"下的断裂体验 → 你的 demo 脚本。
3. **landing page 烟雾测试**:用第 6 节定位陈述测转化。
4. **Sprint 1 已启动**(见 SCRUM-BACKLOG.md),先跑通单 agent 闭环 walking skeleton。

---

## Sources

- [Mordor — Project Management Software Systems Market](https://www.mordorintelligence.com/industry-reports/project-management-software-systems-market)
- [Coherent — Agile Project Management Software Market](https://www.coherentmarketinsights.com/market-insight/agile-project-management-software-market-5854)
- [6Wresearch — Jira Market Share 2026](https://www.6wresearch.com/market-takeaways-view/jira-market-share)
- [Vibe Kanban (官网)](https://vibekanban.com/) · [GitHub BloopAI/vibe-kanban](https://github.com/BloopAI/vibe-kanban) · [MindStudio 对比(单人定位)](https://www.mindstudio.ai/blog/vibe-kanban-vs-paperclip-vs-claude-code-dispatch)
- [Conductor / 多 agent 编排生态](https://nimbalyst.com/blog/best-multi-agent-coding-tools-2026/) · [O'Reilly — Conductors to Orchestrators](https://www.oreilly.com/radar/conductors-to-orchestrators-the-future-of-agentic-coding/)
- [Atlassian Rovo Agents 文档](https://support.atlassian.com/rovo/docs/agents/) · [Rovo Dev 产品页](https://www.atlassian.com/software/rovo-dev) · [Rovo Dev 定价](https://www.atlassian.com/software/rovo-dev/pricing)
- [SiliconANGLE — Atlassian Team '26 Rovo agentic execution](https://siliconangle.com/2026/05/06/atlassian-opens-teamwork-graph-pushes-rovo-agentic-execution-team-26/)
- [Scrum.org — AI-Augmented Scrum Framework](https://www.scrum.org/resources/blog/ai-augmented-scrum-framework-when-half-your-team-autonomous-agents)
- [AgentsRoom — 多 agent 仪表盘](https://agentsroom.dev/multi-agent-dashboard)
