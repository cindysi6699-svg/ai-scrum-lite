# Helmsman — 项目背景 + Sprint 4 需求简报
> 用途:切到新 session 讨论 **S4 双 agent 端到端闭环**的技术方案。本简报自包含,不依赖上下文。
> 代码仓库:`cindysi6699-svg/ai-scrum-lite`;文档在 repo `docs/`(`PRD.md` / `SCRUM-BACKLOG.md` / `WORKFLOW.md` / `GITHUB-INTEGRATION.md` / `docs/sprints/sprint-N/`)。

## 一、项目是什么
Helmsman = 轻量、AI 原生的 Scrum 协作工具,面向 1–10 人创业软件团队。理念:**agent 干活、人类掌舵**。把 AI agent 当**正式 Scrum 成员**——领 story、开分支、写码、测、提 PR、回填看板;所有产出汇到**人类审批闸门**(没人批准不能 push/合并);Lead 一眼看清"哪个 agent 在做什么、卡在哪"。
- 北极星定位:AI 交付控制平面(对象模型 Story / Agent Run / Evidence / Gate / Release;两层红线)。
- 核心痛点:① 多 agent 不可观测 ② 派发→验收闭环全手工 ③ agent 不能自己合并(质量/越权)。
- 现状:研发测试阶段,未上线;痛点样本=1(创始人本人),外部验证待做。

## 二、已建成(Sprint 1–3,稳固,不返工)
- 技术栈:Next.js(App Router)+ shadcn/ui + base-ui + Prisma + NextAuth(GitHub OAuth)+ PostgreSQL/Neon + Playwright。
- **S1**:核心看板、agent 作为成员、执行流水线看板表达、人审闸门雏形、状态自动回填。
- **S2**:Sprint 导入(粘 JSON)/切换、Story 详情抽屉、多 agent 可观测面板(真实数据)、Sprint 生命周期、看板拖拽。
- **S3 GitHub 红线**:agent 提 PR 自动挂 commit status `helmsman/human-approval=pending`(`agent-sandbox` 分支保护强制 → PR 无法合并);人审点「通过验收」翻 `success` 才可合;**绕过 merge 必败**;**只有人类能翻 success,agent 无自批通道**。已对真 GitHub 验证通过。
- 仓库 main=主干(自动部署 Vercel 生产);`agent-sandbox`=agent PR 测试基线(挂红线 ruleset)。

## 三、角色与工作流
- **人类 Lead**:三闸门——需求确认 / 设计稿确认 / 二次验收+合并(push 红线)。
- **agent-01 = Codex**:开发 + 自测(lint/tsc/build)。
- **agent-02 = Claude**:QA,独立写验收覆盖每条标准,全绿才进人审。
- 闭环:需求确认 → 设计 → dev agent 提 PR(自动挂红线)→ QA agent 验收 → 待验收 → 人审通过(解锁)→ 人合并。
- **纪律**:研发用隔离库(Neon 分支)+ `agent-sandbox`,**绝不碰生产/`.env.local`/main**;改 Prisma schema 后必须重启 dev server。

## 四、Sprint 4 需求:双 agent 端到端闭环(走骨架)
**目标(MVP make-or-break)**:让**一个 task 走完整条交付线、两个真 agent 都自动跑**(非现有 `agent-pr.mjs` 模拟器):
```
派发 → 真 dev agent(Codex)自动领活→开发→自测→开真 PR(挂 S3 红线)
     → 真 QA agent(Claude)自动领待验收→跑验收→判定(全绿→待人审 / 否则打回 dev 返工)
     → 人二次验收(翻 success)→ 人合并集成(agent-sandbox)
```
**走骨架:一个 task、不并发、不规模化。** 关键:**两个 agent 都自动**(不只 dev),人类只在三闸门。

**🚨 红线约束(务必守住)**:**agent 永不自己 merge、永不翻 `success`。** QA agent 判"过"只是把卡移到 Done 列(待人审)+ 保持 GitHub `pending`;**人**二次验收才翻 `success` + 合并。测试阶段合并目标 = `agent-sandbox`,**不是 main/生产**。

五个 story(完整 Cohn+Gherkin 见 `docs/sprints/sprint-4/sprint-spec.json`):
- **US-17 Dev agent 领活 + 隔离 workspace** (P0):worker 认领锁领『指派给 dev agent、todo』任务 → git worktree + 注入上下文 → 转 in_progress。
- **US-18 Dev agent 写真码 + 自测 + 开真 PR** (P0):执行器在 worktree 写码+自跑 lint/tsc/build,**不过不开 PR**;过则开真 PR + 挂红线 pending → 待验收、**指派 agent-02**。
- **US-19 QA agent 自动验收闭环** (P0):QA agent 认领锁领待验收任务 → worktree 拉 PR 分支 → 自动写/跑覆盖 AC 的 e2e + 重跑门 → 全绿=过(到 Done 列待人审,**不翻 success**)/ 否则打回 dev + 证据。
- **US-20 返工闭环 + 异常回路** (P1):打回 → dev agent 带反馈自动返工;返工/失败**有界**(超 N 次 blocked 升级);失败/超时可见回退、不无限。
- **US-21 双 agent 安全守护(延续 S3)** (P0):dev 凭证只 push/PR/挂 pending;qa 凭证只读 PR/跑测试/改看板,**不写 GitHub status、不 merge**;翻 success / merge 仍只人类;两 agent 隔离主工作区/生产。

**明确不在 S4**(后续):多 agent 并发规模化;成本/Token 观测(S5);CI 搬进 GitHub Actions(S6);Managed Agents 迁移。

## 五、留给新 session 拍的技术决策(PM 未定,属架构层)
1. **执行器选型**:dev 执行器 = Codex CLI(延续 agent-01)/ Claude Code headless / 适配层?**qa 执行器 = Claude(agent-02)怎么自主写跑验收 e2e 并判定**?(PM 倾向:适配层抽象,dev 默认 Codex、qa 默认 Claude。)
2. **QA agent 自动判定怎么做**(本 sprint 最难):它如何自主写覆盖 AC 的 e2e、跑、判全绿/打回?**S4 还没 CI-in-Actions(那是 S6),测试在 worktree 本地跑**——可接受吗?
3. **触发机制**:worker 轮询 DB vs webhook/事件驱动?dev 与 qa 两个 worker 如何编排(qa 监听"待验收 + 指派 agent-02")?
4. **隔离 workspace**:git worktree vs 容器?dev 和 qa 各自的 workspace 怎么管?基于 `agent-sandbox`。
5. **返工/失败/重试**:打回→dev 返工的循环边界 N、worktree 保留还是清理、升级人工形态。
6. **凭证隔离(红线命门)**:dev token(Contents/PR/Commit-status-pending)、qa 凭证(只读 PR/跑测试/改看板,**无 GitHub status 写、无 merge**)如何物理隔离;翻 success/merge 的路径只人类能走;两 worker 跑在哪。
7. **执行器有效性兜底**:dev 写的代码、qa 写的验收测试都质量不稳——靠这套双 agent 互检 + 人审红线兜,确认够不够。

## 六、给新 session 的一句话任务
"基于以上背景,把 S4(**双 agent 端到端闭环**:dev 自动开发 + qa 自动验收 + 人审红线 + 人合并,走骨架)的**技术方案/架构**定下来:dev/qa 执行器选型、QA 自动判定方案、触发与隔离机制、返工边界、凭证隔离;**复用已有的 S3 红线(`agent-sandbox` + commit status,只有人类能翻 success/merge)和看板回填**,产出可交给 Codex 实现的设计。"
