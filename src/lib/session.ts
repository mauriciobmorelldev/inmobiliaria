"use client";

export const ADMIN_SESSION_KEY = "inmo-admin-session/v1";
export const CLIENT_SESSION_KEY = "inmo-client-session/v1";

export type AdminSession = {
  adminId: string;
  email: string;
  issuedAt: string;
};

export type ClientSession = {
  clientId: string;
  email: string;
  issuedAt: string;
};

const isBrowser = typeof window !== "undefined";

const safeRead = <T>(key: string): T | null => {
  if (!isBrowser) return null;
  try {
    const value = window.localStorage.getItem(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn("No se pudo leer sesión de storage", error);
    return null;
  }
};

const safeWrite = (key: string, value: unknown) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("No se pudo guardar sesión en storage", error);
  }
};

const safeRemove = (key: string) => {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn("No se pudo eliminar sesión de storage", error);
  }
};

export const readAdminSession = () => safeRead<AdminSession>(ADMIN_SESSION_KEY);
export const writeAdminSession = (value: AdminSession) =>
  safeWrite(ADMIN_SESSION_KEY, value);
export const clearAdminSession = () => safeRemove(ADMIN_SESSION_KEY);

export const readClientSession = () => safeRead<ClientSession>(CLIENT_SESSION_KEY);
export const writeClientSession = (value: ClientSession) =>
  safeWrite(CLIENT_SESSION_KEY, value);
export const clearClientSession = () => safeRemove(CLIENT_SESSION_KEY);
