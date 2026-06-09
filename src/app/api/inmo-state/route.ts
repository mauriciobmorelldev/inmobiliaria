import { NextResponse } from "next/server";
import type { InmoState } from "@/lib/inmoData";
import { readInmoState, writeInmoState } from "@/lib/server/inmoRepository";

export async function GET() {
  const result = await readInmoState();
  return NextResponse.json({
    ...result.data,
    adminUsers: result.data.adminUsers.map((admin) => ({
      ...admin,
      password: "",
    })),
    clientUsers: result.data.clientUsers.map((client) => ({
      ...client,
      password: "",
    })),
  }, {
    headers: {
      "x-inmo-state-source": result.source,
    },
  });
}

export async function PUT(request: Request) {
  const writeSecret = process.env.INMO_STATE_WRITE_SECRET;
  const requestSecret = request.headers.get("x-inmo-write-secret");
  if (!writeSecret || requestSecret !== writeSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const state = (await request.json()) as InmoState;
  const result = await writeInmoState(state);
  return NextResponse.json({ ok: true, source: result.source });
}
