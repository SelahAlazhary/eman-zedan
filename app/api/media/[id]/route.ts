import { NextResponse } from "next/server";
import { driveAccessToken } from "@/lib/google";
import { getDB, loadDB } from "@/lib/db";
import { recordEvent } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * وسيط ملفات Google Drive.
 *
 * لماذا؟ جوجل تحجب صور Drive عندما يرسل المتصفّح ترويسة Referer (حماية من الاقتباس)،
 * فتظهر الصورة في curl ولا تظهر داخل الموقع. الحلّ أن نخدمها من نطاقنا:
 * الخادم يجلبها من Drive برمز التطبيق (بلا مشاركة عامة ولا Referer) ويمرّرها للمتصفّح.
 * كما يدعم Range ليعمل تمرير الفيديو والصوت.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  await loadDB();
  const { id } = await ctx.params;
  if (!/^[\w-]{10,}$/.test(id)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }

  // لا يُخدَم إلا ملف مذكور فعلاً داخل بيانات المنصّة —
  // فلا يتحوّل الخادم إلى وسيط مفتوح لبقية ملفات حساب Drive.
  if (!referencedInPlatform(id)) {
    await recordEvent("media_denied", `طلب ملف غير مسجّل: ${id.slice(0, 12)}…`);
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }

  let token: string;
  try {
    token = await driveAccessToken();
  } catch {
    // لا ربط بجوجل — نعيد التوجيه للرابط العام كحلّ أخير
    return NextResponse.redirect(`https://lh3.googleusercontent.com/d/${id}`);
  }

  const range = req.headers.get("range");
  const upstream = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true`, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(range ? { Range: range } : {}),
    },
    cache: "no-store",
  });

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json({ error: "تعذّر جلب الملف" }, { status: upstream.status });
  }

  const headers = new Headers();
  const pass = ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"];
  pass.forEach((h) => {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  });
  headers.set("Cache-Control", "public, max-age=86400, immutable");
  headers.set("Accept-Ranges", headers.get("accept-ranges") ?? "bytes");

  return new NextResponse(upstream.body, { status: upstream.status, headers });
}

/** هل معرّف الملف مذكور في أي مكان داخل بيانات المنصّة؟ */
function referencedInPlatform(id: string): boolean {
  try {
    const db = getDB();
    const haystack = JSON.stringify({
      content: db.content,
      subjects: db.subjects,
      exams: db.exams,
      live: db.live,
      youtube: db.youtube,
    });
    return haystack.includes(id);
  } catch {
    return false;
  }
}
