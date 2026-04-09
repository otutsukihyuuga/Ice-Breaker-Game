import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isAuthorized(req: NextRequest) {
  const token = req.headers.get("x-admin-key") || req.nextUrl.searchParams.get("key");
  return !!process.env.ADMIN_KEY && token === process.env.ADMIN_KEY;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
