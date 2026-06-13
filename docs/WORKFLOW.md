# Helmsman 每-Sprint 工作流(标准操作手册)

> 一次性前置(只做一次,不进每轮循环):**①产品调研 → ②用户发现**(产出 PRODUCT-RESEARCH.md、访谈洞察)。
> 本手册只覆盖**每个 Sprint 重复跑**的流水线。理念:**agent 干活、人类掌舵**。

## 你(人类 Lead)只负责这几件事
1. **需求确认** —— 确认本 Sprint 的《Sprint Spec》(固定格式,见下)
2. **设计稿确认** —— 确认高保真原型
3. **二次验收 + git push** —— QA 的 e2e 门通过后,你做最终人审,满意则 push(产品红线:push 前必须人类批)

> **「待验收」第一道已自动化**:由 QA Agent 的 e2e 判定 —— **全绿 = 通过(流转到你二次验收);任一条挂或某条验收标准未覆盖 = 直接打回**(带哪条 Gherkin 没过 + 证据)。你不再做第一道。
其余全部由 Agent 自动完成。

---

## 闭环流水线

```
        ┌──────────[人]──────────┐                      ┌────────[人]────────┐
   需求确认 ①          设计稿确认 ②                          二次验收 + git push ③
        │                  │                                        │
  Sprint Spec ─▶ 拆解Backlog ─▶ 设计 ─▶ 研发 ─▶ 待验收(QA e2e门)─通过─▶ Done ─▶ 人二次验收+push
   (PM Agent)     (PM Agent)  (设计)  (Codex)  (QA:全绿=过/否则打回)              │
                                              └─ 打回+反馈 ◀ 不达标 ┘    打回◀人不满意
                                                  (回 Agent 执行中 返工)
```

**看板状态流转(列)**:`To Do → Agent 执行中 → 待验收 → Done`
- **待验收**:agent 提 PR 后停在这里,等 **QA e2e 门**判定。
- **QA 全绿 → 卡片流转到 Done 列**;你看到 Done 里的卡 = "QA 已过、待你二次验收",你在此做二次验收并 push。
- **QA 打回 / 你二次验收不满意 → 卡片退回「Agent 执行中」**带反馈返工。
- 注:`Done` 在 push 前的语义是"QA 通过、待人审",不是"已发布"。

## 节点表(输入 / 方法 / 输出 / 谁)

| 节点 | 输入 | 方法·Skill·Tool | 输出(交付物) | 谁 |
|---|---|---|---|---|
| **需求确认** 🧑 | 上轮遗留 + 产品方向 | `roadmap-planning`·`epic-breakdown`·`user-story`(Cohn+Gherkin) | **Sprint Spec**(固定格式,见下) | Agent 起草 → **人确认** |
| 拆解 Backlog | 已确认 Sprint Spec | `user-story-splitting`·`prioritization` | backlog 条目 + 任务拆解(进 SCRUM-BACKLOG.md) | PM Agent |
| **设计稿确认** 🧑 | Sprint 故事 | `taste-skill`·`frontend-design`·`shadcn-discovery/review` | design/ 高保真原型 + DESIGN-SPEC.md | 设计 Agent → **人确认** |
| 研发 | 原型 + DESIGN-SPEC + Spec | Codex(Next.js+shadcn)+ 交接提示词 | 可运行代码(分支 + PR) | Codex |
| 测试 | 代码 + Sprint Spec 的 Gherkin | QA 写 e2e,**每条验收标准 1:1 覆盖**(`seed-e2e` 旁路 + 静态 lint/tsc/build) | e2e 套件 + 运行时报告 | QA Agent |
| **待验收(QA e2e 门)** 🤖 | e2e 结果 | **全绿 = 通过 → 卡片流转到 Done 列**(供人二次验收);**任一挂 / 某条标准未覆盖 = 直接打回**(退回 Agent 执行中) | 通过→Done / 打回判定(打回带:哪条 Gherkin + 证据) | QA Agent(客观判定,不主观放行) |
| **二次验收 + git push** 🧑 | Done 列的卡 + QA 报告 + PR | 人在 Done 列做最终审 → 满意则 push(产品红线);不满意打回退回 Agent 执行中 | 合并/发布 | **人** |
| 返工闭环 | 打回反馈 | CODEX-FIX-PROMPT + FIXES.md | 修复 → 回 QA e2e 门复判 | Codex → QA Agent |

**进入下一步的门槛**:需求确认通过 → 才设计;设计确认通过 → 才研发;lint/tsc/build 过 → 才进 QA;**e2e 覆盖全部验收标准且全绿 → 待验收通过 → 请人二次验收 → push**。

