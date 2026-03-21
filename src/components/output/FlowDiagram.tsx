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

function sanitizeMermaid(raw: string): string {
  let cleaned = stripCodeFences(raw);

  // Ensure it starts with a valid diagram type
  if (!/^(flowchart|graph)\s/i.test(cleaned)) {
    cleaned = `flowchart TD\n${cleaned}`;
  }

  // Quote node labels that contain special characters Mermaid can't parse.
  // Matches node definitions like:  A[label] A(label) A{label} A((label))
  // and wraps the inner label in quotes if it has problematic chars.
  cleaned = cleaned.replace(
    /(\w+)(\[|\(+|\{+)(.*?)(\]|\)+|\}+)/g,
    (_match, id, open, label, close) => {
      if (/[→←↔<>&"()[\]{}|#]/.test(label) && !label.startsWith('"')) {
        const escaped = label.replace(/"/g, "'");
        return `${id}${open}"${escaped}"${close}`;
      }
      return `${id}${open}${label}${close}`;
    }
  );

  return cleaned;
}

export function FlowDiagram({ diagram }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [svg, setSvg] = useState("");

  useEffect(() => {
    if (!diagram || diagram === "none") return;

    let cancelled = false;

    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          securityLevel: "loose",
          suppressErrorRendering: true,
        });

        const cleaned = sanitizeMermaid(diagram);

        // Validate syntax before rendering to avoid DOM-injected error SVGs
        const valid = await mermaid.parse(cleaned, { suppressErrors: true });
        if (!valid) {
          if (!cancelled) setError(true);
          return;
        }

        const id = `diagram-${Math.random().toString(36).slice(2)}`;
        const { svg: renderedSvg } = await mermaid.render(id, cleaned);

        // Clean up detached render element mermaid may leave behind
        document.getElementById(id)?.remove();

        if (!cancelled) setSvg(renderedSvg);
      } catch {
        if (!cancelled) setError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
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
