"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AdminShell from "@/components/inmo/admin/AdminShell";
import { propertyTypeLabels, statusLabels } from "@/lib/inmoData";
import { useInmoStore } from "@/lib/inmoStore";
import { formatPrice, getListingComparablePriceInArs } from "@/lib/pricing";

export default function AdminDashboardPage() {
  const { state, updateState } = useInmoStore();
  const { listings, agents, leads, propertyFavorites, propertyMetrics, toccoSyncLogs, theme } =
    state;
  const [syncingTocco, setSyncingTocco] = useState(false);
  const [toccoSyncNotice, setToccoSyncNotice] = useState("");

  const availableCount = listings.filter((item) => item.status === "disponible").length;
  const pausedCount = listings.filter((item) => item.status === "pausado").length;
  const reservedCount = listings.filter((item) => item.status === "reservado").length;
  const soldCount = listings.filter((item) => item.status === "vendido").length;

  const avgPrice = listings.length
    ? listings.reduce((acc, item) => acc + getListingComparablePriceInArs(item, theme), 0) / listings.length
    : 0;

  const rentalListings = listings.filter((item) => item.priceUnit !== "venta");
  const rentalAvailableCount = rentalListings.filter(
    (item) => item.status === "disponible"
  ).length;
  const rentalOccupiedCount = rentalListings.filter(
    (item) => item.status !== "disponible"
  ).length;
  const occupancyRate = rentalListings.length
    ? Math.round((rentalOccupiedCount / rentalListings.length) * 100)
    : 0;

  const estimatedMonthlyRevenue = listings.reduce((acc, listing) => {
    if (listing.status === "disponible") return acc;
    if (listing.priceUnit === "mensual") return acc + getListingComparablePriceInArs(listing, theme);
    if (listing.priceUnit === "noche") return acc + getListingComparablePriceInArs(listing, theme) * 30;
    return acc;
  }, 0);

  const closedSalesRevenue = listings
    .filter((item) => item.priceUnit === "venta" && item.status === "vendido")
    .reduce((acc, item) => acc + getListingComparablePriceInArs(item, theme), 0);

  const inventoryChart = [
    { id: "disponible", label: "Disponibles", value: availableCount },
    { id: "pausado", label: "Pausadas", value: pausedCount },
    { id: "reservado", label: "Reservados", value: reservedCount },
    { id: "vendido", label: "Vendidos", value: soldCount },
  ];
  const maxInventoryValue = Math.max(1, ...inventoryChart.map((item) => item.value));
  const [trendView, setTrendView] = useState<"dia" | "semana" | "mes">("mes");
  const leadTrendMap = useMemo(
    () => ({
      dia: [4, 9, 6, 11, 8, 13, 9, 6, 10, 14, 7, 5],
      semana: [8, 14, 11, 18, 16, 20, 15, 12, 19, 22, 14, 13],
      mes: [12, 22, 16, 28, 32, 25, 18, 29, 40, 26, 14, 20],
    }),
    []
  );
  const leadTrends = useMemo(() => {
    const buckets = new Array(12).fill(0);
    const now = new Date();
    leads.forEach((lead) => {
      const created = new Date(lead.createdAt);
      let diff = 0;
      if (trendView === "dia") {
        diff = Math.floor(
          (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
        );
      } else if (trendView === "semana") {
        diff = Math.floor(
          (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 7)
        );
      } else {
        diff =
          now.getFullYear() * 12 +
          now.getMonth() -
          (created.getFullYear() * 12 + created.getMonth());
      }
      if (diff >= 0 && diff < 12) {
        buckets[11 - diff] += 1;
      }
    });
    const hasData = buckets.some((value) => value > 0);
    return hasData ? buckets : leadTrendMap[trendView];
  }, [leadTrendMap, leads, trendView]);
  const maxLeadTrend = Math.max(...leadTrends, 1);
  const pipelineChart = [
    {
      id: "inquiries",
      label: "Nuevas consultas",
      value: leads.filter((lead) => lead.status === "nuevo").length,
      barClass: "bg-primary",
    },
    {
      id: "tours",
      label: "Visitas coordinadas",
      value: leads.filter((lead) => lead.status === "visita").length,
      barClass: "bg-secondary",
    },
    {
      id: "closed",
      label: "Operaciones cerradas",
      value: leads.filter((lead) => lead.status === "cerrado").length,
      barClass: "bg-primary-container",
    },
  ];
  const maxPipelineValue = Math.max(1, ...pipelineChart.map((item) => item.value));
  const recentLeads = [...leads].slice(-4).reverse();
  const totalLeads = Math.max(1, leads.length);
  const conversion = {
    visita: Math.round(
      (leads.filter((lead) => lead.status === "visita").length / totalLeads) * 100
    ),
    reservado: Math.round(
      (leads.filter((lead) => lead.status === "reservado").length / totalLeads) * 100
    ),
    cerrado: Math.round(
      (leads.filter((lead) => lead.status === "cerrado").length / totalLeads) * 100
    ),
  };
  const agentPerformance = agents
    .map((agent) => {
      const agentLeads = leads.filter((lead) => lead.agentId === agent.id);
      return {
        id: agent.id,
        name: agent.name,
        properties: listings.filter((listing) => listing.agentId === agent.id).length,
        leads: agentLeads.length,
        closed: agentLeads.filter((lead) => lead.status === "cerrado").length,
      };
    })
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 5);
  const topProperties = listings
    .map((listing) => {
      const metric = propertyMetrics.find((item) => item.propertyId === listing.id);
      const leadCount = leads.filter((lead) => lead.propertyId === listing.id).length;
      const favoriteCount = propertyFavorites.filter(
        (favorite) => favorite.propertyId === listing.id
      ).length;
      return {
        id: listing.id,
        title: listing.title,
        views: metric?.views ?? 0,
        leads: metric?.leads || leadCount,
        favorites: metric?.favorites || favoriteCount,
      };
    })
    .sort((a, b) => b.views + b.leads + b.favorites - (a.views + a.leads + a.favorites))
    .slice(0, 5);
  const handleToccoSync = async () => {
    setSyncingTocco(true);
    setToccoSyncNotice("");
    try {
      const response = await fetch("/api/tocco/sync", { method: "POST" });
      if (!response.ok) {
        setToccoSyncNotice("Sincronización protegida. Configurá TOCCO_SYNC_SECRET y credenciales reales para habilitarla.");
        return;
      }
      const stateResponse = await fetch("/api/inmo-state", { cache: "no-store" });
      if (!stateResponse.ok) return;
      updateState(await stateResponse.json());
      setToccoSyncNotice("Sincronización ejecutada correctamente.");
    } finally {
      setSyncingTocco(false);
    }
  };
  const pendingTasks = [
    {
      id: "lead-review",
      title: "Revisión de lead",
      subtitle: "Penthouse B • 14:00",
      icon: "fact_check",
      tone: "bg-tertiary-fixed",
      text: "text-on-tertiary-fixed",
    },
    {
      id: "callback",
      title: "Callback: Elena Rose",
      subtitle: "Prioridad alta • 16:30",
      icon: "call",
      tone: "bg-secondary-fixed",
      text: "text-on-secondary-fixed",
    },
    {
      id: "shoot",
      title: "Aprobación de fotos",
      subtitle: "Lote 23 • Mañana",
      icon: "photo_camera",
      tone: "bg-primary-fixed",
      text: "text-on-primary-fixed",
    },
  ];

  return (
    <AdminShell
      activeSection="dashboard"
      title="Resumen"
      primaryAction={{ href: "/admin/propiedades#form-propiedad", label: "Nueva propiedad" }}
    >
      <section className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)] flex flex-col justify-between h-40 group hover:bg-primary transition-colors duration-300">
          <div className="flex justify-between items-start">
            <span
              className="material-symbols-outlined text-primary group-hover:text-on-primary"
              data-icon="real_estate_agent"
            >
              real_estate_agent
            </span>
            <span className="text-[10px] font-bold text-primary-container bg-primary-fixed px-2 py-1 rounded-full">
              Inventario
            </span>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant group-hover:text-on-primary/60 font-bold">
              Propiedades Totales
            </p>
            <h3 className="text-3xl font-extrabold text-primary group-hover:text-on-primary">
              {listings.length}
            </h3>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)] flex flex-col justify-between h-40 group hover:bg-primary transition-colors duration-300">
          <div className="flex justify-between items-start">
            <span
              className="material-symbols-outlined text-primary group-hover:text-on-primary"
              data-icon="check_circle"
            >
              check_circle
            </span>
            <span className="text-[10px] font-bold text-primary-container bg-primary-fixed px-2 py-1 rounded-full">
              Disponibles
            </span>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant group-hover:text-on-primary/60 font-bold">
              Activas
            </p>
            <h3 className="text-3xl font-extrabold text-primary group-hover:text-on-primary">
              {availableCount}
            </h3>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)] flex flex-col justify-between h-40 group hover:bg-primary transition-colors duration-300">
          <div className="flex justify-between items-start">
            <span
              className="material-symbols-outlined text-primary group-hover:text-on-primary"
              data-icon="hourglass_top"
            >
              hourglass_top
            </span>
            <span className="text-[10px] font-bold text-error bg-error-container px-2 py-1 rounded-full">
              Reservas
            </span>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant group-hover:text-on-primary/60 font-bold">
              Reservadas
            </p>
            <h3 className="text-3xl font-extrabold text-primary group-hover:text-on-primary">
              {reservedCount}
            </h3>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)] flex flex-col justify-between h-40 group hover:bg-primary transition-colors duration-300">
          <div className="flex justify-between items-start">
            <span
              className="material-symbols-outlined text-primary group-hover:text-on-primary"
              data-icon="payments"
            >
              payments
            </span>
            <span className="text-[10px] font-bold text-primary-container bg-primary-fixed px-2 py-1 rounded-full">
              Promedio
            </span>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant group-hover:text-on-primary/60 font-bold">
              Precio Medio
            </p>
            <h3 className="text-2xl font-extrabold text-primary group-hover:text-on-primary">
              {formatPrice(avgPrice || 0, "venta", "ARS")}
            </h3>
          </div>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Link
          href="/admin/propiedades"
          className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 hover:border-primary/40"
        >
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Inventario</p>
          <h3 className="mt-2 text-lg font-bold text-primary">Gestionar propiedades</h3>
          <p className="mt-2 text-sm text-on-surface-variant">Alta, edición, imágenes y corredor asignado.</p>
        </Link>
        <Link
          href="/admin/agentes"
          className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 hover:border-primary/40"
        >
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Equipo</p>
          <h3 className="mt-2 text-lg font-bold text-primary">Administrar corredores</h3>
          <p className="mt-2 text-sm text-on-surface-variant">Crear agentes, editar datos y foto de perfil.</p>
        </Link>
        <Link
          href="/admin/branding"
          className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 hover:border-primary/40"
        >
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Identidad</p>
          <h3 className="mt-2 text-lg font-bold text-primary">Branding de front</h3>
          <p className="mt-2 text-sm text-on-surface-variant">Colores, logo e imagen principal de la home.</p>
        </Link>
        <Link
          href="/admin/filtros"
          className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 hover:border-primary/40"
        >
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Taxonomía</p>
          <h3 className="mt-2 text-lg font-bold text-primary">Filtros dinámicos</h3>
          <p className="mt-2 text-sm text-on-surface-variant">Grupos y opciones para el buscador del front.</p>
        </Link>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-headline font-bold text-primary">
                Tendencias de Leads
              </h3>
              <p className="text-xs text-on-surface-variant">
                Actividad de interacción en el período seleccionado
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              {[
                { id: "dia", label: "Diario" },
                { id: "semana", label: "Semanal" },
                { id: "mes", label: "Mensual" },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTrendView(option.id as typeof trendView)}
                  className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${
                    trendView === option.id
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex h-52 items-end gap-3 rounded-2xl bg-surface-container-low p-4">
            {leadTrends.map((value, index) => {
              const height = Math.max(14, Math.round((value / maxLeadTrend) * 100));
              const isActive = index === 6;
              return (
                <div
                  key={`lead-${index}`}
                  className={`flex-1 rounded-t-lg ${
                    isActive ? "bg-primary" : "bg-primary-fixed/40"
                  }`}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)]">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-headline font-bold text-primary">Pipeline</h3>
              <span className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">
                Este mes
              </span>
            </div>
            <div className="mt-6 space-y-4">
              {pipelineChart.map((item) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant">
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-surface-container-low">
                    <div
                      className={`h-2 rounded-full ${item.barClass}`}
                      style={{
                        width: `${Math.max(
                          10,
                          Math.round((item.value / maxPipelineValue) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)]">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-headline font-bold text-primary">Tareas pendientes</h3>
              <span className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">
                Hoy
              </span>
            </div>
            <div className="mt-6 space-y-3">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-4 rounded-2xl bg-surface-container-low p-4"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${task.tone} ${task.text}`}
                  >
                    <span className="material-symbols-outlined" data-icon={task.icon}>
                      {task.icon}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">{task.title}</p>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                      {task.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-headline font-bold text-primary">
                Conversión comercial
              </h3>
              <p className="mt-1 text-xs text-on-surface-variant">
                Progreso de leads hacia visitas, reservas y cierres.
              </p>
            </div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">
              {leads.length} leads
            </span>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["Visita", conversion.visita],
              ["Reserva", conversion.reservado],
              ["Cierre", conversion.cerrado],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5"
              >
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                  {label}
                </p>
                <p className="mt-2 text-3xl font-bold text-primary">{value}%</p>
                <div className="mt-3 h-2 rounded-full bg-surface-container-high">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-headline font-bold text-primary">
                Sincronización Tocco
              </h3>
              <p className="mt-1 text-xs text-on-surface-variant">
                Requiere credenciales reales y secreto server-side para producción.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToccoSync}
              disabled={syncingTocco}
              className="rounded-full bg-primary px-5 py-2 text-xs font-semibold uppercase tracking-widest text-on-primary disabled:opacity-60"
              style={{ color: "var(--color-on-primary)" }}
            >
              {syncingTocco ? "Sincronizando" : "Sincronizar"}
            </button>
          </div>
          {toccoSyncNotice ? (
            <p className="mt-4 rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
              {toccoSyncNotice}
            </p>
          ) : null}
          <div className="mt-6 grid gap-3">
            {toccoSyncLogs.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                Todavía no hay ejecuciones registradas.
              </p>
            ) : (
              toccoSyncLogs.slice(0, 3).map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">
                      {log.status}
                    </span>
                    <span className="text-[10px] text-on-surface-variant">
                      {new Date(log.finishedAt).toLocaleString("es-AR")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-on-surface-variant">{log.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-xl font-headline font-bold text-primary">Leads recientes</h3>
          <span className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">
            Últimos registros
          </span>
        </div>
        <div className="mt-6 grid gap-3">
          {recentLeads.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Todavía no hay leads cargados.</p>
          ) : (
            recentLeads.map((lead) => {
              return (
                <div
                  key={lead.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-semibold">
                      {lead.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">{lead.name}</p>
                      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                        {lead.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-on-surface-variant">
                    {lead.status}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)]">
          <h3 className="text-xl font-headline font-bold text-primary">
            Rendimiento por corredor
          </h3>
          <div className="mt-6 grid gap-3">
            {agentPerformance.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                Cargá corredores para ver performance.
              </p>
            ) : (
              agentPerformance.map((agent) => (
                <div
                  key={agent.id}
                  className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-primary">{agent.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        {agent.properties} propiedades
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{agent.leads} leads</p>
                      <p className="text-xs text-on-surface-variant">
                        {agent.closed} cierres
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)]">
          <h3 className="text-xl font-headline font-bold text-primary">
            Propiedades más consultadas
          </h3>
          <div className="mt-6 grid gap-3">
            {topProperties.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                Todavía no hay métricas de propiedades.
              </p>
            ) : (
              topProperties.map((property) => (
                <Link
                  key={property.id}
                  href={`/propiedades/${property.id}`}
                  className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 hover:border-primary/40"
                >
                  <p className="font-bold text-primary">{property.title}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {property.views} vistas · {property.leads} leads ·{" "}
                    {property.favorites} favoritos
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-xl font-headline font-bold text-primary">Métricas Operativas</h3>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
            Estado del inventario
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
              Ingreso potencial mensual
            </p>
            <p className="mt-2 text-2xl font-semibold text-primary">
              {formatPrice(estimatedMonthlyRevenue, "mensual", "ARS")}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-on-surface-variant">
              reservas y cerradas
            </p>
          </div>
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
              Alquileres activos
            </p>
            <p className="mt-2 text-2xl font-semibold text-primary">{rentalOccupiedCount}</p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-on-surface-variant">
              {rentalAvailableCount} disponibles
            </p>
          </div>
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
              Ocupación alquileres
            </p>
            <p className="mt-2 text-2xl font-semibold text-primary">{occupancyRate}%</p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-on-surface-variant">
              ventas cerradas {formatPrice(closedSalesRevenue, "venta", "ARS")}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {inventoryChart.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                  {item.label}
                </p>
                <span className="text-sm font-semibold text-primary">{item.value}</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-surface-container-high">
                <div
                  className="h-2 rounded-full bg-primary transition-[width] duration-300"
                  style={{
                    width: `${Math.round((item.value / maxInventoryValue) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 border-b border-outline-variant/20">
                <th className="pb-4 font-bold">Propiedad</th>
                <th className="pb-4 font-bold">Tipo</th>
                <th className="pb-4 font-bold">Precio</th>
                <th className="pb-4 font-bold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {listings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-sm text-on-surface-variant">
                    Aún no hay propiedades cargadas.
                  </td>
                </tr>
              ) : (
                [...listings]
                  .slice(-6)
                  .reverse()
                  .map((listing) => (
                    <tr
                      key={listing.id}
                      className="group hover:bg-surface-container-low/30 transition-colors"
                    >
                      <td className="py-5">
                        <p className="text-sm font-bold">{listing.title}</p>
                        <p className="text-[10px] text-on-surface-variant">
                          {listing.neighborhood || "Sin barrio"}
                        </p>
                      </td>
                      <td className="py-5 text-sm font-medium">
                        {propertyTypeLabels[listing.type]}
                      </td>
                      <td className="py-5 text-sm font-medium">
                        {formatPrice(listing.price, listing.priceUnit, listing.currency)}
                      </td>
                      <td className="py-5">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-bold uppercase tracking-wider">
                          {statusLabels[listing.status]}
                        </span>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-sm text-on-surface-variant">
          Corredores activos: <span className="font-semibold text-primary">{agents.length}</span>
        </div>
      </section>
    </AdminShell>
  );
}
