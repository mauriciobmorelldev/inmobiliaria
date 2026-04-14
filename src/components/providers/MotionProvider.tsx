"use client";

import { MotionConfig, useReducedMotion } from "motion/react";
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

export type ReducedMotionPolicy = "user" | "always" | "never";

type MotionContextValue = {
  reducedMotion: boolean;
  policy: ReducedMotionPolicy;
};

const MotionContext = createContext<MotionContextValue>({
  reducedMotion: false,
  policy: "user",
});

export default function MotionProvider({
  children,
  reducedMotionPolicy = "user",
}: {
  children: ReactNode;
  reducedMotionPolicy?: ReducedMotionPolicy;
}) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const reducedMotion =
    reducedMotionPolicy === "always"
      ? true
      : reducedMotionPolicy === "never"
        ? false
        : prefersReducedMotion;

  const value = useMemo(
    () => ({ reducedMotion, policy: reducedMotionPolicy }),
    [reducedMotion, reducedMotionPolicy]
  );

  return (
    <MotionConfig reducedMotion={reducedMotionPolicy}>
      <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
    </MotionConfig>
  );
}

export function useSiteMotion() {
  return useContext(MotionContext);
}
