import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectWithCode } from "@/lib/google";
import { getSession } from "@/lib/session";
import { loadDB } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET: عودة جوجل بعد الموافقة — يُبدّل الكود برموز ويحفظها على الخادم. */
export async function GET(req: Request) {
  await loadDB();
  const url = new URL(req.url);
  const back = (msg: string) => NextResponse.redirect(new URL(`/admin/live?google=${msg}`, url.origin));

  const session = await getSession();
  if (!session || session.role !== "admin") return back("unauthorized");

  if (url.searchParams.get("error")) return back("denied");

  const store = await cookies();
  const expected = store.get("emz_gstate")?.value;
  const state = url.searchParams.get("state");
  store.delete("emz_gstate");
  if (!expected || !state || expected !== state) return back("state");

  const code = url.searchParams.get("code");
  if (!code) return back("nocode");

  try {
    await connectWithCode(req, code);
    return back("connected");
  } catch {
    return back("failed");
  }
}
