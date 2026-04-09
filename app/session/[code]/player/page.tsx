"use client";

import { GameBoard } from "@/components/GameBoard";
import { TeamDicePanel } from "@/components/TeamDicePanel";
import type { PromptType } from "@/lib/constants";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSessionState } from "@/lib/useSessionState";

function getClientId() {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem("ibg_client_id");
  if (existing) return existing;
  const next = crypto.randomUUID();
  localStorage.setItem("ibg_client_id", next);
  return next;
}

export default function PlayerPage({ params }: { params: Promise<{ code: string }> }) {
  const [teamId, setTeamId] = useState("");
  const [isCaptain, setIsCaptain] = useState(false);
  const [wildcardChoice, setWildcardChoice] = useState<PromptType>("MOVE");
  const [code, setCode] = useState("");

  useEffect(() => {
    void (async () => {
      const p = await params;
      setCode(p.code.toUpperCase());
    })();
  }, [params]);

  const { session, loading, error, notFound, refresh } = useSessionState(code);
  const myTeam = session?.teams.find((t) => t.id === teamId);
  const isMyTurn = !!(myTeam && session?.activeTeamId === myTeam.id);
  const [joinErr, setJoinErr] = useState<string | null>(null);
  const [rollErr, setRollErr] = useState<string | null>(null);

  async function joinTeam(nextTeamId: string) {
    setJoinErr(null);
    const cid = getClientId();
    if (!cid) {
      setJoinErr("Could not create a player id. Allow storage or try another browser.");
      return;
    }
    setTeamId(nextTeamId);
    const res = await fetch("/api/teams/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, teamId: nextTeamId, clientId: cid }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setTeamId("");
      setIsCaptain(false);
      setJoinErr(typeof payload.error === "string" ? payload.error : `Join failed (${res.status})`);
      return;
    }
    setIsCaptain(!!payload.isCaptain);
    await refresh();
  }

  async function roll() {
    setRollErr(null);
    const cid = getClientId();
    if (!cid) {
      setRollErr("Missing player id. Reload the page and join your team again.");
      return;
    }
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "roll", code, clientId: cid, wildcardChoice }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setRollErr(typeof payload.error === "string" ? payload.error : `Roll failed (${res.status})`);
      return;
    }
    await refresh();
  }

  if (!code) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 px-4 py-6">
        <p className="text-sm text-zinc-600">Loading session…</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 px-4 py-6">
        <h1 className="text-2xl font-bold">Session not found</h1>
        <p className="text-zinc-600">
          There is no game with code <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">{code}</span>.
          Check the code or ask the host for a new link.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link className="rounded bg-black px-4 py-2 text-white" href="/join">
            Enter a code
          </Link>
          <Link className="rounded border border-zinc-300 px-4 py-2 dark:border-zinc-600" href="/">
            Home
          </Link>
        </div>
      </main>
    );
  }

  if (error && !session) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 px-4 py-6">
        <h1 className="text-2xl font-bold">Session {code}</h1>
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <p className="font-medium">Could not load session</p>
          <p className="mt-1">{error}</p>
        </div>
        <Link className="text-sm text-zinc-600 underline" href="/join">
          Back to join
        </Link>
      </main>
    );
  }

  if (loading || !session) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 px-4 py-6">
        <h1 className="text-2xl font-bold">Session {code}</h1>
        <p className="text-sm text-zinc-600">Loading session…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-bold">Session {code}</h1>
      <p className="text-sm text-zinc-600">Status: {session.status}</p>

      <section className="rounded border border-zinc-200 p-4 dark:border-zinc-700">
        <h2 className="font-semibold">Board</h2>
        <div className="mt-3">
          <TeamDicePanel teams={session.teams} activeTeamId={session.activeTeamId} />
        </div>
        <div className="mt-4 overflow-x-auto">
          <GameBoard board={session.board} teams={session.teams} />
        </div>
      </section>

      {!teamId && (
        <section className="rounded border border-zinc-200 p-4 dark:border-zinc-700">
          <h2 className="font-semibold">Choose your team</h2>
          {joinErr && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{joinErr}</p>}
          <div className="mt-3 grid gap-2">
            {session.teams.map((team) => (
              <button
                key={team.id}
                className="flex items-center gap-2 rounded border border-zinc-300 p-2 text-left dark:border-zinc-600"
                onClick={() => joinTeam(team.id)}
              >
                <span className="text-xl" aria-hidden>
                  {team.token}
                </span>
                <span>{team.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {teamId && (
        <section className="rounded border border-zinc-200 p-4 dark:border-zinc-700">
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-2xl" aria-hidden>
              {myTeam?.token}
            </span>
            <span>
              Team: <span className="font-semibold">{myTeam?.name}</span> {isCaptain ? "(Captain)" : ""}
            </span>
          </p>
          <p className="text-sm text-zinc-600">{isMyTurn ? "Your team is active." : "Waiting for your turn."}</p>

          <div className="mt-3 flex flex-col gap-2">
            <label className="text-sm">Wildcard choice (if landed on wildcard)</label>
            <select
              className="rounded border border-zinc-300 p-2"
              value={wildcardChoice}
              onChange={(e) => setWildcardChoice(e.target.value as PromptType)}
            >
              <option value="MOVE">MOVE</option>
              <option value="TALK">TALK</option>
              <option value="CREATE">CREATE</option>
            </select>
            <button
              type="button"
              onClick={() => void roll()}
              disabled={!isMyTurn || !isCaptain || session.status !== "ACTIVE"}
              className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-black"
            >
              Roll Dice
            </button>
            {rollErr && <p className="text-sm text-red-600 dark:text-red-400">{rollErr}</p>}
            {session.status !== "ACTIVE" && (
              <p className="text-xs text-zinc-500">The host must press Start Game before anyone can roll.</p>
            )}
            {session.status === "ACTIVE" && !isCaptain && (
              <p className="text-xs text-zinc-500">Only your team&apos;s first player (captain) can roll.</p>
            )}
            {session.status === "ACTIVE" && isCaptain && !isMyTurn && (
              <p className="text-xs text-zinc-500">Wait until it is your team&apos;s turn to roll.</p>
            )}
          </div>
        </section>
      )}

      {session.currentPrompt && (
        <section className="rounded border border-zinc-300 bg-zinc-100 p-4 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
            {session.currentPromptType}
          </p>
          <p className="mt-1 text-lg font-medium leading-snug">{session.currentPrompt}</p>
        </section>
      )}
    </main>
  );
}
