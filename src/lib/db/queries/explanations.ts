import { prisma } from "@/lib/db/client";
import type { AudienceLevel, ExplainMode } from "@/types/explanation";
import type { Prisma } from "@prisma/client";

export async function saveExplanation(data: {
  userId?: string;
  audienceLevel: AudienceLevel;
  mode: ExplainMode;
  privacyMode: boolean;
  outputLanguage: string;
  codeSnippetEnc?: string;
  codeSnippetIv?: string;
  codeBeforeEnc?: string;
  codeBeforeIv?: string;
  codeAfterEnc?: string;
  codeAfterIv?: string;
  summaryText: string;
  breakdownText: string;
  analogyText: string;
  dataMapText: string;
  confidenceScore: number;
  mermaidDiagram?: string;
  layer1Confidence?: number;
  layer3Passed?: boolean;
}) {
  const titlePreview = data.summaryText.split(".")[0].slice(0, 80);
  const summaryPreview = data.summaryText.slice(0, 150);

  return prisma.explanation.create({
    data: {
      ...data,
      audienceLevel: data.audienceLevel as Prisma.ExplanationCreateInput["audienceLevel"],
      mode: data.mode as Prisma.ExplanationCreateInput["mode"],
      titlePreview,
      summaryPreview,
    },
  });
}

export async function getExplanationById(id: string) {
  return prisma.explanation.findUnique({ where: { id } });
}

export async function getUserHistory(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.explanation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        audienceLevel: true,
        mode: true,
        outputLanguage: true,
        confidenceScore: true,
        titlePreview: true,
        summaryPreview: true,
        createdAt: true,
      },
    }),
    prisma.explanation.count({ where: { userId } }),
  ]);
  return { items, total, pages: Math.ceil(total / limit) };
}

export async function getMonthlyUsage(userId: string): Promise<number> {
  const yearMonth = new Date().toISOString().slice(0, 7); // "2026-03"
  const row = await prisma.monthlyUsage.findUnique({
    where: { userId_yearMonth: { userId, yearMonth } },
  });
  return row?.count ?? 0;
}

export async function incrementMonthlyUsage(userId: string): Promise<number> {
  const yearMonth = new Date().toISOString().slice(0, 7);
  const row = await prisma.monthlyUsage.upsert({
    where: { userId_yearMonth: { userId, yearMonth } },
    create: { userId, yearMonth, count: 1 },
    update: { count: { increment: 1 } },
  });
  return row.count;
}
