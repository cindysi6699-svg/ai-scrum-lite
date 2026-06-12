import { humanApprovalContext } from "./redline-status";

const DEFAULT_REPOSITORY = "cindysi6699-svg/ai-scrum-lite";

type CommitStatusInput = {
  sha: string;
  approvedByName?: string | null;
  targetUrl?: string | null;
};

function repositoryParts() {
  const repository = process.env.GITHUB_REPOSITORY ?? DEFAULT_REPOSITORY;
  const [owner, repo] = repository.split("/");

  if (!owner || !repo) {
    throw new Error("GITHUB_REPOSITORY must be formatted as owner/repo.");
  }

  return { owner, repo };
}

export async function setHumanApprovalSuccess(input: CommitStatusInput) {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("GITHUB_TOKEN is required to unlock human approval status.");
  }

  const { owner, repo } = repositoryParts();
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/statuses/${input.sha}`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        state: "success",
        context: humanApprovalContext,
        description: input.approvedByName
          ? `Approved by ${input.approvedByName} in Helmsman.`
          : "Human acceptance approved in Helmsman.",
        target_url: input.targetUrl ?? undefined,
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `GitHub commit status success failed: ${response.status} ${detail}`,
    );
  }

  return response.json() as Promise<unknown>;
}
