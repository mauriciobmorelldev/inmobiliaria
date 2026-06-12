import {
  priceUnitLabels,
  propertyTypeLabels,
  statusLabels,
  type AdminRole,
  type Agent,
  type ClientContractStatus,
  type ClientContractType,
  type FilterGroup,
  type Listing,
  type PriceCurrency,
  type PriceUnit,
  type PropertyStatus,
  type PropertyType,
} from "./inmoData";
import { currencyOptions } from "./pricing";

export type ListingFormState = {
  title: string;
  type: PropertyType;
  status: PropertyStatus;
  price: string;
  priceUnit: PriceUnit;
  currency: PriceCurrency;
  neighborhood: string;
  area: string;
  rooms: string;
  tag: string;
  highlight: string;
  description: string;
  images: string[];
  videos: string[];
  coverIndex: number;
  agentId: string;
  attributes: Record<string, string[]>;
};

export type AgentFormState = {
  name: string;
  role: string;
  phone: string;
  email: string;
  photo?: string;
};

export type AdminUserFormState = {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  active: boolean;
};

export type ClientUserFormState = {
  name: string;
  email: string;
  password: string;
  phone: string;
  idNumber: string;
  active: boolean;
};

export type ClientContractFormState = {
  clientId: string;
  listingId: string;
  type: ClientContractType;
  status: ClientContractStatus;
  startDate: string;
  endDate: string;
  monthlyAmount: string;
  totalInstallments: string;
  paidInstallments: string;
  notes: string;
  paymentMethods: string[];
};

export type LeadFormState = {
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  agentId: string;
  status: "nuevo" | "visita" | "reservado" | "cerrado";
  notes: string;
};

export const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export const typeOptions = Object.entries(propertyTypeLabels).map(([id, label]) => ({
  id: id as PropertyType,
  label,
}));

export const statusOptions = Object.entries(statusLabels).map(([id, label]) => ({
  id: id as PropertyStatus,
  label,
}));

export const priceUnitOptions = Object.entries(priceUnitLabels).map(([id, label]) => ({
  id: id as PriceUnit,
  label,
}));

export { currencyOptions };

