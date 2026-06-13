# Sprint 1 验收打回 — 给 Codex 的修复清单

> 来源:Sprint 1 人工验收。下面 3 个是**真 bug**,请修。文末"不要动"的部分是 Sprint 1 故意未做的范围,**不要顺手实现**。
> 全部集中在一个文件:`src/app/projects/[projectId]/page.tsx`(除非另注)。修完跑 `pnpm lint && pnpm exec tsc --noEmit && pnpm build`。

---

## Bug 1 — 看板/验收的 `US-x` 编号是按"列内位置"生成的,不是真实 story 标识

**现象**:同一个任务换一列/换位置,显示的 `US-x` 号就变,误导。

**位置**:
- `BoardView` 渲染卡片时:`usLabel={`US-${index + 1}`}`(约 L574)
- `TaskCard` 顶部显示 `{usLabel}`(约 L1120)
- `ReviewGate` 队列项:`US-${index + 1} · PR #...`(约 L929)
- `ReviewGate` 详情头硬编码:`US-4 {selectedTask.title}`(约 L953)

**修法**:
1. 新增一个 helper(复用已有的 `backlogCode`,约 L178):
   ```ts
   function storyRef(task: { id: string; title: string; backlogItem: { title: string } | null }) {
     return backlogCode(task.backlogItem?.title ?? task.title) || `#${task.id.slice(0, 6)}`;
   }
   ```
2. `BoardView`:删掉 `usLabel` prop,改由 `TaskCard` 内部用 `storyRef(task)` 计算并显示。
3. `ReviewGate` 队列项 + 详情头:都用 `storyRef(task)` / `storyRef(selectedTask)`,**不要用 index,不要硬编码 US-4**。

**验收**:同一任务在任何列/位置显示的编号一致;能反映其真实 story(backlog item 标题里的 `US-\d+`/`E\d+`,没有则用短 id)。

---

## Bug 2 — 验收页"验收标准"是硬编码 Gherkin,没读任务真实的 `acceptanceCriteria`

**现象**:验收页固定显示 3 条写死的标准,和被验收的 story 无关 → 验收名不副实。

**位置**:`ReviewGate` 详情区(约 L975-979):
```tsx
<ul className="space-y-1.5 text-sm">
  <AcceptanceItem checked text="验收通过后,PR 才允许合并/push" />
  <AcceptanceItem checked text="打回时 PR 被阻止 + story 退回带反馈" />
  <AcceptanceItem text="绕过门禁直接调 merge API 必须失败 — 待你确认" />
</ul>
```

**修法**:
1. 数据已经查到了——`getProjectForUser` 用的是 `include`(非 `select`),Task 的标量字段全都返回,`acceptanceCriteria` 已在对象里,**不需要改查询**。
2. 只需在本文件的 `WorkTask` 类型(约 L48-58)补一个字段:
   ```ts
   acceptanceCriteria: string | null;
   ```
3. 渲染真实标准(每行一条):
   ```tsx
   const criteria = (selectedTask.acceptanceCriteria ?? "")
     .split("\n").map((s) => s.trim()).filter(Boolean);
   ...
   <ul className="space-y-1.5 text-sm">
     {criteria.length > 0
       ? criteria.map((c, i) => <AcceptanceItem key={i} text={c} />)
       : <li className="text-[#a1a1aa]">该 story 未填写验收标准。</li>}
   </ul>
   ```
   注:用 `AcceptanceItem`(默认 `checked=false`),因为这些是"待人工核对项",不要默认打勾。

**验收**:验收页显示的是该 story 自己的 `acceptanceCriteria`,空时给占位文案;不再出现写死的 3 条。

---

## Bug 3 — `priorityPoints("P0")` 返回 0,P0(最高优先级)story 计 0 点

**现象**:`Number("P0".replace("P","")) === 0` → P0 story 显示 0 pts,`totalPoints` 少算。

**位置**:`priorityPoints`(约 L160-164)。

**修法**(在没有真正 `storyPoints` 字段前的占位映射,给个非零、稳定的值):
```ts
// 占位:真实 story points 字段加上后(Sprint 2)删除此映射
const PRIORITY_POINTS: Record<string, number> = { P0: 8, P1: 5, P2: 3, P3: 2 };
function priorityPoints(priority: string) {
  return PRIORITY_POINTS[priority] ?? 3;
}
```

**验收**:任何优先级都不再出现 0 点;`totalPoints` 不再漏算 P0。

---

## Bug 4 🔴 严重 — 表单可选字段缺失时 server action 抛 ZodError(核心红线「通过验收」直接崩)

**现象(运行时,Playwright 点点点实测到)**:
- 点验收页**「通过验收」→ Runtime ZodError**:`path:["feedback"] expected string, received null`。**核心红线 approve 按钮当前完全不可用。**
- 执行中卡片点**「提交 PR」(PR URL 旁的图标按钮)→ Runtime ZodError**:`path:["branch"] received null`。

**根因(系统性)**:`formData.get("x")` 在字段不存在时返回 **`null`**,而 schema 用的是 `z.string().trim().optional()` —— `.optional()` 只接受 `undefined`,**不接受 `null`**。凡是"可选且表单里没有该字段"的输入都会炸:
- `reviewTaskAction` 的 `feedback`(approve 表单没有 feedback 输入)→ **approve 崩**
- `submitPullRequestAction` 的 `branch` / `note`(PR 表单只有 url)→ **提交 PR 崩**
- `updateTaskStatusAction` 的 `progress` 同理(目前侥幸没崩,因为「提验」表单总是带 progress,属潜在隐患)

**位置**:`src/server/actions/tasks.ts` 的 schema 定义(约 L34-48)。

**修法(一次性修掉,推荐)**:加一个把 `null`/`""` 归一成 `undefined` 的可选文本类型,替换这些字段:
```ts
const optionalText = z.preprocess(
  (v) => (v === null || v === "" ? undefined : v),
  z.string().trim().optional(),
);
// 然后:
// updateStatusSchema.progress  → optionalText
// submitPrSchema.branch / note → optionalText
// reviewTaskSchema.feedback    → optionalText
```
(或者在每个 action 里把 `formData.get("feedback")` 改成 `formData.get("feedback") ?? undefined`,逐个字段处理。)

**验收**:
- 验收页点「通过验收」→ 任务进入 accepted/Done,不再报错(这是产品红线,必须修)。
- 执行中卡片填 PR URL 提交 → 进入待验收,不再报错。
- 已有 Playwright 用例 `tests/e2e/sprint1-acceptance.spec.ts` 里 US-4 approve 当前标了 `test.fail`,修好后请**移除该 `test.fail` 标记**,让它转为正常通过。

---

## ⛔ 不要动(Sprint 1 故意未做,留给 Sprint 2)

以下不是 bug,**别顺手实现/别报错**:
- 真实 agent 领取/建分支/写码/跑测/开 PR(现为手动模拟,`submitPullRequestAction` 的 `checksStatus: "passed"` 是占位)
- GitHub 真实 merge/push 硬门禁(branch protection + Checks API)→ "push 被阻止"目前是 UI + 状态字段
- agent 在线心跳/last-seen(UI 的在线/离线是占位)
- 认领锁(防并发指派)、指派幂等
- webhook / 实时刷新 / PR 对账
- Sprint 仪表盘的真实数据(燃尽图、机群、活动流目前是 mock)
- e2e 覆盖 Sprint 1 闭环(目前只有 2 条烟雾测试)

如需我把上面这些拆成 Sprint 2 的 story,另开任务。
