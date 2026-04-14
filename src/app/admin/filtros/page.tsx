"use client";

import { useMemo, useState, type FormEvent } from "react";
import AdminShell from "@/components/inmo/admin/AdminShell";
import { createId, slugify } from "@/lib/adminForms";
import type { FilterMode } from "@/lib/inmoData";
import { useInmoStore } from "@/lib/inmoStore";

export default function AdminFiltersPage() {
  const { state, updateState } = useInmoStore();
  const { filterGroups, listings } = state;

  const [groupLabel, setGroupLabel] = useState("");
  const [groupMode, setGroupMode] = useState<FilterMode>("multi");
  const [optionDrafts, setOptionDrafts] = useState<Record<string, string>>({});

  const optionUsage = useMemo(() => {
    const usage: Record<string, number> = {};
    listings.forEach((listing) => {
      Object.entries(listing.attributes).forEach(([groupId, values]) => {
        values.forEach((value) => {
          usage[`${groupId}::${value}`] = (usage[`${groupId}::${value}`] ?? 0) + 1;
        });
      });
    });
    return usage;
  }, [listings]);

  const handleGroupCreate = (event: FormEvent) => {
    event.preventDefault();
    const label = groupLabel.trim();
    if (!label) return;

    const baseId = slugify(label) || createId();
    let id = baseId;
    let counter = 2;
    while (filterGroups.some((group) => group.id === id)) {
      id = `${baseId}-${counter++}`;
    }

    updateState((prev) => ({
      ...prev,
      filterGroups: [...prev.filterGroups, { id, label, options: [], mode: groupMode }],
    }));

    setGroupLabel("");
    setGroupMode("multi");
  };

  const handleGroupRemove = (groupId: string) => {
    updateState((prev) => ({
      ...prev,
      filterGroups: prev.filterGroups.filter((group) => group.id !== groupId),
      listings: prev.listings.map((listing) => {
        const attributes = { ...listing.attributes };
        delete attributes[groupId];
        return { ...listing, attributes };
      }),
    }));
  };

  const handleOptionAdd = (groupId: string) => {
    const value = (optionDrafts[groupId] ?? "").trim();
    if (!value) return;

    updateState((prev) => ({
      ...prev,
      filterGroups: prev.filterGroups.map((group) => {
        if (group.id !== groupId) return group;
        if (group.options.includes(value)) return group;
        return { ...group, options: [...group.options, value] };
      }),
    }));

    setOptionDrafts((prev) => ({ ...prev, [groupId]: "" }));
  };

  const handleOptionRemove = (groupId: string, option: string) => {
    updateState((prev) => ({
      ...prev,
      filterGroups: prev.filterGroups.map((group) =>
        group.id === groupId
          ? { ...group, options: group.options.filter((item) => item !== option) }
          : group
      ),
      listings: prev.listings.map((listing) => {
        const selected = listing.attributes[groupId] ?? [];
        if (!selected.includes(option)) return listing;
        return {
          ...listing,
          attributes: {
            ...listing.attributes,
            [groupId]: selected.filter((item) => item !== option),
          },
        };
      }),
    }));
  };

  return (
    <AdminShell
      activeSection="filtros"
      title="Atributos y Filtros"
      primaryAction={{ href: "#form-grupo", label: "Nuevo grupo" }}
    >
      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Grupos creados</p>
          <p className="mt-2 text-3xl font-bold text-primary">{filterGroups.length}</p>
        </div>
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Opciones totales</p>
          <p className="mt-2 text-3xl font-bold text-primary">
            {filterGroups.reduce((acc, group) => acc + group.options.length, 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Inventario impactado</p>
          <p className="mt-2 text-3xl font-bold text-primary">{listings.length}</p>
        </div>
      </section>

      <section
        id="form-grupo"
        className="mt-8 rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)]"
      >
        <h3 className="text-xl font-headline font-bold text-primary">Nuevo grupo de filtros</h3>
        <p className="mt-2 text-xs text-on-surface-variant">
          Definí categorías para filtrar propiedades en el front de forma dinámica.
        </p>

        <form className="mt-6 grid gap-3 sm:max-w-xl" onSubmit={handleGroupCreate}>
          <input
            className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
            placeholder="Nombre del grupo"
            value={groupLabel}
            onChange={(event) => setGroupLabel(event.target.value)}
          />

          <select
            className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
            value={groupMode}
            onChange={(event) => setGroupMode(event.target.value as FilterMode)}
          >
            <option value="multi">Selección múltiple</option>
            <option value="single">Selección única</option>
          </select>

          <button
            type="submit"
            className="rounded-full bg-primary px-5 py-3 text-xs font-semibold uppercase tracking-widest text-on-primary w-fit"
          >
            Crear grupo
          </button>
        </form>
      </section>

      <section className="mt-8 rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)]">
        <h3 className="text-xl font-headline font-bold text-primary">Grupos disponibles</h3>
        <p className="mt-2 text-xs text-on-surface-variant">
          Administrá opciones por grupo para usarlas en catálogo y ficha de propiedades.
        </p>

        <div className="mt-6 grid gap-4">
          {filterGroups.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No hay grupos cargados aún.</p>
          ) : (
            filterGroups.map((group) => (
              <article
                key={group.id}
                className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-primary">{group.label}</p>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                      {group.mode === "single" ? "Selección única" : "Selección múltiple"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGroupRemove(group.id)}
                    className="text-[10px] font-bold uppercase tracking-widest text-error"
                  >
                    Eliminar grupo
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {group.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleOptionRemove(group.id, option)}
                      className="rounded-full border border-outline-variant/40 px-3 py-1 text-[10px] uppercase tracking-widest text-primary"
                    >
                      {option} · {optionUsage[`${group.id}::${option}`] ?? 0} ×
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    className="flex-1 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs font-semibold text-on-surface focus:border-primary focus:outline-none"
                    placeholder="Nueva opción"
                    value={optionDrafts[group.id] ?? ""}
                    onChange={(event) =>
                      setOptionDrafts((prev) => ({
                        ...prev,
                        [group.id]: event.target.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => handleOptionAdd(group.id)}
                    className="rounded-full border border-primary px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary"
                  >
                    Agregar
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </AdminShell>
  );
}
