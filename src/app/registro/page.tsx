"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import FrontHeader from "@/components/inmo/FrontHeader";
import {
  createId,
  validateClientUserForm,
  normalizeIdNumber,
  type ClientUserFormState,
} from "@/lib/adminForms";
import { useInmoStore } from "@/lib/inmoStore";
import { buildThemeStyles } from "@/lib/theme";

export default function RegistroPage() {
  const { state, updateState } = useInmoStore();
  const { clientUsers, theme } = state;
  const themeStyles = buildThemeStyles(theme);

  const [form, setForm] = useState<ClientUserFormState>({
    name: "",
    email: "",
    password: "",
    phone: "",
    idNumber: "",
    active: true,
  });
  const [emailConfirm, setEmailConfirm] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const errors = validateClientUserForm(form);
    if (errors.length) {
      setError(errors[0]);
      return;
    }
    if (form.email.trim().toLowerCase() !== emailConfirm.trim().toLowerCase()) {
      setError("El email y su confirmación deben coincidir.");
      return;
    }
    if (form.password.trim() !== passwordConfirm.trim()) {
      setError("La contraseña y su confirmación deben coincidir.");
      return;
    }

    const email = form.email.trim().toLowerCase();
    if (
      clientUsers.some((client) => client.email.trim().toLowerCase() === email)
    ) {
      setError("Ya existe un usuario con ese email.");
      return;
    }

    const newUser = {
      id: createId(),
      name: form.name.trim(),
      email,
      phone: form.phone.trim(),
      idNumber: normalizeIdNumber(form.idNumber),
      password: form.password.trim(),
      emailVerified: false,
      verificationToken: createId(),
      active: true,
    };

    updateState((prev) => ({
      ...prev,
      clientUsers: [...prev.clientUsers, newUser],
    }));

    const token = newUser.verificationToken;
    window.location.href = `/confirmar?token=${encodeURIComponent(token ?? "")}`;
  };

  return (
    <div style={themeStyles} className="min-h-screen bg-background text-on-background">
      <FrontHeader active="detail" />
      <main className="mx-auto flex min-h-screen max-w-screen-xl items-center px-6 pt-24 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl bg-surface-container-lowest p-10 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.08)]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">
              Portal Cliente
            </p>
            <h1 className="mt-4 text-3xl font-headline font-extrabold text-primary">
              Crear cuenta
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Registrate para guardar propiedades y seguir tus consultas.
            </p>

            <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Nombre y apellido
                <input
                  required
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                />
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Email
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                />
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Confirmar email
                <input
                  required
                  type="email"
                  value={emailConfirm}
                  onChange={(event) => setEmailConfirm(event.target.value)}
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                />
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Teléfono
                <input
                  required
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                />
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                DNI / CUIL / CUIT
                <input
                  required
                  value={form.idNumber}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, idNumber: event.target.value }))
                  }
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                />
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Contraseña
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                />
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Confirmar contraseña
                <input
                  required
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                />
              </label>
              {error ? <p className="text-sm text-error">{error}</p> : null}
              <button
                type="submit"
                className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary"
                style={{ color: "var(--color-on-primary)" }}
              >
                Crear cuenta
              </button>
            </form>

            <div className="mt-6 text-xs text-on-surface-variant">
              ¿Ya tenés cuenta?{" "}
              <Link href="/acceso" className="text-primary font-semibold">
                Iniciar sesión
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-10">
            <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">
              Lo que vas a ver
            </p>
            <h2 className="mt-4 text-2xl font-headline font-bold text-primary">
              Confirmación de email
            </h2>
            <div className="mt-6 grid gap-4 text-sm text-on-surface-variant">
              <div className="rounded-2xl bg-surface-container-low p-4">
                Recibirás un link de confirmación para validar tu email.
              </div>
              <div className="rounded-2xl bg-surface-container-low p-4">
                Solo con el email verificado podrás acceder a tu cuenta.
              </div>
              <div className="rounded-2xl bg-surface-container-low p-4">
                El acceso se habilita automáticamente al confirmar.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
