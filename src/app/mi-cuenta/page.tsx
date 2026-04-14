"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import FrontHeader from "@/components/inmo/FrontHeader";
import { currencyFormatter } from "@/lib/adminForms";
import { useInmoStore } from "@/lib/inmoStore";
import { clearClientSession, readClientSession } from "@/lib/session";
import { buildThemeStyles } from "@/lib/theme";

export default function MiCuentaPage() {
  const { state, updateState } = useInmoStore();
  const { clientUsers, clientContracts, listings, theme } = state;
  const [session] = useState(() => readClientSession());
  const [actionNotice, setActionNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [paymentMethodByContract, setPaymentMethodByContract] = useState<
    Record<string, string>
  >({});
  const themeStyles = buildThemeStyles(theme);

  const client = useMemo(() => {
    if (!session) return null;
    return clientUsers.find((item) => item.id === session.clientId && item.active);
  }, [clientUsers, session]);

  const contracts = useMemo(() => {
    if (!client) return [];
    return clientContracts.filter((contract) => contract.clientId === client.id);
  }, [client, clientContracts]);

  const handleLogout = () => {
    clearClientSession();
    window.location.href = "/acceso";
  };

  const handleDownloadReceipt = async ({
    contractId,
    paymentId,
  }: {
    contractId: string;
    paymentId: string;
  }) => {
    const contract = contracts.find((item) => item.id === contractId);
    if (!contract || !client) return;
    const payment = contract.payments?.find((item) => item.id === paymentId);
    if (!payment) return;
    const listing = listings.find((item) => item.id === contract.listingId);

    const mod = await import("jspdf/dist/jspdf.es.min.js");
    const jsPDF = (mod as unknown as { jsPDF: typeof import("jspdf").jsPDF }).jsPDF;
    const doc = new jsPDF();
    const margin = 18;
    let y = 24;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Recibo de pago", margin, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Cliente: ${client.name}`, margin, y);
    y += 6;
    doc.text(`Documento: ${client.idNumber}`, margin, y);
    y += 6;
    doc.text(`Email: ${client.email}`, margin, y);
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Detalle del pago", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(
      `Fecha: ${new Date(payment.date).toLocaleDateString("es-AR")}`,
      margin,
      y
    );
    y += 6;
    doc.text(`Monto: ${currencyFormatter.format(payment.amount)}`, margin, y);
    y += 6;
    doc.text(`Metodo: ${payment.method}`, margin, y);
    y += 10;

    if (listing) {
      doc.setFont("helvetica", "bold");
      doc.text("Propiedad asociada", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.text(`${listing.title}`, margin, y);
      y += 6;
      doc.text(`Ubicacion: ${listing.neighborhood}`, margin, y);
      y += 10;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Contrato: ${contract.type} · ${contract.status}`, margin, y);
    y += 6;
    doc.text(
      `Inicio: ${new Date(contract.startDate).toLocaleDateString("es-AR")}`,
      margin,
      y
    );

    doc.save(`recibo-${client.name}-${payment.id}.pdf`);
  };

  const handleRegisterPayment = (contractId: string, method?: string) => {
    setActionNotice("");
    setActionError("");
    updateState((prev) => {
      const nextContracts = prev.clientContracts.map((contract) => {
        if (contract.id !== contractId) return contract;
        const total = contract.totalInstallments ?? 0;
        const paid = contract.paidInstallments ?? 0;
        if (contract.type === "pozo" && total > 0 && paid >= total) {
          setActionError("Ese contrato ya tiene todas las cuotas pagadas.");
          return contract;
        }
        const nextPaid = paid + 1;
        const isCompleted = contract.type === "pozo" && total > 0 && nextPaid >= total;
        const resolvedMethod =
          method || contract.paymentMethods?.[0] || "manual";
        const nextPayments = [
          ...(contract.payments ?? []),
          {
            id: `pay-${Date.now()}`,
            date: new Date().toISOString(),
            amount: contract.monthlyAmount,
            method: resolvedMethod,
          },
        ];
        return {
          ...contract,
          paidInstallments: nextPaid,
          status: isCompleted ? "finalizado" : contract.status,
          payments: nextPayments,
        };
      });
      return { ...prev, clientContracts: nextContracts };
    });
    setActionNotice("Pago registrado correctamente.");
  };

  return (
    <div style={themeStyles} className="min-h-screen bg-background text-on-background">
      <FrontHeader active="detail" />
      <main className="mx-auto min-h-screen max-w-screen-xl px-6 pt-24 lg:px-8">
        {!client ? (
          <div className="rounded-3xl bg-surface-container-lowest p-10 text-center shadow-[0_40px_60px_-15px_rgba(27,27,28,0.08)]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">
              Acceso requerido
            </p>
            <h1 className="mt-4 text-3xl font-headline font-extrabold text-primary">
              Ingresá para ver tu cuenta
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Necesitás iniciar sesión con tu usuario de cliente.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/acceso"
                className="rounded-full bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-widest text-on-primary"
                style={{ color: "var(--color-on-primary)" }}
              >
                Ingresar
              </Link>
              <Link
                href="/registro"
                className="rounded-full border border-outline-variant/40 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-primary"
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-3xl bg-surface-container-lowest p-10 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.08)]">
              <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">
                Mi cuenta
              </p>
              <h1 className="mt-4 text-3xl font-headline font-extrabold text-primary">
                {client.name}
              </h1>
              <p className="mt-2 text-sm text-on-surface-variant">{client.email}</p>
              <p className="text-sm text-on-surface-variant">{client.phone}</p>
              <p className="text-sm text-on-surface-variant">
                DNI / CUIL / CUIT: {client.idNumber}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-surface-container-low p-4">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                    Contratos activos
                  </p>
                  <p className="mt-2 text-2xl font-bold text-primary">
                    {contracts.filter((c) => c.status === "activo").length}
                  </p>
                </div>
                <div className="rounded-2xl bg-surface-container-low p-4">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                    Pago mensual
                  </p>
                  <p className="mt-2 text-2xl font-bold text-primary">
                    {currencyFormatter.format(
                      contracts.reduce((acc, c) => acc + c.monthlyAmount, 0)
                    )}
                  </p>
                </div>
              </div>

              {actionNotice ? (
                <p className="mt-4 text-sm text-primary">{actionNotice}</p>
              ) : null}
              {actionError ? <p className="mt-4 text-sm text-error">{actionError}</p> : null}

              <button
                type="button"
                onClick={handleLogout}
                className="mt-8 text-xs font-semibold uppercase tracking-widest text-on-surface-variant"
              >
                Cerrar sesión
              </button>
            </section>

            <section className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-10">
              <h2 className="text-2xl font-headline font-bold text-primary">
                Mis contratos
              </h2>
              <p className="mt-2 text-sm text-on-surface-variant">
                Detalle de tu operación y propiedades asociadas.
              </p>

              <div className="mt-6 grid gap-3">
                {contracts.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">
                    Todavía no tenés contratos asignados.
                  </p>
                ) : (
                  contracts.map((contract) => {
                    const listing = listings.find((l) => l.id === contract.listingId);
                    const progress =
                      contract.totalInstallments && contract.paidInstallments
                        ? Math.round(
                            (contract.paidInstallments / contract.totalInstallments) *
                              100
                          )
                        : 0;
                    const payments = contract.payments ?? [];
                    const paymentMethods = contract.paymentMethods ?? [];
                    const totalInstallments = contract.totalInstallments ?? 0;
                    const paidInstallments = contract.paidInstallments ?? 0;
                    const showTimeline = contract.type === "pozo" && totalInstallments > 0;
                    return (
                      <article
                        key={contract.id}
                        className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-primary">
                              {listing?.title || "Propiedad en gestión"}
                            </p>
                            <p className="text-xs text-on-surface-variant">
                              {contract.type === "pozo" ? "En pozo" : "Alquiler"} ·{" "}
                              {contract.status.replace("_", " ")}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-primary">
                            {currencyFormatter.format(contract.monthlyAmount)}
                          </p>
                        </div>

                        <div className="mt-4">
                          {contract.type === "pozo" ? (
                            <div>
                              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-on-surface-variant">
                                <span>Progreso de cuotas</span>
                                <span>
                                  {paidInstallments}/{totalInstallments}
                                </span>
                              </div>
                              <div className="mt-2 h-2 rounded-full bg-surface-container-high">
                                <div
                                  className="h-2 rounded-full bg-primary"
                                  style={{ width: `${Math.max(6, progress)}%` }}
                                />
                              </div>
                              <p className="mt-2 text-xs text-on-surface-variant">
                                Cuotas restantes:{" "}
                                {Math.max(
                                  0,
                                  totalInstallments - paidInstallments
                                )}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-on-surface-variant">
                              Pagos registrados: {contract.paidInstallments ?? 0}
                            </p>
                          )}
                        </div>

                        {showTimeline ? (
                          <div className="mt-4 rounded-2xl bg-surface-container-high p-3">
                            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                              Timeline de cuotas
                            </p>
                            <div className="mt-3 grid grid-cols-6 gap-2">
                              {Array.from({ length: totalInstallments }).map((_, idx) => {
                                const paid = idx < paidInstallments;
                                return (
                                  <div
                                    key={`cuota-${idx}`}
                                    className={`flex items-center justify-center rounded-full text-[10px] font-semibold ${
                                      paid
                                        ? "bg-primary text-on-primary"
                                        : "bg-surface-container-low text-on-surface-variant"
                                    }`}
                                  >
                                    {idx + 1}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}

                        <div className="mt-4 grid gap-2 text-xs text-on-surface-variant">
                          <div className="flex items-center justify-between">
                            <span>Inicio</span>
                            <span className="font-semibold text-primary">
                              {new Date(contract.startDate).toLocaleDateString("es-AR")}
                            </span>
                          </div>
                          {contract.endDate ? (
                            <div className="flex items-center justify-between">
                              <span>Fin</span>
                              <span className="font-semibold text-primary">
                                {new Date(contract.endDate).toLocaleDateString("es-AR")}
                              </span>
                            </div>
                          ) : null}
                          <div className="flex items-center justify-between">
                            <span>Estado</span>
                            <span className="font-semibold text-primary">
                              {contract.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>

                        {listing ? (
                          <div className="mt-4 rounded-2xl bg-surface-container-high p-3 text-xs text-on-surface-variant">
                            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                              Propiedad asociada
                            </p>
                            <p className="mt-2 text-sm font-semibold text-primary">
                              {listing.title}
                            </p>
                            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                              {listing.neighborhood}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="rounded-full bg-surface-container-low px-3 py-1 text-[10px] uppercase tracking-widest">
                                {listing.area} m²
                              </span>
                              <span className="rounded-full bg-surface-container-low px-3 py-1 text-[10px] uppercase tracking-widest">
                                {listing.rooms} ambientes
                              </span>
                            </div>
                          </div>
                        ) : null}

                        {paymentMethods.length ? (
                          <div className="mt-4 rounded-2xl bg-surface-container-high p-3 text-xs text-on-surface-variant">
                            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                              Métodos de pago
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {paymentMethods.map((method) => (
                                <span
                                  key={method}
                                  className="rounded-full bg-surface-container-low px-3 py-1 text-[10px] uppercase tracking-widest"
                                >
                                  {method}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {paymentMethods.length ? (
                          <div className="mt-4">
                            <label className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                              Elegí método de pago
                            </label>
                            <select
                              value={
                                paymentMethodByContract[contract.id] ||
                                paymentMethods[0]
                              }
                              onChange={(event) =>
                                setPaymentMethodByContract((prev) => ({
                                  ...prev,
                                  [contract.id]: event.target.value,
                                }))
                              }
                              className="mt-2 w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                            >
                              {paymentMethods.map((method) => (
                                <option key={method} value={method}>
                                  {method}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : null}

                        <button
                          type="button"
                          onClick={() =>
                            handleRegisterPayment(
                              contract.id,
                              paymentMethodByContract[contract.id]
                            )
                          }
                          className="mt-4 w-full rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-widest text-on-primary"
                          style={{ color: "var(--color-on-primary)" }}
                        >
                          Registrar pago
                        </button>

                        {payments.length ? (
                          <div className="mt-4 rounded-2xl bg-surface-container-high p-3 text-xs text-on-surface-variant">
                            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                              Historial de pagos
                            </p>
                            <ul className="mt-2 space-y-1">
                              {payments
                                .slice(-5)
                                .reverse()
                                .map((payment) => (
                                  <li
                                    key={payment.id}
                                    className="flex flex-wrap items-center justify-between gap-2"
                                  >
                                    <span>
                                      {new Date(payment.date).toLocaleDateString("es-AR")}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                                      {payment.method}
                                    </span>
                                    <span className="font-semibold text-primary">
                                      {currencyFormatter.format(payment.amount)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDownloadReceipt({
                                          contractId: contract.id,
                                          paymentId: payment.id,
                                        })
                                      }
                                      className="text-[10px] font-bold uppercase tracking-widest text-primary"
                                    >
                                      Descargar recibo
                                    </button>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        ) : null}
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
