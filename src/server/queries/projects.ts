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

export async function getProjectForUser(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      members: {
        some: {
          userId,
        },
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      sprints: {
        include: {
          tasks: {
            include: {
              assignee: true,
              backlogItem: true,
              githubRefs: {
                orderBy: {
                  createdAt: "desc",
                },
                take: 1,
              },
              updates: {
                include: {
                  actor: true,
                },
                orderBy: {
                  createdAt: "desc",
                },
                take: 2,
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
      },
      backlog: {
        orderBy: [
          {
            type: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
        take: 100,
      },
      _count: {
        select: {
          backlog: true,
          blockers: {
            where: {
              status: "open",
            },
          },
          decisions: true,
          githubRefs: true,
          sprints: true,
          tasks: true,
        },
      },
    },
  });
}
