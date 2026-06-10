# Engineering Guidelines

## 1. Purpose

This project is a lightweight Scrum tool for AI/OPC delivery. The engineering goal is to keep the codebase simple, explicit, and easy for both humans and AI agents to extend safely.

Default principle:

> Prefer clear, boring, maintainable code over clever abstractions.

## 2. Current Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- NextAuth with GitHub OAuth
- Vercel
- Neon PostgreSQL

Do not introduce a new framework, state library, ORM, UI library, or backend service without a clear reason.

## 3. Directory Conventions

Use this structure as the project grows:

```text
src/
  app/
    api/
    dashboard/
    projects/
    ...
  components/
    ui/
    layout/
    domain/
  lib/
    auth.ts
    prisma.ts
    utils.ts
  server/
    actions/
    queries/
    permissions/
  types/
prisma/
  schema.prisma
  migrations/
docs/
```

Guidelines:

- `src/app` contains routes, layouts, and page composition.
- `src/components/ui` contains generic reusable UI primitives.
- `src/components/domain` contains feature-specific components.
- `src/server/actions` contains server actions that mutate data.
- `src/server/queries` contains server-side data reads.
- `src/server/permissions` contains role and authorization checks.
- `src/lib` is for shared infrastructure helpers.
- `docs` is the product and engineering source of truth.

## 4. Naming Rules

Use consistent names:

- Components: `PascalCase`, for example `ProjectCard`.
- Functions: `camelCase`, for example `createProject`.
- Files for components: `kebab-case.tsx` or route-native `page.tsx`.
- Server actions: verb-first, for example `createProjectAction`.
- Query helpers: noun or read-first, for example `getProjectList`.
- Database models: Prisma `PascalCase`.
- Database fields: Prisma `camelCase`.

Avoid vague names:

- Bad: `handleData`, `processThing`, `manager`.
- Good: `createSprint`, `updateTaskStatus`, `getOpenBlockers`.

## 5. TypeScript Rules

- Prefer explicit domain types where the data crosses module boundaries.
- Avoid `any`. Use `unknown` plus validation when needed.
- Use `zod` for form input validation and API/server-action payload validation.
- Do not silence TypeScript errors unless there is a documented reason.
- Keep functions small enough that their input, output, and side effects are obvious.

## 6. Next.js Rules

Default to Server Components.

Use Client Components only when needed for:

- Form interactivity.
- Local UI state.
- Drag and drop.
- Browser-only APIs.
- Optimistic UI.

Rules:

- Pages should compose UI and call server-side queries/actions.
- Avoid putting complex database logic directly inside page files.
- Keep route handlers thin.
- Use `getServerSession(authOptions)` for server-side auth checks.
- Redirect unauthenticated users before rendering protected pages.

## 7. Data Access Rules

All Prisma access should go through the shared client:

```ts
import { prisma } from "@/lib/prisma";
```

Do not instantiate `PrismaClient` in page files, components, or random helpers.

Use this split:

- Reads go in `src/server/queries`.
- Writes go in `src/server/actions`.
- Permission checks go in `src/server/permissions`.

## 8. Database And Prisma Rules

Every schema change must include a migration.

Use:

```bash
pnpm prisma:migrate
```

After schema changes, run:

```bash
pnpm prisma:generate
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Rules:

- Do not edit generated Prisma client files.
- Do not manually edit old migration files after they have been applied remotely.
- Use enums for stable workflow states.
- Keep `Done` and `Accepted` separate.
- Only Owner / Product Owner can mark a task as `accepted`.

## 9. Auth And Permission Rules

Authentication means the user has signed in.

Authorization means the user can perform an action in a project.

Do not confuse them.

Rules:

- Protected pages must require a session.
- Project actions must check membership.
- Owner-only actions must check `ProjectRole.owner`.
- AI agents can create updates, blockers, and GitHub refs.
- AI agents cannot accept tasks or change project ownership.

## 10. UI Rules

This is an operational Scrum tool, not a marketing site.

Design should be:

- Calm.
- Dense enough for repeated work.
- Easy to scan.
- Clear about status and ownership.

Use:

- Tables for comparable records.
- Boards for task workflow.
- Badges for status and priority.
- Forms for creation and editing.
- Dialogs only for focused actions.

Avoid:

- Decorative hero sections in app screens.
- Overly large cards inside cards.
- One-off styling when a reusable component is appropriate.
- Huge marketing copy on operational pages.

## 11. Environment Variables

Never commit:

- `.env`
- `.env.local`
- `env.vercel`
- Any file containing secrets.

Committed example file:

```text
.env.example
```

Required variables:

```env
DATABASE_URL=""
NEXTAUTH_URL=""
NEXTAUTH_SECRET=""
AUTH_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

Use the same value for `NEXTAUTH_SECRET` and `AUTH_SECRET` for now.

## 12. Git Rules

Commit focused changes.

Good commit examples:

```text
Add project creation flow
Add Sprint board status columns
Fix GitHub OAuth callback handling
```

Before committing:

```bash
pnpm verify
```

For route, auth, or deployment-sensitive changes, also run:

```bash
pnpm smoke
```

Never commit secrets, generated build output, or local cache files.

## 13. MVP Discipline

MVP should stay focused on:

- Project creation.
- Role management.
- Backlog.
- Sprint.
- Task updates.
- Blockers.
- Decisions.
- GitHub refs.
- Summary.

Do not add these in MVP unless explicitly decided:

- Billing.
- Multi-tenant organization management.
- Complex reporting.
- GitHub webhooks.
- MCP server.
- AI auto-orchestration.
- Custom workflow builder.
- Chat system.

## 14. Definition Of Done

A code task is done when:

- The requested behavior works locally.
- Relevant database changes have migrations.
- Auth and permission implications are handled.
- Empty/loading/error states are considered for user-facing screens.
- `lint`, `tsc`, and `build` pass.
- No secrets are staged.
- The change is committed with a clear message.
