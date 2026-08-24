import { NextResponse } from "next/server";
import { getDB, loadDB } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET: رابط الدرس المجاني — للمسجّلين فقط (لا يُرسل في الحمولة العامة إطلاقاً). */
export async function GET() {
  await loadDB();
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "سجّل الدخول لمشاهدة الدرس المجاني" }, { status: 401 });
  }
  const url = getDB().content.cta?.videoUrl?.trim() || "";
  if (!url) return NextResponse.json({ error: "لم يُضَف درس مجاني بعد" }, { status: 404 });
  return NextResponse.json({ url }, { headers: { "Cache-Control": "no-store, private" } });
}
