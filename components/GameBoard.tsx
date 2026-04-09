import type { PromptType } from "@/lib/constants";
import type { SessionState } from "@/types/game";

type Team = SessionState["teams"][number];

export function GameBoard({
  board,
  teams,
}: {
  board: PromptType[];
  teams: Team[];
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {board.map((tile, index) => {
        const onTile = teams.filter((t) => t.position === index);
        return (
          <div
            key={index}
            className="rounded border border-zinc-200 p-2 text-xs dark:border-zinc-700"
          >
            <div className="font-semibold text-zinc-500">{index + 1}</div>
            <div className="font-medium">{tile}</div>
            <div className="mt-2 min-h-[28px]">
              {onTile.length > 0 ? (
                <div className="flex flex-wrap items-center justify-center gap-1">
                  {onTile.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-zinc-800 bg-white text-base shadow-sm dark:border-zinc-200 dark:bg-zinc-800"
                      title={t.name}
                    >
                      {t.token}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[11px] text-zinc-400">—</span>
              )}
            </div>
            {onTile.length > 0 && (
              <div className="mt-1 text-[10px] leading-tight text-zinc-500 dark:text-zinc-400">
                {onTile.map((t) => t.name).join(", ")}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
