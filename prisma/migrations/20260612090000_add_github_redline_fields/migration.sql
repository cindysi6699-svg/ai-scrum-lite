ALTER TABLE "GithubRef" ADD COLUMN "headSha" TEXT;
ALTER TABLE "GithubRef" ADD COLUMN "redlineStatus" TEXT;

CREATE INDEX "GithubRef_headSha_idx" ON "GithubRef"("headSha");
