import { NextRequest, NextResponse } from "next/server";
import type { PromptType } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

function isAuthorized(req: NextRequest) {
  const token = req.headers.get("x-admin-key") || req.nextUrl.searchParams.get("key");
  return !!process.env.ADMIN_KEY && token === process.env.ADMIN_KEY;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const type = req.nextUrl.searchParams.get("type") as PromptType | null;

  const prompts = await prisma.prompt.findMany({
    where: type ? { type } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ prompts });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
