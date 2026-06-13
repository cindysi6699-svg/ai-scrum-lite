# Helmsman 设计规格(Design Spec)

> 唯一视觉事实来源 = `design/*.html`。本文件把其中的 token 抽出来,供 Next.js + shadcn/ui 实现时**精确对齐**。
> 实现栈:**Next.js (App Router) + Tailwind + shadcn/ui + lucide-react**。

---

## 1. 颜色 token → shadcn CSS 变量

直接替换 `app/globals.css` 的 `:root`(浅色)。这是 shadcn 的 theming 方式,组件会自动套用。

```css
:root{
  --background: #f7f7f8;        /* 页面底 paper */
  --foreground: #18181b;        /* 主文字 ink-900 */
  --card: #ffffff;
  --card-foreground: #18181b;
  --popover: #ffffff;
  --popover-foreground: #18181b;
  --muted: #fafafa;             /* 次级面板 */
  --muted-foreground: #71717a;  /* 次级文字 ink-500 */
  --border: #e4e4e7;            /* line */
  --input: #e4e4e7;
  --primary: #4f7cff;           /* 强调色,全站唯一 */
  --primary-foreground: #ffffff;
  --ring: #4f7cff;
  --radius: 0.75rem;            /* 12px,卡片 */
}
```

**语义状态色(shadcn 不自带,自定义)** —— 全站只用这几种,不要新增颜色:

| 用途 | 文字/描边 | 浅底 | 含义 |
|---|---|---|---|
| 运行中 / 进行中 | `#4f7cff` (primary) | `#eef2ff` | agent 执行、In Progress |
| 待验收 / 有风险 | `#b45309` (amber-700) | `#fffbeb` (amber-50) | 等人验收 |
| 打回 / 错误 / 返工 | `#be123c` (rose-700) | `#fff1f2` (rose-50) | 被打回、agent 异常 |
| 通过 / 完成 | `#047857` (emerald-700) | `#ecfdf5` (emerald-50) | 测试过、已验收、Done |
| 中性 / 空闲 | `#a1a1aa` (ink-400) | `#fafafa` | 空闲、未指派 |

> ⚠️ **颜色锁**:primary 只有 `#4f7cff` 一个,agent 与人类**靠图标区分,不靠第二个强调色**。

---

## 2. 圆角 / 间距 / 字体

- **圆角**:卡片 `rounded-xl`(12px)· 卡内小块/按钮 `rounded-lg`(8px)· 徽章 `rounded`(4px)· 状态点/头像 `rounded-full`。**不要混用,严格按此。**
- **字体**:正文 **Inter**(`next/font` 引入,非 `<link>`);**ID、分支名、PR号、时间戳一律等宽** `font-mono`(JetBrains Mono / ui-monospace)。
- **卡片阴影**:`box-shadow: 0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06);`(可做成 `.shadow-card` 工具类)
- **字号**:页标题 `text-lg/xl font-semibold` · 卡片标题 `text-sm` · 元信息 `text-[11px] text-muted-foreground`。

---

## 3. 组件 → shadcn 映射(关键:用现成组件,别手搓)

先跑 `shadcn-component-discovery` 确认,再 `npx shadcn@latest add`:

| 设计里的元素 | shadcn 组件 | 备注 |
|---|---|---|
| 看板卡片 / KPI / 项目卡 | `card` | |
| 状态徽章(运行/待验收/返工/完成) | `badge` | 按上面语义色做 variant |
| 指派 agent 选择器 | `popover` + `command` | 在线可选、离线 disabled |
| Backlog 折叠(Epic) | `accordion` 或 `collapsible` | |
| 验收标准勾选 | `checkbox` | |
| 通过 / 打回 按钮 | `button`(default + `destructive`/`outline`) | |
| 验收队列 / 收件箱列表 | `table` 或自定义 list | |
| 进度条(sprint / agent 吞吐) | `progress` | |
| 燃尽图 | `chart`(Recharts) | shadcn Chart |
| 顶栏 / 侧边栏 | `sidebar`(推荐 sidebar-07 block) | **正式版用左侧边栏,非顶部 tab** |
| 工作区切换 / 用户菜单 | `dropdown-menu` | |
| 代码 diff | 无官方组件 → `react-diff-view` 或自定义 `<pre>` | 用上面 emerald/rose 语义色 |
| 图标 | `lucide-react` | shadcn 原生,统一 `strokeWidth={2}` |

---

## 4. 实现纪律(避免 AI 走样)

