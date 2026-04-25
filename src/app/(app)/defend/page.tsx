"use client";
import { useState, useRef } from "react";
import {
  Loader2,
  Shield,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Flame,
} from "lucide-react";
import type { DefendQuestion } from "@/app/api/defend/route";
import { GithubUrlInput } from "@/components/ui/GithubUrlInput";
import { RoastCard } from "@/components/RoastCard";

type Phase =
  | "input"
  | "fetching"
  | "generating"
  | "quiz"
  | "scoring"
  | "reviewing"
  | "summarizing"
  | "results";

interface AnsweredQuestion {
  id: number;
  category: string;
  question: string;
  answer: string;
  score: number;
  feedback: string;
}

const CATEGORY_STYLES: Record<string, { badge: string; dot: string }> = {
  Architecture: {
    badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    dot: "bg-blue-500",
  },
  "Edge Cases": {
    badge: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    dot: "bg-amber-500",
  },
  Security: {
    badge: "bg-red-500/10 text-red-500 border-red-500/20",
    dot: "bg-red-500",
  },
  Scalability: {
    badge: "bg-green-500/10 text-green-500 border-green-500/20",
    dot: "bg-green-500",
  },
  Alternatives: {
    badge: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    dot: "bg-purple-500",
  },
};

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
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-border"
        />
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

