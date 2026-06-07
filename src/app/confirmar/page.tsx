"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import FrontHeader from "@/components/inmo/FrontHeader";
import { useInmoStore } from "@/lib/inmoStore";
import { writeClientSession } from "@/lib/session";
import { buildThemeStyles } from "@/lib/theme";

export default function ConfirmarEmailPage() {
  const { state, updateState } = useInmoStore();
  const { clientUsers, theme } = state;
  const themeStyles = buildThemeStyles(theme);
  const [status, setStatus] = useState<"pending" | "ok" | "error">("pending");

  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("token") ?? "";
  }, []);

  useEffect(() => {
    const defer = (fn: () => void) => {
      if (typeof queueMicrotask === "function") {
        queueMicrotask(fn);
      } else {
        window.setTimeout(fn, 0);
      }
    };

    if (!token) {
      defer(() => setStatus("error"));
      return;
    }

    const target = clientUsers.find((client) => client.verificationToken === token);
    if (!target) {
      defer(() => setStatus("error"));
      return;
    }

    updateState((prev) => ({
      ...prev,
      clientUsers: prev.clientUsers.map((client) =>
        client.id === target.id
          ? { ...client, emailVerified: true, verificationToken: undefined }
          : client
      ),
    }));

    writeClientSession({
      clientId: target.id,
      email: target.email,
      issuedAt: new Date().toISOString(),
    });

    defer(() => setStatus("ok"));
  }, [clientUsers, token, updateState]);

  return (
    <div style={themeStyles} className="min-h-screen bg-background text-on-background">
      <FrontHeader active="detail" />
      <main className="mx-auto flex min-h-screen max-w-screen-md items-center px-6 pt-24">
        <div className="w-full rounded-3xl bg-surface-container-lowest p-10 text-center shadow-[0_40px_60px_-15px_rgba(27,27,28,0.08)]">
          {status === "pending" ? (
            <>
              <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">
                Confirmando
              </p>
              <h1 className="mt-4 text-3xl font-headline font-extrabold text-primary">
                Validando email
              </h1>
              <p className="mt-2 text-sm text-on-surface-variant">
                Un momento, estamos confirmando tu cuenta.
              </p>
            </>
          ) : null}
          {status === "ok" ? (
            <>
              <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">
                Email confirmado
              </p>
              <h1 className="mt-4 text-3xl font-headline font-extrabold text-primary">
                Tu cuenta está activa
              </h1>
              <p className="mt-2 text-sm text-on-surface-variant">
                Ya podés acceder a tu panel privado.
              </p>
              <Link
                href="/mi-cuenta"
                className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-widest text-on-primary"
                style={{ color: "var(--color-on-primary)" }}
              >
                Ir a mi cuenta
              </Link>
            </>
          ) : null}
          {status === "error" ? (
            <>
              <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">
                Token inválido
              </p>
              <h1 className="mt-4 text-3xl font-headline font-extrabold text-primary">
                No pudimos confirmar tu email
              </h1>
              <p className="mt-2 text-sm text-on-surface-variant">
                El link es inválido o ya fue utilizado.
              </p>
              <Link
                href="/registro"
                className="mt-6 inline-flex rounded-full border border-outline-variant/40 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-primary"
              >
                Crear cuenta nuevamente
              </Link>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
