import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-6 py-6 text-slate-950">
      <section className="mx-auto w-full max-w-6xl">
        <header className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <p className="text-sm font-medium text-slate-500">AI Scrum Lite</p>
            <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
          </div>
          <Link
            className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
            href="/api/auth/signout"
          >
            Sign out
          </Link>
        </header>

        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-emerald-700">GitHub sign-in verified</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-normal">
            Welcome, {session.user.name ?? session.user.email ?? "GitHub user"}.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            The authentication, database connection, and deployment pipeline are now
            ready. Next we will build project creation, role setup, backlog, and the
            Sprint board.
          </p>
        </div>
      </section>
    </main>
  );
}
