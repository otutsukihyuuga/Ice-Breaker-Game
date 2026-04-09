import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emitSessionUpdate } from "@/lib/realtime";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const code = (body.code ?? "").toUpperCase();
  const teamId = body.teamId as string;
  const clientId = body.clientId as string;

  if (!code || !teamId || !clientId) {
    return NextResponse.json({ error: "Missing payload" }, { status: 400 });
  }

  const session = await prisma.session.findUnique({ where: { code }, include: { teams: true } });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const team = session.teams.find((t) => t.id === teamId);
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  const claimingCaptain = !team.captainClientId;
  if (claimingCaptain) {
    await prisma.team.update({ where: { id: team.id }, data: { captainClientId: clientId } });
  }

  const updated = await prisma.team.findUnique({ where: { id: team.id } });
  const playerIsCaptain = updated?.captainClientId === clientId;

  emitSessionUpdate(code);
  return NextResponse.json({ ok: true, isCaptain: !!playerIsCaptain });
}
