"use client";

import type { PromptType } from "@/lib/constants";
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
  const [clientId, setClientId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [isCaptain, setIsCaptain] = useState(false);
  const [wildcardChoice, setWildcardChoice] = useState<PromptType>("MOVE");
  const [code, setCode] = useState("");

  useEffect(() => {
    (async () => {
      const p = await params;
      setCode(p.code.toUpperCase());
      setClientId(getClientId());
    })();
  }, [params]);

  const { session, refresh } = useSessionState(code);
  const myTeam = session?.teams.find((t) => t.id === teamId);
  const isMyTurn = !!(myTeam && session?.activeTeamId === myTeam.id);

  async function joinTeam(nextTeamId: string) {
    setTeamId(nextTeamId);
    const res = await fetch("/api/teams/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, teamId: nextTeamId, clientId }),
    });
    const payload = await res.json();
    setIsCaptain(payload.isCaptain);
    await refresh();
  }

  async function roll() {
    await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "roll", code, clientId, wildcardChoice }),
    });
    await refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-bold">Session {code}</h1>
      <p className="text-sm text-zinc-600">Status: {session?.status ?? "Loading..."}</p>

      {!teamId && (
        <section className="rounded border border-zinc-200 p-4">
          <h2 className="font-semibold">Choose your team</h2>
          <div className="mt-3 grid gap-2">
            {session?.teams.map((team) => (
              <button key={team.id} className="rounded border border-zinc-300 p-2 text-left" onClick={() => joinTeam(team.id)}>
                {team.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {teamId && (
        <section className="rounded border border-zinc-200 p-4">
          <p>
            Team: <span className="font-semibold">{myTeam?.name}</span> {isCaptain ? "(Captain)" : ""}
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
              onClick={roll}
              disabled={!isMyTurn || !isCaptain || session?.status !== "ACTIVE"}
              className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              Roll Dice
            </button>
          </div>
        </section>
      )}

      {session?.currentPrompt && (
        <section className="rounded bg-zinc-100 p-4">
          <p className="text-xs uppercase">{session.currentPromptType}</p>
          <p className="text-lg font-medium">{session.currentPrompt}</p>
        </section>
      )}
    </main>
  );
}
