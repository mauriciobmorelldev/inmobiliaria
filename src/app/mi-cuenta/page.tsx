"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import FrontHeader from "@/components/inmo/FrontHeader";
import { normalizeIdNumber, normalizePhone, validateClientUserForm } from "@/lib/adminForms";
import { useInmoStore } from "@/lib/inmoStore";
import { clearClientSession, readClientSession } from "@/lib/session";
import { buildThemeStyles } from "@/lib/theme";

export default function MiCuentaPage() {
  const { state, updateState } = useInmoStore();
  const { clientUsers, listings, leads, propertyFavorites, theme } = state;
  const [session] = useState(() => readClientSession());
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const themeStyles = buildThemeStyles(theme);

  const client = useMemo(() => {
    if (!session) return null;
    return clientUsers.find((item) => item.id === session.clientId && item.active);
  }, [clientUsers, session]);

  const [profileForm, setProfileForm] = useState(() => ({
    name: client?.name ?? "",
    email: client?.email ?? "",
    password: "",
    phone: client?.phone ?? "",
    idNumber: client?.idNumber ?? "",
    active: true,
  }));

  useEffect(() => {
    if (!client) return;
    const hydrate = () =>
      setProfileForm((prev) => ({
        ...prev,
        name: client.name,
        email: client.email,
        phone: client.phone,
        idNumber: client.idNumber,
        password: "",
      }));
    if (typeof queueMicrotask === "function") {
      queueMicrotask(hydrate);
    } else {
      window.setTimeout(hydrate, 0);
    }
  }, [client]);

  const favoriteListings = useMemo(() => {
    if (!client) return [];
    const ids = new Set(
      propertyFavorites
        .filter((favorite) => favorite.clientId === client.id)
        .map((favorite) => favorite.propertyId)
    );
    return listings.filter((listing) => ids.has(listing.id));
  }, [client, listings, propertyFavorites]);

  const clientLeads = useMemo(() => {
    if (!client) return [];
    return leads
      .filter(
        (lead) =>
          lead.clientId === client.id ||
          lead.email.trim().toLowerCase() === client.email.trim().toLowerCase()
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [client, leads]);

  const handleLogout = () => {
    clearClientSession();
    window.location.href = "/acceso";
  };

  const handleProfileSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!client) return;
    setError("");
    setNotice("");
    const errors = validateClientUserForm(profileForm, { passwordOptional: true });
    if (errors.length) {
      setError(errors[0]);
      return;
    }
    updateState((prev) => ({
      ...prev,
      clientUsers: prev.clientUsers.map((item) =>
        item.id === client.id
          ? {
              ...item,
              name: profileForm.name.trim(),
              email: profileForm.email.trim().toLowerCase(),
              phone: normalizePhone(profileForm.phone),
              idNumber: normalizeIdNumber(profileForm.idNumber),
              password: profileForm.password.trim() || item.password,
            }
          : item
      ),
    }));
    setNotice("Perfil actualizado.");
    setProfileForm((prev) => ({ ...prev, password: "" }));
  };

  const removeFavorite = (propertyId: string) => {
    if (!client) return;
    updateState((prev) => ({
      ...prev,
      propertyFavorites: prev.propertyFavorites.filter(
        (favorite) =>
          !(favorite.clientId === client.id && favorite.propertyId === propertyId)
      ),
      propertyMetrics: prev.propertyMetrics.map((metric) =>
        metric.propertyId === propertyId
          ? { ...metric, favorites: Math.max(0, metric.favorites - 1) }
          : metric
      ),
    }));
  };

  return (
    <div style={themeStyles} className="min-h-screen bg-background text-on-background">
      <FrontHeader active="detail" />
      <main className="mx-auto min-h-screen max-w-screen-xl px-6 pt-24 lg:px-8">
        {!client ? (
          <div className="rounded-3xl bg-surface-container-lowest p-10 text-center shadow-[0_40px_60px_-15px_rgba(27,27,28,0.08)]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">
              Acceso requerido
            </p>
            <h1 className="mt-4 text-3xl font-headline font-extrabold text-primary">
              Ingresá para ver tu cuenta
            </h1>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/acceso"
                className="rounded-full bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-widest text-on-primary"
                style={{ color: "var(--color-on-primary)" }}
              >
                Ingresar
              </Link>
              <Link
                href="/registro"
                className="rounded-full border border-outline-variant/40 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-primary"
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.08)]">
              <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">
                Mi cuenta
              </p>
              <h1 className="mt-4 text-3xl font-headline font-extrabold text-primary">
                {client.name}
              </h1>
              <p className="mt-2 text-sm text-on-surface-variant">
                Perfil, favoritos y consultas asociadas a tu cuenta.
              </p>

              <form className="mt-8 grid gap-4" onSubmit={handleProfileSubmit}>
                <input
                  required
                  value={profileForm.name}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  placeholder="Nombre"
                />
                <input
                  required
                  type="email"
                  value={profileForm.email}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  placeholder="Email"
                />
                <input
                  required
                  value={profileForm.phone}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  placeholder="Teléfono"
                />
                <input
                  required
                  value={profileForm.idNumber}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, idNumber: event.target.value }))
                  }
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  placeholder="DNI / CUIL / CUIT"
                />
                <input
                  type="password"
                  value={profileForm.password}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  placeholder="Nueva contraseña opcional"
                />
                {error ? <p className="text-sm text-error">{error}</p> : null}
                {notice ? <p className="text-sm text-primary">{notice}</p> : null}
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary"
                  style={{ color: "var(--color-on-primary)" }}
                >
                  Guardar perfil
                </button>
              </form>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-8 text-xs font-semibold uppercase tracking-widest text-on-surface-variant"
              >
                Cerrar sesión
              </button>
            </section>

            <div className="grid gap-8">
              <section className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-8">
                <h2 className="text-2xl font-headline font-bold text-primary">
                  Favoritos
                </h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {favoriteListings.length === 0 ? (
                    <p className="text-sm text-on-surface-variant">
                      Todavía no guardaste propiedades.
                    </p>
                  ) : (
                    favoriteListings.map((listing) => (
                      <article
                        key={listing.id}
                        className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4"
                      >
                        <h3 className="font-bold text-primary">{listing.title}</h3>
                        <p className="mt-1 text-sm text-on-surface-variant">
                          {listing.neighborhood}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link
                            href={`/propiedades/${listing.id}`}
                            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-on-primary"
                            style={{ color: "var(--color-on-primary)" }}
                          >
                            Ver ficha
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeFavorite(listing.id)}
                            className="rounded-full border border-outline-variant/40 px-4 py-2 text-xs font-semibold text-primary"
                          >
                            Quitar
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-8">
                <h2 className="text-2xl font-headline font-bold text-primary">
                  Historial de consultas
                </h2>
                <div className="mt-6 grid gap-3">
                  {clientLeads.length === 0 ? (
                    <p className="text-sm text-on-surface-variant">
                      Todavía no enviaste consultas.
                    </p>
                  ) : (
                    clientLeads.map((lead) => {
                      const listing = listings.find((item) => item.id === lead.propertyId);
                      return (
                        <article
                          key={lead.id}
                          className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="font-bold text-primary">
                                {listing?.title ?? "Consulta general"}
                              </h3>
                              <p className="mt-1 text-sm text-on-surface-variant">
                                {new Date(lead.createdAt).toLocaleDateString("es-AR")}
                              </p>
                            </div>
                            <span className="rounded-full bg-surface-container-lowest px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                              {lead.status}
                            </span>
                          </div>
                          {lead.notes ? (
                            <p className="mt-3 text-sm text-on-surface-variant">
                              {lead.notes}
                            </p>
                          ) : null}
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
