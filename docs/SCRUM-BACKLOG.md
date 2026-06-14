# Helmsman — Scrum 项目管理工件

> 工作名 **Helmsman**(可改名)。理念:**agent 干活、人类掌舵**。
> 本文件就是 Product Backlog 的事实来源,每个 Sprint 更新一次。

---

## 1. Product Goal(产品目标)

> 让一个小团队的 Lead 能把 user story 派发给多个 AI agent,agent 自动开分支/写码/测/提 PR 并回填看板;**所有产出必须经人类验收才能 push**,且 Lead 始终能一眼看清"哪个 agent 在做什么、卡在哪"。

> **北极星愿景**:完整产品定位见 `PRD.md`(AI 交付控制平面;对象模型 Story / Agent Run / Evidence / Gate / Release;两层红线)。本 backlog = 落地优先级 + story 事实来源。
>
> **进展(2026-06)**:✅ **S1–S3 已交付**——看板、agent 成员、可观测 v1、**人审红线(服务端 + GitHub 分支保护强制)**。下一步 **S4 = 真 agent 自动执行**(make-or-break)。MVP 目标不变,已交付不返工。

---

## 2. Product Backlog —— Epic 分解与优先级

优先级依据 = 用户访谈已验证的两大痛点:**① 多 agent 可观测性 ② 派发→验收闭环**。

| # | Epic | 价值 | 优先级 | 状态 |
|---|------|------|--------|------|
| **E1** | 核心 Scrum 看板(backlog / sprint / story / 看板列) | 协作底座 | Must | ✅ S1–S2 交付 |
| **E2** | Agent 作为一等成员(注册 agent、指派 story) | 核心差异化 | Must | ✅ S1 交付 |
| **E3** | Agent 执行流水线(领取→分支→写码→跑测→提 PR) | 核心差异化 | Must | 🟡 看板表达已交付;**真自动执行 = S4** |
| **E4** | 状态自动回填(agent 活动 → 看板列) | 消灭手工回填 | Must | ✅ S1–S2 交付 |
| **E5** | 人类审批闸门 / **红线 1**(验收、通过/打回、返工) | 质量掌舵权 | Must | ✅ S1 雏形 → **S3 服务端+GitHub 强制** |
| **E6** | 多 agent 可观测面板("谁在做什么、卡在哪") | **第 1 痛点** | Should | ✅ S2 首切片交付 |
| **E7** | 反馈返工闭环增强(打回原因结构化、带反馈重做) | 提效 | Could | ⚪ 未做 |
| **E8** | **Agent Run & 成本/Token 可观测**(模型/prompt/log/token/成本/成功率) | **最强差异化** | Must | ⚪ S5 |
| **E9** | **Evidence registry**(diff/CI log/测试/AI review/人审 沉淀为可追溯证据) | 可信交付 | Should | ⚪ S5 |
| **E10** | **CI 证据门 + 自动修复回路**(Actions 作 required checks、CI 失败 agent 修) | 质量门做全 | Should | ⚪ S6 |
| **E11** | **发布治理 / 红线 2**(release readiness、flag、灰度、监控、回滚) | 生产风险控制 | **延后·优先集成外部** | ⚪ post-MVP |
| **E12** | Backlog 导入与自助维护(产品 backlog 导入、Sprint 导入去重) | 自助便利 / table-stakes | Could | ⚪ 低优先,先用现状 |

---

## 3. Sprint 1 — User Stories(Cohn + Gherkin) · ✅ 已交付(存档)

**Sprint 1 Goal:** 单 agent 跑通 派发→PR→人类验收→状态更新 的闭环。

### US-1（E1)看板与 Story 基础
> **As a** 团队 Lead,**I want to** 在看板上创建 user story 并在列间流转,**so that** 我有一个承载人和 agent 工作的底座。

```gherkin
Scenario: 创建并移动 story
  Given 我在一个 sprint 看板上
  When 我新建一个 user story 并把它从「To Do」拖到「In Progress」
  Then 该 story 显示在「In Progress」列,且记录了状态变更时间
```

### US-2（E2)把 Story 指派给 Agent
> **As a** Lead,**I want to** 把一个 story 指派给某个 AI agent(像指派给人一样),**so that** agent 能领走这件可验证的活。

```gherkin
Scenario: 指派 story 给 agent
  Given 一个 agent 已注册并在线
  And 一个 story 处于「To Do」
  When 我把该 story 的负责人设为该 agent
  Then story 进入「Agent 执行中」状态
  And 系统记录指派人、agent、时间
```

