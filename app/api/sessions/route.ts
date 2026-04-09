import { NextRequest, NextResponse } from "next/server";
import type { PromptType } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { createSessionCode } from "@/lib/sessionCode";
import { emitSessionUpdate } from "@/lib/realtime";
import { advanceTurn, executeRoll, getSessionState } from "@/lib/gameEngine";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const session = await getSessionState(code.toUpperCase());
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  return NextResponse.json({ session });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = (body.action as string | undefined) ?? "create";

  if (action === "create") {
    const teamNames = Array.isArray(body.teamNames) ? body.teamNames : [];
    if (!teamNames.length) return NextResponse.json({ error: "At least one team required" }, { status: 400 });

    try {
      let code = createSessionCode();
      while (await prisma.session.findUnique({ where: { code } })) code = createSessionCode();

      await prisma.session.create({
        data: {
          code,
          teams: { create: teamNames.map((name: string) => ({ name })) },
        },
      });

      const session = await getSessionState(code);
      if (!session) {
        return NextResponse.json({ error: "Session created but could not load state" }, { status: 500 });
      }

      return NextResponse.json({ session });
    } catch (err) {
      console.error("create session failed", err);
      const message = err instanceof Error ? err.message : "Could not create session";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (action === "start" || action === "end") {
    const code: string = String(body.code ?? "").toUpperCase();
    if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

    const status = action === "start" ? "ACTIVE" : "ENDED";
    await prisma.session.update({ where: { code }, data: { status } });
    emitSessionUpdate(code);
    return NextResponse.json({ ok: true });
  }

  if (action === "roll") {
    const code: string = String(body.code ?? "").toUpperCase();
    const clientId: string = String(body.clientId ?? "");
    const rawWildcard = body.wildcardChoice;
    const wildcardChoice: PromptType | undefined =
      rawWildcard === "MOVE" || rawWildcard === "TALK" || rawWildcard === "CREATE" ? rawWildcard : undefined;

    if (!code || !clientId) return NextResponse.json({ error: "Missing roll payload" }, { status: 400 });

    try {
      const result = await executeRoll(code, clientId, wildcardChoice);
      emitSessionUpdate(code);
      return NextResponse.json({ result });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Roll failed" }, { status: 400 });
    }
  }

  if (action === "next") {
    const code: string = String(body.code ?? "").toUpperCase();
    if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

    await advanceTurn(code);
    emitSessionUpdate(code);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
