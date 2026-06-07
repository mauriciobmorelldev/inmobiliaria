import type { CSSProperties } from "react";
import type { ThemeSettings } from "./inmoData";

const fallbackTheme = {
  primary: "#1b365d",
  secondary: "#2f5da1",
  accent: "#fff3c2",
  dark: "#2e2e2e",
  neutral: "#e6c88f",
  surface: "#ffffff",
};

const designTokens = {
  primary: "#1b365d",
  secondary: "#2f5da1",
  accent: "#fff3c2",
  dark: "#2e2e2e",
  neutral: "#e6c88f",
  surface: "#ffffff",
  primaryContainer: "#132844",
  primaryFixed: "#fff3c2",
  primaryFixedDim: "#e6c88f",
  secondaryContainer: "#d8e5ff",
  secondaryFixed: "#d8e5ff",
  secondaryFixedDim: "#a8c4f6",
  onPrimary: "#ffffff",
  onPrimaryContainer: "#fff3c2",
  onPrimaryFixed: "#1b365d",
  onSecondary: "#ffffff",
  onSecondaryContainer: "#1b365d",
  onSecondaryFixed: "#1b365d",
};

const normalizeHex = (value: string | undefined, fallback: string) => {
  if (!value) return fallback;
  const trimmed = value.trim();
  const isValid = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed);
  return isValid ? trimmed : fallback;
};

const hexToRgb = (hex: string) => {
  const clean = hex.replace("#", "");
  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : clean;
  const int = parseInt(normalized, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((value) => Math.max(0, Math.min(255, Math.round(value))))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;

const luminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map((value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

const rgbToHsl = (r: number, g: number, b: number) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h, s, l };
};

const hslToRgb = (h: number, s: number, l: number) => {
  if (s === 0) {
    return { r: l, g: l, b: l };
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: hue2rgb(p, q, h + 1 / 3),
    g: hue2rgb(p, q, h),
    b: hue2rgb(p, q, h - 1 / 3),
  };
};

const setLightness = (hex: string, targetL: number) => {
  const { r, g, b } = hexToRgb(hex);
  const { h, s } = rgbToHsl(r / 255, g / 255, b / 255);
  const { r: rr, g: gg, b: bb } = hslToRgb(h, s, targetL);
  return rgbToHex(rr * 255, gg * 255, bb * 255);
};

export const buildThemeStyles = (theme: ThemeSettings): CSSProperties => {
  const primary = normalizeHex(theme.primary, fallbackTheme.primary);
  const secondary = normalizeHex(theme.secondary, fallbackTheme.secondary);
  const accent = normalizeHex(theme.accent, fallbackTheme.accent);
  const neutral = normalizeHex(theme.neutral, fallbackTheme.neutral);
  const dark = normalizeHex(theme.dark, fallbackTheme.dark);
  const surface = normalizeHex(theme.surface, fallbackTheme.surface);
  const isDefault =
    primary.toLowerCase() === designTokens.primary &&
    secondary.toLowerCase() === designTokens.secondary &&
    accent.toLowerCase() === designTokens.accent;

  if (isDefault) {
    return {
      "--accent": designTokens.primary,
      "--accent-2": designTokens.secondary,
      "--accent-3": designTokens.accent,
      "--accent-4": designTokens.neutral,
      "--brand-dark": designTokens.dark,
      "--brand-surface": designTokens.surface,
      "--color-primary": designTokens.primary,
      "--color-primary-container": designTokens.primaryContainer,
      "--color-primary-fixed": designTokens.primaryFixed,
      "--color-primary-fixed-dim": designTokens.primaryFixedDim,
      "--color-secondary": designTokens.secondary,
      "--color-secondary-container": designTokens.secondaryContainer,
      "--color-secondary-fixed": designTokens.secondaryFixed,
      "--color-secondary-fixed-dim": designTokens.secondaryFixedDim,
      "--color-on-primary": designTokens.onPrimary,
      "--color-on-primary-container": designTokens.onPrimaryContainer,
      "--color-on-primary-fixed": designTokens.onPrimaryFixed,
      "--color-on-secondary": designTokens.onSecondary,
      "--color-on-secondary-container": designTokens.onSecondaryContainer,
      "--color-on-secondary-fixed": designTokens.onSecondaryFixed,
    } as CSSProperties;
  }

  const onPrimary = luminance(primary) > 0.65 ? "#1b1b1c" : "#ffffff";
  const onSecondary = luminance(secondary) > 0.65 ? "#1b1b1c" : "#ffffff";
  const { r: pr, g: pg, b: pb } = hexToRgb(primary);
  const { r: sr, g: sg, b: sb } = hexToRgb(secondary);
  const baseL = rgbToHsl(pr / 255, pg / 255, pb / 255).l;
  const secondaryL = rgbToHsl(sr / 255, sg / 255, sb / 255).l;
  const primaryContainer = setLightness(
    primary,
    baseL > 0.55 ? Math.max(0.22, baseL - 0.28) : Math.min(0.22, baseL + 0.18)
  );
  const secondaryContainer = setLightness(
    secondary,
    secondaryL > 0.55
      ? Math.max(0.22, secondaryL - 0.28)
      : Math.min(0.26, secondaryL + 0.2)
  );
  const primaryFixed = setLightness(primary, 0.86);
  const primaryFixedDim = setLightness(primary, 0.74);
  const secondaryFixed = setLightness(secondary, 0.86);
  const secondaryFixedDim = setLightness(secondary, 0.74);
  const onPrimaryFixed = luminance(primaryFixed) > 0.65 ? "#1b1b1c" : "#ffffff";
  const onSecondaryFixed =
    luminance(secondaryFixed) > 0.65 ? "#1b1b1c" : "#ffffff";
  const onPrimaryContainer =
    luminance(primaryContainer) > 0.55 ? "#1b1b1c" : "#ffffff";
  const onSecondaryContainer =
    luminance(secondaryContainer) > 0.55 ? "#1b1b1c" : "#ffffff";

  return {
    "--accent": primary,
    "--accent-2": secondary,
    "--accent-3": accent,
    "--accent-4": neutral,
    "--brand-dark": dark,
    "--brand-surface": surface,
    "--color-primary": primary,
    "--color-primary-container": primaryContainer,
    "--color-primary-fixed": primaryFixed,
    "--color-primary-fixed-dim": primaryFixedDim,
    "--color-secondary": secondary,
    "--color-secondary-container": secondaryContainer,
    "--color-secondary-fixed": secondaryFixed,
    "--color-secondary-fixed-dim": secondaryFixedDim,
    "--color-on-primary": onPrimary,
    "--color-on-primary-container": onPrimaryContainer,
    "--color-on-primary-fixed": onPrimaryFixed,
    "--color-on-secondary": onSecondary,
    "--color-on-secondary-container": onSecondaryContainer,
    "--color-on-secondary-fixed": onSecondaryFixed,
  } as CSSProperties;
};
