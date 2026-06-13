# 给 Codex 的提示词:只开发 US-8(Sprint 列表与切换器)

> 本次**只做这一个 story**,不要碰其它需求。

## 目标
项目页目前只显示最新 `sprints[0]`,没有切换器 → 新建 Sprint 会挤掉旧的。加一个 Sprint 切换器,让 Lead 能查看任意 Sprint。

## 验收标准(Gherkin)
```
Given 项目下有多个 Sprint
When 我在 Sprint 切换器里选另一个 Sprint
Then 看板/Backlog/仪表盘/验收 都按所选 Sprint 渲染(URL 带 ?sprint=<id>)
And 默认显示最新的 active Sprint
And 切换不影响指派/验收等操作
And 非法/越权的 sprintId 回退到默认 Sprint
```

## 实现要点(基于现有代码)
文件主要是 `src/app/projects/[projectId]/page.tsx`:
1. `searchParams` 类型加 `sprint?: string`(现在只有 `view`)。
2. 选 sprint 的逻辑:把 `const latestSprint = project.sprints[0]` 改为——
   - 若 `?sprint=<id>` 命中 `project.sprints` 里的某个 → 用它;
   - 否则回退到最新 active(保持现有默认)。
   - **必须校验 id 属于本项目的 sprints**,不命中就回退(对应 🛡 越权回退)。
3. 头部加 **Sprint 选择器**:复用现有头部样式(参考 dashboard 的「Acme Labs ⌄」下拉,或现有原生 `<select>` 风格),列出该项目的 sprint,选中即跳 `?sprint=<id>`。放在「{sprintName} · Walking Skeleton」标题旁更自然。
4. 四个视图(board/backlog/dash/review)现在都从 `latestSprint` 派生 → 改为从所选 sprint 派生,变量统一重命名(如 `selectedSprint`)。
5. **参数共存**:`projectViewHref` / 切换 view 的链接要**保留 `?sprint=`**;切换 sprint 的链接要**保留 `?view=`**。两个 query 参数不能互相覆盖。
6. 数据:查询 `getProjectForUser` 已 `sprints take:5` 且含完整 include,**数据已够,通常不用改查询**;如需展示更多 sprint 可适当调大 take。

## 设计
- 复用现有 token / 组件,不要引入新风格。下拉用现有 select 或 dropdown 样式即可,深浅与现有头部一致。
- 不需要新弹窗/新页面,就是头部一个选择器。

## 不要做
- 不要改 Sprint 1 的指派/提 PR/验收逻辑;不要实现 Sprint 2 其它需求(GitHub 接入、可观测面板、导入器等)。

## 自检(必须)
1. `pnpm lint && pnpm exec tsc --noEmit && pnpm build` 全过。
2. 现有验收套件仍全绿:
   ```
   pnpm seed:e2e && pnpm seed:sprint1
   pnpm exec playwright test sprint1-acceptance --reporter=list
   ```
   (切换器不应破坏默认 Sprint 1 渲染,6 用例应继续通过。)
3. 加一条 Playwright:project 页带 `?sprint=<id>` 能渲染对应 sprint;非法 id 回退默认。