---

## 📦 产品节点固定交付物:Sprint Spec(机器可导入)

每个 Sprint 的需求,**统一用这个 JSON 结构**(字段固定,可被"一键导入"直接消费,也映射 DB 的 Sprint/BacklogItem/Task)。

```json
{
  "sprint": {
    "name": "Sprint 2 - 闭环加固",
    "goal": "一句话本 Sprint 目标(walking skeleton 之上加固什么)",
    "startDate": "2026-06-18",
    "endDate": "2026-06-25"
  },
  "epics": [
    { "code": "E3", "title": "Agent 执行流水线", "value": "核心差异化", "priority": "P0", "targetSprint": "S2" }
  ],
  "stories": [
    {
      "code": "US-8",
      "epic": "E3",
      "title": "一句话标题",
      "priority": "P1",
      "userStory": "作为 <角色>, 我想要 <动作>, 以便于 <价值>",
      "acceptanceCriteria": "Given <前置>\nWhen <动作>\nThen <预期>",
      "tasks": [
        "[BE] ...",
        "[FE] ...",
        "[TEST] 🛡 ..."
      ]
    }
  ]
}
```

**字段规则(固定)**
- `sprint.name/goal/startDate/endDate` 必填
- 每个 `story` 必含:`code`(US-x)、`title`、`priority`(P0-P3)、`userStory`(Cohn 三段)、`acceptanceCriteria`(Gherkin,`\n` 分行)、`tasks[]`
- `🛡` 标记守护任务(测试/边界/门禁),`[BE]/[FE]/[TEST]/[INFRA]` 标类型
- `epics[]` 可选;新 Epic 在这里声明,已有 Epic 用 `epic` 字段引用 code

> 这个结构 = 人确认的需求单 + 一键导入的输入 + DB 落库的数据,**三合一**。PM Agent 产出它、你确认它、系统导入它。

---

## 🔌 一键导入(Sprint Spec → 看板上的新 Sprint)

两种落地方式,共用上面的 Sprint Spec 格式:

**A. 直接生成(现在就能用)** —— `scripts/import-sprint.mjs <spec.json>`
把 seed-sprint1 的逻辑通用化:读一个 Sprint Spec JSON → 在 DB 创建 Sprint + Epics + Stories + Tasks。任何人(含 Agent)跑一条命令即可拉起一个新 Sprint。

**B. 应用内一键导入(Sprint 2 候选功能)** —— 看板上一个「导入 Sprint」按钮
粘贴/上传 Sprint Spec JSON → server action 校验(zod)→ 落库 → 看板出现新 Sprint。本质是把 A 的脚本搬进 UI。

**推荐路径**:先做 A(脚本,立即可用,也是 B 的后端);B 作为 Sprint 2 的一个 story 进 backlog。

---

## 角色固定分工
- **人类 Lead**:需求确认 · 设计稿确认 · git push(三个闸门)
- **PM/设计/QA Agent**:Sprint Spec、backlog、设计、测试、验收报告
- **研发 Agent(Codex)**:实现 + 返工

> **测试职责分离(强制)**:
> - **客观门槛归实现者**:`lint` / `tsc` / `build` / **单元测试** 由研发 Agent(Codex)交付前自跑——这些是二元、没法作弊的编译门,不过就别交付。
> - **判断性验收归 QA**:**验收 e2e 由 QA Agent 独立编写**,从 story/设计稿出发,不看实现细节——实现者不写自己的验收测试(会"自己批作业",漏掉自己做错的边界)。
> - QA 验收时**会重跑** lint/tsc/build(双重门,非重复)。依据:Sprint 1 的红线崩溃(approve ZodError)正是被 QA 的独立 e2e 抓到的。

### 布局/弹层类缺陷:三道防线(e2e 有盲区,别只靠它)

> 教训(US-8 导入框):弹窗溢出、底部按钮被裁、点遮罩丢输入——**e2e 没抓到**。原因:Playwright 点击前会自动把元素滚进视口,**掩盖"溢出/被裁"**;且特定视口/缩放难复现。这类布局/弹层/关闭行为是 **e2e 的结构性盲区**,必须多层兜。

