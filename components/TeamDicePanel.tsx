import type { SessionState } from "@/types/game";

type Team = SessionState["teams"][number];

export function TeamDicePanel({
  teams,
  activeTeamId,
}: {
  teams: Team[];
  activeTeamId: string | null;
}) {
  return (
    <div className="rounded border border-zinc-200 p-3 dark:border-zinc-700">
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Dice (last roll per team)</h3>
      <ul className="mt-2 space-y-2">
        {teams.map((t) => {
          const active = t.id === activeTeamId;
          return (
            <li
              key={t.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm ${
                active ? "bg-zinc-100 dark:bg-zinc-800" : ""
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-lg" aria-hidden>
                  {t.token}
                </span>
                <span className="font-medium">{t.name}</span>
                {active && (
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Turn</span>
                )}
              </span>
              <span className="font-mono tabular-nums text-zinc-700 dark:text-zinc-200">
                {t.lastDiceRoll != null ? (
                  <>
                    <span className="text-zinc-500 dark:text-zinc-400">rolled </span>
                    <span className="text-lg font-semibold">{t.lastDiceRoll}</span>
                  </>
                ) : (
                  <span className="text-zinc-400">No roll yet</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
