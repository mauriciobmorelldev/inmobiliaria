"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import FrontHeader from "@/components/inmo/FrontHeader";
import {
  createId,
  type ClientUserFormState,
} from "@/lib/adminForms";
import {
  hasClientRegistrationErrors,
  normalizeIdNumber,
  normalizePhone,
  validateClientRegistration,
  type ClientRegistrationErrors,
} from "@/lib/clientValidation";
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
  const [errors, setErrors] = useState<ClientRegistrationErrors>({});
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registrationInput = {
    ...form,
    emailConfirm,
    passwordConfirm,
  };

  const setField = (field: keyof ClientUserFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));
  };

  const validateField = (
    field: keyof ClientRegistrationErrors,
    nextInput = registrationInput
  ) => {
    const nextErrors = validateClientRegistration(nextInput);
    setErrors((prev) => ({ ...prev, [field]: nextErrors[field] }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrors({});
    setNotice("");
    setIsSubmitting(true);

    const nextErrors = validateClientRegistration(registrationInput);
    if (hasClientRegistrationErrors(nextErrors)) {
      setErrors(nextErrors);
      setIsSubmitting(false);
      return;
    }

    const email = form.email.trim().toLowerCase();
    if (
      clientUsers.some((client) => client.email.trim().toLowerCase() === email)
    ) {
      setErrors({ email: "Ya existe un usuario con ese email." });
      setIsSubmitting(false);
      return;
    }

    const verificationToken = createId();
    const response = await fetch("/api/client/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...registrationInput, verificationToken }),
    });
    const result = (await response.json().catch(() => null)) as
      | {
          ok?: boolean;
          errors?: ClientRegistrationErrors;
          emailSent?: boolean;
          emailMessage?: string;
          verificationToken?: string;
          normalized?: { email: string; phone: string; idNumber: string };
        }
      | null;

    if (!response.ok || !result?.ok) {
      setErrors(result?.errors ?? { form: "No pudimos crear la cuenta. Revisá los datos." });
      setIsSubmitting(false);
      return;
    }

    const newUser = {
      id: createId(),
      name: form.name.trim(),
      email: result.normalized?.email ?? email,
      phone: result.normalized?.phone ?? normalizePhone(form.phone),
      idNumber: result.normalized?.idNumber ?? normalizeIdNumber(form.idNumber),
      password: form.password.trim(),
      emailVerified: false,
      verificationToken: result.verificationToken ?? verificationToken,
      active: true,
    };

    updateState((prev) => ({
      ...prev,
      clientUsers: [...prev.clientUsers, newUser],
    }));

    if (result.emailSent) {
      setNotice("Te enviamos un email para confirmar tu cuenta. Revisá tu casilla.");
      setIsSubmitting(false);
      return;
    }

    setNotice(result.emailMessage || "Cuenta creada. Falta configurar el proveedor de email.");
    window.setTimeout(() => {
      window.location.href = `/confirmar?token=${encodeURIComponent(
        newUser.verificationToken ?? ""
      )}`;
    }, 900);
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
                  onChange={(event) => setField("name", event.target.value)}
                  onBlur={() => validateField("name")}
                  className={`w-full rounded-xl border bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none ${
                    errors.name ? "border-error" : "border-outline-variant/40"
                  }`}
                />
                {errors.name ? <span className="text-xs normal-case tracking-normal text-error">{errors.name}</span> : null}
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Email
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => setField("email", event.target.value)}
                  onBlur={() => validateField("email")}
                  className={`w-full rounded-xl border bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none ${
                    errors.email ? "border-error" : "border-outline-variant/40"
                  }`}
                />
                {errors.email ? <span className="text-xs normal-case tracking-normal text-error">{errors.email}</span> : null}
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Confirmar email
                <input
                  required
                  type="email"
                  value={emailConfirm}
                  onChange={(event) => {
                    setEmailConfirm(event.target.value);
                    setErrors((prev) => ({ ...prev, emailConfirm: undefined, form: undefined }));
                  }}
                  onBlur={() => validateField("emailConfirm")}
                  className={`w-full rounded-xl border bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none ${
                    errors.emailConfirm ? "border-error" : "border-outline-variant/40"
                  }`}
                />
                {errors.emailConfirm ? <span className="text-xs normal-case tracking-normal text-error">{errors.emailConfirm}</span> : null}
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Teléfono
                <input
                  required
                  value={form.phone}
                  onChange={(event) => setField("phone", event.target.value)}
                  onBlur={() => validateField("phone")}
                  className={`w-full rounded-xl border bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none ${
                    errors.phone ? "border-error" : "border-outline-variant/40"
                  }`}
                />
                {errors.phone ? <span className="text-xs normal-case tracking-normal text-error">{errors.phone}</span> : null}
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                DNI / CUIL / CUIT
                <input
                  required
                  value={form.idNumber}
                  onChange={(event) =>
                    setField("idNumber", event.target.value)
                  }
                  onBlur={() => validateField("idNumber")}
                  className={`w-full rounded-xl border bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none ${
                    errors.idNumber ? "border-error" : "border-outline-variant/40"
                  }`}
                />
                {errors.idNumber ? <span className="text-xs normal-case tracking-normal text-error">{errors.idNumber}</span> : null}
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Contraseña
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setField("password", event.target.value)
                  }
                  onBlur={() => validateField("password")}
                  className={`w-full rounded-xl border bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none ${
                    errors.password ? "border-error" : "border-outline-variant/40"
                  }`}
                />
                {errors.password ? <span className="text-xs normal-case tracking-normal text-error">{errors.password}</span> : null}
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Confirmar contraseña
                <input
                  required
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) => {
                    setPasswordConfirm(event.target.value);
                    setErrors((prev) => ({ ...prev, passwordConfirm: undefined, form: undefined }));
                  }}
                  onBlur={() => validateField("passwordConfirm")}
                  className={`w-full rounded-xl border bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none ${
                    errors.passwordConfirm ? "border-error" : "border-outline-variant/40"
                  }`}
                />
                {errors.passwordConfirm ? <span className="text-xs normal-case tracking-normal text-error">{errors.passwordConfirm}</span> : null}
              </label>
              {errors.form ? <p className="rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">{errors.form}</p> : null}
              {notice ? <p className="rounded-2xl bg-primary/10 px-4 py-3 text-sm text-primary">{notice}</p> : null}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary disabled:opacity-60"
                style={{ color: "var(--color-on-primary)" }}
              >
                {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
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
