import { NextResponse } from "next/server";
import { redeemCode, loadDB, flushDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { clientIp, limit } from "@/lib/guard";
import { recordEvent, bannedUntil } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST: تفعيل كورس بكود — للطالب المسجّل فقط. */
export async function POST(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "سجّل الدخول كطالب أولاً" }, { status: 401 });
  }
  const ip = await clientIp();
  if (bannedUntil(ip)) {
    await recordEvent("banned_hit", "محاولة تفعيل من عنوان محظور");
    return NextResponse.json({ error: "تم إيقاف المحاولات مؤقّتاً" }, { status: 429 });
  }
  const gate = limit(`redeem:${session.uid}`, 10, 10 * 60_000, 30 * 60_000);
  if (!gate.ok) {
    await recordEvent("rate_limited", "تجاوز حدّ محاولات أكواد التفعيل", { userId: session.uid });
    return NextResponse.json({ error: "محاولات كثيرة — انتظر قليلاً ثم أعد المحاولة" }, { status: 429 });
  }

  const { code, subjectId } = await req.json();
  if (!code) return NextResponse.json({ error: "أدخل كود التفعيل" }, { status: 400 });

  const result = redeemCode(session.uid, String(code), subjectId ? String(subjectId) : undefined);
  if (!result.ok) {
    await recordEvent("bad_code", `كود مرفوض: ${result.error}`, { userId: session.uid });
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
