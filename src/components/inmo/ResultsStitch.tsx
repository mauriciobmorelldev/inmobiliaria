"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useInmoStore } from "@/lib/inmoStore";
import {
  propertyTypeLabels,
  type FilterGroup,
  type PropertyType,
} from "@/lib/inmoData";
import { buildThemeStyles } from "@/lib/theme";
import FrontHeader from "@/components/inmo/FrontHeader";
import { getAvailability } from "@/lib/availability";
import { formatPrice, getListingComparablePriceInArs } from "@/lib/pricing";

type PropertyTypeFilter = "all" | PropertyType;
type PropertyStatusFilter = "all" | "disponible" | "no-disponible";
type OperationFilter = "all" | "venta" | "alquiler";

const typeFilters: Array<{ id: PropertyTypeFilter; label: string }> = [
  { id: "all", label: "Todas" },
  { id: "tradicional", label: propertyTypeLabels.tradicional },
  { id: "temporario", label: propertyTypeLabels.temporario },
  { id: "pozo", label: propertyTypeLabels.pozo },
  { id: "listo", label: propertyTypeLabels.listo },
];

const statusFilters: Array<{ id: PropertyStatusFilter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "disponible", label: "Disponible" },
  { id: "no-disponible", label: "No disponible" },
];

const getCoverImage = (images: string[], coverIndex: number) => {
  if (!images.length) return "";
  return images[coverIndex] ?? images[0];
};

const toggleAttributeSelection = (
  group: FilterGroup,
  option: string,
  current: Record<string, string[]>
) => {
  const selected = current[group.id] ?? [];
  if (group.mode === "single") {
    return { ...current, [group.id]: selected[0] === option ? [] : [option] };
  }
  const exists = selected.includes(option);
  return {
    ...current,
    [group.id]: exists
      ? selected.filter((item) => item !== option)
      : [...selected, option],
  };
};

