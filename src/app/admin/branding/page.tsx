"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import AdminShell from "@/components/inmo/admin/AdminShell";
import { readFileAsDataUrl, validateBrandingForm } from "@/lib/adminForms";
import type { ThemeSettings } from "@/lib/inmoData";
import { useInmoStore } from "@/lib/inmoStore";
import { buildThemeStyles } from "@/lib/theme";

export default function AdminBrandingPage() {
  const { state, updateState } = useInmoStore();
  const { theme, listings } = state;

  const [themeForm, setThemeForm] = useState<ThemeSettings>(theme);
  const [formError, setFormError] = useState("");
  const [formNotice, setFormNotice] = useState("");

  useEffect(() => {
    setThemeForm(theme);
  }, [theme]);

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
        logo: themeForm.logo,
        heroImage: themeForm.heroImage,
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

  return (
    <AdminShell activeSection="branding" title="Branding y Apariencia">
      <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
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
      </section>
    </AdminShell>
  );
}
