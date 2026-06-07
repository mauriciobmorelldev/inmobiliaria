"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import AdminShell from "@/components/inmo/admin/AdminShell";
import {
  createId,
  getEmptyClientForm,
  normalizeIdNumber,
  normalizePhone,
  validateClientUserForm,
  type ClientUserFormState,
} from "@/lib/adminForms";
import { useInmoStore } from "@/lib/inmoStore";

export default function AdminClientesPage() {
  const { state, updateState } = useInmoStore();
  const { clientUsers, propertyFavorites, leads, listings } = state;

  const [clientForm, setClientForm] = useState<ClientUserFormState>(getEmptyClientForm());
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [clientError, setClientError] = useState("");
  const [highlightForm, setHighlightForm] = useState(false);

  useEffect(() => {
    if (!highlightForm) return;
    const timeout = window.setTimeout(() => setHighlightForm(false), 1400);
    return () => window.clearTimeout(timeout);
  }, [highlightForm]);

  const activeClients = clientUsers.filter((client) => client.active).length;
  const verifiedClients = clientUsers.filter((client) => client.emailVerified).length;

  const clientStats = useMemo(() => {
    return clientUsers.map((client) => ({
      client,
      favorites: propertyFavorites.filter((favorite) => favorite.clientId === client.id)
        .length,
      leads: leads.filter(
        (lead) =>
          lead.clientId === client.id ||
          lead.email.trim().toLowerCase() === client.email.trim().toLowerCase()
      ).length,
    }));
  }, [clientUsers, leads, propertyFavorites]);

  const handleClientSubmit = (event: FormEvent) => {
    event.preventDefault();
    setClientError("");
    const errors = validateClientUserForm(clientForm, {
      passwordOptional: Boolean(editingClientId),
    });
    if (errors.length) {
      setClientError(errors[0]);
      return;
    }

    const email = clientForm.email.trim().toLowerCase();
    const duplicate = clientUsers.find(
      (client) =>
        client.email.trim().toLowerCase() === email && client.id !== editingClientId
    );
    if (duplicate) {
      setClientError("Ya existe un cliente con ese email.");
      return;
    }

    updateState((prev) => {
      if (editingClientId) {
        return {
          ...prev,
          clientUsers: prev.clientUsers.map((client) =>
            client.id === editingClientId
              ? {
                  ...client,
                  name: clientForm.name.trim(),
                  email,
                  phone: normalizePhone(clientForm.phone),
                  idNumber: normalizeIdNumber(clientForm.idNumber),
                  active: clientForm.active,
                  password: clientForm.password.trim() || client.password,
                }
              : client
          ),
        };
      }

      return {
        ...prev,
        clientUsers: [
          ...prev.clientUsers,
          {
            id: createId(),
            name: clientForm.name.trim(),
            email,
            phone: normalizePhone(clientForm.phone),
            idNumber: normalizeIdNumber(clientForm.idNumber),
            emailVerified: true,
            verificationToken: undefined,
            active: clientForm.active,
            password: clientForm.password.trim(),
          },
        ],
      };
    });

    setClientForm(getEmptyClientForm());
    setEditingClientId(null);
  };

  const handleClientEdit = (clientId: string) => {
    const target = clientUsers.find((client) => client.id === clientId);
    if (!target) return;
    setEditingClientId(clientId);
    setClientForm({
      name: target.name,
      email: target.email,
      password: "",
      phone: target.phone,
      idNumber: target.idNumber ?? "",
      active: target.active,
    });
    setHighlightForm(true);
    document
      .getElementById("form-cliente")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleClientDelete = (clientId: string) => {
    updateState((prev) => ({
      ...prev,
      clientUsers: prev.clientUsers.filter((client) => client.id !== clientId),
      propertyFavorites: prev.propertyFavorites.filter(
        (favorite) => favorite.clientId !== clientId
      ),
      leads: prev.leads.map((lead) =>
        lead.clientId === clientId ? { ...lead, clientId: undefined } : lead
      ),
    }));
  };

  return (
    <AdminShell
      activeSection="clientes"
      title="Clientes finales"
      primaryAction={{ href: "#form-cliente", label: "Nuevo cliente" }}
    >
      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
            Clientes
          </p>
          <p className="mt-2 text-3xl font-bold text-primary">{clientUsers.length}</p>
        </div>
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
            Activos
          </p>
          <p className="mt-2 text-3xl font-bold text-primary">{activeClients}</p>
        </div>
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
            Verificados
          </p>
          <p className="mt-2 text-3xl font-bold text-primary">{verifiedClients}</p>
        </div>
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
            Favoritos
          </p>
          <p className="mt-2 text-3xl font-bold text-primary">{propertyFavorites.length}</p>
        </div>
      </section>

      <section
        id="form-cliente"
        className={`mt-8 rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)] ${
          highlightForm ? "inmo-edit-highlight" : ""
        }`}
      >
        <h3 className="text-xl font-headline font-bold text-primary">
          {editingClientId ? "Editar cliente" : "Nuevo cliente"}
        </h3>
        <p className="mt-2 text-xs text-on-surface-variant">
          Gestioná el acceso de clientes a perfil, favoritos e historial de consultas.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={handleClientSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              value={clientForm.name}
              onChange={(event) =>
                setClientForm((prev) => ({ ...prev, name: event.target.value }))
              }
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              placeholder="Nombre y apellido"
            />
            <input
              required
              type="email"
              value={clientForm.email}
              onChange={(event) =>
                setClientForm((prev) => ({ ...prev, email: event.target.value }))
              }
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              placeholder="Email"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              required
              value={clientForm.phone}
              onChange={(event) =>
                setClientForm((prev) => ({ ...prev, phone: event.target.value }))
              }
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              placeholder="Teléfono"
            />
            <input
              required
              value={clientForm.idNumber}
              onChange={(event) =>
                setClientForm((prev) => ({ ...prev, idNumber: event.target.value }))
              }
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              placeholder="DNI / CUIL / CUIT"
            />
            <input
              required={!editingClientId}
              type="password"
              value={clientForm.password}
              onChange={(event) =>
                setClientForm((prev) => ({ ...prev, password: event.target.value }))
              }
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              placeholder={editingClientId ? "Nueva contraseña opcional" : "Contraseña"}
            />
          </div>
          <label className="flex items-center gap-3 text-sm font-semibold text-primary">
            <input
              type="checkbox"
              checked={clientForm.active}
              onChange={(event) =>
                setClientForm((prev) => ({ ...prev, active: event.target.checked }))
              }
            />
            Cliente activo
          </label>
          {clientError ? <p className="text-sm text-error">{clientError}</p> : null}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-full bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-widest text-on-primary"
              style={{ color: "var(--color-on-primary)" }}
            >
              {editingClientId ? "Guardar cambios" : "Crear cliente"}
            </button>
            {editingClientId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingClientId(null);
                  setClientForm(getEmptyClientForm());
                }}
                className="rounded-full border border-outline-variant/40 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-primary"
              >
                Cancelar edición
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="mt-8 rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)]">
        <h3 className="text-xl font-headline font-bold text-primary">
          Clientes, favoritos y consultas
        </h3>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant/20 text-[10px] uppercase tracking-widest text-on-surface-variant">
                <th className="pb-4">Cliente</th>
                <th className="pb-4">Favoritos</th>
                <th className="pb-4">Consultas</th>
                <th className="pb-4">Estado</th>
                <th className="pb-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {clientStats.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-sm text-on-surface-variant">
                    Todavía no hay clientes cargados.
                  </td>
                </tr>
              ) : (
                clientStats.map(({ client, favorites, leads: clientLeads }) => (
                  <tr key={client.id}>
                    <td className="py-5">
                      <p className="text-sm font-bold text-primary">{client.name}</p>
                      <p className="text-xs text-on-surface-variant">{client.email}</p>
                    </td>
                    <td className="py-5 text-sm">{favorites}</td>
                    <td className="py-5 text-sm">{clientLeads}</td>
                    <td className="py-5 text-sm">
                      {client.active ? "Activo" : "Inactivo"} ·{" "}
                      {client.emailVerified ? "Verificado" : "Pendiente"}
                    </td>
                    <td className="py-5">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleClientEdit(client.id)}
                          className="rounded-full border border-outline-variant/40 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleClientDelete(client.id)}
                          className="rounded-full border border-error/40 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-error"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-6 text-xs text-on-surface-variant">
          Propiedades en catálogo para favoritos: {listings.length}
        </div>
      </section>
    </AdminShell>
  );
}
