# AI Agent Workflow

## 1. Purpose

This document tells AI coding agents how to work inside AI Scrum Lite without losing project context or creating messy changes.

The project owner is the final Product Owner. AI agents can propose, implement, test, and summarize, but must not silently change product scope.

## 2. First Files To Read

Before making meaningful changes, read:

```text
docs/mvp_feature_list.md
docs/data_model.md
docs/page_flow.md
docs/engineering_guidelines.md
docs/setup_status.md
```

For database work, also read:

```text
prisma/schema.prisma
```

For auth work, also read:

```text
src/lib/auth.ts
src/lib/prisma.ts
```

## 3. Working Rules

Always preserve these constraints:

- Database is the source of truth.
- Tasks are the center of updates, blockers, decisions, and GitHub refs.
- `Done` does not mean `Accepted`.
- Only Owner can accept work.
- AI agents can submit updates but cannot silently change Sprint scope.
- Secrets must never be committed.

## 4. Task Intake Format

When starting a task, clarify or infer:

```text
Task goal:
User impact:
Files likely affected:
Database changes needed:
Auth/permission impact:
Validation needed:
```

If scope is ambiguous, choose the smallest useful MVP version.

## 5. Implementation Flow

Use this order:

1. Read relevant docs and files.
2. Inspect current code patterns.
3. Make the smallest coherent change.
4. Add or update validation.
5. Add database migration if schema changed.
6. Run checks.
7. Summarize exactly what changed.

## 6. Preferred Code Patterns

Use Server Components by default.

Use Server Actions for mutations:

```text
src/server/actions/
```

Use server queries for reads:

```text
src/server/queries/
```

Use permission helpers for role checks:

```text
src/server/permissions/
```

Use Zod schemas for form input validation:

```text
src/server/validation/
```

If a directory does not exist yet, create it only when the first real feature needs it.

## 7. Auth Rules

For protected server pages:

```ts
const session = await getServerSession(authOptions);

if (!session?.user) {
  redirect("/api/auth/signin");
}
```

For project-level mutations:

1. Require session.
2. Load project membership.
3. Check role.
4. Perform mutation.

Do not trust client-side role checks.

## 8. Database Change Rules

If `prisma/schema.prisma` changes:

```bash
pnpm prisma:migrate
pnpm prisma:generate
```

Then run:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Do not manually edit generated files in:

```text
src/generated/
```

## 9. UI Rules For Agents

Operational pages should prioritize:

- Fast scanning.
- Clear status.
- Clear ownership.
- Obvious next action.
- Good empty states.

Use compact, stable layouts. Avoid decorative marketing patterns in authenticated app screens.

## 10. Testing And Verification

At minimum run:

```bash
pnpm verify
```

For route, auth, or deployment-sensitive changes, also run:

```bash
pnpm smoke
```

For database changes, also run:

```bash
pnpm prisma validate
```

For auth changes, verify:

- Unauthenticated users are redirected.
- Authenticated users can access the protected page.
- Sign out works.

## 11. Commit Rules

Before commit:

```bash
git status --short
```

Check that these are not staged:

```text
.env
.env.local
env.vercel
.next/
node_modules/
src/generated/
```

Commit message should be short and behavior-focused:

```text
Add project creation flow
Add role management screen
Fix dashboard auth redirect
```

## 12. Agent Progress Update Format

When reporting back, use:

```json
{
  "role": "coding_agent",
  "status": "done | blocked | needs_review",
  "progress": "What changed",
  "files_changed": ["path/to/file"],
  "checks": ["pnpm lint", "pnpm exec tsc --noEmit", "pnpm build"],
  "blockers": [],
  "next_step": "Suggested next action",
  "needs_human_decision": false
}
```

## 13. Stop Conditions

Stop and ask the Product Owner when:

- A change would expand MVP scope.
- A destructive database migration is needed.
- A production secret is missing.
- A role/permission decision is ambiguous.
- A user-facing workflow has two plausible product behaviors.

Do not stop for routine implementation details that can be safely inferred from the existing codebase.
