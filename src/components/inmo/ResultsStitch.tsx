"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useInmoStore } from "@/lib/inmoStore";
import {
  propertyTypeLabels,
  statusLabels,
  type FilterGroup,
  type PropertyType,
  type PropertyStatus,
} from "@/lib/inmoData";
import { buildThemeStyles } from "@/lib/theme";
import FrontHeader from "@/components/inmo/FrontHeader";

type PropertyTypeFilter = "all" | PropertyType;
type PropertyStatusFilter = "all" | PropertyStatus;

const typeFilters: Array<{ id: PropertyTypeFilter; label: string }> = [
  { id: "all", label: "Todas" },
  { id: "tradicional", label: propertyTypeLabels.tradicional },
  { id: "temporario", label: propertyTypeLabels.temporario },
  { id: "pozo", label: propertyTypeLabels.pozo },
  { id: "listo", label: propertyTypeLabels.listo },
];

const statusFilters: Array<{ id: PropertyStatusFilter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "disponible", label: statusLabels.disponible },
  { id: "pausado", label: statusLabels.pausado },
  { id: "reservado", label: statusLabels.reservado },
  { id: "vendido", label: statusLabels.vendido },
];

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const formatPrice = (price: number, priceUnit: string) => {
  const base = currencyFormatter.format(price);
  if (priceUnit === "noche") return `${base} / noche`;
  if (priceUnit === "mensual") return `${base} / mes`;
  return base;
};

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
  const [minRooms, setMinRooms] = useState("all");
  const [sort, setSort] = useState("featured");
  const [attributeFilters, setAttributeFilters] = useState<
    Record<string, string[]>
  >({});

  const themeStyles = buildThemeStyles(theme);

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
    if (status !== "all") {
      items = items.filter((item) => item.status === status);
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
      items.sort((a, b) => a.price - b.price);
    }
    if (sort === "price-desc") {
      items.sort((a, b) => b.price - a.price);
    }
    return items;
  }, [attributeFilters, filterGroups, listings, minRooms, query, sort, status, type]);

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

      <main className="mx-auto min-h-screen max-w-screen-2xl px-8 pb-20 pt-28">
        <div className="flex flex-col gap-12 lg:flex-row">
          <aside className="w-full flex-shrink-0 lg:w-72">
            <div className="sticky top-28 space-y-10">
              <div>
                <h3 className="mb-6 text-lg font-headline font-bold text-primary">
                  Refinar Selección
                </h3>

                <div className="mb-8 space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">
                    Tipo de Propiedad
                  </label>
                  <div className="space-y-3">
                    {typeFilters.map((filter) => {
                      const isActive = type === filter.id;
                      return (
                        <button
                          key={filter.id}
                          type="button"
                          onClick={() => setType(filter.id)}
                          className="flex w-full items-center text-left"
                        >
                          <div
                            className={`mr-3 flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                              isActive
                                ? "border-primary bg-primary"
                                : "border-outline-variant"
                            }`}
                          >
                            <span
                              className={`material-symbols-outlined text-[14px] ${
                                isActive ? "text-on-primary" : "text-primary hidden"
                              }`}
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              check
                            </span>
                          </div>
                          <span
                            className={`text-sm font-label transition-colors ${
                              isActive ? "text-primary font-medium" : "text-on-surface-variant"
                            }`}
                          >
                            {filter.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-8 space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">
                    Estado
                  </label>
                  <div className="space-y-3">
                    {statusFilters.map((filter) => {
                      const isActive = status === filter.id;
                      return (
                        <button
                          key={filter.id}
                          type="button"
                          onClick={() => setStatus(filter.id)}
                          className="flex w-full items-center text-left"
                        >
                          <div
                            className={`mr-3 flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                              isActive
                                ? "border-primary bg-primary"
                                : "border-outline-variant"
                            }`}
                          >
                            <span
                              className={`material-symbols-outlined text-[14px] ${
                                isActive ? "text-on-primary" : "text-primary hidden"
                              }`}
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              check
                            </span>
                          </div>
                          <span
                            className={`text-sm font-label transition-colors ${
                              isActive ? "text-primary font-medium" : "text-on-surface-variant"
                            }`}
                          >
                            {filter.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-8 space-y-4">
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
                          className={`rounded-lg px-4 py-2 text-xs font-semibold font-label ${
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
                  <div key={group.id} className="mb-8 space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">
                      {group.label}
                    </label>
                    <div className="space-y-3">
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
                            className="flex w-full items-center text-left"
                          >
                            <div
                              className={`mr-3 flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                                isActive
                                  ? "border-primary bg-primary"
                                  : "border-outline-variant"
                              }`}
                            >
                              <span
                                className={`material-symbols-outlined text-[14px] ${
                                  isActive ? "text-on-primary" : "text-primary hidden"
                                }`}
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                check
                              </span>
                            </div>
                            <span className="text-sm font-label text-on-surface-variant">
                              {option}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="w-full rounded-xl bg-surface-container-highest py-4 text-sm font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-on-primary"
                type="button"
                onClick={() => {
                  setQuery("");
                  setType("all");
                  setStatus("all");
                  setMinRooms("all");
                  setAttributeFilters({});
                  setSort("featured");
                }}
              >
                Limpiar Filtros
              </button>
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <h1 className="text-4xl font-headline font-extrabold tracking-tight text-primary">
                  Propiedades Disponibles
                </h1>
                <p className="mt-2 font-label text-on-surface-variant">
                  Mostrando {filteredListings.length} propiedades en catálogo
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Ordenar por:
                </span>
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className="ghost-border cursor-pointer appearance-none rounded-lg bg-surface-container-lowest px-6 py-2.5 pr-12 text-sm font-semibold text-primary focus:border-primary focus:ring-primary"
                  >
                    <option value="featured">Selección Curada</option>
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
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-10">
                {filteredListings.map((item) => {
                  const cover = getCoverImage(item.images, item.coverIndex);
                  const video = item.videos?.[0];
                  return (
                    <div
                      key={item.id}
                      className="group relative overflow-hidden rounded-2xl bg-surface-container-lowest editorial-shadow transition-transform duration-500 hover:-translate-y-2"
                    >
                      <div className="relative h-80 overflow-hidden">
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
                        <div className="absolute left-6 top-6 flex gap-2">
                          <span className="rounded-full bg-surface-container-lowest/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                            {statusLabels[item.status]}
                          </span>
                        </div>
                        <Link
                          href={`/propiedades/${item.id}`}
                          className="absolute inset-x-6 bottom-6 hidden rounded-lg bg-surface-container-lowest py-3 text-center text-sm font-bold text-primary group-hover:block"
                        >
                          Ver ficha completa
                        </Link>
                      </div>
                      <div className="space-y-4 p-6">
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
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold text-primary">
                            {formatPrice(item.price, item.priceUnit)}
                          </span>
                          <Link
                            href={`/propiedades/${item.id}`}
                            className="text-sm font-semibold text-primary hover:text-primary-container"
                          >
                            Ver ficha →
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
