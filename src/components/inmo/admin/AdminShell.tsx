"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useInmoStore } from "@/lib/inmoStore";
import {
  clearAdminSession,
  readAdminSession,
  writeAdminSession,
  type AdminSession,
} from "@/lib/session";
import { buildThemeStyles } from "@/lib/theme";

export type AdminSection =
  | "dashboard"
  | "propiedades"
  | "agentes"
  | "clientes"
  | "leads"
  | "administradores"
  | "branding"
  | "filtros";

type AdminShellProps = {
  activeSection: AdminSection;
  title: string;
  subtitle?: string;
  primaryAction?: {
    href: string;
    label: string;
  };
  children: ReactNode;
};

const navItems: Array<{
  id: AdminSection;
  label: string;
  href: string;
  icon: string;
}> = [
  { id: "dashboard", label: "Panel", href: "/admin", icon: "dashboard" },
  {
    id: "propiedades",
    label: "Propiedades",
    href: "/admin/propiedades",
    icon: "domain",
  },
  { id: "agentes", label: "Corredores", href: "/admin/agentes", icon: "group" },
  { id: "clientes", label: "Clientes", href: "/admin/clientes", icon: "person_search" },
  { id: "leads", label: "Leads", href: "/admin/leads", icon: "insights" },
  {
    id: "administradores",
    label: "Administradores",
    href: "/admin/administradores",
    icon: "admin_panel_settings",
  },
  { id: "branding", label: "Branding y Home", href: "/admin/branding", icon: "palette" },
  { id: "filtros", label: "Filtros", href: "/admin/filtros", icon: "tune" },
];

const ADMIN_IDLE_TIMEOUT_MS = 10 * 60 * 1000;

