import { NextResponse } from "next/server";
import { buildOperationalMetrics } from "@/lib/server/analytics";
import { readInmoState } from "@/lib/server/inmoRepository";

export async function GET() {
  const { data } = await readInmoState();
  return NextResponse.json(buildOperationalMetrics(data));
}
