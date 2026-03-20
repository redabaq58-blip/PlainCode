import { requireAuth } from "@/lib/auth/utils";
import { getUserHistory } from "@/lib/db/queries/explanations";
import Link from "next/link";
import { History, Sparkles, BookOpen } from "lucide-react";
import { AUDIENCE_LEVELS } from "@/constants/audience-levels";
import type { AudienceLevel } from "@/types/explanation";

export default async function HistoryPage() {
  const session = await requireAuth();
  const { items, total, pages } = await getUserHistory(session.user.id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-6">
        <History className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">History</h1>
        <span className="text-sm text-muted-foreground">({total} explanations)</span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-3">
          <BookOpen className="h-10 w-10 mx-auto opacity-30" />
          <p>No explanations yet.</p>
          <Link href="/explain" className="text-primary hover:underline text-sm flex items-center justify-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            Explain your first code snippet
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const level = AUDIENCE_LEVELS.find((l) => l.value === (item.audienceLevel as AudienceLevel));
            return (
              <Link
                key={item.id}
                href={`/explain?id=${item.id}`}
                className="block rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{item.titlePreview}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.summaryPreview}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      {level?.short ?? item.audienceLevel}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
