# AI Scrum Lite

Lightweight Scrum project management for AI/OPC delivery teams.

## MVP Scope

The MVP focuses on the Scrum delivery loop:

- GitHub login
- Projects
- Roles and AI agents
- Product Backlog
- Sprints
- Sprint Board
- Task updates
- Blockers
- Decision Log
- GitHub trace fields
- Sprint summaries

Detailed product and technical notes live in `docs/`.

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- NextAuth
- GitHub OAuth

## Local Setup

Copy `.env.example` to `.env.local` and fill in your real values:

```env
DATABASE_URL="your-neon-postgres-url"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-auth-secret"
AUTH_SECRET="same-value-as-nextauth-secret-for-future-authjs-compatibility"
GITHUB_CLIENT_ID="your-github-oauth-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-client-secret"
```

Use the same generated secret value for `NEXTAUTH_SECRET` and `AUTH_SECRET`.

## Commands

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

Useful checks:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

## Notes

- Do not commit `.env` or `.env.local`.
- `Done` means the executor believes the work is complete.
- `Accepted` means the Product Owner has verified and accepted it.
- Current setup status is tracked in `docs/setup_status.md`.
