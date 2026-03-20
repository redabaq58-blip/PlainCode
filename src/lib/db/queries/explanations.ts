import { prisma } from "@/lib/db/client";
import type { AudienceLevel, ExplainMode } from "@/types/explanation";
import type { Prisma } from "@prisma/client";

interface SaveExplanationData {
  audienceLevel: AudienceLevel;
  mode: ExplainMode;
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
}

export async function saveExplanation(data: SaveExplanationData) {
  const titlePreview = data.summaryText.split(".")[0].slice(0, 80) || "Untitled";
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
