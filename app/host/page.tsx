"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GameBoard } from "@/components/GameBoard";
import { TeamDicePanel } from "@/components/TeamDicePanel";
import { toQRCodeDataUrl } from "@/lib/qr";
import { useSessionState } from "@/lib/useSessionState";
import type { SessionState } from "@/types/game";

export default function HostPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [teamNamesText, setTeamNamesText] = useState("Team One\nTeam Two");
  const [sessionCode, setSessionCode] = useState("");
  const [qr, setQr] = useState("");
  const [busy, setBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [sessionBootstrap, setSessionBootstrap] = useState<SessionState | null>(null);
  const [qrOverlayOpen, setQrOverlayOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const { session, loading, error: loadError, refresh } = useSessionState(sessionCode, sessionBootstrap);

  // Resume host after reload: /host?code=SESSIONCODE
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("code")?.trim().toUpperCase();
    if (!fromUrl) return;
    setSessionCode(fromUrl);
    setSessionBootstrap(null);
    setQr("");
  }, []);

  useEffect(() => {
    if (!sessionCode) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("code")?.toUpperCase() === sessionCode) return;
    router.replace(`${pathname}?code=${encodeURIComponent(sessionCode)}`, { scroll: false });
  }, [sessionCode, pathname, router]);

  function leaveSession() {
    setSessionCode("");
    setSessionBootstrap(null);
    setQr("");
    router.replace(pathname || "/host", { scroll: false });
  }

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
      setQr("");
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

  useEffect(() => {
    if (!qrOverlayOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setQrOverlayOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [qrOverlayOpen]);

  async function openQrOverlay() {
    if (!joinUrl) return;
    setQrOverlayOpen(true);
    if (!qr) {
      setQrLoading(true);
      try {
        setQr(await toQRCodeDataUrl(joinUrl));
      } finally {
        setQrLoading(false);
      }
    }
  }

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
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <p className="font-medium">Could not load session</p>
          <p>{loadError}</p>
          <p className="mt-2 text-xs">
            If you just started the app, run <code className="rounded bg-white px-1 dark:bg-zinc-800">npm run db:push</code> then try again.
          </p>
          <button type="button" className="mt-3 text-sm font-medium underline" onClick={leaveSession}>
            Start a new session (clear URL)
          </button>
        </div>
      )}

      {session && (
        <>
          <section className="rounded border border-zinc-200 p-4 dark:border-zinc-700">
            <h2 className="text-xl font-semibold">Session {session.code}</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Status: {session.status}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Round: {session.round}</p>
            <p className="mt-2 text-lg">Active Team: {activeTeam?.name ?? "-"}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="rounded bg-black px-3 py-2 text-white dark:bg-zinc-100 dark:text-black" onClick={() => runAction("start")}>
                Start Game
              </button>
              <button className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600" onClick={() => runAction("next")}>
                Next Turn
              </button>
              <button className="rounded border border-red-300 px-3 py-2 text-red-700 dark:border-red-800 dark:text-red-400" onClick={() => runAction("end")}>
                End Game
              </button>
              <button
                type="button"
                className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600"
                onClick={() => void openQrOverlay()}
              >
                Show QR (with code)
              </button>
            </div>
            {joinUrl && (
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                Join URL: {joinUrl}
                <span className="mt-1 block text-zinc-600 dark:text-zinc-500">
                  Bookmark or share this host page (includes <span className="font-mono">?code=</span>
                  {session.code}) so you can reload without losing the room.
                </span>
              </p>
            )}
            <button type="button" className="mt-3 text-sm text-zinc-600 underline dark:text-zinc-400" onClick={leaveSession}>
              Leave session / create another
            </button>
          </section>

          {qrOverlayOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="qr-overlay-title"
              onClick={() => setQrOverlayOpen(false)}
            >
              <div
                className="max-h-[90vh] w-full max-w-sm overflow-auto rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-600 dark:bg-zinc-900"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 id="qr-overlay-title" className="text-lg font-semibold">
                    Join this session
                  </h2>
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    onClick={() => setQrOverlayOpen(false)}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Scan with a phone or use the code on /join.</p>
                <div className="mt-4 flex flex-col items-center gap-3">
                  {qrLoading && <p className="text-sm text-zinc-500">Generating QR…</p>}
                  {!qrLoading && qr && <img src={qr} alt="Join QR code" className="h-56 w-56 rounded-lg border border-zinc-200 dark:border-zinc-600" />}
                  <p className="text-center text-sm">
                    Code:{" "}
                    <span className="font-mono text-lg font-bold tracking-wider">{session.code}</span>
                  </p>
                  {joinUrl && (
                    <p className="break-all text-center text-xs text-zinc-500 dark:text-zinc-400">{joinUrl}</p>
                  )}
                </div>
                <button
                  type="button"
                  className="mt-6 w-full rounded bg-black py-2 text-white dark:bg-zinc-100 dark:text-black"
                  onClick={() => setQrOverlayOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          <section className="rounded border border-zinc-200 p-4 dark:border-zinc-700">
            <h2 className="text-xl font-semibold">Board</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Each team has a piece on their tile; dice shows the last value each team rolled.
            </p>
            <div className="mt-4">
              <TeamDicePanel teams={session.teams} activeTeamId={session.activeTeamId} />
            </div>
            <div className="mt-4">
              <GameBoard board={session.board} teams={session.teams} />
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
