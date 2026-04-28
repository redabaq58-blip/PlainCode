"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

type Tool = "claude-code" | "cursor" | "lovable" | "bolt" | "replit" | "manual";
type FixMode = "fix" | "review";

const TOOL_LABELS: Record<Tool, string> = {
  "claude-code": "Claude Code",
  cursor: "Cursor",
  lovable: "Lovable",
  bolt: "Bolt",
  replit: "Replit",
  manual: "Manual",
};

const MANUAL_FIX_STEPS: Record<string, string> = {
  secrets:
    "Move the hardcoded value to an environment variable (e.g. process.env.MY_SECRET) and add it to your .env file and .env.example.",
  env_vars:
    "Add each environment variable name and a short description to your README.md or a .env.example file.",
  readme:
    "Create a README.md with: install command (npm install), .env setup, and how to run the app (npm run dev).",
  console_logs:
    "Remove the console.log statement. If you need it in dev only, wrap it in `if (process.env.NODE_ENV !== 'production')`.",
  error_handling:
    "Wrap the async call in a try/catch block and handle the error — return an appropriate error response or log it.",
  dependencies:
    "Replace any wildcard (*) or 'latest' version strings in your dependency file with exact version numbers (e.g. \"1.2.3\").",
  Architecture:
    "Review the main route/controller files and add inline comments explaining why you structured them this way and the tradeoffs you made.",
  Security:
    "Review authentication, input validation, and data access code. Add comments explaining the security decisions and what threats they protect against.",
  "Edge Cases":
    "Review error handling and input validation. Add comments for each edge case you handle and why it matters.",
  Scalability:
    "Review database queries and API routes. Add comments explaining which operations are potential bottlenecks and how you'd address them.",
  Alternatives:
    "Review your key technical choices (framework, database, auth). Add comments explaining what alternatives you considered and why you chose this approach.",
};

function buildPrompt(
  tool: Tool,
  mode: FixMode,
  failedCheck: string,
  fileReference: string,
  specificIssue: string,
  checkCategory?: string
): string {
  const filename = fileReference ? fileReference.split(":")[0] : null;
  const line = fileReference?.includes(":") ? fileReference.split(":")[1] : null;
  const target = filename ?? "the relevant files";
  const toolName = TOOL_LABELS[tool];

  if (mode === "review") {
    if (tool === "manual") {
      const step =
        checkCategory
          ? (MANUAL_FIX_STEPS[checkCategory] ?? "Add inline comments explaining your key design decisions and the tradeoffs you made.")
          : "Add inline comments explaining your key design decisions and the tradeoffs you made.";
      return `To document your ${failedCheck} decisions:\n1. Open ${target}\n2. ${step}\n3. Add inline comments explaining your choices\n4. Note any tradeoffs or alternatives you considered`;
    }
    const base = `[${toolName}] Review my ${failedCheck} decisions in ${target} and explain why I chose this approach.\nAdd inline comments explaining the key tradeoffs and design decisions.\nDo not change any production logic.\nAfter reviewing, summarize the decisions you documented.`;
    return tool === "replit" ? `${base}\nRun the lint check after to verify nothing broke.` : base;
  }

  // fix mode
  if (tool === "manual") {
    const step =
      checkCategory
        ? (MANUAL_FIX_STEPS[checkCategory] ?? "Fix the issue and verify the change works.")
        : "Fix the issue and verify the change works.";
    return `To fix "${specificIssue}" in ${target}:\n1. Open ${target}${line ? ` and go to line ${line}` : ""}\n2. ${step}\n3. Test that the fix works`;
  }

  const locationLine = fileReference ? `\nLocated at: ${fileReference}` : "";
  const base = `[${toolName}] In ${target}, fix this issue: ${specificIssue}${locationLine}\nDo not change any other files.\nDo not change any business logic.\nAfter fixing, summarize what you changed and why.`;
  return tool === "replit" ? `${base}\nRun the lint check after to verify the fix.` : base;
}

interface FixPromptCardProps {
  failedCheck: string;
  fileReference: string;
  specificIssue: string;
  checkCategory?: string;
  mode?: FixMode;
  defaultTool?: Tool;
}

export function FixPromptCard({
  failedCheck,
  fileReference,
  specificIssue,
  checkCategory,
  mode = "fix",
  defaultTool = "claude-code",
}: FixPromptCardProps) {
  const [tool, setTool] = useState<Tool>(defaultTool);
  const [copied, setCopied] = useState(false);

  const prompt = buildPrompt(tool, mode, failedCheck, fileReference, specificIssue, checkCategory);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable in some contexts — silent fail
    }
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-xs font-semibold text-foreground">Fix Prompt</span>
        <select
          value={tool}
          onChange={(e) => setTool(e.target.value as Tool)}
          className="text-xs bg-background border border-input rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {(Object.keys(TOOL_LABELS) as Tool[]).map((t) => (
            <option key={t} value={t}>
              {TOOL_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <pre className="text-xs text-foreground/80 bg-background rounded-md border border-border px-3 py-2.5 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
        {prompt}
      </pre>

      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Copy Prompt
          </>
        )}
      </button>
    </div>
  );
}
