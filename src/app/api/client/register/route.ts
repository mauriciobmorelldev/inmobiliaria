import { NextResponse } from "next/server";
import {
  hasClientRegistrationErrors,
  normalizeEmail,
  normalizeIdNumber,
  normalizePhone,
  validateClientRegistration,
  type ClientRegistrationInput,
} from "@/lib/clientValidation";
import { readInmoState } from "@/lib/server/inmoRepository";
import { sendEmail } from "@/lib/server/email";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | (ClientRegistrationInput & { verificationToken?: string })
    | null;

  if (!body) {
    return NextResponse.json(
      { ok: false, errors: { form: "No pudimos leer los datos enviados." } },
      { status: 400 }
    );
  }

  const errors = validateClientRegistration(body);
  const email = normalizeEmail(body.email);
  const { data } = await readInmoState();
  const duplicate = data.clientUsers.some(
    (client) => client.email.trim().toLowerCase() === email
  );

  if (duplicate) {
    errors.email = "Ya existe una cuenta con ese email.";
  }

  if (hasClientRegistrationErrors(errors)) {
    return NextResponse.json({ ok: false, errors }, { status: 422 });
  }

  const url = new URL(request.url);
  const origin = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const token = body.verificationToken || crypto.randomUUID();
  const confirmUrl = `${origin}/confirmar?token=${encodeURIComponent(token)}`;
  const emailResult = await sendEmail({
    to: email,
    subject: "Confirmá tu cuenta de Connexa",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1b365d">
        <h1>Confirmá tu cuenta</h1>
        <p>Hola ${body.name.trim()}, recibimos tu solicitud de registro en Connexa.</p>
        <p>Para activar tu cuenta y acceder a favoritos y consultas, confirmá tu email:</p>
        <p><a href="${confirmUrl}" style="display:inline-block;background:#1b365d;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none">Confirmar cuenta</a></p>
        <p>Si no solicitaste esta cuenta, podés ignorar este mensaje.</p>
      </div>
    `,
  });

  return NextResponse.json({
    ok: true,
    emailSent: emailResult.sent,
    emailProvider: emailResult.provider,
    emailMessage: emailResult.sent
      ? "Te enviamos un email de confirmación."
      : "El email no fue enviado porque falta configurar el proveedor.",
    verificationToken: token,
    normalized: {
      email,
      phone: normalizePhone(body.phone),
      idNumber: normalizeIdNumber(body.idNumber),
    },
  });
}
