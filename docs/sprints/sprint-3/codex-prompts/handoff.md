# Sprint 3 交接提示词(给 Codex / agent-01)

你是 **agent-01**,负责实现 + 自测(lint/tsc/build/单测)。**验收 e2e 不归你写**——那是 agent-02(Claude/QA)独立写的,你别写自己的验收测试(会自己批作业)。

## 0. 环境纪律(最重要,违反就出事)
- **整个 Sprint 3 只用隔离库**:所有命令前置 `set -a; source .env.sprint3.local; set +a`(提供 `DATABASE_URL`=Neon 分支 `sprint3-redline`、`GITHUB_TOKEN`=细粒度 PAT)。
- **绝不碰 production**:不读 `.env.local`、不连真实库、**绝不跑 `seed:sprint1` 或任何删库重建脚本**(历史事故:它会删 Helmsman 并改 owner)。
- 目标仓库 `cindysi6699-svg/ai-scrum-lite`;agent PR 的 base 分支 = **`agent-sandbox`**(不是 main);agent 分支前缀 `agent/US-xx-*`。
- prisma migration **只 deploy 到隔离库**。

## 1. 先读这些(给文件不给截图,像素级照稿)
- 需求:`docs/sprints/sprint-3/sprint-spec.json`(4 story / 16 task,US-13~16)
- 红线机制(必读):`docs/GITHUB-INTEGRATION.md`(为什么用 Commit Statuses 不用 Check Runs、状态机、安全模型)
- 验收标准:`docs/sprints/sprint-3/acceptance.md`
- 设计:`docs/design/DESIGN-SPEC.md` 的 **§4c 合并锁状态**(三态徽标:配色/文案/图标)+ **§4b 弹层规范**(US-9 抽屉涉及浮层,下面第 4 点必须复述照做)

## 2. 复用现有代码(别另起炉灶,在这些上面改)
- `src/server/actions/tasks.ts` —— `reviewTaskAction`(通过/打回)、`moveTaskStatusAction`;**保留 `optionalText` 修复(null→undefined)**
- `src/server/actions/task-status-rules.ts` —— 状态机(allowedTransitions);Done 仍只能从 review 来
- `src/app/projects/[projectId]/story-detail-drawer.tsx` —— 「关联 PR」区加合并锁徽标
- `src/app/projects/[projectId]/page.tsx` —— 看板卡片底部元信息行加合并锁徽标;`boardColumns` 映射不变
  - ⚠️ **顺手清掉假占位(US-13 guardrail)**:卡片 meta 组件 `RunningMeta`(~L1865)/`BlockedMeta`(~L1929)/`ReviewMeta`(~L1964)里有**写死的 demo 文案**必须改成真实数据或诚实空状态:`测试运行中 · 14/22`(L1883,纯硬编码、永远显示)、`2m 12s`(L1893)、branch 回退值 `feat/story-agent-pr`/`feat/story-claim-lock`、progress 回退值 `测试 22/22 通过 · +184 −20` / `并发认领仍有竞态…`。无真实数据时显示「暂无」之类,**绝不编造测试进度/分支/耗时**(产品红线:可观测必须真实)。「提验」「PR URL」输入框是真控件,保留。
- Prisma `GithubRef` model —— 加字段 `headSha String?` + `redlineStatus String?`(pending/success/failure);生成 migration 部署到隔离库
- 新建:`src/server/github/` GitHub 客户端封装(用 `GITHUB_TOKEN` 调 Commit Statuses API);`scripts/agent-pr.mjs` PR 伪造器

## 3. 逐 Story 实现要点(细节以 sprint-spec.json 的 Gherkin 为准)
- **US-13**:`scripts/agent-pr.mjs` 拉 `agent/US-xx-*` 分支→平凡改动→开真 PR(base=agent-sandbox)→写 GithubRef(url/headSha)→任务移「待验收」指派 agent-02。任务进待验收时,服务端在 PR head SHA 写 `helmsman/human-approval=pending`。卡片+抽屉显示「合并已锁·待批」。**GitHub 调用失败要冒泡,不静默**。
- **US-14**:`reviewTaskAction` 通过分支 → **先**置 commit status=success →成功后任务 **in-place 转 done**(同一张卡,不删重建)+ TaskUpdate(actor=人)+ Decision。**置 status 失败则不流转、报错**(补偿)。
- **US-15**:打回分支 → status=failure + 任务 **in-place 回 in_progress** + 指派 agent-01 + TaskUpdate + Decision(反馈)。
- **US-16(安全)**:**翻 status=success 的函数只允许人类 approve action 调用**,入口校验 session 是人类成员;`agent-pr.mjs` / worker 路径**绝不 import/调用**这个函数。

## 4. 弹层规范复述(US-9 抽屉,§4b 硬约束,必须照做)
① z 层级:抽屉 `z-50` 盖过 header;② 大小:`w-full max-w-[560px]`、`h-[100dvh]`(用 dvh);③ 内部滚动:`flex flex-col`,header `shrink-0`,正文 `flex-1 overflow-y-auto`,**底部永远可见**;④ 只读抽屉点遮罩/Esc/X 均可关(无输入,无需防丢)。加锁徽标不能破坏这 4 项。

## 5. 合并锁徽标(§4c,复用既有语义色,不新增颜色)
- pending → `Lock` · amber `#b45309`/底 `#fffbeb` · 「合并已锁·待批」
- success → `LockOpen` · emerald `#047857`/底 `#ecfdf5` · 「合并已解锁·批准人 {name}」
- failure → `Lock` · rose `#be123c`/底 `#fff1f2` · 「已打回·合并仍锁」
- 无关联 PR 的任务不显示;`failure` 文案必须强调"**仍锁**",不可歧义。

## 6. 交付前自跑(客观门,过不了别交)
- `set -a; source .env.sprint3.local; set +a` 后:`pnpm lint && pnpm exec tsc --noEmit && pnpm build` + 你写的**单元测试**(GitHub 客户端、状态翻转逻辑可 mock GitHub)。
- **不写验收 e2e**(agent-02 写)。
- 全绿后:把 US-13~16 在看板上 **in-place** 移到「待验收」并指派 **agent-02**,在 TaskUpdate 写一句交接(做了什么、跑了哪些门)。

## 7. 产出归档
- 代码进分支 + PR(base=agent-sandbox);返工提示词/记录进 `docs/sprints/sprint-3/codex-prompts/`;不往别处散落临时文件。
