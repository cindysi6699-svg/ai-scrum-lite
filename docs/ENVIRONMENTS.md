# Helmsman 环境 / 分支 / 数据库(交接文档)

> 2026-06-14 重整。给 **Codex(agent-01)** 及任何在本仓库开发的人。
> **核心铁律:生产神圣;所有开发/测试一律走 `dev`,绝不碰 `main`/生产库/`.env.local`。**

## 1. 三个 git 分支
| 分支 | 用途 |
|---|---|
| **`main`** | 生产。Vercel 从 main **自动部署**到 `ai-scrum-lite.vercel.app`。**只接已验收的合并。** |
| **`dev`** | 开发/测试主分支。所有测试、S4 开发在这里。功能分支从 `dev` 切、合回 `dev`。 |
| **`agent-sandbox`** | agent PR 的测试基线,挂红线 ruleset(required check `helmsman/human-approval` + 空 bypass)。**agent 的 worktree/PR 打这里,绝不碰 main。** |

## 2. 两个数据库(Neon)
| 环境 | Neon host | 谁用 |
|---|---|---|
| **生产** | `ep-green-dawn-…` | `.env.local` 的 `DATABASE_URL` + Vercel **Production** 的 `DATABASE_URL`。**只读对待,别本地连。** |
| **dev** | `ep-holy-breeze-…` | `.env.dev.local` + Vercel **Preview** 的 `DATABASE_URL`。所有开发/测试读写这里。 |

> 旧的 `sprint3-redline` 隔离分支(乱、退役)**已删除**;`.env.sprint3.local` 已退役删除。别再引用它们。

## 3. env 文件(本地)
| 文件 | 内容 | git |
|---|---|---|
| `.env.local` | 生产 `DATABASE_URL` 等 | gitignore;**不读/不打印/不提交** |
| `.env.dev.local` | dev `DATABASE_URL` + `GITHUB_TOKEN` + `HELMSMAN_ENV=dev` | gitignore |
| `.env.example` | 模板 | 提交 |

## 4. 环境对应表(立好不再乱)
| | git 分支 | 数据库 | URL | 本地启动 |
|---|---|---|---|---|
| **生产** | `main` | 生产 Neon(ep-green-dawn) | `ai-scrum-lite.vercel.app` | 别本地连 |
| **开发** | `dev`(及功能分支) | dev Neon(ep-holy-breeze) | `dev-*.vercel.app` | `set -a; source .env.dev.local; set +a; pnpm dev` |

## 5. 怎么一眼分清当前在哪个环境
1. **页面顶部横幅**:非生产显示 **🧪 DEV · 非生产**(由 `HELMSMAN_ENV` 驱动,见 `src/app/layout.tsx` 的 `EnvBanner`);生产不设该变量 → 无横幅。
   - 本地:`.env.dev.local` 已设 `HELMSMAN_ENV=dev`。
   - Vercel 预览要显示横幅:在 **Preview** 环境也加 `HELMSMAN_ENV=dev`。
2. **URL**:`ai-scrum-lite.vercel.app` = 生产;`dev-*.vercel.app` / `localhost` = dev。

## 6. 铁律(开发必守)
- 开发/测试 = `dev` 分支 + `.env.dev.local` + dev 库(ep-holy-breeze) + `agent-sandbox`。
- **永不**在 `main` / `.env.local` / 生产库 上做开发或测试写入。
- 改 Prisma schema 后**必须重启 dev server**(否则旧 client 致诡异不一致,详见 `WORKFLOW.md`「研发环境陷阱」)。
- 合 `main` = 部署生产:**若带 migration,先对生产库 `migrate deploy` 再合**(详见 `WORKFLOW.md`「Git 分支与发布策略」)。
- agent 执行凭证最小权限、**无 merge / 无翻 success 通道**(红线,详见 `GITHUB-INTEGRATION.md`)。

## 7. 生产上的项目命名(2026-06-14 整理后)
- **`Helmsman`** = Helmsman 团队自己的 dogfood board(由原 `workflow-test-c` 改名),含 E1–E11 product backlog。
- **`Helmsman (旧 seed·待清理)`** = 旧 seed 残留,归档待删,**忽略**。
- **未来**:平台上线后接真实客户 = 在生产**新建独立项目**(测试项目不进生产)。

## 8. S4(双 agent 闭环)开发须知
- 在 **`dev` 分支**开发;agent 的 PR 打进 **`agent-sandbox`**;数据读写 **dev 库(ep-holy-breeze)**。
- 复用 S3 已建的红线机制(commit status `helmsman/human-approval` + 分支保护;**只有人类能翻 success / merge**)。
- 需求/验收标准见 `docs/sprints/sprint-4/sprint-spec.json` + `acceptance.md`;技术方案见 `docs/sprints/sprint-4/S4-discussion-brief.md`。
