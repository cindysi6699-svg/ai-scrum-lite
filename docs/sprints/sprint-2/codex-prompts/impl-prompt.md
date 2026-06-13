# 给 Codex 的 Sprint 2 实现提示词

> 按 docs/WORKFLOW.md 的分工:你负责**实现 + 单元测试 + lint/tsc/build**;**不写验收 e2e**(QA 独立写)。像素级照设计稿。

## 输入文件(全部加入上下文 —— 给文件,不给截图)
- 需求(固定格式):`docs/sprints/sprint-2/sprint-spec.json`
- 设计规范(尤其「2/4b 弹层规范」):`docs/design/DESIGN-SPEC.md`
- 设计稿(像素级标尺):
  - US-9 Story 详情抽屉 → `docs/design/mockups/story-detail.html`(**注意文件顶部的"弹出行为说明"注释**)
  - US-10 多 Agent 可观测面板 → `docs/design/mockups/agent-observability.html`
  - US-11 Sprint 生命周期页 → `docs/design/mockups/sprints-page.html`
  - US-12 看板拖拽 → 无独立稿,是现有看板(`src/app/projects/[projectId]/page.tsx`)上的交互增强

## 技术栈(锁死)
Next.js App Router + TS + shadcn/ui + lucide-react + zod。弹层用 shadcn `dialog`/`sheet`(抽屉)/`dropdown-menu`。

## 逐 story(只做这 4 个,严格照稿)

### US-9 Story 详情(右侧只读抽屉)— 稿:story-detail.html
- 点看板/Backlog 卡片 → 从右滑出**只读**抽屉,渲染:标题/用户故事/验收标准/优先级/负责人/状态 + **状态历史时间线(TaskUpdate)** + 关联 PR(GithubRef)+ 审批记录(Decision)。
- **弹层规范**:遮罩 z-40 / 抽屉 z-50(盖过顶栏 z-30);宽 `max-w-[560px]`,高 `h-[100dvh]`;头部 `shrink-0` 固定,正文 `flex-1 overflow-y-auto` 内部滚动。
- **关闭**:只读无输入 → **点遮罩 / Esc / X 都关闭**;关闭保留 `?sprint`/`?view`。
- 数据已在 query 里(include 全字段);TaskUpdate/Decision/GithubRef 关系也有。

### US-10 多 Agent 可观测面板 — 稿:agent-observability.html
- 顶栏「Agent 机群」入口接到此面板(替换现在的静态条)。
- 每个 agent 一行:状态(执行/空闲/异常)、当前 story、累计(领取/提 PR/被打回 数);异常标红。
- 点某 agent → 右侧活动流(按该 agent 过滤的 TaskUpdate 时间线)。
- **真实数据聚合**(按 assignee 聚合 Task + TaskUpdate),不要 mock;「在线/空闲」按最近活动推导(真实心跳留待后续)。

### US-11 Sprint 生命周期页 — 稿:sprints-page.html
- 列出全部 Sprint:名称/目标/起止/状态(规划/进行/关闭)/进度。
- 生命周期操作:关闭 / 归档 / 激活;**保证同一时刻唯一 active**。
- 列表项 → 进入该 sprint 看板(复用 US-8 的 `?sprint=` 与导入,不重复造)。

### US-12 看板拖拽流转(补 S1)— 现有看板交互
- 卡片列间拖拽 → 落库更新状态 + 留痕(TaskUpdate)。
- **非法流转拦截 + 回弹提示**(复用现有状态机规则:done 只能从 review 等);拖拽不破坏既有按钮/表单路径。

## 约束
- 只做 US-9~US-12;不要实现 Sprint 3 的大基建(真实 agent、GitHub 硬门禁、webhook)。
- 不破坏 Sprint 1 + US-8;**全程保留 `?sprint` 与 `?view` 共存不互相覆盖**。
- 所有弹层/抽屉**复述并满足** DESIGN-SPEC「弹层规范」4 项。

## 自检(交付前必做)
1. `pnpm lint && pnpm exec tsc --noEmit && pnpm build` 全过。
2. 现有套件不回归全绿:
   ```
   pnpm seed:e2e && pnpm seed:sprint1
   pnpm exec playwright test sprint1-acceptance
   pnpm exec playwright test sprint-import   # 含弹层规范断言
   ```
3. 可为新增 server action(如 sprint 生命周期、聚合查询)写**单元测试**;**不写验收 e2e**(QA 独立写)。
4. 每个页面自己截图与对应稿并排比对,修到无差异。
