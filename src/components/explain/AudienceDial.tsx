"use client";
import { AUDIENCE_LEVELS } from "@/constants/audience-levels";
import type { AudienceLevel } from "@/types/explanation";
import { cn } from "@/lib/utils/cn";

interface Props {
  value: AudienceLevel;
  onChange: (level: AudienceLevel) => void;
}

export function AudienceDial({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">Audience</span>
        <span className="text-muted-foreground text-xs">
          {AUDIENCE_LEVELS.find((l) => l.value === value)?.description}
        </span>
      </div>
      <div className="flex gap-1 p-1 bg-muted rounded-lg" role="group" aria-label="Audience level">
        {AUDIENCE_LEVELS.map((level) => (
          <button
            key={level.value}
            onClick={() => onChange(level.value)}
            title={level.description}
            aria-pressed={value === level.value}
            className={cn(
              "flex-1 text-xs py-1.5 px-1 rounded-md font-medium transition-all",
              value === level.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            {level.short}
          </button>
        ))}
      </div>
    </div>
  );
}
