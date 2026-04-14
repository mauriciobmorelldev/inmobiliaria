"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import AdminShell from "@/components/inmo/admin/AdminShell";
import {
  createId,
  getEmptyClientForm,
  getEmptyContractForm,
  validateClientContractForm,
  validateClientUserForm,
  type ClientContractFormState,
  type ClientUserFormState,
} from "@/lib/adminForms";
import { currencyFormatter } from "@/lib/adminForms";
import { useInmoStore } from "@/lib/inmoStore";

const toNumber = (value: string) => {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function AdminClientesPage() {
  const { state, updateState } = useInmoStore();
  const { clientUsers, clientContracts, listings } = state;

  const [clientForm, setClientForm] = useState<ClientUserFormState>(getEmptyClientForm());
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [contractForm, setContractForm] = useState<ClientContractFormState>(getEmptyContractForm());
  const [paymentMethodDraft, setPaymentMethodDraft] = useState("");
  const [clientError, setClientError] = useState("");
  const [contractError, setContractError] = useState("");
  const [highlightForm, setHighlightForm] = useState(false);

  useEffect(() => {
    if (!highlightForm) return;
    const timeout = window.setTimeout(() => setHighlightForm(false), 1400);
    return () => window.clearTimeout(timeout);
  }, [highlightForm]);

  const contractsByClient = useMemo(() => {
    const map: Record<string, number> = {};
    clientContracts.forEach((contract) => {
      map[contract.clientId] = (map[contract.clientId] ?? 0) + 1;
    });
    return map;
  }, [clientContracts]);

  const totalActiveContracts = clientContracts.filter((c) => c.status === "activo")
    .length;
  const totalMonthlyRevenue = clientContracts.reduce(
    (acc, contract) => acc + (contract.status === "activo" ? contract.monthlyAmount : 0),
    0
  );

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
                  phone: clientForm.phone.trim(),
                  idNumber: clientForm.idNumber.trim(),
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
            phone: clientForm.phone.trim(),
            idNumber: clientForm.idNumber.trim(),
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
      clientContracts: prev.clientContracts.filter((contract) => contract.clientId !== clientId),
    }));
  };

  const handleContractSubmit = (event: FormEvent) => {
    event.preventDefault();
    setContractError("");
    const errors = validateClientContractForm(contractForm);
    if (errors.length) {
      setContractError(errors[0]);
      return;
    }

    updateState((prev) => ({
      ...prev,
      clientContracts: [
        ...prev.clientContracts,
        {
          id: createId(),
          clientId: contractForm.clientId,
          listingId: contractForm.listingId || undefined,
          type: contractForm.type,
          status: contractForm.status,
          startDate: contractForm.startDate,
          endDate: contractForm.endDate || undefined,
          monthlyAmount: toNumber(contractForm.monthlyAmount),
          totalInstallments: contractForm.totalInstallments
            ? Math.max(0, Math.round(toNumber(contractForm.totalInstallments)))
            : undefined,
          paidInstallments: contractForm.paidInstallments
            ? Math.max(0, Math.round(toNumber(contractForm.paidInstallments)))
            : undefined,
          notes: contractForm.notes.trim(),
          paymentMethods: contractForm.paymentMethods,
          payments: [],
        },
      ],
    }));

    setContractForm(getEmptyContractForm());
    setPaymentMethodDraft("");
  };

  return (
    <AdminShell
      activeSection="clientes"
      title="Clientes y Contratos"
      primaryAction={{ href: "#form-cliente", label: "Nuevo cliente" }}
    >
      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
            Clientes activos
          </p>
          <p className="mt-2 text-3xl font-bold text-primary">{clientUsers.length}</p>
        </div>
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
            Contratos activos
          </p>
          <p className="mt-2 text-3xl font-bold text-primary">{totalActiveContracts}</p>
        </div>
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
            Facturación mensual
          </p>
          <p className="mt-2 text-2xl font-bold text-primary">
            {currencyFormatter.format(totalMonthlyRevenue)}
          </p>
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
          Creá credenciales para que el cliente consulte su estado y contratos.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={handleClientSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Nombre
              <input
                required
                value={clientForm.name}
                onChange={(event) =>
                  setClientForm((prev) => ({ ...prev, name: event.target.value }))
                }
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                placeholder="Nombre y apellido"
              />
            </label>
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Email
              <input
                required
                type="email"
                value={clientForm.email}
                onChange={(event) =>
                  setClientForm((prev) => ({ ...prev, email: event.target.value }))
                }
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Teléfono
              <input
                required
                value={clientForm.phone}
                onChange={(event) =>
                  setClientForm((prev) => ({ ...prev, phone: event.target.value }))
                }
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              />
            </label>
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              DNI / CUIL / CUIT
              <input
                required
                value={clientForm.idNumber}
                onChange={(event) =>
                  setClientForm((prev) => ({ ...prev, idNumber: event.target.value }))
                }
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              />
            </label>
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Contraseña
              <input
                type="password"
                value={clientForm.password}
                onChange={(event) =>
                  setClientForm((prev) => ({ ...prev, password: event.target.value }))
                }
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                placeholder={editingClientId ? "Dejar vacío para conservar" : "Mín. 6 caracteres"}
              />
            </label>
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Estado
              <select
                value={clientForm.active ? "active" : "inactive"}
                onChange={(event) =>
                  setClientForm((prev) => ({ ...prev, active: event.target.value === "active" }))
                }
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </label>
          </div>

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
                  setClientError("");
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
        <h3 className="text-xl font-headline font-bold text-primary">Contratos</h3>
        <p className="mt-2 text-xs text-on-surface-variant">
          Asociá clientes a alquileres o operaciones en pozo.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={handleContractSubmit}>
          <div className="grid gap-3 lg:grid-cols-3">
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Cliente
              <select
                required
                value={contractForm.clientId}
                onChange={(event) =>
                  setContractForm((prev) => ({ ...prev, clientId: event.target.value }))
                }
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              >
                <option value="">Seleccionar</option>
                {clientUsers.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Propiedad (opcional)
              <select
                value={contractForm.listingId}
                onChange={(event) =>
                  setContractForm((prev) => ({ ...prev, listingId: event.target.value }))
                }
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              >
                <option value="">Sin asignar</option>
                {listings.map((listing) => (
                  <option key={listing.id} value={listing.id}>
                    {listing.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Tipo
              <select
                value={contractForm.type}
                onChange={(event) =>
                  setContractForm((prev) => ({
                    ...prev,
                    type: event.target.value === "pozo" ? "pozo" : "alquiler",
                  }))
                }
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              >
                <option value="alquiler">Alquiler</option>
                <option value="pozo">En pozo</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 lg:grid-cols-4">
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Estado
              <select
                value={contractForm.status}
                onChange={(event) =>
                  setContractForm((prev) => ({
                    ...prev,
                    status:
                      event.target.value === "finalizado"
                        ? "finalizado"
                        : event.target.value === "en_mora"
                        ? "en_mora"
                        : "activo",
                  }))
                }
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              >
                <option value="activo">Activo</option>
                <option value="finalizado">Finalizado</option>
                <option value="en_mora">En mora</option>
              </select>
            </label>
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Inicio
              <input
                required
                type="date"
                value={contractForm.startDate}
                onChange={(event) =>
                  setContractForm((prev) => ({ ...prev, startDate: event.target.value }))
                }
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              />
            </label>
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Fin (opcional)
              <input
                type="date"
                value={contractForm.endDate}
                onChange={(event) =>
                  setContractForm((prev) => ({ ...prev, endDate: event.target.value }))
                }
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              />
            </label>
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Monto mensual
              <input
                required
                value={contractForm.monthlyAmount}
                onChange={(event) =>
                  setContractForm((prev) => ({ ...prev, monthlyAmount: event.target.value }))
                }
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                placeholder="$350.000"
              />
            </label>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Cuotas totales
              <input
                value={contractForm.totalInstallments}
                onChange={(event) =>
                  setContractForm((prev) => ({
                    ...prev,
                    totalInstallments: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                placeholder="36"
              />
            </label>
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Cuotas pagas
              <input
                value={contractForm.paidInstallments}
                onChange={(event) =>
                  setContractForm((prev) => ({
                    ...prev,
                    paidInstallments: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                placeholder="12"
              />
            </label>
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Notas
              <input
                value={contractForm.notes}
                onChange={(event) =>
                  setContractForm((prev) => ({ ...prev, notes: event.target.value }))
                }
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                placeholder="Observaciones comerciales"
              />
            </label>
          </div>

          <div className="grid gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Métodos de pago habilitados
            </p>
            <div className="flex flex-wrap gap-2">
              {contractForm.paymentMethods.map((method, index) => (
                <button
                  key={`${method}-${index}`}
                  type="button"
                  onClick={() =>
                    setContractForm((prev) => ({
                      ...prev,
                      paymentMethods: prev.paymentMethods.filter((_, idx) => idx !== index),
                    }))
                  }
                  className="rounded-full border border-outline-variant/40 px-3 py-1 text-[10px] uppercase tracking-widest text-primary"
                >
                  {method} · x
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                value={paymentMethodDraft}
                onChange={(event) => setPaymentMethodDraft(event.target.value)}
                placeholder="Ej: Transferencia, Efectivo, MercadoPago"
                className="flex-1 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const value = paymentMethodDraft.trim();
                  if (!value) return;
                  setContractForm((prev) => ({
                    ...prev,
                    paymentMethods: [...prev.paymentMethods, value],
                  }));
                  setPaymentMethodDraft("");
                }}
                className="rounded-full border border-primary px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary"
              >
                Agregar método
              </button>
            </div>
          </div>

          {contractError ? <p className="text-sm text-error">{contractError}</p> : null}

          <button
            type="submit"
            className="w-fit rounded-full bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-widest text-on-primary"
            style={{ color: "var(--color-on-primary)" }}
          >
            Crear contrato
          </button>
        </form>

        <div className="mt-8 grid gap-3">
          {clientContracts.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No hay contratos cargados.</p>
          ) : (
            clientContracts.map((contract) => {
              const client = clientUsers.find((c) => c.id === contract.clientId);
              const listing = listings.find((l) => l.id === contract.listingId);
              return (
                <article
                  key={contract.id}
                  className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-primary">
                        {client?.name || "Cliente"}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {contract.type === "pozo" ? "En pozo" : "Alquiler"} ·{" "}
                        {contract.status.replace("_", " ")}
                      </p>
                      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">
                        {listing?.title || "Propiedad sin asignar"}
                      </p>
                      {contract.paymentMethods?.length ? (
                        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">
                          Métodos: {contract.paymentMethods.join(", ")}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right text-sm font-semibold text-primary">
                      {currencyFormatter.format(contract.monthlyAmount)}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="mt-8 rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)]">
        <h3 className="text-xl font-headline font-bold text-primary">Clientes registrados</h3>
        <p className="mt-2 text-xs text-on-surface-variant">
          Clientes con acceso al portal para ver su estado y contratos.
        </p>

        <div className="mt-6 grid gap-3">
          {clientUsers.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No hay clientes cargados.</p>
          ) : (
            clientUsers.map((client) => (
              <article
                key={client.id}
                className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-primary">{client.name}</p>
                    <p className="text-xs text-on-surface-variant">{client.email}</p>
                    <p className="text-xs text-on-surface-variant">Documento: {client.idNumber}</p>
                    <p className="text-xs text-on-surface-variant">
                      {client.emailVerified ? "Email verificado" : "Email pendiente"}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">
                      {client.active ? "Activo" : "Inactivo"} ·{" "}
                      {contractsByClient[client.id] ?? 0} contratos
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest">
                    <button
                      type="button"
                      onClick={() => handleClientEdit(client.id)}
                      className="text-primary"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClientDelete(client.id)}
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
