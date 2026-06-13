# 给 Codex 的提示词:US-8(重写)Sprint 菜单(切换 + 导入)

> 取代之前的 `us8-prompt.md`(纯切换器,未实现)。本次**有设计稿,务必像素级照做**,只做这一个 story。

## 视觉事实来源(给文件,别凭空发挥)
- 设计稿:`docs/design/mockups/sprint-import.html`(① 头部 Sprint 菜单下拉 ② 导入弹窗五态)
- token/组件规范:`docs/design/DESIGN-SPEC.md`
- 导入格式模板:`docs/sprints/sprint-spec.template.json`

## 技术栈(锁死)
Next.js App Router + TypeScript + shadcn/ui(dropdown-menu / dialog / button / textarea)+ lucide-react + zod。

## 要实现什么

### A. 头部 Sprint 菜单(替换之前没成功的 `sprint-switcher.tsx`)
- 头部一个按钮「Sprint:<当前名> ▾」,点开下拉(用 shadcn `dropdown-menu`,样式照设计稿)。
- 下拉内容:**切换区**(列出本项目所有 Sprint,当前项打勾 + active/done 标签,点击切换)+ 分隔线 + **「导入 / 新建 Sprint」**入口(打开导入弹窗)。
- **只有 1 个 Sprint 时**:切换区只列当前这一个(高亮),「导入/新建 Sprint」始终可点 —— **不要出现"只有一项、选了没反应"的死下拉**。
- 切换 = 跳 `?sprint=<id>`。**必须保留 `?view=`**(两个 query 参数共存,不互相覆盖)。

### B. 选 Sprint 的后端逻辑(`src/app/projects/[projectId]/page.tsx`)
- `searchParams` 加 `sprint?: string`;选 sprint:`?sprint=<id>` 命中本项目 sprints 则用它,否则回退最新 active。
- **校验 id 属于本项目**,不命中就回退(🛡)。四视图(board/backlog/dash/review)统一从所选 sprint 派生。

### C. 导入弹窗 + server action
- 弹窗(shadcn `dialog`)照设计稿:来源切换(粘贴 JSON / 上传 .json)+ 大号 mono textarea + 校验结果区。
- **五态都要做**:默认(导入按钮禁用)/ 校验失败(rose 列字段错误,禁用)/ 校验通过(emerald 摘要:Sprint 名 · N epics · N stories · N tasks,可用)/ 导入中(loading)/ 成功(关闭弹窗 + 跳 `?sprint=<newId>`)。
- **`importSprintAction(specJson)`**:
  - 用 **zod** 按 `sprint-spec.template.json` 的结构校验(sprint.name/goal/startDate/endDate 必填;每个 story 必含 code/title/priority/userStory/acceptanceCriteria/tasks[])。
  - 校验失败 → 返回结构化字段错误(给 UI 内联显示),**不写任何数据**。
  - 校验通过 → **事务**创建 Sprint + Epics + Stories + Tasks(**复用 `scripts/seed-sprint1.mjs` 的落库逻辑/字段映射**:BacklogItem(epic/story)、Task、状态、优先级等;新 Sprint 设为 active,owner=当前用户)。
  - 返回 `newSprintId`。
  - 任意一步失败 → 整体回滚。

## 不要做
只做这一个 story。不要实现 Sprint 2 的其它需求(GitHub 真实接入、可观测面板等)。不要改 Sprint 1 的指派/提 PR/验收逻辑。

## 自检(必须)
1. `pnpm lint && pnpm exec tsc --noEmit && pnpm build` 全过。
2. 现有验收套件仍全绿:
   ```
   pnpm seed:e2e && pnpm seed:sprint1
   pnpm exec playwright test sprint1-acceptance --reporter=list
   ```
3. **不要写验收 e2e**(acceptance 测试由 QA 独立编写,职责分离)。你只需:保证现有 `sprint1-acceptance` 套件仍全绿;可为 `importSprintAction` 的 **zod 校验逻辑写单元测试**(合法/缺字段/非法 JSON)。
4. 自己截图与 `sprint-import.html` 并排比对,修到无差异。

> 验收 e2e(`tests/e2e/sprint-import.spec.ts`:切换、导入成功跳新 Sprint、非法 JSON 内联报错不落库)由 QA Agent 在你交付后**独立**编写并运行,不在本任务范围。
