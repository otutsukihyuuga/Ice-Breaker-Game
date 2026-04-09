import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

/** Read-only snapshot of main tables for admin debugging (same auth as other /api/admin/*). */
export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [sessions, teams, prompts, sessionPromptHistory] = await Promise.all([
    prisma.session.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        teams: { orderBy: { position: "asc" } },
        _count: { select: { promptHistory: true } },
      },
    }),
    prisma.team.findMany({
      orderBy: { createdAt: "desc" },
      include: { session: { select: { code: true } } },
    }),
    prisma.prompt.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.sessionPromptHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { session: { select: { code: true } } },
    }),
  ]);

  return NextResponse.json({ sessions, teams, prompts, sessionPromptHistory });
}
