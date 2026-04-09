"use client";

import { FormEvent, useMemo, useState } from "react";
import { toQRCodeDataUrl } from "@/lib/qr";
import { useSessionState } from "@/lib/useSessionState";
import type { SessionState } from "@/types/game";

export default function HostPage() {
  const [teamNamesText, setTeamNamesText] = useState("Team One\nTeam Two");
  const [sessionCode, setSessionCode] = useState("");
  const [qr, setQr] = useState("");
  const [busy, setBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [sessionBootstrap, setSessionBootstrap] = useState<SessionState | null>(null);
  const { session, loading, error: loadError, refresh } = useSessionState(sessionCode, sessionBootstrap);

  const joinUrl = useMemo(() => {
    if (!sessionCode || typeof window === "undefined") return "";
    return `${window.location.origin}/session/${sessionCode}/player`;
  }, [sessionCode]);

  async function createSession(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setBusy(true);
    try {
      const teamNames = teamNamesText
        .split("\n")
        .map((n) => n.trim())
        .filter(Boolean);

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", teamNames }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setCreateError(typeof payload.error === "string" ? payload.error : `Create failed (${res.status})`);
        return;
      }
      if (!payload.session?.code) {
        setCreateError("Invalid response from server.");
        return;
      }
      setSessionBootstrap(payload.session as SessionState);
      setSessionCode(String(payload.session.code).toUpperCase());
      const nextUrl = `${window.location.origin}/session/${payload.session.code}/player`;
      setQr(await toQRCodeDataUrl(nextUrl));
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Create session failed.");
    } finally {
      setBusy(false);
    }
  }

  async function runAction(action: "start" | "end" | "next") {
    if (!sessionCode) return;
    await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, code: sessionCode }),
    });
    await refresh();
  }

  const activeTeam = session?.teams[session.currentTeamIndex];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-8">
      <h1 className="text-3xl font-bold">Host Console</h1>

      {!sessionCode && (
        <form className="rounded border border-zinc-200 p-4" onSubmit={createSession}>
          <p className="mb-3 text-sm text-zinc-600">Enter one team name per line.</p>
          <textarea
            className="h-40 w-full rounded border border-zinc-300 p-3"
            value={teamNamesText}
            onChange={(e) => setTeamNamesText(e.target.value)}
          />
          {createError && <p className="mt-2 text-sm text-red-600">{createError}</p>}
          <button disabled={busy} className="mt-3 rounded bg-black px-4 py-2 text-white" type="submit">
            {busy ? "Creating..." : "Create Session"}
          </button>
        </form>
      )}

      {sessionCode && loading && (
        <p className="text-sm text-zinc-600">Loading session {sessionCode}…</p>
      )}
      {sessionCode && loadError && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-medium">Could not load session</p>
          <p>{loadError}</p>
          <p className="mt-2 text-xs">
            If you just started the app, run <code className="rounded bg-white px-1">npm run db:push</code> then try again.
          </p>
        </div>
      )}

      {session && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded border border-zinc-200 p-4">
              <h2 className="text-xl font-semibold">Session {session.code}</h2>
              <p className="text-sm text-zinc-600">Status: {session.status}</p>
              <p className="text-sm text-zinc-600">Round: {session.round}</p>
              <p className="mt-2 text-lg">Active Team: {activeTeam?.name ?? "-"}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="rounded bg-black px-3 py-2 text-white" onClick={() => runAction("start")}>
                  Start Game
                </button>
                <button className="rounded border border-zinc-300 px-3 py-2" onClick={() => runAction("next")}>
                  Next Turn
                </button>
                <button className="rounded border border-red-300 px-3 py-2 text-red-700" onClick={() => runAction("end")}>
                  End Game
                </button>
              </div>
              {joinUrl && <p className="mt-3 text-xs text-zinc-500">Join URL: {joinUrl}</p>}
            </section>

            <section className="rounded border border-zinc-200 p-4">
              <h2 className="text-xl font-semibold">Join QR</h2>
              {qr && <img src={qr} alt="Join QR code" className="mt-3 h-56 w-56" />}
              <p className="mt-2 text-sm">Fallback code: <span className="font-bold">{session.code}</span></p>
            </section>
          </div>

          <section className="rounded border border-zinc-200 p-4">
            <h2 className="text-xl font-semibold">Board</h2>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {session.board.map((tile, index) => (
                <div key={index} className="rounded border border-zinc-200 p-2 text-xs">
                  <div className="font-semibold">{index + 1}</div>
                  <div>{tile}</div>
                  <div className="mt-1 text-[11px] text-zinc-500">
                    {session.teams.filter((t) => t.position === index).map((t) => t.name).join(", ") || "-"}
                  </div>
                </div>
              ))}
            </div>
            {session.currentPrompt && (
              <div className="mt-4 rounded border border-zinc-300 bg-zinc-100 p-3 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                  {session.currentPromptType}
                </p>
                <p className="mt-1 text-lg font-medium leading-snug">{session.currentPrompt}</p>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
