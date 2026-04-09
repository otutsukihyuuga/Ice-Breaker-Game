/** Stable board piece per team order (creation order within the session). */
const TOKENS = ["🔴", "🔵", "🟢", "🟡", "🟣", "🟠", "🟤", "⚪"] as const;

export function tokenForTeamIndex(index: number): string {
  return TOKENS[index % TOKENS.length]!;
}
