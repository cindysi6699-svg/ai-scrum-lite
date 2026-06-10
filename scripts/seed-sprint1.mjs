import crypto from "node:crypto";

import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });
config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const { Client } = pg;

function newId() {
  return crypto.randomUUID();
}

async function insertOne(client, sql, params) {
  const result = await client.query(sql, params);
  return result.rows[0];
}

const epics = [
  {
    code: "E1",
    title: "核心 Scrum 看板",
    value: "协作底座",
    priority: "P0",
    targetSprint: "S1",
  },
  {
    code: "E2",
    title: "Agent 作为一等成员",
    value: "核心差异化",
    priority: "P0",
    targetSprint: "S1",
  },
  {
    code: "E3",
    title: "Agent 执行流水线",
    value: "核心差异化",
    priority: "P0",
    targetSprint: "S1-S2",
  },
  {
    code: "E4",
    title: "状态自动回填",
    value: "消灭手工回填",
    priority: "P0",
    targetSprint: "S2",
  },
  {
    code: "E5",
    title: "人类审批闸门",
    value: "质量掌舵权",
    priority: "P0",
    targetSprint: "S1-S2",
  },
  {
    code: "E6",
    title: "多 agent 可观测面板",
    value: "解决多 agent 不透明",
    priority: "P1",
    targetSprint: "S3",
  },
  {
    code: "E7",
    title: "反馈返工闭环增强",
    value: "提升返工效率",
    priority: "P2",
    targetSprint: "S3+",
  },
];

const stories = [
  {
    code: "US-1",
    epic: "E1",
    title: "看板与 Story 基础",
    userStory:
      "As a 团队 Lead, I want to 在看板上创建 user story 并在列间流转, so that 我有一个承载人和 agent 工作的底座。",
    acceptanceCriteria:
      "Given 我在一个 sprint 看板上\nWhen 我新建一个 user story 并把它从「To Do」拖到「In Progress」\nThen 该 story 显示在「In Progress」列,且记录了状态变更时间",
    tasks: [
      "[BE] Story / Sprint / 看板列 的数据模型 + CRUD API",
      "[BE] 状态变更记录(谁、何时、从哪列到哪列)",
      "[FE] 看板视图:列 + 卡片 + 拖拽流转",
      "[TEST] 🛡 状态机单元测试:非法流转(如跳过验收直达 Done)必须被拒",
    ],
  },
  {
    code: "US-2",
    epic: "E2",
    title: "把 Story 指派给 Agent",
    userStory:
      "As a Lead, I want to 把一个 story 指派给某个 AI agent, so that agent 能领走这件可验证的活。",
    acceptanceCriteria:
      "Given 一个 agent 已注册并在线\nAnd 一个 story 处于「To Do」\nWhen 我把该 story 的负责人设为该 agent\nThen story 进入「Agent 执行中」状态\nAnd 系统记录指派人、agent、时间",
    tasks: [
      "[BE] Agent 注册与在线状态(心跳/last-seen)",
      "[BE] story 负责人可设为 agent;写入指派人/agent/时间",
      "[FE] 指派 UI:人 / agent 统一的负责人选择器",
      "[BE] 🛡 防呆:只能指派给「在线」agent;离线指派给出明确报错",
      "[TEST] 🛡 并发指派/重复指派的幂等性测试",
    ],
  },
  {
    code: "US-3",
    epic: "E3",
    title: "Agent 自动执行并提 PR",
    userStory:
      "As a Lead, I want to agent 领取后自动开分支、写码、跑测试并提 PR, so that 我不用手把手带它干每一步。",
    acceptanceCriteria:
      "Given 一个 story 已指派给 agent\nWhen agent 领取该任务\nThen 系统为它创建一个以 story 命名的分支\nAnd agent 提交代码并运行测试\nAnd 测试通过后自动开启一个关联该 story 的 PR\nAnd story 自动流转到「待验收」列",
    tasks: [
      "[INFRA] Agent 领取任务的接口/事件(认领锁,防多 agent 抢同一 story)",
      "[INFRA] 按 story 自动建分支(命名规范 + 冲突处理)",
      "[INFRA] agent 提交代码 → 触发测试 → 通过后开 PR(关联 story)",
      "[BE] PR 与 story 双向关联,story 自动进「待验收」",
      "[TEST] 🛡 测试不过 = 不开 PR、不进待验收",
      "[BE] 🛡 单 story 执行超时 / agent 卡死的兜底",
      "[BE] 🛡 完整执行日志(每步留痕,供事后排查 AI 出的问题)",
    ],
  },
  {
    code: "US-4",
    epic: "E5",
    title: "人类验收闸门",
    userStory:
      "As a Lead, I want to 在 PR 合并/push 前对 agent 产出做验收, so that 我保留对质量的最终控制权。",
    acceptanceCriteria:
      "Scenario: 验收通过\nGiven 一个 story 处于「待验收」且有关联 PR\nWhen 我点「通过验收」\nThen 该 PR 才被允许合并/push\nAnd story 流转到「Done」\n\nScenario: 验收打回\nGiven 一个 story 处于「待验收」\nWhen 我点「打回」并填写反馈\nThen PR 被阻止合并\nAnd story 退回「Agent 执行中」并附带我的反馈",
    tasks: [
      "[BE] push/merge 硬门禁:未「通过验收」一律阻止",
      "[FE] 验收队列:待验收 story + 关联 PR diff 一屏可看",
      "[FE] 「通过」/「打回 + 反馈」操作",
      "[BE] 打回:PR 阻止合并,story 退回「Agent 执行中」并挂上反馈",
      "[BE] 🛡 审计:每次通过/打回记录验收人、时间、反馈",
      "[TEST] 🛡 绕过门禁的尝试必须失败",
    ],
  },
  {
    code: "US-5",
    epic: "E4",
    title: "状态自动回填",
    userStory:
      "As a Lead, I want to 看板状态随 agent 的真实进度自动更新, so that 看板永远反映现实、我不用手动维护。",
    acceptanceCriteria:
      "Given 一个 story 已指派给 agent\nWhen agent 开始执行 / 提交 PR / 被打回\nThen 对应 story 自动在「执行中 / 待验收 / 返工中」之间流转,无需人工拖动",
    tasks: [
      "[BE] 监听 agent 事件(开始/提 PR/被打回)→ 驱动 story 流转",
      "[FE] 看板状态实时刷新,无需手动拖动",
      "[BE] 🛡 事件与真实 git/PR 状态对账,冲突时以真实状态为准 + 告警",
      "[TEST] 🛡 乱序/重复事件下状态不被写花",
    ],
  },
];

