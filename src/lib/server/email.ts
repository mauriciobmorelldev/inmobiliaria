type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export const sendEmail = async ({ to, subject, html }: SendEmailInput) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Connexa <no-reply@connexa.com>";

  if (!apiKey) {
    console.info("[email:preview]", { to, subject, html });
    return {
      sent: false,
      provider: "preview",
      reason: "RESEND_API_KEY no configurada.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return {
      sent: false,
      provider: "resend",
      reason: detail || "No se pudo enviar el email.",
    };
  }

  return { sent: true, provider: "resend" };
};
