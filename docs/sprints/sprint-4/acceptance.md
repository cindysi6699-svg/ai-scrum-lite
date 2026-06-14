# Sprint 4 验收标准(真 agent 自动执行 · Agent 走骨架)

> Sprint Goal:一个真 agent 经轻量自管编排端到端闭环跑完一个 task(领活→隔离 workspace→写真码+自测→开真 PR 挂红线→回填→异常不静默)。
> 门:实现者交付前自跑 lint/tsc/build + 单测;QA(agent-02)独立写**集成验收**覆盖每条 Gherkin,全绿 → Done 供人二次验收。

## 与 S1–S3 的关键不同:这是真编排 + 真执行的集成
- 跑在 **`agent-sandbox` 分支 + 隔离库 `.env.sprint3.local`(或新建 sprint4 隔离库)**,真 worker、真 worktree、真编码 agent CLI、真 PR。**绝不碰 main / 生产 / .env.local。**
- 验收**自清理**:跑完关掉/删掉测试 PR 与 `agent/US-*`、`*-worktree` 分支。
- **执行器选型(开 S4 必拍板)**:默认 **Codex CLI**(Codex = 既有 agent-01),经适配层抽象、可换 Claude Code。
- ⚠️ 验收对象是**"闭环机制"是否成立**(领取/PR/红线/回退/安全),**不是**"agent 这次写的代码完美"——代码质量由后续 QA e2e + 人二次验收把关(那正是红线存在的意义)。

## 逐 Story 验收

### US-17 编排器领活 + 隔离 workspace (P0)
- [ ] worker 找到『指派给真 agent 且在 todo』的任务并用**认领锁**领取
- [ ] 为任务创建隔离 git worktree(base=agent-sandbox)+ 注入上下文(story/AC/repo/边界)
- [ ] 任务 in-place 转 in_progress + 活动流留痕(actor=agent-01、时间)
- [ ] worker 不接触主工作区 / .env.local / 生产库
- [ ] 🛡 并发/重复触发下同一任务只被领一次(幂等)

### US-18 写真码 + 自测 + 开真 PR(挂红线) (P0)
- [ ] 执行器(Codex CLI)在 worktree 写代码 + 补测试 + 自跑 lint/tsc/build
- [ ] **自测不过 = 不开 PR、任务不进待验收**(质量前置)
- [ ] 自测全过 → 开真 PR(base=agent-sandbox)→ 写 GithubRef(branch/headSha/url)
- [ ] PR head 挂 `helmsman/human-approval=pending`(复用 S3,PR `mergeable_state=blocked`)
- [ ] 任务 in-place 转待验收 + 指派 agent-02 + 留痕(PR/摘要/跑过的门)

### US-19 异常回路(不静默死) (P1)
- [ ] 失败/超时(>N 分钟)/自测红 → 任务 in-place 回 todo 或 blocked + 原因写活动流
- [ ] 🛡 失败计数超阈值 → 标 blocked 升级人工,**不无限重试**
- [ ] worktree 失败后按策略保留/清理,不污染主工作区
- [ ] 🛡 注入必然失败的任务 → 可见回退、写明原因、不静默、不无限重试

### US-20 执行安全守护(延续 US-16) (P0)
- [ ] 执行凭证最小权限(Contents/PR/Commit statuses-pending);**无 merge、无翻 success 通道**
- [ ] 翻 success 仍只经人类 approve action(US-16 不变)
- [ ] worker/执行器仅在隔离 worktree 跑,隔离 .env.local / 生产库
- [ ] 🛡 执行器路径尝试 merge / 翻 success → 被拒/无通道
- [ ] 🛡 认领锁:多 worker/多触发不抢占、不重复执行

## 给人类二次验收的清单
- [ ] 在 app「待验收」看到真 agent 自动产出的卡,带真实 PR + 合并锁「待批」
- [ ] 亲手「通过验收」→ PR 解锁可合并(端到端:真 agent 产出 → 人审 → 可合)
- [ ] 抽一个真 agent 写的 PR diff 肉眼看:是不是真在干活、还是瞎填(执行器有效性)
- [ ] 失败任务在看板上能看清「为什么回退」

## 验收结论(QA 填)
- 静态门 lint/tsc/build:____
- 集成套件(US-17~20):____
- 回归 sprint1/2/3-acceptance:____(确保编排改动没破坏既有看板/红线)
- 结论:____(全绿→Done 待人二次验收 / 否则打回带证据)