const roadmap = [
  "R1 – Walking Skeleton(S1): US-1..5, 单 agent 闭环",
  "R2 – 闭环加固(S2): E3/E4/E5 完整化, 返工循环可用",
  "R3 – 规模化可观测(S3): E6 多 agent 面板 + E7 结构化反馈",
  "R4 – 小团队 GTM(S4+): 多人协作、权限、定价",
];

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query("BEGIN");

    const ownerResult = await client.query(
      'SELECT * FROM "User" ORDER BY "updatedAt" DESC LIMIT 1',
    );
    const owner = ownerResult.rows[0];

    if (!owner) {
      throw new Error(
        "No user found. Sign in with GitHub before seeding Sprint 1 data.",
      );
    }

    await client.query('DELETE FROM "Project" WHERE "name" = $1', ["Helmsman"]);

    const now = new Date();
    const project = await insertOne(
      client,
      `INSERT INTO "Project"
        ("id", "name", "description", "goal", "repoUrl", "status", "createdById", "createdAt", "updatedAt")
       VALUES
        ($1, $2, $3, $4, $5, $6::"ProjectStatus", $7, $8, $9)
       RETURNING *`,
      [
        newId(),
        "Helmsman",
        "Dogfood project for AI Scrum Lite. Working name: Helmsman.",
        "让一个小团队的 Lead 能把 user story 派发给多个 AI agent, agent 自动开分支/写码/测/提 PR 并回填看板; 所有产出必须经人类验收才能 push。",
        "https://github.com/cindysi6699-svg/ai-scrum-lite",
        "active",
        owner.id,
        now,
        now,
      ],
    );

    await client.query(
      `INSERT INTO "ProjectMember"
        ("id", "projectId", "userId", "role", "displayName", "createdAt", "updatedAt")
       VALUES
        ($1, $2, $3, $4::"ProjectRole", $5, $6, $7)`,
      [
        newId(),
        project.id,
        owner.id,
        "owner",
        owner.name ?? owner.email ?? "Product Owner",
        now,
        now,
      ],
    );

    const sprint = await insertOne(
      client,
      `INSERT INTO "Sprint"
        ("id", "projectId", "name", "goal", "status", "startDate", "endDate", "createdAt", "updatedAt")
       VALUES
        ($1, $2, $3, $4, $5::"SprintStatus", $6, $7, $8, $9)
       RETURNING *`,
      [
        newId(),
        project.id,
        "Sprint 1 - Walking Skeleton",
        "跑通单 agent 的完整闭环: 派发一个 story → agent 干活提 PR → 人类验收/打回 → 看板状态自动更新。",
        "active",
        new Date("2026-06-10T00:00:00.000Z"),
        new Date("2026-06-17T00:00:00.000Z"),
        now,
        now,
      ],
    );

    const epicByCode = new Map();

    for (const epic of epics) {
      const item = await insertOne(
        client,
        `INSERT INTO "BacklogItem"
          ("id", "projectId", "title", "description", "type", "priority", "status", "createdById", "createdAt", "updatedAt")
         VALUES
          ($1, $2, $3, $4, $5::"WorkItemType", $6::"Priority", $7::"BacklogStatus", $8, $9, $10)
         RETURNING *`,
        [
          newId(),
          project.id,
          `${epic.code} ${epic.title}`,
          `价值: ${epic.value}\n目标 Sprint: ${epic.targetSprint}`,
          "epic",
          epic.priority,
          "ready",
          owner.id,
          now,
          now,
        ],
      );

      epicByCode.set(epic.code, item);
    }

    for (const story of stories) {
      const parent = epicByCode.get(story.epic);
      const backlogItem = await insertOne(
        client,
        `INSERT INTO "BacklogItem"
          ("id", "projectId", "parentId", "title", "description", "type", "priority", "status", "userStory", "acceptanceCriteria", "createdById", "createdAt", "updatedAt")
         VALUES
          ($1, $2, $3, $4, $5, $6::"WorkItemType", $7::"Priority", $8::"BacklogStatus", $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          newId(),
          project.id,
          parent?.id ?? null,
          `${story.code} ${story.title}`,
          story.userStory,
          "story",
          "P0",
          "in_sprint",
          story.userStory,
          story.acceptanceCriteria,
          owner.id,
          now,
          now,
        ],
      );

      for (const taskTitle of story.tasks) {
        await client.query(
          `INSERT INTO "Task"
            ("id", "projectId", "sprintId", "backlogItemId", "title", "description", "type", "priority", "status", "userStory", "acceptanceCriteria", "createdById", "createdAt", "updatedAt")
           VALUES
            ($1, $2, $3, $4, $5, $6, $7::"WorkItemType", $8::"Priority", $9::"TaskStatus", $10, $11, $12, $13, $14)`,
          [
            newId(),
            project.id,
            sprint.id,
            backlogItem.id,
            taskTitle,
            `From ${story.code}: ${story.title}`,
            "task",
            taskTitle.includes("🛡") || taskTitle.includes("[TEST]") ? "P1" : "P0",
            "todo",
            story.userStory,
            story.acceptanceCriteria,
            owner.id,
            now,
            now,
          ],
        );
      }
    }

    await client.query(
      `INSERT INTO "Decision"
        ("id", "projectId", "madeById", "type", "title", "decision", "reason", "impact", "reversible", "createdAt", "updatedAt")
       VALUES
        ($1, $2, $3, $4::"DecisionType", $5, $6, $7, $8, $9, $10, $11)`,
      [
        newId(),
        project.id,
        owner.id,
        "scope",
        "Sprint 1 walking skeleton scope",
        "Sprint 1 focuses on single-agent dispatch -> PR -> human acceptance/rework -> board status update. Multi-agent observability is deferred.",
        "Prove the core loop before scaling to multiple agents.",
        roadmap.join("\n"),
        true,
        now,
        now,
      ],
    );

    await client.query("COMMIT");

    console.log(
      JSON.stringify(
        {
          project: project.name,
          projectId: project.id,
          sprint: sprint.name,
          epics: epics.length,
          stories: stories.length,
          tasks: stories.reduce((sum, story) => sum + story.tasks.length, 0),
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
