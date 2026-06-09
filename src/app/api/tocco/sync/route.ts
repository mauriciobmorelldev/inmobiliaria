import { NextResponse } from "next/server";
import { readInmoState, writeInmoState } from "@/lib/server/inmoRepository";
import { syncToccoProperties } from "@/lib/server/tocco";

export async function POST(request: Request) {
  const syncSecret = process.env.TOCCO_SYNC_SECRET;
  const requestSecret = request.headers.get("x-tocco-sync-secret");
  if (!syncSecret || requestSecret !== syncSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await readInmoState();
  const nextState = await syncToccoProperties(data);
  await writeInmoState(nextState);
  return NextResponse.json({
    ok: true,
    log: nextState.toccoSyncLogs[0] ?? null,
  });
}
