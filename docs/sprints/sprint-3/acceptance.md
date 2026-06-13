# Sprint 3 验收标准(红线走骨架)

> Sprint Goal:产品红线「人审前不许合并」由 GitHub 分支保护 + commit status 服务端强制;agent PR 用脚本伪造来打通,绕过必败。
> 红线机制详见 [`docs/GITHUB-INTEGRATION.md`](../../GITHUB-INTEGRATION.md)。
> 门:Codex 交付前自跑 lint/tsc/build + 单测(客观门);QA(agent-02)独立写**集成验收**,每条 Gherkin 1:1 覆盖,全绿 → Done 供人二次验收 + push。

## 与 Sprint 1/2 的关键不同:这是集成测试,不是纯本地 e2e
- 红线要打**真 GitHub**:开真 PR、写真 commit status、查真 `mergeable_state`。
- 验收跑在 **`agent-sandbox` 分支 + 细粒度 PAT**(`.env.sprint3.local`),DB 用**隔离库 `sprint3-redline`**。
- 验收**自清理**:跑完关掉/删掉测试 PR 与 `agent/US-*` 分支,避免噪音。
- 这意味着验收需要网络 + token;无 token 时该套件应**显式跳过并报"缺 GITHUB_TOKEN"**,不伪绿。

## 逐 Story 验收

### US-13 待验收即挂合并锁 (P0)
- [ ] 任务带 PR 进「待验收」→ PR head commit 上出现 `helmsman/human-approval=pending`
- [ ] 该 PR 在 GitHub `mergeable_state=blocked`(分支保护生效)
- [ ] GithubRef 落库:PR url / head sha / 红线状态=pending
- [ ] 看板卡片 + US-9 抽屉「关联 PR」显示「合并已锁(待批)」
- [ ] 全程仅用 Commit statuses 权限(token 无 Checks/Admin)
- [ ] 🛡 PR 伪造器 `scripts/agent-pr.mjs` 能拉 `agent/US-xx-*` 分支、开真 PR、写 GithubRef、移任务到待验收并指派 agent-02
- [ ] 🛡 **假占位清零**:`RunningMeta`/`BlockedMeta`/`ReviewMeta` 不再出现写死的 `测试运行中 · 14/22`、`2m 12s`、`feat/story-agent-pr`、`测试 22/22 通过 · +184 −20` 等编造文案;无真实数据时显示诚实空状态(可观测必须真实)

### US-14 通过验收 → 解锁合并 (P0)
- [ ] 人类成员点「通过验收」→ commit status=success
- [ ] PR `mergeable_state=clean`(可合并)
- [ ] 任务 **in-place** 转 done(同一张卡,id 不变)+ TaskUpdate(actor=该人)+ Decision(通过)
- [ ] GitHub 置 status 失败时:任务不进 done + 明确报错(不静默)
- [ ] 卡片/抽屉显示「已解锁 · 批准人」

### US-15 打回 → 合并锁不松 (P1)
- [ ] 点「打回」+ 反馈 → commit status=failure
- [ ] PR 仍 `mergeable_state=blocked`
- [ ] 任务 in-place 回 in_progress + 指派 agent-01 + TaskUpdate + Decision(打回+反馈)
- [ ] 卡片/抽屉显示「已打回,合并仍锁」

### US-16 绕过必败(安全红线) (P0)
- [ ] 🛡 未批准直接调 merge API → GitHub 拒(required status 未满足)
- [ ] 翻 success 的路径只在人类 approve action、且校验 session 为人类成员
- [ ] 🛡 worker/agent 路径无置 success 调用点 → 翻不动
- [ ] 分支保护 include administrators 已勾(admin 也不能绕)

## 给人类二次验收的视觉清单(e2e/集成兜不住的)
- [ ] 卡片/抽屉的「合并锁」三态(待批/已解锁/已打回)文案与配色清晰、不歧义
- [ ] US-9 抽屉「关联 PR」区在小窗口下不溢出、内部可滚(遵循弹层规范)
- [ ] 在 GitHub PR 页肉眼确认:未批时合并按钮置灰、批准后变绿(端到端真红线)

## 验收结论(QA 填)
- 静态门 lint/tsc/build:____
- 集成套件(US-13~16):____
- 回归 sprint1/sprint2-acceptance:____(确保红线改动没破坏既有 approve/打回/看板)
- 结论:____(全绿→Done 待人二次验收 + push / 否则打回带证据)
