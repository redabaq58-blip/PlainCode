"use client";
import { Code2, Download } from "lucide-react";

interface RoastCardProps {
  score: number;
  scoreLabel: "Defense Score" | "Ship Score";
  repoName: string;
  topFindings: string[];
  techStack: string;
  id?: string;
}

function scoreHex(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

function scoreGlow(score: number): string {
  if (score >= 80) return "0 0 48px rgba(34,197,94,0.25)";
  if (score >= 60) return "0 0 48px rgba(245,158,11,0.25)";
  return "0 0 48px rgba(239,68,68,0.25)";
}

function truncate(s: string, n = 68): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export function RoastCard({
  score,
  scoreLabel,
  repoName,
  topFindings,
  techStack,
  id = "roast-card",
}: RoastCardProps) {
  const color = scoreHex(score);
  const findings = topFindings.slice(0, 3);
  const techTokens = techStack
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6);

  async function handleDownload() {
    const html2canvas = (await import("html2canvas")).default;
    const el = document.getElementById(id);
    if (!el) return;
    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: "#0d1117",
      useCORS: true,
      logging: false,
    });
    const link = document.createElement("a");
    link.download = `${repoName || "repo"}-roast.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full overflow-x-auto">
      {/* Card — always dark, fixed width for consistent PNG output */}
      <div
        id={id}
        style={{
          backgroundColor: "#0d1117",
          border: `1px solid ${color}33`,
          boxShadow: `0 0 0 1px ${color}1a, 0 24px 64px rgba(0,0,0,0.6)`,
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          width: "680px",
          flexShrink: 0,
          borderRadius: "16px",
          padding: "36px",
        }}
      >
        {/* Top row: Logo + repo name */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Code2 style={{ width: "18px", height: "18px", color: "#60a5fa", flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: "15px", color: "#f1f5f9", letterSpacing: "-0.01em" }}>
              PlainCode
            </span>
          </div>
          <span
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              fontSize: "13px",
              color: "#64748b",
              maxWidth: "260px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {repoName || "unknown/repo"}
          </span>
        </div>

        {/* Score hero + progress bar */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "24px", marginBottom: "28px" }}>
          <div style={{ flexShrink: 0 }}>
            <div
              style={{
                fontSize: "96px",
                fontWeight: 900,
                lineHeight: 1,
                color,
                textShadow: scoreGlow(score),
                letterSpacing: "-0.04em",
              }}
            >
              {score}
            </div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8", marginTop: "4px", letterSpacing: "0.02em" }}>
              {scoreLabel.toUpperCase()}
            </div>
          </div>
          <div style={{ flex: 1, marginBottom: "20px" }}>
            <div
              style={{
                height: "6px",
                backgroundColor: "#1e293b",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${score}%`,
                  backgroundColor: color,
                  borderRadius: "999px",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
              <span style={{ fontSize: "11px", color: "#334155" }}>0</span>
              <span style={{ fontSize: "11px", color: "#334155" }}>100</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid #1e293b", marginBottom: "24px" }} />

        {/* Findings */}
        <div style={{ marginBottom: "24px" }}>
          <p
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#475569",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            Top Issues
          </p>
          {findings.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {findings.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <span style={{ color: "#ef4444", fontSize: "13px", flexShrink: 0, marginTop: "1px" }}>✕</span>
                  <span style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: 1.5 }}>
                    {truncate(f)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "13px", color: "#334155" }}>No critical issues found</p>
          )}
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid #1e293b", marginBottom: "20px" }} />

        {/* Bottom: Tech stack + badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", flex: 1 }}>
            {techTokens.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  backgroundColor: "#1e293b",
                  color: "#94a3b8",
                  fontWeight: 500,
                }}
              >
                {t}
              </span>
            ))}
          </div>
          <p style={{ fontSize: "11px", color: "#334155", flexShrink: 0, whiteSpace: "nowrap" }}>
            Roasted by PlainCode · plaincode-production.up.railway.app
          </p>
        </div>
      </div>

      {/* Download button — outside the card so it doesn't appear in the PNG */}
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 border border-border text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
      >
        <Download className="h-4 w-4" />
        Download as PNG
      </button>
    </div>
  );
}
