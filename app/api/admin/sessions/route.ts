import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

/** Lists all game sessions (newest first). Same auth as /api/admin/prompts. */
export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      teams: { select: { id: true, name: true, position: true } },
    },
  });

  return NextResponse.json({ sessions });
}
