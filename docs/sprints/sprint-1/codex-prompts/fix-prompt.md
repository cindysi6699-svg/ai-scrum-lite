# 给 Codex 的 Sprint 1 打回修复提示词(直接复制)

> 把本段贴给 Codex,并确保它能读到仓库里的 `CODEX-SPRINT1-FIXES.md`。

---

Sprint 1 验收未通过,请按 `CODEX-SPRINT1-FIXES.md` 修复 4 个 bug,**按优先级**:

**P0(阻塞,先修)— Bug 4:可选表单字段缺失时 server action 崩溃**
- 现象:点验收页「通过验收」→ Runtime ZodError(`feedback` 为 null);点执行中卡片「提交 PR」→ Runtime ZodError(`branch` 为 null)。**这是产品核心红线,当前完全不可用。**
- 根因:`formData.get()` 缺字段返回 `null`,schema 用 `z.string().trim().optional()`(只接受 `undefined`)。
- 修:在 `src/server/actions/tasks.ts` 加归一化可选文本类型并替换 `feedback` / `branch` / `note` / `progress`:
  ```ts
  const optionalText = z.preprocess(
    (v) => (v === null || v === "" ? undefined : v),
    z.string().trim().optional(),
  );
  ```

**P1 — Bug 2:验收页验收标准硬编码**
- 验收页渲染真实的 `selectedTask.acceptanceCriteria`(按行 split),不要写死那 3 条。数据已在 query 里(`include`),只需给 `WorkTask` 类型补 `acceptanceCriteria: string | null` 并渲染。

**P2 — Bug 1:卡片/验收 `US-x` 编号按列内位置生成**
- 改为基于任务真实标识:`backlogCode(task.backlogItem?.title ?? task.title) || '#'+task.id.slice(0,6)`,删掉 `US-${index+1}` 和硬编码的 `US-4`。

**P3 — Bug 3:`priorityPoints("P0")` 返回 0**
- 改为映射表 `{P0:8,P1:5,P2:3,P3:2}`,注明待加真实 storyPoints 字段后删除。

**约束**:只修这 4 个;不要实现 `CODEX-SPRINT1-FIXES.md` 末尾"⛔ 不要动"里列的 Sprint 2 项(真实 agent、GitHub 硬门禁、心跳、webhook、仪表盘真实数据等)。

**自检(必须做)**:
1. `pnpm lint && pnpm exec tsc --noEmit && pnpm build` 全过。
2. 跑验收套件确认 approve 修好:
   ```
   pnpm seed:e2e && pnpm seed:sprint1
   pnpm exec playwright test sprint1-acceptance --reporter=list
   ```
   修好 Bug 4 后,把 `tests/e2e/sprint1-acceptance.spec.ts` 里 US-4 approve 用例顶部的 `test.fail(...)` 那一行**删掉**,让它转为正常通过;并把 US-3 改回(或新增)真实「提交 PR」路径的断言以覆盖该修复。
3. 目标:6 个用例全部真实通过(无 test.fail)。
