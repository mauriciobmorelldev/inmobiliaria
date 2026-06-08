"use client";

import { useCallback, useEffect, useState } from "react";
import type { InmoState } from "./inmoData";
import { defaultState, STATE_VERSION } from "./inmoData";
import { mergeState } from "./stateMerge";

const STORAGE_KEY = "connexa-state/v4";
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

const fetchRemoteState = async () => {
  try {
    const response = await fetch("/api/inmo-state", {
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as Partial<InmoState>;
  } catch (error) {
    console.warn("No se pudo cargar estado remoto, usando fallback local", error);
    return null;
  }
};

const persistRemoteState = async (state: InmoState) => {
  try {
    await fetch("/api/inmo-state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
  } catch (error) {
    console.warn("No se pudo persistir estado remoto, usando fallback local", error);
  }
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
  void persistRemoteState(state);

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
    const hydrate = async () => {
      const local = loadState();
      setState(local);
      const remote = await fetchRemoteState();
      if (!remote) return;
      const merged = mergeState(defaultState, remote);
      inMemoryState = merged;
      writeStorage(JSON.stringify(merged));
      setState(merged);
    };
    if (typeof queueMicrotask === "function") {
      queueMicrotask(() => void hydrate());
    } else {
      window.setTimeout(() => void hydrate(), 0);
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
