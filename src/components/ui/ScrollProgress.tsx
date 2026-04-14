"use client";

import { useEffect, useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { useSiteMotion } from "@/components/providers/MotionProvider";

export type ScrollProgressProps = {
  variant?: "bar" | "pill" | "text";
  position?: "top" | "bottom";
  showPercent?: boolean;
  className?: string;
};

export default function ScrollProgress({
  variant = "bar",
  position = "top",
  showPercent = false,
  className,
}: ScrollProgressProps) {
  const [progress, setProgress] = useState(0);
  const { reducedMotion } = useSiteMotion();
  const { scrollYProgress } = useScroll();

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const value = Number.isFinite(latest) ? latest : 0;
    setProgress(Math.min(Math.max(value, 0), 1));
  });

  useEffect(() => {
    let ticking = false;
    const update = () => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      const value = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      setProgress(Math.min(Math.max(value, 0), 1));
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const percentage = Math.round(progress * 100);
  const placement = position === "bottom" ? "bottom-0" : "top-0";

  if (variant === "text") {
    return (
      <div
        className={`scroll-progress scroll-progress--text ${placement} ${className ?? ""}`}
        aria-hidden={!showPercent}
      >
        {showPercent ? `${percentage}%` : null}
      </div>
    );
  }

  if (variant === "pill") {
    return (
      <div className={`scroll-progress scroll-progress--pill ${placement} ${className ?? ""}`}>
        <span>{percentage}%</span>
        <div className="scroll-progress__pill">
          <div
            className="scroll-progress__fill"
            style={{
              width: `${percentage}%`,
              transition: reducedMotion ? "none" : "width 120ms ease",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`scroll-progress scroll-progress--bar ${placement} ${className ?? ""}`}>
      <div
        className="scroll-progress__bar"
        style={{
          width: `${percentage}%`,
          transition: reducedMotion ? "none" : "width 120ms ease",
        }}
      />
      {showPercent ? (
        <span className="scroll-progress__label">{percentage}%</span>
      ) : null}
    </div>
  );
}
