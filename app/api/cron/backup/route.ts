import { NextResponse } from "next/server";
import { loadDB, flushDB } from "@/lib/db";
import { createBackup } from "@/lib/backup";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * نسخة احتياطية مجدولة (Vercel Cron).
 * تُستدعى يومياً من الجدول المعرّف في vercel.json، ولا تُنفَّذ إلا بترويسة
 * التفويض الصحيحة — فلا يستطيع أحد استدعاؤها من الخارج.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") !== null;

  if (!isVercelCron && (!secret || auth !== `Bearer ${secret}`)) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  await loadDB();
  const result = await createBackup("auto");
  await flushDB();
  return NextResponse.json({ ok: result.ok, at: result.at, size: result.size, drive: result.drive.ok, cloud: result.firebase.ok });
}
