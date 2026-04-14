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
      <div className="mx-auto flex h-16 sm:h-20 w-full max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowMobileMenu(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/30 text-primary md:hidden"
            aria-label="Abrir menú"
          >
            <span className="material-symbols-outlined" data-icon="menu">
              menu
            </span>
          </button>
          <Link
            href="/"
            className="flex items-center gap-3 text-xl sm:text-2xl font-bold tracking-tighter text-primary font-headline"
          >
            {theme.logo ? (
              <img
                src={theme.logo}
                alt={theme.name || "Logo"}
                className="h-9 w-auto object-contain"
              />
            ) : (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-on-primary">
                {theme.name ? theme.name.charAt(0) : "L"}
              </span>
            )}
            <span>{theme.name || "Luxe Curator"}</span>
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
            href="/propiedades"
          >
            Propiedades
          </Link>
          <Link
            className="rounded-full px-3 py-1 text-primary/60 transition-all hover:-translate-y-0.5 hover:text-primary"
            href="/#equipo"
          >
            Equipo
          </Link>
          <Link
            className="rounded-full px-3 py-1 text-primary/60 transition-all hover:-translate-y-0.5 hover:text-primary"
            href="/barrios"
          >
            Barrios
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-end">
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
                className="rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-on-primary"
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
        className={`fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          showMobileMenu ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0" onClick={() => setShowMobileMenu(false)} />
        <div
          className={`absolute left-0 top-0 h-full w-72 bg-surface-container-lowest p-6 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.3)] transition-all duration-300 ${
            showMobileMenu
              ? "translate-x-0 opacity-100"
              : "-translate-x-full opacity-0"
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
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-on-primary">
                  {theme.name ? theme.name.charAt(0) : "L"}
                </span>
              )}
              <span className="text-sm font-semibold text-primary">{theme.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowMobileMenu(false)}
              className="rounded-full border border-outline-variant/30 px-2 py-1 text-xs font-semibold text-primary"
            >
              Cerrar
            </button>
          </div>
          <div className="mt-6 grid gap-2 rounded-2xl bg-surface-container-low p-4 text-sm font-semibold text-primary">
            <Link
              href="/"
              onClick={() => setShowMobileMenu(false)}
              className="rounded-xl px-3 py-2 transition-all hover:-translate-y-0.5 hover:bg-surface-container-high"
            >
              Inicio
            </Link>
            <Link
              href="/propiedades"
              onClick={() => setShowMobileMenu(false)}
              className="rounded-xl px-3 py-2 transition-all hover:-translate-y-0.5 hover:bg-surface-container-high"
            >
              Propiedades
            </Link>
            <Link
              href="/equipo"
              onClick={() => setShowMobileMenu(false)}
              className="rounded-xl px-3 py-2 transition-all hover:-translate-y-0.5 hover:bg-surface-container-high"
            >
              Equipo
            </Link>
            <Link
              href="/barrios"
              onClick={() => setShowMobileMenu(false)}
              className="rounded-xl px-3 py-2 transition-all hover:-translate-y-0.5 hover:bg-surface-container-high"
            >
              Barrios
            </Link>
            {mounted && clientEmail ? (
              <>
                <Link
                  href="/mi-cuenta"
                  onClick={() => setShowMobileMenu(false)}
                  className="rounded-xl px-3 py-2 transition-all hover:-translate-y-0.5 hover:bg-surface-container-high"
                >
                  Mi cuenta
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-left rounded-xl px-3 py-2 text-sm font-semibold text-primary transition-all hover:-translate-y-0.5 hover:bg-surface-container-high"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/registro"
                  onClick={() => setShowMobileMenu(false)}
                  className="rounded-xl px-3 py-2 transition-all hover:-translate-y-0.5 hover:bg-surface-container-high"
                >
                  Crear cuenta
                </Link>
                <Link
                  href="/acceso"
                  onClick={() => setShowMobileMenu(false)}
                  className="rounded-xl px-3 py-2 transition-all hover:-translate-y-0.5 hover:bg-surface-container-high"
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
