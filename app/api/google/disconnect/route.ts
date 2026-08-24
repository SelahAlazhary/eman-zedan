import { NextResponse } from "next/server";
import { disconnectGoogle } from "@/lib/google";
import { getSession } from "@/lib/session";
import { recordEvent } from "@/lib/security";
import { loadDB } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST: فكّ ربط حساب جوجل وإلغاء الرموز عند جوجل — للأدمن فقط. */
export async function POST() {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    await recordEvent("unauthorized_admin", "/api/google/disconnect");
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  await disconnectGoogle();
  return NextResponse.json({ ok: true });
}
