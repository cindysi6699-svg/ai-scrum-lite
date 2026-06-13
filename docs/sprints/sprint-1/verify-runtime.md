# Sprint 1 运行时验收报告(Playwright 自动化点点点)

> 代码:`/Users/cindysi/privatefile/coding_test/ai-scrum-lite`
> 方式:真实浏览器自动点击,对照 ACCEPTANCE-SPRINT1.md。登录用测试 session 旁路(零生产代码改动)。
> 套件:`tests/e2e/sprint1-acceptance.spec.ts` · 登录种子:`scripts/seed-e2e.mjs`

## 运行结果(6/6 符合预期)

| 用例 | 结果 | 说明 |
|---|---|---|
| US-1 看板加载 + 4 列 + 导航 | ✅ 通过 | 登录、Helmsman 看板、列、导航都正常 |
| US-2 指派 To Do → Agent 执行中 | ✅ 通过 | 选在线 agent 指派,卡片真实流转 |
| US-3/US-5 「提验」→ 待验收 | ✅ 通过 | 手动状态回填可用 |
| **US-4 「通过验收」→ Done** | 🔴 **已知失败** | **核心红线 approve 按钮运行时崩(ZodError)** |
| US-4 「打回 + 反馈」→ 回执行 | ✅ 通过 | Scrum 正确,退回 in_progress 带反馈 |
| US-1 新建 Story 弹窗 → To Do | ✅ 通过 | 四字段提交,新卡片入列 |

## 🔴 点点点新发现的 2 个真 bug(静态审查没抓到)

这两个是**运行时崩溃**,只有真点才暴露,已写进 `CODEX-SPRINT1-FIXES.md` Bug 4:

1. **「通过验收」直接崩** —— `reviewTaskAction` 的 `feedback` 字段:approve 表单没有 feedback 输入,`formData.get("feedback")=null`,而 schema `z.string().optional()` 不接受 null → ZodError。**产品最核心的红线动作当前完全不可用。**
2. **「提交 PR」直接崩** —— `submitPullRequestAction` 的 `branch`/`note` 同样的 null 问题。

根因是系统性的:`formData.get()` 缺字段返回 `null`,但 schema 用 `.optional()`(只认 undefined)。`progress` 字段也有同样隐患。

## 怎么复跑(命令)

```bash
cd /Users/cindysi/privatefile/coding_test/ai-scrum-lite
pnpm seed:e2e          # 造测试用户 + session(每次在 sprint1 之前先跑)
pnpm seed:sprint1      # 造 Helmsman 数据(测试用户当 owner)
pnpm exec playwright test sprint1-acceptance --reporter=list
```
> 注:dev server 会自动起;首跑 server action 因冷编译 + 远端 DB 偏慢,用例已放宽超时。
> approve 修好后,把 spec 里 US-4 approve 的 `test.fail(...)` 一行删掉,即转为正常通过。

## 结论(验收员意见,你拍板)

可工作:看板、指派、提验状态回填、**打回返工**、新建 Story。
**阻塞项:核心红线「通过验收」运行时崩溃**——这条不修,Sprint 1 的核心闭环("人类掌舵"的那一下)就不成立。
→ 倾向:**打回**,优先修 Bug 4(approve),再加上之前静态发现的 Bug 1-3,一并返工。