export default function AdminShell({
  activeSection,
  title,
  subtitle,
  primaryAction,
  children,
}: AdminShellProps) {
  const { state } = useInmoStore();
  const { theme, adminUsers } = state;
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const mobileBellRef = useRef<HTMLButtonElement | null>(null);
  const [mobileNotifPos, setMobileNotifPos] = useState<{ top: number; left: number } | null>(
    null
  );
  const [notifications, setNotifications] = useState([
    {
      id: "n1",
      title: "Nueva consulta",
      subtitle: "Lote 32 · Recoleta",
      unread: true,
    },
    {
      id: "n2",
      title: "Favorito agregado",
      subtitle: "Cliente final",
      unread: true,
    },
    {
      id: "n3",
      title: "Lead asignado",
      subtitle: "Sofía Girard",
      unread: false,
    },
  ]);
  const themeStyles = buildThemeStyles(theme);

  useEffect(() => {
    const hydrate = () => {
      setSession(readAdminSession());
      setMounted(true);
    };
    if (typeof queueMicrotask === "function") {
      queueMicrotask(hydrate);
    } else {
      window.setTimeout(hydrate, 0);
    }
  }, []);

  useEffect(() => {
    if (!showMobileNav) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMobileNav]);

  useEffect(() => {
    if (!showNotifications) {
      const clearPosition = () => setMobileNotifPos(null);
      if (typeof queueMicrotask === "function") {
        queueMicrotask(clearPosition);
      } else {
        window.setTimeout(clearPosition, 0);
      }
      return;
    }
    if (typeof window === "undefined") return;
    const updatePosition = () => {
      const rect = mobileBellRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cardWidth = Math.min(288, window.innerWidth - 32);
      const preferredLeft = rect.right - cardWidth;
      const left = Math.min(
        Math.max(16, preferredLeft),
        window.innerWidth - cardWidth - 16
      );
      const top = rect.bottom + 10;
      setMobileNotifPos({ top, left });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [showNotifications]);

  const authedAdmin = useMemo(() => {
    if (!session) return null;
    return adminUsers.find(
      (admin) => admin.id === session.adminId && admin.active
    );
  }, [adminUsers, session]);
  const visibleNavItems = useMemo(() => {
    if (authedAdmin?.role === "owner") return navItems;
    return navItems.filter((item) => item.id === "propiedades");
  }, [authedAdmin?.role]);

  const subtitleText = useMemo(() => {
    if (subtitle) return subtitle;
    return new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }, [subtitle]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });
    const result = (await response.json().catch(() => null)) as {
      ok?: boolean;
      admin?: { id: string; email: string; role?: string };
    } | null;
    const localAdmin = adminUsers.find(
      (item) =>
        item.active &&
        item.email.trim().toLowerCase() === normalizedEmail &&
        item.password === password
    );

    const loggedAdmin = response.ok && result?.ok && result.admin
      ? result.admin
      : localAdmin
        ? { id: localAdmin.id, email: localAdmin.email, role: localAdmin.role }
        : null;

    if (!loggedAdmin) {
      setLoginError("Email o contraseña incorrectos.");
      return;
    }

    setLoginError("");
    const nextSession = {
      adminId: loggedAdmin.id,
      email: loggedAdmin.email,
      issuedAt: new Date().toISOString(),
    };
    writeAdminSession(nextSession);
    setSession(nextSession);
    window.location.href = loggedAdmin.role === "colaborador" ? "/admin/propiedades" : "/admin";
  };

  const handleLogout = () => {
    clearAdminSession();
    setSession(null);
    setPassword("");
    window.location.href = "/admin";
  };

  useEffect(() => {
    if (!session) return;
    let timeout: number | undefined;
    const logoutForInactivity = () => {
      clearAdminSession();
      setSession(null);
      setPassword("");
      window.location.href = "/admin";
    };
    const resetTimer = () => {
      if (timeout) window.clearTimeout(timeout);
      timeout = window.setTimeout(logoutForInactivity, ADMIN_IDLE_TIMEOUT_MS);
    };
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    resetTimer();
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    return () => {
      if (timeout) window.clearTimeout(timeout);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [session]);

  if (!authedAdmin) {
    if (!mounted) {
      return (
        <div
          style={themeStyles}
          className="inmo-admin min-h-screen bg-background text-on-surface"
        />
      );
    }
    return (
      <div
        style={themeStyles}
        className="inmo-admin min-h-screen bg-background text-on-surface"
      >
        <div className="mx-auto flex min-h-screen max-w-screen-lg items-center justify-center px-6 py-12">
          <div className="w-full max-w-3xl rounded-3xl bg-surface-container-lowest p-10 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.08)]">
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                  Suite de Gestión
                </p>
                <h1 className="mt-3 text-4xl font-headline font-extrabold text-primary">
                  Acceso administrador
                </h1>
                <p className="mt-3 text-sm text-on-surface-variant">
                  Ingresá con un usuario autorizado para gestionar la operación inmobiliaria.
                </p>
              </div>

              <form className="grid gap-4" onSubmit={handleLogin}>
                <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                  Email
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                    placeholder="usuario@connexa.com"
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
                    placeholder="••••••••"
                  />
                </label>
                {loginError ? <p className="text-sm text-error">{loginError}</p> : null}
                <button
                  type="submit"
                  className="mt-2 w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-[0_20px_40px_-25px_rgba(7,22,13,0.6)]"
                  style={{ color: "var(--color-on-primary)" }}
                >
                  Ingresar al panel
                </button>
                <Link
                  href="/"
                  className="text-center text-xs font-semibold uppercase tracking-widest text-on-surface-variant"
                >
                  Volver al front
                </Link>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (authedAdmin.role !== "owner" && activeSection !== "propiedades") {
    return (
      <div
        style={themeStyles}
        className="inmo-admin min-h-screen bg-background text-on-surface"
      >
        <div className="mx-auto flex min-h-screen max-w-screen-md items-center justify-center px-6">
          <div className="rounded-3xl bg-surface-container-lowest p-10 text-center shadow-[0_40px_60px_-15px_rgba(27,27,28,0.08)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Acceso limitado
            </p>
            <h1 className="mt-3 text-3xl font-headline font-extrabold text-primary">
              Tu rol colaborador solo puede gestionar propiedades propias.
            </h1>
            <Link
              href="/admin/propiedades"
              className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-xs font-bold uppercase tracking-widest text-on-primary"
            >
              Ir a propiedades
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwnerAdmin = authedAdmin.role === "owner";

  return (
    <div
      style={themeStyles}
      className="inmo-admin min-h-screen bg-background text-on-surface"
    >
      <aside className="hidden h-screen w-72 fixed left-0 top-0 bg-surface-container-high flex-col py-6 space-y-2 z-50 lg:flex">
        <div className="px-6 mb-7">
          {theme.logo ? (
            <img src={theme.logo} alt={theme.name} className="h-9 w-auto object-contain" />
          ) : (
            <h1 className="text-xl font-headline font-black text-primary">{theme.name}</h1>
          )}
          <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold mt-1 text-on-surface">
            Suite de Gestión
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2">
              {visibleNavItems.map((item) => {
            const active = item.id === activeSection;
            return (
              <Link
                key={item.id}
                className={
                  active
                    ? "bg-surface-container-lowest text-primary rounded-lg shadow-sm px-4 py-3 ml-2 mr-2 flex items-center gap-3 text-sm font-semibold transition-all translate-x-1"
                    : "text-on-surface/70 px-4 py-3 ml-2 mr-2 flex items-center gap-3 text-sm font-semibold hover:bg-surface-container-lowest/60 transition-all"
                }
                href={item.href}
              >
                <span className="material-symbols-outlined" data-icon={item.icon}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 mb-4">
          <Link
            href="/admin/propiedades#form-propiedad"
            className="w-full bg-primary text-on-primary py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            style={{ color: "var(--color-on-primary)" }}
          >
            <span className="material-symbols-outlined text-sm" data-icon="add">
              add
            </span>
            {isOwnerAdmin ? "Nueva Propiedad" : "Nuevo inmueble"}
          </Link>
        </div>

        <div className="pt-4 border-t border-outline-variant/20 space-y-1">
          <div className="px-6 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary font-semibold">
              {authedAdmin.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">{authedAdmin.name}</p>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                {authedAdmin.role}
              </p>
            </div>
          </div>

          <Link
            className="text-on-surface/70 px-4 py-2 ml-2 mr-2 flex items-center gap-3 text-xs font-semibold hover:bg-surface-container-lowest/60 transition-all"
            href="/"
          >
            <span className="material-symbols-outlined text-lg" data-icon="open_in_new">
              open_in_new
            </span>
            Ver front
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-on-surface/70 px-4 py-2 ml-2 mr-2 mb-2 flex items-center gap-3 text-xs font-semibold hover:bg-surface-container-lowest/60 transition-all"
          >
            <span className="material-symbols-outlined text-lg" data-icon="logout">
              logout
            </span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-72">
        <header className="px-6 lg:px-10 py-4 sticky top-0 bg-background/90 backdrop-blur-md z-40 border-b border-outline-variant/10">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setShowMobileNav(true)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant/30 text-primary lg:hidden"
                  aria-label="Abrir menú"
                >
                  <span className="material-symbols-outlined" data-icon="menu">
                    menu
                  </span>
                </button>
                <div className="flex items-center lg:hidden rounded-full bg-surface-container-low px-2 py-1">
                  {theme.logo ? (
                    <img
                      src={theme.logo}
                      alt={theme.name}
                      className="h-9 w-auto object-contain"
                    />
                  ) : (
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-on-primary">
                      {(theme.name || "I").charAt(0)}
                    </span>
                  )}
                  <span className="ml-2 hidden text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant sm:inline">
                    {theme.name || "Inmobiliaria"}
                  </span>
                </div>
                <div>
                  <h2 className="text-3xl font-headline font-bold tracking-tight text-primary">
                    {title}
                  </h2>
                  <p className="text-sm text-on-surface-variant font-medium">
                    {subtitleText}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-3">
            {isOwnerAdmin ? (
              <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setShowNotifications((prev) => !prev)}
                className="relative flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-high text-primary"
                aria-label="Notificaciones"
              >
                <span className="material-symbols-outlined" data-icon="notifications">
                  notifications
                </span>
                {notifications.some((item) => item.unread) ? (
                  <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-error" />
                ) : null}
              </button>

              {showNotifications ? (
                <div className="absolute right-0 top-14 z-50 w-72 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-[0_30px_50px_-30px_rgba(27,27,28,0.4)]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      Notificaciones
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setNotifications((prev) =>
                          prev.map((item) => ({ ...item, unread: false }))
                        )
                      }
                      className="text-[10px] font-bold uppercase tracking-widest text-primary"
                    >
                      Marcar todo
                    </button>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-xl border border-outline-variant/20 px-3 py-2 text-xs ${
                          item.unread ? "bg-surface-container-low" : "bg-transparent"
                        }`}
                      >
                        <p className="text-sm font-semibold text-primary">{item.title}</p>
                        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                          {item.subtitle}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            ) : null}

            {isOwnerAdmin ? (
              <div className="relative sm:hidden">
              <button
                type="button"
                onClick={() => setShowNotifications((prev) => !prev)}
                ref={mobileBellRef}
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant/40 text-primary"
                aria-label="Notificaciones"
              >
                <span className="material-symbols-outlined" data-icon="notifications">
                  notifications
                </span>
                {notifications.some((item) => item.unread) ? (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
                ) : null}
              </button>
            </div>
            ) : null}

            <div className="hidden sm:flex items-center gap-2 rounded-full border border-outline-variant/30 px-3 py-2">
              <div className="h-8 w-8 overflow-hidden rounded-full bg-surface-container-high flex items-center justify-center text-primary font-semibold">
                {authedAdmin.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-right text-[10px] uppercase tracking-widest text-on-surface-variant">
                {authedAdmin.name}
              </div>
            </div>
            <div className="flex sm:hidden items-center gap-2 rounded-full border border-outline-variant/30 px-3 py-2 text-[10px] uppercase tracking-widest text-on-surface-variant">
              <span className="h-6 w-6 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-semibold">
                {authedAdmin.name.charAt(0).toUpperCase()}
              </span>
              {authedAdmin.name}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="sm:hidden rounded-full border border-outline-variant/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-primary"
            >
              Salir
            </button>
            <Link
              className="hidden sm:flex items-center gap-2 rounded-full border border-outline-variant/30 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-primary"
              href="/"
            >
              Ver front
            </Link>
            {primaryAction ? (
              <Link
                href={primaryAction.href}
                className="hidden sm:flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-widest text-on-primary"
                style={{ color: "var(--color-on-primary)" }}
              >
                {primaryAction.label}
              </Link>
            ) : null}
            </div>
          </div>
        </header>

        <div
          className={`fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
            showMobileNav ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="absolute inset-0" onClick={() => setShowMobileNav(false)} />
          <div
            className={`absolute left-0 top-0 h-full w-72 bg-surface-container-lowest p-6 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.3)] transition-all duration-300 ${
              showMobileNav
                ? "translate-x-0 opacity-100"
                : "-translate-x-full opacity-0"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {theme.logo ? (
                  <img
                    src={theme.logo}
                    alt={theme.name}
                    className="h-8 w-auto object-contain"
                  />
                ) : (
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-on-primary">
                    {theme.name.charAt(0)}
                  </span>
                )}
                <span className="text-sm font-semibold text-primary">{theme.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileNav(false)}
                className="rounded-full border border-outline-variant/30 px-2 py-1 text-xs font-semibold text-primary"
              >
                Cerrar
              </button>
            </div>
            <div className="mt-6 grid gap-2 rounded-2xl bg-surface-container-low p-4">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setShowMobileNav(false)}
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-primary transition-all hover:-translate-y-0.5 hover:bg-surface-container-high"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-xl border border-outline-variant/40 px-4 py-3 text-sm font-semibold text-primary"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>

        {showNotifications && mobileNotifPos ? (
          <div className="fixed inset-0 z-50 sm:hidden">
            <button
              type="button"
              className="absolute inset-0 cursor-default"
              onClick={() => setShowNotifications(false)}
              aria-label="Cerrar notificaciones"
            />
            <div
              className="absolute w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-[0_30px_50px_-30px_rgba(27,27,28,0.4)]"
              style={{ top: mobileNotifPos.top, left: mobileNotifPos.left }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Notificaciones
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setNotifications((prev) =>
                      prev.map((item) => ({ ...item, unread: false }))
                    )
                  }
                  className="text-[10px] font-bold uppercase tracking-widest text-primary"
                >
                  Marcar todo
                </button>
              </div>
              <div className="mt-3 grid gap-2">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border border-outline-variant/20 px-3 py-2 text-xs ${
                      item.unread ? "bg-surface-container-low" : "bg-transparent"
                    }`}
                  >
                    <p className="text-sm font-semibold text-primary">{item.title}</p>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                      {item.subtitle}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="px-6 lg:px-10 pb-24">{children}</div>

        {primaryAction ? (
          <div className="fixed inset-x-0 bottom-0 z-40 bg-background/90 backdrop-blur-md border-t border-outline-variant/10 lg:hidden">
            <div className="px-6 py-4">
              <Link
                href={primaryAction.href}
                className="flex w-full items-center justify-center rounded-full bg-primary px-4 py-3 text-xs font-semibold uppercase tracking-widest text-on-primary"
                style={{ color: "var(--color-on-primary)" }}
              >
                {primaryAction.label}
              </Link>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
