import { NextRequest, NextResponse } from "next/server";
import type { PromptType } from "@/lib/constants";
import { isAdminAuthorized } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const type = req.nextUrl.searchParams.get("type") as PromptType | null;

  const prompts = await prisma.prompt.findMany({
    where: type ? { type } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ prompts });
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const created = await prisma.prompt.create({
    data: {
      text: body.text,
      type: body.type,
      enabled: body.enabled ?? true,
    },
  });

  return NextResponse.json({ prompt: created });
}
