import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AppNav email={session.user.email} />
      <main className="app-safe-x app-safe-b mx-auto max-w-7xl min-w-0 py-8">{children}</main>
    </div>
  );
}
