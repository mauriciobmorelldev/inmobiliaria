"use client";

import { useCallback, useEffect, useState } from "react";
import type { InmoState } from "./inmoData";
import { defaultState, STATE_VERSION } from "./inmoData";

const STORAGE_KEY = "inmo-demo-state/v2";
const UPDATE_EVENT = "inmo:updated";

const isBrowser = typeof window !== "undefined";
let inMemoryState: InmoState | null = null;

const safeParse = (value: string | null) => {
  if (!value) return null;
  try {
    return JSON.parse(value) as Partial<InmoState>;
  } catch (error) {
    console.warn("No se pudo leer el estado guardado", error);
    return null;
  }
};

const readStorage = () => {
  if (!isBrowser) return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Storage no disponible, usando memoria", error);
    return null;
  }
};

const writeStorage = (value: string) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch (error) {
    console.warn("No se pudo guardar en storage, usando memoria", error);
  }
};

const mergeState = (base: InmoState, incoming: Partial<InmoState>): InmoState => {
  const merged: InmoState = {
    ...base,
    ...incoming,
    version: STATE_VERSION,
    theme: {
      ...base.theme,
      ...(incoming.theme ?? {}),
    },
    adminUsers: Array.isArray(incoming.adminUsers)
      ? incoming.adminUsers
      : base.adminUsers,
    clientUsers: Array.isArray(incoming.clientUsers)
      ? incoming.clientUsers.map((client) => ({
          ...client,
          idNumber: client.idNumber ?? "",
          emailVerified: client.emailVerified ?? true,
          active: client.active ?? true,
        }))
      : base.clientUsers,
    clientContracts: Array.isArray(incoming.clientContracts)
      ? incoming.clientContracts.map((contract) => ({
          ...contract,
          payments: contract.payments ?? [],
          paymentMethods: contract.paymentMethods ?? [],
        }))
      : base.clientContracts,
    leads: Array.isArray(incoming.leads)
      ? incoming.leads
      : base.leads,
    agents: Array.isArray(incoming.agents) ? incoming.agents : base.agents,
    filterGroups: Array.isArray(incoming.filterGroups)
      ? incoming.filterGroups
      : base.filterGroups,
    listings: Array.isArray(incoming.listings) ? incoming.listings : base.listings,
  };

  return merged;
};

export const loadState = (): InmoState => {
  if (!isBrowser) return defaultState;
  if (inMemoryState) {
    if (inMemoryState.version === STATE_VERSION) return inMemoryState;
    inMemoryState = null;
  }
  const stored = safeParse(readStorage());
  if (!stored || stored.version !== STATE_VERSION) return defaultState;
  return mergeState(defaultState, stored);
};

export const saveState = (state: InmoState) => {
  if (!isBrowser) return;
  inMemoryState = state;
  writeStorage(JSON.stringify(state));

  // Dispatch async to avoid cross-component setState while React is rendering.
  const notify = () => window.dispatchEvent(new Event(UPDATE_EVENT));
  if (typeof queueMicrotask === "function") {
    queueMicrotask(notify);
    return;
  }
  window.setTimeout(notify, 0);
};

export const resetState = () => {
  inMemoryState = defaultState;
  saveState(defaultState);
};

export const useInmoStore = () => {
  const [state, setState] = useState<InmoState>(defaultState);

  useEffect(() => {
    const hydrate = () => setState(loadState());
    if (typeof queueMicrotask === "function") {
      queueMicrotask(hydrate);
    } else {
      window.setTimeout(hydrate, 0);
    }
    const handleUpdate = () => {
      setState(loadState());
    };

    window.addEventListener(UPDATE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(UPDATE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const updateState = useCallback(
    (updater: InmoState | ((prev: InmoState) => InmoState)) => {
      setState((prev) => {
        const nextState =
          typeof updater === "function" ? updater(prev) : updater;
        saveState(nextState);
        return nextState;
      });
    },
    []
  );

  const reset = useCallback(() => {
    resetState();
    setState(defaultState);
  }, []);

  return { state, updateState, reset };
};