### US-3（E3)Agent 自动执行并提 PR
> **As a** Lead,**I want to** agent 领取后自动开分支、写码、跑测试并提 PR,**so that** 我不用手把手带它干每一步。

```gherkin
Scenario: agent 执行任务到提 PR
  Given 一个 story 已指派给 agent
  When agent 领取该任务
  Then 系统为它创建一个以 story 命名的分支
  And agent 提交代码并运行测试
  And 测试通过后自动开启一个关联该 story 的 PR
  And story 自动流转到「待验收」列
```

### US-4（E5)人类验收闸门(红线)
> **As a** Lead,**I want to** 在 PR 合并/push 前对 agent 产出做验收,**so that** 我保留对质量的最终控制权。

```gherkin
Scenario: 验收通过
  Given 一个 story 处于「待验收」且有关联 PR
  When 我点「通过验收」
  Then 该 PR 才被允许合并/push
  And story 流转到「Done」

Scenario: 验收打回
  Given 一个 story 处于「待验收」
  When 我点「打回」并填写反馈
  Then PR 被阻止合并
  And story 退回「Agent 执行中」并附带我的反馈
```

> 🚧 强约束:**未经人类「通过验收」,任何 agent 产出都不得 push。** 这是产品红线,在 US-4 里以硬门禁实现。

### US-5（E4 最小版)状态自动回填
> **As a** Lead,**I want to** 看板状态随 agent 的真实进度自动更新,**so that** 看板永远反映现实、我不用手动维护。

```gherkin
Scenario: agent 进度驱动看板
  Given 一个 story 已指派给 agent
  When agent 开始执行 / 提交 PR / 被打回
  Then 对应 story 自动在「执行中 / 待验收 / 返工中」之间流转,无需人工拖动
```

---

## 3b. Sprint 1 任务拆解(Story → 开发任务)

> Sprint = **1 周**。研发是 AI:**吞吐高、缺陷率也高** → 每个 story 都配 🛡 守护任务(测试/边界/日志/门禁),否则验收闸门会被劣质产出淹没。
> 任务粒度 = 「一个 agent、一个 PR」可独立完成、可独立验收。
> 标签:`[BE]`后端 `[FE]`前端 `[INFRA]`集成 `[TEST]`测试 `🛡`守护。

### US-1 看板与 Story 基础
- [ ] `[BE]` Story / Sprint / 看板列 的数据模型 + CRUD API
- [ ] `[BE]` 状态变更记录(谁、何时、从哪列到哪列)
- [ ] `[FE]` 看板视图:列 + 卡片 + 拖拽流转
- [ ] `[TEST]` 🛡 状态机单元测试:非法流转(如跳过验收直达 Done)必须被拒
- **DoD:** 创建/拖动 story 生效且留痕;非法流转有测试覆盖。

### US-2 把 Story 指派给 Agent
- [ ] `[BE]` Agent 注册与在线状态(心跳/last-seen)
- [ ] `[BE]` story 负责人可设为 agent;写入指派人/agent/时间
- [ ] `[FE]` 指派 UI:人 / agent 统一的负责人选择器
- [ ] `[BE]` 🛡 防呆:只能指派给「在线」agent;离线指派给出明确报错
- [ ] `[TEST]` 🛡 并发指派/重复指派的幂等性测试
- **DoD:** 能像指派人一样把 story 指派给在线 agent,边界有保护。

### US-3 Agent 自动执行并提 PR
- [ ] `[INFRA]` Agent 领取任务的接口/事件(认领锁,防多 agent 抢同一 story)
- [ ] `[INFRA]` 按 story 自动建分支(命名规范 + 冲突处理)
- [ ] `[INFRA]` agent 提交代码 → 触发测试 → 通过后开 PR(关联 story)
- [ ] `[BE]` PR 与 story 双向关联,story 自动进「待验收」
- [ ] `[TEST]` 🛡 **测试不过 = 不开 PR、不进待验收**(强制质量前置)
- [ ] `[BE]` 🛡 单 story 执行超时 / agent 卡死的兜底(自动回「To Do」并告警)
- [ ] `[BE]` 🛡 完整执行日志(每步留痕,供事后排查 AI 出的问题)
- **DoD:** 指派后 agent 全自动跑到 PR;测试不过则拦在门外;异常可追溯。

