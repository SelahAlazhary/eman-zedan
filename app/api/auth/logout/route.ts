import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";
import { loadDB } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  await loadDB();
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
