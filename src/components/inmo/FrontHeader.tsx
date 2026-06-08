"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useInmoStore } from "@/lib/inmoStore";
import { clearClientSession, readClientSession } from "@/lib/session";
import { buildThemeStyles } from "@/lib/theme";

type FrontHeaderProps = {
  active?: "home" | "catalog" | "detail";
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
};

const ConnexaWordmark = ({ compact = false }: { compact?: boolean }) => (
  <span
    className={`font-headline font-extrabold uppercase tracking-normal text-primary ${
      compact ? "text-lg" : "text-2xl sm:text-3xl"
    }`}
  >
    Conne
    <span className="text-primary-fixed drop-shadow-[0_1px_0_rgba(27,54,93,0.28)]">
      x
    </span>
    a
  </span>
);

export default function FrontHeader({
  active = "home",
  showSearch = false,
  searchValue,
  onSearchChange,
}: FrontHeaderProps) {
  const { state } = useInmoStore();
  const { theme } = state;
  const themeStyles = useMemo(() => buildThemeStyles(theme), [theme]);
  const [mounted, setMounted] = useState(false);
  const [clientEmail, setClientEmail] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const hydrate = () => {
      const session = readClientSession();
      setClientEmail(session?.email ?? null);
      if (session?.email) {
        const match = state.clientUsers.find(
          (user) => user.email.toLowerCase() === session.email.toLowerCase()
        );
        setClientName(match?.name ?? "Cliente");
      } else {
        setClientName(null);
      }
      setMounted(true);
    };
    if (typeof queueMicrotask === "function") {
      queueMicrotask(hydrate);
    } else {
      window.setTimeout(hydrate, 0);
    }
  }, [state.clientUsers]);

  const handleLogout = () => {
    clearClientSession();
    window.location.href = "/acceso";
  };

  return (
    <nav
      style={themeStyles}
      className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-xl shadow-[0_40px_60px_-15px_rgba(27,27,28,0.06)]"
    >
      <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center justify-between gap-3 px-4 sm:h-20 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setShowMobileMenu(true)}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface-container-low text-primary shadow-[0_16px_35px_-25px_rgba(27,54,93,0.55)] md:hidden"
            aria-label="Abrir menú"
          >
            <span className="material-symbols-outlined" data-icon="menu">
              menu
            </span>
          </button>
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3"
          >
            {theme.logo ? (
              <img
                src={theme.logo}
                alt={theme.name || "Logo"}
                className="h-9 w-auto object-contain"
              />
            ) : (
              <ConnexaWordmark />
            )}
          </Link>
        </div>

        <div className="hidden items-center rounded-full border border-outline-variant/25 bg-surface-container-lowest/90 px-6 py-2 shadow-[0_25px_50px_-35px_rgba(27,27,28,0.35)] backdrop-blur md:flex">
          <Link
            className={`${
              active === "home"
                ? "text-primary"
                : "text-primary/60 hover:text-primary"
            } rounded-full px-3 py-1 transition-all hover:-translate-y-0.5`}
            href="/"
          >
            Inicio
          </Link>
          <Link
            className={`${
              active === "catalog"
                ? "text-primary"
                : "text-primary/60 hover:text-primary"
            } rounded-full px-3 py-1 transition-all hover:-translate-y-0.5`}
            href="/propiedades?operacion=venta"
          >
            Comprar
          </Link>
          <Link
            className="rounded-full px-3 py-1 text-primary/60 transition-all hover:-translate-y-0.5 hover:text-primary"
            href="/propiedades?operacion=alquiler"
          >
            Alquilar
          </Link>
          <Link
            className="rounded-full px-3 py-1 text-primary/60 transition-all hover:-translate-y-0.5 hover:text-primary"
            href="/propiedades"
          >
            Propiedades
          </Link>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
          {showSearch ? (
            <div className="hidden items-center rounded-full bg-surface-container px-4 py-2 ghost-border lg:flex">
              <span className="material-symbols-outlined mr-2 text-on-surface-variant">
                search
              </span>
              <input
                className="w-48 border-none bg-transparent text-sm font-label focus:ring-0"
                placeholder="Buscar propiedades..."
                value={searchValue}
                onChange={(event) => onSearchChange?.(event.target.value)}
              />
            </div>
          ) : null}
          {mounted && clientEmail ? (
            <>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAccountMenu((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full border border-outline-variant/30 px-3 py-2 text-[10px] uppercase tracking-widest text-on-surface-variant"
                >
                  <span className="h-6 w-6 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-semibold">
                    {clientName?.charAt(0).toUpperCase()}
                  </span>
                  {clientName}
                </button>
                {showAccountMenu ? (
                  <div className="absolute right-0 top-12 z-50 w-44 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-2 shadow-[0_30px_50px_-30px_rgba(27,27,28,0.4)]">
                    <Link
                      href="/mi-cuenta"
                      className="block rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-widest text-primary"
                      onClick={() => setShowAccountMenu(false)}
                    >
                      Mi cuenta
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-1 w-full rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-widest text-primary"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/registro"
                className="hidden sm:flex items-center rounded-full border border-outline-variant/30 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-primary"
              >
                Crear cuenta
              </Link>
              <Link
                href="/acceso"
                className="hidden rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-on-primary sm:inline-flex"
                style={{ color: "var(--color-on-primary)" }}
                suppressHydrationWarning
              >
                Acceso clientes
              </Link>
            </>
          )}
        </div>
      </div>

      <div
        className={`fixed inset-0 z-50 bg-primary/45 backdrop-blur-md transition-opacity duration-300 md:hidden ${
          showMobileMenu ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0" onClick={() => setShowMobileMenu(false)} />
        <div
          className={`absolute left-3 right-3 top-3 max-h-[calc(100dvh-24px)] overflow-y-auto rounded-[2rem] bg-surface-container-lowest p-5 shadow-[0_40px_80px_-28px_rgba(27,54,93,0.55)] transition-all duration-300 ${
            showMobileMenu
              ? "translate-y-0 opacity-100"
              : "-translate-y-5 opacity-0"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme.logo ? (
                <img
                  src={theme.logo}
                  alt={theme.name || "Logo"}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <ConnexaWordmark compact />
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowMobileMenu(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low text-primary"
              aria-label="Cerrar menú"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <div className="mt-5 grid gap-2 rounded-3xl bg-surface-container-low p-3 text-sm font-semibold text-primary">
            <Link
              href="/"
              onClick={() => setShowMobileMenu(false)}
              className="rounded-2xl px-4 py-3 transition-all hover:-translate-y-0.5 hover:bg-surface-container-high"
            >
              Inicio
            </Link>
            <Link
              href="/propiedades?operacion=venta"
              onClick={() => setShowMobileMenu(false)}
              className="rounded-2xl px-4 py-3 transition-all hover:-translate-y-0.5 hover:bg-surface-container-high"
            >
              Comprar
            </Link>
            <Link
              href="/propiedades?operacion=alquiler"
              onClick={() => setShowMobileMenu(false)}
              className="rounded-2xl px-4 py-3 transition-all hover:-translate-y-0.5 hover:bg-surface-container-high"
            >
              Alquilar
            </Link>
            <Link
              href="/propiedades"
              onClick={() => setShowMobileMenu(false)}
              className="rounded-2xl px-4 py-3 transition-all hover:-translate-y-0.5 hover:bg-surface-container-high"
            >
              Propiedades
            </Link>
            {mounted && clientEmail ? (
              <>
                <Link
                  href="/mi-cuenta"
                  onClick={() => setShowMobileMenu(false)}
                  className="rounded-2xl px-4 py-3 transition-all hover:-translate-y-0.5 hover:bg-surface-container-high"
                >
                  Mi cuenta
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-2xl px-4 py-3 text-left text-sm font-semibold text-primary transition-all hover:-translate-y-0.5 hover:bg-surface-container-high"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/registro"
                  onClick={() => setShowMobileMenu(false)}
                  className="rounded-2xl px-4 py-3 transition-all hover:-translate-y-0.5 hover:bg-surface-container-high"
                >
                  Crear cuenta
                </Link>
                <Link
                  href="/acceso"
                  onClick={() => setShowMobileMenu(false)}
                  className="rounded-2xl bg-primary px-4 py-3 text-on-primary transition-all hover:-translate-y-0.5"
                >
                  Acceso clientes
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
