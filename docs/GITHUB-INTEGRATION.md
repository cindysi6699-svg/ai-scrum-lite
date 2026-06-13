# Helmsman × GitHub 集成(红线:人审前不许合并)

> 长期资产。本文定义产品红线「**人类批准前不许 push/合并**」如何在 GitHub 上**原生强制**。
> MVP 在 Sprint 3 落地;productize 升级路径在末尾。

## 0. 一句话机制

> agent 提 PR → Helmsman 在该 PR 的 head commit 上写一个 **commit status `helmsman/human-approval`**;**agent-sandbox 分支保护 require 这个 status**,所以 status≠success 时 **GitHub 自己拒绝合并**。人类点「通过验收」→ status=success → 合并解锁。**挡合并的是 GitHub,不是我们的服务端**——这才是真红线。

## 1. 为什么用 Commit Statuses,而不是 Check Runs

- **Check Runs API 只有 GitHub App 能写**;Personal Access Token(含细粒度 PAT)**写不了 check runs**。所以细粒度 PAT 的权限列表里**根本没有 "Checks"**。
- **Commit Statuses API(老的 Statuses API)PAT 能写**,而且分支保护的「Require status checks to pass」**同样认 commit status 的 context 名**。功能等价,满足红线。
- 结论:**MVP 用 Commit Statuses + PAT**;等 productize 换 **GitHub App + Check Runs**(独立 UI 面板、更漂亮),context 名保持 `helmsman/human-approval` 不变,平滑升级。

## 2. 红线状态机(commit status: context = `helmsman/human-approval`)

| 触发 | status | PR 在 GitHub | 看板 |
|---|---|---|---|
| 任务进「待验收」(US-13) | `pending` | 无法合并(等待 helmsman/human-approval) | 卡片/抽屉:合并已锁(待批) |
| 人类点「通过验收」(US-14) | `success` | 可合并(mergeable_state=clean) | done · 已解锁(批准人) |
| 人类点「打回」(US-15) | `failure` | 仍无法合并 | in_progress · 已打回 / 合并仍锁 |

## 3. 环境与配置(Sprint 3 / 研发测试阶段)

- **目标仓库**:`cindysi6699-svg/ai-scrum-lite`(本仓库;未上线,只有我们自己用)。
- **基线分支**:`agent-sandbox`(**不是 main**)。agent 的 PR 都打进它 → 分支保护只挂这里 → **零干扰 main 上的日常开发**。
- **agent 分支前缀**:`agent/US-xx-*`,方便事后批量清理 PR 噪音。
- **隔离数据库**:`.env.sprint3.local` 的 `DATABASE_URL` 指向 Neon 分支 `sprint3-redline`(production 快照、独立 endpoint)。所有自动流读写打这里,**真实库不动**。

### 3.1 分支保护(在 `agent-sandbox` 上手动配)
- ✅ Require a pull request before merging
- ✅ Require status checks to pass → 添加 context **`helmsman/human-approval`**
- ✅ **Do not allow bypassing the above settings / Include administrators** ← 关键:否则 admin token 一样能绕,红线变演戏

### 3.2 Token(细粒度 PAT,放 `.env.sprint3.local` 的 `GITHUB_TOKEN`)
- Resource owner:`cindysi6699-svg`;Repository:仅 `ai-scrum-lite`
- 权限(最小):**Contents (RW)** · **Pull requests (RW)** · **Commit statuses (RW)**(Metadata 自动 Read)
- **不给 Administration / Checks**(分支保护手动配,Checks 用不上)
- **永不落日志、永不提交**(`.env*.local` 已 gitignore)

## 4. 安全模型:agent 不能自批

红线的命门是「**只有人能翻 success**」。MVP 用单个 PAT,因此靠**代码路径隔离 + 会话校验**保证:

1. **翻 `status=success` 的函数只在人类 approve action 里被调用**,入口 `requireHumanMember(session)` 校验当前是已登录的人类成员。
2. **worker / PR 伪造器 / 未来真 agent 的执行路径,绝不引用这个函数**——它们只会写 `pending`、开 PR、推分支。
3. 即便 PAT 物理上有 statuses:write 能力,agent 侧代码**没有调用点**,故无法自批。
4. 分支保护 include administrators 兜底:就算 status 没翻,任何人(含 admin)也合不了。

> **productize 升级**:把凭证拆成两套——**worker token**(Contents/PR,只能干活)与**审批身份**(GitHub App 代表"人审"事件),物理隔离,比代码路径隔离更硬。

## 5. 验证红线为真(不是 UI 摆设)

- US-13:挂 pending 后查 GitHub,该 PR `mergeable_state=blocked`。
- US-14:approve 后 `mergeable_state=clean`;看板同一张卡(id 不变)=done。
- US-15:打回后仍 `blocked`。
- US-16:未批准直接调 merge API → **GitHub 拒**(required status 未满足);agent 路径翻不动 success。

## 6. productize 升级路径(Sprint 4+,不在本 Sprint)
1. **GitHub App** 取代 PAT(安装级 token、细粒度、可吊销、代表组织)。
2. **Check Runs** 取代 Commit Statuses(独立审批面板 UI)。
3. **Webhook**:PR opened → 自动挂 pending(取代"进待验收时挂");PR merged → 自动归档。
4. **真 agent 执行**取代脚本伪造器(轻量自管编排 → Managed Agents)。
5. **多仓库 / 多租户**:每个 project 绑自己的 repo + App 安装。
