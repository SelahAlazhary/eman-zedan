import { NextResponse } from "next/server";
import { markNotificationsRead, loadDB } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST: تعليم إشعارات الطالب كمقروءة — { ids: string[] } */
export async function POST(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const ids = Array.isArray(body?.ids) ? body.ids.map(String) : [];
  markNotificationsRead(session.uid, ids);
  return NextResponse.json({ ok: true });
}
