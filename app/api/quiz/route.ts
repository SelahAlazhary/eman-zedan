import { NextResponse } from "next/server";
import { gradeQuiz, loadDB, flushDB } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST: تسليم إجابات اختبار درس — التصحيح يتم على السيرفر.
 *  { subjectId, lessonId, answers: number[] }
 */
export async function POST(req: Request) {
  await loadDB();
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const subjectId = String(body?.subjectId ?? "");
  const lessonId = String(body?.lessonId ?? "");
  const answers = Array.isArray(body?.answers) ? body.answers.map((a: unknown) => Number(a)) : null;
  if (!subjectId || !lessonId || !answers) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  const out = gradeQuiz(session.uid, subjectId, lessonId, answers);
  if (!out.ok) return NextResponse.json({ error: out.error }, { status: 400 });
  await flushDB();
  return NextResponse.json({ ok: true, result: out.result, correct: out.correct });
}
