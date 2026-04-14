"use client";

import FrontHeader from "@/components/inmo/FrontHeader";
import { useInmoStore } from "@/lib/inmoStore";
import { buildThemeStyles } from "@/lib/theme";

export default function EquipoPage() {
  const { state } = useInmoStore();
  const { agents, theme } = state;
  const themeStyles = buildThemeStyles(theme);

  return (
    <div style={themeStyles} className="min-h-screen bg-background text-on-background">
      <FrontHeader active="detail" />
      <main className="mx-auto max-w-screen-2xl px-6 pt-24 lg:px-8">
        <section className="rounded-3xl bg-surface-container-lowest p-10 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.08)]">
          <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">
            Equipo
          </p>
          <h1 className="mt-4 text-3xl font-headline font-extrabold text-primary">
            Corredores y especialistas
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Equipo comercial disponible para ayudarte a encontrar la propiedad ideal.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agents.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                Todavía no hay agentes cargados.
              </p>
            ) : (
              agents.map((agent) => (
                <article
                  key={agent.id}
                  className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5"
                >
                  <div className="flex items-center gap-3">
                    {agent.photo ? (
                      <img
                        src={agent.photo}
                        alt={agent.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high text-primary font-semibold">
                        {agent.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-primary">{agent.name}</p>
                      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                        {agent.role || "Corredor"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-on-surface-variant">
                    <p>{agent.phone || "Teléfono pendiente"}</p>
                    <p>{agent.email || "Email pendiente"}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
