export type PropertyType = "tradicional" | "temporario" | "pozo" | "listo";
export type PropertyStatus = "disponible" | "reservado" | "vendido";
export type PriceUnit = "venta" | "mensual" | "noche";
export type FilterMode = "single" | "multi";

export type FilterGroup = {
  id: string;
  label: string;
  options: string[];
  mode: FilterMode;
};

export type Agent = {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  photo?: string;
};

export type ThemeSettings = {
  name: string;
  primary: string;
  secondary: string;
  logo?: string;
  heroImage?: string;
};

export type AdminRole = "owner" | "editor";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  active: boolean;
};

export type ClientUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  idNumber: string;
  emailVerified: boolean;
  verificationToken?: string;
  active: boolean;
};

export type ClientContractType = "alquiler" | "pozo";
export type ClientContractStatus = "activo" | "finalizado" | "en_mora";

export type ClientContract = {
  id: string;
  clientId: string;
  listingId?: string;
  type: ClientContractType;
  status: ClientContractStatus;
  startDate: string;
  endDate?: string;
  monthlyAmount: number;
  totalInstallments?: number;
  paidInstallments?: number;
  notes?: string;
  paymentMethods?: string[];
  payments?: {
    id: string;
    date: string;
    amount: number;
    method: string;
  }[];
};

export type LeadStatus = "nuevo" | "visita" | "reservado" | "cerrado";

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId?: string;
  agentId?: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
};

export type Listing = {
  id: string;
  title: string;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  priceUnit: PriceUnit;
  neighborhood: string;
  area: number;
  rooms: number;
  tag: string;
  highlight: string;
  description: string;
  images: string[];
  videos?: string[];
  coverIndex: number;
  agentId?: string;
  attributes: Record<string, string[]>;
};

export const STATE_VERSION = 2;

export type InmoState = {
  version: number;
  theme: ThemeSettings;
  adminUsers: AdminUser[];
  clientUsers: ClientUser[];
  clientContracts: ClientContract[];
  leads: Lead[];
  agents: Agent[];
  filterGroups: FilterGroup[];
  listings: Listing[];
};

export const propertyTypeLabels: Record<PropertyType, string> = {
  tradicional: "Tradicional",
  temporario: "Temporario",
  pozo: "En pozo",
  listo: "Listo",
};

export const statusLabels: Record<PropertyStatus, string> = {
  disponible: "Disponible",
  reservado: "Reservado",
  vendido: "Vendido",
};

export const priceUnitLabels: Record<PriceUnit, string> = {
  venta: "Venta",
  mensual: "Mensual",
  noche: "Por noche",
};

export const defaultState: InmoState = {
  version: STATE_VERSION,
  theme: {
    name: "Inmobiliaria Demo",
    primary: "#07160d",
    secondary: "#515f78",
    heroImage: "",
  },
  adminUsers: [
    {
      id: "admin-owner",
      name: "Admin Principal",
      email: "admin@inmo.demo",
      password: "demo123",
      role: "owner",
      active: true,
    },
  ],
  clientUsers: [],
  clientContracts: [],
  leads: [],
  agents: [],
  filterGroups: [],
  listings: [],
};
