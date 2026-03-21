"use client";
import { useEffect, useRef, useState } from "react";
import { GitBranch, Download } from "lucide-react";

interface Props {
  diagram: string;
}

function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```(?:mermaid)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}

export function FlowDiagram({ diagram }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [svg, setSvg] = useState("");

  useEffect(() => {
    if (!diagram || diagram === "none") return;

    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "strict" });
        const id = `diagram-${Math.random().toString(36).slice(2)}`;
        const cleaned = stripCodeFences(diagram);
        const { svg } = await mermaid.render(id, cleaned);
        setSvg(svg);
      } catch {
        setError(true);
      }
    })();
  }, [diagram]);

  const downloadSvg = () => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flow-diagram.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!diagram || diagram === "none") return null;
  if (error) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2 section-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <GitBranch className="h-4 w-4 text-primary" />
          Flow Diagram
        </div>
        {svg && (
          <button
            onClick={downloadSvg}
            className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Download SVG"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {svg ? (
        <div
          ref={containerRef}
          className="overflow-auto"
          // Safe: mermaid renders SVG server-side with strict security level
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="h-16 flex items-center justify-center">
          <span className="animate-pulse text-muted-foreground text-sm">Rendering diagram...</span>
        </div>
      )}
    </div>
  );
}
