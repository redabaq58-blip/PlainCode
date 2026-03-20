import { notFound } from "next/navigation";
import { getSharedLink } from "@/lib/db/queries/shared-links";
import { BookOpen, Layers, Lightbulb, Database, Code2, GitBranch } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: { token: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const link = await getSharedLink(params.token);
  if (!link) return { title: "Not found" };
  return {
    title: `${link.explanation.titlePreview} — PlainCode`,
    description: link.explanation.summaryPreview,
  };
}

function Section({ title, icon, content }: { title: string; icon: React.ReactNode; content: string }) {
  if (!content) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon}
        {title}
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed">{content}</p>
    </div>
  );
}

export default async function SharePage({ params }: Props) {
  const link = await getSharedLink(params.token);
  if (!link) notFound();

  const { explanation } = link;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold hover:opacity-80">
            <Code2 className="h-5 w-5 text-primary" />
            PlainCode
          </Link>
          <Link
            href="/explain"
            className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
          >
            Try for free
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">{explanation.titlePreview}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Explained at {explanation.audienceLevel.replace(/_/g, " ")} level ·{" "}
            {new Date(explanation.createdAt).toLocaleDateString()}
          </p>
        </div>

        <Section title="Summary" icon={<BookOpen className="h-4 w-4 text-blue-500" />} content={explanation.summaryText} />
        <Section title="Breakdown" icon={<Layers className="h-4 w-4 text-purple-500" />} content={explanation.breakdownText} />
        <Section title="Analogy" icon={<Lightbulb className="h-4 w-4 text-yellow-500" />} content={explanation.analogyText} />
        <Section title="Data Map" icon={<Database className="h-4 w-4 text-green-500" />} content={explanation.dataMapText} />

        {link.showBadge && (
          <div className="pt-4 border-t border-border flex items-center justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-full px-3 py-1.5"
            >
              <Code2 className="h-3 w-3 text-primary" />
              Explained with PlainCode — free for everyone
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
