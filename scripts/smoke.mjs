const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

const checks = [
  {
    name: "Home page renders",
    path: "/",
    expect: async (response, body) => {
      assert(response.status === 200, `expected 200, got ${response.status}`);
      assert(body.includes("AI Scrum Lite"), "expected product name on home page");
      assert(body.includes("Start with GitHub") || body.includes("Dashboard"), "expected primary CTA");
    },
  },
  {
    name: "Dashboard is protected",
    path: "/dashboard",
    redirect: "manual",
    expect: async (response) => {
      assert(
        [302, 303, 307, 308].includes(response.status),
        `expected redirect for unauthenticated dashboard, got ${response.status}`,
      );
      const location = response.headers.get("location") ?? "";
      assert(location.includes("/api/auth/signin"), `expected signin redirect, got ${location}`);
    },
  },
  {
    name: "New project page is protected",
    path: "/projects/new",
    redirect: "manual",
    expect: async (response) => {
      assert(
        [302, 303, 307, 308].includes(response.status),
        `expected redirect for unauthenticated project creation, got ${response.status}`,
      );
      const location = response.headers.get("location") ?? "";
      assert(location.includes("/api/auth/signin"), `expected signin redirect, got ${location}`);
    },
  },
  {
    name: "Project workspace is protected",
    path: "/projects/smoke-project-id",
    redirect: "manual",
    expect: async (response) => {
      assert(
        [302, 303, 307, 308].includes(response.status),
        `expected redirect for unauthenticated project workspace, got ${response.status}`,
      );
      const location = response.headers.get("location") ?? "";
      assert(location.includes("/api/auth/signin"), `expected signin redirect, got ${location}`);
    },
  },
  {
    name: "NextAuth signin page renders",
    path: "/api/auth/signin",
    expect: async (response, body) => {
      assert(response.status === 200, `expected 200, got ${response.status}`);
      assert(body.toLowerCase().includes("github"), "expected GitHub provider on signin page");
    },
  },
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runCheck(check) {
  const response = await fetch(new URL(check.path, baseUrl), {
    redirect: check.redirect ?? "follow",
  });
  const body = await response.text();
  await check.expect(response, body);
}

console.log(`Running smoke checks against ${baseUrl}`);

for (const check of checks) {
  try {
    await runCheck(check);
    console.log(`✓ ${check.name}`);
  } catch (error) {
    console.error(`✗ ${check.name}`);
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
    break;
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}
