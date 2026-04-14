"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useInmoStore } from "@/lib/inmoStore";
import { buildThemeStyles } from "@/lib/theme";
import { propertyTypeLabels, statusLabels, type FilterGroup } from "@/lib/inmoData";
import FrontHeader from "@/components/inmo/FrontHeader";

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

const toWhatsappHref = (phone: string, message: string) => {
  const cleanPhone = phone.replace(/\D/g, "");
  if (!cleanPhone) return "";
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
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

  const { state } = useInmoStore();
  const { listings, agents, filterGroups, theme } = state;
  const property = listings.find((item) => item.id === propertyId);
  const [activeImage, setActiveImage] = useState(0);

  const agent = useMemo(
    () => agents.find((item) => item.id === property?.agentId),
    [agents, property?.agentId]
  );

  const attributes = useMemo(
    () => (property ? resolveAttributes(filterGroups, property.attributes) : []),
    [filterGroups, property]
  );

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
  const whatsappMessage = `Hola ${agent?.name || ""}, me interesa la propiedad "${property.title}" en ${property.neighborhood}. ¿Sigue disponible?`;
  const whatsappHref = agent?.phone
    ? toWhatsappHref(agent.phone, whatsappMessage)
    : "";

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
                La Narrativa Arquitectónica
              </h2>
              <div className="prose prose-stone max-w-none space-y-4 text-on-surface-variant">
                <p>{property.description || "Descripción pendiente."}</p>
                <p>{property.highlight}</p>
              </div>
            </div>

            {attributes.length ? (
              <div className="space-y-8">
                <h2 className="text-2xl font-headline font-bold tracking-tight">
                  Amenidades Curadas
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
                <p className="mt-4 text-sm text-on-surface-variant">Sin corredor asignado.</p>
              )}
              <div className="mt-6 grid gap-3 text-sm text-on-surface-variant">
                <p>{agent?.email}</p>
                <p>{agent?.phone}</p>
              </div>
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-on-primary"
                >
                  Contactar por WhatsApp
                </a>
              ) : (
                <button
                  disabled
                  className="mt-6 w-full cursor-not-allowed rounded-lg bg-primary/60 px-5 py-3 text-sm font-semibold text-on-primary"
                >
                  Cargar teléfono del corredor
                </button>
              )}
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
