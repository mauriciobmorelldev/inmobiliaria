"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import FrontHeader from "@/components/inmo/FrontHeader";
import { isValidEmail } from "@/lib/adminForms";
import { useInmoStore } from "@/lib/inmoStore";
import { writeClientSession } from "@/lib/session";
import { buildThemeStyles } from "@/lib/theme";

export default function AccesoClientesPage() {
  const { state } = useInmoStore();
  const { clientUsers, theme } = state;
  const themeStyles = buildThemeStyles(theme);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!isValidEmail(email)) {
      setError("Ingresá un email válido.");
      setIsSubmitting(false);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const response = await fetch("/api/client/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });
    const result = (await response.json().catch(() => null)) as
      | { ok?: boolean; client?: { id: string; email: string }; error?: string }
      | null;

    const localClient = clientUsers.find(
      (item) =>
        item.active &&
        item.email.trim().toLowerCase() === normalizedEmail &&
        item.password === password
    );

    if (response.status === 403 || (localClient && !localClient.emailVerified)) {
      setError("Necesitás confirmar tu email antes de ingresar.");
      setIsSubmitting(false);
      return;
    }

    const loggedClient =
      response.ok && result?.ok && result.client
        ? result.client
        : localClient?.emailVerified
          ? { id: localClient.id, email: localClient.email }
          : null;

    if (!loggedClient) {
      setError("Email o contraseña incorrectos.");
      setIsSubmitting(false);
      return;
    }

    writeClientSession({
      clientId: loggedClient.id,
      email: loggedClient.email,
      issuedAt: new Date().toISOString(),
    });

    window.location.href = "/mi-cuenta";
  };

  return (
    <div style={themeStyles} className="min-h-screen bg-background text-on-background">
      <FrontHeader active="detail" />
      <main className="mx-auto flex min-h-screen max-w-screen-xl items-center px-6 pt-24 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl bg-surface-container-lowest p-10 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.08)]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">
              Portal Cliente
            </p>
            <h1 className="mt-4 text-3xl font-headline font-extrabold text-primary">
              Acceso privado
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Consultá tu alquiler o plan en pozo, cuotas y documentación.
            </p>

            <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Email
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                />
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Contraseña
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                />
              </label>
              {error ? <p className="text-sm text-error">{error}</p> : null}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary disabled:opacity-60"
                style={{ color: "var(--color-on-primary)" }}
              >
                {isSubmitting ? "Ingresando..." : "Ingresar"}
              </button>
            </form>

            <div className="mt-6 text-xs text-on-surface-variant">
              ¿No tenés acceso aún?{" "}
              <Link href="/registro" className="text-primary font-semibold">
                Crear cuenta
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-10">
            <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">
              Beneficios
            </p>
            <h2 className="mt-4 text-2xl font-headline font-bold text-primary">
              Seguimiento en tiempo real
            </h2>
            <div className="mt-6 grid gap-4 text-sm text-on-surface-variant">
              <div className="rounded-2xl bg-surface-container-low p-4">
                Consulta cuotas, vencimientos y monto mensual.
              </div>
              <div className="rounded-2xl bg-surface-container-low p-4">
                Accedé a tus favoritos, consultas y seguimiento desde un solo lugar.
              </div>
              <div className="rounded-2xl bg-surface-container-low p-4">
                Estado del inmueble: disponible, en obra o finalizado.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