### US-4 人类验收闸门(🚧 红线)
- [ ] `[BE]` **push/merge 硬门禁:未「通过验收」一律阻止**(产品红线)
- [ ] `[FE]` 验收队列:待验收 story + 关联 PR diff 一屏可看
- [ ] `[FE]` 「通过」/「打回 + 反馈」操作
- [ ] `[BE]` 打回:PR 阻止合并,story 退回「Agent 执行中」并挂上反馈
- [ ] `[BE]` 🛡 审计:每次通过/打回记录验收人、时间、反馈(责任可追)
- [ ] `[TEST]` 🛡 绕过门禁的尝试必须失败(直接调 merge API 也挡得住)
- **DoD:** 没有人点「通过」,任何 agent 产出都 push 不出去——代码级、非仅 UI 级。

### US-5 状态自动回填
- [ ] `[BE]` 监听 agent 事件(开始/提 PR/被打回)→ 驱动 story 流转
- [ ] `[FE]` 看板状态实时刷新,无需手动拖动
- [ ] `[BE]` 🛡 事件与真实 git/PR 状态对账,冲突时以真实状态为准 + 告警
- [ ] `[TEST]` 🛡 乱序/重复事件下状态不被写花
- **DoD:** 看板状态随真实进度自动走,且与 git 真相不脱节。

---

## 4. Roadmap(riskiest-first 重排版 · 2026-06-14,详见 PRD §6.5)

> 重排原则:**真 agent 先打 → 差异化(Evidence/成本)提前 → 外部验证并行 → 发布治理延后。** MVP 目标不变,S1–S3 不返工。

| 阶段 | 范围 | 状态 / 目标 |
|------|------|----------|
| **S1 Walking Skeleton** | US-1..5 单 agent 闭环 | ✅ 已交付 |
| **S2 掌舵看得清** | US-8..12(导入/详情抽屉/多agent可观测/生命周期/拖拽) | ✅ 已交付 |
| **S3 红线走骨架** | US-13..16 人审红线服务端+GitHub 强制 | ✅ 已交付 |
| **S4 双 agent 端到端闭环** | E3:dev(Codex)自动开发提 PR + qa(Claude)自动验收判定 + 人审红线 + 人合并(走骨架·一个 task) | ⬅ **下一步,make-or-break** |
| **S5 Evidence + 成本/Token 观测** | E8 + E9;**MVP 在此闭合** | 最强差异化 |
| 🔬 **外部验证 probe(贯穿 S4–S5)** | 3+ 外部 Lead 看 demo/访谈 | 验证 gate 建造,不等 v1 |
| **S6 CI 证据门 + QA 升级** | E10;CI 绿 + QA pass + 人审 三门齐 | 补"只强制人审"的缺口 |
| **⏸ 发布治理 / 红线 2** | E11 | 延后 + 优先集成外部,不进 MVP |
| **v1 团队化与商业化** | 多仓库 GitHub App、RBAC、usage/cost、按席位定价 | 由外部验证放行 |

---

## 5. Scrum 仪式 cadence(小团队简化版)

- **Sprint 长度:** 1 周(早期产品,快反馈)
- **Sprint Planning:** 周一,从本 backlog 顶部拉故事进 Sprint
- **Daily:** 异步,看板即站会(尤其当 agent 也在看板上)
- **Review:** 周五,演示可工作的闭环
- **Retro:** 周五,1 件继续 / 1 件改进
- **Backlog Refinement:** 随时更新本文件;新洞察来自用户访谈

---

## 6. 待办:开发前必须先验证的假设

- [ ] 外部 3+ Lead 独立确认「多 agent 可观测性」是真痛(目前样本=1,创始人本人)
- [ ] 验证「人类验收会不会变成新瓶颈」
- [ ] 验证付费意愿与定价模型

---

## 7. GitHub 正式接入 · ✅ 已于 S3 交付(存档,详见 `GITHUB-INTEGRATION.md`)

- **GitHub 正式接入**(横跨 E3 执行流水线 + E5 审批闸门):
  - MVP 期先用 fine-grained PAT + 单测试仓库跑通闭环;产品化换 **GitHub App**(多租户、自助安装、webhook)。
  - 红线落地方式:**branch protection + 必需状态检查(Checks API)**——agent 提 PR 时把 `helmsman/human-approval` 检查置 pending(卡住合并),人类点「通过」才置 success 解锁。天然满足"绕过 merge API 必须失败"。
  - 坑:必需检查须用 Checks API(非旧 Status API);别把 App 加进分支保护 bypass 名单。
  - 详细文档 `GITHUB-INTEGRATION.md` 待 Sprint 2 再写。

