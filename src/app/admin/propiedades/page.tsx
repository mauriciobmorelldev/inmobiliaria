"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import AdminShell from "@/components/inmo/admin/AdminShell";
import {
  createId,
  currencyOptions,
  getEmptyListingForm,
  getListingForm,
  normalizeListing,
  priceUnitOptions,
  readFileAsDataUrl,
  statusOptions,
  typeOptions,
  validateListingForm,
  type ListingFormState,
} from "@/lib/adminForms";
import { formatPrice } from "@/lib/pricing";
import {
  propertyTypeLabels,
  statusLabels,
  type FilterGroup,
  type Listing,
  type PriceUnit,
  type PropertyStatus,
  type PropertyType,
} from "@/lib/inmoData";
import { useInmoStore } from "@/lib/inmoStore";
import { readAdminSession } from "@/lib/session";

const toggleAttributeSelection = (
  group: FilterGroup,
  option: string,
  current: Record<string, string[]>
) => {
  const selected = current[group.id] ?? [];
  if (group.mode === "single") {
    return { ...current, [group.id]: selected[0] === option ? [] : [option] };
  }
  const exists = selected.includes(option);
  return {
    ...current,
    [group.id]: exists
      ? selected.filter((item) => item !== option)
      : [...selected, option],
  };
};

