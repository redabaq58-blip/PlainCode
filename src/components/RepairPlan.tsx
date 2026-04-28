"use client";
import { type ReactNode, useState } from "react";
import { RotateCcw } from "lucide-react";

export interface RepairStep {
  priority: "critical" | "high" | "medium";
  description: string;
  fileReference: string;
  fixPromptCard: ReactNode;
}

interface RepairPlanProps {
  steps: RepairStep[];
}

const PRIORITY_CONFIG = {
  critical: {
    badge: "bg-red-500/10 text-red-500 border border-red-500/20",
    bar: "bg-red-500",
    label: "Critical",
  },
  high: {
    badge: "bg-orange-500/10 text-orange-500 border border-orange-500/20",
    bar: "bg-orange-500",
    label: "High",
  },
  medium: {
    badge: "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20",
    bar: "bg-yellow-500",
    label: "Medium",
  },
};

export function RepairPlan({ steps }: RepairPlanProps) {
  const [openStep, setOpenStep] = useState<number | null>(null);

  if (steps.length === 0) return null;

  const criticalCount = steps.filter((s) => s.priority === "critical").length;

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-foreground">
          Repair Plan — Fix these in order
        </h2>
        {criticalCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {criticalCount} critical issue{criticalCount > 1 ? "s" : ""} must be resolved before
            shipping.
          </p>
        )}
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => {
          const cfg = PRIORITY_CONFIG[step.priority];
          const isOpen = openStep === i;
          return (
            <div key={i} className="rounded-lg border border-border bg-background overflow-hidden">
              <div className="flex">
                <div className={`w-1 shrink-0 ${cfg.bar}`} />
                <div className="flex-1 p-4 space-y-2">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="text-xs font-bold text-muted-foreground shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-sm text-foreground leading-snug">{step.description}</p>
                        {step.fileReference && (
                          <p className="text-xs font-mono text-muted-foreground break-all">
                            {step.fileReference}
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${cfg.badge}`}
                    >
                      {cfg.label}
                    </span>
                  </div>

                  {/* Fix prompt toggle */}
                  <button
                    onClick={() => setOpenStep(isOpen ? null : i)}
                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    {isOpen ? "Hide Fix Prompt" : "Show Fix Prompt →"}
                  </button>

                  {isOpen && <div className="pt-1">{step.fixPromptCard}</div>}

                  {/* Visual-only re-run button */}
                  <button
                    disabled
                    className="flex items-center gap-1.5 text-xs text-muted-foreground opacity-40 cursor-not-allowed"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Fixed? Re-run Ship Check
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
