import { prisma } from "@/lib/db/client";

export async function createSharedLink(explanationId: string, userId?: string) {
  const { nanoid } = await import("nanoid");
  const token = nanoid(12);
  return prisma.sharedLink.create({
    data: { token, explanationId, userId },
  });
}

export async function getSharedLink(token: string) {
  return prisma.sharedLink.findUnique({
    where: { token },
    include: { explanation: true },
  });
}