export default function AdminPropertiesPage() {
  const { state, updateState } = useInmoStore();
  const { listings, agents, filterGroups, adminUsers } = state;
  const [adminSession] = useState(() => readAdminSession());
  const authedAdmin = adminUsers.find((admin) => admin.id === adminSession?.adminId);
  const isOwner = authedAdmin?.role === "owner";
  const isCollaborator = authedAdmin?.role === "colaborador";
  const visibleListings =
    isOwner
      ? listings
      : authedAdmin
        ? listings.filter((listing) => listing.createdByAdminId === authedAdmin.id)
        : [];
  const assignableAgents = isOwner ? agents : [];

  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [listingForm, setListingForm] = useState<ListingFormState>(
    getEmptyListingForm(filterGroups, assignableAgents)
  );
  const [imageUrlDraft, setImageUrlDraft] = useState("");
  const [videoUrlDraft, setVideoUrlDraft] = useState("");
  const [formError, setFormError] = useState<string>("");
  const [highlightForm, setHighlightForm] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successNotice, setSuccessNotice] = useState("");
  const [mediaNotice, setMediaNotice] = useState("");
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!highlightForm) return;
    const timeout = window.setTimeout(() => setHighlightForm(false), 1400);
    return () => window.clearTimeout(timeout);
  }, [highlightForm]);

  useEffect(() => {
    if (!successNotice) return;
    const timeout = window.setTimeout(() => setSuccessNotice(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [successNotice]);

  useEffect(() => {
    if (!mediaNotice) return;
    const timeout = window.setTimeout(() => setMediaNotice(""), 2200);
    return () => window.clearTimeout(timeout);
  }, [mediaNotice]);

  const availableCount = visibleListings.filter((item) => item.status === "disponible").length;
  const reservedCount = visibleListings.filter((item) => item.status === "reservado").length;
  const soldCount = visibleListings.filter((item) => item.status === "vendido").length;

  const openNewListingForm = () => {
    setEditingListingId(null);
    setListingForm(getEmptyListingForm(filterGroups, assignableAgents));
    setImageUrlDraft("");
    setVideoUrlDraft("");
    setFormError("");
    setMediaNotice("");
    setIsFormOpen(true);
  };

  const closeListingForm = () => {
    if (isSaving) return;
    setIsFormOpen(false);
    setEditingListingId(null);
    setFormError("");
    setMediaNotice("");
  };

  const syncListingToServer = async (listing: Listing) => {
    if (!authedAdmin) return;
    const response = await fetch("/api/properties", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-id": authedAdmin.id,
      },
      body: JSON.stringify(listing),
    });
    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(result?.error ?? "No se pudo sincronizar la propiedad.");
    }
  };

  const handleListingSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!authedAdmin) {
      setFormError("Iniciá sesión para cargar propiedades.");
      return;
    }
    const errors = validateListingForm(listingForm);
    if (errors.length) {
      setFormError(errors[0]);
      return;
    }

    const id = editingListingId ?? createId();
    const baseListing = normalizeListing(listingForm, id);
    const previousListing = listings.find((item) => item.id === id);
    const isOwnListing =
      isOwner ||
      previousListing?.createdByAdminId === authedAdmin?.id ||
      (!editingListingId && isCollaborator);

    if (!isOwnListing) {
      setFormError("Tu rol colaborador solo puede editar propiedades creadas por vos.");
      return;
    }

    const normalized = {
      ...baseListing,
      agentId: isOwner ? baseListing.agentId : undefined,
      createdByAdminId:
        previousListing?.createdByAdminId ??
        (isOwner ? undefined : authedAdmin.id),
    };

    setIsSaving(true);
    try {
      updateState((prev) => {
        const nextListings = editingListingId
          ? prev.listings.map((item) => (item.id === id ? normalized : item))
          : [...prev.listings, normalized];
        return { ...prev, listings: nextListings };
      });

      try {
        await syncListingToServer(normalized);
      } catch (error) {
        console.warn("La propiedad quedó guardada localmente, pero no sincronizó remoto.", error);
      }

      setEditingListingId(null);
      setListingForm(getEmptyListingForm(filterGroups, assignableAgents));
      setImageUrlDraft("");
      setVideoUrlDraft("");
      setFormError("");
      setIsFormOpen(false);
      setSuccessNotice(
        editingListingId
          ? "Propiedad actualizada correctamente."
          : "Propiedad creada correctamente."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleListingEdit = (listing: Listing) => {
    if (!isOwner && listing.createdByAdminId !== authedAdmin?.id) return;
    setEditingListingId(listing.id);
    setListingForm(getListingForm(listing));
    setFormError("");
    setMediaNotice("");
    setIsFormOpen(true);
    setHighlightForm(true);
  };

  const handleListingDelete = async (listingId: string) => {
    updateState((prev) => ({
      ...prev,
      listings: prev.listings.filter(
        (item) =>
          item.id !== listingId ||
          (!isOwner && item.createdByAdminId !== authedAdmin?.id)
      ),
    }));
    if (!authedAdmin) return;
    try {
      await fetch(`/api/properties?id=${encodeURIComponent(listingId)}`, {
        method: "DELETE",
        headers: { "x-admin-id": authedAdmin.id },
      });
      setSuccessNotice("Propiedad eliminada correctamente.");
    } catch (error) {
      console.warn("La propiedad se eliminó localmente, pero no sincronizó remoto.", error);
    }
  };

  const handleListingImageUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const images = await Promise.all(Array.from(files).map(readFileAsDataUrl));
      setListingForm((prev) => ({
        ...prev,
        images: [...prev.images, ...images],
      }));
      setMediaNotice(`${images.length} imagen${images.length === 1 ? "" : "es"} agregada${images.length === 1 ? "" : "s"}.`);
      if (imageFileInputRef.current) imageFileInputRef.current.value = "";
    } catch {
      setFormError("No se pudieron cargar las imágenes. Probá con otro archivo.");
    }
  };

  const handleListingImageAdd = () => {
    const value = imageUrlDraft.trim();
    if (!value) return;
    try {
      new URL(value);
    } catch {
      setFormError("Pegá un link de imagen válido.");
      return;
    }
    setListingForm((prev) => ({ ...prev, images: [...prev.images, value] }));
    setImageUrlDraft("");
    setFormError("");
    setMediaNotice("Imagen agregada.");
  };

  const handleListingVideoAdd = () => {
    const value = videoUrlDraft.trim();
    if (!value) return;
    try {
      new URL(value);
    } catch {
      setFormError("Pegá un link de video válido.");
      return;
    }
    setListingForm((prev) => ({ ...prev, videos: [...prev.videos, value] }));
    setVideoUrlDraft("");
    setFormError("");
    setMediaNotice("Video agregado.");
  };

  const handleListingImageRemove = (index: number) => {
    setListingForm((prev) => {
      const nextImages = prev.images.filter((_, idx) => idx !== index);
      const nextCover = Math.min(prev.coverIndex, nextImages.length - 1);
      return { ...prev, images: nextImages, coverIndex: Math.max(nextCover, 0) };
    });
  };

  const handleListingVideoRemove = (index: number) => {
    setListingForm((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, idx) => idx !== index),
    }));
  };

  return (
    <AdminShell
      activeSection="propiedades"
      title={isCollaborator ? "Carga de inmuebles" : "Inventario de Propiedades"}
      subtitle={
        isCollaborator
          ? "Cargá y actualizá únicamente los inmuebles creados con tu usuario."
          : undefined
      }
    >
      {successNotice ? (
        <div className="fixed right-6 top-24 z-[80] animate-[inmo-toast_0.28s_ease-out] rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800 shadow-[0_24px_50px_-30px_rgba(16,185,129,0.55)]">
          {successNotice}
        </div>
      ) : null}

      <section className="mt-8 flex flex-col gap-4 rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
            Gestión de inmuebles
          </p>
          <h3 className="mt-2 text-xl font-headline font-bold text-primary">
            {isCollaborator ? "Cargar un inmueble propio" : "Administrar inventario"}
          </h3>
        </div>
        <button
          type="button"
          onClick={openNewListingForm}
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-xs font-semibold uppercase tracking-widest text-on-primary transition hover:-translate-y-0.5"
          style={{ color: "var(--color-on-primary)" }}
        >
          {isCollaborator ? "Nuevo inmueble" : "Nueva propiedad"}
        </button>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Totales</p>
          <p className="mt-2 text-3xl font-bold text-primary">{visibleListings.length}</p>
        </div>
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Disponibles</p>
          <p className="mt-2 text-3xl font-bold text-primary">{availableCount}</p>
        </div>
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Reservadas</p>
          <p className="mt-2 text-3xl font-bold text-primary">{reservedCount}</p>
        </div>
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Vendidas</p>
          <p className="mt-2 text-3xl font-bold text-primary">{soldCount}</p>
        </div>
      </section>

      {isFormOpen ? (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-background/80 px-4 py-6 backdrop-blur-md md:py-10">
          <button
            type="button"
            className="fixed inset-0 cursor-default"
            aria-label="Cerrar formulario"
            onClick={closeListingForm}
          />
          <section
            id="form-propiedad"
            className={`relative z-10 w-full max-w-5xl rounded-3xl bg-surface-container-lowest p-5 shadow-[0_40px_80px_-35px_rgba(27,27,28,0.35)] md:p-8 ${
              highlightForm ? "inmo-edit-highlight" : ""
            }`}
          >
            <div className="flex flex-col gap-4 border-b border-outline-variant/20 pb-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                  {editingListingId ? "Edición" : "Nueva carga"}
                </p>
                <h3 className="mt-2 text-xl font-headline font-bold text-primary">
                  {editingListingId ? "Editar propiedad" : "Nueva propiedad"}
                </h3>
                <p className="mt-2 max-w-2xl text-xs text-on-surface-variant">
                  {isOwner
                    ? "Completá ficha, imágenes, corredor y atributos para mostrar esta unidad en el front."
                    : "Vista básica de carga. Tu usuario queda asociado al inmueble y ningún otro colaborador puede verlo o editarlo. No podés asignar corredor ni cargar teléfonos."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeListingForm}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/40 text-lg font-semibold text-primary"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

        <form className="mt-6 grid gap-4" onSubmit={handleListingSubmit}>
          <input
            className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
            placeholder="Título"
            value={listingForm.title}
            onChange={(event) =>
              setListingForm((prev) => ({
                ...prev,
                title: event.target.value,
              }))
            }
            required
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <select
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              value={listingForm.type}
              onChange={(event) =>
                setListingForm((prev) => ({
                  ...prev,
                  type: event.target.value as PropertyType,
                }))
              }
            >
              {typeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              value={listingForm.status}
              onChange={(event) =>
                setListingForm((prev) => ({
                  ...prev,
                  status: event.target.value as PropertyStatus,
                }))
              }
            >
              {statusOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              value={listingForm.priceUnit}
              onChange={(event) =>
                setListingForm((prev) => ({
                  ...prev,
                  priceUnit: event.target.value as PriceUnit,
                }))
              }
            >
              {priceUnitOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <input
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              placeholder="Precio"
              value={listingForm.price}
              onChange={(event) =>
                setListingForm((prev) => ({
                  ...prev,
                  price: event.target.value,
                }))
              }
              required
            />
            <input
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              placeholder="Barrio"
              value={listingForm.neighborhood}
              onChange={(event) =>
                setListingForm((prev) => ({
                  ...prev,
                  neighborhood: event.target.value,
                }))
              }
              required
            />
            <input
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              placeholder="Área m²"
              value={listingForm.area}
              onChange={(event) =>
                setListingForm((prev) => ({
                  ...prev,
                  area: event.target.value,
                }))
              }
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Moneda
              <select
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                value={listingForm.currency}
                onChange={(event) =>
                  setListingForm((prev) => ({
                    ...prev,
                    currency: event.target.value as typeof listingForm.currency,
                  }))
                }
              >
                {currencyOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-2xl bg-surface-container-low p-4 text-xs text-on-surface-variant">
              El catálogo ordena USD y ARS convirtiendo internamente a pesos con el tipo de cambio configurado en Branding.
            </div>
          </div>

          <div className={`grid gap-4 ${isOwner ? "sm:grid-cols-3" : "sm:grid-cols-1"}`}>
            <input
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              placeholder="Ambientes"
              value={listingForm.rooms}
              onChange={(event) =>
                setListingForm((prev) => ({
                  ...prev,
                  rooms: event.target.value,
                }))
              }
              required
            />
            {isOwner ? (
              <>
                <input
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  placeholder="Tag"
                  value={listingForm.tag}
                  onChange={(event) =>
                    setListingForm((prev) => ({
                      ...prev,
                      tag: event.target.value,
                    }))
                  }
                />
                <input
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  placeholder="Highlight"
                  value={listingForm.highlight}
                  onChange={(event) =>
                    setListingForm((prev) => ({
                      ...prev,
                      highlight: event.target.value,
                    }))
                  }
                />
              </>
            ) : null}
          </div>

          <textarea
            className="min-h-[120px] rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
            placeholder="Descripción"
            value={listingForm.description}
            onChange={(event) =>
              setListingForm((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
            required
          />

          {isOwner ? (
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Corredor asignado
              <select
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                value={listingForm.agentId}
                onChange={(event) =>
                  setListingForm((prev) => ({
                    ...prev,
                    agentId: event.target.value,
                  }))
                }
              >
                <option value="">Sin asignar</option>
                {assignableAgents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div className="grid gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Imágenes
            </p>
            {mediaNotice ? (
              <p className="animate-[inmo-toast_0.28s_ease-out] rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                {mediaNotice}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {listingForm.images.map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className="relative overflow-hidden rounded-2xl border border-outline-variant/30"
                >
                  <img src={image} alt={`Imagen ${index + 1}`} className="h-20 w-28 object-cover" />
                  <button
                    type="button"
                    onClick={() => handleListingImageRemove(index)}
                    className="absolute right-1 top-1 rounded-full bg-background/80 px-2 py-1 text-xs text-error"
                  >
                    ×
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setListingForm((prev) => ({
                        ...prev,
                        coverIndex: index,
                      }))
                    }
                    className={`absolute left-1 top-1 rounded-full px-2 py-1 text-[10px] uppercase ${
                      listingForm.coverIndex === index
                        ? "bg-primary text-on-primary"
                        : "bg-background/80 text-primary"
                    }`}
                  >
                    Cover
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                type="url"
                placeholder="Pegá un link"
                value={imageUrlDraft}
                onChange={(event) => setImageUrlDraft(event.target.value)}
                className="flex-1 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleListingImageAdd}
                className="rounded-full border border-primary px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary"
              >
                Agregar link
              </button>
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => handleListingImageUpload(event.target.files)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => imageFileInputRef.current?.click()}
                className="rounded-full bg-surface-container-high px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary"
              >
                Subir imágenes
              </button>
            </div>
          </div>

          {isOwner ? (
            <div className="grid gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Videos
            </p>
            {listingForm.videos.length ? (
              <div className="grid gap-2">
                {listingForm.videos.map((video, index) => (
                  <div
                    key={`${video}-${index}`}
                    className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-xs"
                  >
                    <span className="truncate text-on-surface-variant">{video}</span>
                    <button
                      type="button"
                      onClick={() => handleListingVideoRemove(index)}
                      className="text-error"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">
                Podés agregar enlaces de videos (YouTube/Vimeo o MP4).
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <input
                type="url"
                placeholder="Pegá link de video"
                value={videoUrlDraft}
                onChange={(event) => setVideoUrlDraft(event.target.value)}
                className="flex-1 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleListingVideoAdd}
                className="rounded-full border border-primary px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary"
              >
                Agregar video
              </button>
            </div>
          </div>
          ) : null}

          {isOwner ? (
            <div className="grid gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Atributos
            </p>
            {filterGroups.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                Creá un grupo en la sección Filtros para poder asignarlos.
              </p>
            ) : (
              filterGroups.map((group) => (
                <div key={group.id} className="flex flex-wrap gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {group.label}
                  </span>
                  {group.options.map((option) => {
                    const isActive = (listingForm.attributes[group.id] ?? []).includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          setListingForm((prev) => ({
                            ...prev,
                            attributes: toggleAttributeSelection(
                              group,
                              option,
                              prev.attributes
                            ),
                          }))
                        }
                        className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-widest transition ${
                          isActive
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-outline-variant/40 text-on-surface-variant"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            {formError ? <p className="text-sm text-error">{formError}</p> : null}
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-widest text-on-primary transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{ color: "var(--color-on-primary)" }}
            >
              {isSaving ? "Guardando..." : editingListingId ? "Guardar cambios" : "Crear propiedad"}
            </button>
            {editingListingId ? (
              <button
                type="button"
                onClick={closeListingForm}
                className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant"
              >
                Cancelar edición
              </button>
            ) : null}
          </div>
        </form>
      </section>
      </div>
      ) : null}

      <section className="mt-8 rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)]">
        <h3 className="text-xl font-headline font-bold text-primary">
          {isCollaborator ? "Tus inmuebles cargados" : "Listado cargado"}
        </h3>
        <p className="mt-2 text-xs text-on-surface-variant">
          {isCollaborator
            ? "Solo ves los inmuebles asociados a tu usuario colaborador."
            : "Estas propiedades ya se ven en el front y en resultados de búsqueda."}
        </p>

        <div className="mt-6 grid gap-4">
          {visibleListings.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Todavía no hay propiedades cargadas.</p>
          ) : (
            visibleListings.map((listing) => (
              <article
                key={listing.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-primary">{listing.title}</p>
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {propertyTypeLabels[listing.type]} · {formatPrice(listing.price, listing.priceUnit, listing.currency)}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {statusLabels[listing.status]}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest">
                  <Link href={`/propiedades/${listing.id}`} className="text-on-surface-variant">
                    Ver front
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleListingEdit(listing)}
                    className="text-primary"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleListingDelete(listing.id)}
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
