"use client";

import { useEffect, useState } from "react";
import { useSiteMotion } from "@/components/providers/MotionProvider";

export type ScrollToTopProps = {
  showAfterPx?: number;
  behavior?: ScrollBehavior;
  className?: string;
};

export default function ScrollToTop({
  showAfterPx = 400,
  behavior = "smooth",
  className,
}: ScrollToTopProps) {
  const [visible, setVisible] = useState(false);
  const { reducedMotion } = useSiteMotion();

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setVisible(window.scrollY > showAfterPx);
        ticking = false;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showAfterPx]);

  if (!visible) return null;

  const scrollBehavior = reducedMotion ? "auto" : behavior;

  return (
    <button
      type="button"
      className={`scroll-to-top ${className ?? ""}`}
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: scrollBehavior,
        })
      }
      aria-label="Volver arriba"
    >
      ↑ Arriba
    </button>
  );
}
