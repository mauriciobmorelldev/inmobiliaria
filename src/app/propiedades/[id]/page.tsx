"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useInmoStore } from "@/lib/inmoStore";
import { buildThemeStyles } from "@/lib/theme";
import { propertyTypeLabels, type FilterGroup } from "@/lib/inmoData";
import FrontHeader from "@/components/inmo/FrontHeader";
import { createId, isValidEmail, normalizePhone } from "@/lib/adminForms";
import { readClientSession } from "@/lib/session";
import { generatePropertyPdf } from "@/lib/propertyPdf";
import { getAvailability } from "@/lib/availability";
import { formatPrice } from "@/lib/pricing";

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

const fallbackImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDDAgcQ1jH-fIHqf_1_ZpyWhB5OgV3FjRjRnpql6lTJVWDtzGO6uOOup5LqkSCn2KKr5FZT69TKFGv9opxa-EtnkAhHAFONQKnnGSxg-kpoXjvTZd2_zb_M0iY4cdZDsbE31W35JVc6NtFBpzRAIJ3fzBoiXjTRbt76CbQqkPo_uMsnGWzj1yfw1KLkJl-CTvkOXdNQwFmLYckq3fv_U2TWQex40VRDPn80Z1xtb0tEJczaLIblLpxrFYmY9rVwD_c7FEWmHPHXIg",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDI0K-3EhAsC26dD0_BayXjOCzeNuH20nxavwc4HLYyK1W8lmuyKoiNzSfyrjyS-T-oTiWd1HAvTSQG4R1JQrUZSjvWhWhLPKIErJI1sx8gjlWrwQumL4CKJ1-SJnVea2epp1jyuZ-pbSSiN09GVnDH2NouRR0pr7_1cvzrxCLdkp33_zUYVry2zh716dnQRPQansaLiUNHVZxz8kvq-qEq35qC1ciJztFsnuiUcECmtlHSgSDt4b9Fgu9NaPipKH8mp-uWLNphw",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBPwVzgXPJm0swtY64CQbdnTef3BTgOiLpJyMC05lfsZ3vahhPB3JlrNwGPyzKnqC4edrrCpfXf0gRe1MltU-8HvUvqm9U62TxGf-TMbEaq4MuXzJyzMo0ql2RbO4ma5EOI1My4_3oXEEbpcsuJMScmmgFOOonN8dZHI-fiOJ0rWkRBY1c4Z8TYUTMAOkYdFP7L3FNk8qMiO4iJyOxj_PHaGnpiGspDEtM2oLtCXNIPPp8HPKPQjDZNpujgpXVREeeTMApubcs4lg",
];

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
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerZoom, setViewerZoom] = useState(1);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadMessage, setLeadMessage] = useState("");
  const [leadNotice, setLeadNotice] = useState("");
  const [leadError, setLeadError] = useState("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");
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

  useEffect(() => {
    const resetGallery = () => {
      setActiveImage(0);
      setViewerIndex(0);
      setViewerZoom(1);
      setIsViewerOpen(false);
    };
    if (typeof queueMicrotask === "function") {
      queueMicrotask(resetGallery);
      return;
    }
    window.setTimeout(resetGallery, 0);
  }, [propertyId]);

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

  const images = property?.images.length ? property.images : fallbackImages;
  const mainImage = images[activeImage] ?? images[0];
  const mainVideo = property?.videos?.[0] ?? "";
  const sideImages = images.slice(1, 3);
  const extraCount = images.length - 3;
  const themeStyles = buildThemeStyles(theme);

  const openViewer = (index: number) => {
    const nextIndex = Math.min(Math.max(index, 0), images.length - 1);
    setViewerIndex(nextIndex);
    setActiveImage(nextIndex);
    setViewerZoom(1);
    setIsViewerOpen(true);
  };

  const closeViewer = useCallback(() => {
    setIsViewerOpen(false);
    setViewerZoom(1);
  }, []);

  const moveViewer = useCallback((direction: 1 | -1) => {
    setViewerIndex((current) => {
      const nextIndex = (current + direction + images.length) % images.length;
      setActiveImage(nextIndex);
      setViewerZoom(1);
      return nextIndex;
    });
  }, [images.length]);

  const updateZoom = (delta: number) => {
    setViewerZoom((current) => Math.min(5, Math.max(1, Number((current + delta).toFixed(2)))));
  };

  const toggleImageZoom = () => {
    setViewerZoom((current) => (current > 1 ? 1 : 2.5));
  };

  useEffect(() => {
    if (!isViewerOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeViewer();
      if (event.key === "ArrowRight") moveViewer(1);
      if (event.key === "ArrowLeft") moveViewer(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeViewer, isViewerOpen, moveViewer]);

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

  const isFavorite = Boolean(
    client &&
      propertyFavorites.some(
        (favorite) =>
          favorite.clientId === client.id && favorite.propertyId === property.id
      )
  );
  const availability = getAvailability(property.status);

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

  const handleDownloadPdf = async () => {
    setPdfError("");
    setIsGeneratingPdf(true);
    try {
      await generatePropertyPdf({
        property,
        attributes,
        images,
        theme,
        propertyUrl: window.location.href,
      });
    } catch (error) {
      console.error("No se pudo generar la ficha PDF", error);
      setPdfError("No pudimos generar el PDF. Probá nuevamente.");
    } finally {
      setIsGeneratingPdf(false);
    }
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
                  <button
                    type="button"
                    onClick={() => openViewer(activeImage)}
                    className="group block h-full w-full cursor-zoom-in"
                    aria-label="Abrir galería de imágenes"
                  >
                    <img
                      alt={property.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      src={mainImage}
                    />
                    <span className="absolute bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-surface-container-lowest/92 px-4 py-2 text-xs font-bold text-primary shadow-[0_20px_45px_-28px_rgba(27,54,93,0.55)] backdrop-blur">
                      <span className="material-symbols-outlined text-base">zoom_in</span>
                      Ver fotos
                    </span>
                  </button>
                )}
                <div className="absolute left-6 top-6 flex flex-wrap gap-2">
                  <span className="rounded-full bg-surface-container-lowest/90 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest">
                    {propertyTypeLabels[property.type]}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest shadow-sm ${availability.badgeClassName}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${availability.dotClassName}`} />
                    {availability.label}
                  </span>
                </div>
                {mainVideo ? (
                  <button
                    type="button"
                    onClick={() => openViewer(activeImage)}
                    className="absolute bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-surface-container-lowest/92 px-4 py-2 text-xs font-bold text-primary shadow-[0_20px_45px_-28px_rgba(27,54,93,0.55)] backdrop-blur"
                  >
                    <span className="material-symbols-outlined text-base">photo_library</span>
                    Ver fotos
                  </button>
                ) : null}
              </div>
              <div className="flex gap-3 overflow-x-auto p-4">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => {
                      setActiveImage(index);
                      openViewer(index);
                    }}
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
                  onClick={() => openViewer(index + 1)}
                  className="group relative overflow-hidden rounded-2xl bg-surface-container-lowest"
                >
                  <img
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src={image}
                    alt={`Imagen ${index + 2} de ${property.title}`}
                  />
                  <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest/88 text-primary backdrop-blur">
                    <span className="material-symbols-outlined text-lg">open_in_full</span>
                  </span>
                </button>
              ))}
              {extraCount > 0 ? (
                <button
                  type="button"
                  onClick={() => openViewer(2)}
                  className="relative overflow-hidden rounded-2xl bg-surface-container-lowest text-left"
                >
                  <img className="h-full w-full object-cover" src={images[2]} alt="Más" />
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/40">
                    <span className="text-lg font-headline font-bold text-on-primary">
                      +{extraCount} Fotos
                    </span>
                  </div>
                </button>
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
                <div className="rounded-2xl bg-surface-container-lowest p-5 text-left md:text-right">
                  <p className="text-4xl font-headline font-bold text-primary">
                    {formatPrice(property.price, property.priceUnit, property.currency)}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 md:justify-end">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${availability.badgeClassName}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${availability.dotClassName}`} />
                      {availability.label}
                    </span>
                    {property.tag ? (
                      <span className="rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        {property.tag}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="grid gap-3 border-b border-t border-outline-variant/15 py-8 sm:grid-cols-3">
                <div className="flex items-center space-x-3 rounded-2xl bg-surface-container-lowest p-4">
                  <span className="material-symbols-outlined text-2xl text-primary">square_foot</span>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">Espacio</p>
                    <p className="font-bold">{property.area} m²</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 rounded-2xl bg-surface-container-lowest p-4">
                  <span className="material-symbols-outlined text-2xl text-primary">bed</span>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">Ambientes</p>
                    <p className="font-bold">{property.rooms}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 rounded-2xl bg-surface-container-lowest p-4">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${availability.softClassName}`}
                  >
                    <span className="material-symbols-outlined text-2xl">
                      {availability.isAvailable ? "verified" : "block"}
                    </span>
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">Estado</p>
                    <p className={availability.isAvailable ? "font-bold text-emerald-700" : "font-bold text-red-700"}>
                      {availability.label}
                    </p>
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
                  <span className="font-semibold text-primary">{formatPrice(property.price, property.priceUnit, property.currency)}</span>
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
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition hover:scale-[1.01] disabled:cursor-wait disabled:opacity-70"
                style={{ color: "var(--color-on-primary)" }}
              >
                <span className="material-symbols-outlined text-lg">
                  {isGeneratingPdf ? "progress_activity" : "download"}
                </span>
                {isGeneratingPdf ? "Armando ficha PDF" : "Descargar ficha PDF"}
              </button>
              {pdfError ? <p className="mt-3 text-sm text-error">{pdfError}</p> : null}
            </div>
          </div>
        </section>
      </main>

      {isViewerOpen ? (
        <div
          className="fixed inset-0 z-[80] bg-primary/92 text-on-primary backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-label="Visualizador de imágenes"
          onClick={closeViewer}
        >
          <div className="flex h-full flex-col" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-on-primary/10 px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-on-primary">
                  {property.title}
                </p>
                <p className="text-xs text-on-primary/70">
                  Foto {viewerIndex + 1} de {images.length}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateZoom(-0.25)}
                  disabled={viewerZoom <= 1}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-on-primary/10 text-on-primary transition hover:bg-on-primary/18 disabled:opacity-35"
                  aria-label="Alejar imagen"
                >
                  <span className="material-symbols-outlined text-lg">zoom_out</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateZoom(0.25)}
                  disabled={viewerZoom >= 5}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-on-primary/10 text-on-primary transition hover:bg-on-primary/18 disabled:opacity-35"
                  aria-label="Acercar imagen"
                >
                  <span className="material-symbols-outlined text-lg">zoom_in</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewerZoom(1)}
                  className="hidden rounded-full bg-on-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-primary transition hover:bg-on-primary/18 sm:inline-flex"
                >
                  {Math.round(viewerZoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={closeViewer}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-primary transition hover:scale-105"
                  aria-label="Cerrar galería"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>

            <div className="relative min-h-0 flex-1">
              {images.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => moveViewer(-1)}
                    className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-on-primary/12 text-on-primary backdrop-blur transition hover:bg-on-primary/20 sm:left-6 sm:h-12 sm:w-12"
                    aria-label="Imagen anterior"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveViewer(1)}
                    className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-on-primary/12 text-on-primary backdrop-blur transition hover:bg-on-primary/20 sm:right-6 sm:h-12 sm:w-12"
                    aria-label="Imagen siguiente"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </>
              ) : null}

              <div
                className="h-full overflow-auto px-4 py-6 sm:px-20 sm:py-8"
              >
                <div className="flex min-h-full min-w-full items-center justify-center">
                  <img
                    src={images[viewerIndex]}
                    alt={`${property.title} - imagen ${viewerIndex + 1}`}
                    className="select-none rounded-2xl object-contain shadow-[0_40px_90px_-35px_rgba(0,0,0,0.55)]"
                    draggable={false}
                    onClick={toggleImageZoom}
                    style={{
                      cursor: viewerZoom > 1 ? "zoom-out" : "zoom-in",
                      maxHeight: viewerZoom === 1 ? "calc(100dvh - 220px)" : "none",
                      maxWidth: viewerZoom === 1 ? "100%" : "none",
                      width: viewerZoom > 1 ? `${Math.round(92 * viewerZoom)}vw` : "auto",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-on-primary/10 px-4 py-3 sm:px-6">
              <div className="mx-auto flex max-w-screen-lg gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={`viewer-${image}-${index}`}
                    type="button"
                    onClick={() => {
                      setViewerIndex(index);
                      setActiveImage(index);
                      setViewerZoom(1);
                    }}
                    className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border transition sm:h-20 sm:w-32 ${
                      viewerIndex === index
                        ? "border-primary-fixed"
                        : "border-on-primary/15 opacity-70 hover:opacity-100"
                    }`}
                    aria-label={`Ver imagen ${index + 1}`}
                  >
                    <img
                      src={image}
                      alt={`Miniatura ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
