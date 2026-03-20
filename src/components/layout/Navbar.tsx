"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { Code2, History, LogOut, LogIn, User } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg hover:opacity-80 transition-opacity">
          <Code2 className="h-5 w-5 text-primary" />
          <span>PlainCode</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/explain"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-accent"
          >
            Explain
          </Link>
          <Link
            href="/diff"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-accent"
          >
            Diff
          </Link>

          {session?.user ? (
            <>
              <Link
                href="/history"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-accent flex items-center gap-1"
              >
                <History className="h-3.5 w-3.5" />
                History
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-accent flex items-center gap-1"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign in
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
