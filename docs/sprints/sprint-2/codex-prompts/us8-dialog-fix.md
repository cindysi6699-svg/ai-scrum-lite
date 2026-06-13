# US-8 打回:导入弹窗 S 类 bug(布局 + 误关)

> 人工二次验收发现,QA e2e 初版漏掉(Playwright 点击前自动滚入视口,掩盖了"按钮被裁"的问题)。现 QA 已加固 e2e,修完需全绿。

## 现象
1. 导入框内容超出页面、**没有滚动条**;内容一长,**底部「取消 / 导入并切换过去」按钮被挤出视口、看不见、点不到**。
2. **点框周围空白(遮罩)整个弹窗就消失**——填了一半的 JSON 直接丢。

## 根因
`DialogContent` 没设最大高度 + 内部滚动;遮罩点击默认关闭且无输入保护。违反 DESIGN-SPEC「弹层规范」第 ②③④ 条。

## 修法(`src/app/projects/[projectId]/sprint-menu.tsx`)
1. **结构**:`DialogContent` 改成 `flex flex-col max-h-[85vh]`;
   - header(标题栏)`shrink-0`
   - 中间内容区(来源切换 + textarea + 校验结果)`flex-1 overflow-y-auto`
   - footer(取消 / 导入)`shrink-0`
   → 内容再长也内部滚动,**底部按钮永远在视口内**。
2. **防误关**:当 `specJson.trim()` 非空时,点遮罩**不关闭**(`onPointerDownOutside={(e)=>{ if(specJson.trim()) e.preventDefault(); }}`,Esc 同理可加确认)。X 和「取消」仍可正常关闭。
3. textarea 自身可保留 `resize-y`,但弹窗整体高度受 `max-h-[85vh]` 约束。

## 验收(QA 会跑,需全绿)
- 弹窗打开后,**底部「导入并切换过去」按钮在视口内可见**(无需手动滚页)——e2e 用 `toBeInViewport()` 断言。
- textarea 填入长内容后,**内部出现滚动**,底部按钮仍可见可点。
- 填入内容后**点遮罩,弹窗不关闭、内容不丢**;点 X / 取消可正常关闭。
- 原有功能不回归:合法 Spec 导入成功并切换;非法内联报错。

## 自检
`pnpm lint && pnpm exec tsc --noEmit && pnpm build`;现有 `sprint1-acceptance` + `sprint-import` 套件全绿。