1. **以 HTML 为像素级标尺**:间距、圆角、字号、颜色一一对齐,不自由发挥。
2. **一次一页**:先 dashboard-home,再 board,再 review;每页做完截图比对再下一页。
3. **保留所有状态**:运行中(脉冲点)、离线 disabled、打回态、空状态、空 sprint——HTML 里都画了,不要只做"成功态"。
4. **红线**:验收页的"未验收 · push 被阻止"是产品硬约束,UI 上必须醒目。
5. **深色版**:`:root` 之外再补 `.dark` 变量即可(参考 `sprint1-mockup.html` 深色取值)。

---

## 4b. 弹层规范(模态 / 抽屉 / 下拉)—— 每个浮层必须明确这 4 项

> 由真实 bug 反推的硬规则:US-8 导入框曾因没写这些 → 内容溢出、底部按钮被裁、点外丢输入。**所有浮层(modal/drawer/dropdown)在设计稿和提示词里都要写清下面 4 项。**

**① 叠加层次(z-index,固定层级)**
- 顶栏 header `z-30` · 下拉菜单 `z-40` · 遮罩 `z-40` · 模态/抽屉 `z-50`。浮层永远盖在 header 之上。

**② 大小(必须设上限)**
- 模态:`w-full max-w-[560px]`,**`max-h-[85vh]`**(关键:别让它比视口高)。
- 抽屉:`w-full max-w-[560px]`,`h-[100dvh]`(用 dvh,非 vh,避免移动端地址栏抖动),从右侧滑入。

**③ 内部滚动(底部操作必须永远可见)**
- 浮层用 `flex flex-col`;**header / footer `shrink-0`(sticky 固定);中间内容区 `flex-1 overflow-y-auto`**。
- 结果:内容再长也是**内部滚动**,「确认/取消」这类底部按钮**永远在视口内**,不会被裁掉。这是 US-8 bug 的根因,必须照此实现。

**④ 关闭行为(防误关丢输入)**
- Esc 关闭;点遮罩关闭 —— 但**当存在未保存输入时,点遮罩不静默关闭**(`onPointerDownOutside` preventDefault,或弹二次确认)。不能让用户一点空白就丢掉填了一半的内容。
- 右上角 X 与底部「取消」始终可关。

> 给 Codex 的提示词里,凡涉及弹窗/抽屉,必须复述以上 4 项 + 在验收标准里加:「底部操作按钮在视口内可见(不需手动滚页)」「有输入时点遮罩不丢失」。

---

## 4c. 合并锁状态(Sprint 3 红线 · 看板卡片 + US-9 抽屉「关联 PR」区)

> 红线机制见 `docs/GITHUB-INTEGRATION.md`。UI 上把 PR 的 `helmsman/human-approval` 状态显示成一个**徽标**(`rounded` 4px,`lucide-react` 图标 `strokeWidth={2}`)。**复用第 1 节既有语义色,不新增颜色。**

| 状态(commit status) | 文案 | 图标 | 文字/描边 | 浅底 |
|---|---|---|---|---|
| `pending` 待批 | **合并已锁 · 待批** | `Lock` | `#b45309`(amber-700) | `#fffbeb` |
| `success` 已解锁 | **合并已解锁 · 批准人 {name}** | `LockOpen` | `#047857`(emerald-700) | `#ecfdf5` |
| `failure` 已打回 | **已打回 · 合并仍锁** | `Lock` | `#be123c`(rose-700) | `#fff1f2` |

- 徽标尺寸:`text-[11px]`,图标 `size-3.5`,`rounded px-1.5 py-0.5`,与现有状态徽章一致。
- **看板卡片**:在卡片底部元信息行加这枚徽标(有关联 PR 时才显示)。
- **US-9 抽屉「关联 PR」区**:每条 PR 行右侧显示锁状态;`success` 时把 `checksStatus` 位替换/并列为"已解锁 · 批准人"。
- 无关联 PR 的任务:**不显示**该徽标(不是所有任务都走 PR)。
- ⚠️ 三态文案不可歧义:`failure` 必须强调"**仍锁**",绝不能让人误以为打回=可合并。

---

## 5. 页面清单(对应文件)

| 页面 | 源文件 | 状态 |
|---|---|---|
| 项目总览主页 | `design/dashboard-home.html` | ✅ |
| Sprint 看板 + Backlog + 仪表盘 + 验收 | `design/sprint1-mockup-light.html` | ✅ |
| 深色版看板 + 验收(参考取色) | `design/sprint1-mockup.html` | 参考 |
