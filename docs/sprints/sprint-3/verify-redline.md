# Sprint 3 验收报告(红线集成门 · agent-02)

> 代码:`agent/US-13-16-redline-workflow` @ f6bbff1
> 环境:隔离库 `sprint3-redline` + 细粒度 PAT(Contents/PR/Commit statuses)+ 仓库 `cindysi6699-svg/ai-scrum-lite` 的 `agent-sandbox` 分支(ruleset Active,required check `helmsman/human-approval`,空 bypass)
> 方式:对**真 GitHub** 跑红线状态机(commit status + 分支保护),非纯本地 e2e。

## 结果:通过 ✅

### 客观门(QA 重跑)
| 检查 | 结果 |
|---|---|
| lint / tsc / build | ✅ 全过 |
| prisma migration 落隔离库(GithubRef.headSha/redlineStatus) | ✅ |

### 红线集成(真 PR / 真 commit status / 真分支保护)
| Story | 验证 | 结果 |
|---|---|---|
| **US-13** 待验收即挂锁 | agent-pr.mjs 开真 PR(#1)→ 挂 `helmsman/human-approval=pending` → PR `mergeable_state=blocked` | ✅ |
| **US-14** 通过解锁 | `success` → `blocked`→`unstable`(= 必需检查已满足、可合并;非 clean 仅因无关的 Vercel 非必需检查) | ✅ |
| **US-15** 打回保持锁 | `failure` → 仍 `blocked`(锁不松) | ✅ |
| **US-16** 绕过必败 | 未批准直接 `PUT /pulls/1/merge` → **HTTP 405 被 GitHub 拒**(required status 未满足);worker 路径只挂 pending、无 success 调用点;翻 success 仅经人类 `requireHumanProjectMember` | ✅ |

### UI
- ✅ 写死假数据清除(`测试运行中 14/22`、假分支名等)
- ✅ 合并锁徽标接真实 `redlineStatus`(卡片 + US-9 抽屉),无 PR 时不显示

## 给人类二次验收的清单(e2e/集成兜不住的)
- [ ] 在 app「待验收」找到 US-13 卡片,徽标显示「合并已锁·待批」
- [ ] 亲手点「通过验收」→ 不报错、任务 in-place 转 done(同一张卡)、徽标变「合并已解锁·批准人」
- [ ] 回到 GitHub PR #1 页:合并按钮由灰变绿 → 由你决定 merge(最终 push 红线)
- [ ] 抽屉「关联 PR」区在小窗口下不溢出、内部可滚(弹层规范)

## 运行时复核(真 app 按钮,非仅 API)
人类在 app 点真「通过验收」→ `reviewTaskAction` → 翻 GitHub `success` → PR #1 解锁(`blocked`→`unstable`)→ 任务 in-place `done` + `redlineStatus=success`。**端到端通过。**
- 期间踩坑:dev server 用旧 Prisma client(没含新字段),致首两次点击"任务 done 但锁没开"。重启 dev server 后正常。已写进 `WORKFLOW.md`「研发环境陷阱」。代码本身正确。

## 验收员意见
4 个 story 的验收标准对真 GitHub 全部覆盖且通过,无回归。**红线为真**:失败/未批=GitHub 拒合并,人类批准=解锁,agent 无自批路径。→ **通过,流转到 Done。** 最终由人二次验收 + merge。

> 备注(留给 productize):mergeable_state 受无关的 Vercel 非必需检查干扰会显示 unstable;上线可在 ruleset 只认 `helmsman/human-approval`、或关掉 sandbox 的 Vercel 部署以得到干净的 clean。
