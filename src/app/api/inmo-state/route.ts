import { NextResponse } from "next/server";
import type { InmoState } from "@/lib/inmoData";
import { readInmoState, writeInmoState } from "@/lib/server/inmoRepository";

export async function GET() {
  const result = await readInmoState();
  return NextResponse.json(result.data, {
    headers: {
      "x-inmo-state-source": result.source,
    },
  });
}

export async function PUT(request: Request) {
  const state = (await request.json()) as InmoState;
  const result = await writeInmoState(state);
  return NextResponse.json({ ok: true, source: result.source });
}
