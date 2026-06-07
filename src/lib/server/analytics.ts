import type { InmoState, LeadStatus } from "@/lib/inmoData";

const leadStatuses: LeadStatus[] = ["nuevo", "visita", "reservado", "cerrado"];

const monthKey = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const buildOperationalMetrics = (state: InmoState) => {
  const statusCounts = state.listings.reduce<Record<string, number>>((acc, listing) => {
    acc[listing.status] = (acc[listing.status] ?? 0) + 1;
    return acc;
  }, {});

  const leadsByStatus = leadStatuses.map((status) => ({
    status,
    count: state.leads.filter((lead) => lead.status === status).length,
  }));

  const leadsByMonth = Object.entries(
    state.leads.reduce<Record<string, number>>((acc, lead) => {
      const key = monthKey(lead.createdAt);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {})
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  const listingsByMonth = Object.entries(
    state.listings.reduce<Record<string, number>>((acc, listing) => {
      const key = monthKey(listing.id.startsWith("id-") ? new Date().toISOString() : "");
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([month, count]) => ({ month, count }));

  const totalLeads = state.leads.length || 1;
  const conversion = {
    visita: Math.round(
      (state.leads.filter((lead) => lead.status === "visita").length / totalLeads) * 100
    ),
    reservado: Math.round(
      (state.leads.filter((lead) => lead.status === "reservado").length / totalLeads) * 100
    ),
    cerrado: Math.round(
      (state.leads.filter((lead) => lead.status === "cerrado").length / totalLeads) * 100
    ),
  };

  const agentPerformance = state.agents.map((agent) => {
    const agentProperties = state.listings.filter((listing) => listing.agentId === agent.id);
    const agentLeads = state.leads.filter((lead) => lead.agentId === agent.id);
    return {
      agentId: agent.id,
      name: agent.name,
      properties: agentProperties.length,
      leads: agentLeads.length,
      closed: agentLeads.filter((lead) => lead.status === "cerrado").length,
      conversion:
        agentLeads.length > 0
          ? Math.round(
              (agentLeads.filter((lead) => lead.status === "cerrado").length /
                agentLeads.length) *
                100
            )
          : 0,
    };
  });

  const topProperties = state.listings
    .map((listing) => {
      const metric = state.propertyMetrics.find((item) => item.propertyId === listing.id);
      return {
        propertyId: listing.id,
        title: listing.title,
        views: metric?.views ?? 0,
        leads:
          metric?.leads ??
          state.leads.filter((lead) => lead.propertyId === listing.id).length,
        favorites:
          metric?.favorites ??
          state.propertyFavorites.filter((favorite) => favorite.propertyId === listing.id)
            .length,
      };
    })
    .sort((a, b) => b.leads + b.favorites + b.views - (a.leads + a.favorites + a.views))
    .slice(0, 8);

  return {
    properties: {
      total: state.listings.length,
      active: statusCounts.disponible ?? 0,
      paused: statusCounts.pausado ?? 0,
      reserved: statusCounts.reservado ?? 0,
      sold: statusCounts.vendido ?? 0,
    },
    leadsByStatus,
    leadsByMonth,
    listingsByMonth,
    conversion,
    agentPerformance,
    topProperties,
  };
};
