import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropicClient } from "@/lib/ai/client";
import { generateArchitectureDiagram } from "@/lib/ai/architecture-diagram";
import { generateAssessment } from "@/lib/ai/generate-assessment";

const schema = z.object({
  repoCode: z.string().min(100).max(35_000),
});

export interface CheckFinding {
  file: string;
  line?: number;
  detail: string;
}

export interface CheckResult {
  id: number;
  name: string;
  category:
    | "env_vars"
    | "secrets"
    | "readme"
    | "console_logs"
    | "error_handling"
    | "dependencies";
  passed: boolean;
  findings: CheckFinding[];
}

interface StackAnalysis {
  techStack: string;
  architecture: string;
  keyFiles: Array<{
    path: string;
    importance: "critical" | "important" | "supporting";
    reason: string;
  }>;
}

function parseClaudeJSON<T>(text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

async function analyzeStack(repoCode: string): Promise<StackAnalysis> {
  const client = getAnthropicClient();
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `Analyze this codebase. Return ONLY valid JSON, no markdown:

${repoCode.slice(0, 6000)}

Return this exact shape:
{
  "techStack": "<comma-separated: languages, frameworks, databases, key libraries you see imported>",
  "architecture": "<one sentence describing the architectural pattern>",
  "keyFiles": [
    { "path": "<file path>", "importance": "critical", "reason": "<3-5 words: what it does>" }
  ]
}

keyFiles rules:
- Include 4–8 files maximum
- importance values: "critical" (auth/payments/data writes), "important" (API routes/DB/core logic), "supporting" (config/utils/assets)
- Only include files you can actually see in the codebase
- reason: 3–5 words describing what the file does`,
      },
    ],
  });

  try {
    const block = res.content[0];
    if (!block || block.type !== "text") throw new Error("no response");
    return parseClaudeJSON<StackAnalysis>(block.text);
  } catch {
    return { techStack: "unknown", architecture: "unknown", keyFiles: [] };
  }
}

const CHECK_DEFAULTS: CheckResult[] = [
  { id: 1, name: "Env Vars Documented", category: "env_vars", passed: true, findings: [] },
  { id: 2, name: "No Hardcoded Secrets", category: "secrets", passed: true, findings: [] },
  { id: 3, name: "README with Setup", category: "readme", passed: true, findings: [] },
  { id: 4, name: "No Debug Logs", category: "console_logs", passed: true, findings: [] },
  { id: 5, name: "Error Handling", category: "error_handling", passed: true, findings: [] },
  { id: 6, name: "Dependencies Pinned", category: "dependencies", passed: true, findings: [] },
];

