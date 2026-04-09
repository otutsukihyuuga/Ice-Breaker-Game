"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Snapshot = {
  sessions: Array<{
    id: string;
    code: string;
    status: string;
    round: number;
    currentTeamIndex: number;
    boardSize: number;
    currentPrompt: string | null;
    currentPromptType: string | null;
    createdAt: string;
    teams: Array<{ id: string; name: string; position: number; captainClientId: string | null }>;
    _count: { promptHistory: number };
  }>;
  teams: Array<{
    id: string;
    sessionId: string;
    name: string;
    position: number;
    captainClientId: string | null;
    createdAt: string;
    session: { code: string };
  }>;
  prompts: Array<{
    id: string;
    type: string;
    text: string;
    enabled: boolean;
    createdAt: string;
  }>;
  sessionPromptHistory: Array<{
    id: string;
    sessionId: string;
    promptId: string;
    createdAt: string;
    session: { code: string };
  }>;
};

function thClass() {
  return "border-b border-zinc-300 bg-zinc-100 px-2 py-2 text-left text-xs font-semibold uppercase dark:border-zinc-600 dark:bg-zinc-800";
}

function tdClass() {
  return "border-b border-zinc-200 px-2 py-1.5 align-top text-sm dark:border-zinc-700";
}

export default function AdminDataPage() {
  const [key, setKey] = useState("");
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!key.trim()) {
      setError("Enter your admin key.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/data?key=${encodeURIComponent(key)}`, { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) {
        setData(null);
        setError(typeof payload.error === "string" ? payload.error : `Request failed (${res.status})`);
        return;
      }
      setData(payload as Snapshot);
    } catch {
      setData(null);
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold">Database overview</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Read-only view of Prisma tables. Same key as <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">ADMIN_KEY</code>.
          </p>
        </div>
        <form className="flex flex-wrap items-center gap-2" onSubmit={load}>
          <input
            type="password"
            autoComplete="off"
            placeholder="Admin key"
            className="min-w-[200px] rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-black"
          >
            {loading ? "Loading…" : "Load data"}
          </button>
        </form>
        <Link className="text-sm text-zinc-500 underline" href="/admin">
          Admin home
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      {data && (
        <div className="flex flex-col gap-10">
          <section>
            <h2 className="mb-2 text-lg font-semibold">Sessions ({data.sessions.length})</h2>
            <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-700">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr>
                    <th className={thClass()}>Code</th>
                    <th className={thClass()}>Status</th>
                    <th className={thClass()}>Round</th>
                    <th className={thClass()}>Teams</th>
                    <th className={thClass()}>History</th>
                    <th className={thClass()}>Current prompt</th>
                    <th className={thClass()}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sessions.map((s) => (
                    <tr key={s.id}>
                      <td className={tdClass()}>
                        <span className="font-mono font-medium">{s.code}</span>
                      </td>
                      <td className={tdClass()}>{s.status}</td>
                      <td className={tdClass()}>{s.round}</td>
                      <td className={tdClass()}>{s.teams.length}</td>
                      <td className={tdClass()}>{s._count.promptHistory}</td>
                      <td className={`${tdClass()} max-w-[200px] truncate`} title={s.currentPrompt ?? ""}>
                        {s.currentPromptType && <span className="text-xs uppercase text-zinc-500">{s.currentPromptType} </span>}
                        {s.currentPrompt ?? "—"}
                      </td>
                      <td className={`${tdClass()} whitespace-nowrap text-xs text-zinc-500`}>
                        {new Date(s.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">Teams ({data.teams.length})</h2>
            <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-700">
              <table className="w-full min-w-[560px] border-collapse">
                <thead>
                  <tr>
                    <th className={thClass()}>Session</th>
                    <th className={thClass()}>Name</th>
                    <th className={thClass()}>Position</th>
                    <th className={thClass()}>Captain</th>
                    <th className={thClass()}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.teams.map((t) => (
                    <tr key={t.id}>
                      <td className={tdClass()}>
                        <span className="font-mono">{t.session.code}</span>
                      </td>
                      <td className={tdClass()}>{t.name}</td>
                      <td className={tdClass()}>{t.position}</td>
                      <td className={`${tdClass()} max-w-[120px] truncate font-mono text-xs`} title={t.captainClientId ?? ""}>
                        {t.captainClientId ?? "—"}
                      </td>
                      <td className={`${tdClass()} whitespace-nowrap text-xs text-zinc-500`}>
                        {new Date(t.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">Prompts ({data.prompts.length})</h2>
            <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-700">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr>
                    <th className={thClass()}>Type</th>
                    <th className={thClass()}>Enabled</th>
                    <th className={thClass()}>Text</th>
                    <th className={thClass()}>Id</th>
                  </tr>
                </thead>
                <tbody>
                  {data.prompts.map((p) => (
                    <tr key={p.id}>
                      <td className={tdClass()}>{p.type}</td>
                      <td className={tdClass()}>{p.enabled ? "yes" : "no"}</td>
                      <td className={tdClass()}>{p.text}</td>
                      <td className={`${tdClass()} font-mono text-xs text-zinc-500`}>{p.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">Session prompt history (latest 500)</h2>
            <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-700">
              <table className="w-full min-w-[480px] border-collapse">
                <thead>
                  <tr>
                    <th className={thClass()}>Session</th>
                    <th className={thClass()}>Prompt id</th>
                    <th className={thClass()}>When</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sessionPromptHistory.map((h) => (
                    <tr key={h.id}>
                      <td className={tdClass()}>
                        <span className="font-mono">{h.session.code}</span>
                      </td>
                      <td className={`${tdClass()} font-mono text-xs`}>{h.promptId}</td>
                      <td className={`${tdClass()} whitespace-nowrap text-xs text-zinc-500`}>
                        {new Date(h.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