export const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const toNumber = (value: string) => {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildEmptyAttributes = (groups: FilterGroup[]) =>
  Object.fromEntries(groups.map((group) => [group.id, []]));

export const getListingForm = (listing: Listing): ListingFormState => ({
  title: listing.title,
  type: listing.type,
  status: listing.status,
  price: String(listing.price),
  priceUnit: listing.priceUnit,
  currency: listing.currency ?? "ARS",
  neighborhood: listing.neighborhood,
  area: String(listing.area),
  rooms: String(listing.rooms),
  tag: listing.tag,
  highlight: listing.highlight,
  description: listing.description,
  images: listing.images,
  videos: listing.videos ?? [],
  coverIndex: listing.coverIndex,
  agentId: listing.agentId ?? "",
  attributes: { ...listing.attributes },
});

export const normalizeListing = (form: ListingFormState, id: string): Listing => ({
  id,
  title: form.title.trim(),
  type: form.type,
  status: form.status,
  price: toNumber(form.price),
  priceUnit: form.priceUnit,
  currency: form.currency,
  neighborhood: form.neighborhood.trim(),
  area: toNumber(form.area),
  rooms: Math.max(0, Math.round(toNumber(form.rooms))),
  tag: form.tag.trim(),
  highlight: form.highlight.trim(),
  description: form.description.trim(),
  images: form.images,
  videos: form.videos.filter(Boolean),
  coverIndex: Math.min(
    Math.max(form.coverIndex, 0),
    Math.max(form.images.length - 1, 0)
  ),
  agentId: form.agentId || undefined,
  attributes: form.attributes,
});

export const getEmptyListingForm = (
  groups: FilterGroup[],
  agents: Agent[]
): ListingFormState => ({
  title: "",
  type: "tradicional",
  status: "disponible",
  price: "",
  priceUnit: "venta",
  currency: "USD",
  neighborhood: "",
  area: "",
  rooms: "",
  tag: "",
  highlight: "",
  description: "",
  images: [],
  videos: [],
  coverIndex: 0,
  agentId: agents[0]?.id ?? "",
  attributes: buildEmptyAttributes(groups),
});

export const getEmptyAgentForm = (): AgentFormState => ({
  name: "",
  role: "",
  phone: "",
  email: "",
});

export const getEmptyAdminForm = (): AdminUserFormState => ({
  name: "",
  email: "",
  password: "",
  role: "colaborador",
  active: true,
});

export const getEmptyClientForm = (): ClientUserFormState => ({
  name: "",
  email: "",
  password: "",
  phone: "",
  idNumber: "",
  active: true,
});

export const getEmptyContractForm = (): ClientContractFormState => ({
  clientId: "",
  listingId: "",
  type: "alquiler",
  status: "activo",
  startDate: "",
  endDate: "",
  monthlyAmount: "",
  totalInstallments: "",
  paidInstallments: "",
  notes: "",
  paymentMethods: [],
});

export const getEmptyLeadForm = (): LeadFormState => ({
  name: "",
  email: "",
  phone: "",
  propertyId: "",
  agentId: "",
  status: "nuevo",
  notes: "",
});

export const enrichListingAttributes = (
  prevAttributes: Record<string, string[]>,
  filterGroups: FilterGroup[]
) => ({ ...buildEmptyAttributes(filterGroups), ...prevAttributes });

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const hexColorPattern = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const onlyDigits = (value: string) => value.replace(/\D/g, "");

export const isValidEmail = (value: string) => emailPattern.test(value.trim());

export const normalizePhone = (value: string) =>
  value
    .trim()
    .replace(/[^\d+]/g, "")
    .replace(/(?!^)\+/g, "");

export const normalizeIdNumber = (value: string) => onlyDigits(value);

const cuitCheckDigit = (digits: string) => {
  if (digits.length !== 11) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const numbers = digits.split("").map((n) => Number(n));
  const sum = weights.reduce((acc, weight, idx) => acc + weight * numbers[idx], 0);
  const mod = 11 - (sum % 11);
  const expected = mod === 11 ? 0 : mod === 10 ? 9 : mod;
  return numbers[10] === expected;
};

export const validateIdNumber = (value: string) => {
  const digits = normalizeIdNumber(value);
  if (!digits) return "Ingresá DNI / CUIL / CUIT.";
  if (digits.length === 8) return "";
  if (digits.length === 11) {
    if (!cuitCheckDigit(digits)) return "CUIL/CUIT inválido (dígito verificador).";
    return "";
  }
  return "El documento debe tener 8 (DNI) u 11 (CUIL/CUIT) dígitos.";
};

export const validateListingForm = (form: ListingFormState) => {
  const errors: string[] = [];
  if (!form.title.trim()) errors.push("Ingresá un título de propiedad.");
  if (!form.neighborhood.trim()) errors.push("Ingresá el barrio o ubicación.");
  if (!form.description.trim()) errors.push("Completá una descripción comercial.");
  if (toNumber(form.price) <= 0) errors.push("El precio debe ser mayor a 0.");
  if (toNumber(form.area) <= 0) errors.push("La superficie debe ser mayor a 0.");
  if (toNumber(form.rooms) <= 0) errors.push("Los ambientes deben ser mayor a 0.");
  if (!form.images.length) errors.push("Cargá al menos una imagen.");
  return errors;
};

export const validateAgentForm = (form: AgentFormState) => {
  const errors: string[] = [];
  if (!form.name.trim()) errors.push("Ingresá el nombre del corredor.");
  if (!normalizePhone(form.phone)) errors.push("Ingresá un teléfono válido.");
  if (!isValidEmail(form.email)) errors.push("Ingresá un email válido.");
  return errors;
};

export const validateBrandingForm = ({
  name,
  primary,
  secondary,
}: {
  name: string;
  primary: string;
  secondary: string;
}) => {
  const errors: string[] = [];
  if (!name.trim()) errors.push("Ingresá el nombre comercial.");
  if (!hexColorPattern.test(primary.trim()))
    errors.push("El color primario debe ser hexadecimal (ej: #07160d).");
  if (!hexColorPattern.test(secondary.trim()))
    errors.push("El color secundario debe ser hexadecimal (ej: #515f78).");
  return errors;
};

export const validateAdminUserForm = (
  form: AdminUserFormState,
  opts?: { passwordOptional?: boolean }
) => {
  const errors: string[] = [];
  if (!form.name.trim()) errors.push("Ingresá el nombre del administrador.");
  if (!isValidEmail(form.email)) errors.push("Ingresá un email válido.");
  if (!opts?.passwordOptional && form.password.trim().length < 6) {
    errors.push("La contraseña debe tener al menos 6 caracteres.");
  }
  if (opts?.passwordOptional && form.password.trim() && form.password.trim().length < 6) {
    errors.push("Si cambiás la contraseña, debe tener al menos 6 caracteres.");
  }
  return errors;
};

export const validateClientUserForm = (
  form: ClientUserFormState,
  opts?: { passwordOptional?: boolean }
) => {
  const errors: string[] = [];
  if (!form.name.trim()) errors.push("Ingresá nombre y apellido.");
  if (!isValidEmail(form.email)) errors.push("Ingresá un email válido.");
  if (!normalizePhone(form.phone)) errors.push("Ingresá un teléfono válido.");
  const idError = validateIdNumber(form.idNumber);
  if (idError) errors.push(idError);
  if (!opts?.passwordOptional && form.password.trim().length < 6) {
    errors.push("La contraseña debe tener al menos 6 caracteres.");
  }
  if (opts?.passwordOptional && form.password.trim() && form.password.trim().length < 6) {
    errors.push("Si cambiás la contraseña, debe tener al menos 6 caracteres.");
  }
  return errors;
};

export const validateClientContractForm = (form: ClientContractFormState) => {
  const errors: string[] = [];
  if (!form.clientId) errors.push("Seleccioná el cliente.");
  if (!form.startDate) errors.push("Indicá la fecha de inicio.");

  const monthlyAmount = toNumber(form.monthlyAmount);
  if (monthlyAmount <= 0) errors.push("El monto mensual debe ser mayor a 0.");

  const totalInstallments = Math.max(0, Math.round(toNumber(form.totalInstallments)));
  const paidInstallments = Math.max(0, Math.round(toNumber(form.paidInstallments)));

  if (form.type === "pozo" && totalInstallments <= 0) {
    errors.push("Para contratos en pozo, cargá la cantidad de cuotas.");
  }
  if (form.type === "pozo" && paidInstallments > totalInstallments) {
    errors.push("Las cuotas pagas no pueden superar el total de cuotas.");
  }

  return errors;
};

export const validateLeadForm = (form: LeadFormState) => {
  const errors: string[] = [];
  if (!form.name.trim()) errors.push("Ingresá el nombre del lead.");
  if (!isValidEmail(form.email)) errors.push("Ingresá un email válido.");
  if (!normalizePhone(form.phone)) errors.push("Ingresá un teléfono válido.");
  return errors;
};
