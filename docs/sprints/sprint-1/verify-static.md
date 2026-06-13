# Sprint 1 验收报告(验证员:Claude · 拍板:You)

> 代码:`/Users/cindysi/privatefile/coding_test/ai-scrum-lite`(main,ahead 1:Add new story dialog)
> 方式:静态检查 + 代码逐条对照 [ACCEPTANCE-SPRINT1.md](ACCEPTANCE-SPRINT1.md)。未读 `.env.local`。
> 边界:真实 agent / GitHub 硬门禁 / 拖拽 / 心跳 / webhook 你已注明 Sprint 1 故意未做 → 标 ⛔ 缺口,不计为 bug。
> **最终「通过/打回」是你的红线,我只给证据 + 建议。**

## 静态检查
| 项 | 结果 |
|---|---|
| `pnpm lint` | ✅ 干净 |
| `pnpm exec tsc --noEmit` | ✅ 通过 |
| `pnpm build` | ✅ 成功编译(6 路由) |
| `pnpm e2e` | ⚠️ 仅 2 条烟雾测试(landing 渲染 / 未登录跳转)——**完全没覆盖 Sprint 1 闭环和 🛡 守护项** |

## 逐 story 结论

### US-1 看板与 Story 基础 — ⚠️ 基本达成,有 1 个真 bug
- ✅ 数据模型(BacklogItem/Task/TaskUpdate)、看板 UI、状态留痕(每个 action 写 TaskUpdate)
- ✅ 状态机守护:done 只能从 review(`updateTaskStatusAction`)
- 🐛 **看板卡片编号 `US-${index+1}` 按列内位置生成**,不是真实 story 标识 → 同一任务换位置就换号,误导。Review 队列同样按 index 编号。
- ⚠️ 其他非法流转未全守护(可对 todo 任务直接提 PR→review)
- ⛔ 拖拽未做(intended)

### US-2 指派 Agent — ⚠️ 部分达成
- ✅ `assignTaskAction` 校验 assignee 必须 `type==="ai"`,否则报错;写留痕
- ⛔ 在线心跳未做(intended)→ UI"在线/离线"是 `agents.slice(0,2)` + 硬编码 agent-05 离线,**离线防呆是假的**
- ⚠️ 无并发/重复指派幂等保护(🛡 未覆盖)

### US-3 Agent 执行提 PR — ⛔ 按计划手动模拟
- ⛔ 真实领取/分支/写码/测/PR 全未做(intended)
- ⚠️ `submitPullRequestAction` 把 `checksStatus` 硬编码 `"passed"` → 🛡"测试不过=不开 PR"无法体现(无真测试)
- ⚠️ 提 PR 不校验任务当前状态
- ⛔ 认领锁(US-7)未做(intended)

### US-4 人类验收闸门 🚧 — ✅ 核心逻辑扎实,但有 1 个真 bug
- ✅ `reviewTaskAction`:要求 status==="review";approve 要求有 PR trace;**approve→accepted、reject→in_progress 带 feedback(Scrum 正确)**;写 Decision(审计)+ 留痕
- ✅ 验收页 + 卡片内双入口;打回 feedback 必填
- 🐛 **验收页"验收标准(Gherkin)"是硬编码文本,没读任务真实 `acceptanceCriteria` 字段** → 验收看到的不是这条 story 的真实标准,削弱验收意义
- ⛔ 真实 GitHub merge/push 硬门禁未接(intended Sprint 2)→ "push 被阻止"目前是 UI 文案 + 状态字段,非服务端拦截;🛡"绕过 merge API 必败"尚无法验证
- ⛔ diff 静态、执行日志硬编码(intended)

### US-5 状态自动回填 — ⛔ 按计划部分
- ✅ 手动 action 驱动状态流转 + 留痕(部分回填);`revalidatePath` 刷新
- ⛔ 真实 event/webhook/实时刷新/PR 对账未做(intended)

## 跨 story 真实小 bug(非 intended)
- 🐛 **`priorityPoints("P0") = 0`** → P0(最高优先级)story 计 0 点,`totalPoints` 少算。用 priority 推点数的副作用(你表里已标"不对等",但 P0=0 是明确逻辑错)。
- 🐛 卡片/验收 US 编号按位置生成(见 US-1)。
- ⚠️ 仪表盘几乎全硬编码(燃尽图、agent 机群假数据、活动流、38min、第3天);仅 KPI 的 donePoints/passRate 接真实数据。dashboard 本属 S2/S3,记录即可。

## 建议(我作为验证员的判断,你拍板)
**真该在收尾修的 3 个(都是真 bug,不是缺口):**
1. 卡片/验收页显示**真实 story 编号**,别用位置 index。
2. 验收页渲染任务**真实 `acceptanceCriteria`**,别硬编码 Gherkin。
3. 修 `priorityPoints` 的 P0=0(或干脆加 `storyPoints` 字段,你表里也提了)。

**留给 Sprint 2(intended,符合你的范围):** 真实 agent 接入、GitHub 硬门禁(branch protection + Checks API)、心跳/last-seen、认领锁、webhook 实时回填、仪表盘真实数据、补 Sprint 1 闭环的 e2e。

## 我的验收倾向
US-1 / US-5 在 Sprint 1 范围内**可接受**;US-4 核心 server-action 逻辑**做对了**,值得肯定。但 US-2「离线防呆是假的」+ US-4「验收标准硬编码」这两点,会让"验收"这个核心动作名不副实。
→ 倾向:**带上面 3 条反馈打回快速修一轮**,再正式通过。但这一下由你点。
