const HUMAN_APPROVAL_CONTEXT = "helmsman/human-approval";
const DEFAULT_REPOSITORY = "cindysi6699-svg/ai-scrum-lite";

export type RedlineStatusState = "pending" | "failure";

type CommitStatusInput = {
  sha: string;
  description?: string;
  targetUrl?: string | null;
};

type GithubCommitStatusState = RedlineStatusState | "success";

function repositoryParts() {
  const repository = process.env.GITHUB_REPOSITORY ?? DEFAULT_REPOSITORY;
  const [owner, repo] = repository.split("/");

  if (!owner || !repo) {
    throw new Error("GITHUB_REPOSITORY must be formatted as owner/repo.");
  }

  return { owner, repo };
}

async function postCommitStatus(
  state: GithubCommitStatusState,
  input: CommitStatusInput,
) {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("GITHUB_TOKEN is required to update human approval status.");
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
        state,
        context: HUMAN_APPROVAL_CONTEXT,
        description:
          input.description ??
          (state === "pending"
            ? "Waiting for human acceptance in Helmsman."
            : state === "failure"
              ? "Human acceptance rejected in Helmsman."
              : "Human acceptance approved in Helmsman."),
        target_url: input.targetUrl ?? undefined,
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `GitHub commit status ${state} failed: ${response.status} ${detail}`,
    );
  }

  return response.json() as Promise<unknown>;
}

export async function setHumanApprovalPending(input: CommitStatusInput) {
  return postCommitStatus("pending", input);
}

export async function setHumanApprovalFailure(input: CommitStatusInput) {
  return postCommitStatus("failure", input);
}

export const humanApprovalContext = HUMAN_APPROVAL_CONTEXT;
