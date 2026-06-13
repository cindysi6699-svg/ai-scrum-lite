# 给 Codex 的移植 Prompt(直接复制粘贴)

> 用法:把下面整段贴给 Codex,**同时把 `design/` 目录下的 HTML 和 DESIGN-SPEC.md 一起加入它的上下文**(给文件,不要给截图)。

---

你的任务:把已有的高保真 HTML 原型**像素级移植**成 Next.js + shadcn/ui 实现。

**唯一视觉事实来源**:`design/dashboard-home.html` 和 `design/sprint1-mockup-light.html`。这两个文件是可运行的真实 HTML/Tailwind,**不是参考、是标准**。每一个间距、颜色、圆角、字号都要 1:1 还原。**不要凭自己审美重新设计。**

**技术栈(锁死,不要漂移)**:
- Next.js App Router + TypeScript
- Tailwind + shadcn/ui(组件用 `npx shadcn@latest add`,不要手搓)
- 图标:`lucide-react`,统一 `strokeWidth={2}`
- 字体:用 `next/font` 引 Inter;ID/分支/PR号/时间戳用等宽字体

**设计 token**:严格按 `design/DESIGN-SPEC.md`。先把里面的 `:root` CSS 变量写进 `app/globals.css`,primary 全站只用 `#4f7cff`,语义色(amber 待验收 / rose 打回 / emerald 完成 / primary 运行中)按规格表,**不要新增颜色**。

**组件映射**:按 DESIGN-SPEC 第 3 节。开始前先运行 `shadcn-component-discovery` skill 找现成组件(看板卡=Card、徽章=Badge、指派=Popover+Command、Backlog=Accordion、进度=Progress、燃尽图=Chart、diff 用 react-diff-view)。

**工作方式(重要,这样还原度才高)**:
1. **一次只做一个页面**,顺序:① 主页 dashboard-home → ② 看板 board → ③ 验收 review → ④ Backlog/仪表盘视图。
2. 每做完一页,**自己截图,和对应 HTML 并排比对**,列出差异(间距/颜色/字号/对齐),修到看不出差别,再做下一页。
3. **保留所有状态**:运行中脉冲点、离线 agent 置灰 disabled、打回态(rose 描边 + "打回:xxx" + 返工次数)、空状态、空 Sprint 引导。HTML 里都画了,逐个还原。
4. 完成一页后运行 `shadcn-component-review` skill 审查是否贴合 shadcn 规范(间距漂移、硬编码颜色、缺 data-slot 等)。

**硬约束(产品红线,UI 必须体现)**:验收页"未经人类验收,push 被阻止"——这个状态要醒目(锁图标 + amber 提示条)。

**导航**:正式版用**左侧边栏**(shadcn sidebar block),不要照搬原型顶部 tab——原型顶栏只是演示。主页是工作区入口(所有项目),点进项目才是 看板/Backlog/仪表盘/验收。

先只做第 ① 页,做完截图给我比对,我确认后再继续。
