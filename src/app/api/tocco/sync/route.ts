import { NextResponse } from "next/server";
import { readInmoState, writeInmoState } from "@/lib/server/inmoRepository";
import { syncToccoProperties } from "@/lib/server/tocco";

export async function POST() {
  const { data } = await readInmoState();
  const nextState = await syncToccoProperties(data);
  await writeInmoState(nextState);
  return NextResponse.json({
    ok: true,
    log: nextState.toccoSyncLogs[0] ?? null,
  });
}
