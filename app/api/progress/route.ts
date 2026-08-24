import { NextResponse } from "next/server";
import { setUserProgress, getDB, userOwnsSubject, loadDB, flushDB } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST: تحديث تقدّم الطالب في كورس مُفعّل له — { subjectId, value } */
export async function POST(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const { subjectId, value } = await req.json();
  const me = getDB().users.find((u) => u.id === session.uid);
  // الاشتراك الساري هو مصدر الصلاحية (لا الحقل القديم enrolled)
  if (!me || !userOwnsSubject(me, String(subjectId))) {
    return NextResponse.json({ error: "الكورس غير مُفعّل" }, { status: 403 });
  }
  const progress = setUserProgress(session.uid, String(subjectId), Number(value));
  await flushDB();
  return NextResponse.json({ ok: true, progress });
}
