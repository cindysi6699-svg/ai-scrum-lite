// E2E 测试登录旁路:在 DB 里预置一个 human 测试用户 + 一条 NextAuth 数据库 Session。
// 不改任何生产代码 —— Playwright 带上同名 session cookie 即可通过 requireUser()。
// 用法:pnpm seed:e2e  然后  pnpm seed:sprint1(测试用户会成为 Helmsman 的 owner)。
import crypto from "node:crypto";

import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });
config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const SESSION_TOKEN = process.env.E2E_SESSION_TOKEN || "e2e-playwright-session-token";
const EMAIL = process.env.E2E_USER_EMAIL || "e2e@helmsman.local";

function normalizeDatabaseUrl(rawConnectionString) {
  const url = new URL(rawConnectionString);
  const sslMode = url.searchParams.get("sslmode");
  if (sslMode === "require" || sslMode === "prefer" || sslMode === "verify-ca") {
    url.searchParams.set("sslmode", "verify-full");
  }
  return url.toString();
}

const { Client } = pg;

async function main() {
  const client = new Client({ connectionString: normalizeDatabaseUrl(connectionString) });
  await client.connect();

  try {
    await client.query("BEGIN");
    const now = new Date();

    // 1. upsert 测试用户(human),并把 updatedAt 设为现在 → 成为最近用户,seed:sprint1 会选它做 owner
    const existing = await client.query('SELECT * FROM "User" WHERE "email" = $1', [EMAIL]);
    let user;
    if (existing.rows[0]) {
      user = (
        await client.query(
          'UPDATE "User" SET "name" = $2, "type" = $3::"UserType", "updatedAt" = $4 WHERE "email" = $1 RETURNING *',
          [EMAIL, "E2E Tester", "human", now],
        )
      ).rows[0];
    } else {
      user = (
        await client.query(
          'INSERT INTO "User" ("id", "name", "email", "type", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4::"UserType", $5, $6) RETURNING *',
          [crypto.randomUUID(), "E2E Tester", EMAIL, "human", now, now],
        )
      ).rows[0];
    }

    // 2. 刷新该用户的 Session(数据库会话策略)
    await client.query('DELETE FROM "Session" WHERE "userId" = $1 OR "sessionToken" = $2', [
      user.id,
      SESSION_TOKEN,
    ]);
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await client.query(
      'INSERT INTO "Session" ("id", "sessionToken", "userId", "expires") VALUES ($1, $2, $3, $4)',
      [crypto.randomUUID(), SESSION_TOKEN, user.id, expires],
    );

    await client.query("COMMIT");

    console.log(
      JSON.stringify(
        {
          ok: true,
          userId: user.id,
          email: EMAIL,
          sessionToken: SESSION_TOKEN,
          next: "运行 `pnpm seed:sprint1` 让此用户拥有 Helmsman 项目;Playwright 用此 token 作为 next-auth.session-token cookie。",
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