export default function ResultsStitch() {
  const { state } = useInmoStore();
  const { listings, filterGroups, theme } = state;

  const [query, setQuery] = useState("");
  const [type, setType] = useState<PropertyTypeFilter>("all");
  const [status, setStatus] = useState<PropertyStatusFilter>("all");
  const [operation, setOperation] = useState<OperationFilter>("all");
  const [minRooms, setMinRooms] = useState("all");
  const [sort, setSort] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);
  const [attributeFilters, setAttributeFilters] = useState<
    Record<string, string[]>
  >({});

  const themeStyles = buildThemeStyles(theme);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incoming = params.get("operacion");
    if (incoming === "venta" || incoming === "alquiler") {
      const applyOperation = () => setOperation(incoming);
      if (typeof queueMicrotask === "function") {
        queueMicrotask(applyOperation);
        return;
      }
      window.setTimeout(applyOperation, 0);
    }
  }, []);

  const filteredListings = useMemo(() => {
    let items = [...listings];
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.neighborhood.toLowerCase().includes(q)
      );
    }
    if (type !== "all") {
      items = items.filter((item) => item.type === type);
    }
    if (status === "disponible") {
      items = items.filter((item) => item.status === status);
    }
    if (status === "no-disponible") {
      items = items.filter((item) => item.status !== "disponible");
    }
    if (operation === "venta") {
      items = items.filter((item) => item.priceUnit === "venta");
    }
    if (operation === "alquiler") {
      items = items.filter((item) => item.priceUnit === "mensual" || item.priceUnit === "noche");
    }
    if (minRooms !== "all") {
      const rooms = Number(minRooms);
      items = items.filter((item) => item.rooms >= rooms);
    }
    items = items.filter((item) =>
      filterGroups.every((group) => {
        const selected = attributeFilters[group.id] ?? [];
        if (!selected.length) return true;
        const values = item.attributes[group.id] ?? [];
        return selected.every((option) => values.includes(option));
      })
    );
    if (sort === "price-asc") {
      items.sort(
        (a, b) =>
          getListingComparablePriceInArs(a, theme) -
          getListingComparablePriceInArs(b, theme)
      );
    }
    if (sort === "price-desc") {
      items.sort(
        (a, b) =>
          getListingComparablePriceInArs(b, theme) -
          getListingComparablePriceInArs(a, theme)
      );
    }
    return items;
  }, [attributeFilters, filterGroups, listings, minRooms, operation, query, sort, status, theme, type]);

  const activeFilterCount = [
    query.trim() ? 1 : 0,
    operation !== "all" ? 1 : 0,
    type !== "all" ? 1 : 0,
    status !== "all" ? 1 : 0,
    minRooms !== "all" ? 1 : 0,
    ...Object.values(attributeFilters).map((items) => items.length),
  ].reduce((acc, value) => acc + value, 0);

  const clearFilters = () => {
    setQuery("");
    setOperation("all");
    setType("all");
    setStatus("all");
    setMinRooms("all");
    setAttributeFilters({});
    setSort("featured");
  };

  const filterContent = (
    <div className="space-y-8">
      <div className="lg:hidden">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">
          Buscar
        </label>
        <div className="mt-3 flex items-center rounded-2xl bg-surface-container px-4 py-3 ghost-border">
          <span className="material-symbols-outlined mr-2 text-on-surface-variant">
            search
          </span>
          <input
            className="min-w-0 flex-1 border-none bg-transparent text-sm font-label focus:outline-none"
            placeholder="Barrio o propiedad"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">
          Operación
        </label>
        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3 lg:grid-cols-1">
          {[
            ["all", "Todas"],
            ["venta", "Comprar"],
            ["alquiler", "Alquilar"],
          ].map(([id, label]) => {
            const isActive = operation === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setOperation(id as OperationFilter)}
                className={`min-h-12 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  isActive
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-highest text-primary"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">
          Tipo de Propiedad
        </label>
        <div className="grid gap-2">
          {typeFilters.map((filter) => {
            const isActive = type === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setType(filter.id)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-outline-variant/25 bg-surface-container-lowest text-on-surface-variant hover:border-primary/50 hover:text-primary"
                }`}
              >
                <span className="font-label">
                  {filter.label}
                </span>
                {isActive ? (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">
          Estado
        </label>
        <div className="grid gap-2">
          {statusFilters.map((filter) => {
            const isActive = status === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setStatus(filter.id)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-outline-variant/25 bg-surface-container-lowest text-on-surface-variant hover:border-primary/50 hover:text-primary"
                }`}
              >
                <span className="font-label">
                  {filter.label}
                </span>
                {isActive ? (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">
          Dormitorios
        </label>
        <div className="flex flex-wrap gap-2">
          {["all", "1", "2", "3", "4"].map((value) => {
            const label = value === "all" ? "Todos" : `${value}+`;
            const active = minRooms === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setMinRooms(value)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold font-label ${
                  active
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-highest text-primary"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {filterGroups.map((group) => (
        <div key={group.id} className="space-y-4">
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">
            {group.label}
          </label>
          <div className="flex flex-wrap gap-2">
            {group.options.map((option) => {
              const isActive = (attributeFilters[group.id] ?? []).includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setAttributeFilters((prev) =>
                      toggleAttributeSelection(group, option, prev)
                    )
                  }
                  className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                    isActive
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant hover:border-primary/60 hover:text-primary"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <button
        className="w-full rounded-2xl bg-surface-container-highest py-4 text-sm font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-on-primary"
        type="button"
        onClick={clearFilters}
      >
        Limpiar Filtros
      </button>
    </div>
  );

  return (
    <div
      style={themeStyles}
      className="font-body selection:bg-primary-fixed selection:text-primary"
    >
      <FrontHeader
        active="catalog"
        showSearch
        searchValue={query}
        onSearchChange={setQuery}
      />

      <main className="mx-auto min-h-screen max-w-screen-2xl px-4 pb-16 pt-24 sm:px-6 lg:px-8 lg:pb-20 lg:pt-28">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          <aside className="hidden w-full flex-shrink-0 lg:block lg:w-80">
            <div className="sticky top-28 rounded-3xl bg-surface-container-lowest p-5 shadow-[0_30px_60px_-36px_rgba(27,54,93,0.32)]">
                <h3 className="mb-6 text-lg font-headline font-bold text-primary">
                Filtrar propiedades
              </h3>
              {filterContent}
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-6 flex flex-col justify-between gap-5 sm:mb-10 sm:flex-row sm:items-end">
              <div>
                <h1 className="text-3xl font-headline font-extrabold tracking-tight text-primary sm:text-4xl">
                  Propiedades Disponibles
                </h1>
                <p className="mt-2 font-label text-on-surface-variant">
                  Mostrando {filteredListings.length} propiedades en catálogo
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:space-x-4">
                <button
                  type="button"
                  onClick={() => setShowFilters(true)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-primary lg:hidden"
                >
                  <span className="material-symbols-outlined text-base">tune</span>
                  Filtros
                  {activeFilterCount ? (
                    <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-[10px] text-primary">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </button>
                <span className="hidden text-xs font-bold uppercase tracking-widest text-on-surface-variant sm:block">
                  Ordenar por:
                </span>
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className="ghost-border w-full cursor-pointer appearance-none rounded-2xl bg-surface-container-lowest px-4 py-3 pr-10 text-sm font-semibold text-primary focus:border-primary focus:ring-primary sm:w-auto sm:px-6 sm:py-2.5 sm:pr-12"
                  >
                    <option value="featured">Recomendadas</option>
                    <option value="price-desc">Precio: Mayor a Menor</option>
                    <option value="price-asc">Precio: Menor a Mayor</option>
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-primary">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {filteredListings.length === 0 ? (
              <div className="rounded-2xl bg-surface-container-lowest p-8 text-center editorial-shadow">
                <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                  Sin resultados
                </p>
                <h3 className="mt-3 text-2xl font-headline font-semibold text-primary">
                  No hay propiedades con esos filtros
                </h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-10">
                {filteredListings.map((item) => {
                  const cover = getCoverImage(item.images, item.coverIndex);
                  const video = item.videos?.[0];
                  const availability = getAvailability(item.status);
                  return (
                    <Link
                      key={item.id}
                      href={`/propiedades/${item.id}`}
                      className="group relative block overflow-hidden rounded-3xl bg-surface-container-lowest editorial-shadow transition-transform duration-500 hover:-translate-y-2"
                    >
                      <div className="relative h-64 overflow-hidden sm:h-80">
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
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-surface-container-low to-secondary/20" />
                        )}
                        <div className="absolute left-4 top-4 flex gap-2 sm:left-6 sm:top-6">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm ${availability.badgeClassName}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${availability.dotClassName}`} />
                            {availability.label}
                          </span>
                        </div>
                        <span className="absolute inset-x-4 bottom-4 rounded-2xl bg-surface-container-lowest/95 py-3 text-center text-sm font-bold text-primary shadow-[0_20px_40px_-30px_rgba(27,54,93,0.45)] sm:inset-x-6 sm:bottom-6 lg:hidden lg:group-hover:block">
                          Ver ficha completa
                        </span>
                      </div>
                      <div className="space-y-4 p-5 sm:p-6">
                        <div className="flex items-center justify-between text-xs uppercase tracking-widest text-on-surface-variant">
                          <span>{item.neighborhood}</span>
                          <span>{propertyTypeLabels[item.type]}</span>
                        </div>
                        <h3 className="text-xl font-headline font-bold text-primary">
                          {item.title}
                        </h3>
                        <p className="text-sm text-on-surface-variant">
                          {item.rooms} ambientes · {item.area} m²
                        </p>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-lg font-semibold text-primary">
                            {formatPrice(item.price, item.priceUnit, item.currency)}
                          </span>
                          <span className="text-sm font-semibold text-primary group-hover:text-primary-container">
                            Ver ficha →
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div
          className={`fixed inset-0 z-[60] bg-primary/45 backdrop-blur-md transition-opacity duration-300 lg:hidden ${
            showFilters ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <div className="absolute inset-0" onClick={() => setShowFilters(false)} />
          <div
            className={`absolute inset-x-3 bottom-3 max-h-[calc(100dvh-24px)] overflow-hidden rounded-[2rem] bg-surface-container-lowest shadow-[0_40px_80px_-28px_rgba(27,54,93,0.55)] transition-all duration-300 ${
              showFilters ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-on-surface-variant">
                  Catálogo
                </p>
                <h2 className="text-xl font-headline font-bold text-primary">
                  Filtros
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low text-primary"
                aria-label="Cerrar filtros"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="max-h-[calc(100dvh-170px)] overflow-y-auto px-5 py-5">
              {filterContent}
            </div>
            <div className="border-t border-outline-variant/20 p-4">
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="w-full rounded-2xl bg-primary py-4 text-sm font-bold uppercase tracking-widest text-on-primary"
              >
                Ver {filteredListings.length} resultados
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
