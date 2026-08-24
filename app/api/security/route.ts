import { NextResponse } from "next/server";
import { loadDB, flushDB } from "@/lib/db";
import { securityOverview, banIp, unbanIp, recordEvent } from "@/lib/security";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET: سجلّ الأمان والمحظورين — للأدمن فقط. */
export async function GET() {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    await recordEvent("unauthorized_admin", "/api/security");
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  return NextResponse.json(securityOverview());
}

/** POST: { action: "ban" | "unban", ip, minutes? } — للأدمن فقط. */
export async function POST(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    await recordEvent("unauthorized_admin", "/api/security");
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const { action, ip, minutes } = await req.json().catch(() => ({}));
  const target = String(ip ?? "").trim();
  if (!target) return NextResponse.json({ error: "حدّد العنوان" }, { status: 400 });

  if (action === "unban") unbanIp(target);
  else banIp(target, Math.min(43200, Math.max(5, Number(minutes) || 60)), "حظر يدوي من اللوحة");

  await flushDB();
  return NextResponse.json({ ok: true, ...securityOverview() });
}
