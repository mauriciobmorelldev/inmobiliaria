"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import AdminShell from "@/components/inmo/admin/AdminShell";
import {
  createId,
  getEmptyAdminForm,
  validateAdminUserForm,
  type AdminUserFormState,
} from "@/lib/adminForms";
import { useInmoStore } from "@/lib/inmoStore";
import { readAdminSession } from "@/lib/session";

export default function AdminAdministradoresPage() {
  const { state, updateState } = useInmoStore();
  const { adminUsers } = state;

  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [adminForm, setAdminForm] = useState<AdminUserFormState>(getEmptyAdminForm());
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [highlightForm, setHighlightForm] = useState(false);

  useEffect(() => {
    if (!highlightForm) return;
    const timeout = window.setTimeout(() => setHighlightForm(false), 1400);
    return () => window.clearTimeout(timeout);
  }, [highlightForm]);

  const currentSession = useMemo(() => readAdminSession(), []);
  const ownerCount = adminUsers.filter((item) => item.role === "owner" && item.active).length;

  const handleAdminSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    setNotice("");

    const errors = validateAdminUserForm(adminForm, {
      passwordOptional: Boolean(editingAdminId),
    });
    if (errors.length) {
      setFormError(errors[0]);
      return;
    }

    const email = adminForm.email.trim().toLowerCase();
    const duplicate = adminUsers.find(
      (admin) =>
        admin.email.trim().toLowerCase() === email && admin.id !== editingAdminId
    );
    if (duplicate) {
      setFormError("Ya existe un administrador con ese email.");
      return;
    }

    updateState((prev) => {
      if (editingAdminId) {
        return {
          ...prev,
          adminUsers: prev.adminUsers.map((admin) => {
            if (admin.id !== editingAdminId) return admin;
            return {
              ...admin,
              name: adminForm.name.trim(),
              email,
              role: adminForm.role,
              active: adminForm.active,
              password: adminForm.password.trim() || admin.password,
            };
          }),
        };
      }

      return {
        ...prev,
        adminUsers: [
          ...prev.adminUsers,
          {
            id: createId(),
            name: adminForm.name.trim(),
            email,
            password: adminForm.password.trim(),
            role: adminForm.role,
            active: adminForm.active,
          },
        ],
      };
    });

    setNotice(editingAdminId ? "Administrador actualizado." : "Administrador creado.");
    setEditingAdminId(null);
    setAdminForm(getEmptyAdminForm());
  };

  const handleEdit = (adminId: string) => {
    const target = adminUsers.find((item) => item.id === adminId);
    if (!target) return;
    setEditingAdminId(adminId);
    setNotice("");
    setFormError("");
    setAdminForm({
      name: target.name,
      email: target.email,
      password: "",
      role: target.role,
      active: target.active,
    });
    setHighlightForm(true);
    document
      .getElementById("form-admin")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDelete = (adminId: string) => {
    const target = adminUsers.find((item) => item.id === adminId);
    if (!target) return;

    if (target.role === "owner" && ownerCount <= 1) {
      setFormError("Debe existir al menos un administrador Owner activo.");
      return;
    }

    if (currentSession?.adminId === adminId) {
      setFormError("No podés eliminar tu propio usuario activo.");
      return;
    }

    updateState((prev) => ({
      ...prev,
      adminUsers: prev.adminUsers.filter((item) => item.id !== adminId),
    }));
    setNotice("Administrador eliminado.");
  };

  return (
    <AdminShell
      activeSection="administradores"
      title="Administradores"
      primaryAction={{ href: "#form-admin", label: "Nuevo admin" }}
    >
      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
            Administradores
          </p>
          <p className="mt-2 text-3xl font-bold text-primary">{adminUsers.length}</p>
        </div>
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
            Owners activos
          </p>
          <p className="mt-2 text-3xl font-bold text-primary">{ownerCount}</p>
        </div>
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
            Sesión actual
          </p>
          <p className="mt-2 text-sm font-semibold text-primary">
            {currentSession?.email || "Sin sesión"}
          </p>
        </div>
      </section>

      <section
        id="form-admin"
        className={`mt-8 rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)] ${
          highlightForm ? "inmo-edit-highlight" : ""
        }`}
      >
        <h3 className="text-xl font-headline font-bold text-primary">
          {editingAdminId ? "Editar administrador" : "Nuevo administrador"}
        </h3>
        <p className="mt-2 text-xs text-on-surface-variant">
          Creá usuarios de panel con permisos owner o editor.
        </p>

        <form className="mt-6 grid gap-4 sm:max-w-3xl" onSubmit={handleAdminSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Nombre
              <input
                required
                value={adminForm.name}
                onChange={(event) =>
                  setAdminForm((prev) => ({ ...prev, name: event.target.value }))
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
                value={adminForm.email}
                onChange={(event) =>
                  setAdminForm((prev) => ({ ...prev, email: event.target.value }))
                }
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                placeholder="nombre@empresa.com"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Contraseña
              <input
                type="password"
                value={adminForm.password}
                onChange={(event) =>
                  setAdminForm((prev) => ({ ...prev, password: event.target.value }))
                }
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                placeholder={editingAdminId ? "Dejar vacío para conservar" : "Mín. 6 caracteres"}
              />
            </label>
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Rol
              <select
                value={adminForm.role}
                onChange={(event) =>
                  setAdminForm((prev) => ({
                    ...prev,
                    role: event.target.value === "owner" ? "owner" : "editor",
                  }))
                }
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              >
                <option value="owner">Owner</option>
                <option value="editor">Editor</option>
              </select>
            </label>
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Estado
              <select
                value={adminForm.active ? "active" : "inactive"}
                onChange={(event) =>
                  setAdminForm((prev) => ({
                    ...prev,
                    active: event.target.value === "active",
                  }))
                }
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </label>
          </div>

          {formError ? <p className="text-sm text-error">{formError}</p> : null}
          {notice ? <p className="text-sm text-primary">{notice}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-full bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-widest text-on-primary"
              style={{ color: "var(--color-on-primary)" }}
            >
              {editingAdminId ? "Guardar cambios" : "Crear administrador"}
            </button>
            {editingAdminId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingAdminId(null);
                  setAdminForm(getEmptyAdminForm());
                  setFormError("");
                }}
                className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant"
              >
                Cancelar edición
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="mt-8 rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)]">
        <h3 className="text-xl font-headline font-bold text-primary">Equipo administrativo</h3>
        <p className="mt-2 text-xs text-on-surface-variant">
          Usuarios habilitados para acceder al panel.
        </p>

        <div className="mt-6 grid gap-3">
          {adminUsers.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No hay administradores cargados.</p>
          ) : (
            adminUsers.map((admin) => (
              <article
                key={admin.id}
                className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-primary">{admin.name}</p>
                    <p className="text-xs text-on-surface-variant">{admin.email}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-on-surface-variant">
                      {admin.role} · {admin.active ? "Activo" : "Inactivo"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest">
                    <button
                      type="button"
                      onClick={() => handleEdit(admin.id)}
                      className="text-primary"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(admin.id)}
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
