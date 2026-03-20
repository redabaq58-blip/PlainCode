"use client";
import { useState } from "react";
import { Share2, Check, Loader2 } from "lucide-react";

interface Props {
  explanationId: string;
}

export function ShareButton({ explanationId }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [url, setUrl] = useState("");

  const handleShare = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ explanationId }),
      });
      const data = await res.json();
      setUrl(data.url);
      await navigator.clipboard.writeText(data.url);
      setState("done");
      setTimeout(() => setState("idle"), 3000);
    } catch {
      setState("idle");
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={state === "loading"}
      className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors disabled:opacity-50"
    >
      {state === "loading" ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : state === "done" ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Share2 className="h-3.5 w-3.5" />
      )}
      {state === "done" ? "Link copied!" : "Share"}
    </button>
  );
}
