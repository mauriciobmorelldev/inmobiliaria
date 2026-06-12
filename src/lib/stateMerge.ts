import {
  defaultState,
  STATE_VERSION,
  type InmoState,
} from "./inmoData";

const appendLocalOnly = <T extends { id: string }>(incoming: T[], base: T[]) => [
  ...incoming,
  ...base.filter((baseItem) => !incoming.some((item) => item.id === baseItem.id)),
];

export const mergeState = (
  base: InmoState = defaultState,
  incoming: Partial<InmoState>
): InmoState => ({
  ...base,
  ...incoming,
  version: STATE_VERSION,
  theme: {
    ...base.theme,
    ...(incoming.theme ?? {}),
  },
  homeContent: {
    ...base.homeContent,
    ...(incoming.homeContent ?? {}),
    banners: Array.isArray(incoming.homeContent?.banners)
      ? incoming.homeContent.banners.map((banner) => ({
          ...banner,
          active: banner.active ?? true,
        }))
      : base.homeContent.banners,
  },
  adminUsers: Array.isArray(incoming.adminUsers)
    ? appendLocalOnly(incoming.adminUsers, base.adminUsers).map((admin) => ({
        ...admin,
        password:
          admin.password ||
          base.adminUsers.find((item) => item.id === admin.id)?.password ||
          "",
        role: admin.role === "owner" ? "owner" : "colaborador",
      }))
    : base.adminUsers,
  clientUsers: Array.isArray(incoming.clientUsers)
    ? appendLocalOnly(incoming.clientUsers, base.clientUsers).map((client) => ({
        ...client,
        password:
          client.password ||
          base.clientUsers.find((item) => item.id === client.id)?.password ||
          "",
        idNumber: client.idNumber ?? "",
        emailVerified: client.emailVerified ?? true,
        active: client.active ?? true,
      }))
    : base.clientUsers,
  clientContracts: Array.isArray(incoming.clientContracts)
    ? incoming.clientContracts.map((contract) => ({
        ...contract,
        payments: contract.payments ?? [],
        paymentMethods: contract.paymentMethods ?? [],
      }))
    : base.clientContracts,
  propertyFavorites: Array.isArray(incoming.propertyFavorites)
    ? incoming.propertyFavorites
    : base.propertyFavorites,
  leads: Array.isArray(incoming.leads) ? incoming.leads : base.leads,
  leadEvents: Array.isArray(incoming.leadEvents)
    ? incoming.leadEvents
    : base.leadEvents,
  propertyMetrics: Array.isArray(incoming.propertyMetrics)
    ? incoming.propertyMetrics
    : base.propertyMetrics,
  toccoSyncLogs: Array.isArray(incoming.toccoSyncLogs)
    ? incoming.toccoSyncLogs
    : base.toccoSyncLogs,
  agents: Array.isArray(incoming.agents) ? incoming.agents : base.agents,
  filterGroups: Array.isArray(incoming.filterGroups)
    ? incoming.filterGroups
    : base.filterGroups,
  listings: Array.isArray(incoming.listings)
    ? appendLocalOnly(incoming.listings, base.listings).map((listing) => ({
        ...listing,
        currency: listing.currency ?? "ARS",
        createdByAdminId: listing.createdByAdminId,
      }))
    : base.listings,
});
