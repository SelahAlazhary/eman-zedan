import { NextResponse } from "next/server";
import { gradeExam, loadDB, flushDB } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST: تسليم إجابات اختبار — التصحيح على السيرفر فقط.
 * { examId, answers: number[] }  (‑1 = بلا إجابة)
 */
export async function POST(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const b = await req.json().catch(() => null);
  const examId = String(b?.examId ?? "");
  const answers = Array.isArray(b?.answers) ? b.answers.map((a: unknown) => Number(a)) : null;
  if (!examId || !answers) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });

  const out = gradeExam(session.uid, examId, answers);
  if (!out.ok) return NextResponse.json({ error: out.error }, { status: 400 });
  await flushDB();
  return NextResponse.json({ ok: true, attempt: out.attempt, correct: out.correct });
}
