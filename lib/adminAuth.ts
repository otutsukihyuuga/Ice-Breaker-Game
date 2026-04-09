import type { NextRequest } from "next/server";

export function isAdminAuthorized(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-key") || req.nextUrl.searchParams.get("key");
  return !!process.env.ADMIN_KEY && token === process.env.ADMIN_KEY;
}
