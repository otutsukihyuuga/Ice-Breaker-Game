import type { PromptType, SessionStatus } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { tokenForTeamIndex } from "@/lib/teamTokens";

export const BOARD: PromptType[] = [
  "MOVE",
  "TALK",
  "CREATE",
  "WILDCARD",
  "TALK",
  "MOVE",
  "CREATE",
  "TALK",
  "MOVE",
  "WILDCARD",
  "CREATE",
  "TALK",
  "MOVE",
  "CREATE",
  "TALK",
  "WILDCARD",
  "MOVE",
  "CREATE",
  "TALK",
  "MOVE",
];

export function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

export async function getSessionState(code: string) {
  const session = await prisma.session.findUnique({
    where: { code },
    include: { teams: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) return null;

  const teams = session.teams.map((t, i) => ({
    id: t.id,
    name: t.name,
    position: t.position,
    captainClientId: t.captainClientId,
    lastDiceRoll: t.lastDiceRoll,
    token: tokenForTeamIndex(i),
  }));

  return {
    id: session.id,
    code: session.code,
    status: session.status as SessionStatus,
    currentTeamIndex: session.currentTeamIndex,
    round: session.round,
    currentPrompt: session.currentPrompt,
    currentPromptType: session.currentPromptType as PromptType | null,
    teams,
    board: BOARD,
    activeTeamId: session.teams[session.currentTeamIndex]?.id ?? null,
  };
}

async function drawPrompt(sessionId: string, type: PromptType) {
  const history = await prisma.sessionPromptHistory.findMany({
    where: { sessionId },
    select: { promptId: true },
  });
  const usedIds = history.map((h) => h.promptId);

  const candidates = await prisma.prompt.findMany({
    where: {
      enabled: true,
      type,
      id: { notIn: usedIds.length ? usedIds : undefined },
    },
  });

  if (!candidates.length) {
    const fallback = await prisma.prompt.findMany({ where: { enabled: true, type } });
    if (!fallback.length) return null;
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

export async function executeRoll(code: string, clientId: string, wildcardChoice?: PromptType) {
  const session = await prisma.session.findUnique({
    where: { code },
    include: { teams: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) throw new Error("Session not found");
  if (session.status !== "ACTIVE") throw new Error("Session is not active");

  const team = session.teams[session.currentTeamIndex];
  if (!team) throw new Error("No active team");
  if (!team.captainClientId || team.captainClientId !== clientId) throw new Error("Only captain can roll");

  const dice = rollDice();
  const newPosition = (team.position + dice) % BOARD.length;
  const tileType = BOARD[newPosition];
  const finalType = tileType === "WILDCARD" ? wildcardChoice : tileType;

  if (!finalType || finalType === "WILDCARD") {
    throw new Error("Wildcard requires category selection");
  }

  const prompt = await drawPrompt(session.id, finalType);
  if (!prompt) throw new Error("No prompts available for this type");

  await prisma.$transaction([
    prisma.team.update({
      where: { id: team.id },
      data: { position: newPosition, lastDiceRoll: dice },
    }),
    prisma.session.update({
      where: { id: session.id },
      data: { currentPromptId: prompt.id, currentPrompt: prompt.text, currentPromptType: finalType },
    }),
    prisma.sessionPromptHistory.create({ data: { sessionId: session.id, promptId: prompt.id } }),
  ]);

  return { dice, position: newPosition, tileType, prompt: prompt.text, promptType: finalType };
}

export async function advanceTurn(code: string) {
  const session = await prisma.session.findUnique({
    where: { code },
    include: { teams: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) throw new Error("Session not found");
  if (!session.teams.length) throw new Error("No teams available");

  const nextIndex = (session.currentTeamIndex + 1) % session.teams.length;
  const wraps = nextIndex === 0;

  await prisma.session.update({
    where: { id: session.id },
    data: {
      currentTeamIndex: nextIndex,
      round: wraps ? session.round + 1 : session.round,
      currentPromptId: null,
      currentPrompt: null,
      currentPromptType: null,
    },
  });
}
