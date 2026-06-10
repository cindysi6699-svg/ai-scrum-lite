import { prisma } from "@/lib/prisma";

export async function getProjectsForUser(userId: string) {
  return prisma.project.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    include: {
      members: true,
      sprints: {
        where: {
          status: "active",
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 1,
      },
      _count: {
        select: {
          backlog: true,
          blockers: {
            where: {
              status: "open",
            },
          },
          tasks: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}
