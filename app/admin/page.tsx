import Link from "next/link";

export default function AdminHomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-bold">Admin</h1>
      <ul className="list-inside list-disc space-y-3 text-zinc-700 dark:text-zinc-300">
        <li>
          <Link className="font-medium text-zinc-900 underline dark:text-zinc-100" href="/admin/prompts">
            Prompts
          </Link>
          <span className="block pl-6 text-sm">Manage ice-breaker prompts (enter your admin key on that page).</span>
        </li>
        <li>
          <span className="font-medium">Sessions API (JSON)</span>
          <span className="block pl-6 text-sm">
            Use query param <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">key</code>, not{" "}
            <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">ADMIN_KEY</code>. The value must match the{" "}
            <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">ADMIN_KEY</code> env var on the server
            (set in Render → Environment).
          </span>
          <code className="mt-2 block break-all rounded border border-zinc-300 bg-zinc-50 p-2 text-xs dark:border-zinc-600 dark:bg-zinc-900">
            /api/admin/sessions?key=YOUR_SECRET_HERE
          </code>
        </li>
      </ul>
      <Link className="text-sm text-zinc-500 underline" href="/">
        Home
      </Link>
    </main>
  );
}
