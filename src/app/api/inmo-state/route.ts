import { NextResponse } from "next/server";
import type { InmoState } from "@/lib/inmoData";
import { readInmoState, writeInmoState } from "@/lib/server/inmoRepository";

export async function GET() {
  try {
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
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo leer Supabase.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const writeSecret = process.env.INMO_STATE_WRITE_SECRET;
    const requestSecret = request.headers.get("x-inmo-write-secret");
    const adminId = request.headers.get("x-admin-id");
    const currentState = await readInmoState();
    const owner = adminId
      ? currentState.data.adminUsers.find(
          (admin) => admin.id === adminId && admin.active && admin.role === "owner"
        )
      : null;

    if ((!writeSecret || requestSecret !== writeSecret) && !owner) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const state = (await request.json()) as InmoState;
    const result = await writeInmoState(state);
    return NextResponse.json({ ok: true, source: result.source });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo escribir en Supabase.",
      },
      { status: 500 }
    );
  }
}
