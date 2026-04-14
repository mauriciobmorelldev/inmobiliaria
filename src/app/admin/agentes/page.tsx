"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import AdminShell from "@/components/inmo/admin/AdminShell";
import {
  createId,
  getEmptyAgentForm,
  readFileAsDataUrl,
  validateAgentForm,
  type AgentFormState,
} from "@/lib/adminForms";
import { useInmoStore } from "@/lib/inmoStore";

export default function AdminAgentsPage() {
  const { state, updateState } = useInmoStore();
  const { agents, listings } = state;

  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [agentForm, setAgentForm] = useState<AgentFormState>(getEmptyAgentForm());
  const [formError, setFormError] = useState("");
  const [highlightForm, setHighlightForm] = useState(false);

  useEffect(() => {
    if (!highlightForm) return;
    const timeout = window.setTimeout(() => setHighlightForm(false), 1400);
    return () => window.clearTimeout(timeout);
  }, [highlightForm]);

  const assignedCount = useMemo(() => {
    const counter: Record<string, number> = {};
    listings.forEach((listing) => {
      if (!listing.agentId) return;
      counter[listing.agentId] = (counter[listing.agentId] ?? 0) + 1;
    });
    return counter;
  }, [listings]);

  const handleAgentSubmit = (event: FormEvent) => {
    event.preventDefault();
    const errors = validateAgentForm(agentForm);
    if (errors.length) {
      setFormError(errors[0]);
      return;
    }

    if (editingAgentId) {
      updateState((prev) => ({
        ...prev,
        agents: prev.agents.map((agent) =>
          agent.id === editingAgentId
            ? { ...agent, ...agentForm, name: agentForm.name.trim() }
            : agent
        ),
      }));
    } else {
      updateState((prev) => ({
        ...prev,
        agents: [
          ...prev.agents,
          {
            id: createId(),
            name: agentForm.name.trim(),
            role: agentForm.role.trim(),
            phone: agentForm.phone.trim(),
            email: agentForm.email.trim(),
            photo: agentForm.photo,
          },
        ],
      }));
    }

    setAgentForm(getEmptyAgentForm());
    setEditingAgentId(null);
    setFormError("");
  };

  const handleAgentEdit = (agentId: string) => {
    const target = agents.find((agent) => agent.id === agentId);
    if (!target) return;

    setEditingAgentId(target.id);
    setAgentForm({
      name: target.name,
      role: target.role,
      phone: target.phone,
      email: target.email,
      photo: target.photo,
    });
    setHighlightForm(true);
    document
      .getElementById("form-agente")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAgentDelete = (agentId: string) => {
    updateState((prev) => ({
      ...prev,
      agents: prev.agents.filter((agent) => agent.id !== agentId),
      listings: prev.listings.map((listing) =>
        listing.agentId === agentId ? { ...listing, agentId: undefined } : listing
      ),
    }));
  };

  return (
    <AdminShell
      activeSection="agentes"
      title="Equipo de Corredores"
      primaryAction={{ href: "#form-agente", label: "Nuevo agente" }}
    >
      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Agentes activos</p>
          <p className="mt-2 text-3xl font-bold text-primary">{agents.length}</p>
        </div>
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Propiedades asignadas</p>
          <p className="mt-2 text-3xl font-bold text-primary">
            {listings.filter((item) => Boolean(item.agentId)).length}
          </p>
        </div>
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Sin corredor</p>
          <p className="mt-2 text-3xl font-bold text-primary">
            {listings.filter((item) => !item.agentId).length}
          </p>
        </div>
      </section>

      <section
        id="form-agente"
        className={`mt-8 rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)] ${
          highlightForm ? "inmo-edit-highlight" : ""
        }`}
      >
        <h3 className="text-xl font-headline font-bold text-primary">
          {editingAgentId ? "Editar agente" : "Nuevo agente"}
        </h3>
        <p className="mt-2 text-xs text-on-surface-variant">
          Cargá al corredor para poder asignarlo a propiedades y habilitar contacto por WhatsApp.
        </p>

        <form className="mt-6 grid gap-3" onSubmit={handleAgentSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              placeholder="Nombre"
              value={agentForm.name}
              onChange={(event) =>
                setAgentForm((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
              required
            />
            <input
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              placeholder="Rol"
              value={agentForm.role}
              onChange={(event) =>
                setAgentForm((prev) => ({
                  ...prev,
                  role: event.target.value,
                }))
              }
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              placeholder="Teléfono"
              value={agentForm.phone}
              onChange={(event) =>
                setAgentForm((prev) => ({
                  ...prev,
                  phone: event.target.value,
                }))
              }
              required
            />
            <input
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              placeholder="Email"
              value={agentForm.email}
              onChange={(event) =>
                setAgentForm((prev) => ({
                  ...prev,
                  email: event.target.value,
                }))
              }
              required
            />
          </div>

          <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
            Foto
            <input
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const url = await readFileAsDataUrl(file);
                setAgentForm((prev) => ({ ...prev, photo: url }));
              }}
              className="text-sm"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            {formError ? <p className="text-sm text-error">{formError}</p> : null}
            <button
              type="submit"
              className="rounded-full bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-widest text-on-primary"
            >
              {editingAgentId ? "Guardar cambios" : "Agregar agente"}
            </button>
            {editingAgentId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingAgentId(null);
                  setAgentForm(getEmptyAgentForm());
                }}
                className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant"
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="mt-8 rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)]">
        <h3 className="text-xl font-headline font-bold text-primary">Equipo cargado</h3>
        <p className="mt-2 text-xs text-on-surface-variant">Gestioná disponibilidad y contactos de tu equipo comercial.</p>

        <div className="mt-6 grid gap-3">
          {agents.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Todavía no hay corredores cargados.</p>
          ) : (
            agents.map((agent) => (
              <article
                key={agent.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4"
              >
                <div className="flex items-center gap-3">
                  {agent.photo ? (
                    <img src={agent.photo} alt={agent.name} className="h-11 w-11 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-high text-primary font-semibold">
                      {agent.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-primary">{agent.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                      {agent.role || "Agente"}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-1">{agent.phone || "Sin teléfono"}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                    Propiedades asignadas
                  </p>
                  <p className="text-sm font-semibold text-primary">{assignedCount[agent.id] ?? 0}</p>
                </div>

                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest">
                  <button
                    type="button"
                    onClick={() => handleAgentEdit(agent.id)}
                    className="text-primary"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAgentDelete(agent.id)}
                    className="text-error"
                  >
                    Eliminar
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
