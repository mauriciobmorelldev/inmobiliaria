"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useInmoStore } from "@/lib/inmoStore";
import { buildThemeStyles } from "@/lib/theme";
import { propertyTypeLabels, statusLabels, type FilterGroup } from "@/lib/inmoData";
import FrontHeader from "@/components/inmo/FrontHeader";
import { createId, isValidEmail, normalizePhone } from "@/lib/adminForms";
import { readClientSession } from "@/lib/session";

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

const resolveAttributes = (
  groups: FilterGroup[],
  values: Record<string, string[]>
) =>
  groups
    .map((group) => ({
      label: group.label,
      values: values[group.id] ?? [],
    }))
    .filter((group) => group.values.length > 0);

export default function DetallePropiedadPage() {
  const params = useParams<{ id: string | string[] }>();
  const propertyId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const { state, updateState } = useInmoStore();
  const {
    listings,
    agents,
    clientUsers,
    propertyFavorites,
    filterGroups,
    theme,
  } = state;
  const property = listings.find((item) => item.id === propertyId);
  const [activeImage, setActiveImage] = useState(0);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadMessage, setLeadMessage] = useState("");
  const [leadNotice, setLeadNotice] = useState("");
  const [leadError, setLeadError] = useState("");
  const [clientSession] = useState(() => readClientSession());

  const agent = useMemo(
    () => agents.find((item) => item.id === property?.agentId),
    [agents, property?.agentId]
  );
  const client = useMemo(() => {
    if (!clientSession) return null;
    return clientUsers.find(
      (item) => item.id === clientSession.clientId && item.active
    );
  }, [clientSession, clientUsers]);

  useEffect(() => {
    if (!client) return;
    const hydrate = () => {
      setLeadName((current) => current || client.name);
      setLeadEmail((current) => current || client.email);
      setLeadPhone((current) => current || client.phone);
    };
    if (typeof queueMicrotask === "function") {
      queueMicrotask(hydrate);
    } else {
      window.setTimeout(hydrate, 0);
    }
  }, [client]);

  const attributes = useMemo(
    () => (property ? resolveAttributes(filterGroups, property.attributes) : []),
    [filterGroups, property]
  );

  useEffect(() => {
    if (!propertyId) return;
    updateState((prev) => {
      const existing = prev.propertyMetrics.find(
        (metric) => metric.propertyId === propertyId
      );
      if (existing) {
        return {
          ...prev,
          propertyMetrics: prev.propertyMetrics.map((metric) =>
            metric.propertyId === propertyId
              ? {
                  ...metric,
                  views: metric.views + 1,
                  lastViewedAt: new Date().toISOString(),
                }
              : metric
          ),
        };
      }
      return {
        ...prev,
        propertyMetrics: [
          ...prev.propertyMetrics,
          {
            id: createId(),
            propertyId,
            views: 1,
            leads: 0,
            favorites: 0,
            lastViewedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }, [propertyId, updateState]);

  if (!property) {
    return (
      <div className="min-h-screen bg-background text-on-background">
        <div className="mx-auto max-w-screen-md px-8 py-24 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-on-surface-variant">
            Propiedad no encontrada
          </p>
          <h1 className="mt-4 text-3xl font-headline font-bold text-primary">
            No existe la propiedad solicitada
          </h1>
          <Link
            className="mt-6 inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-on-primary"
            href="/propiedades"
          >
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  const images = property.images.length
    ? property.images
    : [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDDAgcQ1jH-fIHqf_1_ZpyWhB5OgV3FjRjRnpql6lTJVWDtzGO6uOOup5LqkSCn2KKr5FZT69TKFGv9opxa-EtnkAhHAFONQKnnGSxg-kpoXjvTZd2_zb_M0iY4cdZDsbE31W35JVc6NtFBpzRAIJ3fzBoiXjTRbt76CbQqkPo_uMsnGWzj1yfw1KLkJl-CTvkOXdNQwFmLYckq3fv_U2TWQex40VRDPn80Z1xtb0tEJczaLIblLpxrFYmY9rVwD_c7FEWmHPHXIg",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDI0K-3EhAsC26dD0_BayXjOCzeNuH20nxavwc4HLYyK1W8lmuyKoiNzSfyrjyS-T-oTiWd1HAvTSQG4R1JQrUZSjvWhWhLPKIErJI1sx8gjlWrwQumL4CKJ1-SJnVea2epp1jyuZ-pbSSiN09GVnDH2NouRR0pr7_1cvzrxCLdkp33_zUYVry2zh716dnQRPQansaLiUNHVZxz8kvq-qEq35qC1ciJztFsnuiUcECmtlHSgSDt4b9Fgu9NaPipKH8mp-uWLNphw",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBPwVzgXPJm0swtY64CQbdnTef3BTgOiLpJyMC05lfsZ3vahhPB3JlrNwGPyzKnqC4edrrCpfXf0gRe1MltU-8HvUvqm9U62TxGf-TMbEaq4MuXzJyzMo0ql2RbO4ma5EOI1My4_3oXEEbpcsuJMScmmgFOOonN8dZHI-fiOJ0rWkRBY1c4Z8TYUTMAOkYdFP7L3FNk8qMiO4iJyOxj_PHaGnpiGspDEtM2oLtCXNIPPp8HPKPQjDZNpujgpXVREeeTMApubcs4lg",
      ];

  const mainImage = images[activeImage] ?? images[0];
  const mainVideo = property.videos?.[0] ?? "";
  const sideImages = images.slice(1, 3);
  const extraCount = images.length - 3;
  const themeStyles = buildThemeStyles(theme);
  const isFavorite = Boolean(
    client &&
      propertyFavorites.some(
        (favorite) =>
          favorite.clientId === client.id && favorite.propertyId === property.id
      )
  );

  const toggleFavorite = () => {
    if (!client) {
      window.location.href = "/acceso";
      return;
    }
    updateState((prev) => {
      const exists = prev.propertyFavorites.find(
        (favorite) =>
          favorite.clientId === client.id && favorite.propertyId === property.id
      );
      const nextFavorites = exists
        ? prev.propertyFavorites.filter((favorite) => favorite.id !== exists.id)
        : [
            ...prev.propertyFavorites,
            {
              id: createId(),
              clientId: client.id,
              propertyId: property.id,
              createdAt: new Date().toISOString(),
            },
          ];
      const delta = exists ? -1 : 1;
      return {
        ...prev,
        propertyFavorites: nextFavorites,
        propertyMetrics: prev.propertyMetrics.some(
          (metric) => metric.propertyId === property.id
        )
          ? prev.propertyMetrics.map((metric) =>
              metric.propertyId === property.id
                ? { ...metric, favorites: Math.max(0, metric.favorites + delta) }
                : metric
            )
          : [
              ...prev.propertyMetrics,
              {
                id: createId(),
                propertyId: property.id,
                views: 0,
                leads: 0,
                favorites: exists ? 0 : 1,
              },
            ],
      };
    });
  };

  const handleLeadSubmit = (event: FormEvent) => {
    event.preventDefault();
    setLeadError("");
    setLeadNotice("");
    const phone = normalizePhone(leadPhone);
    if (!leadName.trim()) {
      setLeadError("Ingresá tu nombre.");
      return;
    }
    if (!isValidEmail(leadEmail)) {
      setLeadError("Ingresá un email válido.");
      return;
    }
    if (!phone) {
      setLeadError("Ingresá un teléfono válido.");
      return;
    }
    const now = new Date().toISOString();
    updateState((prev) => ({
      ...prev,
      leads: [
        ...prev.leads,
        {
          id: createId(),
          name: leadName.trim(),
          email: leadEmail.trim().toLowerCase(),
          phone,
          propertyId: property.id,
          agentId: property.agentId,
          clientId: client?.id,
          status: "nuevo",
          createdAt: now,
          updatedAt: now,
          notes: leadMessage.trim(),
        },
      ],
      propertyMetrics: prev.propertyMetrics.some(
        (metric) => metric.propertyId === property.id
      )
        ? prev.propertyMetrics.map((metric) =>
            metric.propertyId === property.id
              ? { ...metric, leads: metric.leads + 1 }
              : metric
          )
        : [
            ...prev.propertyMetrics,
            {
              id: createId(),
              propertyId: property.id,
              views: 0,
              leads: 1,
              favorites: 0,
            },
          ],
    }));
    setLeadNotice("Consulta enviada. Un asesor va a contactarte.");
    setLeadMessage("");
  };

  return (
    <div style={themeStyles} className="bg-background text-on-background font-body">
      <FrontHeader active="detail" />

      <main className="pt-20">
        <section className="mx-auto max-w-screen-2xl px-6 lg:px-8 pt-8">
          <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest">
              <div className="relative aspect-[16/10] overflow-hidden">
                {mainVideo ? (
                  <video
                    className="h-full w-full object-cover"
                    src={mainVideo}
                    controls
                    playsInline
                  />
                ) : (
                  <img
                    alt={property.title}
                    className="h-full w-full object-cover"
                    src={mainImage}
                  />
                )}
                <div className="absolute left-6 top-6 flex flex-wrap gap-2">
                  <span className="rounded-full bg-surface-container-lowest/90 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest">
                    {propertyTypeLabels[property.type]}
                  </span>
                  <span className="rounded-full bg-primary/90 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-on-primary">
                    {statusLabels[property.status]}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto p-4">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`relative shrink-0 overflow-hidden rounded-xl border ${
                      activeImage === index
                        ? "border-primary"
                        : "border-outline-variant/30"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Miniatura ${index + 1}`}
                      className="h-20 w-28 object-cover"
                    />
                    {activeImage === index ? (
                      <span className="absolute inset-0 border-2 border-primary" />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              {sideImages.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveImage(index + 1)}
                  className="relative overflow-hidden rounded-2xl bg-surface-container-lowest"
                >
                  <img className="h-full w-full object-cover" src={image} alt="Detalle" />
                </button>
              ))}
              {extraCount > 0 ? (
                <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest">
                  <img className="h-full w-full object-cover" src={images[2]} alt="Más" />
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/40">
                    <span className="text-lg font-headline font-bold text-on-primary">
                      +{extraCount} Fotos
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-surface-container-low p-6 text-sm text-on-surface-variant">
                  Galería completa disponible en la ficha.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-screen-2xl grid-cols-1 gap-16 px-8 py-16 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-12">
            <div className="space-y-4">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div className="space-y-2">
                  <h1 className="text-5xl font-headline font-extrabold tracking-tighter text-primary">
                    {property.title}
                  </h1>
                  <p className="text-xl font-light text-on-surface-variant">
                    {property.neighborhood}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-headline font-bold text-primary">
                    {formatPrice(property.price, property.priceUnit)}
                  </p>
                  <p className="text-sm font-medium uppercase tracking-widest text-on-surface-variant">
                    {property.tag || "Disponible"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-8 border-b border-t border-outline-variant/15 py-8">
                <div className="flex items-center space-x-3">
                  <span className="material-symbols-outlined text-2xl text-primary">square_foot</span>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">Espacio</p>
                    <p className="font-bold">{property.area} m²</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="material-symbols-outlined text-2xl text-primary">bed</span>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">Ambientes</p>
                    <p className="font-bold">{property.rooms}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="material-symbols-outlined text-2xl text-primary">verified</span>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">Estado</p>
                    <p className="font-bold">{statusLabels[property.status]}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-headline font-bold tracking-tight">
                Sobre esta propiedad
              </h2>
              <div className="prose prose-stone max-w-none space-y-4 text-on-surface-variant">
                <p>{property.description || "Descripción pendiente."}</p>
                <p>{property.highlight}</p>
              </div>
            </div>

            {attributes.length ? (
              <div className="space-y-8">
                <h2 className="text-2xl font-headline font-bold tracking-tight">
                  Características destacadas
                </h2>
                <div className="grid grid-cols-2 gap-x-12 gap-y-6 md:grid-cols-3">
                  {attributes.flatMap((group) =>
                    group.values.map((value) => (
                      <div key={`${group.label}-${value}`} className="flex items-center space-x-3">
                        <span className="material-symbols-outlined text-primary">check_circle</span>
                        <span className="text-sm font-medium text-on-surface-variant">{value}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.06)]">
              <h3 className="text-xl font-headline font-bold text-primary">
                Consultar con un asesor
              </h3>
              {agent ? (
                <div className="mt-4 flex items-center gap-4">
                  {agent.photo ? (
                    <img src={agent.photo} alt={agent.name} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high text-primary">
                      {agent.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-primary">{agent.name}</p>
                    <p className="text-xs text-on-surface-variant">{agent.role}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-on-surface-variant">
                  Un asesor de Connexa va a responder tu consulta.
                </p>
              )}
              <button
                type="button"
                onClick={toggleFavorite}
                className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-outline-variant/40 px-5 py-3 text-sm font-semibold text-primary"
              >
                <span className="material-symbols-outlined mr-2 text-lg">
                  {isFavorite ? "favorite" : "favorite_border"}
                </span>
                {isFavorite ? "Guardada en favoritos" : "Guardar en favoritos"}
              </button>
              <form className="mt-6 grid gap-3" onSubmit={handleLeadSubmit}>
                <input
                  required
                  value={leadName}
                  onChange={(event) => setLeadName(event.target.value)}
                  placeholder="Nombre"
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                />
                <input
                  required
                  type="email"
                  value={leadEmail}
                  onChange={(event) => setLeadEmail(event.target.value)}
                  placeholder="Email"
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                />
                <input
                  required
                  value={leadPhone}
                  onChange={(event) => setLeadPhone(event.target.value)}
                  placeholder="Teléfono"
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                />
                <textarea
                  value={leadMessage}
                  onChange={(event) => setLeadMessage(event.target.value)}
                  placeholder="Mensaje"
                  className="min-h-[92px] rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                />
                {leadError ? <p className="text-sm text-error">{leadError}</p> : null}
                {leadNotice ? <p className="text-sm text-primary">{leadNotice}</p> : null}
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-on-primary"
                  style={{ color: "var(--color-on-primary)" }}
                >
                  Enviar consulta
                </button>
              </form>
            </div>

            <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.06)]">
              <h3 className="text-lg font-headline font-bold text-primary">Ficha rápida</h3>
              <div className="mt-4 space-y-3 text-sm text-on-surface-variant">
                <div className="flex items-center justify-between">
                  <span>Tipo</span>
                  <span className="font-semibold text-primary">{propertyTypeLabels[property.type]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Precio</span>
                  <span className="font-semibold text-primary">{formatPrice(property.price, property.priceUnit)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Ambientes</span>
                  <span className="font-semibold text-primary">{property.rooms}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Superficie</span>
                  <span className="font-semibold text-primary">{property.area} m²</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
