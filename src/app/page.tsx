import Link from "next/link";
import { Code2, Sparkles, BookOpen, GitCompare, MessageSquare, GitBranch, Lock, Shield, ChevronRight, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const features = [
  {
    icon: <Sparkles className="h-5 w-5 text-blue-500" />,
    title: "3-Layer AI Accuracy",
    description: "Intent check → streaming explanation → adversarial validation. Not just a prompt — a pipeline.",
  },
  {
    icon: <BookOpen className="h-5 w-5 text-purple-500" />,
    title: "5 Audience Levels",
    description: "From ELI5 to Developer Peer. The same code, explained differently for who's reading.",
  },
  {
    icon: <GitCompare className="h-5 w-5 text-green-500" />,
    title: "Explain the Diff",
    description: "Paste before & after — understand what changed and why it matters. Perfect for PR reviews.",
  },
  {
    icon: <MessageSquare className="h-5 w-5 text-yellow-500" />,
    title: "Q&A Mode",
    description: "Ask follow-up questions about the code with full context preserved across the conversation.",
  },
  {
    icon: <GitBranch className="h-5 w-5 text-red-500" />,
    title: "Flow Diagrams",
    description: "Automatic Mermaid.js flowcharts generated from the explanation.",
  },
  {
    icon: <Shield className="h-5 w-5 text-orange-500" />,
    title: "Defend Mode",
    description: "Point at a GitHub repo and get grilled with 5 adversarial questions — scored 0–100 per answer.",
  },
  {
    icon: <Lock className="h-5 w-5 text-slate-500" />,
    title: "Privacy Mode",
    description: "Your code never touches our database. Opt in for sensitive code — no data stored, no training.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
          {/* Navbar */}
          <nav className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-lg">
                <Code2 className="h-5 w-5 text-primary" />
                PlainCode
              </div>
              <div className="flex items-center gap-3">
                <Link href="/explain" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  App
                </Link>
                <Link
                  href="/explain"
                  className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Try free
                </Link>
                <ThemeToggle />
              </div>
            </div>
          </nav>

          {/* Hero */}
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-3 py-1 rounded-full mb-6 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Free for everyone · No sign-up required to try
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight">
              Explain any code in{" "}
              <span className="text-primary">plain English</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Paste a code snippet. Pick your audience. Get an accurate, structured explanation —
              powered by a 3-layer AI accuracy system that verifies its own answers.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/explain"
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors text-sm"
              >
                <Sparkles className="h-4 w-4" />
                Explain some code
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/diff"
                className="flex items-center gap-2 border border-border px-6 py-3 rounded-lg font-semibold hover:bg-accent transition-colors text-sm"
              >
                <GitCompare className="h-4 w-4" />
                Explain a diff
              </Link>
              <Link
                href="/defend"
                className="flex items-center gap-2 border border-border px-6 py-3 rounded-lg font-semibold hover:bg-accent transition-colors text-sm"
              >
                <Shield className="h-4 w-4" />
                Defend a repo
              </Link>
            </div>
          </section>

          {/* Features */}
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-2xl font-bold text-center text-foreground mb-10">
              More than a ChatGPT prompt
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((f) => (
                <div key={f.title} className="rounded-lg border border-border bg-card p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    {f.icon}
                    <h3 className="font-semibold text-sm text-foreground">{f.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h2 className="text-3xl font-bold text-foreground">Ready to understand your code?</h2>
            <p className="mt-3 text-muted-foreground">No credit card. No paywall. Free for everyone.</p>
            <Link
              href="/explain"
              className="inline-flex items-center gap-2 mt-6 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Start explaining — it&apos;s free
            </Link>
          </section>

          {/* Footer */}
          <footer className="border-t border-border py-8">
            <div className="max-w-5xl mx-auto px-4 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Code2 className="h-3.5 w-3.5 text-primary" />
                PlainCode
              </div>
              <p>Free for everyone</p>
            </div>
          </footer>
      </div>
  );
}