1. **建对(实现时·主防线)**:`DESIGN-SPEC.md` 的「弹层规范」是硬约束——每个弹窗/抽屉/下拉必须明确:**z 层级 · `max-h` · 内部滚动(底部按钮永远可见) · 防误关丢输入**。凡涉及弹层的 Codex 提示词,**必须复述这 4 项**,并把「底部按钮在视口内可见」「有输入点外不丢」写进验收标准。
2. **守回归(e2e)**:弹层 e2e 在**小视口**下断言 `toBeInViewport({ratio:1})` + 点遮罩不丢输入。**承认局限**:抓不全所有视口/缩放,但能挡"谁删了 max-h"这种回归。
3. **兜底(人类二次验收·视觉清单)**:e2e 兜不住的交给肉眼门。每个弹层/新页面,二次验收过一遍:
>    - [ ] 小窗口下,底部操作按钮可见?
>    - [ ] 内容超长时,弹窗**内部**滚动(不是整页/被裁)?
>    - [ ] 有输入时点遮罩/Esc,**不静默丢内容**?
>    - [ ] 移动端高度用 `dvh`,地址栏不抖?

### 研发环境陷阱:改了 Prisma schema 后必须重启 dev server

> 教训(Sprint 3 红线):Codex 改了 `schema.prisma`(加 `headSha`/`redlineStatus`)+ migrate + generate,但**长跑的 `next dev` 进程没重启**。Turbopack 会**热更新源码**,但**不会重载内存里已加载的 Prisma client**(它在 `src/generated/prisma`)。结果:新代码在跑、却用着旧 client,查询拿不到新字段 → `headRef` 为空 → 红线解锁被静默跳过、任务却照样进 done。表现像"代码 bug",实为旧进程。**害我们白点了两次「通过验收」。**

**铁律:任何 `prisma migrate` / `prisma generate` / schema 改动之后,必须重启 dev server**(`next dev` 不够,要杀进程重起),否则运行时用的是旧 client。验收若出现"DB 状态变了、外部副作用(GitHub/邮件等)没发生"的诡异不一致,**第一个怀疑对象就是 dev server 没重启**。

---

## 📁 文档归档约定(固定文件夹 + 生命周期)

所有产出统一放进**代码仓库的 `docs/`**(与代码同仓、随 git 版本化),结构固定:

```
docs/
├── PRODUCT-RESEARCH.md        # 长期(一次性前置产物)
├── WORKFLOW.md                # 长期(本手册)
├── SCRUM-BACKLOG.md           # 长期·活文档,持续更新
├── design/
│   ├── DESIGN-SPEC.md         # 长期(token/组件规范)
│   └── mockups/               # 原型 *.html
└── sprints/
    └── sprint-N/              # 每个 Sprint 一个文件夹
        ├── sprint-spec.json   # 固定格式需求单(节点①交付物)
        ├── acceptance.md      # 验收标准
        ├── verify-*.md        # 验收报告(静态/运行时)
        └── codex-prompts/     # 交接/打回/修复提示词
```

**生命周期(Sprint 结束怎么处理)——不删,分三类:**
| 类别 | 处理 |
|---|---|
| 长期资产(docs/ 根 + design/) | **保留**,跨 Sprint 复用 |
| 每-Sprint 记录(sprints/sprint-N/) | **归档不删** —— 审计/回顾的证据链 |
| 真临时(test-results/、playwright-report/、build 产物) | **不入库**(已 .gitignore) |

> 新 Sprint 开始 = 新建 `docs/sprints/sprint-N/`;旧的留着不动。
> 代码侧的测试/脚本(`tests/`、`scripts/seed-*.mjs`)留在原位,不进 docs。

### 产出规则(强制,所有 Agent 必须遵守)
1. **所有文档产出一律放进代码仓库 `docs/`**:长期资产进 `docs/` 根或 `docs/design/`;每-Sprint 记录进 `docs/sprints/sprint-N/`。
2. **禁止往别处丢临时文件**——不在仓库根、不在其它项目目录(如 CareerAdvisor 的 project_dir)散落产出。
3. **临时/构建产物不入库**(`test-results/`、`playwright-report/`、各种 build 输出),保持 `.gitignore`。
4. **命名固定**:沿用上面的文件名/结构(`sprint-spec.json`、`acceptance.md`、`verify-*.md`、`codex-prompts/`),不随意另起。
5. **不删历史**:Sprint 结束只归档、不删除每-Sprint 记录。
6. **给 Codex 的实现提示词必须列全输入路径**:`sprint-spec.json` 路径 + `DESIGN-SPEC.md` 路径 + **每个相关设计稿的精确路径**(逐 story 对到稿),并注明"给文件不给截图、像素级照稿"。涉及弹层的还要复述「弹层规范」4 项。
