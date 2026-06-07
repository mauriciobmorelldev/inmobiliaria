"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import AdminShell from "@/components/inmo/admin/AdminShell";
import {
  createId,
  getEmptyLeadForm,
  validateLeadForm,
  type LeadFormState,
} from "@/lib/adminForms";
import { useInmoStore } from "@/lib/inmoStore";
import { readAdminSession } from "@/lib/session";

const statusLabels = {
  nuevo: "Nuevo",
  visita: "Visita coordinada",
  reservado: "Reservado",
  cerrado: "Cerrado",
};

export default function AdminLeadsPage() {
  const { state, updateState } = useInmoStore();
  const { leads, listings, agents, adminUsers } = state;
  const [adminSession] = useState(() => readAdminSession());
  const authedAdmin = adminUsers.find((admin) => admin.id === adminSession?.adminId);
  const scopedAgent = agents.find(
    (agent) =>
      authedAdmin?.role !== "owner" &&
      agent.email.trim().toLowerCase() === authedAdmin?.email.trim().toLowerCase()
  );
  const visibleLeads =
    authedAdmin?.role === "owner"
      ? leads
      : leads.filter((lead) => lead.agentId === scopedAgent?.id);
  const visibleListings =
    authedAdmin?.role === "owner"
      ? listings
      : listings.filter((listing) => listing.agentId === scopedAgent?.id);
  const assignableAgents =
    authedAdmin?.role === "owner" ? agents : scopedAgent ? [scopedAgent] : [];

  const [leadForm, setLeadForm] = useState<LeadFormState>(getEmptyLeadForm());
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [highlightForm, setHighlightForm] = useState(false);

  useEffect(() => {
    if (!highlightForm) return;
    const timeout = window.setTimeout(() => setHighlightForm(false), 1400);
    return () => window.clearTimeout(timeout);
  }, [highlightForm]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    const errors = validateLeadForm(leadForm);
    if (errors.length) {
      setFormError(errors[0]);
      return;
    }

    const now = new Date().toISOString();
    updateState((prev) => {
      if (editingLeadId) {
        return {
          ...prev,
          leads: prev.leads.map((lead) =>
            lead.id === editingLeadId
              ? {
                  ...lead,
                  name: leadForm.name.trim(),
                  email: leadForm.email.trim(),
                  phone: leadForm.phone.trim(),
                  propertyId: leadForm.propertyId || undefined,
                  agentId:
                    authedAdmin?.role === "owner"
                      ? leadForm.agentId || undefined
                      : scopedAgent?.id,
                  status: leadForm.status,
                  notes: leadForm.notes.trim(),
                  updatedAt: now,
                }
              : lead
          ),
        };
      }
      return {
        ...prev,
        leads: [
          ...prev.leads,
          {
            id: createId(),
            name: leadForm.name.trim(),
            email: leadForm.email.trim(),
            phone: leadForm.phone.trim(),
            propertyId: leadForm.propertyId || undefined,
            agentId:
              authedAdmin?.role === "owner"
                ? leadForm.agentId || undefined
                : scopedAgent?.id,
            status: leadForm.status,
            notes: leadForm.notes.trim(),
            createdAt: now,
            updatedAt: now,
          },
        ],
      };
    });

    setLeadForm(getEmptyLeadForm());
    setEditingLeadId(null);
  };

  const handleEdit = (leadId: string) => {
    const target = visibleLeads.find((lead) => lead.id === leadId);
    if (!target) return;
    setEditingLeadId(leadId);
    setLeadForm({
      name: target.name,
      email: target.email,
      phone: target.phone,
      propertyId: target.propertyId ?? "",
      agentId: target.agentId ?? "",
      status: target.status,
      notes: target.notes ?? "",
    });
    setHighlightForm(true);
    document.getElementById("form-lead")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDelete = (leadId: string) => {
    updateState((prev) => ({
      ...prev,
      leads: prev.leads.filter(
        (lead) =>
          lead.id !== leadId ||
          (authedAdmin?.role !== "owner" && lead.agentId !== scopedAgent?.id)
      ),
    }));
  };

  const summary = useMemo(
    () => ({
      nuevo: visibleLeads.filter((lead) => lead.status === "nuevo").length,
      visita: visibleLeads.filter((lead) => lead.status === "visita").length,
      reservado: visibleLeads.filter((lead) => lead.status === "reservado").length,
      cerrado: visibleLeads.filter((lead) => lead.status === "cerrado").length,
    }),
    [visibleLeads]
  );

  return (
    <AdminShell
      activeSection="leads"
      title="Leads"
      primaryAction={{ href: "#form-lead", label: "Nuevo lead" }}
    >
      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        {Object.entries(summary).map(([key, value]) => (
          <div
            key={key}
            className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4"
          >
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
              {statusLabels[key as keyof typeof statusLabels]}
            </p>
            <p className="mt-2 text-3xl font-bold text-primary">{value}</p>
          </div>
        ))}
      </section>

      <section
        id="form-lead"
        className={`mt-8 rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)] ${
          highlightForm ? "inmo-edit-highlight" : ""
        }`}
      >
        <h3 className="text-xl font-headline font-bold text-primary">
          {editingLeadId ? "Editar lead" : "Nuevo lead"}
        </h3>
        <p className="mt-2 text-xs text-on-surface-variant">
          Registrá consultas y avanzá el pipeline comercial.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              required
              value={leadForm.name}
              onChange={(event) =>
                setLeadForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Nombre"
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
            />
            <input
              required
              type="email"
              value={leadForm.email}
              onChange={(event) =>
                setLeadForm((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="Email"
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
            />
            <input
              required
              value={leadForm.phone}
              onChange={(event) =>
                setLeadForm((prev) => ({ ...prev, phone: event.target.value }))
              }
              placeholder="Teléfono"
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <select
              value={leadForm.propertyId}
              onChange={(event) =>
                setLeadForm((prev) => ({ ...prev, propertyId: event.target.value }))
              }
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
            >
              <option value="">Propiedad (opcional)</option>
              {visibleListings.map((listing) => (
                <option key={listing.id} value={listing.id}>
                  {listing.title}
                </option>
              ))}
            </select>
            <select
              value={leadForm.agentId}
              onChange={(event) =>
                setLeadForm((prev) => ({ ...prev, agentId: event.target.value }))
              }
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
            >
              <option value="">Corredor (opcional)</option>
              {assignableAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
            <select
              value={leadForm.status}
              onChange={(event) =>
                setLeadForm((prev) => ({
                  ...prev,
                  status: event.target.value as LeadFormState["status"],
                }))
              }
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
            >
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <textarea
            value={leadForm.notes}
            onChange={(event) =>
              setLeadForm((prev) => ({ ...prev, notes: event.target.value }))
            }
            placeholder="Notas"
            className="min-h-[90px] rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
          />

          {formError ? <p className="text-sm text-error">{formError}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-full bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-widest text-on-primary"
              style={{ color: "var(--color-on-primary)" }}
            >
              {editingLeadId ? "Guardar cambios" : "Crear lead"}
            </button>
          </div>
        </form>
      </section>

      <section className="mt-8 rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)]">
        <h3 className="text-xl font-headline font-bold text-primary">Pipeline comercial</h3>
        <p className="mt-2 text-xs text-on-surface-variant">
          Mové los leads entre etapas y eso actualizará el dashboard.
        </p>
        <div className="mt-6 grid gap-3">
          {visibleLeads.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No hay leads registrados.</p>
          ) : (
            visibleLeads.map((lead) => (
              <article
                key={lead.id}
                className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-primary">{lead.name}</p>
                    <p className="text-xs text-on-surface-variant">{lead.email}</p>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                      {statusLabels[lead.status]}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest">
                    {(["nuevo", "visita", "reservado", "cerrado"] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() =>
                          updateState((prev) => ({
                            ...prev,
                            leads: prev.leads.map((item) =>
                              item.id === lead.id
                                ? {
                                    ...item,
                                    status,
                                    updatedAt: new Date().toISOString(),
                                  }
                                : item
                            ),
                          }))
                        }
                        className={`rounded-full border px-3 py-1 text-[10px] ${
                          lead.status === status
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-outline-variant/40 text-on-surface-variant"
                        }`}
                      >
                        {statusLabels[status]}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleEdit(lead.id)}
                      className="text-primary"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(lead.id)}
                      className="text-error"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </AdminShell>
  );
}
