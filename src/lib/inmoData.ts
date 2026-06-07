export type PropertyType = "tradicional" | "temporario" | "pozo" | "listo";
export type PropertyStatus = "disponible" | "pausado" | "reservado" | "vendido";
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
  accent?: string;
  dark?: string;
  neutral?: string;
  surface?: string;
  logo?: string;
  heroImage?: string;
};

export type HomeBanner = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  ctaLabel: string;
  ctaHref: string;
  active: boolean;
};

export type HomeContent = {
  eyebrow: string;
  title: string;
  italicTitle: string;
  subtitle: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  statsTitle: string;
  featuredTitle: string;
  featuredSubtitle: string;
  teamTitle: string;
  teamSubtitle: string;
  recentTitle: string;
  recentSubtitle: string;
  banners: HomeBanner[];
};

export type AdminRole = "owner" | "colaborador";

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

export type PropertyFavorite = {
  id: string;
  clientId: string;
  propertyId: string;
  createdAt: string;
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
  clientId?: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
};

export type LeadEvent = {
  id: string;
  leadId: string;
  fromStatus?: LeadStatus;
  toStatus: LeadStatus;
  note?: string;
  createdAt: string;
};

export type PropertyMetric = {
  id: string;
  propertyId: string;
  views: number;
  leads: number;
  favorites: number;
  lastViewedAt?: string;
};

export type ToccoSyncLog = {
  id: string;
  status: "mocked" | "success" | "failed";
  message: string;
  importedCount: number;
  startedAt: string;
  finishedAt: string;
};

export type Listing = {
  id: string;
  createdByAdminId?: string;
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

export const STATE_VERSION = 3;

export type InmoState = {
  version: number;
  theme: ThemeSettings;
  homeContent: HomeContent;
  adminUsers: AdminUser[];
  clientUsers: ClientUser[];
  clientContracts: ClientContract[];
  propertyFavorites: PropertyFavorite[];
  leads: Lead[];
  leadEvents: LeadEvent[];
  propertyMetrics: PropertyMetric[];
  toccoSyncLogs: ToccoSyncLog[];
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
  pausado: "Pausado",
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
    name: "Connexa",
    primary: "#1b365d",
    secondary: "#2f5da1",
    accent: "#fff3c2",
    dark: "#2e2e2e",
    neutral: "#e6c88f",
    surface: "#ffffff",
    heroImage: "",
  },
  homeContent: {
    eyebrow: "Connexa Real Estate",
    title: "Connexa",
    italicTitle: "propiedades inteligentes.",
    subtitle:
      "Curamos propiedades con criterio comercial, experiencia digital clara y seguimiento operativo para compradores, inversores y clientes finales.",
    primaryCtaLabel: "Explorar catálogo",
    primaryCtaHref: "/propiedades",
    secondaryCtaLabel: "Acceso clientes",
    secondaryCtaHref: "/acceso",
    statsTitle: "Inventario vivo",
    featuredTitle: "Selecciones Curadas",
    featuredSubtitle:
      "Fichas con contexto comercial y visión de uso real, no solo fotos bonitas.",
    teamTitle: "Equipo y Barrios",
    teamSubtitle: "Explorá el equipo comercial y las zonas con más movimiento.",
    recentTitle: "Incorporaciones recientes",
    recentSubtitle: "Últimas propiedades agregadas desde el panel administrativo.",
    banners: [
      {
        id: "home-banner-1",
        title: "Propiedades premium listas para visitar",
        subtitle: "Destacá oportunidades, lanzamientos o campañas desde el panel.",
        image: "",
        ctaLabel: "Ver propiedades",
        ctaHref: "/propiedades",
        active: true,
      },
    ],
  },
  adminUsers: [
    {
      id: "admin-owner",
      name: "Admin Principal",
      email: "admin@connexa.demo",
      password: "demo123",
      role: "owner",
      active: true,
    },
  ],
  clientUsers: [],
  clientContracts: [],
  propertyFavorites: [],
  leads: [],
  leadEvents: [],
  propertyMetrics: [],
  toccoSyncLogs: [],
  agents: [],
  filterGroups: [],
  listings: [],
};
