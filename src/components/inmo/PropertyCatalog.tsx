"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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

type PropertyCatalogProps = {
  showHero?: boolean;
};

type PropertyTypeFilter = "all" | PropertyType;
type PropertyStatusFilter = "all" | PropertyStatus;

const typeFilters: Array<{ id: PropertyTypeFilter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "tradicional", label: propertyTypeLabels.tradicional },
  { id: "temporario", label: propertyTypeLabels.temporario },
  { id: "pozo", label: propertyTypeLabels.pozo },
  { id: "listo", label: propertyTypeLabels.listo },
];

const statusFilters: Array<{ id: PropertyStatusFilter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "disponible", label: statusLabels.disponible },
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

export default function PropertyCatalog({ showHero = false }: PropertyCatalogProps) {
  const { state } = useInmoStore();
  const { listings, filterGroups, theme } = state;

  const [query, setQuery] = useState("");
  const [type, setType] = useState<PropertyTypeFilter>("all");
  const [status, setStatus] = useState<PropertyStatusFilter>("all");
  const [sort, setSort] = useState("featured");
  const [attributeFilters, setAttributeFilters] = useState<
    Record<string, string[]>
  >({});

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
  }, [attributeFilters, filterGroups, listings, query, sort, status, type]);

  const themeStyles = buildThemeStyles(theme);

  return (
    <div style={themeStyles} className="min-h-screen bg-background text-on-background">
      <FrontHeader active="catalog" />

      {showHero ? (
        <section className="pt-28">
          <div className="mx-auto grid w-full max-w-screen-2xl gap-10 px-8 pb-16 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.3em] text-on-surface-variant">
                Catálogo Editorial
              </p>
              <h1 className="text-4xl font-headline font-extrabold tracking-tight text-primary md:text-6xl">
                Curamos hogares con criterio editorial y datos en tiempo real.
              </h1>
              <p className="text-on-surface-variant text-lg">
                Descubrí propiedades verificadas, con fichas claras y filtros
                pensados para encontrar rápido lo que necesitás.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition hover:bg-primary-container"
                  href="/propiedades"
                >
                  Explorar catálogo
                </Link>
                <Link
                  className="rounded-lg border border-outline-variant/40 px-6 py-3 text-sm font-semibold text-primary hover:border-primary"
                  href="/acceso"
                >
                  Acceso clientes
                </Link>
              </div>
            </div>
            <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-[0_40px_60px_-20px_rgba(27,27,28,0.12)]">
              <div className="grid gap-4">
                <div className="flex items-center justify-between text-sm font-semibold text-on-surface-variant">
                  <span>Propiedades disponibles</span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                    {listings.length} propiedades
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-surface-container-low p-4">
                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                      Disponibles
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-primary">
                      {listings.filter((item) => item.status === "disponible").length}
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface-container-low p-4">
                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                      Reservados
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-primary">
                      {listings.filter((item) => item.status === "reservado").length}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl bg-surface-container-low p-4">
                  <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                    Valor promedio
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-primary">
                    {listings.length
                      ? currencyFormatter.format(
                          listings.reduce((acc, item) => acc + item.price, 0) /
                            listings.length
                        )
                      : "$0"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="pt-24" />
      )}

      <section className="mx-auto w-full max-w-screen-2xl px-8 pb-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-on-surface-variant">
              Resultados
            </p>
            <h2 className="text-3xl font-headline font-bold text-primary">
              Encontrá propiedades a tu medida
            </h2>
            <p className="text-on-surface-variant">
              Filtrá por tipo, estado y características de cada propiedad.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            {typeFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setType(filter.id)}
                className={`rounded-full border px-4 py-2 text-xs uppercase tracking-widest transition ${
                  type === filter.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-outline-variant/40 text-on-surface-variant hover:border-primary"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 rounded-2xl bg-surface-container-lowest p-6 shadow-[0_30px_50px_-30px_rgba(27,27,28,0.3)] lg:grid-cols-5">
          <label className="flex flex-col gap-2 text-xs uppercase tracking-widest text-on-surface-variant">
            Buscar
            <input
              className="rounded-lg border border-outline-variant/30 bg-transparent px-3 py-2 text-sm font-semibold text-on-background placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none"
              placeholder="Barrio o título"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2 text-xs uppercase tracking-widest text-on-surface-variant">
            Estado
            <select
              className="rounded-lg border border-outline-variant/30 bg-transparent px-3 py-2 text-sm font-semibold text-on-background focus:border-primary focus:outline-none"
              value={status}
              onChange={(event) => setStatus(event.target.value as PropertyStatusFilter)}
            >
              {statusFilters.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs uppercase tracking-widest text-on-surface-variant">
            Orden
            <select
              className="rounded-lg border border-outline-variant/30 bg-transparent px-3 py-2 text-sm font-semibold text-on-background focus:border-primary focus:outline-none"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="featured">Destacados</option>
              <option value="price-asc">Precio menor</option>
              <option value="price-desc">Precio mayor</option>
            </select>
          </label>
          <div className="lg:col-span-2 flex flex-wrap gap-2">
            {filterGroups.map((group) => (
              <div key={group.id} className="flex flex-wrap gap-2">
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
                      className={`rounded-full border px-3 py-2 text-[11px] uppercase tracking-widest transition ${
                        isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-outline-variant/30 text-on-surface-variant hover:border-primary"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-surface-container-lowest p-8 text-center shadow-[0_30px_50px_-30px_rgba(27,27,28,0.3)]">
            <p className="text-xs uppercase tracking-[0.3em] text-on-surface-variant">
              Catálogo vacío
            </p>
            <h3 className="mt-3 text-2xl font-headline font-semibold text-primary">
              Todavía no hay propiedades cargadas
            </h3>
            <p className="mt-2 text-on-surface-variant">
              Pronto vas a ver nuevas propiedades publicadas.
            </p>
            <Link
              className="mt-6 inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-on-primary"
              href="/acceso"
            >
              Acceso clientes
            </Link>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-surface-container-lowest p-8 text-center shadow-[0_30px_50px_-30px_rgba(27,27,28,0.3)]">
            <p className="text-xs uppercase tracking-[0.3em] text-on-surface-variant">
              Sin resultados
            </p>
            <h3 className="mt-3 text-2xl font-headline font-semibold text-primary">
              No hay propiedades con esos filtros
            </h3>
            <p className="mt-2 text-on-surface-variant">
              Ajustá los filtros o limpiá atributos para ver resultados.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((item) => {
              const cover = getCoverImage(item.images, item.coverIndex);
              return (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_40px_60px_-25px_rgba(27,27,28,0.2)] transition hover:-translate-y-1"
                >
                  <div className="relative h-56 overflow-hidden bg-surface-container-high">
                    {cover ? (
                      <img
                        src={cover}
                        alt={item.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/20 via-surface-container-low to-secondary/20" />
                    )}
                    <span className="absolute left-4 top-4 rounded-full bg-surface-container-lowest/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
                      {statusLabels[item.status]}
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between text-xs uppercase tracking-widest text-on-surface-variant">
                      <span>{item.neighborhood}</span>
                      <span>{propertyTypeLabels[item.type]}</span>
                    </div>
                    <h3 className="mt-3 text-xl font-headline font-bold text-primary">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {item.rooms} ambientes · {item.area} m²
                    </p>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-lg font-semibold text-primary">
                        {formatPrice(item.price, item.priceUnit)}
                      </span>
                      <Link
                        className="text-sm font-semibold text-primary hover:text-primary-container"
                        href={`/propiedades/${item.id}`}
                      >
                        Ver ficha →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
