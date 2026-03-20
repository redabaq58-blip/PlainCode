"use client";
import { OUTPUT_LANGUAGES } from "@/constants/supported-languages";
import { Globe } from "lucide-react";

interface Props {
  value: string;
  onChange: (lang: string) => void;
}

export function LanguageSelector({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm bg-transparent border-0 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none focus:ring-0"
        aria-label="Output language"
      >
        {OUTPUT_LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>
    </div>
  );
}