function CategoryBadge({ category }: { category: string }) {
  const styles = CATEGORY_STYLES[category] ?? {
    badge: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${styles.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
      {category}
    </span>
  );
}

function ProgressDots({
  total,
  current,
  answered,
}: {
  total: number;
  current: number;
  answered: AnsweredQuestion[];
}) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const done = answered.find((a) => a.id === i + 1);
        const active = i === current;
        return (
          <div key={i} className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full transition-all ${
                done
                  ? scoreColor(done.score).replace("text-", "bg-")
                  : active
                  ? "bg-primary"
                  : "bg-border"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function DefendPage() {
  const [phase, setPhase] = useState<Phase>("input");
  const [repoUrl, setRepoUrl] = useState("");
  const [error, setError] = useState("");
  const [repoCode, setRepoCode] = useState("");
  const [fileCount, setFileCount] = useState(0);
  const [questions, setQuestions] = useState<DefendQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [answered, setAnswered] = useState<AnsweredQuestion[]>([]);
  const [currentScore, setCurrentScore] = useState<{ score: number; feedback: string } | null>(
    null
  );
  const [defenseScore, setDefenseScore] = useState(0);
  const [weakSpots, setWeakSpots] = useState<string[]>([]);
  const [techStack, setTechStack] = useState("");
  const [showRoastCard, setShowRoastCard] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleStart() {
    if (!repoUrl.trim()) return;
    setError("");
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

      setRepoCode(fetchData.repoCode);
      setFileCount(fetchData.fileCount);
      setPhase("generating");

      const defendRes = await fetch("/api/defend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoCode: fetchData.repoCode }),
      });
      const defendData = await defendRes.json();
      if (!defendRes.ok) {
        setError(defendData.error ?? "Failed to generate questions");
        setPhase("input");
        return;
      }

      setQuestions(defendData.questions);
      setTechStack(defendData.techStack ?? "");
      setCurrentIdx(0);
      setCurrentAnswer("");
      setAnswered([]);
      setPhase("quiz");
      setTimeout(() => textareaRef.current?.focus(), 100);
    } catch {
      setError("Connection error. Please try again.");
      setPhase("input");
    }
  }

  async function handleSubmitAnswer() {
    if (!currentAnswer.trim() || phase !== "quiz") return;
    setPhase("scoring");

    const question = questions[currentIdx];
    try {
      const res = await fetch("/api/defend-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoCode,
          question: question.question,
          category: question.category,
          answer: currentAnswer,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Scoring failed");
        setPhase("quiz");
        return;
      }

      setCurrentScore({ score: data.score, feedback: data.feedback });
      setPhase("reviewing");
    } catch {
      setError("Connection error during scoring.");
      setPhase("quiz");
    }
  }

  async function handleNext() {
    if (!currentScore) return;

    const question = questions[currentIdx];
    const newAnswered: AnsweredQuestion[] = [
      ...answered,
      {
        id: question.id,
        category: question.category,
        question: question.question,
        answer: currentAnswer,
        score: currentScore.score,
        feedback: currentScore.feedback,
      },
    ];
    setAnswered(newAnswered);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setCurrentAnswer("");
      setCurrentScore(null);
      setPhase("quiz");
      setTimeout(() => textareaRef.current?.focus(), 100);
    } else {
      setPhase("summarizing");
      try {
        const res = await fetch("/api/defend-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: newAnswered }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to generate summary");
          setPhase("reviewing");
          return;
        }
        setDefenseScore(data.defenseScore);
        setWeakSpots(data.weakSpots ?? []);
        setPhase("results");
      } catch {
        setError("Connection error generating summary.");
        setPhase("reviewing");
      }
    }
  }

  function handleReset() {
    setPhase("input");
    setRepoUrl("");
    setError("");
    setRepoCode("");
    setFileCount(0);
    setQuestions([]);
    setCurrentIdx(0);
    setCurrentAnswer("");
    setAnswered([]);
    setCurrentScore(null);
    setDefenseScore(0);
    setWeakSpots([]);
    setTechStack("");
    setShowRoastCard(false);
    setExpandedQuestion(null);
  }

  const currentQuestion = questions[currentIdx];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Defend Your Code
        </h1>
        <p className="text-sm text-muted-foreground">
          Point us at a public GitHub repo. We&apos;ll probe it with 5 adversarial questions and
          score your answers.
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
              <Shield className="h-4 w-4" />
              Start Defense
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {["Architecture", "Edge Cases", "Security", "Scalability", "Alternatives"].map((cat) => (
              <div
                key={cat}
                className="rounded-md border border-border bg-card p-2 text-center"
              >
                <div
                  className={`w-2 h-2 rounded-full mx-auto mb-1 ${
                    CATEGORY_STYLES[cat]?.dot ?? "bg-muted-foreground"
                  }`}
                />
                <p className="text-xs text-muted-foreground leading-tight">{cat}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Phase: fetching / generating ── */}
      {(phase === "fetching" || phase === "generating") && (
        <div className="rounded-lg border border-border bg-card p-8 space-y-6">
          <div className="space-y-4">
            {[
              { label: "Fetching repository files", done: phase === "generating" },
              { label: "Analyzing codebase architecture", done: false, active: phase === "generating" },
              { label: "Generating 5 adversarial questions", done: false, active: phase === "generating" },
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
                  {step.done && phase === "generating" && i === 0 && fileCount > 0 && (
                    <span className="ml-2 not-italic font-normal no-underline text-muted-foreground">
                      ({fileCount} files)
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            This usually takes 15–30 seconds
          </p>
        </div>
      )}

      {/* ── Phase: quiz / scoring / reviewing ── */}
      {(phase === "quiz" || phase === "scoring" || phase === "reviewing") && currentQuestion && (
        <div className="space-y-4">
          {/* Progress header */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Question {currentIdx + 1} of {questions.length}
            </span>
            <ProgressDots total={questions.length} current={currentIdx} answered={answered} />
          </div>

          {/* Question card */}
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <CategoryBadge category={currentQuestion.category} />
            <p className="text-sm text-foreground leading-relaxed font-medium">
              {currentQuestion.question}
            </p>
          </div>

          {/* Answer area — always visible */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Your answer</label>
            <textarea
              ref={textareaRef}
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              disabled={phase === "scoring" || phase === "reviewing"}
              rows={6}
              placeholder="Walk through your reasoning. Be specific — reference your actual code decisions."
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Score result */}
          {phase === "reviewing" && currentScore && (
            <div className="rounded-lg border border-border bg-card p-5 flex items-start gap-5 section-fade-in">
              <div className="flex flex-col items-center shrink-0">
                <span className={`text-3xl font-bold ${scoreColor(currentScore.score)}`}>
                  {currentScore.score}
                </span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Feedback
                </p>
                <p className="text-sm text-foreground leading-relaxed">{currentScore.feedback}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          {phase === "quiz" && (
            <button
              onClick={handleSubmitAnswer}
              disabled={!currentAnswer.trim()}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Answer
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {phase === "scoring" && (
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 bg-primary/80 text-primary-foreground px-4 py-2.5 rounded-lg font-medium cursor-not-allowed"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              Evaluating...
            </button>
          )}

          {phase === "reviewing" && (
            <button
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              {currentIdx < questions.length - 1 ? (
                <>
                  Next Question
                  <ChevronRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  See My Results
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* ── Phase: summarizing ── */}
      {phase === "summarizing" && (
        <div className="rounded-lg border border-border bg-card p-8 flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <div>
            <p className="text-sm font-medium text-foreground">Calculating your Defense Score</p>
            <p className="text-xs text-muted-foreground mt-1">Analyzing patterns across all 5 answers...</p>
          </div>
        </div>
      )}

      {/* ── Phase: results ── */}
      {phase === "results" && (
        <div className="space-y-6 section-fade-in">
          {/* Score ring + headline */}
          <div className="rounded-lg border border-border bg-card p-6 flex flex-col items-center gap-3 text-center">
            <ScoreRing score={defenseScore} />
            <div>
              <p className="text-lg font-bold text-foreground">Defense Score</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Average across 5 categories
              </p>
            </div>
          </div>

          {/* Weak spots */}
          {weakSpots.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-5 space-y-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Weak Spots
              </h2>
              <ul className="space-y-2">
                {weakSpots.map((spot, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    {spot}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Full Q&A breakdown */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Full Review</h2>
            {answered.map((a) => (
              <div key={a.id} className="rounded-lg border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setExpandedQuestion(expandedQuestion === a.id ? null : a.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CategoryBadge category={a.category} />
                    <span className={`text-sm font-semibold ${scoreColor(a.score)}`}>
                      {a.score}/100
                    </span>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      expandedQuestion === a.id ? "rotate-90" : ""
                    }`}
                  />
                </button>
                {expandedQuestion === a.id && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                    <p className="text-sm text-foreground font-medium">{a.question}</p>
                    <div className="rounded-md bg-muted/50 px-3 py-2">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Your answer</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{a.answer}</p>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className={`font-semibold ${scoreColor(a.score)} shrink-0`}>
                        {a.score}/100 —
                      </span>
                      <span className="text-muted-foreground">{a.feedback}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Roast card */}
          <button
            onClick={() => setShowRoastCard(!showRoastCard)}
            className="w-full flex items-center justify-center gap-2 border border-border text-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-accent transition-colors"
          >
            <Flame className="h-4 w-4 text-orange-500" />
            {showRoastCard ? "Hide Roast Card" : "Generate Roast Card"}
          </button>

          {showRoastCard && (
            <RoastCard
              score={defenseScore}
              scoreLabel="Defense Score"
              repoName={repoUrl.replace(/\/$/, "").split("/").pop() ?? "repo"}
              topFindings={weakSpots.slice(0, 3)}
              techStack={techStack}
            />
          )}

          {/* Reset */}
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 border border-border text-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-accent transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Defend Another Repo
          </button>
        </div>
      )}
    </div>
  );
}
