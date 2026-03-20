import { SessionProvider } from "@/components/layout/SessionProvider";
import Link from "next/link";
import { Code2 } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-xl mb-8 hover:opacity-80 transition-opacity">
          <Code2 className="h-6 w-6 text-primary" />
          PlainCode
        </Link>
        {children}
      </div>
    </SessionProvider>
  );
}
