"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/session";

const createProjectSchema = z.object({
  name: z.string().trim().min(2, "Project name must be at least 2 characters."),
  description: z.string().trim().optional(),
  goal: z.string().trim().optional(),
  repoUrl: z
    .string()
    .trim()
    .url("Repo URL must be a valid URL.")
    .optional()
    .or(z.literal("")),
});

function emptyToNull(value: string | undefined) {
  return value && value.length > 0 ? value : null;
}

export async function createProjectAction(formData: FormData) {
  const user = await requireUser();

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    goal: formData.get("goal"),
    repoUrl: formData.get("repoUrl"),
  });

  if (!parsed.success) {
    const message = encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid input");
    redirect(`/projects/new?error=${message}`);
  }

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      description: emptyToNull(parsed.data.description),
      goal: emptyToNull(parsed.data.goal),
      repoUrl: emptyToNull(parsed.data.repoUrl),
      createdById: user.id,
      members: {
        create: {
          userId: user.id,
          role: "owner",
          displayName: user.name ?? user.email ?? "Project Owner",
        },
      },
    },
  });

  revalidatePath("/dashboard");
  redirect(`/dashboard?created=${project.id}`);
}
