"use client";

import FrontHeader from "@/components/inmo/FrontHeader";
import { useInmoStore } from "@/lib/inmoStore";
import { buildThemeStyles } from "@/lib/theme";

export default function BarriosPage() {
  const { state } = useInmoStore();
  const { listings, theme } = state;
  const themeStyles = buildThemeStyles(theme);

  const topNeighborhoods = (() => {
    const counter = new Map<string, number>();
    listings.forEach((item) => {
      if (!item.neighborhood) return;
      counter.set(item.neighborhood, (counter.get(item.neighborhood) ?? 0) + 1);
    });
    return [...counter.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  })();

  return (
    <div style={themeStyles} className="min-h-screen bg-background text-on-background">
      <FrontHeader active="detail" />
      <main className="mx-auto max-w-screen-2xl px-6 pt-24 lg:px-8">
        <section className="rounded-3xl bg-surface-container-lowest p-10 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.08)]">
          <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">
            Barrios
          </p>
          <h1 className="mt-4 text-3xl font-headline font-extrabold text-primary">
            Zonas más consultadas
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Barrios con mayor presencia en el inventario activo.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topNeighborhoods.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                Todavía no hay barrios registrados.
              </p>
            ) : (
              topNeighborhoods.map((zone) => (
                <div
                  key={zone.name}
                  className="flex items-center justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4"
                >
                  <span className="text-sm font-semibold text-primary">{zone.name}</span>
                  <span className="text-xs uppercase tracking-widest text-on-surface-variant">
                    {zone.count} propiedades
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