---

## 8. Sprint 2 起步 story — US-8 · ✅ 已交付(存档)

### US-8(重写)Sprint 菜单:切换 + 导入(E1 · P0)
> 背景:之前的纯"切换器下拉"Codex 两次未实现。重写为**一个 Sprint 菜单**同时解决"切换历史 Sprint"和"导入/新建 Sprint",并附**设计稿**:`docs/design/mockups/sprint-import.html`。
> 导入格式 = `docs/sprints/sprint-spec.template.json`(固定 Sprint Spec)。

> **As a** Lead,**I want to** 在头部用一个 Sprint 菜单切换 Sprint、并用 JSON 一键导入新 Sprint,**so that** 我能管理多个 Sprint,且用固定模板快速拉起下一个 Sprint。

```gherkin
Scenario: 切换 Sprint
  Given 项目下有 ≥1 个 Sprint
  When 我打开头部 Sprint 菜单并选一个 Sprint
  Then 看板/Backlog/仪表盘/验收 都按所选 Sprint 渲染(URL 带 ?sprint=<id>,且保留 ?view=)
  And 默认显示最新的 active Sprint
  And 只有 1 个 Sprint 时菜单仍可用(不出现"死下拉"),「导入/新建 Sprint」始终可点

Scenario: 导入 Sprint
  Given 我在 Sprint 菜单点「导入 / 新建 Sprint」
  When 我粘贴一段符合 Sprint Spec 格式的 JSON 并点「导入」
  Then 系统 zod 校验通过后,事务创建 Sprint + Epics + Stories + Tasks
  And 自动切换到新 Sprint(?sprint=<newId>)

Scenario: 导入校验失败
  Given 我粘贴的 JSON 不合法或缺字段
  When 我点「导入」
  Then 弹窗内内联列出具体字段错误,不创建任何数据(整体回滚)
```
任务:
- [ ] `[FE]` 头部 **Sprint 菜单**(下拉):列出 Sprint 可切换 + 「导入/新建 Sprint」入口(按设计稿)
- [ ] `[BE]` 页面按 `?sprint=<id>` 选 sprint;缺省最新 active;**`?sprint=` 与 `?view=` 共存不互相覆盖**
- [ ] `[FE]` 四视图都跟随所选 sprint
- [ ] `[FE]` **导入弹窗**(粘贴 JSON / 上传 .json + 校验结果区,按设计稿五态)
- [ ] `[BE]` `importSprintAction(spec)`:**zod 校验** → 事务创建 Sprint+Epics+Stories+Tasks → 返回 newSprintId(复用 seed-sprint1 落库逻辑)
- [ ] `[TEST]` 🛡 非法/越权 sprintId 回退默认;导入非法 JSON 整体回滚、内联报错;成功后跳新 Sprint
- [ ] `[TEST]` 复用 `pnpm seed:e2e && seed:sprint1` 后,e2e 覆盖:切换 + 导入一个最小 Spec

---

## 9. 下一步:S4 — 双 agent 端到端闭环(走骨架)

> 目标:**一个 task 走完整条交付线、两个真 agent 都自动跑**(非 `agent-pr.mjs` 模拟器):dev(Codex)自动开发提 PR → qa(Claude)自动验收判定 → 人二次验收(翻 success)→ 人合并(agent-sandbox)。走骨架:一个 task、不并发。完整 Gherkin 见 `docs/sprints/sprint-4/sprint-spec.json`;技术方案(执行器选型/QA 自动判定/触发与隔离/凭证)见 `docs/sprints/sprint-4/S4-discussion-brief.md`,待新 session 拍板。
>
> **🚨 红线**:agent 永不自己 merge、永不翻 `success`;QA 判"过"只移到 Done 列(待人审)+ 保持 GitHub `pending`,人二次验收才翻 success+合并。

