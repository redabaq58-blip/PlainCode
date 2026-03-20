"use client";
import { CopyButton } from "./CopyButton";
import { cn } from "@/lib/utils/cn";

interface Props {
  title: string;
  icon: React.ReactNode;
  content: string;
  isStreaming?: boolean;
  className?: string;
}

export function SectionCard({ title, icon, content, isStreaming, className }: Props) {
  if (!content && !isStreaming) return null;

  return (
    <div className={cn("rounded-lg border border-border bg-card p-4 space-y-2 section-fade-in", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {icon}
          {title}
        </div>
        {content && <CopyButton text={content} />}
      </div>
      <div className="text-sm text-foreground/90 leading-relaxed prose prose-sm dark:prose-invert max-w-none">
        {content || (
          <span className="text-muted-foreground flex items-center gap-1">
            <span className="animate-pulse">●</span>
            Generating...
          </span>
        )}
      </div>
    </div>
  );
}
