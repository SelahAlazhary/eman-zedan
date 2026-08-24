import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { loadDB } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  await loadDB();
  const session = await getSession();
  return NextResponse.json({ session });
}