- **US-17(E3 · P0)Dev agent 领活 + 隔离 workspace**:worker 认领锁领『指派给 dev agent、todo』任务 → git worktree + 注入上下文 → in-place 转 in_progress。
- **US-18(E3 · P0)Dev agent 写真码 + 自测 + 开真 PR**:执行器在 worktree 写码+自跑 lint/tsc/build,**不过不开 PR**;过则开真 PR + 挂红线 pending → 待验收、指派 agent-02。
- **US-19(E3 · P0)QA agent 自动验收闭环**:qa agent 领待验收任务 → worktree 拉 PR 分支 → 自动写/跑覆盖 AC 的 e2e + 重跑门 → 全绿=过(到 Done 列待人审,**不翻 success**)/ 否则打回 dev + 证据。
- **US-20(E3 · P1)返工闭环 + 异常回路**:打回 → dev agent 带反馈自动返工;返工/失败**有界**(超 N 次 blocked 升级);失败/超时可见回退、不无限。
- **US-21(E3/安全 · P0)双 agent 安全守护**:dev 凭证只 push/PR/挂 pending;qa 凭证只读 PR/跑测试/改看板,**不写 GitHub status、不 merge**;翻 success/merge 仍只人类;两 agent 隔离主工作区/生产(延续 US-16)。

> S4 完成 = MVP 核心闭环用**真双 agent** 跑通;紧接 S5(Evidence + 成本/Token 观测)闭合 MVP。外部验证 probe 贯穿 S4–S5,别等 v1。

---

## 10. E12 — Backlog 导入与自助维护(低优先 · 非核心 · 先用现状)

> 这一档是 table-stakes 便利功能,**不顶替 S4/S5 核心主线**;等核心闭环成形后再做。当前可继续用「单个新建 Epic」+「Sprint Spec 导入」+(必要时)我跑脚本 维护。

### US-25(E12)产品 Backlog 导入(初版,纯 epic+story)
> 背景:目前只能单个「新建 Epic」或按 Sprint 导入(带 task)。缺一个**一次性导入初版产品 backlog**(多 epic + story、不带 sprint/task)的入口,让项目起步时快速铺好骨架、且 Lead 能自助维护(不靠脚本)。模版:`docs/product-backlog.template.json`。

> **As a** Lead,**I want to** 粘贴一段产品 backlog JSON 一次性导入多个 epic 和 story,**so that** 起步即铺好 backlog 骨架,不用逐个新建或逐 sprint 导入。

```gherkin
Scenario: Backlog 页导入
  Given 我在 Backlog 页
  When 我点「导入 Backlog」,粘贴符合 product-backlog 模版的 JSON 并提交
  Then zod 校验通过 → 事务 upsert:epic 按 code、story 按 code 挂到 epic(parentId)
  And 不创建 sprint / task
  And 重复导入幂等(by code 更新,不重复建)

Scenario: 校验失败整体回滚
  Given JSON 不合法或缺字段
  When 我提交
  Then 弹窗内内联列出字段错误,不落任何数据

Scenario: 新建项目后提示导入(onboarding,可跳过)
  Given 我新建 project 并确认
  When 系统提示「是否导入初版 backlog」
  Then 我可导入(同上)或跳过
```
任务:
- [ ] `[BE]` `importProductBacklogAction(spec)`:zod 校验 product-backlog 结构 → 事务 by-code upsert epic + story(挂 parentId);无 sprint/task
- [ ] `[FE]` Backlog 页「导入 Backlog」按钮 + 导入弹窗(复用 US-8 弹层,遵循弹层规范)
- [ ] `[FE]` 新建 project 确认后「是否导入初版 backlog」提示(可跳过)
- [ ] `[TEST]` 🛡 非法/缺字段整体回滚 + 内联报错;重复导入幂等;story 正确挂到 epic
### US-26(E12)Sprint 导入 epic 按 code 去重(修复"建重复")
> 背景:`importSprintAction` 对 epic 是 `create`(不去重)→ 跨 sprint 复用同一 epic(如 E1)会建出重复 BacklogItem。

> **As a** Lead,**I want** Sprint 导入时按 code 复用已有 epic 而非重复创建,**so that** backlog 里不会出现重复 epic。

```gherkin
Scenario: 跨 Sprint 复用 epic 不重复
  Given 项目里已有 epic E1
  When 我导入一个引用 E1 的新 Sprint Spec
  Then 系统复用已有 E1(不新建第二条 E1),story 挂到它下面
```
任务:
- [ ] `[BE]` importSprintAction:epic 按 `code`(title 前缀)查找复用,不存在才建;story 仍按原逻辑
- [ ] `[TEST]` 🛡 重复引用同一 epic 多次导入,backlog 中该 epic 仍只 1 条

> **优先级(整个 E12)**:Could / 低 —— table-stakes、非差异化,**不顶替 S4/S5**;small,可在核心闲时穿插。
