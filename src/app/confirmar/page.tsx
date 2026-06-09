"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import FrontHeader from "@/components/inmo/FrontHeader";
import type { ClientUser } from "@/lib/inmoData";
import { loadState, useInmoStore } from "@/lib/inmoStore";
import { writeClientSession } from "@/lib/session";
import { buildThemeStyles } from "@/lib/theme";

function ConfirmarEmailContent() {
  const { state, updateState } = useInmoStore();
  const searchParams = useSearchParams();
  const { clientUsers, theme } = state;
  const themeStyles = buildThemeStyles(theme);
  const [status, setStatus] = useState<"pending" | "ok" | "error">("pending");

  const token = searchParams.get("token") ?? "";

  useEffect(() => {
    if (status !== "pending") return;

    let retry: number | undefined;

    const initial = window.setTimeout(() => {
      if (!token) {
        setStatus("error");
        return;
      }

      const findTarget = (): ClientUser | undefined => {
        const fromStore = clientUsers.find(
          (client) => client.verificationToken === token
        );
        if (fromStore) return fromStore;
        return loadState().clientUsers.find(
          (client) => client.verificationToken === token
        );
      };

      const confirmToken = () => {
        const target = findTarget();
        if (!target) return false;

        updateState((prev) => ({
          ...prev,
          clientUsers: prev.clientUsers.map((client) =>
            client.id === target.id || client.verificationToken === token
              ? {
                  ...client,
                  emailVerified: true,
                  verificationToken: undefined,
                }
              : client
          ),
        }));

        writeClientSession({
          clientId: target.id,
          email: target.email,
          issuedAt: new Date().toISOString(),
        });
        setStatus("ok");
        return true;
      };

      if (confirmToken()) return;

      retry = window.setTimeout(() => {
        if (!confirmToken()) setStatus("error");
      }, 500);
    }, 0);

    return () => {
      window.clearTimeout(initial);
      if (retry) window.clearTimeout(retry);
    };
  }, [clientUsers, status, token, updateState]);

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
                No encontramos una cuenta pendiente para este link. Si abriste
                el email en otro navegador, volvé al navegador donde creaste la
                cuenta o solicitá un nuevo link.
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

function ConfirmarEmailFallback() {
  return (
    <div className="min-h-screen bg-background text-on-background">
      <FrontHeader active="detail" />
      <main className="mx-auto flex min-h-screen max-w-screen-md items-center px-6 pt-24">
        <div className="w-full rounded-3xl bg-surface-container-lowest p-10 text-center shadow-[0_40px_60px_-15px_rgba(27,27,28,0.08)]">
          <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">
            Confirmando
          </p>
          <h1 className="mt-4 text-3xl font-headline font-extrabold text-primary">
            Validando email
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Un momento, estamos confirmando tu cuenta.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function ConfirmarEmailPage() {
  return (
    <Suspense fallback={<ConfirmarEmailFallback />}>
      <ConfirmarEmailContent />
    </Suspense>
  );
}
