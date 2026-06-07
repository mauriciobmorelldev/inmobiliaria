import {
  defaultState,
  STATE_VERSION,
  type InmoState,
} from "./inmoData";

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
    ? incoming.adminUsers.map((admin) => ({
        ...admin,
        role: admin.role === "owner" ? "owner" : "colaborador",
      }))
    : base.adminUsers,
  clientUsers: Array.isArray(incoming.clientUsers)
    ? incoming.clientUsers.map((client) => ({
        ...client,
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
    ? incoming.listings.map((listing) => ({
        ...listing,
        createdByAdminId: listing.createdByAdminId,
      }))
    : base.listings,
});
