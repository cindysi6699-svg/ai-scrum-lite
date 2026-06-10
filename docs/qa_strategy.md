# QA Strategy

## 1. Why This Exists

The Product Owner should not be the tester of first resort. Each feature should ship with a small, repeatable verification path so obvious failures are caught before handoff.

The MVP quality goal:

> No feature is considered done just because it compiles.

## 2. Required Checks Before Handoff

Run:

```bash
pnpm verify
```

This includes:

- ESLint.
- TypeScript.
- Production build.

For route/auth smoke checks, run the app first:

```bash
pnpm dev
```

Then in another terminal:

```bash
pnpm smoke
```

For production:

```bash
SMOKE_BASE_URL=https://ai-scrum-lite.vercel.app pnpm smoke
```

## 3. Feature Acceptance Pattern

Every feature should define:

```text
Happy path:
Empty state:
Validation failure:
Unauthorized behavior:
Persistence check:
Post-deploy check:
```

Example for Project creation:

```text
Happy path: signed-in user creates a project and sees it on Dashboard.
Empty state: signed-in user with no projects sees "No projects yet".
Validation failure: missing project name shows an error.
Unauthorized behavior: signed-out user is redirected to sign in.
Persistence check: project and owner membership are written to the database.
Post-deploy check: Vercel URL loads and protected routes redirect correctly.
```

## 4. Bug Handling

When a bug appears:

1. Reproduce it with exact route and action.
2. Add the bug to this checklist format.
3. Fix the smallest cause.
4. Run `pnpm verify`.
5. Run `pnpm smoke` when route/auth behavior is involved.
6. Commit the fix.

## 5. Current Smoke Coverage

The smoke script currently checks:

- Home page renders.
- Dashboard is protected.
- New project page is protected.
- Project workspace page is protected.
- NextAuth sign-in page renders with GitHub provider.

This is intentionally small and fast. Add checks as the MVP grows.

## 6. Not Covered Yet

These need future automated coverage:

- Authenticated project creation flow.
- Role management.
- Backlog CRUD.
- Sprint board state changes.
- Task updates.
- Blockers.
- Decisions.
- GitHub refs.

Authenticated E2E tests will likely need a test auth mode or a dedicated test account. Do not rely on the Product Owner to manually verify every release.
