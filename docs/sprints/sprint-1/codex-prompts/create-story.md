# 给 Codex 的提示词:实现「新建 Story」表单

> 用法:把下面整段贴给 Codex,并把 `design/sprint1-mockup-light.html`(看板里点「新建 Story」会弹出的那个弹窗)和 `design/DESIGN-SPEC.md` 作为文件加入上下文。**给文件,不要给截图。**

---

任务:实现「新建 Story」弹窗,接到看板「新建 Story」按钮上,提交调用已有的 `createStoryTaskAction`。

**视觉事实来源**:`design/sprint1-mockup-light.html` 里 `#story-modal` 这个弹窗。**像素级还原**它的布局、间距、颜色、圆角、字号,不要重新设计。token 见 `design/DESIGN-SPEC.md`。

**技术栈(锁死)**:Next.js App Router + TypeScript + shadcn/ui + lucide-react。
- 弹窗用 shadcn `dialog`
- 优先级用 shadcn `toggle-group`(或 `select`)
- 输入框/文本域用 shadcn `input` / `textarea` / `label`
- 图标用 lucide-react,`strokeWidth={2}`

**字段(严格按下表,后端没有的字段一律不要加)**:

| 表单字段 | 控件 | 后端字段 | 规则 |
|---|---|---|---|
| 标题 | Input | `title` | 必填,空则禁用提交 |
| 用户故事(作为/我想要/以便于) | 3 个 Input | `userStory` | **后端是单文本字段**。把三段按 "作为<X>,我想要<Y>,以便于<Z>" 拼接后存入 `userStory`,不要拆成 3 个独立字段 |
| 验收标准 | Textarea | `acceptanceCriteria` | 多行,每行一条,以换行拼接存入单文本字段 |
| 优先级 | ToggleGroup P0/P1/P2/P3 | `priority` enum | 默认选中 **P1**(对齐后端当前写死值);让用户可改 |

**明确不要做**(后端无字段,加了会报错):
- ❌ 故事点 storyPoints —— Prisma 无此字段
- ❌ 标签 tags —— Prisma 无此字段
- 在表单底部保留原型里那条灰色说明:"故事点、标签 后端暂无字段,待加 schema 后再补"

**提交逻辑**:
- 调用现有 `createStoryTaskAction({ title, userStory, acceptanceCriteria, priority })`
- 复用它已有的入参/校验;不要新建重复的 server action
- 成功后关闭弹窗 + 刷新看板(`revalidatePath` 或 router.refresh),新 story 出现在「To Do」列
- 失败时在弹窗内内联报错(不要只 toast)

**交互细节(原型已体现,逐一还原)**:
- 点遮罩 / 取消 / X / Esc 都能关闭
- 标题为空时「创建 Story」禁用
- 优先级选中态:蓝底白字(`--primary`),每项左侧小色点(P0 rose / P1 amber / P2 blue / P3 zinc)
- label 在控件上方,helper 文字常驻

完成后:跑 `shadcn-component-review` 审查规范,并自己截图和 `#story-modal` 并排比对,修到无差异。
