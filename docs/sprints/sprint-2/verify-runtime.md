# Sprint 2 验收报告(QA e2e 门 · agent-02)

> 代码:ai-scrum-lite @ `78764e6 Implement sprint 2 workspace flows`
> 方式:QA(我)独立写 e2e 覆盖每条验收标准 → 全绿即通过。
> 套件:`tests/e2e/sprint2-acceptance.spec.ts`(我新写)

## 结果:通过 ✅
| 检查 | 结果 |
|---|---|
| 静态门 lint / tsc / build | ✅ 全过 |
| **Sprint 2 验收** sprint2-acceptance | ✅ **5/5** |
| 回归 sprint1-acceptance | ✅ 7/7(未破坏 Sprint 1 + 切换器) |
| 回归 sprint-import (US-8) | ✅ 3/3 |

## 逐 story(对照验收标准)
| Story | e2e 覆盖 | 结论 |
|---|---|---|
| **US-9** Story 详情抽屉 | 点卡片打开只读抽屉;渲染 标题/验收标准/状态历史/关联PR/审批记录;Esc 关闭且不丢视图(?task 移除) | ✅ |
| **US-10** 多 Agent 可观测 | `?view=agents` 机群表格(列:当前Story/领取/提PR/打回);点 agent → `?agent=` 活动流过滤;真实数据聚合 | ✅ |
| **US-11** Sprint 生命周期 | `?view=sprints` 列出 sprint + 状态;激活另一 sprint → **唯一 active**(原 active 自动关闭) | ✅ |
| **US-12** 看板拖拽 | 合法流转(To Do→Agent 执行中)更新状态;**非法流转(To Do→Done)被拦截 + 提示「Done 只能从待验收流转」,卡片不动** | ✅ |

实现质量也对得上设计稿与 DESIGN-SPEC 弹层规范(抽屉 z-50 / `h-[100dvh]` / 头部 shrink-0 / 正文内部滚动 / 只读点遮罩·Esc·X 均关闭);US-11 激活走事务、保证唯一 active;US-12 非法流转用 `task-status-rules` 的状态机拦截。

## 给人类二次验收的视觉清单(e2e 兜不住的)
- [ ] US-9 抽屉在小窗口下正文可滚、不溢出页面
- [ ] US-12 真实鼠标拖拽手感(列高亮 `data-drag-over`)正常
- [ ] US-10 机群面板在真实数据下展示合理(seed 是 2 个 agent)

## 验收员意见
4 个 story 的验收标准全部 e2e 覆盖且全绿,无回归。→ **通过,流转到 Done。** 最终 push 归你(二次验收 + git push)。
