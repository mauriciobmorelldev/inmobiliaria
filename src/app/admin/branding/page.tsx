"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import AdminShell from "@/components/inmo/admin/AdminShell";
import { createId, readFileAsDataUrl, validateBrandingForm } from "@/lib/adminForms";
import type { HomeContent, ThemeSettings } from "@/lib/inmoData";
import { useInmoStore } from "@/lib/inmoStore";
import { buildThemeStyles } from "@/lib/theme";

export default function AdminBrandingPage() {
  const { state, updateState } = useInmoStore();
  const { theme, homeContent, listings } = state;

  const [themeForm, setThemeForm] = useState<ThemeSettings>(theme);
  const [homeForm, setHomeForm] = useState<HomeContent>(homeContent);
  const [activeTab, setActiveTab] = useState<"identity" | "hero" | "sections" | "banners">(
    "identity"
  );
  const [formError, setFormError] = useState("");
  const [formNotice, setFormNotice] = useState("");

  useEffect(() => {
    setThemeForm(theme);
  }, [theme]);

  useEffect(() => {
    setHomeForm(homeContent);
  }, [homeContent]);

  const previewStyles = useMemo(() => buildThemeStyles(themeForm), [themeForm]);

  const handleThemeSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    setFormNotice("");
    const errors = validateBrandingForm({
      name: themeForm.name,
      primary: themeForm.primary,
      secondary: themeForm.secondary,
    });
    if (errors.length) {
      setFormError(errors[0]);
      return;
    }
    updateState((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        name: themeForm.name.trim() || prev.theme.name,
        primary: themeForm.primary.trim(),
        secondary: themeForm.secondary.trim(),
        accent: themeForm.accent?.trim(),
        dark: themeForm.dark?.trim(),
        neutral: themeForm.neutral?.trim(),
        surface: themeForm.surface?.trim(),
        logo: themeForm.logo,
        heroImage: themeForm.heroImage,
        whatsappPhone: themeForm.whatsappPhone?.trim(),
        whatsappMessage: themeForm.whatsappMessage?.trim(),
        usdToArsRate:
          Number.isFinite(Number(themeForm.usdToArsRate)) && Number(themeForm.usdToArsRate) > 0
            ? Number(themeForm.usdToArsRate)
            : prev.theme.usdToArsRate,
      },
    }));
    setFormNotice("Branding actualizado.");
  };

  const handleLogoUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const url = await readFileAsDataUrl(files[0]);
    setThemeForm((prev) => ({ ...prev, logo: url }));
  };

  const handleHeroUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const url = await readFileAsDataUrl(files[0]);
    setThemeForm((prev) => ({ ...prev, heroImage: url }));
  };

  const handleHomeSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    setFormNotice("");
    updateState((prev) => ({
      ...prev,
      homeContent: {
        ...homeForm,
        banners: homeForm.banners.map((banner) => ({
          ...banner,
          title: banner.title.trim(),
          subtitle: banner.subtitle.trim(),
          ctaLabel: banner.ctaLabel.trim(),
          ctaHref: banner.ctaHref.trim() || "/propiedades",
        })),
      },
    }));
    setFormNotice("Home editable actualizada.");
  };

  const updateHomeField = <K extends keyof HomeContent>(
    key: K,
    value: HomeContent[K]
  ) => {
    setHomeForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateBanner = (
    bannerId: string,
    key: keyof HomeContent["banners"][number],
    value: string | boolean
  ) => {
    setHomeForm((prev) => ({
      ...prev,
      banners: prev.banners.map((banner) =>
        banner.id === bannerId ? { ...banner, [key]: value } : banner
      ),
    }));
  };

  const handleBannerUpload = async (bannerId: string, files: FileList | null) => {
    if (!files?.length) return;
    const url = await readFileAsDataUrl(files[0]);
    updateBanner(bannerId, "image", url);
  };

  const addBanner = () => {
    setHomeForm((prev) => ({
      ...prev,
      banners: [
        ...prev.banners,
        {
          id: createId(),
          title: "Nuevo banner",
          subtitle: "Mensaje destacado para la home.",
          image: "",
          ctaLabel: "Ver más",
          ctaHref: "/propiedades",
          active: true,
        },
      ],
    }));
  };

  const removeBanner = (bannerId: string) => {
    setHomeForm((prev) => ({
      ...prev,
      banners: prev.banners.filter((banner) => banner.id !== bannerId),
    }));
  };

  return (
    <AdminShell activeSection="branding" title="Branding y Home">
      <LayoutGroup>
      <motion.div
        layout
        className="mt-8 flex flex-wrap gap-2 rounded-3xl bg-surface-container-low p-2"
      >
        {[
          ["identity", "Identidad", "palette"],
          ["hero", "Hero", "view_carousel"],
          ["sections", "Secciones", "dashboard_customize"],
          ["banners", "Banners", "panorama"],
        ].map(([id, label, icon]) => (
          <motion.button
            key={id}
            layout
            type="button"
            onClick={() => setActiveTab(id as typeof activeTab)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`relative flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold uppercase tracking-widest transition ${
              activeTab === id
                ? "text-on-primary"
                : "text-primary hover:bg-surface-container-lowest"
            }`}
          >
            {activeTab === id ? (
              <motion.span
                layoutId="branding-active-tab"
                className="absolute inset-0 rounded-2xl bg-primary shadow-[0_20px_45px_-30px_rgba(27,54,93,0.8)]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
            <span className="material-symbols-outlined relative z-10 text-base">{icon}</span>
            <span className="relative z-10">{label}</span>
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
      {activeTab === "identity" ? (
      <motion.section
        key="identity"
        initial={{ opacity: 0, y: 18, scale: 0.985, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -12, scale: 0.99, filter: "blur(8px)" }}
        transition={{ type: "spring", stiffness: 180, damping: 24 }}
        className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]"
      >
        <div className="rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)]">
          <h3 className="text-xl font-headline font-bold text-primary">Identidad del emprendimiento</h3>
          <p className="mt-2 text-xs text-on-surface-variant">
            Estos cambios impactan en Home, catálogo, detalle de propiedades y panel admin.
          </p>

          <form className="mt-6 grid gap-4" onSubmit={handleThemeSubmit}>
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Nombre comercial
              <input
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                value={themeForm.name}
                onChange={(event) =>
                  setThemeForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Color primario
                <input
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  value={themeForm.primary}
                  onChange={(event) =>
                    setThemeForm((prev) => ({
                      ...prev,
                      primary: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Color secundario
                <input
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  value={themeForm.secondary}
                  onChange={(event) =>
                    setThemeForm((prev) => ({
                      ...prev,
                      secondary: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["accent", "Crema principal"],
                ["neutral", "Dorado secundario"],
                ["dark", "Texto oscuro"],
                ["surface", "Superficie"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant"
                >
                  {label}
                  <input
                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                    value={String(themeForm[key as keyof ThemeSettings] ?? "")}
                    onChange={(event) =>
                      setThemeForm((prev) => ({
                        ...prev,
                        [key]: event.target.value,
                      }))
                    }
                  />
                </label>
              ))}
            </div>

            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Logo
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleLogoUpload(event.target.files)}
                className="text-sm"
              />
            </label>

            {themeForm.logo ? (
              <img
                src={themeForm.logo}
                alt="Logo"
                className="h-16 w-auto rounded-xl border border-outline-variant/40 object-contain"
              />
            ) : null}

            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Imagen portada home
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleHeroUpload(event.target.files)}
                className="text-sm"
              />
            </label>

            {themeForm.heroImage ? (
              <div className="flex flex-wrap items-center gap-3">
                <img
                  src={themeForm.heroImage}
                  alt="Imagen portada"
                  className="h-20 w-32 rounded-xl border border-outline-variant/40 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setThemeForm((prev) => ({ ...prev, heroImage: "" }))}
                  className="text-[10px] font-bold uppercase tracking-widest text-error"
                >
                  Quitar
                </button>
              </div>
            ) : null}

            <div className="grid gap-4 rounded-3xl bg-surface-container-low p-5 sm:grid-cols-2">
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                WhatsApp del sitio
                <input
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  placeholder="Ej: 5491123456789"
                  value={themeForm.whatsappPhone ?? ""}
                  onChange={(event) =>
                    setThemeForm((prev) => ({
                      ...prev,
                      whatsappPhone: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Mensaje inicial
                <input
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  value={themeForm.whatsappMessage ?? ""}
                  onChange={(event) =>
                    setThemeForm((prev) => ({
                      ...prev,
                      whatsappMessage: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="grid gap-4 rounded-3xl bg-surface-container-low p-5 sm:grid-cols-[1fr_1.2fr]">
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Tipo de cambio USD → ARS
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  value={themeForm.usdToArsRate ?? 1000}
                  onChange={(event) =>
                    setThemeForm((prev) => ({
                      ...prev,
                      usdToArsRate: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <p className="self-end rounded-2xl bg-surface-container-lowest p-4 text-xs text-on-surface-variant">
                Se usa solamente para ordenar y calcular métricas cuando hay propiedades en USD y ARS. La ficha siempre muestra la moneda cargada en cada propiedad.
              </p>
            </div>

            <button
              type="submit"
              className="mt-2 w-fit rounded-full bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-widest text-on-primary"
            >
              Guardar branding
            </button>
            {formError ? <p className="text-sm text-error">{formError}</p> : null}
            {formNotice ? <p className="text-sm text-primary">{formNotice}</p> : null}
          </form>
        </div>

        <div
          style={previewStyles}
          className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)]"
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant font-bold">
            Vista previa rápida
          </p>
          <h3 className="mt-3 text-2xl font-headline font-extrabold text-primary">
            {themeForm.name || "Inmobiliaria"}
          </h3>
          <p className="mt-2 text-sm text-on-surface-variant">
            Así se verán los acentos de color y la identidad en el front.
          </p>

          <div className="mt-6 overflow-hidden rounded-2xl bg-surface-container-high">
            {themeForm.heroImage ? (
              <img src={themeForm.heroImage} alt="Hero preview" className="h-40 w-full object-cover" />
            ) : (
              <div className="h-40 w-full bg-gradient-to-br from-primary/30 to-secondary/30" />
            )}
          </div>

          <div className="mt-6 grid gap-3">
            <button className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-on-primary text-left">
              Botón primario
            </button>
            <button className="rounded-lg border border-outline-variant/40 px-5 py-3 text-sm font-semibold text-primary text-left">
              Botón secundario
            </button>
          </div>

          <div className="mt-6 rounded-2xl bg-surface-container-low p-4">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
              Propiedades cargadas
            </p>
            <p className="mt-2 text-2xl font-bold text-primary">{listings.length}</p>
          </div>
        </div>
      </motion.section>
      ) : null}

      {activeTab !== "identity" ? (
      <motion.section
        key={activeTab}
        initial={{ opacity: 0, y: 18, scale: 0.985, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -12, scale: 0.99, filter: "blur(8px)" }}
        transition={{ type: "spring", stiffness: 180, damping: 24 }}
        className="mt-6 rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)]"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-headline font-bold text-primary">
              {activeTab === "hero"
                ? "Hero de la home"
                : activeTab === "sections"
                  ? "Textos de secciones"
                  : "Banners de la home"}
            </h3>
            <p className="mt-2 max-w-2xl text-xs text-on-surface-variant">
              {activeTab === "hero"
                ? "Editá el primer impacto: claim, texto principal y botones."
                : activeTab === "sections"
                  ? "Ajustá los títulos y bajadas de los bloques principales de la home."
                  : "Creá campañas visuales con imagen, CTA y estado activo/inactivo."}
            </p>
          </div>
          {activeTab === "banners" ? (
            <button
              type="button"
              onClick={addBanner}
              className="rounded-full bg-primary-fixed px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary"
            >
              Agregar banner
            </button>
          ) : null}
        </div>

        <form className="mt-6 grid gap-6" onSubmit={handleHomeSubmit}>
          {activeTab === "hero" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Eyebrow
              <input
                className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                value={homeForm.eyebrow}
                onChange={(event) => updateHomeField("eyebrow", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Título principal
              <input
                className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                value={homeForm.title}
                onChange={(event) => updateHomeField("title", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Título destacado
              <input
                className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                value={homeForm.italicTitle}
                onChange={(event) => updateHomeField("italicTitle", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Texto hero
              <textarea
                className="min-h-28 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                value={homeForm.subtitle}
                onChange={(event) => updateHomeField("subtitle", event.target.value)}
              />
            </label>
          </div>
          ) : null}

          {activeTab === "hero" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["primaryCtaLabel", "CTA principal"],
              ["primaryCtaHref", "Link principal"],
              ["secondaryCtaLabel", "CTA secundario"],
              ["secondaryCtaHref", "Link secundario"],
            ].map(([key, label]) => (
              <label
                key={key}
                className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant"
              >
                {label}
                <input
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                  value={String(homeForm[key as keyof HomeContent] ?? "")}
                  onChange={(event) =>
                    updateHomeField(
                      key as keyof HomeContent,
                      event.target.value as HomeContent[keyof HomeContent]
                    )
                  }
                />
              </label>
            ))}
          </div>
          ) : null}

          {activeTab === "sections" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["featuredTitle", "Título propiedades"],
              ["featuredSubtitle", "Texto propiedades"],
              ["teamTitle", "Título bloque de acciones"],
              ["teamSubtitle", "Texto bloque de acciones"],
              ["recentTitle", "Título recientes"],
              ["recentSubtitle", "Texto recientes"],
            ].map(([key, label]) => (
              <label
                key={key}
                className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant"
              >
                {label}
                <input
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                  value={String(homeForm[key as keyof HomeContent] ?? "")}
                  onChange={(event) =>
                    updateHomeField(
                      key as keyof HomeContent,
                      event.target.value as HomeContent[keyof HomeContent]
                    )
                  }
                />
              </label>
            ))}
          </div>
          ) : null}

          {activeTab === "banners" ? (
          <div className="grid gap-4">
            {homeForm.banners.map((banner, index) => (
              <motion.div
                key={banner.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 170, damping: 22, delay: index * 0.03 }}
                className="grid gap-4 rounded-3xl bg-surface-container-low p-5 lg:grid-cols-[180px_1fr_auto]"
              >
                <div className="overflow-hidden rounded-2xl bg-surface-container-high">
                  {banner.image ? (
                    <img src={banner.image} alt={banner.title} className="h-40 w-full object-cover" />
                  ) : (
                    <div className="brand-gradient flex h-40 items-center justify-center text-xs font-bold uppercase tracking-widest text-on-primary">
                      Banner {index + 1}
                    </div>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                    Título banner
                    <input
                      className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                      value={banner.title}
                      onChange={(event) => updateBanner(banner.id, "title", event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                    Link
                    <input
                      className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                      value={banner.ctaHref}
                      onChange={(event) => updateBanner(banner.id, "ctaHref", event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant md:col-span-2">
                    Texto banner
                    <textarea
                      className="min-h-24 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                      value={banner.subtitle}
                      onChange={(event) => updateBanner(banner.id, "subtitle", event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                    CTA
                    <input
                      className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                      value={banner.ctaLabel}
                      onChange={(event) => updateBanner(banner.id, "ctaLabel", event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                    Imagen banner
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleBannerUpload(banner.id, event.target.files)}
                      className="text-sm"
                    />
                  </label>
                </div>

                <div className="flex flex-row items-center gap-3 lg:flex-col lg:items-end">
                  <label className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <input
                      type="checkbox"
                      checked={banner.active}
                      onChange={(event) => updateBanner(banner.id, "active", event.target.checked)}
                    />
                    Activo
                  </label>
                  <button
                    type="button"
                    onClick={() => removeBanner(banner.id)}
                    className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest text-error"
                  >
                    Eliminar
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          ) : null}

          <button
            type="submit"
            className="w-fit rounded-full bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-widest text-on-primary"
          >
            Guardar home
          </button>
        </form>
      </motion.section>
      ) : null}
      </AnimatePresence>
      </LayoutGroup>
    </AdminShell>
  );
}
