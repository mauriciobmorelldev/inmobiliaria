"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useInmoStore } from "@/lib/inmoStore";
import { buildThemeStyles } from "@/lib/theme";
import { propertyTypeLabels, statusLabels } from "@/lib/inmoData";
import FrontHeader from "@/components/inmo/FrontHeader";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const getCoverImage = (images: string[], coverIndex: number) => {
  if (!images.length) return "";
  return images[coverIndex] ?? images[0];
};

const fallbackHeroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDzWLJ1ZWYuCXv4uUt88LiRLMh6Kis0lEW9bZbHsLtWcsRCgtS5gGDYYDm3MEK1wSfzXnQIttSX6XW5vl8IyMI41AuH0r4TSctOX41XtfS0KEuaesTwOEQxFZ2wrNdo1BNdsgnmE5M3OJ-sO4yPFGYXZXUqaNLuH_jCe2MTLxpYuOf_L-7dDxXfImH4zAUslJI0QMbcb78l6j4xOPWyx_53wqiEyYTmTBUk_sucmOru6E9gt_HroO1fguRWslF7CchhD8Y-sBF9NQ";

const truncate = (value: string, max = 110) => {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}...`;
};

export default function HomeStitch() {
  const { state } = useInmoStore();
  const { listings, agents, theme, clientUsers } = state;
  const [clientName, setClientName] = useState("");

  useEffect(() => {
    const hydrate = () => {
      try {
        const raw = window.localStorage.getItem("inmo-client-session/v1");
        if (!raw) {
          setClientName("");
          return;
        }
        const session = JSON.parse(raw) as { email?: string };
        if (!session.email) {
          setClientName("");
          return;
        }
        const match = clientUsers.find(
          (user) => user.email.toLowerCase() === session.email?.toLowerCase()
        );
        setClientName(match?.name ?? "");
      } catch {
        setClientName("");
      }
    };
    if (typeof queueMicrotask === "function") {
      queueMicrotask(hydrate);
    } else {
      window.setTimeout(hydrate, 0);
    }
  }, [clientUsers]);

  const featuredListings = useMemo(
    () => listings.filter((item) => item.status === "disponible").slice(0, 6),
    [listings]
  );

  const heroImage = useMemo(() => {
    if (theme.heroImage) return theme.heroImage;
    return fallbackHeroImage;
  }, [theme.heroImage]);

  const agentsById = useMemo(
    () => Object.fromEntries(agents.map((agent) => [agent.id, agent])),
    [agents]
  );

  const availableCount = listings.filter((item) => item.status === "disponible").length;
  const reservedCount = listings.filter((item) => item.status === "reservado").length;
  const avgPrice = listings.length
    ? listings.reduce((acc, item) => acc + item.price, 0) / listings.length
    : 0;

  const topNeighborhoods = useMemo(() => {
    const counter = new Map<string, number>();
    listings.forEach((item) => {
      if (!item.neighborhood) return;
      counter.set(item.neighborhood, (counter.get(item.neighborhood) ?? 0) + 1);
    });
    return [...counter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [listings]);

  const recentListings = useMemo(() => [...listings].slice(-3).reverse(), [listings]);

  const themeStyles = buildThemeStyles(theme);

  return (
    <div
      style={themeStyles}
      className="bg-background text-on-background font-body selection:bg-primary-fixed selection:text-on-primary-fixed"
    >
      <FrontHeader active="home" />

      <main className="pt-20">
        <section className="relative flex min-h-[480px] sm:min-h-[720px] w-full items-center overflow-hidden py-10 sm:py-16">
          <div className="absolute inset-0 z-0">
            <img className="h-full w-full object-cover" alt="Portada" src={heroImage} />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/70 via-primary/35 to-transparent" />
          </div>
          <div className="relative z-10 mx-auto w-full max-w-screen-2xl px-8">
            <div className="max-w-3xl">
              <span className="mb-6 inline-block rounded-full bg-surface-container-lowest/25 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-on-primary">
                Volumen XV · 2026
              </span>
              <h1 className="mb-6 text-5xl font-headline font-extrabold leading-[0.92] tracking-tighter text-on-primary md:text-8xl">
                Espacios con <br />
                <span className="italic font-light">valor real.</span>
              </h1>
              <p className="max-w-2xl text-base text-on-primary/90 md:text-lg">
                {clientName
                  ? `Bienvenido, ${clientName}. Accedé a tus contratos y pagos desde tu cuenta privada.`
                  : "Combinamos curaduría estética con métricas operativas para decidir mejor: propiedades listas para vivir, invertir o rentar."}
              </p>
            </div>

            <div className="mt-12 grid max-w-5xl gap-3 rounded-2xl bg-surface-container-lowest/95 p-3 shadow-[0_40px_60px_-20px_rgba(7,22,13,0.45)] md:grid-cols-[1.2fr_1fr_1fr_auto]">
              <div className="rounded-xl bg-surface-container-low p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                  Inventario activo
                </p>
                <p className="mt-2 text-3xl font-headline font-bold text-primary">{listings.length}</p>
              </div>
              <div className="rounded-xl bg-surface-container-low p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                  Disponibles
                </p>
                <p className="mt-2 text-3xl font-headline font-bold text-primary">{availableCount}</p>
              </div>
              <div className="rounded-xl bg-surface-container-low p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                  Precio medio
                </p>
                <p className="mt-2 text-xl font-headline font-bold text-primary">
                  {currencyFormatter.format(avgPrice || 0)}
                </p>
              </div>
              <Link
                href="/propiedades"
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-sm font-bold tracking-tight text-on-primary"
              >
                Explorar catálogo
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-screen-2xl px-8 py-20">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-6">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Propiedades activas</p>
              <p className="mt-2 text-3xl font-bold text-primary">{availableCount}</p>
            </div>
            <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-6">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Reservas en curso</p>
              <p className="mt-2 text-3xl font-bold text-primary">{reservedCount}</p>
            </div>
            <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-6">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Barrios cubiertos</p>
              <p className="mt-2 text-3xl font-bold text-primary">{topNeighborhoods.length}</p>
            </div>
            <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-6">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Corredores activos</p>
              <p className="mt-2 text-3xl font-bold text-primary">{agents.length}</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-screen-2xl px-8 pb-24">
          <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h2 className="text-4xl font-headline font-bold tracking-tighter text-primary">
                Selecciones Curadas
              </h2>
              <p className="mt-2 max-w-2xl text-on-surface-variant">
                Fichas con contexto comercial y visión de uso real, no solo fotos bonitas.
              </p>
            </div>
            <Link
              className="flex items-center gap-2 border-b-2 border-primary pb-1 text-sm font-bold uppercase tracking-widest"
              href="/propiedades"
            >
              Ver Colección Completa
            </Link>
          </div>

          {featuredListings.length === 0 ? (
            <div className="rounded-xl bg-surface-container-lowest p-10 text-center shadow-[0_40px_60px_-15px_rgba(27,27,28,0.06)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Catálogo vacío
              </p>
              <h3 className="mt-4 text-2xl font-headline font-bold text-primary">
                Todavía no hay propiedades destacadas
              </h3>
              <Link
                href="/acceso"
                className="mt-6 inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-on-primary"
              >
                Acceso clientes
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {featuredListings.slice(0, 6).map((item) => {
                const cover = getCoverImage(item.images, item.coverIndex);
                const video = item.videos?.[0];
                const agent = item.agentId ? agentsById[item.agentId] : undefined;
                const narrative = truncate(
                  item.highlight ||
                    item.description ||
                    `${item.rooms} ambientes con ${item.area}m² en ${item.neighborhood}.`
                );

                return (
                  <article
                    key={item.id}
                    className="group overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-[0_25px_45px_-25px_rgba(27,27,28,0.35)] transition-transform hover:-translate-y-1"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden">
                      {video ? (
                        <video
                          className="h-full w-full object-cover"
                          src={video}
                          muted
                          playsInline
                          loop
                          autoPlay
                        />
                      ) : cover ? (
                        <img
                          src={cover}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/75 via-primary/15 to-transparent" />

                      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                        {item.tag ? (
                          <span className="rounded-full bg-surface-container-lowest/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                            {item.tag}
                          </span>
                        ) : null}
                        <span className="rounded-full bg-primary/85 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-primary">
                          {statusLabels[item.status]}
                        </span>
                      </div>

                      <div className="absolute left-4 right-4 bottom-4 rounded-xl bg-surface-container-lowest/90 p-3 backdrop-blur">
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-on-surface-variant">
                          <span>{propertyTypeLabels[item.type]}</span>
                          <span>{item.area} m²</span>
                        </div>
                        <p className="mt-2 text-lg font-bold text-primary">
                          {currencyFormatter.format(item.price)}
                        </p>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-xl font-headline font-bold text-primary">{item.title}</h3>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {item.neighborhood || "Ubicación privada"}
                      </p>
                      <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">{narrative}</p>

                      <div className="mt-4 flex items-center justify-between text-xs text-on-surface-variant">
                        <span>{item.rooms} ambientes</span>
                        <span>{propertyTypeLabels[item.type]}</span>
                        {agent ? <span>{agent.name}</span> : <span>Sin corredor</span>}
                      </div>

                      <div className="mt-5 flex items-center justify-between">
                        <Link
                          href={`/propiedades/${item.id}`}
                          className="text-sm font-semibold text-primary hover:text-primary-container"
                        >
                          Ver detalle completo
                        </Link>
                        <Link
                          href={`/propiedades/${item.id}`}
                          className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-widest text-on-primary"
                        >
                          Agendar
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-screen-2xl px-8 pb-24">
          <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-headline font-bold tracking-tight text-primary">
                  Equipo y Barrios
                </h2>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Explorá el equipo comercial y las zonas con más movimiento.
                </p>
              </div>
              <Link href="/equipo" className="text-sm font-semibold text-primary">
                Ver equipo
              </Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Link
                href="/equipo"
                className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6 hover:border-primary/40"
              >
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                  Equipo
                </p>
                <h3 className="mt-2 text-xl font-bold text-primary">
                  Conocé a nuestros corredores
                </h3>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Especialistas por zona y tipo de operación.
                </p>
              </Link>
              <Link
                href="/barrios"
                className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6 hover:border-primary/40"
              >
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                  Barrios
                </p>
                <h3 className="mt-2 text-xl font-bold text-primary">
                  Zonas con mayor demanda
                </h3>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Mapa de barrios destacados del inventario.
                </p>
              </Link>
            </div>
          </div>
        </section>

        <section id="insights" className="mx-auto max-w-screen-2xl px-8 pb-24">
          <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-headline font-bold tracking-tight text-primary">
                  Incorporaciones recientes
                </h2>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Últimas propiedades agregadas desde el panel administrativo.
                </p>
              </div>
              <Link href="/propiedades" className="text-sm font-semibold text-primary">
                Ver catálogo completo
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
              {recentListings.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No hay nuevas incorporaciones aún.</p>
              ) : (
                recentListings.map((item) => (
                  <Link
                    key={item.id}
                    href={`/propiedades/${item.id}`}
                    className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 hover:border-primary/40"
                  >
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                      {statusLabels[item.status]}
                    </p>
                    <h3 className="mt-2 text-lg font-bold text-primary">{item.title}</h3>
                    <p className="mt-1 text-sm text-on-surface-variant">{item.neighborhood}</p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
