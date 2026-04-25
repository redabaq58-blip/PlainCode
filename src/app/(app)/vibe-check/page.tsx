"use client";
import { useState } from "react";
import {
  Zap,
  Loader2,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Lock,
  Key,
  BookOpen,
  Terminal,
  Package,
  Flame,
} from "lucide-react";
import { GithubUrlInput } from "@/components/ui/GithubUrlInput";
import { RoastCard } from "@/components/RoastCard";
import type { CheckResult } from "@/app/api/vibe-check/route";

type Phase = "input" | "fetching" | "analyzing" | "results";

const CHECK_POINTS: Record<string, number> = {
  secrets: 25,
  env_vars: 15,
  readme: 15,
  console_logs: 15,
  error_handling: 15,
  dependencies: 15,
};

const CHECKS_META = [
  {
    category: "secrets",
    name: "No Hardcoded Secrets",
    desc: "No API keys, tokens, or passwords in code",
    pts: 25,
    Icon: Lock,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  {
    category: "env_vars",
    name: "Env Vars Documented",
    desc: "All env vars in README or .env.example",
    pts: 15,
    Icon: Key,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
  {
    category: "readme",
    name: "README with Setup",
    desc: "README exists with install instructions",
    pts: 15,
    Icon: BookOpen,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    category: "console_logs",
    name: "No Debug Logs",
    desc: "No console.log left in production code",
    pts: 15,
    Icon: Terminal,
    color: "text-slate-500",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
  },
  {
    category: "error_handling",
    name: "Error Handling",
    desc: "Async calls wrapped in try/catch",
    pts: 15,
    Icon: AlertCircle,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  {
    category: "dependencies",
    name: "Pinned Dependencies",
    desc: "Dependency file present with locked versions",
    pts: 15,
    Icon: Package,
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
];

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
}

function scoreRingColor(score: number): string {
  if (score >= 80) return "stroke-green-500";
  if (score >= 60) return "stroke-amber-500";
  return "stroke-red-500";
}

function ScoreRing({ score }: { score: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-border" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`}
          className={scoreRingColor(score)}
        />
      </svg>
      <span className={`text-2xl font-bold ${scoreColor(score)}`}>{score}</span>
    </div>
  );
}

export default function VibeCheckPage() {
  const [phase, setPhase] = useState<Phase>("input");
  const [repoUrl, setRepoUrl] = useState("");
  const [error, setError] = useState("");
  const [fileCount, setFileCount] = useState(0);
  const [shipScore, setShipScore] = useState(0);
  const [techStack, setTechStack] = useState("");
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [showRoastCard, setShowRoastCard] = useState(false);

  async function handleStart() {
    if (!repoUrl.trim()) return;
    setError("");
    setShowRoastCard(false);
    setPhase("fetching");

    try {
      const fetchRes = await fetch("/api/fetch-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: repoUrl.trim() }),
      });
      const fetchData = await fetchRes.json();
      if (!fetchRes.ok) {
        setError(fetchData.error ?? "Failed to fetch repository");
        setPhase("input");
        return;
      }

      setFileCount(fetchData.fileCount);
      setPhase("analyzing");

      const auditRes = await fetch("/api/vibe-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoCode: fetchData.repoCode }),
      });
      const auditData = await auditRes.json();
      if (!auditRes.ok) {
        setError(auditData.error ?? "Failed to audit repository");
        setPhase("input");
        return;
      }

      setShipScore(auditData.shipScore);
      setTechStack(auditData.techStack ?? "");
      setChecks((auditData.checks as CheckResult[]).sort((a, b) => a.id - b.id));
      setPhase("results");
    } catch {
      setError("Connection error. Please try again.");
      setPhase("input");
    }
  }

  function handleReset() {
    setPhase("input");
    setRepoUrl("");
    setError("");
    setFileCount(0);
    setShipScore(0);
    setTechStack("");
    setChecks([]);
    setShowRoastCard(false);
  }

  const repoName = repoUrl.replace(/\/$/, "").split("/").pop() ?? "repo";
  const passedCount = checks.filter((c) => c.passed).length;

  const topFindings = checks
    .filter((c) => !c.passed && c.findings.length > 0)
    .map((c) => `${c.name}: ${c.findings[0].detail}`)
    .slice(0, 3);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Zap className="h-6 w-6 text-yellow-500" />
          Vibe Check
        </h1>
        <p className="text-sm text-muted-foreground">
          6 ship-readiness checks on any public GitHub repo — secrets, docs, debug
          logs, error handling, and more. Scored out of 100.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Phase: input ── */}
      {phase === "input" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">GitHub repository URL</span>
              <GithubUrlInput
                value={repoUrl}
                onChange={setRepoUrl}
                onSubmit={handleStart}
                placeholder="https://github.com/owner/repo"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">Public repos only · no sign-up required</p>
            </label>

            <button
              onClick={handleStart}
              disabled={!repoUrl.trim()}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="h-4 w-4" />
              Run Vibe Check
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* 6-check preview grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CHECKS_META.map((m) => (
              <div
                key={m.category}
                className={`rounded-lg border ${m.border} ${m.bg} p-3 space-y-1`}
              >
                <div className="flex items-center gap-1.5">
                  <m.Icon className={`h-3.5 w-3.5 ${m.color} shrink-0`} />
                  <span className="text-xs font-semibold text-foreground leading-tight">{m.name}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-snug">{m.desc}</p>
                <p className={`text-xs font-bold ${m.color}`}>{m.pts} pts</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Phase: fetching / analyzing ── */}
      {(phase === "fetching" || phase === "analyzing") && (
        <div className="rounded-lg border border-border bg-card p-8 space-y-6">
          <div className="space-y-4">
            {[
              {
                label: "Fetching repository files",
                done: phase === "analyzing",
                active: phase === "fetching",
              },
              {
                label: "Running 6 ship-readiness checks",
                done: false,
                active: phase === "analyzing",
              },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                ) : step.active ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-border shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    step.done
                      ? "text-muted-foreground line-through"
                      : step.active
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                  {step.done && fileCount > 0 && i === 0 && (
                    <span className="ml-2 not-italic font-normal no-underline text-muted-foreground">
                      ({fileCount} files)
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            This usually takes 15–25 seconds
          </p>
        </div>
      )}

      {/* ── Phase: results ── */}
      {phase === "results" && (
        <div className="space-y-6 section-fade-in">
          {/* Score ring */}
          <div className="rounded-lg border border-border bg-card p-6 flex flex-col items-center gap-3 text-center">
            <ScoreRing score={shipScore} />
            <div>
              <p className="text-lg font-bold text-foreground">Ship Score</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {passedCount} of 6 checks passed
              </p>
            </div>
          </div>

          {/* Check results */}
          <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
            {checks.map((check) => {
              const meta = CHECKS_META.find((m) => m.category === check.category);
              const maxPts = CHECK_POINTS[check.category] ?? 15;
              const Icon = meta?.Icon ?? Zap;

              return (
                <div key={check.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {check.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                      )}
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Icon className={`h-3.5 w-3.5 ${meta?.color ?? "text-muted-foreground"} shrink-0`} />
                        <span className="text-sm font-medium text-foreground truncate">
                          {check.name}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold shrink-0 ${
                        check.passed ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {check.passed ? `+${maxPts}` : `0 / ${maxPts}`} pts
                    </span>
                  </div>

                  {!check.passed && check.findings.length > 0 && (
                    <ul className="ml-7 space-y-1.5">
                      {check.findings.slice(0, 4).map((f, fi) => (
                        <li key={fi} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="text-red-500 mt-0.5 shrink-0">↳</span>
                          <span>
                            <span className="font-mono text-foreground/70">
                              {f.file}
                              {f.line ? `:${f.line}` : ""}
                            </span>
                            {f.detail ? ` — ${f.detail}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          {/* Roast card button */}
          <button
            onClick={() => setShowRoastCard(!showRoastCard)}
            className="w-full flex items-center justify-center gap-2 border border-border text-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-accent transition-colors"
          >
            <Flame className="h-4 w-4 text-orange-500" />
            {showRoastCard ? "Hide Roast Card" : "Generate Roast Card"}
          </button>

          {showRoastCard && (
            <RoastCard
              score={shipScore}
              scoreLabel="Ship Score"
              repoName={repoName}
              topFindings={topFindings}
              techStack={techStack}
            />
          )}

          {/* Reset */}
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 border border-border text-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-accent transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Check Another Repo
          </button>
        </div>
      )}
    </div>
  );
}
