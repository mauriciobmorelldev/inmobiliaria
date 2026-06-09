import { NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/clientValidation";
import { readInmoState } from "@/lib/server/inmoRepository";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;
  const email = normalizeEmail(body?.email ?? "");
  const password = body?.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "Missing credentials" }, { status: 400 });
  }

  const { data } = await readInmoState();
  const client = data.clientUsers.find(
    (item) => item.active && item.email.trim().toLowerCase() === email
  );

  if (!client || client.password !== password) {
    return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
  }

  if (!client.emailVerified) {
    return NextResponse.json({ ok: false, error: "Email not verified" }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    client: {
      id: client.id,
      email: client.email,
      name: client.name,
    },
  });
}
