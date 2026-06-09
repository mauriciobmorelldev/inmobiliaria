import { NextResponse } from "next/server";
import { readInmoState } from "@/lib/server/inmoRepository";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "Missing credentials" }, { status: 400 });
  }

  const { data } = await readInmoState();
  const admin = data.adminUsers.find(
    (item) => item.active && item.email.trim().toLowerCase() === email
  );

  if (!admin || admin.password !== password) {
    return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
  });
}
