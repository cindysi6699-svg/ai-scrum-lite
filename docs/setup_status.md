# AI Scrum Lite Setup Status

Last updated: 2026-06-10

## Confirmed Values

| Item | Value |
|---|---|
| GitHub username | `cindysi6699-svg` |
| Scrum Tool Repo URL | `https://github.com/cindysi6699-svg/ai-scrum-lite.git` |
| Repo private | No |
| Existing delivery project repo | No |
| Neon project | `ai-scrum-lite` |
| Neon region | `AWS US East 1 (N. Virginia)` |
| Database URL | Saved by owner, not stored in repo |
| Vercel connected to GitHub | Yes |
| Vercel project | `ai-scrum-lite` |
| Vercel production URL | Not available yet, no production deployment |
| GitHub OAuth App | `ai-scrum-lite-local` |
| GitHub OAuth Client ID | `Ov23liIDy3NXOtEJ81fU` |
| GitHub OAuth Client Secret | Saved by owner, not stored in repo |
| Auth secret | Saved by owner, not stored in repo |
| Node.js | `v25.8.1` |
| pnpm | `11.5.2` |
| Git | `git version 2.50.1 (Apple Git-155)` |
| Editor | Not confirmed |

## Local Environment Values To Fill

Create `.env.local` from `.env.example` and fill these values:

```env
DATABASE_URL="your-saved-neon-database-url"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-saved-auth-secret"
AUTH_SECRET="same-value-as-nextauth-secret"
GITHUB_CLIENT_ID="Ov23liIDy3NXOtEJ81fU"
GITHUB_CLIENT_SECRET="your-saved-github-oauth-client-secret"
```

Do not commit `.env.local`.

## Ready

- GitHub repo is known.
- Vercel project exists and is connected to GitHub.
- Neon project exists.
- GitHub OAuth local app exists.
- Local project has been initialized.
- Prisma schema validates.
- TypeScript, lint, and build checks passed before environment values were added.

## Still Needed

- Confirm editor choice.
- Fill `.env.local` locally.
- Run database migration against Neon.
- Start local dev server and test GitHub login.
- Commit the initial project files.
- Push to GitHub.
- Let Vercel create the first production deployment.
- Add the final Vercel production callback URL to GitHub OAuth App after deployment.
