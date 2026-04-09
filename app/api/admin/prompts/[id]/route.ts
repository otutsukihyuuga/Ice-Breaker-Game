import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const prompt = await prisma.prompt.update({
    where: { id },
    data: {
      text: body.text,
      type: body.type,
      enabled: body.enabled,
    },
  });

  return NextResponse.json({ prompt });
}
