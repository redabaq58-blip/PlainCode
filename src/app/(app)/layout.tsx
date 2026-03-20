import { Navbar } from "@/components/layout/Navbar";
import { SessionProvider } from "@/components/layout/SessionProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
      </div>
    </SessionProvider>
  );
}
