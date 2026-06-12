import type { Listing, PriceCurrency, PriceUnit, ThemeSettings } from "@/lib/inmoData";

const formatters: Record<PriceCurrency, Intl.NumberFormat> = {
  ARS: new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }),
  USD: new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }),
};

export const currencyLabels: Record<PriceCurrency, string> = {
  ARS: "Pesos argentinos",
  USD: "Dólares",
};

export const currencyOptions = Object.entries(currencyLabels).map(([id, label]) => ({
  id: id as PriceCurrency,
  label,
}));

export const getUsdToArsRate = (theme?: Pick<ThemeSettings, "usdToArsRate">) => {
  const rate = Number(theme?.usdToArsRate ?? 1000);
  return Number.isFinite(rate) && rate > 0 ? rate : 1000;
};

export const getComparablePriceInArs = (
  price: number,
  currency: PriceCurrency = "ARS",
  theme?: Pick<ThemeSettings, "usdToArsRate">
) => {
  if (currency === "USD") return price * getUsdToArsRate(theme);
  return price;
};

export const getListingComparablePriceInArs = (
  listing: Pick<Listing, "price" | "currency">,
  theme?: Pick<ThemeSettings, "usdToArsRate">
) => getComparablePriceInArs(listing.price, listing.currency ?? "ARS", theme);

export const formatPrice = (
  price: number,
  priceUnit: PriceUnit,
  currency: PriceCurrency = "ARS"
) => {
  const base = formatters[currency].format(price);
  if (priceUnit === "noche") return `${base} / noche`;
  if (priceUnit === "mensual") return `${base} / mes`;
  return base;
};