async function runChecks(repoCode: string, stack: StackAnalysis): Promise<CheckResult[]> {
  const client = getAnthropicClient();
  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are a senior engineer auditing a codebase for ship-readiness. Run exactly 6 checks and return a JSON object.

Tech stack: ${stack.techStack}
Architecture: ${stack.architecture}

CODEBASE (file paths shown in // FILE: headers):
${repoCode.slice(0, 20000)}

Run these 6 checks in order. For each, determine pass/fail based strictly on what you can see in the code.

CHECK 1 — id:1, category:"env_vars", name:"Env Vars Documented"
Are all environment variables referenced in code (process.env.*, os.environ[], getenv(), etc.) documented in a README or .env.example file?
PASS: every referenced var appears in README or .env.example. FAIL: any var used but not documented.

CHECK 2 — id:2, category:"secrets", name:"No Hardcoded Secrets"
Are there hardcoded API keys, tokens, passwords, or connection strings in the code?
Look for: strings matching sk-*, ghp_*, AKIA*, password= assignments, connection strings with credentials embedded, private key literals.
PASS: none found. FAIL: any hardcoded secret detected — be specific.

CHECK 3 — id:3, category:"readme", name:"README with Setup"
Does a README file exist and contain setup or installation instructions?
PASS: README exists with setup steps (install, run, env setup). FAIL: missing or no setup instructions.

CHECK 4 — id:4, category:"console_logs", name:"No Debug Logs"
Are there console.log(), print(), System.out.println(), or debug print statements in non-test files?
Ignore files with .test., .spec., __tests__, /test/, /spec/ in their path.
PASS: none in production code. FAIL: found in production code — name the file and line.

CHECK 5 — id:5, category:"error_handling", name:"Error Handling"
Are async functions and API calls wrapped in try/catch or equivalent error handling?
PASS: async operations have error handling. FAIL: bare awaits or unhandled promise chains exist — name examples.

CHECK 6 — id:6, category:"dependencies", name:"Dependencies Pinned"
Is package.json, requirements.txt, Gemfile, or equivalent present? Are versions pinned (not * or "latest")?
PASS: dependency file exists with specific versions. FAIL: missing or using wildcards — be explicit.

Rules for findings:
- If PASS: findings must be empty []
- If FAIL: list the specific files and issues. Each finding: { "file": "<path>", "line": <number or omit if unknown>, "detail": "<concise one-line description>" }

Return ONLY valid JSON, no markdown fences:
{
  "checks": [
    { "id": 1, "name": "Env Vars Documented", "category": "env_vars", "passed": true, "findings": [] },
    { "id": 2, "name": "No Hardcoded Secrets", "category": "secrets", "passed": false, "findings": [{ "file": "src/config.ts", "line": 14, "detail": "Hardcoded API key: 'sk-abc123...'" }] },
    { "id": 3, "name": "README with Setup", "category": "readme", "passed": true, "findings": [] },
    { "id": 4, "name": "No Debug Logs", "category": "console_logs", "passed": true, "findings": [] },
    { "id": 5, "name": "Error Handling", "category": "error_handling", "passed": true, "findings": [] },
    { "id": 6, "name": "Dependencies Pinned", "category": "dependencies", "passed": true, "findings": [] }
  ]
}`,
      },
    ],
  });

  const block = res.content[0];
  if (!block || block.type !== "text") throw new Error("No audit results");

  try {
    const parsed = parseClaudeJSON<{ checks: CheckResult[] }>(block.text);
    if (!Array.isArray(parsed.checks)) throw new Error("Invalid format");
    const checksMap = new Map(parsed.checks.map((c) => [c.id, c]));
    return CHECK_DEFAULTS.map((d) => checksMap.get(d.id) ?? d);
  } catch {
    throw new Error("Failed to parse audit results");
  }
}

async function validateFindings(checks: CheckResult[], repoCode: string): Promise<CheckResult[]> {
  const failedEmpty = checks.filter((c) => !c.passed && c.findings.length === 0);
  if (failedEmpty.length === 0) return checks;

  const client = getAnthropicClient();
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `These audit checks failed but have no file references. Add the most specific finding you can from the codebase.

IMPORTANT: Do NOT change any "passed" field. Do NOT flip false to true. Only populate empty findings arrays.

FAILED CHECKS WITH NO FINDINGS:
${JSON.stringify(failedEmpty, null, 2)}

CODEBASE EXCERPT:
${repoCode.slice(0, 3000)}

Return ONLY valid JSON:
{
  "improvements": [
    { "id": <check id>, "findings": [{ "file": "<file from codebase>", "detail": "<specific finding>" }] }
  ]
}`,
      },
    ],
  });

  try {
    const block = res.content[0];
    if (!block || block.type !== "text") return checks;
    const result = parseClaudeJSON<{
      improvements: { id: number; findings: CheckFinding[] }[];
    }>(block.text);
    if (!Array.isArray(result.improvements)) return checks;
    return checks.map((c) => {
      const imp = result.improvements.find((i) => i.id === c.id);
      return imp && c.findings.length === 0 ? { ...c, findings: imp.findings } : c;
    });
  } catch {
    return checks;
  }
}

const POINTS: Record<string, number> = {
  secrets: 25,
  env_vars: 15,
  readme: 15,
  console_logs: 15,
  error_handling: 15,
  dependencies: 15,
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const { repoCode } = parsed.data;
    const stack = await analyzeStack(repoCode);
    const checks = await runChecks(repoCode, stack);
    const dangerHints = checks.filter((c) => !c.passed).map((c) => c.name);
    // Preliminary score — pass/fail never changes during validation
    const prelimScore = checks.reduce(
      (sum, c) => sum + (c.passed ? (POINTS[c.category] ?? 0) : 0),
      0
    );
    const failedCheckNames = checks.filter((c) => !c.passed).map((c) => c.name);
    const fileFindings = checks
      .filter((c) => !c.passed)
      .flatMap((c) =>
        c.findings.slice(0, 2).map(
          (f) => `${f.file}${f.line ? `:${f.line}` : ""}: ${f.detail}`
        )
      )
      .slice(0, 5);
    const [validated, architectureDiagram, { assessment, builderType }] =
      await Promise.all([
        validateFindings(checks, repoCode),
        generateArchitectureDiagram(repoCode, {
          techStack: stack.techStack,
          architecture: stack.architecture,
          dangerHints,
        }),
        generateAssessment({
          score: prelimScore,
          failedChecks: failedCheckNames,
          fileFindings,
        }),
      ]);
    const shipScore = validated.reduce(
      (sum, c) => sum + (c.passed ? (POINTS[c.category] ?? 0) : 0),
      0
    );
    return NextResponse.json({
      shipScore,
      techStack: stack.techStack,
      keyFiles: stack.keyFiles ?? [],
      architectureDiagram,
      checks: validated,
      assessment,
      builderType,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to audit repository" },
      { status: 500 }
    );
  }
}
