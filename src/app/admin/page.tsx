"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AdminShell from "@/components/inmo/admin/AdminShell";
import { currencyFormatter } from "@/lib/adminForms";
import { propertyTypeLabels, statusLabels } from "@/lib/inmoData";
import { useInmoStore } from "@/lib/inmoStore";

export default function AdminDashboardPage() {
  const { state } = useInmoStore();
  const { listings, agents, leads } = state;

  const availableCount = listings.filter((item) => item.status === "disponible").length;
  const reservedCount = listings.filter((item) => item.status === "reservado").length;
  const soldCount = listings.filter((item) => item.status === "vendido").length;

  const avgPrice = listings.length
    ? listings.reduce((acc, item) => acc + item.price, 0) / listings.length
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
    if (listing.priceUnit === "mensual") return acc + listing.price;
    if (listing.priceUnit === "noche") return acc + listing.price * 30;
    return acc;
  }, 0);

  const closedSalesRevenue = listings
    .filter((item) => item.priceUnit === "venta" && item.status === "vendido")
    .reduce((acc, item) => acc + item.price, 0);

  const inventoryChart = [
    { id: "disponible", label: "Disponibles", value: availableCount },
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
  const pendingTasks = [
    {
      id: "contract",
      title: "Revisión de contrato",
      subtitle: "Penthouse B • 14:00",
      icon: "signature",
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
              {currencyFormatter.format(avgPrice || 0)}
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
              Facturación mensual estimada
            </p>
            <p className="mt-2 text-2xl font-semibold text-primary">
              {currencyFormatter.format(estimatedMonthlyRevenue)}
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
              ventas cerradas {currencyFormatter.format(closedSalesRevenue)}
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
                        {currencyFormatter.format(listing.price)}
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
