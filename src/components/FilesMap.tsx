import { MapPin } from "lucide-react";

export interface FileEntry {
  path: string;
  importance: "critical" | "important" | "supporting";
  reason: string;
}

interface FilesMapProps {
  files: FileEntry[];
}

const IMPORTANCE_CONFIG = {
  critical: {
    dot: "bg-red-500",
    label: "Critical",
    labelColor: "text-red-500",
  },
  important: {
    dot: "bg-yellow-500",
    label: "Important",
    labelColor: "text-yellow-500",
  },
  supporting: {
    dot: "bg-slate-400",
    label: "Supporting",
    labelColor: "text-slate-400",
  },
};

export function FilesMap({ files }: FilesMapProps) {
  if (files.length === 0) return null;

  const groups = {
    critical: files.filter((f) => f.importance === "critical"),
    important: files.filter((f) => f.importance === "important"),
    supporting: files.filter((f) => f.importance === "supporting"),
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary shrink-0" />
        <h2 className="text-sm font-semibold text-foreground">Files That Matter</h2>
      </div>

      <div className="space-y-3">
        {(["critical", "important", "supporting"] as const).map((level) => {
          const group = groups[level];
          if (group.length === 0) return null;
          const cfg = IMPORTANCE_CONFIG[level];
          return (
            <div key={level} className="space-y-1.5">
              <p className={`text-xs font-semibold uppercase tracking-wide ${cfg.labelColor}`}>
                {cfg.label}
              </p>
              {group.map((file) => (
                <div key={file.path} className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${cfg.dot}`} />
                  <div className="min-w-0">
                    <span className="text-xs font-mono text-foreground/80 break-all">
                      {file.path}
                    </span>
                    {file.reason && (
                      <span className="text-xs text-muted-foreground"> — {file.reason}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
