"use client";
import { Github } from "lucide-react";

interface GithubUrlInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export function GithubUrlInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "https://github.com/owner/repo",
  autoFocus = false,
}: GithubUrlInputProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
      <Github className="h-4 w-4 text-muted-foreground shrink-0" />
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !disabled && onSubmit()}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />
    </div>
  );
}
