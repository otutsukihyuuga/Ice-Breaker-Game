import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isAuthorized(req: NextRequest) {
  const token = req.headers.get("x-admin-key") || req.nextUrl.searchParams.get("key");
  return !!process.env.ADMIN_KEY && token === process.env.ADMIN_KEY;
}

/** Lists all game sessions (newest first). Same auth as /api/admin/prompts. */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      teams: { select: { id: true, name: true, position: true } },
    },
  });

  return NextResponse.json({ sessions });
}
