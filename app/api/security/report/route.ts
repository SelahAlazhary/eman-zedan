import { NextResponse } from "next/server";
import { loadDB } from "@/lib/db";
import { recordEvent } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * نقطة تسجيل داخلية: تُحوَّل إليها الطلبات التي صدّتها الطبقة الأمامية
 * (أصل خارجي أو فحص مسارات) لتُسجَّل في سجلّ الأمان ثم تُرفض.
 * لا تُستدعى من الواجهة إطلاقاً.
 */
async function handle(req: Request) {
  await loadDB();
  const kind = req.headers.get("x-blocked-kind") === "probe" ? "path_probe" : "csrf_blocked";
  const target = (req.headers.get("x-blocked-path") ?? "").slice(0, 120);
  const origin = (req.headers.get("origin") ?? "").slice(0, 120);
  await recordEvent(kind, `${target}${origin ? ` ← ${origin}` : ""}`);
  return NextResponse.json({ error: kind === "path_probe" ? "غير موجود" : "طلب غير صالح" },
    { status: kind === "path_probe" ? 404 : 403 });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
