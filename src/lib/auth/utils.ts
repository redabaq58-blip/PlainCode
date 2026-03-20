import { auth } from "./config";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function getOptionalSession() {
  return auth();
}
