import type { PropertyStatus } from "@/lib/inmoData";

export const getAvailability = (status: PropertyStatus) => {
  const isAvailable = status === "disponible";
  return {
    isAvailable,
    label: isAvailable ? "Disponible" : "No disponible",
    dotClassName: isAvailable ? "bg-emerald-500" : "bg-red-500",
    badgeClassName: isAvailable
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-red-200 bg-red-50 text-red-700",
    softClassName: isAvailable
      ? "bg-emerald-500/12 text-emerald-700"
      : "bg-red-500/12 text-red-700",
    rgb: isAvailable
      ? { r: 22, g: 163, b: 74 }
      : { r: 220, g: 38, b: 38 },
  };
};
